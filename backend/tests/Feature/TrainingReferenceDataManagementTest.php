<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Role;
use Database\Seeders\AccessControlSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TrainingReferenceDataManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([
            ReferenceDataSeeder::class,
            AccessControlSeeder::class,
        ]);
    }

    public function test_super_admin_can_manage_training_sector_and_occupation_catalog(): void
    {
        $this->withoutVite();
        $admin = $this->userWithRole('super_admin');

        $this->actingAs($admin)
            ->post('/admin/training-sectors', [
                'name' => 'Energi Terbarukan',
                'aliases' => ['Renewable Energy'],
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $sector = DB::table('sectors')->where('name', 'Energi Terbarukan')->first();
        $this->assertNotNull($sector);
        $this->assertSame(['Renewable Energy'], json_decode($sector->aliases, true, 512, JSON_THROW_ON_ERROR));

        $this->post('/admin/training-occupations', [
            'sectorId' => $sector->id,
            'title' => 'Teknisi Panel Surya',
            'aliases' => ['Solar Panel Technician'],
        ])->assertRedirect()->assertSessionHasNoErrors();

        $occupation = DB::table('occupations')->where('title', 'Teknisi Panel Surya')->first();
        $this->assertNotNull($occupation);
        $this->assertSame($sector->id, $occupation->sector_id);
        $this->assertSame(['Solar Panel Technician'], json_decode($occupation->aliases, true, 512, JSON_THROW_ON_ERROR));

        $this->patch("/admin/training-occupations/{$occupation->id}", [
            'sectorId' => $sector->id,
            'title' => 'Teknisi Surya',
            'aliases' => ['Solar Panel Technician'],
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->patch("/admin/training-sectors/{$sector->id}", [
            'name' => 'Energi Bersih',
            'aliases' => ['Renewable Energy'],
        ])->assertRedirect()->assertSessionHasNoErrors();

        $sector = DB::table('sectors')->where('id', $sector->id)->first();
        $this->assertSame('Energi Bersih', $sector->name);
        $this->assertSame(
            ['Renewable Energy', 'Energi Terbarukan'],
            json_decode($sector->aliases, true, 512, JSON_THROW_ON_ERROR),
        );

        $this->assertDatabaseCount('audit_logs', 4);

        $this->get('/app/targets')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('adminTargets.trainingSectors', fn ($sectors): bool => collect($sectors)->contains(
                    fn (array $item): bool => $item['name'] === 'Energi Bersih'
                    && $item['id'] === $sector->id
                    && in_array('Energi Terbarukan', $item['aliases'], true),
                ))
                ->where('adminTargets.landingPlacementOptions.occupations', fn ($jobs): bool => collect($jobs)->contains(
                    fn (array $job): bool => $job['sectorName'] === 'Energi Bersih'
                        && $job['occupationName'] === 'Teknisi Surya',
                )));

        auth()->logout();
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('trainingCatalog.sectors', fn ($sectors): bool => collect($sectors)->contains(
                    fn (array $item): bool => $item['name'] === 'Energi Bersih'
                        && in_array('Energi Terbarukan', $item['aliases'], true)
                        && collect($item['occupations'])->contains(
                            fn (array $job): bool => $job['title'] === 'Teknisi Surya'
                                && in_array('Teknisi Panel Surya', $job['aliases'], true)
                                && in_array('Solar Panel Technician', $job['aliases'], true),
                        ),
                ) && collect($sectors)->contains(
                    fn (array $item): bool => $item['name'] === 'Kesehatan / Caregiver'
                        && in_array('health', $item['aliases'], true),
                )));
    }

    public function test_non_super_admin_cannot_change_training_reference_data(): void
    {
        $user = $this->userWithRole('district_admin');

        $this->actingAs($user)
            ->post('/admin/training-sectors', ['name' => 'Sektor Baru'])
            ->assertForbidden();

        $this->assertDatabaseMissing('sectors', ['name' => 'Sektor Baru']);
    }

    private function userWithRole(string $roleName): User
    {
        $user = User::factory()->create();
        $role = Role::query()->where('name', $roleName)->firstOrFail();
        $user->roles()->attach($role->id);

        return $user;
    }
}
