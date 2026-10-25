<?php

namespace App\Console\Commands;

use App\Jobs\SyncGardataPlacementData;
use App\Services\GardataPlacementSyncService;
use Illuminate\Console\Command;
use Throwable;

class SyncSippmiPlacementCommand extends Command
{
    protected $signature = 'sippmi:sync {--queue : Kirim proses ke antrean latar belakang} {--force : Impor juga kandidat yang belum diverifikasi admin}';

    protected $description = 'Tarik dan sinkronkan data calon PMI dan riwayat kelas dari feeder sippmi.com';

    public function handle(GardataPlacementSyncService $syncService): int
    {
        $this->info('Memulai sinkronisasi data dari sippmi.com...');

        if ($this->option('queue')) {
            SyncGardataPlacementData::dispatch();
            $this->info('Job sinkronisasi SIPPMI telah dimasukkan ke antrean (queue).');

            return self::SUCCESS;
        }

        try {
            $result = $syncService->syncSippmi(null, null, (bool) $this->option('force'));

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

            $this->info('Sinkronisasi data sippmi.com selesai.');

            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->error('Sinkronisasi sippmi.com gagal: ' . $e->getMessage());

            return self::FAILURE;
        }
    }
}
