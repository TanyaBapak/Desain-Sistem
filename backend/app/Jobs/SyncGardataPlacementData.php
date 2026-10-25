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
use Illuminate\Support\Facades\Log;

class SyncGardataPlacementData implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public int $timeout = 300;

    public int $uniqueFor = 60;

    public function __construct(public bool $force = false) {}

    public function uniqueId(): string
    {
        return 'gardata-placement-sync';
    }

    public function middleware(): array
    {
        return [(new WithoutOverlapping('gardata-placement-sync'))->expireAfter(120)];
    }

    public function handle(GardataPlacementSyncService $syncService): void
    {
        $syncService->syncCandidates(null, null, 'gardata', $this->force);

        $sippmiBase = rtrim((string) config('services.sippmi.base_url', ''), '/');
        $gardataBase = rtrim((string) config('services.gardata.base_url', ''), '/');
        $sippmiKey = (string) config('services.sippmi.api_key');

        // SIPPMI is optional and needs its own credentials. The Gardata key must not be
        // reused because sippmi.com rejects it (HTTP 401), which used to mark this job failed.
        if ($sippmiBase === '' || $sippmiKey === '' || $sippmiBase === $gardataBase) {
            return;
        }

        try {
            // SIPPMI stays gated on its own admin verification; the Gardata force flag
            // must not bypass it. Use `php artisan sippmi:sync --force` for explicit overrides.
            $syncService->syncSippmi();
        } catch (\Throwable $exception) {
            Log::warning('Optional SIPPMI synchronization failed; Gardata sync is unaffected.', [
                'message' => $exception->getMessage(),
            ]);
        }
    }
}
