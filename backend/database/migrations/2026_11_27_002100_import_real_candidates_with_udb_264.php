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
        // 1. Jalankan import real roster yang sudah memuat 264 Caregiver UDB (total 4.774 data riil)
        try {
            Artisan::call('roster:import-real');
        } catch (\Throwable $e) {
            // fallback safe execution
        }

        // 2. Pastikan seluruh lembaga yang memiliki siswa riil ditandai sebagai mitra prioritas aktif
        try {
            DB::table('institutions')
                ->whereIn('id', function ($q) {
                    $q->select('institution_id')
                        ->from('job_seekers')
                        ->whereNotNull('institution_id')
                        ->whereNull('deleted_at');
                })
                ->update([
                    'is_priority_partner' => 1,
                    'status' => 'Aktif',
                    'verification_status' => 'Verified',
                    'updated_at' => now(),
                ]);
        } catch (\Throwable $e) {
        }

        // 3. Bersihkan cache business data presenter
        try {
            app(\App\Services\BusinessDataPresenter::class)->forgetAll();
        } catch (\Throwable $e) {
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};

