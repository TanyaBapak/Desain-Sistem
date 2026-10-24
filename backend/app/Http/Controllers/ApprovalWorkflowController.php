<?php

namespace App\Http\Controllers;

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

        $document = DB::table('institution_registration_documents')
            ->where('id', $documentId)
            ->where('institution_id', $approval->entity_id)
            ->first();
        abort_unless($document && Storage::disk('local')->exists($document->document_path), 404);

        return Storage::disk('local')->download($document->document_path, $document->original_name);
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        abort_unless(
            in_array($request->user()->roles()->value('name'), ['task_force', 'verifier'], true),
            403,
        );

        $data = $request->validate([
            'action' => ['required', Rule::in(['approve', 'reject', 'revision'])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
        if ($data['action'] !== 'approve' && trim((string) ($data['notes'] ?? '')) === '') {
            return back()->withErrors(['notes' => 'Alasan penolakan atau catatan revisi wajib diisi.']);
        }

        DB::transaction(function () use ($request, $id, $data): void {
            $approval = DB::table('approval_requests')->where('id', $id)->lockForUpdate()->first();
            abort_unless($approval, 404);
            abort_unless($approval->status === 'PENDING', 409, 'Usulan ini sudah ditindaklanjuti.');
            $entityTable = match ($approval->entity_type) {
                'calon_peserta' => 'job_seekers',
                'lembaga_vokasi' => 'institutions',
                'program_pelatihan' => 'training_programs',
                'demand_luar_negeri' => 'job_demands',
            };
            abort_unless(DB::table($entityTable)->where('id', $approval->entity_id)->exists(), 404);

            $role = $request->user()->roles()->first();
            $notes = trim((string) ($data['notes'] ?? ''));
            $status = match ($data['action']) {
                'approve' => 'APPROVED',
                'reject' => 'REJECTED',
                'revision' => 'REVISION_REQUESTED',
            };
            $actionType = match ($data['action']) {
                'approve' => 'PERSETUJUAN',
                'reject' => 'PENOLAKAN',
                'revision' => 'REVISI',
            };
            $historyAction = match ($data['action']) {
                'approve' => 'APPROVE',
                'reject' => 'REJECT',
                'revision' => 'REVISE',
            };
            $now = now();

            DB::table('approval_requests')->where('id', $id)->update([
                'status' => $status,
                'reviewed_by' => $request->user()->name,
                'reviewed_at' => $now,
                'rejection_reason' => $data['action'] === 'reject' ? $notes : null,
                'revision_notes' => in_array($data['action'], ['revision', 'approve'], true) ? ($notes ?: null) : null,
            ]);

            DB::table('approval_histories')->insert([
                'approval_request_id' => $id,
                'actor_id' => $request->user()->id,
                'actor_name' => $request->user()->name,
                'action' => $historyAction,
                'notes' => $notes ?: null,
                'created_at' => $now,
            ]);

            $this->updateEntityVerification($approval->entity_type, $approval->entity_id, $data['action']);
            if ($approval->entity_type === 'lembaga_vokasi' && $data['action'] !== 'revision') {
                DB::table('users')
                    ->where('institution_id', $approval->entity_id)
                    ->where('status', 'Ditangguhkan')
                    ->update([
                        'status' => $data['action'] === 'approve' ? 'Aktif' : 'Nonaktif',
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
        });

        return back()->with('success', 'Keputusan verifikasi berhasil disimpan.');
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
}
