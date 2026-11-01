<?php

use App\Jobs\SyncGardataPlacementData;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Otomatis sinkronkan pembaruan data kandidat & kelas dari gardata.sippmi.com setiap 15 menit
Schedule::job(new SyncGardataPlacementData)
    ->everyFifteenMinutes()
    ->timezone('Asia/Jakarta')
    ->withoutOverlapping();

// Otomatis backup database setiap hari pukul 02:00 WIB dan hapus arsip backup yang berusia lebih dari 3 hari
Schedule::command('db:backup --days=3')
    ->dailyAt('02:00')
    ->timezone('Asia/Jakarta')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/backup.log'));

