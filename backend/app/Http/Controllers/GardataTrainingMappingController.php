<?php

namespace App\Http\Controllers;

use App\Services\Bp3miScope;
use App\Services\BusinessDataPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class GardataTrainingMappingController extends Controller
{
    public function update(Request $request, string $classId): RedirectResponse
    {
        abort_unless($request->user()->roles()->value('name') === 'task_force', 403);
        $data = $request->validate([
            'externalBatchId' => ['required', 'string', 'max:150'],
        ]);

        DB::transaction(function () use ($request, $classId, $data): void {
            $trainingClass = DB::table('training_classes')
                ->join('institutions', 'institutions.id', '=', 'training_classes.institution_id')
                ->where('training_classes.id', $classId)
                ->lockForUpdate()
                ->first(['training_classes.id', 'institutions.province_id']);
            abort_unless($trainingClass, 404);
            abort_unless(
                app(Bp3miScope::class)->allowsProvinceId($request->user(), $trainingClass->province_id),
                403,
            );

            $batchRecords = DB::table('external_training_records')
                ->join('job_seekers', 'job_seekers.id', '=', 'external_training_records.job_seeker_id')
                ->leftJoin('provinces', 'provinces.id', '=', 'job_seekers.province_id')
                ->where('external_training_records.external_source', 'gardata')
                ->where('external_training_records.external_batch_id', $data['externalBatchId'])
                ->whereNull('job_seekers.deleted_at')
                ->whereIn(
                    'external_training_records.job_seeker_id',
                    DB::table('training_enrollments')
                        ->select('job_seeker_id')
                        ->where('training_class_id', $trainingClass->id),
                );
            app(Bp3miScope::class)->applyToJobSeekers($batchRecords, $request->user());
            if (! $batchRecords->exists()) {
                throw ValidationException::withMessages([
                    'externalBatchId' => 'Batch Gardata belum memiliki peserta kelas ini pada area aktif. Segarkan data dan pilih batch yang sesuai.',
                ]);
            }

            $alreadyMapped = DB::table('training_class_gardata_mappings')
                ->where('external_source', 'gardata')
                ->where('external_batch_id', $data['externalBatchId'])
                ->where('training_class_id', '!=', $trainingClass->id)
                ->exists();
            if ($alreadyMapped) {
                throw ValidationException::withMessages([
                    'externalBatchId' => 'Batch Gardata ini sudah dipetakan ke kelas alokasi lain.',
                ]);
            }

            $now = now();
            DB::table('training_class_gardata_mappings')->updateOrInsert(
                ['training_class_id' => $trainingClass->id],
                [
                    'external_source' => 'gardata',
                    'external_batch_id' => $data['externalBatchId'],
                    'mapped_by' => $request->user()->id,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            );
            $this->writeAudit($request, $classId, $data['externalBatchId']);
        });

        app(BusinessDataPresenter::class)->forget($request->user());

        return back()->with('success', 'Kelas alokasi berhasil dipetakan ke batch Gardata.');
    }

    private function writeAudit(Request $request, string $classId, string $batchId): void
    {
        $role = $request->user()->roles()->first();
        DB::table('audit_logs')->insert([
            'id' => 'AUD-'.Str::upper(Str::random(20)),
            'user_id' => $request->user()->id,
            'actor_name' => $request->user()->name,
            'actor_role' => $role?->title ?? 'Task Force',
            'scope' => $request->user()->scope_name,
            'action_type' => 'UPDATE_DATA',
            'entity' => 'training_class_gardata_mapping',
            'entity_id' => $classId,
            'justification_reason' => 'Kelas alokasi dipetakan ke batch Gardata '.$batchId.'.',
            'created_at' => now(),
        ]);
    }
}
