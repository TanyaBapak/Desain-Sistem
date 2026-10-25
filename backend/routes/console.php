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
