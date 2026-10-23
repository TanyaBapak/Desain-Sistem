<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\AccessControlSeeder;
use Database\Seeders\ProductionDemoPreviewSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Tests\TestCase;

class ProductionDemoPreviewSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_preview_seeder_is_disabled_unless_explicitly_enabled(): void
    {
        config(['smkgoglobal.demo_preview_enabled' => false]);

        try {
            $this->seed(ProductionDemoPreviewSeeder::class);
            $this->fail('Expected preview seeder to reject disabled configuration.');
        } catch (RuntimeException $exception) {
            $this->assertStringContainsString('DEMO_PREVIEW_ENABLED=true', $exception->getMessage());
        }

        $this->assertDatabaseMissing('training_programs', ['id' => 'PROG-DEMO-001']);
    }

    public function test_explicitly_enabled_preview_seeder_creates_demo_data_and_role_accounts_without_shared_passwords(): void
    {
        $this->seed([
            ReferenceDataSeeder::class,
            AccessControlSeeder::class,
        ]);
        config(['smkgoglobal.demo_preview_enabled' => true]);

        $this->seed(ProductionDemoPreviewSeeder::class);
        $this->seed(ProductionDemoPreviewSeeder::class);

        $accounts = User::query()
            ->where('username', 'like', 'demo-%')
            ->with('roles')
            ->get();

        $this->assertSame(12, $accounts->count());
        $this->assertDatabaseHas('training_programs', [
            'id' => 'PROG-DEMO-001',
            'name' => 'Program Contoh Pengelasan Dasar',
        ]);
        $this->assertDatabaseHas('candidate_matches', [
            'job_demand_id' => 'DEM-DEMO-001',
            'job_seeker_id' => 'CAND-DEMO-001',
        ]);
        $this->assertSame('leadership', $accounts->firstWhere('username', 'demo-pimpinan')->roles->first()->name);
        $this->assertSame('district_admin', $accounts->firstWhere('username', 'demo-disnaker-kabupaten')->roles->first()->name);
        $this->assertSame('institution_admin', $accounts->firstWhere('username', 'demo-lembaga-vokasi')->roles->first()->name);
        $this->assertFalse(Hash::check('kata-sandi-demo-aman', $accounts->first()->password));
        $this->assertDatabaseMissing('users', ['username' => 'admin-demo']);
    }
}
