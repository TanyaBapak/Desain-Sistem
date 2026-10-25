<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Services\BusinessDataPresenter;
use Database\Seeders\DemoDataSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_leadership_and_auditor_have_read_only_report_routes(): void
    {
        $this->withoutVite();
        $leadership = $this->userWithRole('leadership');

        $this->actingAs($leadership)
            ->get('/app/reports')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('App')
                ->where('auth.user.accessibleTabs', ['dashboard', 'reports'])
                ->where('businessData.candidates', [])
                ->has('businessData.reportSummary.candidateCount'));

        $this->actingAs($leadership)->get('/app/dashboard')->assertOk();
        $this->actingAs($leadership)->get('/app/audit')->assertForbidden();
        $this->actingAs($leadership)->post('/business-data/candidates', [])->assertForbidden();

        $auditor = $this->userWithRole('auditor');
        $this->actingAs($auditor)->get('/app/reports')->assertOk();
        $this->actingAs($auditor)->get('/app/modul-a')->assertForbidden();
        $this->actingAs($auditor)->get('/app/audit')->assertForbidden();
    }

    public function test_public_landing_combines_manual_target_with_approved_processed_quota(): void
    {
        $this->withoutVite();
        $this->seed([
            ReferenceDataSeeder::class,
            DemoDataSeeder::class,
        ]);
        DB::table('job_demands')->where('id', 'DEM-DEMO-001')->update([
            'verification_status' => 'Approved',
            'headcount' => 12,
            'filled_quota' => 5,
        ]);
        DB::table('dashboard_targets')->insert([
            'metric_key' => 'validatedDemandCount_'.now()->year,
            'target_value' => 20,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('App')
                ->has('landingKpiSummary.metrics', 6)
                ->where('landingKpiSummary.metrics.5.value', 1)
                ->where('landingKpiSummary.metrics.5.target', 20)
                ->missing('landingKpiSummary.demandDetails'));
    }

    public function test_super_admin_can_manage_targets_and_is_limited_to_admin_modules(): void
    {
        $superAdmin = $this->userWithRole('super_admin');

        $this->actingAs($superAdmin)->get('/app/rbac')->assertOk();
        $this->actingAs($superAdmin)->get('/app/targets')->assertOk();
        $this->actingAs($superAdmin)->get('/app/modul-a')->assertForbidden();
        $this->actingAs($superAdmin)->post('/business-data/candidates', [])->assertForbidden();

        $leadership = $this->userWithRole('leadership');
        $this->actingAs($leadership)->get('/app/targets')->assertForbidden();
    }

    public function test_leadership_dashboard_includes_database_aggregates_without_personal_data(): void
    {
        $this->withoutVite();
        $this->seed([
            ReferenceDataSeeder::class,
            DemoDataSeeder::class,
        ]);
        DB::table('job_demands')->where('id', 'DEM-DEMO-001')->update([
            'verification_status' => 'Approved',
            'filled_quota' => 1,
        ]);
        $approvedDemand = (array) DB::table('job_demands')->where('id', 'DEM-DEMO-001')->first();
        DB::table('job_demands')->insert(array_merge($approvedDemand, [
            'id' => 'DEM-DEMO-PENDING',
            'verification_status' => 'Pending',
            'headcount' => 100,
            'filled_quota' => 50,
        ]));

        $this->actingAs($this->userWithRole('leadership'))
            ->get('/app/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('businessData.reportSummary.dashboard.candidateLifecycle.0.status', 'DRAFT')
                ->where('businessData.reportSummary.dashboard.candidateLifecycle.0.count', 1)
                ->where('businessData.reportSummary.dashboard.candidatesByProvince.0.province', 'Jawa Barat')
                ->where('businessData.reportSummary.dashboard.candidatesByProvince.0.count', 1)
                ->where('businessData.reportSummary.dashboard.institutionsByEvokasiStatus.0.status', 'Belum Terverifikasi')
                ->where('businessData.reportSummary.dashboard.institutionDirectory.0.name', 'SMK Contoh Cibinong')
                ->where('businessData.reportSummary.dashboard.institutionDirectory.0.district', 'Kabupaten Bogor')
                ->missing('businessData.reportSummary.dashboard.institutionDirectory.0.phone')
                ->where('businessData.reportSummary.dashboard.demandByCountry.0.country', 'Jepang')
                ->where('businessData.reportSummary.dashboard.demandByCountry.0.quota', 2)
                ->where('businessData.reportSummary.dashboard.demandByCountry.0.filledQuota', 1)
                ->missing('businessData.reportSummary.dashboardTargets')
                ->missing('businessData.reportSummary.dashboard.candidateLifecycle.0.nik'));
    }

    public function test_leadership_report_includes_national_lpk_count_without_counting_other_institutions(): void
    {
        $this->withoutVite();
        $this->seed(ReferenceDataSeeder::class);
        $this->createInstitution('VOC-LPK-01', 'LPK Contoh');
        DB::table('institutions')->where('id', 'VOC-LPK-01')->update([
            'institution_type' => 'LPK',
            'status' => 'Nonaktif',
        ]);
        $this->createInstitution('VOC-SMK-01', 'SMK Contoh');
        $this->createInstitution('VOC-TENANT-01', 'Tenant Konfigurasi');
        DB::table('institutions')->where('id', 'VOC-TENANT-01')->update([
            'institution_type' => 'LPK',
            'external_id' => 'omegahotelacademy.sippmi.com',
            'external_source' => 'gardata',
        ]);

        $this->actingAs($this->userWithRole('leadership'))
            ->get('/app/reports')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('businessData.reportSummary.nationalLpkCount', 1));

        $this->assertSame(
            1,
            app(BusinessDataPresenter::class)->make($this->userWithRole('institution_admin'))['nationalLpkCount'],
        );
    }

    public function test_institution_admin_candidate_data_is_bound_to_its_institution(): void
    {
        $this->withoutVite();
        $this->seed(ReferenceDataSeeder::class);
        $institutionId = $this->createInstitution('VOC-OWN', 'Lembaga Pemilik');
        $otherInstitutionId = $this->createInstitution('VOC-OTHER', 'Lembaga Lain');
        $owner = $this->userWithRole('institution_admin', ['institution_id' => $institutionId]);
        $otherOwner = $this->userWithRole('institution_admin', ['institution_id' => $otherInstitutionId]);

        $this->actingAs($owner)->post('/business-data/candidates', $this->candidatePayload('3300000000000001'))
            ->assertRedirect()
            ->assertSessionHasNoErrors();
        $this->actingAs($otherOwner)->post('/business-data/candidates', $this->candidatePayload('3300000000000002'))
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $ownedCandidate = DB::table('job_seekers')->where('nik', '3300000000000001')->first();
        $otherCandidate = DB::table('job_seekers')->where('nik', '3300000000000002')->first();
        $this->assertSame($institutionId, $ownedCandidate->institution_id);
        $this->assertSame('Lembaga Pemilik', $ownedCandidate->institution_name);
        $this->assertSame('LPK', $ownedCandidate->source_type);
        $this->assertSame('Pending Verification', $ownedCandidate->verification_status);
        $this->assertSame('SUBMITTED', $ownedCandidate->lifecycle_status);

        $this->actingAs($owner)
            ->get('/app/modul-a')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('businessData.candidates.0.id', $ownedCandidate->id)
                ->has('businessData.candidates', 1));

        $payload = $this->candidatePayload('3300000000000002');
        $this->actingAs($owner)
            ->put("/business-data/candidates/{$otherCandidate->id}", $payload)
            ->assertForbidden();
    }

    public function test_disnaker_cannot_submit_candidate_outside_its_province(): void
    {
        $this->seed(ReferenceDataSeeder::class);
        $disnaker = $this->userWithRole('province_admin', ['province_id' => '32']);

        $this->actingAs($disnaker)
            ->post('/business-data/candidates', $this->candidatePayload('3300000000000003', 'DKI Jakarta', 'Kota Jakarta Pusat'))
            ->assertForbidden();
    }

    private function userWithRole(string $roleName, array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        $role = Role::query()->firstOrCreate(
            ['name' => $roleName],
            [
                'title' => str_replace('_', ' ', $roleName),
                'core_group' => 'test',
                'default_tab' => 'overview',
            ],
        );
        $user->roles()->attach($role->id);

        return $user;
    }

    private function createInstitution(string $id, string $name): string
    {
        DB::table('institutions')->insert([
            'id' => $id,
            'name' => $name,
            'institution_type' => 'SMK',
            'ownership_type' => 'Negeri',
            'province_id' => '32',
            'district_id' => '3201',
            'accreditation' => 'A',
            'evokasi_status' => 'Proses Verifikasi',
            'verification_status' => 'Pending Verification',
            'status' => 'Aktif',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $id;
    }

    private function candidatePayload(string $nik, string $province = 'Jawa Barat', string $district = 'Kabupaten Bogor'): array
    {
        return [
            'nik' => $nik,
            'fullName' => 'Peserta Contoh',
            'gender' => 'L',
            'provinsi' => $province,
            'kabupatenKota' => $district,
            'educationLevel' => 'SMK',
            'institutionName' => 'Institusi dari isian',
            'sourceType' => 'Disnaker Pemda',
            'major' => 'Teknik Pengelasan',
            'skills' => [],
            'languageProficiency' => [],
            'preferredCountry' => [],
            'preferredJobRole' => [],
            'readinessStatus' => 'Needs Upskilling',
            'verificationStatus' => 'Verified',
            'lifecycleStatus' => 'APPROVED',
        ];
    }
}
