<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Bersihkan seluruh kandidat non-roster (NULL atau bukan taskforce_roster)
        $nonRosterIds = DB::table('job_seekers')
            ->where(function ($q) {
                $q->whereNull('external_source')
                    ->orWhere('external_source', '!=', 'taskforce_roster');
            })
            ->pluck('id')
            ->all();

        if (! empty($nonRosterIds)) {
            DB::transaction(function () use ($nonRosterIds) {
                try {
                    DB::statement('SET FOREIGN_KEY_CHECKS=0;');
                } catch (Throwable) {}

                $matchIds = DB::table('candidate_matches')->whereIn('job_seeker_id', $nonRosterIds)->pluck('id')->all();
                if (! empty($matchIds)) {
                    DB::table('placement_cases')->whereIn('candidate_match_id', $matchIds)->delete();
                    DB::table('candidate_matches')->whereIn('id', $matchIds)->delete();
                }

                DB::table('program_allocation_candidates')->whereIn('job_seeker_id', $nonRosterIds)->delete();
                DB::table('training_enrollments')->whereIn('job_seeker_id', $nonRosterIds)->delete();

                $approvalIds = DB::table('approval_requests')
                    ->where('entity_type', 'calon_peserta')
                    ->whereIn('entity_id', $nonRosterIds)
                    ->pluck('id')
                    ->all();
                if (! empty($approvalIds)) {
                    DB::table('approval_histories')->whereIn('approval_request_id', $approvalIds)->delete();
                    DB::table('approval_requests')->whereIn('id', $approvalIds)->delete();
                }

                DB::table('external_training_records')->whereIn('job_seeker_id', $nonRosterIds)->delete();
                DB::table('job_seeker_skills')->whereIn('job_seeker_id', $nonRosterIds)->delete();
                DB::table('job_seeker_languages')->whereIn('job_seeker_id', $nonRosterIds)->delete();
                DB::table('job_seeker_documents')->whereIn('job_seeker_id', $nonRosterIds)->delete();

                DB::table('job_seekers')->whereIn('id', $nonRosterIds)->delete();

                try {
                    DB::statement('SET FOREIGN_KEY_CHECKS=1;');
                } catch (Throwable) {}
            });
        }

        // 2. Jalankan ulang import real roster untuk memastikan tepat 4.405 terdaftar
        Artisan::call('roster:import-real', ['--purge-dummy' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
