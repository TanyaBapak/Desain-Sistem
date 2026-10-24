<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\AccessControlSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class InstitutionRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_registration_stores_institution_documents_and_suspended_account(): void
    {
        Storage::fake('local');
        $this->seed([ReferenceDataSeeder::class, AccessControlSeeder::class]);

        $this->withoutVite()->get('/lembaga/daftar')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('App')
                ->where('showInstitutionRegistration', true)
                ->has('registrationOptions.provinces'));

        $this->post('/lembaga/daftar', $this->registrationPayload())
            ->assertRedirect('/login');

        $institution = DB::table('institutions')->where('npsn_or_vin', 'NPSN-CONTOH-001')->first();
        $user = User::query()->where('email', 'lembaga@example.test')->firstOrFail();

        $this->assertNotNull($institution);
        $this->assertSame('Pending Verification', $institution->verification_status);
        $this->assertNotNull($institution->registration_consented_at);
        $this->assertSame('2026-10-v1', $institution->registration_consent_version);
        $this->assertSame('Ditangguhkan', $user->status);
        $this->assertSame($institution->id, $user->institution_id);
        $this->assertSame('institution_admin', $user->roles()->value('name'));
        $this->assertDatabaseHas('approval_requests', [
            'entity_type' => 'lembaga_vokasi',
            'entity_id' => $institution->id,
            'status' => 'PENDING',
        ]);
        $this->assertDatabaseCount('institution_registration_documents', 2);
        $this->assertCount(2, Storage::disk('local')->allFiles('institution-registration/'.$institution->id));
    }

    public function test_only_authorized_verifiers_can_download_documents_and_approval_activates_applicant(): void
    {
        Storage::fake('local');
        $this->seed([ReferenceDataSeeder::class, AccessControlSeeder::class]);
        $this->post('/lembaga/daftar', $this->registrationPayload())->assertRedirect('/login');

        $institution = DB::table('institutions')->where('npsn_or_vin', 'NPSN-CONTOH-001')->firstOrFail();
        $document = DB::table('institution_registration_documents')
            ->where('institution_id', $institution->id)
            ->firstOrFail();
        $approval = DB::table('approval_requests')
            ->where('entity_type', 'lembaga_vokasi')
            ->where('entity_id', $institution->id)
            ->firstOrFail();

        $this->from('/login')->post('/login', [
            'identifier' => 'lembaga@example.test',
            'password' => 'Pendaftaran-Aman-123',
        ])->assertRedirect('/login')->assertSessionHasErrors('identifier');

        $outsider = User::factory()->create();
        $this->actingAs($outsider)
            ->get(route('approvals.documents.download', [$approval->id, $document->id]))
            ->assertForbidden();

        $verifier = $this->userWithRole('task_force');
        $this->actingAs($verifier)
            ->get(route('approvals.documents.download', [$approval->id, $document->id]))
            ->assertOk();
        $this->actingAs($verifier)
            ->post("/approvals/{$approval->id}", ['action' => 'approve'])
            ->assertRedirect();

        $applicant = User::query()->where('email', 'lembaga@example.test')->firstOrFail();
        $this->assertSame('Aktif', $applicant->status);
        $this->assertSame('Verified', DB::table('institutions')->where('id', $institution->id)->value('verification_status'));
        $this->post('/login', [
            'identifier' => 'lembaga@example.test',
            'password' => 'Pendaftaran-Aman-123',
        ])->assertRedirect('/app/modul-a');
    }

    public function test_registration_rejects_invalid_region_duplicate_identifier_and_large_files(): void
    {
        Storage::fake('local');
        $this->seed([ReferenceDataSeeder::class, AccessControlSeeder::class]);

        $invalidRegion = $this->registrationPayload();
        $invalidRegion['districtId'] = '1101';
        $this->from('/lembaga/daftar')->post('/lembaga/daftar', $invalidRegion)
            ->assertRedirect('/lembaga/daftar')
            ->assertSessionHasErrors('districtId');

        $largeFile = $this->registrationPayload();
        $largeFile['operationalPermit'] = UploadedFile::fake()->create('izin.pdf', 6000, 'application/pdf');
        $this->from('/lembaga/daftar')->post('/lembaga/daftar', $largeFile)
            ->assertRedirect('/lembaga/daftar')
            ->assertSessionHasErrors('operationalPermit');

        $this->assertDatabaseCount('institutions', 0);
        $this->assertDatabaseCount('users', 0);
    }

    private function registrationPayload(): array
    {
        return [
            'institutionName' => 'Lembaga Contoh Vokasi',
            'institutionType' => 'LPK',
            'ownershipType' => 'Swasta',
            'registrationNumber' => 'NPSN-CONTOH-001',
            'provinceId' => '32',
            'districtId' => '3201',
            'address' => 'Alamat lembaga contoh untuk pengujian',
            'headName' => 'Pengelola Contoh',
            'contactEmail' => 'lembaga@example.test',
            'contactPhone' => '080000000000',
            'accreditation' => 'B',
            'instructorCount' => '8',
            'batchCapacity' => '24',
            'supportedSectors' => 'Kesehatan, Manufaktur',
            'password' => 'Pendaftaran-Aman-123',
            'password_confirmation' => 'Pendaftaran-Aman-123',
            'consent' => '1',
            'operationalPermit' => UploadedFile::fake()->create('izin.pdf', 100, 'application/pdf'),
            'institutionProfile' => UploadedFile::fake()->create('profil.pdf', 100, 'application/pdf'),
        ];
    }

    private function userWithRole(string $roleName): User
    {
        $user = User::factory()->create();
        $role = Role::query()->where('name', $roleName)->firstOrFail();
        $user->roles()->attach($role->id);

        return $user;
    }
}
