<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_leadership_and_auditor_have_read_only_report_routes(): void
    {
        $this->withoutVite();
        $leadership = $this->userWithRole('leadership');

        $this->actingAs($leadership)
            ->get('/app/reports')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('App')
                ->where('auth.user.accessibleTabs', ['dashboard', 'reports'])
                ->where('businessData.candidates', [])
                ->has('businessData.reportSummary.candidateCount'));

        $this->actingAs($leadership)->get('/app/dashboard')->assertOk();
        $this->actingAs($leadership)->get('/app/audit')->assertForbidden();
        $this->actingAs($leadership)->post('/business-data/candidates', [])->assertForbidden();

        $auditor = $this->userWithRole('auditor');
        $this->actingAs($auditor)->get('/app/reports')->assertOk();
        $this->actingAs($auditor)->get('/app/modul-a')->assertForbidden();
        $this->actingAs($auditor)->get('/app/audit')->assertForbidden();
    }

    public function test_super_admin_is_limited_to_access_management_and_audit_modules(): void
    {
        $superAdmin = $this->userWithRole('super_admin');

        $this->actingAs($superAdmin)->get('/app/rbac')->assertOk();
        $this->actingAs($superAdmin)->get('/app/modul-a')->assertForbidden();
        $this->actingAs($superAdmin)->post('/business-data/candidates', [])->assertForbidden();
    }

    public function test_institution_admin_candidate_data_is_bound_to_its_institution(): void
    {
        $this->withoutVite();
        $this->seed(ReferenceDataSeeder::class);
        $institutionId = $this->createInstitution('VOC-OWN', 'Lembaga Pemilik');
        $otherInstitutionId = $this->createInstitution('VOC-OTHER', 'Lembaga Lain');
        $owner = $this->userWithRole('institution_admin', ['institution_id' => $institutionId]);
        $otherOwner = $this->userWithRole('institution_admin', ['institution_id' => $otherInstitutionId]);

        $this->actingAs($owner)->post('/business-data/candidates', $this->candidatePayload('3300000000000001'))
            ->assertRedirect()
            ->assertSessionHasNoErrors();
        $this->actingAs($otherOwner)->post('/business-data/candidates', $this->candidatePayload('3300000000000002'))
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $ownedCandidate = DB::table('job_seekers')->where('nik', '3300000000000001')->first();
        $otherCandidate = DB::table('job_seekers')->where('nik', '3300000000000002')->first();
        $this->assertSame($institutionId, $ownedCandidate->institution_id);
        $this->assertSame('Lembaga Pemilik', $ownedCandidate->institution_name);
        $this->assertSame('LPK', $ownedCandidate->source_type);
        $this->assertSame('Pending Verification', $ownedCandidate->verification_status);
        $this->assertSame('SUBMITTED', $ownedCandidate->lifecycle_status);

        $this->actingAs($owner)
            ->get('/app/modul-a')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('businessData.candidates.0.id', $ownedCandidate->id)
                ->has('businessData.candidates', 1));

        $payload = $this->candidatePayload('3300000000000002');
        $this->actingAs($owner)
            ->put("/business-data/candidates/{$otherCandidate->id}", $payload)
            ->assertForbidden();
    }

    public function test_disnaker_cannot_submit_candidate_outside_its_province(): void
    {
        $this->seed(ReferenceDataSeeder::class);
        $disnaker = $this->userWithRole('province_admin', ['province_id' => '32']);

        $this->actingAs($disnaker)
            ->post('/business-data/candidates', $this->candidatePayload('3300000000000003', 'DKI Jakarta', 'Kota Jakarta Pusat'))
            ->assertForbidden();
    }

    private function userWithRole(string $roleName, array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        $role = Role::query()->firstOrCreate(
            ['name' => $roleName],
            [
                'title' => str_replace('_', ' ', $roleName),
                'core_group' => 'test',
                'default_tab' => 'overview',
            ],
        );
        $user->roles()->attach($role->id);

        return $user;
    }

    private function createInstitution(string $id, string $name): string
    {
        DB::table('institutions')->insert([
            'id' => $id,
            'name' => $name,
            'institution_type' => 'SMK',
            'ownership_type' => 'Negeri',
            'province_id' => '32',
            'district_id' => '3201',
            'accreditation' => 'A',
            'evokasi_status' => 'Proses Verifikasi',
            'verification_status' => 'Pending Verification',
            'status' => 'Aktif',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $id;
    }

    private function candidatePayload(string $nik, string $province = 'Jawa Barat', string $district = 'Kabupaten Bogor'): array
    {
        return [
            'nik' => $nik,
            'fullName' => 'Peserta Contoh',
            'gender' => 'L',
            'provinsi' => $province,
            'kabupatenKota' => $district,
            'educationLevel' => 'SMK',
            'institutionName' => 'Institusi dari isian',
            'sourceType' => 'Disnaker Pemda',
            'major' => 'Teknik Pengelasan',
            'skills' => [],
            'languageProficiency' => [],
            'preferredCountry' => [],
            'preferredJobRole' => [],
            'readinessStatus' => 'Needs Upskilling',
            'verificationStatus' => 'Verified',
            'lifecycleStatus' => 'APPROVED',
        ];
    }
}
