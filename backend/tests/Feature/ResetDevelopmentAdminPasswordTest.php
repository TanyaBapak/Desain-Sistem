<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\AccessControlSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ResetDevelopmentAdminPasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_creates_demo_admin_with_a_database_password_and_super_admin_role(): void
    {
        $this->seed(AccessControlSeeder::class);

        $this->artisan('account:reset-demo-admin')
            ->expectsQuestion('Kata sandi baru (minimal 10 karakter)', 'Database-Password-123')
            ->expectsQuestion('Ulangi kata sandi baru', 'Database-Password-123')
            ->expectsOutputToContain('Akun admin-demo siap digunakan.')
            ->assertSuccessful();

        $user = User::query()->where('username', 'admin-demo')->firstOrFail();

        $this->assertTrue(Hash::check('Database-Password-123', $user->password));
        $this->assertDatabaseHas('model_has_roles', [
            'role_id' => Role::query()->where('name', 'super_admin')->value('id'),
            'model_type' => User::class,
            'model_id' => $user->id,
        ]);
    }

    public function test_command_rejects_a_password_confirmation_mismatch(): void
    {
        $this->seed(AccessControlSeeder::class);

        $this->artisan('account:reset-demo-admin')
            ->expectsQuestion('Kata sandi baru (minimal 10 karakter)', 'Database-Password-123')
            ->expectsQuestion('Ulangi kata sandi baru', 'Different-Password-123')
            ->expectsOutputToContain('Konfirmasi kata sandi tidak cocok.')
            ->assertFailed();

        $this->assertDatabaseMissing('users', ['username' => 'admin-demo']);
    }

    public function test_command_is_restricted_to_local_and_testing_environments(): void
    {
        $this->app->detectEnvironment(fn () => 'production');

        $this->artisan('account:reset-demo-admin')
            ->expectsOutputToContain('hanya dapat digunakan di lingkungan local atau testing.')
            ->assertFailed();

        $this->assertDatabaseMissing('users', ['username' => 'admin-demo']);
    }
}
