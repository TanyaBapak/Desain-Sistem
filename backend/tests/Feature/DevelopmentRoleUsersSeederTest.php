<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\AccessControlSeeder;
use Database\Seeders\DemoDataSeeder;
use Database\Seeders\DevelopmentRoleUsersSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DevelopmentRoleUsersSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_seeds_login_accounts_for_non_admin_roles_with_scoped_demo_data(): void
    {
        config(['smkgoglobal.demo_admin_password' => 'kata-sandi-demo-aman']);
        $this->seed([
            ReferenceDataSeeder::class,
            AccessControlSeeder::class,
            DemoDataSeeder::class,
            DevelopmentRoleUsersSeeder::class,
        ]);

        $accounts = User::query()
            ->where('username', 'like', 'demo-%')
            ->with('roles')
            ->get();

        $this->assertCount(12, $accounts);
        $this->assertTrue(Hash::check('kata-sandi-demo-aman', $accounts->firstWhere('username', 'demo-auditor')->password));
        $this->assertSame('leadership', $accounts->firstWhere('username', 'demo-pimpinan')->roles->first()->name);
        $this->assertSame('province_admin', $accounts->firstWhere('username', 'demo-disnaker-provinsi')->roles->first()->name);
        $this->assertSame('32', $accounts->firstWhere('username', 'demo-disnaker-provinsi')->province_id);
        $this->assertSame('3271', $accounts->firstWhere('username', 'demo-disnaker-kabupaten')->district_id);
        $this->assertSame('VOC-DEMO-001', $accounts->firstWhere('username', 'demo-lembaga-vokasi')->institution_id);
        $this->assertSame('EMP-DEMO-001', $accounts->firstWhere('username', 'demo-pengelola-demand')->employer_id);
        $this->post('/login', [
            'identifier' => 'demo-disnaker-provinsi',
            'password' => 'kata-sandi-demo-aman',
        ])->assertRedirect(route('app.show', 'modul-a'));

        $this->seed(DevelopmentRoleUsersSeeder::class);
        $this->assertSame(12, User::query()->where('username', 'like', 'demo-%')->count());
    }

    public function test_it_reuses_the_existing_demo_admin_password_when_environment_password_is_unset(): void
    {
        config(['smkgoglobal.demo_admin_password' => null]);
        $this->seed([
            ReferenceDataSeeder::class,
            AccessControlSeeder::class,
            DemoDataSeeder::class,
        ]);
        $admin = User::factory()->create([
            'username' => 'admin-demo',
            'password' => Hash::make('existing-local-demo-password'),
        ]);
        DB::table('model_has_roles')->insert([
            'role_id' => 1,
            'model_type' => User::class,
            'model_id' => $admin->id,
        ]);

        $this->seed(DevelopmentRoleUsersSeeder::class);

        $demoUser = User::query()->where('username', 'demo-auditor')->firstOrFail();
        $this->assertSame($admin->password, $demoUser->password);
        $this->assertTrue(Hash::check('existing-local-demo-password', $demoUser->password));
    }
}
