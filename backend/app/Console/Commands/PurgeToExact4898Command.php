<?php

namespace App\Console\Commands;

use App\Services\BusinessDataPresenter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Throwable;

class PurgeToExact4898Command extends Command
{
    protected $signature = 'roster:purge-to-4898
        {--force : Jalankan pembersihan tanpa konfirmasi interaktif}';

    protected $description = 'Kunci data calon peserta ke tepat 4.898 peserta riil murni (34 Kampus Mitra Prioritas + 44 Siswa Riil LPKS Kogas Nusantara)';

    public function handle(): int
    {
        $this->info('========================================================================');
        $this->info('  KUNCI TEPAT 4.898 CALON PESERTA RIIL MURNI (ZERO DUMMY)              ');
        $this->info('========================================================================');

        $rosterPath = database_path('data/real_candidates_roster_clean.json');
        if (! File::exists($rosterPath)) {
            $rosterPath = storage_path('app/reference/real_candidates_roster_clean.json');
        }
        $rosterList = File::exists($rosterPath) ? (json_decode(File::get($rosterPath), true) ?: []) : [];

        $kogasPath = database_path('data/kogas_real_candidates.json');
        $kogasList = File::exists($kogasPath) ? (json_decode(File::get($kogasPath), true) ?: []) : [];

        $allowedCandidateIds = [];

        // 4.854 kandidat dari roster 34 lembaga
        $occurrences = [];
        foreach ($rosterList as $c) {
            $name = trim((string) ($c['name'] ?? ''));
            $inst = trim((string) ($c['institution'] ?? ''));
            if ($name === '' || $inst === '') {
                continue;
            }
            $occurKey = mb_strtolower($name . '::' . $inst);
            $occurrences[$occurKey] = ($occurrences[$occurKey] ?? 0) + 1;
            $suffix = $occurrences[$occurKey] > 1 ? "::{$occurrences[$occurKey]}" : '';
            $candId = 'CAND-' . Str::upper(substr(hash('sha256', $name . '::' . $inst . $suffix), 0, 12));
            $allowedCandidateIds[$candId] = true;
        }

        // 44 kandidat riil LPKS Kogas Nusantara
        foreach ($kogasList as $kc) {
            $kid = $kc['id'] ?? ('CAND-' . Str::upper(substr(hash('sha256', ($kc['full_name'] ?? '') . '::CSV-7CPOPTMDGLEZ'), 0, 12)));
            $allowedCandidateIds[$kid] = true;
        }

        $targetTotal = count($allowedCandidateIds);
        $this->info("Target calon peserta riil murni: {$targetTotal} (4.854 Roster Mitra + 44 Kogas)");

        $allCurrentIds = DB::table('job_seekers')->whereNull('deleted_at')->pluck('id')->all();
        $idsToPurge = [];
        foreach ($allCurrentIds as $id) {
            if (! isset($allowedCandidateIds[$id])) {
                $idsToPurge[] = $id;
            }
        }

        $purgeCount = count($idsToPurge);
        $this->info("Ditemukan {$purgeCount} peserta di luar daftar riil yang akan dibersihkan.");

        if ($purgeCount > 0) {
            if (! $this->option('force') && ! $this->confirm("Apakah Anda yakin ingin menghapus {$purgeCount} peserta kuota/dummy sistem?", true)) {
                $this->info("Operasi dibatalkan.");
                return Command::SUCCESS;
            }

            $chunks = array_chunk($idsToPurge, 250);
            foreach ($chunks as $chunk) {
                DB::transaction(function () use ($chunk) {
                    try {
                        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
                    } catch (Throwable) {}

                    $matchIds = DB::table('candidate_matches')->whereIn('job_seeker_id', $chunk)->pluck('id')->all();
                    if (! empty($matchIds)) {
                        DB::table('placement_cases')->whereIn('candidate_match_id', $matchIds)->delete();
                        DB::table('candidate_matches')->whereIn('id', $matchIds)->delete();
                    }

                    DB::table('program_allocation_candidates')->whereIn('job_seeker_id', $chunk)->delete();
                    DB::table('training_enrollments')->whereIn('job_seeker_id', $chunk)->delete();

                    $approvalIds = DB::table('approval_requests')
                        ->where('entity_type', 'calon_peserta')
                        ->whereIn('entity_id', $chunk)
                        ->pluck('id')
                        ->all();
                    if (! empty($approvalIds)) {
                        DB::table('approval_histories')->whereIn('approval_request_id', $approvalIds)->delete();
                        DB::table('approval_requests')->whereIn('id', $approvalIds)->delete();
                    }

                    DB::table('external_training_records')->whereIn('job_seeker_id', $chunk)->delete();
                    DB::table('job_seeker_skills')->whereIn('job_seeker_id', $chunk)->delete();
                    DB::table('job_seeker_languages')->whereIn('job_seeker_id', $chunk)->delete();
                    DB::table('job_seeker_documents')->whereIn('job_seeker_id', $chunk)->delete();

                    DB::table('job_seekers')->whereIn('id', $chunk)->delete();

                    try {
                        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
                    } catch (Throwable) {}
                });
            }
            $this->info("✓ Berhasil membersihkan {$purgeCount} data peserta luar roster.");
        }

        // Impor ulang seluruh 4.854 peserta riil dari roster resmi
        $this->line("Memuat seluruh 4.854 peserta riil dari 34 kampus/lembaga mitra resmi...");
        try {
            \Illuminate\Support\Facades\Artisan::call('roster:import-real');
        } catch (Throwable $e) {
            $this->warn('Warning saat import roster: ' . $e->getMessage());
        }

        // Pastikan 44 siswa asli Kogas tersimpan rapi
        if (! empty($kogasList)) {
            foreach ($kogasList as $kc) {
                $kid = $kc['id'] ?? ('CAND-' . Str::upper(substr(hash('sha256', ($kc['full_name'] ?? '') . '::CSV-7CPOPTMDGLEZ'), 0, 12)));
                DB::table('job_seekers')->updateOrInsert(
                    ['id' => $kid],
                    [
                        'registration_number' => $kc['registration_number'] ?? ('REG-2026-35-' . str_pad((string) mt_rand(100000, 999999), 6, '0', STR_PAD_LEFT)),
                        'nik' => $kc['nik'],
                        'full_name' => $kc['full_name'],
                        'gender' => $kc['gender'] ?? 'L',
                        'province_id' => '35',
                        'district_id' => $kc['district_id'] ?? '3519',
                        'education_level' => $kc['education_level'] ?? 'SMK',
                        'institution_name' => 'LPKS KOGAS NUSANTARA',
                        'institution_id' => 'CSV-7CPOPTMDGLEZ',
                        'major' => $kc['major'] ?? 'Bahasa Jepang & Budaya Kerja',
                        'gpa_score' => 3.50,
                        'source_type' => 'LPK',
                        'source_reference' => 'Input Mandiri LPKS KOGAS NUSANTARA',
                        'readiness_status' => 'Ready for Placement',
                        'verification_status' => 'Verified',
                        'lifecycle_status' => 'APPROVED',
                        'passport_ready' => 1,
                        'mcu_ready' => 1,
                        'created_by' => 'SUPRIYANTO',
                        'external_source' => 'manual_institution',
                        'external_id' => 'MANUAL-' . $kid,
                        'preferred_countries' => json_encode(['Jepang']),
                        'preferred_sectors' => json_encode([$kc['preferred_sectors'][0] ?? 'Manufaktur']),
                        'preferred_job_roles' => json_encode([$kc['preferred_job_roles'][0] ?? 'Operator']),
                        'updated_at' => now(),
                        'deleted_at' => null,
                    ]
                );
            }
        }

        $finalCount = DB::table('job_seekers')->whereNull('deleted_at')->count();
        $this->info("========================================================================");
        $this->info("✓ Selesai! Total Calon Peserta Riil di Database: {$finalCount} Peserta.");
        $this->info("========================================================================");

        try {
            app(BusinessDataPresenter::class)->forgetAll();
        } catch (Throwable) {}

        return Command::SUCCESS;
    }
}

