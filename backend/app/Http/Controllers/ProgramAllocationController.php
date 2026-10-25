<?php

namespace App\Http\Controllers;

use App\Services\Bp3miScope;
use App\Services\BusinessDataPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProgramAllocationController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $this->authorizeAllocation($request);
        $data = $request->validate([
            'demandId' => ['required', 'string', 'exists:job_demands,id'],
            'programId' => ['required', 'string', 'exists:training_programs,id'],
            'providerId' => ['required', 'string', 'exists:institutions,id'],
            'candidateIds' => ['required', 'array', 'min:1', 'max:1000'],
            'candidateIds.*' => ['required', 'string', 'distinct', 'exists:job_seekers,id'],
            'startDate' => ['required', 'date'],
            'endDate' => ['required', 'date', 'after_or_equal:startDate'],
        ]);

        DB::transaction(function () use ($request, $data): void {
            $program = DB::table('training_programs')->where('id', $data['programId'])->lockForUpdate()->first();
            $institution = DB::table('institutions')->where('id', $data['providerId'])->lockForUpdate()->first();
            $demand = DB::table('job_demands')->where('id', $data['demandId'])->lockForUpdate()->first();
            if (! $program || $program->status !== 'Aktif') {
                throw ValidationException::withMessages(['programId' => 'Program harus aktif dan telah diverifikasi.']);
            }
            if (! $institution || $institution->status !== 'Aktif' || $institution->verification_status !== 'Verified') {
                throw ValidationException::withMessages(['providerId' => 'Lembaga harus aktif dan telah diverifikasi.']);
            }
            if (! $demand || $demand->verification_status !== 'Approved') {
                throw ValidationException::withMessages(['demandId' => 'Demand harus disetujui sebelum alokasi.']);
            }
            $scope = app(Bp3miScope::class);
            abort_unless(
                $scope->allowsProvinceId($request->user(), $institution->province_id)
                && $scope->allowsDemandCountry($request->user(), $demand->country_id),
                403,
            );

            if ($program->institution_id && $program->institution_id !== $institution->id) {
                throw ValidationException::withMessages([
                    'providerId' => 'Lembaga tidak sesuai dengan lembaga yang ditetapkan pada program.',
                ]);
            }
            if ($program->occupation_id !== $demand->occupation_id) {
                throw ValidationException::withMessages([
                    'programId' => 'Jabatan program tidak sesuai dengan jabatan demand.',
                ]);
            }

            $candidates = DB::table('job_seekers')
                ->whereIn('id', $data['candidateIds'])
                ->whereNull('deleted_at')
                ->where('verification_status', 'Verified')
                ->lockForUpdate()
                ->get(['id', 'province_id']);
            if ($candidates->count() !== count($data['candidateIds'])) {
                throw ValidationException::withMessages([
                    'candidateIds' => 'Semua peserta harus aktif dan sudah terverifikasi.',
                ]);
            }
            abort_unless(
                $candidates->every(fn (object $candidate): bool => $scope->allowsProvinceId($request->user(), $candidate->province_id)),
                403,
            );
            $latestRunId = DB::table('matching_runs')
                ->where('job_demand_id', $demand->id)
                ->orderByDesc('created_at')
                ->orderByDesc('run_date')
                ->orderByDesc('id')
                ->value('id');
            $recommendedCandidateCount = $latestRunId
                ? DB::table('candidate_matches')
                    ->where('matching_run_id', $latestRunId)
                    ->where('job_demand_id', $demand->id)
                    ->whereIn('job_seeker_id', $data['candidateIds'])
                    ->where('match_status', 'Rekomendasi')
                    ->distinct()
                    ->count('job_seeker_id')
                : 0;
            if ($recommendedCandidateCount !== count($data['candidateIds'])) {
                throw ValidationException::withMessages([
                    'candidateIds' => 'Pilih hanya peserta yang direkomendasikan pada hasil matching terbaru untuk demand ini.',
                ]);
            }

            $remainingDemand = max(0, (int) $demand->headcount - (int) $demand->filled_quota);
            $remainingProgramQuota = max(0, (int) $program->quota - (int) $program->enrolled_count);
            $readyParticipantLimit = $institution->ready_participant_count ?? $institution->workshop_capacity;
            if (count($data['candidateIds']) > min($remainingDemand, $remainingProgramQuota, (int) $readyParticipantLimit)) {
                throw ValidationException::withMessages([
                    'candidateIds' => 'Jumlah peserta melebihi sisa kuota demand, program, atau jumlah peserta yang siap mengikuti pelatihan.',
                ]);
            }

            $allocationId = 'ALOK-'.now()->format('Y').'-'.Str::upper(Str::random(12));
            $classId = 'CLS-'.Str::upper(Str::random(16));
            $now = now();
            $totalBudget = (float) $program->cost_per_participant * count($data['candidateIds']);

            DB::table('training_classes')->insert([
                'id' => $classId,
                'training_program_id' => $program->id,
                'institution_id' => $institution->id,
                'class_name' => $program->name.' - '.$allocationId,
                'start_date' => $data['startDate'],
                'end_date' => $data['endDate'],
                'capacity' => count($data['candidateIds']),
                'status' => 'Pendaftaran',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            DB::table('program_allocations')->insert([
                'id' => $allocationId,
                'training_class_id' => $classId,
                'job_demand_id' => $demand->id,
                'training_program_id' => $program->id,
                'institution_id' => $institution->id,
                'total_budget' => $totalBudget,
                'start_date' => $data['startDate'],
                'end_date' => $data['endDate'],
                'status' => 'Approved',
                'created_by' => $request->user()->id,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            foreach ($data['candidateIds'] as $candidateId) {
                DB::table('program_allocation_candidates')->insert([
                    'program_allocation_id' => $allocationId,
                    'job_seeker_id' => $candidateId,
                ]);
                DB::table('training_enrollments')->insert([
                    'training_class_id' => $classId,
                    'job_seeker_id' => $candidateId,
                    'enrolled_at' => $now,
                    'status' => 'Aktif',
                    'attendance_percent' => 0,
                ]);
            }
            DB::table('candidate_matches')
                ->where('matching_run_id', $latestRunId)
                ->where('job_demand_id', $demand->id)
                ->whereIn('job_seeker_id', $data['candidateIds'])
                ->where('match_status', 'Rekomendasi')
                ->update([
                    'training_class_id' => $classId,
                    'match_status' => 'Dialokasikan',
                    'updated_at' => $now,
                ]);

            DB::table('training_programs')->where('id', $program->id)->increment('enrolled_count', count($data['candidateIds']));
            DB::table('job_demands')->where('id', $demand->id)->increment('filled_quota', count($data['candidateIds']));
            $this->writeAudit($request, 'ALOKASI_MATCHING', $allocationId, 'Keputusan alokasi batch diterbitkan.');
        });
        app(BusinessDataPresenter::class)->forget($request->user());

        return back()->with('success', 'Keputusan alokasi batch berhasil disimpan.');
    }

    public function updateStatus(Request $request, string $id): RedirectResponse
    {
        $this->authorizeAllocation($request);
        $data = $request->validate([
            'status' => ['required', 'in:Finalized'],
        ]);

        DB::transaction(function () use ($request, $id, $data): void {
            $allocation = DB::table('program_allocations')->where('id', $id)->whereNull('deleted_at')->lockForUpdate()->first();
            abort_unless($allocation, 404);
            $this->assertAllocationScope($request, $allocation);
            abort_unless($allocation->status === 'Approved', 409, 'Hanya alokasi yang disetujui dapat difinalisasi.');

            DB::table('program_allocations')->where('id', $id)->update([
                'status' => $data['status'],
                'updated_at' => now(),
            ]);
            DB::table('training_classes')->where('id', $allocation->training_class_id)->update([
                'status' => 'Sedang Berjalan',
                'updated_at' => now(),
            ]);
            $this->writeAudit($request, 'ALOKASI_MATCHING', $id, 'Status alokasi difinalisasi.');
        });
        app(BusinessDataPresenter::class)->forget($request->user());

        return back()->with('success', 'Alokasi berhasil difinalisasi.');
    }

    public function destroy(Request $request, string $id): RedirectResponse
    {
        $this->authorizeAllocation($request);
        $data = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        DB::transaction(function () use ($request, $id, $data): void {
            $allocation = DB::table('program_allocations')->where('id', $id)->whereNull('deleted_at')->lockForUpdate()->first();
            abort_unless($allocation, 404);
            $this->assertAllocationScope($request, $allocation);
            abort_unless($allocation->status !== 'Finalized', 409, 'Alokasi yang sudah difinalisasi tidak dapat dibatalkan.');

            $candidateCount = DB::table('program_allocation_candidates')
                ->where('program_allocation_id', $id)
                ->count();
            DB::table('program_allocations')->where('id', $id)->update([
                'deleted_at' => now(),
                'updated_at' => now(),
            ]);
            DB::table('training_classes')->where('id', $allocation->training_class_id)->update([
                'status' => 'Dibatalkan',
                'updated_at' => now(),
            ]);
            DB::table('training_enrollments')
                ->where('training_class_id', $allocation->training_class_id)
                ->update(['status' => 'Mengundurkan Diri']);
            DB::table('training_programs')->where('id', $allocation->training_program_id)->decrement('enrolled_count', $candidateCount);
            DB::table('job_demands')->where('id', $allocation->job_demand_id)->decrement('filled_quota', $candidateCount);
            $this->writeAudit($request, 'HAPUS_DATA', $id, $data['reason']);
        });
        app(BusinessDataPresenter::class)->forget($request->user());

        return back()->with('success', 'Alokasi berhasil dibatalkan dan diarsipkan.');
    }

    private function authorizeAllocation(Request $request): void
    {
        abort_unless($request->user()->roles()->value('name') === 'task_force', 403);
    }

    private function assertAllocationScope(Request $request, object $allocation): void
    {
        $scope = app(Bp3miScope::class);
        $institution = DB::table('institutions')->where('id', $allocation->institution_id)->first();
        $demand = DB::table('job_demands')->where('id', $allocation->job_demand_id)->first();
        abort_unless(
            $institution
            && $demand
            && $scope->allowsProvinceId($request->user(), $institution->province_id)
            && $scope->allowsDemandCountry($request->user(), $demand->country_id),
            403,
        );

        $candidateProvinces = DB::table('program_allocation_candidates')
            ->join('job_seekers', 'job_seekers.id', '=', 'program_allocation_candidates.job_seeker_id')
            ->where('program_allocation_candidates.program_allocation_id', $allocation->id)
            ->pluck('job_seekers.province_id');
        abort_unless(
            $candidateProvinces->every(fn (?string $provinceId): bool => $scope->allowsProvinceId($request->user(), $provinceId)),
            403,
        );
    }

    private function writeAudit(Request $request, string $action, string $id, string $reason): void
    {
        $role = $request->user()->roles()->first();
        $entry = [
            'id' => 'AUD-'.Str::upper(Str::random(20)),
            'user_id' => $request->user()->id,
            'actor_name' => $request->user()->name,
            'actor_role' => $role?->title ?? $role?->name ?? 'Task Force',
            'scope' => $request->user()->scope_name,
            'action_type' => $action,
            'entity' => 'program_allocation',
            'entity_id' => $id,
            'justification_reason' => $reason,
            'created_at' => now(),
        ];
        if ($request->ip()) {
            $entry['ip_address'] = $request->ip();
        }
        DB::table('audit_logs')->insert($entry);
    }
}
