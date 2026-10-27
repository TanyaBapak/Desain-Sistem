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

        $this->assertSame(10, $result['inserted']);
        $this->assertSame(10, DB::table('job_seekers')->where('institution_name', 'Politeknik Indonusa Surakarta')->count());

        $suciUser = User::query()->where('email', 'sucipurwandari@sippmi.co')->first();
        $this->assertNotNull($suciUser);
        $this->assertSame('Ir. Suci Purwandari, M.M, Ph.D', $suciUser->name);

        $presenter = app(BusinessDataPresenter::class);
        $scope = $presenter->resolveInstitutionScope($suciUser);

        $this->assertTrue($scope['isIndonusa']);
        $this->assertFalse($scope['isVictoria']);
        $this->assertContains('Politeknik Indonusa Surakarta', $scope['patterns']);

        $data = $presenter->make($suciUser);
        $this->assertGreaterThanOrEqual(10, count($data['candidates']));
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

        $this->assertSame(10, DB::table('job_seekers')->where('institution_name', 'Politeknik Indonusa Surakarta')->count());
    }
}
