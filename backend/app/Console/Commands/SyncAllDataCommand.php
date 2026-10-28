<?php

namespace App\Console\Commands;

use App\Services\GardataPlacementSyncService;
use Database\Seeders\AccessControlSeeder;
use Database\Seeders\DemoDataSeeder;
use Database\Seeders\ProgramPlacementTargetSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Throwable;

class SyncAllDataCommand extends Command
{
    protected $signature = 'app:sync-all';

    protected $description = 'Sinkronkan seluruh master data, direktori LPK nasional, kandidat peserta, demand LN, dan alokasi matching';

    public function handle(GardataPlacementSyncService $syncService): int
    {
        $this->info('================================================================');
        $this->info('   MEMULAI SINKRONISASI MENYELURUH PLATFORM SMK GO GLOBAL       ');
        $this->info('================================================================');

        // 1. Migrasi database
        $this->newLine();
        $this->line('1. Memeriksa migrasi struktur database...');
        try {
            Artisan::call('migrate', ['--force' => true]);
            $this->info('   Struktur database mutakhir terverifikasi.');
        } catch (Throwable $e) {
            $this->warn('   Catatan migrasi: ' . $e->getMessage());
        }

        // 2. Master Data Wilayah, Sektor, Jabatan, Negara
        $this->newLine();
        $this->line('2. Menyinkronkan Master Data Wilayah, Sektor, dan Negara...');
        try {
            Artisan::call('db:seed', ['--class' => ReferenceDataSeeder::class, '--force' => true]);
            $provincesCount = DB::table('provinces')->count();
            $districtsCount = DB::table('districts')->count();
            $this->info("   Master wilayah terisi: {$provincesCount} provinsi, {$districtsCount} kabupaten/kota.");
        } catch (Throwable $e) {
            $this->warn('   Catatan seeder wilayah: ' . $e->getMessage());
        }

        // 3. Hak Akses & Peran
        $this->newLine();
        $this->line('3. Menyinkronkan Peran dan Hak Akses Pengguna...');
        try {
            Artisan::call('db:seed', ['--class' => AccessControlSeeder::class, '--force' => true]);
            $this->info('   Peran dan hak akses terkonfigurasi.');
        } catch (Throwable $e) {
            $this->warn('   Catatan seeder akses: ' . $e->getMessage());
        }

        // 4. Target Penempatan Program
        $this->newLine();
        $this->line('4. Menyinkronkan Target Penempatan Program...');
        try {
            Artisan::call('db:seed', ['--class' => ProgramPlacementTargetSeeder::class, '--force' => true]);
            $this->info('   Target penempatan program berhasil diperbarui.');
        } catch (Throwable $e) {
            $this->warn('   Catatan target program: ' . $e->getMessage());
        }

        // 5. Data Program, Demand LN, Alokasi Penempatan
        $this->newLine();
        $this->line('5. Menyinkronkan Program Pelatihan, Demand Luar Negeri & Alokasi...');
        try {
            Artisan::call('db:seed', ['--class' => DemoDataSeeder::class, '--force' => true]);
            $this->info('   Data program pelatihan, demand LN, dan alokasi matching terisi.');
        } catch (Throwable $e) {
            $this->warn('   Catatan program/demand: ' . $e->getMessage());
        }

        // 6. Direktori Lembaga Vokasi / LPK Nasional
        $this->newLine();
        $this->line('6. Mengimpor Direktori LPK & Lembaga Vokasi Nasional...');
        $csvFile = storage_path('app/reference/data_vokasi.csv');
        if (! is_file($csvFile)) {
            $csvFile = storage_path('app/data_vokasi.csv');
        }
        if (is_file($csvFile)) {
            try {
                Artisan::call('institutions:import-vokasi', ['file' => $csvFile]);
                $instCount = DB::table('institutions')->count();
                $this->info("   Direktori lembaga vokasi nasional siap: {$instCount} lembaga/LPK.");
            } catch (Throwable $e) {
                $this->warn('   Catatan impor LPK: ' . $e->getMessage());
            }
        } else {
            $this->warn("   File data_vokasi.csv tidak ditemukan di {$csvFile}.");
        }

        // 7. Sinkronisasi Calon Peserta & Kelas Mitra Terverifikasi
        $this->newLine();
        $this->line('7. Memproses Data Calon Peserta Terverifikasi Mitra LPK...');
        try {
            $syncService->ensureIndonusaCandidates(true);
            $this->info('   - Calon peserta & kelas LPK Indonusa tersinkron.');
        } catch (Throwable $e) {
            $this->warn('   Catatan Indonusa: ' . $e->getMessage());
        }

        try {
            $syncService->ensureOmegaCandidates(true);
            $this->info('   - Calon peserta & kelas LPK Omega Hotel Academy tersinkron.');
        } catch (Throwable $e) {
            $this->warn('   Catatan Omega: ' . $e->getMessage());
        }

        try {
            $syncService->ensureVictoriaCandidates(true);
            $this->info('   - Calon peserta & kelas LPK Victoria Hotel School tersinkron.');
        } catch (Throwable $e) {
            $this->warn('   Catatan Victoria: ' . $e->getMessage());
        }

        // 8. Sinkronisasi API Eksternal bila API Key Tersedia
        $apiKey = (string) config('services.gardata.api_key');
        $baseUrl = rtrim((string) config('services.gardata.base_url', 'https://gardata.sippmi.com'), '/');
        if ($apiKey !== '') {
            $this->newLine();
            $this->line("8. Menghubungi API Pusat Gardata ({$baseUrl})...");
            try {
                $syncResult = $syncService->syncCandidates($baseUrl, $apiKey, 'gardata', true);
                $this->info('   Sinkronisasi API Gardata selesai: ' . ($syncResult['recordsInserted'] ?? 0) . ' data baru disimpan.');
            } catch (Throwable $e) {
                $this->warn('   Catatan koneksi Gardata: ' . $e->getMessage());
            }
        }

        // 9. Bersihkan cache
        $this->newLine();
        $this->line('9. Membersihkan seluruh cache sistem...');
        try {
            Artisan::call('optimize:clear');
            $this->info('   Cache aplikasi dan route telah dibersihkan.');
        } catch (Throwable $e) {
            $this->warn('   Catatan optimize: ' . $e->getMessage());
        }

        // Ringkasan
        $this->newLine();
        $this->info('================================================================');
        $this->info('   SINKRONISASI SELESAI DENGAN SUKSES!                          ');
        $this->info('================================================================');
        $this->line('Ringkasan Data Saat Ini di Database:');
        $this->line(' - Total Calon Peserta : ' . DB::table('job_seekers')->whereNull('deleted_at')->count() . ' orang');
        $this->line(' - Total Lembaga Vokasi: ' . DB::table('institutions')->count() . ' lembaga/LPK');
        $this->line(' - Total Program Latih : ' . DB::table('training_programs')->count() . ' program');
        $this->line(' - Total Demand LN     : ' . DB::table('job_demands')->count() . ' lowongan');
        $this->line(' - Total Alokasi Batch : ' . DB::table('program_allocations')->count() . ' alokasi');
        $this->info('================================================================');

        return self::SUCCESS;
    }
}
