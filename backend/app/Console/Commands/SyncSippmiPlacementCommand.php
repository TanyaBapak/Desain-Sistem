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
        $this->warn('Sinkronisasi data feeder luar dari sippmi.com telah DINONAKTIFKAN permanen.');
        $this->info('Sistem hanya menerima pendaftar resmi yang mendaftar langsung melalui lembaga/portal p2mi.sippmi.com.');

        return self::SUCCESS;
    }
}
