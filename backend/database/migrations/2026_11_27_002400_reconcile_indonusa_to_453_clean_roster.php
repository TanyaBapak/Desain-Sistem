<?php

use App\Services\BusinessDataPresenter;
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
        // 1. Buat / pastikan institusi feed SIPPMI terpisah agar tidak menumpuk di Politeknik Indonusa Surakarta
        DB::table('institutions')->updateOrInsert(
            ['id' => 'GRD-SIPPMI'],
            [
                'name' => 'SIPPMI - Portal Feeder PMI',
                'institution_type' => 'LPK',
                'ownership_type' => 'Swasta',
                'province_id' => '33',
                'district_id' => '3372',
                'status' => 'Aktif',
                'verification_status' => 'Verified',
                'evokasi_status' => 'Terverifikasi e-Vokasi',
                'is_priority_partner' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        // 2. Pisahkan 147 data feeder SIPPMI (ID awalan SIPPMI- / external_source=sippmi) ke institusi feed SIPPMI
        DB::table('job_seekers')
            ->where(function ($q) {
                $q->where('id', 'LIKE', 'SIPPMI-%')
                    ->orWhere('external_source', 'sippmi');
            })
            ->update([
                'institution_id' => 'GRD-SIPPMI',
                'institution_name' => 'SIPPMI - Portal Feeder PMI',
                'updated_at' => now(),
            ]);

        // 3. Impor ulang seluruh 453 calon peserta riil Politeknik Indonusa Surakarta dari roster resmi
        try {
            Artisan::call('roster:import-real');
        } catch (\Throwable $e) {
            \Log::warning('Roster import error: ' . $e->getMessage());
        }

        // 4. Update count institusi Politeknik Indonusa Surakarta tepat 453 sesuai data mentah Excel
        DB::table('institutions')
            ->where(function ($q) {
                $q->where('id', 'GRD-INDONUSA')
                    ->orWhere('name', 'LIKE', '%Politeknik Indonusa%');
            })
            ->update([
                'total_active_students' => 453,
                'ready_participant_count' => 453,
                'updated_at' => now(),
            ]);

        // 5. Bersihkan cache data presentasi bisnis
        try {
            app(BusinessDataPresenter::class)->forgetAll();
        } catch (\Throwable) {}
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Non-destruktif
    }
};
