<?php

use App\Services\BusinessDataPresenter;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Baca data riil 4.854 roster dan 44 riil Kogas
        $rosterPath = database_path('data/real_candidates_roster_clean.json');
        if (! File::exists($rosterPath)) {
            $rosterPath = storage_path('app/reference/real_candidates_roster_clean.json');
        }
        $rosterList = File::exists($rosterPath) ? (json_decode(File::get($rosterPath), true) ?: []) : [];

        $kogasPath = database_path('data/kogas_real_candidates.json');
        $kogasList = File::exists($kogasPath) ? (json_decode(File::get($kogasPath), true) ?: []) : [];

        $allowedCandidateIds = [];

        // Hitung ID valid dari roster 4.854
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

        // Tambahkan ID valid dari 44 peserta riil Kogas
        foreach ($kogasList as $kc) {
            $kid = $kc['id'] ?? ('CAND-' . Str::upper(substr(hash('sha256', ($kc['full_name'] ?? '') . '::CSV-7CPOPTMDGLEZ'), 0, 12)));
            $allowedCandidateIds[$kid] = true;
        }

        // 2. Cari seluruh ID di luar 4.898 peserta riil murni ini
        $allCurrentIds = DB::table('job_seekers')->whereNull('deleted_at')->pluck('id')->all();
        $idsToPurge = [];
        foreach ($allCurrentIds as $id) {
            if (! isset($allowedCandidateIds[$id])) {
                $idsToPurge[] = $id;
            }
        }

        if (! empty($idsToPurge)) {
            Log::info("Pembersihan data dummy/kuota sistem: menghapus " . count($idsToPurge) . " peserta...");

            $chunks = array_chunk($idsToPurge, 250);
            foreach ($chunks as $chunk) {
                DB::transaction(function () use ($chunk) {
                    try {
                        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
                    } catch (\Throwable) {}

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
                    } catch (\Throwable) {}
                });
            }
        }

        // 2.5 Impor ulang seluruh 4.854 calon peserta riil mitra resmi dari file roster
        try {
            Artisan::call('roster:import-real');
        } catch (\Throwable $e) {
            Log::warning('Roster import error: ' . $e->getMessage());
        }

        // 3. Pastikan 44 siswa asli Kogas tersimpan rapi
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

        // 4. Update total_active_students di institutions
        DB::table('institutions')
            ->where('id', 'CSV-7CPOPTMDGLEZ')
            ->update([
                'total_active_students' => 44,
                'ready_participant_count' => 44,
                'updated_at' => now(),
            ]);

        DB::table('institutions')
            ->where(function ($q) {
                $q->where('id', 'GRD-INDONUSA')
                    ->orWhere('name', 'LIKE', '%Politeknik Indonusa%');
            })
            ->update([
                'total_active_students' => 453,
                'ready_participant_count' => 453,
                'updated_at' => now(),
            ]);

        // 5. Bersihkan cache presenter
        try {
            app(BusinessDataPresenter::class)->forgetAll();
        } catch (\Throwable) {}
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Non-destruktif
    }
};

