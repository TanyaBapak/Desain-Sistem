<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\AccessControlSeeder;
use Database\Seeders\DemoDataSeeder;
use Database\Seeders\ProgramPlacementTargetSeeder;
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
            ProgramPlacementTargetSeeder::class,
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
                ->where('adminTargets.landingCountrySectorTargets', [])
                ->where('adminTargets.landingPlacementTargets', fn ($rows): bool => collect($rows)->contains(
                    fn (array $row): bool => $row['year'] === 2027
                        && $row['sectorName'] === 'Kesehatan'
                        && $row['occupationName'] === 'Caregiver (lvl pelaksana)'
                        && $row['target'] === 540,
                )));

        $this->patch('/admin/dashboard-targets', $this->targetPayload())
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('dashboard_targets', [
            'metric_key' => 'validatedDemandCount_'.now()->year,
            'target_value' => 200,
            'updated_by' => $admin->id,
        ]);
        $this->assertDatabaseHas('landing_placement_targets', [
            'year' => now()->year,
            'sector_name' => 'Kesehatan',
            'occupation_name' => 'Caregiver (lvl pelaksana)',
            'projection_placement' => 'Jepang (SSW)',
            'target' => 50,
            'updated_by' => $admin->id,
        ]);
        $this->assertDatabaseCount('dashboard_targets', 33);
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
        $this->assertDatabaseHas('dashboard_targets', [
            'metric_key' => 'cst_'.substr(hash('sha256', "DE\0SECT-CARE"), 0, 40).'_'.now()->year,
            'target_value' => 12,
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
                ))
                ->where('adminTargets.landingPlacementTargets', fn ($rows): bool => collect($rows)->contains(
                    fn (array $row): bool => $row['year'] === now()->year
                        && $row['sectorName'] === 'Kesehatan'
                        && $row['occupationName'] === 'Caregiver (lvl pelaksana)'
                        && $row['projectionPlacement'] === 'Jepang (SSW)'
                        && $row['target'] === 50,
                )));

        auth()->logout();
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('landingKpiSummary.metrics', 6)
                ->where('landingKpiSummary.year', now()->year)
                ->where('landingKpiSummary.metrics.5.value', 1)
                ->where('landingKpiSummary.metrics.5.target', 200)
                ->where('landingProjection.year', null)
                ->where('landingProjection.placementTargets', fn ($rows): bool => collect($rows)->contains(
                    fn (array $row): bool => $row['year'] === 2027
                        && $row['sectorName'] === 'Kesehatan'
                        && $row['occupationName'] === 'Caregiver (lvl pelaksana)',
                ))
                ->where('landingProjection.countries', function ($rows): bool {
                    $countries = collect($rows);

                    return $countries->contains(
                        fn (array $row): bool => $row['name'] === '2027 · Jepang'
                            && $row['target'] > 0
                            && $row['achieved'] === 0,
                    )
                        && $countries->contains(
                            fn (array $row): bool => $row['name'] === '2027 · Malaysia' && $row['target'] > 0,
                        )
                        && $countries->contains(
                            fn (array $row): bool => $row['name'] === '2027 · Singapura' && $row['target'] > 0,
                        )
                        && $countries->contains(
                            fn (array $row): bool => $row['name'] === '2027 · Kuwait' && $row['target'] > 0,
                        );
                }));
    }

    public function test_public_korea_south_projection_uses_only_the_six_hundred_fisherman_target(): void
    {
        $projection = app(\App\Services\BusinessDataPresenter::class)->publicLandingProjection(2027);

        $korea = collect($projection['countries'])->first(
            fn (array $country): bool => $country['name'] === 'Korea Selatan',
        );
        $koreaSectors = collect($projection['sectors'])
            ->filter(fn (array $sector): bool => str_starts_with($sector['name'], 'Korea Selatan ·'));
        $koreaTargets = collect($projection['placementTargets'])
            ->filter(fn (array $target): bool => $target['projectionPlacement'] === 'Korea Selatan');

        $this->assertNotNull($korea);
        $this->assertSame(600, $korea['target']);
        $this->assertSame(600, $koreaSectors->sum('target'));
        $this->assertSame(
            ['Sertifikasi Teknis' => 600],
            $koreaSectors->mapWithKeys(fn (array $sector): array => [
                substr($sector['name'], strlen('Korea Selatan · ')) => $sector['target'],
            ])->all(),
        );
        $this->assertSame(1, $koreaTargets->count());
        $this->assertSame('ABK Fishermen', $koreaTargets->first()['occupationName']);
        $this->assertSame(600, $koreaTargets->first()['target']);
    }

    public function test_public_japan_malaysia_and_turkey_targets_match_country_totals(): void
    {
        $projection = app(\App\Services\BusinessDataPresenter::class)->publicLandingProjection(2027);

        foreach (['Jepang' => 2000, 'Malaysia' => 5000, 'Turki' => 5000] as $countryName => $target) {
            $country = collect($projection['countries'])->first(
                fn (array $item): bool => $item['name'] === $countryName,
            );
            $sectors = collect($projection['sectors'])
                ->filter(fn (array $item): bool => str_starts_with($item['name'], "{$countryName} ·"));
            $placementTargets = collect($projection['placementTargets'])
                ->filter(function (array $item) use ($countryName): bool {
                    $destination = preg_replace('/\\s*\\([^)]*\\)/u', '', $item['projectionPlacement'])
                        ?? $item['projectionPlacement'];

                    return mb_strtolower(trim($destination)) === mb_strtolower($countryName);
                });

            $this->assertNotNull($country, "{$countryName} must be present in public projection.");
            $this->assertSame($target, $country['target']);
            $this->assertSame($target, $sectors->sum('target'));
            $this->assertSame($target, $placementTargets->sum('target'));
        }
    }

    public function test_only_super_admin_can_change_manual_landing_target(): void
    {
        $this->actingAs($this->userWithRole('leadership'))
            ->patch('/admin/dashboard-targets', $this->targetPayload())
            ->assertForbidden();

        $this->assertDatabaseCount('dashboard_targets', 0);
    }

    public function test_super_admin_can_limit_public_projection_countries_and_split_multi_country_targets_equally(): void
    {
        $this->withoutVite();
        $admin = $this->userWithRole('super_admin');
        $payload = $this->targetPayload();
        $payload['targets']['projectionCountries'] = ['Turki', 'Jepang'];
        $payload['targets']['placementTargets'] = [[
            'sectorName' => 'Kesehatan',
            'occupationName' => 'Caregiver (lvl pelaksana)',
            'projectionPlacement' => 'Turki, Jepang',
            'target' => 200,
        ]];

        $this->actingAs($admin)
            ->get('/app/targets')
            ->assertInertia(fn (Assert $page) => $page
                ->where('adminTargets.landingProjectionCountryOptions', fn ($countries): bool => collect($countries)->contains('Turki')
                    && collect($countries)->contains('Jepang')));

        $splitTargets = app(\App\Services\DashboardTargetService::class)
            ->filterLandingPlacementTargetsForCountries([[
                'year' => now()->year,
                'sectorName' => 'Kesehatan',
                'occupationName' => 'Caregiver (lvl pelaksana)',
                'projectionPlacement' => 'Turki, Jepang, Malaysia',
                'target' => 200,
            ]], ['Turki', 'Jepang', 'Malaysia']);
        $this->assertSame(
            ['Turki' => 67, 'Jepang' => 67, 'Malaysia' => 66],
            collect($splitTargets)->mapWithKeys(fn (array $target): array => [
                $target['projectionPlacement'] => $target['target'],
            ])->all(),
        );

        $this->actingAs($admin)
            ->patch('/admin/dashboard-targets', $payload)
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertSame(
            ['Jepang', 'Turki'],
            app(\App\Services\DashboardTargetService::class)->landingProjectionCountries(),
        );

        auth()->logout();
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('landingProjection.countries', function ($rows): bool {
                    $countries = collect($rows);

                    return $countries->every(
                        fn (array $row): bool => str_ends_with($row['name'], 'Jepang')
                            || str_ends_with($row['name'], 'Turki'),
                    )
                        && $countries->contains(
                            fn (array $row): bool => str_ends_with($row['name'], 'Turki')
                                && $row['target'] === 100,
                        );
                })
                ->where('landingProjection.sectors', function ($rows): bool {
                    $sectors = collect($rows);

                    return $sectors->contains(
                        fn (array $row): bool => str_ends_with($row['name'], 'Turki · Kesehatan')
                            && $row['target'] === 100,
                    )
                        && $sectors->contains(
                            fn (array $row): bool => str_ends_with($row['name'], 'Jepang · Kesehatan')
                                && $row['target'] === 100,
                        );
                })
                ->where('landingProjection.placementTargets', function ($rows): bool {
                    $targets = collect($rows)->where('year', now()->year);

                    return $targets->contains(
                        fn (array $row): bool => $row['projectionPlacement'] === 'Turki'
                            && $row['target'] === 100,
                    )
                        && $targets->contains(
                            fn (array $row): bool => $row['projectionPlacement'] === 'Jepang'
                                && $row['target'] === 100,
                        )
                        && $targets->every(
                            fn (array $row): bool => in_array($row['projectionPlacement'], ['Turki', 'Jepang'], true),
                        );
                }));
    }

    public function test_super_admin_cannot_select_a_country_outside_available_projection_options(): void
    {
        $payload = $this->targetPayload();
        $payload['targets']['projectionCountries'] = ['Atlantis'];

        $this->actingAs($this->userWithRole('super_admin'))
            ->patch('/admin/dashboard-targets', $payload)
            ->assertSessionHasErrors('targets.projectionCountries');

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

    public function test_target_job_options_are_distinct_from_institution_sector_and_job_metadata(): void
    {
        DB::table('institutions')->where('id', 'VOC-DEMO-001')->update([
            'supported_sectors' => json_encode(['Kesehatan', 'Hospitality'], JSON_THROW_ON_ERROR),
            'external_metadata' => json_encode([
                'programs' => [
                    ['sector' => 'Kesehatan', 'occupation' => 'Perawat'],
                    ['sector' => 'Kesehatan', 'occupation' => 'Perawat'],
                    ['sector' => 'Hospitality', 'occupation' => 'Koki'],
                ],
            ], JSON_THROW_ON_ERROR),
        ]);

        $this->actingAs($this->userWithRole('super_admin'))
            ->get('/app/targets')
            ->assertInertia(fn (Assert $page) => $page
                ->where('adminTargets.landingPlacementOptions.sectors', ['Hospitality', 'Kesehatan'])
                ->where('adminTargets.landingPlacementOptions.occupations', [
                    ['sectorName' => 'Hospitality', 'occupationName' => 'Koki'],
                    ['sectorName' => 'Kesehatan', 'occupationName' => 'Perawat'],
                ]));
    }

    public function test_program_placement_target_seeder_does_not_overwrite_existing_manual_values(): void
    {
        DB::table('landing_placement_targets')
            ->where('year', 2027)
            ->where('sector_name', 'Kesehatan')
            ->where('occupation_name', 'Caregiver (lvl pelaksana)')
            ->where('projection_placement', 'Jepang (SSW)')
            ->update(['target' => 555]);

        $this->seed(ProgramPlacementTargetSeeder::class);

        $this->assertDatabaseHas('landing_placement_targets', [
            'year' => 2027,
            'sector_name' => 'Kesehatan',
            'occupation_name' => 'Caregiver (lvl pelaksana)',
            'projection_placement' => 'Jepang (SSW)',
            'target' => 555,
        ]);
        $this->assertDatabaseCount('landing_placement_targets', 41);
    }

    public function test_existing_program_placement_target_can_be_updated_by_selected_period(): void
    {
        $target = DB::table('landing_placement_targets')
            ->where('year', 2027)
            ->where('sector_name', 'Kesehatan')
            ->where('occupation_name', 'Caregiver (lvl pelaksana)')
            ->where('projection_placement', 'Jepang (SSW)')
            ->firstOrFail();
        $payload = $this->targetPayload();
        $payload['year'] = 2027;
        $payload['targets']['placementTargets'] = [[
            'id' => $target->id,
            'sectorName' => $target->sector_name,
            'occupationName' => $target->occupation_name,
            'projectionPlacement' => 'Jepang (SSW), Taiwan',
            'target' => 600,
        ]];

        $this->actingAs($this->userWithRole('super_admin'))
            ->patch('/admin/dashboard-targets', $payload)
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('landing_placement_targets', [
            'id' => $target->id,
            'year' => 2027,
            'projection_placement' => 'Jepang (SSW), Taiwan',
            'target' => 600,
        ]);
        $this->assertDatabaseCount('landing_placement_targets', 41);
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
        DB::table('landing_placement_targets')->insert([
            'year' => $year,
            'sector_name' => 'Kesehatan',
            'occupation_name' => 'Caregiver (lvl pelaksana)',
            'projection_placement' => 'Jepang (SSW)',
            'target' => 540,
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
                ->where('landingProjection.periods', [2027, $currentYear, $year])
                ->has('landingProjection.countries', 5)
                ->where('landingProjection.countries', fn ($rows): bool => collect($rows)->contains(
                    fn (array $row): bool => $row['name'] === 'Jepang'
                        && $row['target'] === 540
                        && $row['achieved'] === 8
                        && $row['projected'] === 532,
                ))
                ->where('landingProjection.sectors.0.name', 'Jepang · Kesehatan')
                ->where('landingProjection.sectors.0.target', 540)
                ->where('landingProjection.sectors.0.achieved', 0)
                ->where('landingProjection.sectors.0.projected', 540)
                ->where('landingProjection.placementTargets.0.sectorName', 'Kesehatan')
                ->where('landingProjection.placementTargets.0.occupationName', 'Caregiver (lvl pelaksana)')
                ->where('landingProjection.placementTargets.0.projectionPlacement', 'Jepang (SSW)')
                ->where('landingProjection.placementTargets.0.target', 540));

        $this->get('/?projectionYear=all')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('landingProjection.year', null)
                ->where('landingProjection.periods', [2027, $currentYear, $year])
                ->where('landingProjection.countries', fn ($rows): bool => collect($rows)->contains(
                    fn (array $row): bool => $row['name'] === "{$year} · Jepang",
                ))
                ->where('landingProjection.sectors', fn ($rows): bool => collect($rows)->contains(
                    fn (array $row): bool => $row['name'] === "{$year} · Jepang · Kesehatan"
                        && $row['target'] === 540
                        && $row['achieved'] === 0,
                ))
                ->where('landingProjection.placementTargets', fn ($rows): bool => collect($rows)->contains(
                    fn (array $row): bool => $row['year'] === $year
                        && $row['sectorName'] === 'Kesehatan'
                        && $row['target'] === 540,
                )));

        $this->get('/?projectionYear=2027')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('landingProjection.year', 2027)
                ->has('landingProjection.placementTargets', 96)
                ->where('landingProjection.placementTargets', fn ($rows): bool => collect($rows)
                    ->pluck('sectorName')
                    ->unique()
                    ->sort()
                    ->values()
                    ->all() === [
                        'Agriculture',
                        'Bahasa',
                        'Hospitality',
                        'Kesehatan',
                        'Manufaktur',
                        'Pelatihan dan Sertifikasi Teknis',
                        'Sertifikasi Teknis',
                        'Transportasi',
                    ]));
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
                    'DE' => ['SECT-CARE' => 12],
                ],
                'placementTargets' => [
                    [
                        'sectorName' => 'Kesehatan',
                        'occupationName' => 'Caregiver (lvl pelaksana)',
                        'projectionPlacement' => 'Jepang (SSW)',
                        'target' => 50,
                    ],
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
