<?php

use App\Jobs\SyncGardataPlacementData;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Auto-sync feeder eksternal dinonaktifkan permanen sesuai kebijakan data riil p2mi.sippmi.com
// if ((bool) config('services.gardata.auto_sync_enabled', false)) {
//     Schedule::job(new SyncGardataPlacementData)
//         ->everyFifteenMinutes()
//         ->timezone('Asia/Jakarta')
//         ->withoutOverlapping();
// }

// Otomatis backup database setiap hari pukul 02:00 WIB dan hapus arsip backup yang berusia lebih dari 3 hari
Schedule::command('db:backup --days=3')
    ->dailyAt('02:00')
    ->timezone('Asia/Jakarta')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/backup.log'));

