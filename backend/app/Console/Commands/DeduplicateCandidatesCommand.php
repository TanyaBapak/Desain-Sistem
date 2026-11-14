<?php

namespace App\Console\Commands;

use App\Services\BusinessDataPresenter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

class DeduplicateCandidatesCommand extends Command
{
    protected $signature = 'candidates:deduplicate
        {--dry-run : Hanya cek dan tampilkan duplikasi tanpa menghapus}
        {--force   : Jalankan pembersihan langsung tanpa konfirmasi interaktif}';

    protected $description = 'Pindai dan bersihkan seluruh data calon peserta ganda/duplikat di database (berdasarkan NIK identik atau kombinasi Nama & Lembaga identik)';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $force = (bool) $this->option('force');

        $this->info('========================================================================');
        $this->info('   PEMERIKSAAN & PEMBERSIHAN DATA DUPLIKAT CALON PESERTA (ZERO DUPLICATE)');
        $this->info('========================================================================');

        if ($dryRun) {
            $this->warn('Mode: DRY RUN (Hanya simulasi, data tidak akan diubah).');
        }

        $allActive = DB::table('job_seekers')
            ->whereNull('deleted_at')
            ->select(['id', 'nik', 'full_name', 'institution_id', 'institution_name', 'created_at', 'lifecycle_status'])
            ->orderBy('created_at', 'asc')
            ->get();

        $this->info("Total calon peserta aktif diperiksa: " . $allActive->count() . " orang.");

        $seenNiks = [];
        $seenNameInst = [];
        $idsToPurge = [];
        $duplicateDetails = [];

        foreach ($allActive as $c) {
            $nik = trim((string) ($c->nik ?? ''));
            $cleanName = mb_strtolower(trim(preg_replace('/\s+/', ' ', (string) ($c->full_name ?? ''))));
            $cleanInst = mb_strtolower(trim(preg_replace('/\s+/', ' ', (string) ($c->institution_name ?? ''))));

            $isDuplicate = false;
            $reason = '';
            $primaryId = null;

            // 1. Cek NIK ganda (16 digit)
            if ($nik !== '' && preg_match('/^\d{16}$/', $nik)) {
                if (isset($seenNiks[$nik])) {
                    $isDuplicate = true;
                    $primaryId = $seenNiks[$nik];
                    $reason = "NIK ganda ({$nik}) dengan ID {$primaryId}";
                } else {
                    $seenNiks[$nik] = $c->id;
                }
            }

            // 2. Cek Nama + Lembaga ganda
            if (! $isDuplicate && $cleanName !== '' && $cleanInst !== '') {
                $nameInstKey = $cleanName . '::' . $cleanInst;
                if (isset($seenNameInst[$nameInstKey])) {
                    $isDuplicate = true;
                    $primaryId = $seenNameInst[$nameInstKey];
                    $reason = "Nama & Lembaga ganda ({$c->full_name} @ {$c->institution_name}) dengan ID {$primaryId}";
                } else {
                    $seenNameInst[$nameInstKey] = $c->id;
                }
            }

            if ($isDuplicate) {
                $idsToPurge[] = $c->id;
                $duplicateDetails[] = [
                    'id' => $c->id,
                    'name' => $c->full_name,
                    'inst' => $c->institution_name,
                    'nik' => $c->nik,
                    'reason' => $reason,
                    'primaryId' => $primaryId,
                ];
            }
        }

        $dupCount = count($idsToPurge);

        if ($dupCount === 0) {
            $this->info('');
            $this->info('HASIL: TIDAK DITEMUKAN DUPLIKASI DATA.');
            $this->info('Seluruh data calon peserta di database sudah unik dan bersih.');
            return self::SUCCESS;
        }

        $this->warn('');
        $this->warn("DITEMUKAN {$dupCount} DATA DUPLIKAT DI DATABASE:");
        $sampleRows = [];
        foreach (array_slice($duplicateDetails, 0, 15) as $d) {
            $sampleRows[] = [
                $d['id'],
                $d['name'],
                $d['inst'] ?: '-',
                $d['nik'] ?: '-',
                $d['reason'],
            ];
        }
        $this->table(['ID Duplikat', 'Nama Lengkap', 'Lembaga', 'NIK', 'Keterangan'], $sampleRows);

        if ($dupCount > 15) {
            $this->line("... dan " . ($dupCount - 15) . " data duplikat lainnya.");
        }

        if ($dryRun) {
            $this->info('');
            $this->info('Jalankan perintah ini tanpa --dry-run untuk membersihkan duplikat secara otomatis.');
            return self::SUCCESS;
        }

        if (! $force && ! $this->confirm("Apakah Anda ingin membersihkan {$dupCount} data duplikat tersebut sekarang?", true)) {
            $this->info('Operasi dibatalkan.');
            return self::SUCCESS;
        }

        $this->line('');
        $this->info('Sedang membersihkan data duplikat...');

        $chunks = array_chunk($idsToPurge, 100);
        foreach ($chunks as $chunk) {
            DB::transaction(function () use ($chunk) {
                // Hapus relasi pendukung
                DB::table('candidate_matches')->whereIn('job_seeker_id', $chunk)->delete();
                DB::table('program_allocation_candidates')->whereIn('job_seeker_id', $chunk)->delete();
                DB::table('training_enrollments')->whereIn('job_seeker_id', $chunk)->delete();
                DB::table('job_seeker_skills')->whereIn('job_seeker_id', $chunk)->delete();
                DB::table('job_seeker_languages')->whereIn('job_seeker_id', $chunk)->delete();

                // Soft-delete data duplikat
                DB::table('job_seekers')->whereIn('id', $chunk)->update([
                    'deleted_at' => now(),
                    'updated_at' => now(),
                ]);
            });
        }

        // Bersihkan cache presenter
        try {
            app(BusinessDataPresenter::class)->forgetAll();
        } catch (Throwable) {}

        $this->info("BERHASIL! {$dupCount} data duplikat telah dibersihkan dari database.");
        $sisaAktif = DB::table('job_seekers')->whereNull('deleted_at')->count();
        $this->info("Total data calon peserta aktif sekarang: {$sisaAktif} orang (100% unik tanpa duplikasi).");

        return self::SUCCESS;
    }
}

