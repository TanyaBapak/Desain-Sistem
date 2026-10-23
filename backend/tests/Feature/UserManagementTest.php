<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\AccessControlSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UserManagementTest extends TestCase
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

    public function test_super_admin_can_view_and_create_scoped_user_accounts(): void
    {
        $admin = $this->userWithRole('super_admin');
        $this->actingAs($admin)
            ->get('/app/rbac')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('adminUsers.data')
                ->where('adminUsers.total', 1));

        $this->post('/admin/users', [
            'name' => 'Petugas Daerah Contoh',
            'username' => 'petugas-daerah',
            'email' => 'petugas@example.invalid',
            'password' => 'kata-sandi-awal-aman',
            'role' => 'district_admin',
            'provinceId' => '32',
            'districtId' => '3201',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $created = User::query()->where('username', 'petugas-daerah')->firstOrFail();
        $this->assertSame('3201', $created->district_id);
        $this->assertSame('32', $created->province_id);
        $this->assertSame('kabupaten', $created->scope_level);
        $this->assertSame('Kabupaten Bogor', $created->scope_name);
        $this->assertSame('district_admin', $created->roles()->value('name'));
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $admin->id,
            'action_type' => 'AKUN_HAK_AKSES',
            'entity_id' => (string) $created->id,
        ]);
    }

    public function test_super_admin_cannot_create_another_super_admin_or_mismatched_scope(): void
    {
        $this->actingAs($this->userWithRole('super_admin'));
        $payload = [
            'name' => 'Pengguna Contoh',
            'username' => 'pengguna-contoh',
            'email' => 'pengguna@example.invalid',
            'password' => 'kata-sandi-awal-aman',
            'role' => 'super_admin',
        ];

        $this->from('/app/rbac')->post('/admin/users', $payload)
            ->assertRedirect('/app/rbac')
            ->assertSessionHasErrors('role');

        $payload['role'] = 'district_admin';
        $payload['provinceId'] = '32';
        $payload['districtId'] = '3171';
        $this->from('/app/rbac')->post('/admin/users', $payload)
            ->assertRedirect('/app/rbac')
            ->assertSessionHasErrors('districtId');

        $this->assertDatabaseCount('users', 1);
    }

    public function test_super_admin_can_start_and_end_an_audited_impersonation_session(): void
    {
        $admin = $this->userWithRole('super_admin');
        $target = $this->userWithRole('task_force');
        $this->actingAs($admin)
            ->post("/admin/users/{$target->id}/impersonate")
            ->assertRedirect('/app/dashboard');

        $this->get('/app/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.user.id', (string) $target->id)
                ->where('auth.impersonation.adminName', $admin->name));

        $this->post('/impersonation/stop')->assertRedirect('/app/rbac');
        $this->get('/app/rbac')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.user.id', (string) $admin->id)
                ->where('auth.impersonation', null));

        $this->assertDatabaseCount('audit_logs', 2);
        $this->assertSame('AKUN_HAK_AKSES', DB::table('audit_logs')->first()->action_type);
    }

    public function test_impersonation_rejects_super_admin_inactive_and_unauthorized_accounts(): void
    {
        $admin = $this->userWithRole('super_admin');
        $otherAdmin = $this->userWithRole('super_admin');
        $inactive = $this->userWithRole('task_force', ['status' => 'Nonaktif']);
        $mfaUser = $this->userWithRole('verifier', ['mfa_enabled' => true]);

        $this->actingAs($admin)->post("/admin/users/{$otherAdmin->id}/impersonate")->assertForbidden();
        $this->actingAs($admin)->post("/admin/users/{$inactive->id}/impersonate")->assertUnprocessable();
        $this->actingAs($admin)->post("/admin/users/{$mfaUser->id}/impersonate")->assertForbidden();

        $operator = $this->userWithRole('verifier');
        $this->actingAs($operator)->post("/admin/users/{$inactive->id}/impersonate")->assertForbidden();
        $this->actingAs($operator)->post('/impersonation/stop')->assertNotFound();
    }

    public function test_super_admin_cannot_disable_self_or_another_super_admin(): void
    {
        $admin = $this->userWithRole('super_admin');
        $otherAdmin = $this->userWithRole('super_admin');
        $user = $this->userWithRole('task_force');
        $this->actingAs($admin);

        $this->patch("/admin/users/{$admin->id}/status", ['status' => 'Nonaktif'])->assertForbidden();
        $this->patch("/admin/users/{$otherAdmin->id}/status", ['status' => 'Nonaktif'])->assertForbidden();
        $this->patch("/admin/users/{$user->id}/status", ['status' => 'Nonaktif'])->assertRedirect();

        $this->assertDatabaseHas('users', ['id' => $user->id, 'status' => 'Nonaktif']);
    }

    private function userWithRole(string $roleName, array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        $role = Role::query()->where('name', $roleName)->firstOrFail();
        $user->roles()->attach($role->id);

        return $user;
    }
}
