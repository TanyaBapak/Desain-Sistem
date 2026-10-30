<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Hapus data dummy/sintetis yang di-generate secara hardcoded oleh
 * ensureIndonusaCandidates(), ensureOmegaCandidates(), dan ensureVictoriaCandidates().
 *
 * Gunakan perintah ini sebelum menjalankan sinkronisasi dari API riil:
 *   php artisan sippmi:purge-synthetic
 *   php artisan sippmi:sync
 *   php artisan gardata:sync
 */
class PurgeSyntheticCandidatesCommand extends Command
{
    protected $signature = 'sippmi:purge-synthetic
        {--dry-run : Tampilkan rencana hapus tanpa benar-benar menghapus}
        {--force   : Hapus langsung tanpa prompt konfirmasi dan sertakan soft-deleted}
        {--yes     : Konfirmasi otomatis ya}';

    protected $description = 'Hapus semua data peserta dummy/sintetis (external_id: INDO-*, OMEGA-*, VHS-*) agar sinkronisasi API riil dapat berjalan bersih';

    /** Pola external_id yang digunakan generator sintetis */
    private const SYNTHETIC_PREFIXES = [
        'INDO-CPMI-',   // Politeknik Indonusa Surakarta (147 record)
        'OMEGA-CPMI-',  // LPK Omega Hotel Academy
        'VHS-CPMI-',    // LPK Victoria Hotel School
    ];

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $force = (bool) $this->option('force');

        $this->info('================================================');
        $this->info('   PURGE DATA PESERTA SINTETIS / DUMMY          ');
        $this->info('================================================');

        if ($dryRun) {
            $this->warn('Mode: DRY RUN — tidak ada data yang benar-benar dihapus.');
        }

        $totalCandidates = 0;
        $totalTraining = 0;
        $totalSkills = 0;
        $totalLanguages = 0;
        $totalApprovals = 0;

        // 1. Kumpulkan ID peserta sintetis
        $this->line('');
        $this->line('1. Mencari data peserta sintetis...');

        $syntheticIds = [];

        foreach (self::SYNTHETIC_PREFIXES as $prefix) {
            $query = DB::table('job_seekers')
                ->where('external_id', 'LIKE', $prefix.'%');

            if (! $force) {
                $query->whereNull('deleted_at');
            }

            $ids = $query->pluck('id')->all();
            $count = count($ids);

            $this->line("   Prefix '{$prefix}*': {$count} peserta ditemukan.");
            $syntheticIds = array_merge($syntheticIds, $ids);
        }

        // Tambahkan: cari berdasarkan external_source='sippmi' + external_id pola INDO-
        $sippmiExtra = DB::table('job_seekers')
            ->where('external_source', 'sippmi')
            ->where('external_id', 'LIKE', 'INDO-%')
            ->when(! $force, fn ($q) => $q->whereNull('deleted_at'))
            ->pluck('id')->all();

        $syntheticIds = array_values(array_unique(array_merge($syntheticIds, $sippmiExtra)));
        $totalCandidates = count($syntheticIds);

        if ($totalCandidates === 0) {
            $this->info('');
            $this->info('Tidak ada data sintetis yang ditemukan. Database sudah bersih.');

            return self::SUCCESS;
        }

        $this->info("   Total peserta sintetis: {$totalCandidates} orang.");

        // 2. Hitung data relasi yang akan terdampak
        $this->line('');
        $this->line('2. Menghitung data relasi terdampak...');

        $totalTraining = DB::table('external_training_records')
            ->whereIn('job_seeker_id', $syntheticIds)
            ->count();

        $totalSkills = DB::table('job_seeker_skills')
            ->whereIn('job_seeker_id', $syntheticIds)
            ->count();

        $totalLanguages = DB::table('job_seeker_languages')
            ->whereIn('job_seeker_id', $syntheticIds)
            ->count();

        $totalApprovals = DB::table('approval_requests')
            ->where('entity_type', 'calon_peserta')
            ->whereIn('entity_id', $syntheticIds)
            ->count();

        $this->table(
            ['Tabel', 'Jumlah Record'],
            [
                ['job_seekers', $totalCandidates],
                ['external_training_records', $totalTraining],
                ['job_seeker_skills', $totalSkills],
                ['job_seeker_languages', $totalLanguages],
                ['approval_requests', $totalApprovals],
            ]
        );

        // 3. Konfirmasi
        $autoConfirm = $force || (bool) $this->option('yes') || ! $this->input->isInteractive();
        if (! $dryRun && ! $autoConfirm) {
            $this->line('');
            $confirmed = $this->confirm(
                "Hapus {$totalCandidates} peserta sintetis beserta seluruh data relasainya?",
                false
            );

            if (! $confirmed) {
                $this->warn('Dibatalkan. Tidak ada data yang dihapus.');

                return self::SUCCESS;
            }
        }

        if ($dryRun) {
            $this->line('');
            $this->info('[DRY RUN] Data yang AKAN dihapus sudah ditampilkan di atas.');
            $this->info('Jalankan tanpa --dry-run untuk melakukan penghapusan sungguhan.');

            return self::SUCCESS;
        }

        // 4. Hapus data relasi terlebih dahulu, lalu peserta
        $this->line('');
        $this->line('3. Menghapus data sintetis dari database...');

        try {
            DB::transaction(function () use ($syntheticIds): void {
                // Hapus approval histories untuk approval_requests terdampak
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
                    $this->line('   ✓ approval_requests & histories dihapus.');
                }

                // Hapus riwayat pelatihan
                DB::table('external_training_records')
                    ->whereIn('job_seeker_id', $syntheticIds)
                    ->delete();
                $this->line('   ✓ external_training_records dihapus.');

                // Hapus keahlian
                DB::table('job_seeker_skills')
                    ->whereIn('job_seeker_id', $syntheticIds)
                    ->delete();
                $this->line('   ✓ job_seeker_skills dihapus.');

                // Hapus bahasa
                DB::table('job_seeker_languages')
                    ->whereIn('job_seeker_id', $syntheticIds)
                    ->delete();
                $this->line('   ✓ job_seeker_languages dihapus.');

                // Hard delete peserta sintetis (bukan soft delete — memang dummy)
                DB::table('job_seekers')
                    ->whereIn('id', $syntheticIds)
                    ->delete();
                $this->line('   ✓ job_seekers dihapus.');
            });
        } catch (Throwable $e) {
            $this->error('Terjadi kesalahan saat menghapus: '.$e->getMessage());

            return self::FAILURE;
        }

        // 5. Bersihkan sync log SIPPMI (opsional — biar riwayat sinkronisasi bersih)
        try {
            $purgedLogs = DB::table('integration_sync_logs')
                ->whereIn('source', ['sippmi', 'gardata'])
                ->delete();

            if ($purgedLogs > 0) {
                $this->line("   ✓ {$purgedLogs} integration_sync_logs dibersihkan.");
            }
        } catch (Throwable) {
            // Non-critical
        }

        // 6. Invalidate cache
        try {
            app(\App\Services\BusinessDataPresenter::class)->forgetAll();
            $this->line('   ✓ Cache business data dibersihkan.');
        } catch (Throwable) {
            // Non-critical
        }

        $this->line('');
        $this->info('================================================');
        $this->info('   SELESAI — Data sintetis berhasil dihapus!    ');
        $this->info('================================================');
        $this->line('');
        $this->line('Langkah selanjutnya untuk mengisi data riil:');
        $this->line('  php artisan sippmi:sync         → tarik dari API sippmi.com');
        $this->line('  php artisan gardata:sync        → tarik dari API gardata.sippmi.com');
        $this->line('  php artisan gardata:jurus-jitu  → sinkronisasi penuh');
        $this->line('');
        $this->line('Pastikan .env sudah terisi:');
        $this->line('  SIPPMI_BASE_URL=https://sippmi.com');
        $this->line('  SIPPMI_API_KEY=<api-key-anda>');
        $this->line('  GARDATA_BASE_URL=https://gardata.sippmi.com');
        $this->line('  GARDATA_API_KEY=<api-key-anda>');

        return self::SUCCESS;
    }
}
