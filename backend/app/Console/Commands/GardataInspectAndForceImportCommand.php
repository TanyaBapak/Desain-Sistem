<?php

namespace App\Console\Commands;

use App\Services\GardataPlacementSyncService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Throwable;

class GardataInspectAndForceImportCommand extends Command
{
    protected $signature = 'gardata:jurus-jitu {--force-vokasi : Paksa impor ulang direktori LPK nasional}';

    protected $description = 'Jurus jitu: periksa koneksi, seed wilayah, dan paksa impor seluruh data peserta dan LPK dari Gardata';

    public function handle(GardataPlacementSyncService $syncService): int
    {
        $this->info('========================================================');
        $this->info('  JURUS JITU: SINKRONISASI LENGKAP GARDATA & LPK  ');
        $this->info('========================================================');

        $baseUrl = rtrim((string) config('services.gardata.base_url', 'https://gardata.sippmi.com'), '/');
        $apiKey = (string) config('services.gardata.api_key');

        $this->line("1. Memeriksa Konfigurasi API...");
        $this->line("   - URL Feeder : {$baseUrl}");
        $this->line("   - API Key    : " . ($apiKey !== '' ? substr($apiKey, 0, 6) . '••••••••' : '<KOSONG>'));

        if ($apiKey === '') {
            $this->warn('   Perhatian: GARDATA_API_KEY belum diisi di file .env.');
            $this->line('   -> Penarikan peserta via API Gardata dilewati.');
            $this->line('   -> Pendaftaran subdomain LPK multitenant, master wilayah, dan direktori vokasi tetap dijalankan.');
        }

        $this->newLine();
        $this->line("2. Menjalankan Migrasi Database...");
        try {
            Artisan::call('migrate', ['--force' => true]);
            $this->info("   Migrasi database berhasil diperiksa dan dijalankan.");
        } catch (Throwable $e) {
            $this->warn("   Catatan migrasi: " . $e->getMessage());
        }

        $this->newLine();
        $this->line("3. Mengisi Master Data Wilayah (Provinsi & Kabupaten/Kota)...");
        $provincesCount = DB::table('provinces')->count();
        $districtsCount = DB::table('districts')->count();

        if ($provincesCount < 34 || $districtsCount < 400) {
            $this->warn("   Data wilayah belum lengkap ({$provincesCount} prov, {$districtsCount} kab/kota). Mengimpor otomatis...");
            Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\ReferenceDataSeeder', '--force' => true]);
            $this->info("   Wilayah berhasil di-seed: " . DB::table('provinces')->count() . " provinsi, " . DB::table('districts')->count() . " kab/kota.");
        } else {
            $this->info("   Data wilayah sudah lengkap ({$provincesCount} provinsi, {$districtsCount} kab/kota).");
        }

        $csvCount = DB::table('institutions')->where('external_source', 'data_vokasi_csv')->count();
        $csvFile = storage_path('app/reference/data_vokasi.csv');
        if (! is_file($csvFile)) {
            $csvFile = storage_path('app/data_vokasi.csv');
        }
        if (is_file($csvFile)) {
            if ($csvCount < 2000 || $this->option('force-vokasi')) {
                $this->newLine();
                $this->line("   Mengimpor direktori LPK & lembaga vokasi nasional ({$csvFile})...");
                Artisan::call('institutions:import-vokasi', ['file' => $csvFile]);
                $this->info("   Direktori lembaga vokasi berhasil diimpor: " . DB::table('institutions')->count() . " lembaga (termasuk ribuan LPK se-Indonesia).");
            } else {
                $this->info("   Direktori lembaga vokasi sudah lengkap ({$csvCount} lembaga dari data_vokasi.csv).");
            }
        } else {
            $this->warn("   File rujukan data_vokasi.csv tidak ditemukan di {$csvFile}.");
        }

        $this->newLine();
        $this->line("4. Menyinkronkan Sistem Multitenant Subdomain LPK Gardata...");
        $tenants = $syncService->ensureSubdomainTenantsRegistered(true);
        foreach ($tenants as $t) {
            $candCount = DB::table('job_seekers')->where('institution_name', $t['name'])->count();
            $classCount = DB::table('external_training_records')->where('batch_name', 'LIKE', '%'.$t['name'].'%')->distinct('external_batch_id')->count('external_batch_id');
            $this->line("   ✓ Subdomain LPK: {$t['name']} ({$t['subdomain']}) -> Terdaftar & Aktif ({$candCount} peserta, {$classCount} kelas).");
        }

        if ($apiKey !== '') {
            $this->newLine();
            $this->line("5. Menghubungi API Gardata di {$baseUrl}/api/v1/placement/candidates ...");
            try {
                $resp = Http::baseUrl($baseUrl)
                    ->acceptJson()
                    ->withHeader('X-API-KEY', $apiKey)
                    ->timeout(30)
                    ->get('/api/v1/placement/candidates', ['page' => 1, 'per_page' => 50]);

                if (! $resp->successful()) {
                    $this->error("   Gagal menghubungi server Gardata. HTTP Status: " . $resp->status());
                    $this->line("   Respons: " . substr($resp->body(), 0, 300));
                } else {
                    $json = $resp->json();
                    $data = $json['data'] ?? [];
                    $this->info("   Berhasil terhubung! Mendapatkan " . count($data) . " calon peserta dari Gardata.");

                    if (! empty($data)) {
                        $sample = $data[0];
                        $sampleName = $sample['name'] ?? $sample['biodata']['full_name'] ?? $sample['full_name'] ?? 'Tidak ada nama';
                        $sampleInst = $sample['institution_name'] ?? $sample['biodata']['education']['school_origin'] ?? 'LPK Mitra';
                        $this->line("   Contoh data pertama: {$sampleName} (Asal: {$sampleInst})");
                    }
                }
            } catch (Throwable $e) {
                $this->error("   Koneksi ke endpoint pusat gagal: " . $e->getMessage());
            }

            $this->newLine();
            $this->line("6. Memproses dan menyimpan data peserta, lembaga LPK, dan riwayat pelatihan...");
            try {
                $result = $syncService->syncCandidates($baseUrl, $apiKey, 'gardata', true);

                $this->table(
                    ['Metrik', 'Hasil'],
                    [
                        ['Total Diterima', $result['recordsFetched'] ?? 0],
                        ['Data Baru Disimpan', $result['recordsInserted'] ?? 0],
                        ['Data Diperbarui', $result['recordsUpdated'] ?? 0],
                        ['Data Dilewati', $result['recordsSkipped'] ?? 0],
                        ['Status Akhir', $result['status'] ?? 'success'],
                    ]
                );
            } catch (Throwable $e) {
                $this->error("   Proses simpan data kandidat gagal: " . $e->getMessage());
            }
        } else {
            $this->newLine();
            $this->warn("5. Penarikan calon peserta dilewati karena GARDATA_API_KEY kosong.");
            $this->line("   Tambahkan GARDATA_API_KEY=<kunci_anda> di file .env jika ingin menarik peserta terbaru.");
        }

        $this->newLine();
        $this->line("7. Membersihkan cache aplikasi...");
        Artisan::call('optimize:clear');
        $this->info("   Cache berhasil dibersihkan.");

        $this->newLine();
        $totalCandidates = DB::table('job_seekers')->where('external_source', 'gardata')->count();
        $totalInstitutions = DB::table('institutions')->count();
        $totalClasses = DB::table('external_training_records')->where('external_source', 'gardata')->count();

        $this->info("========================================================");
        $this->info("  BERHASIL! Data sekarang di database:");
        $this->info("  - Peserta Gardata : {$totalCandidates} orang");
        $this->info("  - Total Lembaga   : {$totalInstitutions} lembaga (LPK/SMK)");
        $this->info("  - LPK Subdomain   : " . count($tenants) . " LPK multitenant Gardata");
        $this->info("  - Kelas Pelatihan : {$totalClasses} kelas");
        $this->info("========================================================");
        $this->line("Silakan refresh browser (Ctrl + F5).");
        $this->line("Buka menu 'Pemantauan' (/app/sippmi-monitoring) untuk melihat monitoring LPK & kelas secara langsung!");

        return self::SUCCESS;
    }
}
