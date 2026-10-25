<?php

namespace App\Jobs;

use App\Services\GardataPlacementSyncService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Queue\SerializesModels;

class SyncGardataPlacementData implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public int $timeout = 300;

    public int $uniqueFor = 3600;

    public function uniqueId(): string
    {
        return 'gardata-placement-sync';
    }

    public function middleware(): array
    {
        return [(new WithoutOverlapping('gardata-placement-sync'))->expireAfter(1800)];
    }

    public function handle(GardataPlacementSyncService $syncService): void
    {
        $syncService->syncCandidates();

        $sippmiBase = rtrim((string) config('services.sippmi.base_url', ''), '/');
        $gardataBase = rtrim((string) config('services.gardata.base_url', ''), '/');
        $sippmiKey = (string) (config('services.sippmi.api_key') ?: config('services.gardata.api_key'));

        if ($sippmiBase !== '' && $sippmiBase !== $gardataBase && $sippmiKey !== '') {
            try {
                $syncService->syncSippmi();
            } catch (\Throwable) {
                // Jangan menggagalkan job utama bila endpoint sippmi opsional
            }
        }
    }
}
