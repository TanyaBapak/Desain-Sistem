<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class Kp2miVokasiSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_sync_persists_kp2mi_data_and_is_idempotent(): void
    {
        $this->withoutVite();
        $this->seed(ReferenceDataSeeder::class);
        Http::fake([
            'vokasi.kp2mi.go.id/api/proxy/vocational-institution*' => Http::response([
                'data' => [
                    [
                        'name' => 'Lembaga Contoh KP2MI',
                        'slug' => 'lembaga-contoh-kp2mi',
                        'type' => 'LPK',
                        'province' => 'Jawa Barat',
                        'sectorals' => [
                            ['sectoral' => 'Manufaktur', 'position' => 'Welder'],
                        ],
                    ],
                    [
                        'name' => 'Data tanpa provinsi',
                        'slug' => 'tanpa-provinsi',
                        'type' => 'LPK',
                        'province' => 'Provinsi Tidak Dikenal',
                    ],
                ],
                'countTotal' => 2,
            ]),
        ]);
        $this->actingAs($this->userWithRole('super_admin'));

        $this->post('/integrations/kp2mi/sync')
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('institutions', [
            'external_source' => 'kp2mi',
            'external_id' => 'lembaga-contoh-kp2mi',
            'name' => 'Lembaga Contoh KP2MI',
            'institution_type' => 'LPK',
            'province_id' => '32',
            'district_id' => null,
            'ownership_type' => null,
            'accreditation' => 'Belum diketahui',
            'evokasi_status' => 'Belum Terverifikasi',
            'verification_status' => 'Unverified',
            'workshop_capacity' => null,
            'instructor_count' => null,
            'readiness_score' => null,
        ]);
        $this->assertSame(1, DB::table('institutions')->where('external_source', 'kp2mi')->count());

        $this->post('/integrations/kp2mi/sync')
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertSame(1, DB::table('institutions')->where('external_source', 'kp2mi')->count());
        $this->assertDatabaseHas('integration_sync_logs', [
            'source' => 'kp2mi',
            'status' => 'partial',
            'records_fetched' => 2,
            'records_inserted' => 0,
            'records_updated' => 1,
            'records_skipped' => 1,
        ]);
    }

    public function test_sync_failure_is_logged_and_reported(): void
    {
        $this->withoutVite();
        Http::fake([
            'vokasi.kp2mi.go.id/api/proxy/vocational-institution*' => Http::response([], 503),
        ]);
        $this->actingAs($this->userWithRole('super_admin'));

        $this->post('/integrations/kp2mi/sync')
            ->assertRedirect()
            ->assertSessionHasErrors('sync');

        $this->assertDatabaseHas('integration_sync_logs', [
            'source' => 'kp2mi',
            'status' => 'failed',
        ]);
        $this->assertDatabaseCount('institutions', 0);
    }

    public function test_sync_rejects_malformed_api_payload(): void
    {
        $this->withoutVite();
        Http::fake([
            'vokasi.kp2mi.go.id/api/proxy/vocational-institution*' => Http::response([
                'data' => 'bukan-daftar-lembaga',
            ]),
        ]);
        $this->actingAs($this->userWithRole('super_admin'));

        $this->post('/integrations/kp2mi/sync')
            ->assertRedirect()
            ->assertSessionHasErrors('sync');

        $this->assertDatabaseHas('integration_sync_logs', [
            'source' => 'kp2mi',
            'status' => 'failed',
        ]);
        $this->assertDatabaseCount('institutions', 0);
    }

    public function test_sync_is_forbidden_for_roles_without_institution_management_access(): void
    {
        $this->actingAs($this->userWithRole('province_admin'))
            ->post('/integrations/kp2mi/sync')
            ->assertForbidden();
    }

    private function userWithRole(string $roleName): User
    {
        $user = User::factory()->create();
        $role = Role::query()->create([
            'name' => $roleName,
            'title' => str_replace('_', ' ', $roleName),
            'core_group' => 'test',
            'default_tab' => 'overview',
        ]);
        $user->roles()->attach($role->id);

        return $user;
    }
}
