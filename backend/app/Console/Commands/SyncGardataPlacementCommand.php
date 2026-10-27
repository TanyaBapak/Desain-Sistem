<?php

namespace App\Console\Commands;

use App\Jobs\SyncGardataPlacementData;
use App\Services\GardataPlacementSyncService;
use Illuminate\Console\Command;
use Throwable;

class SyncGardataPlacementCommand extends Command
{
    protected $signature = 'gardata:sync {--queue : Kirim proses ke antrean latar belakang bukannya sinkron langsung} {--force : Paksa simpan semua data calon peserta dari Gardata} {--tenant= : Sinkronkan tenant tertentu (misal: VictoriaHotelSchool)}';

    protected $description = 'Tarik dan sinkronkan data calon PMI dan riwayat kelas dari feeder gardata.sippmi.com';

    public function handle(GardataPlacementSyncService $syncService): int
    {
        $this->info('Memulai sinkronisasi data dari gardata.sippmi.com...');

        $force = (bool) $this->option('force');
        $tenantOption = (string) $this->option('tenant');

        if ($tenantOption !== '') {
            if (stripos($tenantOption, 'victoria') !== false) {
                $this->line('Menyinkronkan khusus tenant Victoria Hotel School (Kota Surakarta)...');
                $vResult = $syncService->ensureVictoriaCandidates(true);
                $this->info("Sinkronisasi Victoria Hotel School selesai ({$vResult['inserted']} baru, {$vResult['updated']} diperbarui).");

                return self::SUCCESS;
            }

            if (stripos($tenantOption, 'omega') !== false) {
                $this->line('Menyinkronkan khusus tenant LPK Omega Hotel Academy (Kabupaten Cilacap)...');
                $oResult = $syncService->ensureOmegaCandidates(true);
                $this->info("Sinkronisasi LPK Omega Hotel Academy selesai ({$oResult['inserted']} baru, {$oResult['updated']} diperbarui).");

                return self::SUCCESS;
            }

            if (stripos($tenantOption, 'indonusa') !== false || stripos($tenantOption, 'sippmi') !== false) {
                $this->line('Menyinkronkan khusus tenant Politeknik Indonusa Surakarta (Kota Surakarta)...');
                $iResult = $syncService->ensureIndonusaCandidates(true);
                $this->info("Sinkronisasi Politeknik Indonusa Surakarta selesai ({$iResult['inserted']} baru, {$iResult['updated']} diperbarui).");

                return self::SUCCESS;
            }
        }

        if ($this->option('queue')) {
            SyncGardataPlacementData::dispatch($force);
            $this->info('Job sinkronisasi Gardata telah dimasukkan ke antrean (queue).');

            return self::SUCCESS;
        }

        try {
            $result = $syncService->syncCandidates(null, null, 'gardata', $force);

            $this->table(
                ['Metrik', 'Jumlah'],
                [
                    ['Total Rekaman Diterima', $result['recordsFetched'] ?? 0],
                    ['Data Baru Disimpan', $result['recordsInserted'] ?? 0],
                    ['Data Diperbarui', $result['recordsUpdated'] ?? 0],
                    ['Data Dilewati / Ambigu', $result['recordsSkipped'] ?? 0],
                    ['Status Sinkronisasi', $result['status'] ?? 'success'],
                ]
            );

            $this->info('Sinkronisasi data Gardata & mitra LPK/Politeknik (Victoria, Omega, Indonusa) selesai.');

            return self::SUCCESS;
        } catch (Throwable $e) {
            $realError = $e->getPrevious() ? $e->getPrevious()->getMessage() : $e->getMessage();
            $this->error('Sinkronisasi Gardata gagal: ' . $realError);

            return self::FAILURE;
        }
    }
}
