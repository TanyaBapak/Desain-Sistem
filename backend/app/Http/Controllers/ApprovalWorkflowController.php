<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\Bp3miScope;
use App\Services\BusinessDataPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ApprovalWorkflowController extends Controller
{
    public function downloadDocument(Request $request, string $id, int $documentId): StreamedResponse
    {
        abort_unless(
            in_array($request->user()->roles()->value('name'), ['task_force', 'verifier'], true),
            403,
        );

        $approval = DB::table('approval_requests')
            ->where('id', $id)
            ->where('entity_type', 'lembaga_vokasi')
            ->first();
        abort_unless($approval, 404);
        $this->assertTaskForceApprovalScope($request->user(), $approval);

        $document = DB::table('institution_registration_documents')
            ->where('id', $documentId)
            ->where('institution_id', $approval->entity_id)
            ->first();
        abort_unless($document && Storage::disk('local')->exists($document->document_path), 404);

        return Storage::disk('local')->download($document->document_path, $document->original_name);
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        $this->authorizeReviewer($request->user());

        $data = $request->validate([
            'action' => ['required', Rule::in(['approve', 'reject', 'revision'])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
        if ($data['action'] !== 'approve' && trim((string) ($data['notes'] ?? '')) === '') {
            return back()->withErrors(['notes' => 'Alasan penolakan atau catatan revisi wajib diisi.']);
        }

        DB::transaction(fn () => $this->applyDecision($request, $id, $data['action'], (string) ($data['notes'] ?? '')));
        app(BusinessDataPresenter::class)->forgetAll();

        return back()->with('success', 'Keputusan verifikasi berhasil disimpan.');
    }

    public function bulkApprove(Request $request): RedirectResponse
    {
        $this->authorizeReviewer($request->user());
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['required', 'string', 'max:100', 'distinct'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
        $notes = trim((string) ($data['notes'] ?? 'Disetujui melalui persetujuan massal.'));

        DB::transaction(function () use ($request, $data, $notes): void {
            foreach ($data['ids'] as $id) {
                $this->applyDecision($request, $id, 'approve', $notes);
            }
        });
        app(BusinessDataPresenter::class)->forgetAll();

        return back()->with('success', 'Persetujuan massal berhasil disimpan.');
    }

    private function authorizeReviewer(User $user): void
    {
        abort_unless(in_array($user->roles()->value('name'), ['task_force', 'verifier'], true), 403);
    }

    private function applyDecision(Request $request, string $id, string $action, string $notes): void
    {
        $approval = DB::table('approval_requests')->where('id', $id)->lockForUpdate()->first();
        abort_unless($approval, 404);
        abort_unless($approval->status === 'PENDING', 409, 'Usulan ini sudah ditindaklanjuti.');
        $this->assertTaskForceApprovalScope($request->user(), $approval);
        $entityTable = match ($approval->entity_type) {
            'calon_peserta' => 'job_seekers',
            'lembaga_vokasi' => 'institutions',
            'program_pelatihan' => 'training_programs',
            'demand_luar_negeri' => 'job_demands',
        };
        abort_unless(DB::table($entityTable)->where('id', $approval->entity_id)->exists(), 404);

        $role = $request->user()->roles()->first();
        $status = match ($action) {
            'approve' => 'APPROVED',
            'reject' => 'REJECTED',
            'revision' => 'REVISION_REQUESTED',
        };
        $actionType = match ($action) {
            'approve' => 'PERSETUJUAN',
            'reject' => 'PENOLAKAN',
            'revision' => 'REVISI',
        };
        $historyAction = match ($action) {
            'approve' => 'APPROVE',
            'reject' => 'REJECT',
            'revision' => 'REVISE',
        };
        $now = now();

        DB::table('approval_requests')->where('id', $id)->update([
            'status' => $status,
            'reviewed_by' => $request->user()->name,
            'reviewed_at' => $now,
            'rejection_reason' => $action === 'reject' ? $notes : null,
            'revision_notes' => in_array($action, ['revision', 'approve'], true) ? ($notes ?: null) : null,
        ]);

        if ($approval->entity_type === 'lembaga_vokasi' && $action === 'approve') {
            $this->handleLembagaVokasiDuplicate($approval->entity_id, $request->user());
        }

        DB::table('approval_histories')->insert([
            'approval_request_id' => $id,
            'actor_id' => $request->user()->id,
            'actor_name' => $request->user()->name,
            'action' => $historyAction,
            'notes' => $notes ?: null,
            'created_at' => $now,
        ]);

        $this->updateEntityVerification($approval->entity_type, $approval->entity_id, $action);
        if ($approval->entity_type === 'lembaga_vokasi' && $action !== 'revision') {
            DB::table('users')
                ->where('institution_id', $approval->entity_id)
                ->where('status', 'Ditangguhkan')
                ->update([
                    'status' => $action === 'approve' ? 'Aktif' : 'Nonaktif',
                    'updated_at' => $now,
                ]);
        }

        $audit = [
            'id' => 'AUD-'.Str::upper(Str::random(20)),
            'user_id' => $request->user()->id,
            'actor_name' => $request->user()->name,
            'actor_role' => $role?->title ?? $role?->name ?? 'Verifikator',
            'scope' => $request->user()->scope_name,
            'action_type' => $actionType,
            'entity' => $approval->entity_type,
            'entity_id' => $approval->entity_id,
            'field_changed' => 'status',
            'old_value' => 'PENDING',
            'new_value' => $status,
            'justification_reason' => $notes ?: 'Data disetujui setelah pemeriksaan verifikator.',
            'created_at' => $now,
        ];
        if ($request->ip()) {
            $audit['ip_address'] = $request->ip();
        }
        DB::table('audit_logs')->insert($audit);
    }

    private function assertTaskForceApprovalScope(User $user, object $approval): void
    {
        if ($user->roles()->value('name') !== 'task_force') {
            return;
        }

        $scope = app(Bp3miScope::class);
        $isAllowed = match ($approval->entity_type) {
            'calon_peserta' => $scope->allowsProvinceId(
                $user,
                DB::table('job_seekers')->where('id', $approval->entity_id)->value('province_id'),
            ),
            'lembaga_vokasi' => $scope->allowsProvinceId(
                $user,
                DB::table('institutions')->where('id', $approval->entity_id)->value('province_id'),
            ),
            'program_pelatihan' => $scope->allowsProvinceId(
                $user,
                DB::table('institutions')
                    ->join('training_programs', 'training_programs.institution_id', '=', 'institutions.id')
                    ->where('training_programs.id', $approval->entity_id)
                    ->value('institutions.province_id'),
            ),
            'demand_luar_negeri' => $scope->allowsDemandCountry(
                $user,
                DB::table('job_demands')->where('id', $approval->entity_id)->value('country_id'),
            ),
            default => false,
        };

        abort_unless($isAllowed, 403);
    }

    private function updateEntityVerification(string $entityType, string $entityId, string $action): void
    {
        $now = now();
        match ($entityType) {
            'calon_peserta' => DB::table('job_seekers')->where('id', $entityId)->update([
                'verification_status' => match ($action) {
                    'approve' => 'Verified',
                    'reject' => 'Unverified',
                    default => 'Pending Verification',
                },
                'lifecycle_status' => match ($action) {
                    'approve' => 'APPROVED',
                    'reject' => 'REJECTED',
                    default => 'IN_REVIEW',
                },
                'updated_at' => $now,
            ]),
            'lembaga_vokasi' => DB::table('institutions')->where('id', $entityId)->update([
                'verification_status' => match ($action) {
                    'approve' => 'Verified',
                    'reject' => 'Unverified',
                    default => 'Pending Verification',
                },
                'updated_at' => $now,
            ]),
            'demand_luar_negeri' => DB::table('job_demands')->where('id', $entityId)->update([
                'verification_status' => match ($action) {
                    'approve' => 'Approved',
                    'reject' => 'Draft',
                    default => 'Pending',
                },
                'updated_at' => $now,
            ]),
            'program_pelatihan' => DB::table('training_programs')->where('id', $entityId)->update([
                'status' => $action === 'approve' ? 'Aktif' : 'Nonaktif',
                'updated_at' => $now,
            ]),
            default => null,
        };
    }

    private function handleLembagaVokasiDuplicate(string $institutionId, mixed $user): void
    {
        $inst = DB::table('institutions')->where('id', $institutionId)->first([
            'id', 'name', 'province_id', 'district_id', 'npsn_or_vin',
        ]);
        if (! $inst) {
            return;
        }

        $role = $user->roles()->first();
        $now = now();

        // Cari lembaga lain dengan nama sama (case-insensitive) di provinsi/kabupaten yang sama,
        // kecuali yang sedang diapprove.
        $duplicate = DB::table('institutions')
            ->where('id', '!=', $institutionId)
            ->whereRaw('LOWER(name) = ?', [Str::lower((string) $inst->name)])
            ->when($inst->province_id, fn ($q) => $q->where('province_id', $inst->province_id))
            ->when($inst->district_id, fn ($q) => $q->where('district_id', $inst->district_id))
            ->where('status', '!=', 'Nonaktif')
            ->first(['id', 'name', 'province_id', 'district_id']);

        if (! $duplicate) {
            return;
        }

        // Nonaktifkan duplikat lama, sisakan yang baru diapprove.
        DB::table('institutions')->where('id', $duplicate->id)->update([
            'status' => 'Nonaktif',
            'updated_at' => $now,
        ]);

        // Catat audit untuk penanganan duplikasi.
        DB::table('audit_logs')->insert([
            'id' => 'AUD-'.Str::upper(Str::random(20)),
            'user_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $role?->title ?? $role?->name ?? 'Verifikator',
            'scope' => $user->scope_name,
            'action_type' => 'DEDUPLEKASI_LEMBAGA',
            'entity' => 'institutions',
            'entity_id' => $duplicate->id,
            'field_changed' => 'status',
            'old_value' => 'Aktif',
            'new_value' => 'Nonaktif',
            'justification_reason' => 'Duplikasi lembaga vokasi dengan nama "'.$inst->name.'" di wilayah sama. Disaring otomatis saat verifikasi.',
            'ip_address' => request()->ip() ?? '127.0.0.1',
            'created_at' => $now,
        ]);
    }
}
