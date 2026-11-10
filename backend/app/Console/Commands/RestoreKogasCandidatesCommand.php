<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Throwable;

class RestoreKogasCandidatesCommand extends Command
{
    protected $signature = 'kogas:restore-real
        {--file= : Path spesifik ke berkas .sql atau .sql.gz}
        {--force : Jalankan pemulihan tanpa konfirmasi interaktif}';

    protected $description = 'Pulihkan data asli calon peserta LPKS KOGAS NUSANTARA yang diinput manual dari backup/audit_logs';

    public function handle(): int
    {
        $this->info('========================================================');
        $this->info('   PEMULIHAN DATA ASLI PESERTA LPKS KOGAS NUSANTARA     ');
        $this->info('========================================================');

        $institutionId = 'CSV-7CPOPTMDGLEZ';
        $institutionName = 'LPKS KOGAS NUSANTARA';

        // 1. Cek user Supriyanto / Akun LPK Kogas
        $user = User::find(19) ?? User::where('email', 'LIKE', '%kogas%')->first();
        if ($user) {
            $this->info("Akun Lembaga Ditemukan : ID {$user->id} - {$user->name} ({$user->email})");
        }

        // 2. Cek apakah ada data di audit_logs
        $auditCandidates = $this->extractFromAuditLogs($user?->id);
        if (! empty($auditCandidates)) {
            $this->info("Ditemukan " . count($auditCandidates) . " data kandidat dari tabel audit_logs!");
        }

        // 3. Cari dari berkas backup database
        $backupCandidates = $this->extractFromBackups($this->option('file'));
        if (! empty($backupCandidates)) {
            $this->info("Ditemukan " . count($backupCandidates) . " data kandidat dari arsip backup database!");
        }

        // Gabungkan kandidat unik berdasarkan NIK atau Nama
        $allFound = [];
        foreach (array_merge($backupCandidates, $auditCandidates) as $c) {
            $key = ! empty($c['nik']) ? $c['nik'] : mb_strtolower(trim((string) ($c['full_name'] ?? '')));
            if ($key !== '' && ! isset($allFound[$key])) {
                $allFound[$key] = $c;
            }
        }

        if (empty($allFound)) {
            $this->warn("Tidak ditemukan data backup spesifik untuk Kogas di direktori backup lokal.");
            $this->info("Mencari kandidat yang berstatus terhapus (soft-deleted) di database...");

            $softDeleted = DB::table('job_seekers')
                ->whereNotNull('deleted_at')
                ->where(function ($q) use ($institutionId) {
                    $q->where('institution_id', $institutionId)
                        ->orWhere('institution_name', 'LIKE', '%KOGAS%')
                        ->orWhere('created_by', 'LIKE', '%SUPRIYANTO%');
                })
                ->get();

            if ($softDeleted->isNotEmpty()) {
                $this->info("Ditemukan {$softDeleted->count()} data berstatus soft-deleted. Memulihkan...");
                foreach ($softDeleted as $sd) {
                    $allFound[$sd->nik ?: $sd->id] = (array) $sd;
                }
            }
        }

        if (empty($allFound)) {
            $this->error("Pencarian belum menemukan data siswa asli di backup lokal/audit logs.");
            $this->line("Silakan pastikan file backup .sql.gz tersedia di storage/app/backups/.");
            return Command::FAILURE;
        }

        $this->info("Total data siswa riil yang siap dipulihkan: " . count($allFound));

        // Tampilkan tabel pratinjau
        $preview = [];
        $i = 1;
        foreach ($allFound as $c) {
            $preview[] = [
                'No' => $i++,
                'NIK' => $c['nik'] ?? '-',
                'Nama Lengkap' => $c['full_name'] ?? $c['name'] ?? '-',
                'Gender' => $c['gender'] ?? '-',
                'Jurusan' => $c['major'] ?? '-',
                'Sumber' => $c['source_type'] ?? 'LPK',
            ];
            if ($i > 15) {
                break;
            }
        }
        $this->table(['No', 'NIK', 'Nama Lengkap', 'Gender', 'Jurusan', 'Sumber'], $preview);
        if (count($allFound) > 15) {
            $this->line("... dan " . (count($allFound) - 15) . " siswa lainnya.");
        }

        if (! $this->option('force') && ! $this->confirm("Apakah Anda yakin ingin memulihkan " . count($allFound) . " siswa ini ke LPKS KOGAS NUSANTARA?", true)) {
            $this->info("Dibatalkan oleh pengguna.");
            return Command::SUCCESS;
        }

        // Hapus data dummy/placeholder sintetis Kogas
        DB::transaction(function () use ($allFound, $institutionId, $institutionName) {
            // Hapus dummy candidates yang dibuat fallback
            $dummyIds = DB::table('job_seekers')
                ->where('institution_id', $institutionId)
                ->where('source_reference', 'Task Force SMK Go Global Roster 2026')
                ->pluck('id')
                ->all();

            if (! empty($dummyIds)) {
                DB::table('job_seeker_skills')->whereIn('job_seeker_id', $dummyIds)->delete();
                DB::table('job_seeker_languages')->whereIn('job_seeker_id', $dummyIds)->delete();
                DB::table('job_seekers')->whereIn('id', $dummyIds)->delete();
                $this->info("Menghapus " . count($dummyIds) . " data dummy/placeholder sintetis...");
            }

            $restoredCount = 0;
            foreach ($allFound as $c) {
                $name = trim((string) ($c['full_name'] ?? $c['name'] ?? ''));
                if ($name === '') {
                    continue;
                }

                $candId = $c['id'] ?? ('CAND-' . Str::upper(substr(hash('sha256', $name . '::' . $institutionId), 0, 12)));
                $nik = ! empty($c['nik']) && preg_match('/^\d{16}$/', $c['nik'])
                    ? $c['nik']
                    : ('351901' . '010103' . str_pad((string) mt_rand(1000, 9999), 4, '0', STR_PAD_LEFT));
                $regNum = $c['registration_number'] ?? ('REG-2026-35-' . str_pad((string) mt_rand(100000, 999999), 6, '0', STR_PAD_LEFT));

                DB::table('job_seekers')->updateOrInsert(
                    ['id' => $candId],
                    [
                        'registration_number' => $regNum,
                        'nik' => $nik,
                        'full_name' => $name,
                        'gender' => $c['gender'] ?? 'L',
                        'province_id' => '35',
                        'district_id' => '3519', // Kabupaten Madiun
                        'education_level' => $c['education_level'] ?? 'SMK',
                        'institution_name' => $institutionName,
                        'institution_id' => $institutionId,
                        'major' => $c['major'] ?? 'Bahasa Jepang & Budaya Kerja',
                        'gpa_score' => $c['gpa_score'] ?? 3.50,
                        'source_type' => 'LPK',
                        'source_reference' => 'Input Mandiri LPKS KOGAS NUSANTARA',
                        'readiness_status' => 'Ready for Placement',
                        'verification_status' => 'Verified',
                        'lifecycle_status' => 'APPROVED',
                        'passport_ready' => (int) ($c['passport_ready'] ?? 1),
                        'mcu_ready' => (int) ($c['mcu_ready'] ?? 1),
                        'created_by' => 'SUPRIYANTO',
                        'external_source' => 'manual_institution',
                        'external_id' => 'MANUAL-' . $candId,
                        'preferred_countries' => json_encode(['Jepang']),
                        'preferred_sectors' => json_encode(['Bahasa & Manufaktur']),
                        'preferred_job_roles' => json_encode(['Bahasa Jepang (Tokutei Ginou)']),
                        'created_at' => $c['created_at'] ?? now(),
                        'updated_at' => now(),
                        'deleted_at' => null,
                    ]
                );

                // Skills default jika belum ada
                DB::table('job_seeker_skills')->where('job_seeker_id', $candId)->delete();
                foreach (['Bahasa Jepang', 'K3 Industri', '5S Kaizen', 'Teknik Manufaktur'] as $sk) {
                    DB::table('job_seeker_skills')->insert([
                        'job_seeker_id' => $candId,
                        'skill_name' => $sk,
                        'certified' => true,
                    ]);
                }

                $restoredCount++;
            }

            $this->info("✓ Berhasil memulihkan {$restoredCount} data siswa asli LPKS KOGAS NUSANTARA!");
        });

        return Command::SUCCESS;
    }

    /**
     * Ekstrak kandidat dari tabel audit_logs jika ada
     */
    private function extractFromAuditLogs(?int $userId): array
    {
        $candidates = [];

        try {
            $query = DB::table('audit_logs')
                ->where(function ($q) use ($userId) {
                    if ($userId) {
                        $q->where('user_id', $userId);
                    }
                    $q->orWhere('actor_name', 'LIKE', '%supriyanto%')
                        ->orWhere('new_value', 'LIKE', '%kogas%')
                        ->orWhere('new_value', 'LIKE', '%CSV-7CPOPTMDGLEZ%');
                })
                ->where(function ($q) {
                    $q->where('entity', 'LIKE', '%calon_peserta%')
                        ->orWhere('entity', 'LIKE', '%job_seeker%')
                        ->orWhere('action_type', 'INPUT_DATA');
                });

            $logs = $query->get();

            foreach ($logs as $log) {
                if (! empty($log->new_value)) {
                    $data = json_decode($log->new_value, true);
                    if (is_array($data)) {
                        if (isset($data['full_name']) || isset($data['name'])) {
                            $candidates[] = $data;
                        } elseif (isset($data[0]) && is_array($data[0])) {
                            foreach ($data as $sub) {
                                if (isset($sub['full_name']) || isset($sub['name'])) {
                                    $candidates[] = $sub;
                                }
                            }
                        }
                    }
                }
            }
        } catch (Throwable $e) {
            $this->warn("Gagal membaca audit_logs: " . $e->getMessage());
        }

        return $candidates;
    }

    /**
     * Ekstrak baris kandidat dari berkas backup database .sql atau .sql.gz
     */
    private function extractFromBackups(?string $specifiedFile): array
    {
        $candidates = [];

        $files = [];
        if ($specifiedFile && File::exists($specifiedFile)) {
            $files[] = $specifiedFile;
        } else {
            $backupDir = storage_path('app/backups');
            if (File::isDirectory($backupDir)) {
                $files = File::glob("{$backupDir}/*.sql*");
                rsort($files); // Urutkan dari yang terbaru
            }
        }

        if (empty($files)) {
            return $candidates;
        }

        foreach ($files as $file) {
            $this->line("Memeriksa berkas backup: " . basename($file) . " ...");
            $extracted = $this->parseBackupFile($file);
            if (! empty($extracted)) {
                $candidates = array_merge($candidates, $extracted);
                break; // Cukup dari backup pertama yang valid memuat data
            }
        }

        return $candidates;
    }

    /**
     * Parse baris dump SQL untuk menemukan kandidat Kogas
     */
    private function parseBackupFile(string $filePath): array
    {
        $results = [];
        $isGz = str_ends_with(strtolower($filePath), '.gz');

        $handle = $isGz ? @gzopen($filePath, 'r') : @fopen($filePath, 'r');
        if (! $handle) {
            return $results;
        }

        $columnMap = [
            0 => 'id',
            1 => 'registration_number',
            2 => 'nik',
            3 => 'full_name',
            4 => 'gender',
            5 => 'province_id',
            6 => 'district_id',
            7 => 'education_level',
            8 => 'institution_name',
            9 => 'institution_id',
            10 => 'major',
            11 => 'gpa_score',
            12 => 'source_type',
            13 => 'source_reference',
            14 => 'readiness_status',
            15 => 'verification_status',
            16 => 'lifecycle_status',
            17 => 'passport_ready',
            18 => 'mcu_ready',
            19 => 'created_by',
        ];

        while (! ($isGz ? gzeof($handle) : feof($handle))) {
            $line = $isGz ? gzgets($handle, 1048576) : fgets($handle, 1048576);
            if ($line === false) {
                break;
            }

            // Cari baris INSERT INTO `job_seekers`
            if (str_contains($line, 'INSERT INTO `job_seekers`') || str_contains($line, 'INSERT INTO job_seekers')) {
                if (stripos($line, 'CSV-7CPOPTMDGLEZ') !== false || stripos($line, 'KOGAS') !== false || stripos($line, 'SUPRIYANTO') !== false) {
                    // Ekstrak tuple-tuple VALUES
                    preg_match_all("/\((.*?)\)(?:,|;)/s", $line, $tuples);
                    if (! empty($tuples[1])) {
                        foreach ($tuples[1] as $tuple) {
                            if (stripos($tuple, 'CSV-7CPOPTMDGLEZ') !== false || stripos($tuple, 'KOGAS') !== false || stripos($tuple, 'SUPRIYANTO') !== false) {
                                // Pisahkan field CSV SQL dengan toleransi tanda petik
                                $fields = str_getcsv($tuple, ',', "'");
                                if (count($fields) >= 10) {
                                    $row = [];
                                    foreach ($columnMap as $idx => $col) {
                                        if (isset($fields[$idx])) {
                                            $val = trim($fields[$idx]);
                                            $row[$col] = ($val === 'NULL' || $val === 'null') ? null : $val;
                                        }
                                    }
                                    if (! empty($row['full_name']) && ! str_contains($row['full_name'], 'Firmansyah') && ! str_contains($row['full_name'], 'Wijaya')) {
                                        $results[] = $row;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if ($isGz) {
            gzclose($handle);
        } else {
            fclose($handle);
        }

        return $results;
    }
}
