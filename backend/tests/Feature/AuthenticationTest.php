<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_page_is_rendered_by_inertia(): void
    {
        $this->withoutVite();

        $this->get('/login')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('App')
                ->where('showLogin', true)
                ->where('auth.user', null));
    }

    public function test_user_can_login_with_username_and_access_their_role_tabs(): void
    {
        $user = User::factory()->create([
            'username' => 'operator-test',
            'password' => Hash::make('Local-password-123'),
            'nip' => 'TEST-NIP-001',
        ]);
        $role = Role::query()->create([
            'name' => 'district_admin',
            'title' => 'Admin Wilayah',
            'core_group' => 'disnaker',
            'default_tab' => 'modul-a',
        ]);
        $user->roles()->attach($role->id);

        $this->post('/login', [
            'identifier' => 'operator-test',
            'password' => 'Local-password-123',
        ])->assertRedirect('/app/modul-a');

        $this->assertAuthenticatedAs($user);
        $this->withoutVite()->get('/app/modul-a')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('App')
                ->where('currentTab', 'modul-a')
                ->where('auth.user.roleName', 'district_admin')
                ->missing('auth.user.nip'));

        $this->get('/app/rbac')->assertForbidden();
    }

    public function test_login_accepts_email_identifier_and_logout_invalidates_session(): void
    {
        $user = User::factory()->create([
            'email' => 'operator@example.test',
            'nip' => 'TEST-NIP-002',
            'password' => Hash::make('Local-password-123'),
        ]);
        $role = Role::query()->create([
            'name' => 'district_admin',
            'title' => 'Admin Wilayah',
            'core_group' => 'disnaker',
            'default_tab' => 'modul-a',
        ]);
        $user->roles()->attach($role->id);

        $this->post('/login', [
            'identifier' => 'operator@example.test',
            'password' => 'Local-password-123',
        ])->assertRedirect('/app/modul-a');
        $this->assertAuthenticatedAs($user);

        $this->post('/logout')->assertRedirect('/');
        $this->assertGuest();
    }

    public function test_login_accepts_nip_identifier(): void
    {
        $user = User::factory()->create([
            'nip' => 'TEST-NIP-002',
            'password' => Hash::make('Local-password-123'),
        ]);
        $role = Role::query()->create([
            'name' => 'district_admin',
            'title' => 'Admin Wilayah',
            'core_group' => 'disnaker',
            'default_tab' => 'modul-a',
        ]);
        $user->roles()->attach($role->id);

        $this->post('/login', [
            'identifier' => 'TEST-NIP-002',
            'password' => 'Local-password-123',
        ])->assertRedirect('/app/modul-a');
        $this->assertAuthenticatedAs($user);
    }

    public function test_invalid_or_inactive_credentials_are_rejected(): void
    {
        User::factory()->create([
            'username' => 'inactive-user',
            'status' => 'Nonaktif',
            'password' => Hash::make('Local-password-123'),
        ]);

        $this->from('/login')->post('/login', [
            'identifier' => 'inactive-user',
            'password' => 'Local-password-123',
        ])->assertRedirect('/login')->assertSessionHasErrors('identifier');

        $this->from('/login')->post('/login', [
            'identifier' => 'unknown-user',
            'password' => 'wrong-password',
        ])->assertRedirect('/login')->assertSessionHasErrors('identifier');

        $this->assertGuest();
    }

    public function test_mfa_enabled_accounts_cannot_bypass_unimplemented_mfa(): void
    {
        User::factory()->create([
            'username' => 'mfa-user',
            'mfa_enabled' => true,
            'password' => Hash::make('Local-password-123'),
        ]);

        $this->from('/login')->post('/login', [
            'identifier' => 'mfa-user',
            'password' => 'Local-password-123',
        ])->assertRedirect('/login')->assertSessionHasErrors('identifier');

        $this->assertGuest();
    }

    public function test_user_without_a_role_cannot_login(): void
    {
        User::factory()->create([
            'username' => 'no-role-user',
            'password' => Hash::make('Local-password-123'),
        ]);

        $this->from('/login')->post('/login', [
            'identifier' => 'no-role-user',
            'password' => 'Local-password-123',
        ])->assertRedirect('/login')->assertSessionHasErrors('identifier');

        $this->assertGuest();
    }

    public function test_deactivated_user_session_is_invalidated(): void
    {
        $user = User::factory()->create();
        $role = Role::query()->create([
            'name' => 'district_admin',
            'title' => 'Admin Wilayah',
            'core_group' => 'disnaker',
            'default_tab' => 'modul-a',
        ]);
        $user->roles()->attach($role->id);
        $this->actingAs($user);
        $user->update(['status' => 'Nonaktif']);

        $this->get('/app/modul-a')->assertRedirect('/login');
        $this->assertGuest();
    }

    public function test_development_seeders_are_repeatable_and_use_fictional_people(): void
    {
        config()->set('smkgoglobal.demo_admin_password', 'Local-Only-Password-123');

        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseCount('roles', 13);
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('job_seekers', 1);
        $this->assertDatabaseHas('job_seekers', [
            'id' => 'CAND-DEMO-001',
            'full_name' => 'Peserta Contoh 01',
            'nik' => '0000000000000001',
        ]);
        $this->assertDatabaseHas('users', [
            'username' => 'admin-demo',
            'email' => 'admin-demo@smkgoglobal.local',
        ]);
    }
}
