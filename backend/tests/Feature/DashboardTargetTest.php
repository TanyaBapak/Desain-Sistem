<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\AccessControlSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
        ]);
    }

    public function test_super_admin_can_update_national_dashboard_targets_and_leadership_can_view_them(): void
    {
        $admin = $this->userWithRole('super_admin');
        $targets = [
            'registeredJobSeekers' => 10000,
            'readyForPlacement' => 2500,
            'activeTrainingPrograms' => 300,
            'activeVocationalInstitutions' => 500,
            'nationalRegisteredLpk' => 3000,
            'validatedDemands' => 1200,
        ];

        $this->actingAs($admin)
            ->get('/app/rbac')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('adminUsers.dashboardTargets.registeredJobSeekers', null)
                ->where('adminUsers.dashboardTargets.validatedDemands', null));

        $this->patch('/admin/dashboard-targets', ['targets' => $targets])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        foreach ($targets as $key => $value) {
            $this->assertDatabaseHas('dashboard_targets', [
                'metric_key' => $key,
                'target_value' => $value,
                'updated_by' => $admin->id,
            ]);
        }
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $admin->id,
            'action_type' => 'UPDATE_DATA',
            'entity' => 'dashboard_targets',
            'entity_id' => 'nasional',
        ]);

        $this->actingAs($this->userWithRole('leadership'))
            ->get('/app/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('businessData.reportSummary.dashboardTargets.registeredJobSeekers', 10000)
                ->where('businessData.reportSummary.dashboardTargets.readyForPlacement', 2500)
                ->where('businessData.reportSummary.dashboardTargets.validatedDemands', 1200));

        $this->actingAs($this->userWithRole('auditor'))
            ->get('/app/reports')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('businessData.reportSummary.dashboardTargets.registeredJobSeekers', 10000)
                ->where('businessData.reportSummary.dashboardTargets.nationalRegisteredLpk', 3000));
    }

    public function test_only_super_admin_can_update_targets_and_all_targets_must_be_positive_integers(): void
    {
        $leadership = $this->userWithRole('leadership');
        $targets = array_fill_keys([
            'registeredJobSeekers',
            'readyForPlacement',
            'activeTrainingPrograms',
            'activeVocationalInstitutions',
            'nationalRegisteredLpk',
            'validatedDemands',
        ], 1);

        $this->actingAs($leadership)
            ->patch('/admin/dashboard-targets', ['targets' => $targets])
            ->assertForbidden();

        $targets['registeredJobSeekers'] = 0;
        $this->actingAs($this->userWithRole('super_admin'))
            ->from('/app/rbac')
            ->patch('/admin/dashboard-targets', ['targets' => $targets])
            ->assertRedirect('/app/rbac')
            ->assertSessionHasErrors('targets.registeredJobSeekers');

        $this->assertDatabaseCount('dashboard_targets', 0);
    }

    private function userWithRole(string $roleName): User
    {
        $user = User::factory()->create();
        $role = Role::query()->where('name', $roleName)->firstOrFail();
        $user->roles()->attach($role->id);

        return $user;
    }
}
