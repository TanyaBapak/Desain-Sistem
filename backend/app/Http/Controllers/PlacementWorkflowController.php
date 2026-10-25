<?php

namespace App\Http\Controllers;

use App\Services\Bp3miScope;
use App\Services\BusinessDataPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PlacementWorkflowController extends Controller
{
    private const STATUSES = [
        'Proses Dokumen',
        'Penerbitan Visa',
        'Medical Checkup 2',
        'Siap Berangkat',
        'Sudah di Negara Tujuan',
    ];

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeTaskForce($request);
        $data = $request->validate([
            'candidateMatchId' => ['required', 'integer', 'exists:candidate_matches,id'],
        ]);

        DB::transaction(function () use ($request, $data): void {
            $match = DB::table('candidate_matches')
                ->join('job_seekers', 'job_seekers.id', '=', 'candidate_matches.job_seeker_id')
                ->where('candidate_matches.id', $data['candidateMatchId'])
                ->where('candidate_matches.match_status', 'Dialokasikan')
                ->whereNotNull('candidate_matches.training_class_id')
                ->whereNull('job_seekers.deleted_at')
                ->lockForUpdate()
                ->first(['candidate_matches.*', 'job_seekers.province_id']);
            abort_unless($match, 404);
            abort_unless(app(Bp3miScope::class)->allowsProvinceId($request->user(), $match->province_id), 403);
            $graduatedInGardata = DB::table('training_class_gardata_mappings')
                ->join('external_training_records', function ($join) {
                    $join->on('external_training_records.external_source', '=', 'training_class_gardata_mappings.external_source')
                        ->on('external_training_records.external_batch_id', '=', 'training_class_gardata_mappings.external_batch_id');
                })
                ->where('training_class_gardata_mappings.training_class_id', $match->training_class_id)
                ->where('external_training_records.job_seeker_id', $match->job_seeker_id)
                ->whereRaw('UPPER(external_training_records.status) = ?', ['GRADUATED'])
                ->exists();
            if (! $graduatedInGardata) {
                throw ValidationException::withMessages([
                    'candidateMatchId' => 'Penempatan hanya dapat diproses setelah data Gardata pada batch yang dipetakan mencatat status GRADUATED.',
                ]);
            }

            $exists = DB::table('placement_cases')
                ->where('candidate_match_id', $match->id)
                ->exists();
            if ($exists) {
                throw ValidationException::withMessages([
                    'candidateMatchId' => 'Peserta ini sudah memiliki proses penempatan.',
                ]);
            }

            DB::table('placement_cases')->insert([
                'id' => 'PLACE-'.now()->format('YmdHis').'-'.Str::upper(Str::random(8)),
                'candidate_match_id' => $match->id,
                'status' => self::STATUSES[0],
                'started_at' => now(),
            ]);
            $this->writeAudit($request, (string) $match->id, 'Proses penempatan lokal dibuat.');
        });
        app(BusinessDataPresenter::class)->forget($request->user());

        return back()->with('success', 'Proses penempatan lokal berhasil dibuat.');
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        $this->authorizeTaskForce($request);
        $data = $request->validate([
            'status' => ['required', Rule::in(self::STATUSES)],
            'visaNumber' => ['nullable', 'string', 'max:100'],
            'flightDate' => ['nullable', 'date'],
        ]);

        DB::transaction(function () use ($request, $id, $data): void {
            $case = DB::table('placement_cases')
                ->join('candidate_matches', 'candidate_matches.id', '=', 'placement_cases.candidate_match_id')
                ->join('job_seekers', 'job_seekers.id', '=', 'candidate_matches.job_seeker_id')
                ->where('placement_cases.id', $id)
                ->lockForUpdate()
                ->first([
                    'placement_cases.*',
                    'candidate_matches.job_seeker_id',
                    'job_seekers.province_id',
                ]);
            abort_unless($case, 404);
            abort_unless(app(Bp3miScope::class)->allowsProvinceId($request->user(), $case->province_id), 403);
            $targetIndex = array_search($data['status'], self::STATUSES, true);
            $currentIndex = array_search($case->status, self::STATUSES, true);
            if ($targetIndex < $currentIndex) {
                throw ValidationException::withMessages(['status' => 'Tahap penempatan tidak dapat dimundurkan.']);
            }
            if ($targetIndex > $currentIndex + 1) {
                throw ValidationException::withMessages(['status' => 'Tahap penempatan harus dijalankan secara berurutan.']);
            }
            if ($targetIndex >= 1 && blank($data['visaNumber'] ?? $case->visa_number)) {
                throw ValidationException::withMessages(['visaNumber' => 'Nomor visa wajib diisi pada tahap penerbitan visa.']);
            }
            if ($targetIndex >= 3 && blank($data['flightDate'] ?? $case->flight_date)) {
                throw ValidationException::withMessages(['flightDate' => 'Tanggal keberangkatan wajib diisi sebelum peserta dinyatakan siap berangkat.']);
            }

            $now = now();
            DB::table('placement_cases')->where('id', $id)->update([
                'status' => $data['status'],
                'visa_number' => $data['visaNumber'] ?? $case->visa_number,
                'flight_date' => $data['flightDate'] ?? $case->flight_date,
                'completed_at' => $data['status'] === self::STATUSES[array_key_last(self::STATUSES)] && $case->completed_at === null
                    ? $now
                    : $case->completed_at,
            ]);
            $this->writeAudit($request, $id, 'Tahap penempatan diperbarui menjadi '.$data['status'].'.');
        });
        app(BusinessDataPresenter::class)->forget($request->user());

        return back()->with('success', 'Progres penempatan berhasil disimpan.');
    }

    private function authorizeTaskForce(Request $request): void
    {
        abort_unless($request->user()->roles()->value('name') === 'task_force', 403);
    }

    private function writeAudit(Request $request, string $entityId, string $reason): void
    {
        $role = $request->user()->roles()->first();
        DB::table('audit_logs')->insert([
            'id' => 'AUD-'.Str::upper(Str::random(20)),
            'user_id' => $request->user()->id,
            'actor_name' => $request->user()->name,
            'actor_role' => $role?->title ?? 'Task Force',
            'scope' => $request->user()->scope_name,
            'action_type' => 'UPDATE_DATA',
            'entity' => 'placement_case',
            'entity_id' => $entityId,
            'justification_reason' => $reason,
            'created_at' => now(),
        ]);
    }
}
