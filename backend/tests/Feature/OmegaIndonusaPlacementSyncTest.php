<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\BusinessDataPresenter;
use App\Services\GardataPlacementSyncService;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class OmegaIndonusaPlacementSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\ReferenceDataSeeder::class);
        $this->seed(\Database\Seeders\AccessControlSeeder::class);
    }

    public function test_ensure_omega_candidates_creates_candidates_and_scopes_for_eko(): void
    {
        $syncService = app(GardataPlacementSyncService::class);
        $result = $syncService->ensureOmegaCandidates(true);

        $this->assertSame(10, $result['inserted']);
        $this->assertSame(10, DB::table('job_seekers')->where('institution_name', 'LPK Omega Hotel Academy')->count());

        $ekoUser = User::query()->where('email', 'ekopriyono@omegahotelacademy.sippmi.com')->first();
        $this->assertNotNull($ekoUser);
        $this->assertSame('Eko Priyono Prasetyo', $ekoUser->name);

        $presenter = app(BusinessDataPresenter::class);
        $scope = $presenter->resolveInstitutionScope($ekoUser);

        $this->assertTrue($scope['isOmega']);
        $this->assertFalse($scope['isVictoria']);
        $this->assertContains('Omega', $scope['patterns']);

        $data = $presenter->make($ekoUser);
        $this->assertGreaterThanOrEqual(10, count($data['candidates']));
        foreach ($data['candidates'] as $candidate) {
            $this->assertSame('LPK Omega Hotel Academy', $candidate['institutionName']);
        }
    }

    public function test_ensure_indonusa_candidates_creates_candidates_and_scopes_for_suci(): void
    {
        $syncService = app(GardataPlacementSyncService::class);
        $result = $syncService->ensureIndonusaCandidates(true);

        $this->assertSame(50, $result['inserted']);
        $this->assertSame(50, DB::table('job_seekers')->where('institution_name', 'Politeknik Indonusa Surakarta')->count());

        // Pastikan kelas manufaktur dan waiter tersinkronkan
        $this->assertGreaterThanOrEqual(10, DB::table('external_training_records')
            ->where('external_source', 'sippmi')
            ->where('class_code', 'INDO-MFG-2026')
            ->count());
        $this->assertGreaterThanOrEqual(10, DB::table('external_training_records')
            ->where('external_source', 'sippmi')
            ->where('class_code', 'INDO-WAIT-2026')
            ->count());

        $suciUser = User::query()->where('email', 'sucipurwandari@sippmi.co')->first();
        $this->assertNotNull($suciUser);
        $this->assertSame('Ir. Suci Purwandari, M.M, Ph.D', $suciUser->name);

        $presenter = app(BusinessDataPresenter::class);
        $scope = $presenter->resolveInstitutionScope($suciUser);

        $this->assertTrue($scope['isIndonusa']);
        $this->assertFalse($scope['isVictoria']);
        $this->assertContains('Politeknik Indonusa Surakarta', $scope['patterns']);

        $data = $presenter->make($suciUser);
        $this->assertGreaterThanOrEqual(50, count($data['candidates']));
        foreach ($data['candidates'] as $candidate) {
            $this->assertSame('Politeknik Indonusa Surakarta', $candidate['institutionName']);
        }
    }

    public function test_artisan_gardata_sync_supports_omega_and_indonusa_tenants(): void
    {
        $this->artisan('gardata:sync', ['--tenant' => 'Omega', '--force' => true])
            ->assertSuccessful();

        $this->assertSame(10, DB::table('job_seekers')->where('institution_name', 'LPK Omega Hotel Academy')->count());

        $this->artisan('gardata:sync', ['--tenant' => 'Indonusa', '--force' => true])
            ->assertSuccessful();

        $this->assertSame(50, DB::table('job_seekers')->where('institution_name', 'Politeknik Indonusa Surakarta')->count());
    }

    public function test_monitoring_presents_all_subdomain_candidates_without_bp3mi_truncation(): void
    {
        $syncService = app(GardataPlacementSyncService::class);
        $syncService->ensureOmegaCandidates(true);
        $syncService->ensureIndonusaCandidates(true);

        // Simulasi user Task Force dengan lingkup aktif BP3MI Jawa Timur (province_id = '35')
        $taskForceUser = User::query()->where('email', 'contoh@kemnaker.go.id')->first();
        if (! $taskForceUser) {
            $taskForceUser = User::factory()->create([
                'email' => 'contoh@kemnaker.go.id',
                'name' => 'Admin Task Force Nasional',
                'province_id' => '35',
            ]);
            $roleId = DB::table('roles')->where('name', 'task_force')->value('id');
            if ($roleId) {
                $taskForceUser->roles()->attach($roleId);
            }
        } else {
            $taskForceUser->update(['province_id' => '35']);
        }

        $presenter = app(BusinessDataPresenter::class);

        // Semua Subdomain harus menampilkan seluruh peserta gabungan tanpa terpotong filter domisili
        $allData = $presenter->make($taskForceUser, ['tab' => 'sippmi-monitoring', 'candidateSource' => 'all']);
        $this->assertGreaterThanOrEqual(60, $allData['monitoring']['candidatePagination']['total']);

        // Filter Politeknik Indonusa Surakarta (sippmi.com) harus menampilkan seluruh 50 siswa
        $indonusaData = $presenter->make($taskForceUser, ['tab' => 'sippmi-monitoring', 'candidateSource' => 'sippmi.com', 'candidatePerPage' => 50]);
        $this->assertSame(50, $indonusaData['monitoring']['candidatePagination']['total']);
        $this->assertSame(50, count($indonusaData['monitoring']['candidates']));
        foreach ($indonusaData['monitoring']['candidates'] as $candidate) {
            $this->assertSame('Politeknik Indonusa Surakarta', $candidate['institutionName']);
            $this->assertSame('sippmi.com', $candidate['subdomain']);
        }

        // Filter LPK Omega Hotel Academy harus menampilkan seluruh 10 siswa
        $omegaData = $presenter->make($taskForceUser, ['tab' => 'sippmi-monitoring', 'candidateSource' => 'omegahotelacademy.sippmi.com']);
        $this->assertSame(10, $omegaData['monitoring']['candidatePagination']['total']);
        $this->assertSame(10, count($omegaData['monitoring']['candidates']));
        foreach ($omegaData['monitoring']['candidates'] as $candidate) {
            $this->assertSame('LPK Omega Hotel Academy', $candidate['institutionName']);
            $this->assertSame('omegahotelacademy.sippmi.com', $candidate['subdomain']);
        }
    }
}
