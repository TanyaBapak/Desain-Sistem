<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BusinessDataPersistenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_four_business_modules_persist_and_return_database_data(): void
    {
        $this->withoutVite();
        $this->seed(ReferenceDataSeeder::class);
        $this->actingAs($this->userWithRole('task_force'));

        $this->post('/business-data/candidates', [
            'nik' => '3300000000000001',
            'fullName' => 'Peserta Contoh Baru',
            'gender' => 'P',
            'provinsi' => 'Jawa Barat',
            'kabupatenKota' => 'Kabupaten Bogor',
            'educationLevel' => 'SMK',
            'institutionName' => 'SMK Contoh',
            'sourceType' => 'Disnaker Pemda',
            'major' => 'Teknik Pengelasan',
            'skills' => ['Pengelasan dasar'],
            'languageProficiency' => [['language' => 'Jepang', 'level' => 'N4']],
            'preferredCountry' => ['Jepang'],
            'preferredJobRole' => ['Welder SMAW / GMAW'],
            'readinessStatus' => 'Needs Upskilling',
            'verificationStatus' => 'Pending Verification',
            'lifecycleStatus' => 'SUBMITTED',
        ])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertDatabaseHas('job_seekers', ['nik' => '3300000000000001', 'full_name' => 'Peserta Contoh Baru']);
        $this->assertDatabaseHas('job_seeker_skills', ['skill_name' => 'Pengelasan dasar']);
        DB::table('institutions')->insert([
            'id' => 'VOC-TEST-001',
            'name' => 'Lembaga Program Contoh',
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

        $this->post('/business-data/programs', [
            'title' => 'Pelatihan Welder Contoh',
            'programType' => 'Teknis Terpadu',
            'targetSector' => 'Manufaktur / Pengelasan',
            'targetJobRole' => 'Welder SMAW / GMAW',
            'targetCountry' => 'Jepang',
            'institutionId' => 'VOC-TEST-001',
            'durationJP' => 320,
            'certificationTarget' => 'Sertifikasi BNSP',
            'estimatedCostPerParticipant' => 12500000,
            'quota' => 30,
            'scheduleStart' => null,
            'scheduleEnd' => null,
            'curriculumOutline' => ['K3', 'Pengelasan'],
        ])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertDatabaseHas('training_programs', [
            'name' => 'Pelatihan Welder Contoh',
            'sector_id' => 'SECT-WELD',
            'occupation_id' => 'OCC-WL-01',
            'institution_id' => 'VOC-TEST-001',
        ]);

        $this->post('/business-data/providers', [
            'name' => 'Lembaga Contoh Baru',
            'providerType' => 'SMK',
            'provinsi' => 'Jawa Barat',
            'kabupatenKota' => 'Kabupaten Bogor',
            'evokasiVerificationStatus' => 'Proses Verifikasi',
            'accreditation' => 'A',
            'classCount' => 4,
            'readyParticipantCount' => 32,
            'certifiedInstructorsCount' => 4,
            'operationalReadinessScore' => 70,
            'facilities' => ['Ruang Praktik Contoh'],
            'supportedSectors' => ['Manufaktur / Pengelasan'],
            'institutionStatus' => 'Negeri',
        ])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('institutions', [
            'name' => 'Lembaga Contoh Baru',
            'district_id' => '3201',
            'class_count' => 4,
            'ready_participant_count' => 32,
            'workshop_capacity' => null,
        ]);
        $this->assertDatabaseHas('institution_facilities', ['facility_name' => 'Ruang Praktik Contoh']);

        $this->post('/business-data/demands', [
            'jobTitle' => 'Welder SMAW / GMAW',
            'employerName' => 'Pemberi Kerja Contoh Baru',
            'country' => 'Jepang',
            'sector' => 'Manufaktur / Pengelasan',
            'requiredQuota' => 10,
            'filledQuota' => 0,
            'minEducation' => 'SMK',
            'requiredSkills' => ['Pengelasan dasar'],
            'requiredLanguageLevel' => 'Jepang N4',
            'requiredCertifications' => ['Sertifikasi BNSP'],
            'deadlineDate' => '2027-12-31',
            'workTermMonths' => 36,
            'salaryRangeString' => 'JPY 180000 - 220000 per bulan',
        ])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('job_demands', [
            'headcount' => 10,
            'sector_id' => 'SECT-WELD',
            'occupation_id' => 'OCC-WL-01',
            'salary_monthly_idr' => 20900000,
        ]);

        $candidateId = DB::table('job_seekers')
            ->where('nik', '3300000000000001')
            ->value('id');
        $programId = DB::table('training_programs')
            ->where('name', 'Pelatihan Welder Contoh')
            ->value('id');
        $providerId = DB::table('institutions')
            ->where('name', 'Lembaga Contoh Baru')
            ->value('id');
        $demandId = DB::table('job_demands')
            ->where('headcount', 10)
            ->value('id');

        $this->put("/business-data/candidates/{$candidateId}", [
            'nik' => '3300••••••••0001',
            'fullName' => 'Peserta Contoh Diperbarui',
            'gender' => 'P',
            'provinsi' => 'Jawa Barat',
            'kabupatenKota' => 'Kabupaten Bogor',
            'educationLevel' => 'SMK',
            'institutionName' => 'SMK Contoh',
            'sourceType' => 'Disnaker Pemda',
            'major' => 'Teknik Pengelasan',
            'skills' => ['Pengelasan tingkat lanjut'],
            'languageProficiency' => [['language' => 'Jepang', 'level' => 'N3']],
            'preferredCountry' => ['Jepang'],
            'preferredJobRole' => ['Welder SMAW / GMAW'],
            'readinessStatus' => 'Ready for Placement',
            'verificationStatus' => 'Verified',
            'lifecycleStatus' => 'APPROVED',
        ])->assertRedirect()->assertSessionHasNoErrors();
        $this->put("/business-data/programs/{$programId}", [
            'title' => 'Program Welder Diperbarui',
            'programType' => 'Teknis Terpadu',
            'targetSector' => 'Manufaktur / Pengelasan',
            'targetJobRole' => 'Welder SMAW / GMAW',
            'targetCountry' => 'Jepang',
            'institutionId' => 'VOC-TEST-001',
            'durationJP' => 360,
            'certificationTarget' => 'Sertifikasi BNSP Lanjutan',
            'estimatedCostPerParticipant' => 15000000,
            'quota' => 35,
            'scheduleStart' => null,
            'scheduleEnd' => null,
            'curriculumOutline' => ['K3', 'Pengelasan lanjutan'],
        ])->assertRedirect()->assertSessionHasNoErrors();
        $this->put("/business-data/providers/{$providerId}", [
            'name' => 'Lembaga Contoh Diperbarui',
            'providerType' => 'SMK',
            'provinsi' => 'Jawa Barat',
            'kabupatenKota' => 'Kabupaten Bogor',
            'evokasiVerificationStatus' => 'Terverifikasi e-Vokasi',
            'accreditation' => 'A',
            'classCount' => 5,
            'readyParticipantCount' => 40,
            'certifiedInstructorsCount' => 5,
            'operationalReadinessScore' => 80,
            'facilities' => ['Ruang Praktik Contoh', 'Bengkel Contoh'],
            'supportedSectors' => ['Manufaktur / Pengelasan'],
            'institutionStatus' => 'Negeri',
        ])->assertRedirect()->assertSessionHasNoErrors();
        $this->put("/business-data/demands/{$demandId}", [
            'jobTitle' => 'Welder SMAW / GMAW',
            'employerName' => 'Pemberi Kerja Contoh Baru',
            'country' => 'Jepang',
            'sector' => 'Manufaktur / Pengelasan',
            'requiredQuota' => 12,
            'filledQuota' => 1,
            'minEducation' => 'SMK',
            'requiredSkills' => ['Pengelasan tingkat lanjut'],
            'requiredLanguageLevel' => 'Jepang N3',
            'requiredCertifications' => ['Sertifikasi BNSP Lanjutan'],
            'deadlineDate' => '2028-01-31',
            'workTermMonths' => 24,
            'salaryRangeString' => 'JPY 200000 - 240000 per bulan',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertDatabaseHas('job_seekers', ['id' => $candidateId, 'full_name' => 'Peserta Contoh Diperbarui']);
        $this->assertDatabaseHas('training_programs', ['id' => $programId, 'name' => 'Program Welder Diperbarui']);
        $this->assertDatabaseHas('institutions', ['id' => $providerId, 'name' => 'Lembaga Contoh Diperbarui', 'readiness_score' => 80]);
        $this->assertDatabaseHas('job_demands', ['id' => $demandId, 'headcount' => 12, 'filled_quota' => 1]);

        $this->get('/app/modul-a')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('businessData.candidates.0.fullName', 'Peserta Contoh Diperbarui')
                ->where('businessData.candidates.0.nik', '3300••••••••0001'));

        $this->delete("/business-data/candidates/{$candidateId}", ['reason' => 'Pencatatan uji arsip'])->assertRedirect();
        $this->delete("/business-data/programs/{$programId}")->assertRedirect();
        $this->delete("/business-data/providers/{$providerId}")->assertRedirect();
        $this->delete("/business-data/demands/{$demandId}")->assertRedirect();

        $this->assertSoftDeleted('job_seekers', ['id' => $candidateId]);
        $this->assertDatabaseHas('training_programs', ['id' => $programId, 'status' => 'Nonaktif']);
        $this->assertDatabaseHas('institutions', ['id' => $providerId, 'status' => 'Nonaktif']);
        $this->assertDatabaseHas('job_demands', ['id' => $demandId, 'verification_status' => 'Draft']);
    }

    public function test_users_cannot_write_outside_their_assigned_region(): void
    {
        $this->seed(ReferenceDataSeeder::class);
        $owner = $this->userWithRole('task_force');
        $this->actingAs($owner)->post('/business-data/candidates', [
            'nik' => '3300000000000002',
            'fullName' => 'Peserta Luar Wilayah',
            'gender' => 'L',
            'provinsi' => 'DKI Jakarta',
            'kabupatenKota' => 'Kota Jakarta Pusat',
            'educationLevel' => 'SMK',
            'institutionName' => 'SMK Contoh',
            'sourceType' => 'Disnaker Pemda',
            'major' => 'Teknik',
            'skills' => [],
            'languageProficiency' => [],
            'preferredCountry' => [],
            'preferredJobRole' => [],
            'readinessStatus' => 'Needs Upskilling',
            'verificationStatus' => 'Pending Verification',
            'lifecycleStatus' => 'SUBMITTED',
        ])->assertSessionHasNoErrors();

        $candidateId = DB::table('job_seekers')
            ->where('nik', '3300000000000002')
            ->value('id');
        $provinceAdmin = $this->userWithRole('province_admin', ['province_id' => '32']);

        $this->actingAs($provinceAdmin)
            ->delete("/business-data/candidates/{$candidateId}")
            ->assertForbidden();
    }

    private function userWithRole(string $roleName, array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
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
