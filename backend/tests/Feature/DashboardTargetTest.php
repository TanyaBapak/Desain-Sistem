<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\AccessControlSeeder;
use Database\Seeders\DemoDataSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTargetTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([
            ReferenceDataSeeder::class,
            AccessControlSeeder::class,
            DemoDataSeeder::class,
        ]);
    }

    public function test_super_admin_can_set_manual_landing_target_and_public_landing_uses_it_with_processed_demand(): void
    {
        $this->withoutVite();
        $admin = $this->userWithRole('super_admin');
        DB::table('job_demands')->where('id', 'DEM-DEMO-001')->update([
            'verification_status' => 'Approved',
            'headcount' => 12,
            'filled_quota' => 5,
        ]);

        $this->actingAs($admin)
            ->get('/app/rbac')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('adminUsers.landingKpiTargets', [])
                ->has('adminUsers.landingCountries', 5)
                ->where('adminUsers.landingCountryTargets', []));

        $this->patch('/admin/dashboard-targets', $this->targetPayload())
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('dashboard_targets', [
            'metric_key' => 'validatedDemandCount_'.now()->year,
            'target_value' => 200,
            'updated_by' => $admin->id,
        ]);
        $this->assertDatabaseCount('dashboard_targets', 11);
        $this->assertDatabaseHas('dashboard_targets', [
            'metric_key' => 'countryTarget_JP_'.now()->year,
            'target_value' => 30,
            'updated_by' => $admin->id,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $admin->id,
            'entity' => 'dashboard_targets',
            'entity_id' => (string) now()->year,
        ]);
        $this->actingAs($admin)
            ->get('/app/rbac')
            ->assertInertia(fn (Assert $page) => $page
                ->where('adminUsers.landingKpiTargets.0.year', now()->year)
                ->where('adminUsers.landingKpiTargets.0.targets.registeredJobSeekers', 10000)
                ->where('adminUsers.landingKpiTargets.0.targets.validatedDemandCount', 200)
                ->has('adminUsers.landingCountryPerformance', 5)
                ->where('adminUsers.landingCountryPerformance', fn ($rows): bool => collect($rows)->contains(
                    fn (array $row): bool => $row['year'] === now()->year
                        && $row['countryId'] === 'JP'
                        && $row['target'] === 30
                        && $row['achieved'] === 5
                        && $row['percentage'] === 16.7,
                )));

        auth()->logout();
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('landingKpiSummary.metrics', 6)
                ->where('landingKpiSummary.year', now()->year)
                ->where('landingKpiSummary.metrics.5.value', 1)
                ->where('landingKpiSummary.metrics.5.target', 200));
    }

    public function test_only_super_admin_can_change_manual_landing_target(): void
    {
        $this->actingAs($this->userWithRole('leadership'))
            ->patch('/admin/dashboard-targets', $this->targetPayload())
            ->assertForbidden();

        $this->assertDatabaseCount('dashboard_targets', 0);
    }

    public function test_target_and_processed_quota_are_scoped_to_the_selected_year(): void
    {
        $this->withoutVite();
        $year = (int) now()->year;
        $previousYear = $year - 1;
        $demand = (array) DB::table('job_demands')->where('id', 'DEM-DEMO-001')->first();
        DB::table('job_demands')->insert(array_merge($demand, [
            'id' => 'DEM-DEMO-PREVIOUS-YEAR',
            'verification_status' => 'Approved',
            'headcount' => 100,
            'filled_quota' => 50,
            'created_at' => now()->setYear($previousYear),
            'updated_at' => now()->setYear($previousYear),
        ]));
        DB::table('dashboard_targets')->insert([
            'metric_key' => "validatedDemandCount_{$year}",
            'target_value' => 25,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('landingKpiSummary.year', $year)
                ->where('landingKpiSummary.metrics.5.value', 0)
                ->where('landingKpiSummary.metrics.5.target', 25));

        DB::table('job_demands')->where('id', 'DEM-DEMO-001')->update([
            'verification_status' => 'Approved',
            'headcount' => 15,
            'filled_quota' => 6,
            'created_at' => now(),
        ]);
        $this->actingAs($this->userWithRole('super_admin'))
            ->get('/app/rbac')
            ->assertInertia(fn (Assert $page) => $page
                ->has('adminUsers.landingCountryPerformance', 10)
                ->where('adminUsers.landingCountryPerformance', function ($rows) use ($year, $previousYear): bool {
                    $periods = collect($rows);

                    return $periods->contains(
                        fn (array $row): bool => $row['year'] === $previousYear
                        && $row['countryId'] === 'JP'
                        && $row['target'] === 100
                        && $row['achieved'] === 50
                        && $row['projected'] === 50
                        && $row['percentage'] == 50,
                    ) && $periods->contains(
                        fn (array $row): bool => $row['year'] === $year
                            && $row['countryId'] === 'JP'
                            && $row['target'] === 15
                            && $row['achieved'] === 6
                            && $row['projected'] === 9
                            && $row['percentage'] == 40,
                    );
                }));
    }

    public function test_public_landing_projection_filters_demand_and_programs_by_selected_year(): void
    {
        $this->withoutVite();
        $year = (int) now()->year - 1;
        DB::table('job_demands')->where('id', 'DEM-DEMO-001')->update([
            'verification_status' => 'Approved',
            'headcount' => 20,
            'filled_quota' => 8,
            'created_at' => now()->setYear($year),
        ]);
        DB::table('training_programs')->where('id', 'PROG-DEMO-001')->update([
            'program_type' => 'Pelatihan Bahasa',
            'quota' => 15,
            'enrolled_count' => 6,
            'created_at' => now()->setYear($year),
        ]);
        DB::table('dashboard_targets')->insert([
            'metric_key' => "countryTarget_JP_{$year}",
            'target_value' => 30,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->get('/?projectionYear='.$year)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('landingProjection.year', $year)
                ->has('landingProjection.countries', 5)
                ->where('landingProjection.countries.0.name', 'Jepang')
                ->where('landingProjection.countries.0.target', 30)
                ->where('landingProjection.countries.0.achieved', 8)
                ->where('landingProjection.countries.0.projected', 22)
                ->where('landingProjection.countries.1.target', 0)
                ->where('landingProjection.countries.1.achieved', 0)
                ->where('landingProjection.countries.1.projected', 0)
                ->where('landingProjection.trainingTypes.0.name', 'Pelatihan Bahasa')
                ->where('landingProjection.trainingTypes.0.target', 15)
                ->where('landingProjection.trainingTypes.0.achieved', 6)
                ->where('landingProjection.trainingTypes.0.projected', 9));
    }

    private function targetPayload(): array
    {
        return [
            'year' => now()->year,
            'targets' => [
                'registeredJobSeekers' => 10000,
                'readyForPlacement' => 170,
                'activeTrainingPrograms' => 200,
                'activeVocationalInstitutions' => 200,
                'nationalLpkCount' => 200,
                'validatedDemandCount' => 200,
                'countries' => [
                    'JP' => 30,
                    'DE' => null,
                    'KR' => null,
                    'TW' => null,
                    'SA' => null,
                ],
            ],
        ];
    }

    private function userWithRole(string $roleName): User
    {
        $user = User::factory()->create();
        $role = Role::query()->where('name', $roleName)->firstOrFail();
        $user->roles()->attach($role->id);

        return $user;
    }
}
