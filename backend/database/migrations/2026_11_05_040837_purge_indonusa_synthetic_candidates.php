<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Kumpulkan ID peserta sintetis Indonusa
        $syntheticIds = DB::table('job_seekers')
            ->where(function ($query) {
                $query->where('external_id', 'LIKE', 'INDO-CPMI-%')
                    ->orWhere(function ($q) {
                        $q->where('external_source', 'sippmi')
                            ->where('external_id', 'LIKE', 'INDO-%');
                    });
            })
            ->pluck('id')
            ->all();

        if (empty($syntheticIds)) {
            return;
        }

        DB::transaction(function () use ($syntheticIds): void {
            // 1. Hapus approval_histories & approval_requests
            $approvalIds = DB::table('approval_requests')
                ->where('entity_type', 'calon_peserta')
                ->whereIn('entity_id', $syntheticIds)
                ->pluck('id')
                ->all();

            if (! empty($approvalIds)) {
                DB::table('approval_histories')
                    ->whereIn('approval_request_id', $approvalIds)
                    ->delete();

                DB::table('approval_requests')
                    ->whereIn('id', $approvalIds)
                    ->delete();
            }

            // 2. Hapus external_training_records
            DB::table('external_training_records')
                ->whereIn('job_seeker_id', $syntheticIds)
                ->delete();

            // 3. Hapus keahlian (skills)
            DB::table('job_seeker_skills')
                ->whereIn('job_seeker_id', $syntheticIds)
                ->delete();

            // 4. Hapus bahasa (languages)
            DB::table('job_seeker_languages')
                ->whereIn('job_seeker_id', $syntheticIds)
                ->delete();

            // 5. Hapus peserta dari tabel job_seekers
            DB::table('job_seekers')
                ->whereIn('id', $syntheticIds)
                ->delete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Penghapusan data sintetis bersifat permanen dan tidak perlu di-restore
    }
};
