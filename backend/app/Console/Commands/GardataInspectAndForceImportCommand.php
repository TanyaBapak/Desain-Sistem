<?php

namespace App\Console\Commands;

use App\Services\GardataPlacementSyncService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
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

        $this->line('1. Memeriksa Konfigurasi API...');
        $this->line("   - URL Feeder : {$baseUrl}");
        $this->line('   - API Key    : '.($apiKey !== '' ? substr($apiKey, 0, 6).'••••••••' : '<KOSONG>'));

        if ($apiKey === '') {
            $this->warn('   Perhatian: GARDATA_API_KEY belum diisi di file .env.');
            $this->line('   -> Penarikan peserta via API Gardata dilewati.');
            $this->line('   -> Daftar tenant konfigurasi, master wilayah, dan direktori vokasi tetap diperiksa.');
        }

        $this->newLine();
        $this->line('2. Menjalankan Migrasi Database...');
        try {
            Artisan::call('migrate', ['--force' => true]);
            $this->info('   Migrasi database berhasil diperiksa dan dijalankan.');

            // Pastikan semua akun Task Force memiliki penetapan wilayah BP3MI yang valid
            $taskForceRole = DB::table('roles')->where('name', 'task_force')->value('id');
            if ($taskForceRole && Schema::hasTable('model_has_roles')) {
                $tfUserIds = DB::table('model_has_roles')->where('role_id', $taskForceRole)->pluck('model_id');
                $emptyCount = DB::table('users')
                    ->whereIn('id', $tfUserIds)
                    ->where(function ($q) {
                        $q->whereNull('bp3mi_code')->orWhere('bp3mi_code', '');
                    })
                    ->count();

                if ($emptyCount > 0) {
                    DB::table('users')
                        ->whereIn('id', $tfUserIds)
                        ->where(function ($q) {
                            $q->whereNull('bp3mi_code')->orWhere('bp3mi_code', '');
                        })
                        ->update(['bp3mi_code' => 'BP3MI-JABAR']);
                    $this->info("   Menetapkan BP3MI-JABAR pada {$emptyCount} akun Task Force yang belum memiliki wilayah BP3MI.");
                }
            }
        } catch (Throwable $e) {
            $this->warn('   Catatan migrasi: '.$e->getMessage());
        }

        $this->newLine();
        $this->line('3. Mengisi Master Data Wilayah (Provinsi & Kabupaten/Kota)...');
        $provincesCount = DB::table('provinces')->count();
        $districtsCount = DB::table('districts')->count();

        if ($provincesCount < 34 || $districtsCount < 400) {
            $this->warn("   Data wilayah belum lengkap ({$provincesCount} prov, {$districtsCount} kab/kota). Mengimpor otomatis...");
            Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\ReferenceDataSeeder', '--force' => true]);
            $this->info('   Wilayah berhasil di-seed: '.DB::table('provinces')->count().' provinsi, '.DB::table('districts')->count().' kab/kota.');
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
                $this->info('   Direktori lembaga vokasi berhasil diimpor: '.DB::table('institutions')->count().' lembaga (termasuk ribuan LPK se-Indonesia).');
            } else {
                $this->info("   Direktori lembaga vokasi sudah lengkap ({$csvCount} lembaga dari data_vokasi.csv).");
            }
        } else {
            $this->warn("   File rujukan data_vokasi.csv tidak ditemukan di {$csvFile}.");
        }

        $this->newLine();
        $this->line('4. Memeriksa tenant Gardata yang dikonfigurasi...');
        $tenants = GardataPlacementSyncService::KNOWN_SUBDOMAINS;
        foreach ($tenants as $t) {
            $candCount = DB::table('job_seekers')->where('institution_name', $t['name'])->count();
            $classCount = DB::table('external_training_records')->where('batch_name', 'LIKE', '%'.$t['name'].'%')->distinct('external_batch_id')->count('external_batch_id');
            $this->line("   - Tenant konfigurasi: {$t['name']} ({$t['subdomain']}) -> {$candCount} peserta, {$classCount} kelas tersinkron.");
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
                    $this->error('   Gagal menghubungi server Gardata. HTTP Status: '.$resp->status());
                    $this->line('   Respons: '.substr($resp->body(), 0, 300));
                } else {
                    $json = $resp->json();
                    $data = $json['data'] ?? [];
                    $this->info('   Berhasil terhubung! Mendapatkan '.count($data).' calon peserta dari Gardata.');

                    if (! empty($data)) {
                        $sample = $data[0];
                        $sampleName = $sample['name'] ?? $sample['biodata']['full_name'] ?? $sample['full_name'] ?? 'Tidak ada nama';
                        $sampleInst = $sample['institution_name'] ?? $sample['biodata']['education']['school_origin'] ?? 'LPK Mitra';
                        $this->line("   Contoh data pertama: {$sampleName} (Asal: {$sampleInst})");
                    }
                }
            } catch (Throwable $e) {
                $this->error('   Koneksi ke endpoint pusat gagal: '.$e->getMessage());
            }

            $this->newLine();
            $this->line('6. Memproses dan menyimpan data peserta, lembaga LPK, dan riwayat pelatihan...');
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
                $this->error('   Proses simpan data kandidat gagal: '.$e->getMessage());
            }
        } else {
            $this->newLine();
            $this->warn('5. Penarikan calon peserta dilewati karena GARDATA_API_KEY kosong.');
            $this->line('   Tambahkan GARDATA_API_KEY=<kunci_anda> di file .env jika ingin menarik peserta terbaru.');
        }

        $this->newLine();
        $this->line('6. Menyinkronkan direktori dan kandidat institusi vokasi (Victoria, Omega, Indonusa)...');
        try {
            $vicResult = $syncService->ensureVictoriaCandidates(true);
            $this->info("   - LPK Victoria Hotel School: {$vicResult['inserted']} baru, {$vicResult['updated']} diperbarui.");
        } catch (Throwable $e) {
            $this->warn('   - Victoria sync warning: ' . $e->getMessage());
        }
        try {
            $omgResult = $syncService->ensureOmegaCandidates(true);
            $this->info("   - LPK Omega Hotel Academy: {$omgResult['inserted']} baru, {$omgResult['updated']} diperbarui.");
        } catch (Throwable $e) {
            $this->warn('   - Omega sync warning: ' . $e->getMessage());
        }
        try {
            $indoResult = $syncService->ensureIndonusaCandidates(true);
            $this->info("   - Politeknik Indonusa Surakarta: {$indoResult['inserted']} baru, {$indoResult['updated']} diperbarui.");
        } catch (Throwable $e) {
            $this->warn('   - Indonusa sync warning: ' . $e->getMessage());
        }

        // Tautkan akun pengguna lembaga ke institusi resminya dan perbarui scope_level
        $instRole = DB::table('roles')->where('name', 'institution_admin')->value('id');

        // 1. Victoria Hotel School (Arief Prasetya)
        $vicId = $syncService->resolveOrCreateInstitution('LPK Victoria Hotel School', '33', '3372');
        DB::table('users')
            ->where(function ($q) {
                $q->where('name', 'LIKE', '%Arief%')
                    ->orWhere('email', 'LIKE', '%victoria%')
                    ->orWhere('organization', 'LIKE', '%Victoria%')
                    ->orWhere('scope_name', 'LIKE', '%Victoria%');
            })
            ->update([
                'institution_id' => $vicId,
                'organization' => 'LPK Victoria Hotel School',
                'scope_level' => 'lembaga',
                'scope_name' => 'LPK Victoria Hotel School',
            ]);

        // 2. LPK Omega Hotel Academy
        $omgId = $syncService->resolveOrCreateInstitution('LPK Omega Hotel Academy', '33', '3372');
        DB::table('users')
            ->where(function ($q) {
                $q->where('name', 'LIKE', '%Omega%')
                    ->orWhere('email', 'LIKE', '%omega%')
                    ->orWhere('organization', 'LIKE', '%Omega%')
                    ->orWhere('scope_name', 'LIKE', '%Omega%');
            })
            ->update([
                'institution_id' => $omgId,
                'organization' => 'LPK Omega Hotel Academy',
                'scope_level' => 'lembaga',
                'scope_name' => 'LPK Omega Hotel Academy',
            ]);

        // 3. Politeknik Indonusa Surakarta
        $indoId = $syncService->resolveOrCreateInstitution('Politeknik Indonusa Surakarta', '33', '3372');
        DB::table('users')
            ->where(function ($q) {
                $q->where('name', 'LIKE', '%Indonusa%')
                    ->orWhere('email', 'LIKE', '%indonusa%')
                    ->orWhere('organization', 'LIKE', '%Indonusa%')
                    ->orWhere('scope_name', 'LIKE', '%Indonusa%');
            })
            ->update([
                'institution_id' => $indoId,
                'organization' => 'Politeknik Indonusa Surakarta',
                'scope_level' => 'lembaga',
                'scope_name' => 'Politeknik Indonusa Surakarta',
            ]);

        // 4. Institut Kesehatan Rajawali
        $rajawaliId = $syncService->resolveOrCreateInstitution('Institut Kesehatan Rajawali', '32', '3273');
        DB::table('users')
            ->where(function ($q) {
                $q->where('name', 'LIKE', '%Rajawali%')
                    ->orWhere('email', 'LIKE', '%rajawali%')
                    ->orWhere('organization', 'LIKE', '%Rajawali%')
                    ->orWhere('scope_name', 'LIKE', '%Rajawali%');
            })
            ->update([
                'institution_id' => $rajawaliId,
                'organization' => 'Institut Kesehatan Rajawali',
                'scope_level' => 'lembaga',
                'scope_name' => 'Institut Kesehatan Rajawali',
            ]);

        // 5. Otomatis tautkan semua user ber-role vokasi/lembaga ke institusinya
        $vokasiRoleIds = DB::table('roles')
            ->whereIn('name', ['institution_admin', 'training_operator', 'vokasi', 'lembaga_vokasi'])
            ->pluck('id');

        $vokasiUserIds = DB::table('model_has_roles')
            ->whereIn('role_id', $vokasiRoleIds)
            ->pluck('model_id')
            ->unique();

        $allVokasiUsers = DB::table('users')
            ->whereIn('id', $vokasiUserIds)
            ->orWhere('scope_level', 'lembaga')
            ->get();

        foreach ($allVokasiUsers as $u) {
            $orgName = trim((string) ($u->organization ?: $u->scope_name ?: $u->name));
            if (! empty($orgName) && ! in_array(strtolower($orgName), ['nasional', 'nasional terpadu', 'kementerian', 'task force', 'super admin', 'administrator'], true)) {
                $matchedInstId = $syncService->resolveOrCreateInstitution($orgName, $u->province_id ?: '32', $u->district_id ?: '3273');
                DB::table('users')->where('id', $u->id)->update([
                    'institution_id' => $matchedInstId,
                    'organization' => $orgName,
                    'scope_level' => 'lembaga',
                    'scope_name' => $orgName,
                ]);

                // Hubungkan calon pekerja migran yang memiliki nama lembaga serupa
                DB::table('job_seekers')
                    ->where(function ($jq) use ($orgName, $u) {
                        $jq->where('institution_name', 'LIKE', "%{$orgName}%")
                            ->orWhere('created_by', (string) $u->id)
                            ->orWhere('created_by', $u->name);
                    })
                    ->where(function ($jq) {
                        $jq->whereNull('institution_id')->orWhere('institution_id', '');
                    })
                    ->update(['institution_id' => $matchedInstId]);
            }

            if ($instRole) {
                DB::table('model_has_roles')->updateOrInsert(
                    ['model_id' => $u->id, 'model_type' => 'App\Models\User'],
                    ['role_id' => $instRole]
                );
            }
        }

        $this->newLine();
        $this->line('7. Membersihkan cache aplikasi...');
        Artisan::call('optimize:clear');
        $this->info('   Cache berhasil dibersihkan.');

        $this->newLine();
        $totalCandidates = DB::table('job_seekers')->where('external_source', 'gardata')->count();
        $totalInstitutions = DB::table('institutions')->count();
        $totalClasses = DB::table('external_training_records')->where('external_source', 'gardata')->count();

        $this->info('========================================================');
        $this->info('  BERHASIL! Data sekarang di database:');
        $this->info("  - Peserta Gardata : {$totalCandidates} orang");
        $this->info("  - Total Lembaga   : {$totalInstitutions} lembaga (LPK/SMK)");
        $this->info('  - Tenant Gardata  : '.count($tenants).' sumber dikonfigurasi');
        $this->info("  - Kelas Pelatihan : {$totalClasses} kelas");
        $this->info('========================================================');
        $this->line('Silakan refresh browser (Ctrl + F5).');
        $this->line("Buka menu 'Pemantauan' (/app/sippmi-monitoring) untuk melihat monitoring LPK & kelas secara langsung!");

        return self::SUCCESS;
    }
}
