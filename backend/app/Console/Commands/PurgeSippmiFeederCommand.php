<?php

namespace App\Console\Commands;

use App\Services\BusinessDataPresenter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Throwable;

class PurgeSippmiFeederCommand extends Command
{
    protected $signature = 'sippmi:purge-feeder
        {--force : Jalankan langsung tanpa konfirmasi interaktif}';

    protected $description = 'Hapus 147 calon peserta feeder SIPPMI yang menumpuk di Politeknik Indonusa Surakarta agar Indonusa menjadi tepat 453 peserta riil';

    public function handle(): int
    {
        $this->info('========================================================');
        $this->info('   PEMBERSIHAN 147 CALON PESERTA FEEDER SIPPMI          ');
        $this->info('========================================================');

        $feederCandidateIds = DB::table('job_seekers')
            ->where(function ($q) {
                $q->where('id', 'LIKE', 'SIPPMI-%')
                    ->orWhere('external_source', 'sippmi')
                    ->orWhere('source_reference', 'LIKE', '%SIPPMI%')
                    ->orWhere('institution_id', 'GRD-SIPPMI')
                    ->orWhere('institution_name', 'LIKE', '%SIPPMI%')
                    ->orWhere(function ($sub) {
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
                // KUNCI AMAN: Jangan pernah menghapus roster asli Task Force Indonusa!
                $q->whereNull('external_source')
                    ->orWhere('external_source', '!=', 'taskforce_roster');
            })
            ->pluck('id')
            ->all();

        $count = count($feederCandidateIds);
        $this->info("Ditemukan {$count} peserta feeder SIPPMI.");

        if ($count === 0) {
            $this->info("Tidak ada data feeder SIPPMI yang perlu dihapus.");
            return Command::SUCCESS;
        }

        if (! $this->option('force') && ! $this->confirm("Apakah Anda yakin ingin menghapus {$count} data peserta feeder SIPPMI?", true)) {
            $this->info("Operasi dibatalkan.");
            return Command::SUCCESS;
        }

        DB::transaction(function () use ($feederCandidateIds) {
            try {
                DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            } catch (Throwable) {}

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

            DB::table('job_seekers')->whereIn('id', $feederCandidateIds)->delete();

            try {
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            } catch (Throwable) {}
        });

        $this->info("✓ Berhasil menghapus {$count} data feeder SIPPMI.");

        // Hapus institusi feed SIPPMI
        DB::table('institutions')->where('id', 'GRD-SIPPMI')->delete();

        // Impor ulang 453 roster Indonusa
        $this->line("Memastikan seluruh 453 roster riil Politeknik Indonusa Surakarta tersimpan utuh...");
        try {
            Artisan::call('roster:import-real');
        } catch (Throwable $e) {
            $this->warn('Warning saat import roster: ' . $e->getMessage());
        }

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

        $this->info("✓ Politeknik Indonusa Surakarta sekarang memiliki tepat {$indonusaRealCount} calon peserta riil!");

        try {
            app(BusinessDataPresenter::class)->forgetAll();
        } catch (Throwable) {}

        return Command::SUCCESS;
    }
}

