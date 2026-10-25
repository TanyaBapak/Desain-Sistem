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
    protected $signature = 'gardata:jurus-jitu';

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
            $this->error('   Gagal: GARDATA_API_KEY belum diisi di file .env.');
            return self::FAILURE;
        }

        $this->newLine();
        $this->line("2. Mengisi Master Data Wilayah (Provinsi & Kabupaten/Kota)...");
        $provincesCount = DB::table('provinces')->count();
        $districtsCount = DB::table('districts')->count();

        if ($provincesCount < 34 || $districtsCount < 400) {
            $this->warn("   Data wilayah belum lengkap ({$provincesCount} prov, {$districtsCount} kab/kota). Mengimpor otomatis...");
            Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\ReferenceDataSeeder', '--force' => true]);
            $this->info("   Wilayah berhasil di-seed: " . DB::table('provinces')->count() . " provinsi, " . DB::table('districts')->count() . " kab/kota.");
        } else {
            $this->info("   Data wilayah sudah lengkap ({$provincesCount} provinsi, {$districtsCount} kab/kota).");
        }

        $this->newLine();
        $this->line("3. Menghubungi API Gardata di {$baseUrl}/api/v1/placement/candidates ...");
        try {
            $resp = Http::baseUrl($baseUrl)
                ->acceptJson()
                ->withHeader('X-API-KEY', $apiKey)
                ->timeout(30)
                ->get('/api/v1/placement/candidates', ['page' => 1, 'per_page' => 50]);

            if (! $resp->successful()) {
                $this->error("   Gagal menghubungi server Gardata. HTTP Status: " . $resp->status());
                $this->line("   Respons: " . substr($resp->body(), 0, 300));
                return self::FAILURE;
            }

            $json = $resp->json();
            $data = $json['data'] ?? [];
            $this->info("   Berhasil terhubung! Mendapatkan " . count($data) . " calon peserta dari Gardata.");

            if (! empty($data)) {
                $sample = $data[0];
                $sampleName = $sample['name'] ?? $sample['biodata']['full_name'] ?? $sample['full_name'] ?? 'Tidak ada nama';
                $sampleInst = $sample['institution_name'] ?? $sample['biodata']['education']['school_origin'] ?? 'LPK Mitra';
                $this->line("   Contoh data pertama: {$sampleName} (Asal: {$sampleInst})");
            }
        } catch (Throwable $e) {
            $this->error("   Koneksi gagal: " . $e->getMessage());
            return self::FAILURE;
        }

        $this->newLine();
        $this->line("4. Memproses dan menyimpan data peserta, lembaga LPK, dan riwayat pelatihan...");
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
            $this->error("   Proses simpan gagal: " . $e->getMessage());
            return self::FAILURE;
        }

        $this->newLine();
        $this->line("5. Membersihkan cache aplikasi...");
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
        $this->info("  - Kelas Pelatihan : {$totalClasses} kelas");
        $this->info("========================================================");
        $this->line("Silakan refresh halaman browser (Ctrl + F5). Data sudah tampil!");

        return self::SUCCESS;
    }
}
