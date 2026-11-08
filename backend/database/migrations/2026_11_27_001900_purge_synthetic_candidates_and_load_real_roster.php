<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Jalankan perintah impor roster riil dan purge dummy
        Artisan::call('roster:import-real', ['--purge-dummy' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Tidak perlu reverse
    }
};
