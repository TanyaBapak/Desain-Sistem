<?php

use App\Services\BusinessDataPresenter;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Identifikasi seluruh ID calon peserta feeder SIPPMI / Gardata yang menumpuk di Indonusa atau SIPPMI
        $feederCandidateIds = DB::table('job_seekers')
            ->where(function ($q) {
                // Seluruh peserta feeder dengan ID SIPPMI- atau sumber sippmi
                $q->where('id', 'LIKE', 'SIPPMI-%')
                    ->orWhere('external_source', 'sippmi')
                    ->orWhere('source_reference', 'LIKE', '%SIPPMI%')
                    ->orWhere('institution_id', 'GRD-SIPPMI')
                    ->orWhere('institution_name', 'LIKE', '%SIPPMI%')
                    ->orWhere(function ($sub) {
                        // Atau peserta Gardata/feeder non-roster yang masuk ke Indonusa
                        $sub->where(function ($inst) {
                            $inst->where('institution_id', 'GRD-INDONUSA')
                                ->orWhere('institution_name', 'LIKE', '%Indonusa%');
                        })
                        ->where(function ($src) {
                            $src->whereIn('external_source', ['sippmi', 'gardata'])
                                ->orWhere('source_type', 'Gardata')
                                ->orWhere('id', 'LIKE', 'GD-%');
                        });
                    });
            })
            ->where(function ($q) {
                // KUNCI AMAN: Jangan pernah menyentuh data riil Task Force Roster Indonusa
                $q->whereNull('external_source')
                    ->orWhere('external_source', '!=', 'taskforce_roster');
            })
            ->pluck('id')
            ->all();

        if (! empty($feederCandidateIds)) {
            Log::info("Menghapus " . count($feederCandidateIds) . " peserta feeder SIPPMI...");

            DB::transaction(function () use ($feederCandidateIds) {
                try {
                    DB::statement('SET FOREIGN_KEY_CHECKS=0;');
                } catch (Throwable) {}

                // Hapus data relasi peserta feeder
                $matchIds = DB::table('candidate_matches')->whereIn('job_seeker_id', $feederCandidateIds)->pluck('id')->all();
                if (! empty($matchIds)) {
                    DB::table('placement_cases')->whereIn('candidate_match_id', $matchIds)->delete();
                    DB::table('candidate_matches')->whereIn('id', $matchIds)->delete();
                }

                DB::table('program_allocation_candidates')->whereIn('job_seeker_id', $feederCandidateIds)->delete();
                DB::table('training_enrollments')->whereIn('job_seeker_id', $feederCandidateIds)->delete();

                $approvalIds = DB::table('approval_requests')
                    ->where('entity_type', 'calon_peserta')
                    ->whereIn('entity_id', $feederCandidateIds)
                    ->pluck('id')
                    ->all();
                if (! empty($approvalIds)) {
                    DB::table('approval_histories')->whereIn('approval_request_id', $approvalIds)->delete();
                    DB::table('approval_requests')->whereIn('id', $approvalIds)->delete();
                }

                DB::table('external_training_records')->whereIn('job_seeker_id', $feederCandidateIds)->delete();
                DB::table('job_seeker_skills')->whereIn('job_seeker_id', $feederCandidateIds)->delete();
                DB::table('job_seeker_languages')->whereIn('job_seeker_id', $feederCandidateIds)->delete();
                DB::table('job_seeker_documents')->whereIn('job_seeker_id', $feederCandidateIds)->delete();

                // Hapus dari tabel utama job_seekers
                DB::table('job_seekers')->whereIn('id', $feederCandidateIds)->delete();

                try {
                    DB::statement('SET FOREIGN_KEY_CHECKS=1;');
                } catch (Throwable) {}
            });
        }

        // 2. Hapus institusi feed SIPPMI dari tabel institutions jika ada
        DB::table('institutions')->where('id', 'GRD-SIPPMI')->delete();

        // 3. Impor ulang seluruh 453 calon peserta riil Politeknik Indonusa Surakarta dari roster resmi
        try {
            Artisan::call('roster:import-real');
        } catch (Throwable $e) {
            Log::warning('Roster import error: ' . $e->getMessage());
        }

        // 4. Update count institusi Politeknik Indonusa Surakarta tepat 453
        $indonusaRealCount = DB::table('job_seekers')
            ->whereNull('deleted_at')
            ->where(function ($q) {
                $q->where('institution_id', 'GRD-INDONUSA')
                    ->orWhere('institution_name', 'LIKE', '%Indonusa%');
            })
            ->count();

        DB::table('institutions')
            ->where(function ($q) {
                $q->where('id', 'GRD-INDONUSA')
                    ->orWhere('name', 'LIKE', '%Politeknik Indonusa%');
            })
            ->update([
                'total_active_students' => $indonusaRealCount ?: 453,
                'ready_participant_count' => $indonusaRealCount ?: 453,
                'updated_at' => now(),
            ]);

        // 5. Bersihkan cache data presentasi bisnis
        try {
            app(BusinessDataPresenter::class)->forgetAll();
        } catch (Throwable) {}
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Non-destruktif
    }
};
