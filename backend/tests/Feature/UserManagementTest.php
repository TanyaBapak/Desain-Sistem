<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\AccessControlSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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
        $this->assertDatabaseHas('model_has_roles', [
            'model_id' => $created->id,
            'model_type' => User::class,
            'role_id' => Role::query()->where('name', 'district_admin')->value('id'),
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $admin->id,
            'action_type' => 'AKUN_HAK_AKSES',
            'entity_id' => (string) $created->id,
        ]);
    }

    public function test_super_admin_can_create_an_account_with_a_ten_character_password(): void
    {
        $this->actingAs($this->userWithRole('super_admin'));

        $this->post('/admin/users', [
            'name' => 'Pengguna Contoh',
            'username' => 'pengguna-contoh',
            'email' => 'pengguna@example.invalid',
            'password' => 'aman123456',
            'role' => 'task_force',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $created = User::query()->where('username', 'pengguna-contoh')->firstOrFail();
        $this->assertSame('task_force', $created->roles()->value('name'));
        $this->assertNull($created->bp3mi_code);
    }

    public function test_super_admin_can_edit_task_force_without_a_fixed_bp3mi_assignment(): void
    {
        $admin = $this->userWithRole('super_admin');
        $user = $this->userWithRole('task_force', [
            'username' => 'taskforce-multi-area',
            'email' => 'taskforce-multi-area@example.invalid',
        ]);

        $this->actingAs($admin)->patch("/admin/users/{$user->id}", [
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'password' => '',
            'role' => 'task_force',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertSame('Area BP3MI dipilih di header', $user->fresh()->scope_name);
        $this->assertSame('BP3MI-JABAR', $user->fresh()->bp3mi_code);

        $this->get('/app/rbac')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.user.bp3miAssignments', [])
                ->where('adminUsers.data', fn ($users): bool => collect($users)->contains(
                    fn ($item): bool => data_get($item, 'id') === (string) $user->id
                        && ! array_key_exists('bp3miCode', (array) $item),
                )));
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

    public function test_super_admin_can_edit_a_user_role_and_scope_and_keep_password_when_omitted(): void
    {
        $admin = $this->userWithRole('super_admin');
        $user = $this->userWithRole('task_force', [
            'username' => 'taskforce-edit',
            'email' => 'taskforce-edit@example.invalid',
        ]);
        $originalPassword = $user->password;

        $this->actingAs($admin)->patch("/admin/users/{$user->id}", [
            'name' => 'Petugas Provinsi Contoh',
            'username' => 'taskforce-edit',
            'email' => 'taskforce-edit@example.invalid',
            'password' => '',
            'role' => 'province_admin',
            'provinceId' => '32',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertSame('Petugas Provinsi Contoh', $user->name);
        $this->assertSame($originalPassword, $user->password);
        $this->assertSame('province_admin', $user->roles()->value('name'));
        $this->assertSame('32', $user->province_id);
        $this->assertSame('provinsi', $user->scope_level);
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $admin->id,
            'action_type' => 'AKUN_HAK_AKSES',
            'entity_id' => (string) $user->id,
            'justification_reason' => 'Data akun dan peran pengguna diperbarui.',
        ]);
    }

    public function test_super_admin_can_soft_delete_users_with_an_audit_reason(): void
    {
        $admin = $this->userWithRole('super_admin');
        $user = $this->userWithRole('task_force', [
            'username' => 'taskforce-arsip',
            'email' => 'taskforce-arsip@example.invalid',
            'password' => Hash::make('kata-sandi-awal-aman'),
        ]);

        $this->actingAs($admin)->delete("/admin/users/{$user->id}", [
            'reason' => 'Akun tidak lagi digunakan.',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertSoftDeleted('users', ['id' => $user->id]);
        $this->assertDatabaseHas('model_has_roles', [
            'model_id' => $user->id,
            'model_type' => User::class,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $admin->id,
            'action_type' => 'AKUN_HAK_AKSES',
            'entity_id' => (string) $user->id,
            'justification_reason' => 'Akun dihapus: Akun tidak lagi digunakan.',
        ]);
        $this->post('/login', [
            'identifier' => 'taskforce-arsip',
            'password' => 'kata-sandi-awal-aman',
        ])->assertSessionHasErrors('identifier');
    }

    public function test_super_admin_cannot_edit_or_delete_self_or_another_super_admin(): void
    {
        $admin = $this->userWithRole('super_admin');
        $otherAdmin = $this->userWithRole('super_admin');
        $this->actingAs($admin);

        $payload = [
            'name' => $otherAdmin->name,
            'username' => $otherAdmin->username,
            'email' => $otherAdmin->email,
            'role' => 'task_force',
        ];
        $this->patch("/admin/users/{$admin->id}", $payload)->assertForbidden();
        $this->patch("/admin/users/{$otherAdmin->id}", $payload)->assertForbidden();
        $this->delete("/admin/users/{$admin->id}", ['reason' => 'Tidak boleh'])->assertForbidden();
        $this->delete("/admin/users/{$otherAdmin->id}", ['reason' => 'Tidak boleh'])->assertForbidden();
        $this->assertDatabaseCount('users', 2);
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
