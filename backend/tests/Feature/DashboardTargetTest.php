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
        DB::table('training_programs')->where('id', 'PROG-DEMO-001')->update([
            'enrolled_count' => 7,
        ]);

        $this->actingAs($admin)
            ->get('/app/targets')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.user.accessibleTabs', ['targets', 'rbac', 'audit'])
                ->where('adminTargets.landingKpiTargets', [])
                ->has('adminTargets.landingCountries', 5)
                ->where('adminTargets.landingCountryTargets', [])
                ->where('adminTargets.landingCountryTrainingTargets', [])
                ->where('adminTargets.landingCountrySectorTargets', []));

        $this->patch('/admin/dashboard-targets', $this->targetPayload())
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('dashboard_targets', [
            'metric_key' => 'validatedDemandCount_'.now()->year,
            'target_value' => 200,
            'updated_by' => $admin->id,
        ]);
        $this->assertDatabaseCount('dashboard_targets', 32);
        $this->assertDatabaseHas('dashboard_targets', [
            'metric_key' => 'countryTarget_JP_'.now()->year,
            'target_value' => 30,
            'updated_by' => $admin->id,
        ]);
        $this->assertDatabaseHas('dashboard_targets', [
            'metric_key' => 'countryTrainingTarget_JP_upskilling_'.now()->year,
            'target_value' => 40,
            'updated_by' => $admin->id,
        ]);
        $this->assertDatabaseHas('dashboard_targets', [
            'metric_key' => 'cst_'.substr(hash('sha256', "JP\0SECT-WELD"), 0, 40).'_'.now()->year,
            'target_value' => 24,
            'updated_by' => $admin->id,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $admin->id,
            'entity' => 'dashboard_targets',
            'entity_id' => (string) now()->year,
        ]);
        $this->actingAs($admin)
            ->get('/app/targets')
            ->assertInertia(fn (Assert $page) => $page
                ->where('adminTargets.landingKpiTargets.0.year', now()->year)
                ->where('adminTargets.landingKpiTargets.0.targets.registeredJobSeekers', 10000)
                ->where('adminTargets.landingKpiTargets.0.targets.validatedDemandCount', 200)
                ->has('adminTargets.landingCountryPerformance', 5)
                ->where('adminTargets.landingCountryPerformance', fn ($rows): bool => collect($rows)->contains(
                    fn (array $row): bool => $row['year'] === now()->year
                        && $row['countryId'] === 'JP'
                        && $row['target'] === 24
                        && $row['achieved'] === 5
                        && $row['percentage'] === 20.8,
                ))
                ->has('adminTargets.landingCountryTrainingPerformance', 20)
                ->where('adminTargets.landingCountryTrainingPerformance', fn ($rows): bool => collect($rows)->contains(
                    fn (array $row): bool => $row['year'] === now()->year
                        && $row['countryId'] === 'JP'
                        && $row['trainingTypeKey'] === 'upskilling'
                        && $row['target'] === 40
                        && $row['achieved'] === 7
                        && $row['projected'] === 33,
                ))
                ->where('adminTargets.landingCountrySectorTargets.0.targets.JP.SECT-WELD', 24)
                ->where('adminTargets.landingCountrySectorPerformance', fn ($rows): bool => collect($rows)->contains(
                    fn (array $row): bool => $row['year'] === now()->year
                        && $row['countryId'] === 'JP'
                        && $row['sectorId'] === 'SECT-WELD'
                        && $row['target'] === 24
                        && $row['achieved'] === 5
                        && $row['projected'] === 19,
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

    public function test_manual_country_sector_target_must_use_existing_master_data(): void
    {
        $payload = $this->targetPayload();
        $payload['targets']['countrySectors'] = ['JP' => ['SECT-NOT-FOUND' => 100]];

        $this->actingAs($this->userWithRole('super_admin'))
            ->patch('/admin/dashboard-targets', $payload)
            ->assertSessionHasErrors('targets.countrySectors.JP');

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
        $program = (array) DB::table('training_programs')->where('id', 'PROG-DEMO-001')->first();
        DB::table('training_programs')->insert(array_merge($program, [
            'id' => 'PROG-DEMO-PREVIOUS-YEAR',
            'name' => 'Program Contoh Tahun Sebelumnya',
            'quota' => 80,
            'enrolled_count' => 35,
            'created_at' => now()->setYear($previousYear),
            'updated_at' => now()->setYear($previousYear),
        ]));
        DB::table('dashboard_targets')->insert([
            'metric_key' => "validatedDemandCount_{$year}",
            'target_value' => 25,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('dashboard_targets')->insert([
            'metric_key' => "countryTrainingTarget_JP_upskilling_{$previousYear}",
            'target_value' => 50,
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
            ->get('/app/targets')
            ->assertInertia(fn (Assert $page) => $page
                ->has('adminTargets.landingCountryPerformance', 10)
                ->where('adminTargets.landingCountryPerformance', function ($rows) use ($year, $previousYear): bool {
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
                })
                ->has('adminTargets.landingCountryTrainingPerformance', 40)
                ->where('adminTargets.landingCountryTrainingPerformance', function ($rows) use ($year, $previousYear): bool {
                    $periods = collect($rows);

                    return $periods->contains(
                        fn (array $row): bool => $row['year'] === $previousYear
                            && $row['countryId'] === 'JP'
                            && $row['trainingTypeKey'] === 'upskilling'
                            && $row['target'] === 50
                            && $row['achieved'] === 35
                            && $row['projected'] === 15
                            && $row['percentage'] == 70,
                    ) && $periods->contains(
                        fn (array $row): bool => $row['year'] === $year
                            && $row['countryId'] === 'JP'
                            && $row['trainingTypeKey'] === 'upskilling'
                            && $row['target'] === 20
                            && $row['achieved'] === 0,
                    );
                })
                ->where('adminTargets.landingCountrySectorPerformance', function ($rows) use ($year, $previousYear): bool {
                    $periods = collect($rows);

                    return $periods->contains(
                        fn (array $row): bool => $row['year'] === $previousYear
                            && $row['countryId'] === 'JP'
                            && $row['sectorId'] === 'SECT-WELD'
                            && $row['target'] === 100
                            && $row['achieved'] === 50,
                    ) && $periods->contains(
                        fn (array $row): bool => $row['year'] === $year
                            && $row['countryId'] === 'JP'
                            && $row['sectorId'] === 'SECT-WELD'
                            && $row['target'] === 15
                            && $row['achieved'] === 6,
                    );
                }));
    }

    public function test_public_landing_projection_filters_country_sector_targets_by_selected_year(): void
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
        DB::table('dashboard_targets')->insert([
            'metric_key' => "countryTrainingTarget_JP_language_{$year}",
            'target_value' => 18,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('dashboard_targets')->insert([
            'metric_key' => 'cst_'.substr(hash('sha256', "JP\0SECT-WELD"), 0, 40)."_{$year}",
            'target_value' => 18,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $currentYear = (int) now()->year;
        $currentDemand = (array) DB::table('job_demands')->where('id', 'DEM-DEMO-001')->first();
        DB::table('job_demands')->insert(array_merge($currentDemand, [
            'id' => 'DEM-DEMO-CURRENT-YEAR',
            'headcount' => 10,
            'filled_quota' => 2,
            'created_at' => now()->setYear($currentYear),
            'updated_at' => now()->setYear($currentYear),
        ]));

        $this->get('/?projectionYear='.$year)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('landingProjection.year', $year)
                ->where('landingProjection.periods', [$currentYear, $year])
                ->has('landingProjection.countries', 5)
                ->where('landingProjection.countries', fn ($rows): bool => collect($rows)->contains(
                    fn (array $row): bool => $row['name'] === 'Jepang'
                        && $row['target'] === 18
                        && $row['achieved'] === 8
                        && $row['projected'] === 10,
                ))
                ->where('landingProjection.sectors.0.name', 'Jepang · Manufaktur / Pengelasan')
                ->where('landingProjection.sectors.0.target', 18)
                ->where('landingProjection.sectors.0.achieved', 8)
                ->where('landingProjection.sectors.0.projected', 10));

        $this->get('/?projectionYear=all')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('landingProjection.year', null)
                ->where('landingProjection.periods', [$currentYear, $year])
                ->where('landingProjection.countries', fn ($rows): bool => collect($rows)->contains(
                    fn (array $row): bool => $row['name'] === "{$year} · Jepang",
                ))
                ->where('landingProjection.sectors', fn ($rows): bool => collect($rows)->contains(
                    fn (array $row): bool => $row['name'] === "{$year} · Jepang · Manufaktur / Pengelasan"
                        && $row['target'] === 18
                        && $row['achieved'] === 8,
                )));
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
                'countrySectors' => [
                    'JP' => ['SECT-WELD' => 24],
                ],
                'countries' => [
                    'JP' => 30,
                    'DE' => null,
                    'KR' => null,
                    'TW' => null,
                    'SA' => null,
                ],
                'countryTrainingTypes' => [
                    'JP' => [
                        'upskilling' => 40,
                        'reskilling' => null,
                        'language' => null,
                        'integratedTechnical' => null,
                    ],
                    'DE' => [
                        'upskilling' => null,
                        'reskilling' => null,
                        'language' => null,
                        'integratedTechnical' => null,
                    ],
                    'KR' => [
                        'upskilling' => null,
                        'reskilling' => null,
                        'language' => null,
                        'integratedTechnical' => null,
                    ],
                    'TW' => [
                        'upskilling' => null,
                        'reskilling' => null,
                        'language' => null,
                        'integratedTechnical' => null,
                    ],
                    'SA' => [
                        'upskilling' => null,
                        'reskilling' => null,
                        'language' => null,
                        'integratedTechnical' => null,
                    ],
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
