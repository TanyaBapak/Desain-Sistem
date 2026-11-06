<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Services\CandidateInstitutionReconciliationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CandidateInstitutionReconciliationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_reconciliation_service_rebinds_candidates_by_creator_and_organization(): void
    {
        // 1. Buat institusi vokasi
        $instId = 'VOC-TEST-001';
        DB::table('institutions')->updateOrInsert(
            ['id' => $instId],
            [
                'name' => 'Institut Kesehatan Nusantara Test',
                'province_id' => '32',
                'district_id' => '3273',
                'institution_type' => 'LPK',
                'status' => 'Aktif',
                'verification_status' => 'Verified',
                'evokasi_status' => 'Terverifikasi e-Vokasi',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        // 2. Buat user operator lembaga
        $user = User::factory()->create([
            'username' => 'operator.nusantara',
            'name' => 'dr. Budi Santoso',
            'organization' => 'Institut Kesehatan Nusantara Test',
            'institution_id' => $instId,
            'scope_level' => 'lembaga',
            'scope_name' => 'Institut Kesehatan Nusantara Test',
        ]);
        $instRole = Role::query()->where('name', 'institution_admin')->firstOrFail();
        $user->roles()->sync([$instRole->id]);

        // 3. Masukkan kandidat yang terlanjur ter-bind ke demo / fallback
        $candId1 = 'CAND-TEST-REC-001';
        $candId2 = 'CAND-TEST-REC-002';
        DB::table('job_seekers')->insert([
            [
                'id' => $candId1,
                'registration_number' => 'REG-REC-001',
                'nik' => '3273000000000001',
                'full_name' => 'Peserta A',
                'gender' => 'L',
                'province_id' => '32',
                'district_id' => '3273',
                'education_level' => 'D3',
                'institution_name' => 'SMK Contoh Cibinong',
                'institution_id' => 'VOC-DEMO-001',
                'major' => 'Keperawatan',
                'source_type' => 'LPK',
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'created_by' => 'Institut Kesehatan Nusantara Test',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => $candId2,
                'registration_number' => 'REG-REC-002',
                'nik' => '3273000000000002',
                'full_name' => 'Peserta B',
                'gender' => 'P',
                'province_id' => '32',
                'district_id' => '3273',
                'education_level' => 'D3',
                'institution_name' => 'SMK Contoh Cibinong',
                'institution_id' => 'VOC-DEMO-001',
                'major' => 'Kebidanan',
                'source_type' => 'LPK',
                'readiness_status' => 'Needs Upskilling',
                'verification_status' => 'Pending Verification',
                'created_by' => 'dr. Budi Santoso',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // 4. Jalankan rekonsiliasi
        $service = app(CandidateInstitutionReconciliationService::class);
        $reconciledCount = $service->reconcileForUser($user);

        $this->assertEquals(2, $reconciledCount);

        // Verifikasi di database: kedua peserta kini memiliki institution_id dan institution_name yang tepat
        $cand1 = DB::table('job_seekers')->where('id', $candId1)->first();
        $cand2 = DB::table('job_seekers')->where('id', $candId2)->first();

        $this->assertEquals($instId, $cand1->institution_id);
        $this->assertEquals('Institut Kesehatan Nusantara Test', $cand1->institution_name);
        $this->assertEquals($instId, $cand2->institution_id);
        $this->assertEquals('Institut Kesehatan Nusantara Test', $cand2->institution_name);

        // Verifikasi count pada institusi ter-update
        $inst = DB::table('institutions')->where('id', $instId)->first();
        $this->assertEquals(2, $inst->total_active_students);
        $this->assertEquals(1, $inst->ready_participant_count);
    }

    public function test_artisan_command_reconciles_all_candidates(): void
    {
        $instId = 'VOC-CMD-001';
        DB::table('institutions')->updateOrInsert(
            ['id' => $instId],
            [
                'name' => 'Akademi Keperawatan Medika Mandiri',
                'province_id' => '33',
                'district_id' => '3372',
                'institution_type' => 'LPK',
                'status' => 'Aktif',
                'verification_status' => 'Verified',
                'evokasi_status' => 'Terverifikasi e-Vokasi',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        $user = User::factory()->create([
            'username' => 'akper.medika',
            'name' => 'Operator Akper Medika',
            'organization' => 'Akademi Keperawatan Medika Mandiri',
            'institution_id' => $instId,
            'scope_level' => 'lembaga',
            'scope_name' => 'Akademi Keperawatan Medika Mandiri',
        ]);
        $instRole = Role::query()->where('name', 'institution_admin')->firstOrFail();
        $user->roles()->sync([$instRole->id]);

        $candId = 'CAND-TEST-CMD-001';
        DB::table('job_seekers')->insert([
            'id' => $candId,
            'registration_number' => 'REG-CMD-001',
            'nik' => '3372000000000099',
            'full_name' => 'Peserta CMD',
            'gender' => 'L',
            'province_id' => '33',
            'district_id' => '3372',
            'education_level' => 'D3',
            'institution_name' => 'SMK Contoh Cibinong',
            'institution_id' => 'VOC-DEMO-001',
            'major' => 'Keperawatan',
            'source_type' => 'LPK',
            'readiness_status' => 'Ready for Placement',
            'verification_status' => 'Verified',
            'created_by' => 'Akademi Keperawatan Medika Mandiri',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->artisan('sippmi:reconcile-institution-candidates')
            ->expectsOutputToContain('Peserta yang direkonsiliasi')
            ->assertSuccessful();

        $cand = DB::table('job_seekers')->where('id', $candId)->first();
        $this->assertEquals($instId, $cand->institution_id);
        $this->assertEquals('Akademi Keperawatan Medika Mandiri', $cand->institution_name);
    }

    public function test_deleting_candidate_updates_institution_participant_counts(): void
    {
        $instId = 'VOC-TEST-DEL-001';
        DB::table('institutions')->updateOrInsert(
            ['id' => $instId],
            [
                'name' => 'LPK Uji Penghapusan Siswa',
                'province_id' => '33',
                'district_id' => '3372',
                'institution_type' => 'LPK',
                'status' => 'Aktif',
                'verification_status' => 'Verified',
                'evokasi_status' => 'Terverifikasi e-Vokasi',
                'ready_participant_count' => 0,
                'total_active_students' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        $candId = 'CAND-TEST-DEL-001';
        DB::table('job_seekers')->insert([
            'id' => $candId,
            'registration_number' => 'REG-DEL-001',
            'nik' => '3372000000000077',
            'full_name' => 'Peserta Uji Hapus',
            'gender' => 'L',
            'province_id' => '33',
            'district_id' => '3372',
            'education_level' => 'SMK',
            'institution_name' => 'LPK Uji Penghapusan Siswa',
            'institution_id' => $instId,
            'major' => 'Manufaktur',
            'source_type' => 'LPK',
            'readiness_status' => 'Ready for Placement',
            'verification_status' => 'Verified',
            'created_by' => 'Admin Task Force',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        app(CandidateInstitutionReconciliationService::class)->syncInstitutionCountForId($instId);

        $instBefore = DB::table('institutions')->where('id', $instId)->first();
        $this->assertEquals(1, $instBefore->total_active_students);
        $this->assertEquals(1, $instBefore->ready_participant_count);

        $admin = User::factory()->create();
        $tfRole = DB::table('roles')->where('name', 'task_force')->first();
        $admin->roles()->sync([$tfRole->id]);

        $this->actingAs($admin)
            ->deleteJson("/business-data/candidates/{$candId}", ['reason' => 'Uji penghapusan'])
            ->assertSuccessful();

        $this->assertSoftDeleted('job_seekers', ['id' => $candId]);

        $instAfter = DB::table('institutions')->where('id', $instId)->first();
        $this->assertEquals(0, $instAfter->total_active_students);
        $this->assertEquals(0, $instAfter->ready_participant_count);
    }

    public function test_batch_deleting_candidates_updates_institution_participant_counts(): void
    {
        $instId = 'VOC-TEST-BATCH-001';
        DB::table('institutions')->updateOrInsert(
            ['id' => $instId],
            [
                'name' => 'LPK Uji Batch Delete Siswa',
                'province_id' => '33',
                'district_id' => '3372',
                'institution_type' => 'LPK',
                'status' => 'Aktif',
                'verification_status' => 'Verified',
                'evokasi_status' => 'Terverifikasi e-Vokasi',
                'ready_participant_count' => 0,
                'total_active_students' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        $candId1 = 'CAND-BATCH-001';
        $candId2 = 'CAND-BATCH-002';
        DB::table('job_seekers')->insert([
            [
                'id' => $candId1,
                'registration_number' => 'REG-BATCH-001',
                'nik' => '3372000000000088',
                'full_name' => 'Peserta Batch Satu',
                'gender' => 'L',
                'province_id' => '33',
                'district_id' => '3372',
                'education_level' => 'SMK',
                'institution_name' => 'LPK Uji Batch Delete Siswa',
                'institution_id' => $instId,
                'major' => 'Manufaktur',
                'source_type' => 'LPK',
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'created_by' => 'Admin Task Force',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => $candId2,
                'registration_number' => 'REG-BATCH-002',
                'nik' => '3372000000000089',
                'full_name' => 'Peserta Batch Dua',
                'gender' => 'P',
                'province_id' => '33',
                'district_id' => '3372',
                'education_level' => 'SMK',
                'institution_name' => 'LPK Uji Batch Delete Siswa',
                'institution_id' => $instId,
                'major' => 'Hospitality',
                'source_type' => 'LPK',
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'created_by' => 'Admin Task Force',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        app(CandidateInstitutionReconciliationService::class)->syncInstitutionCountForId($instId);

        $instBefore = DB::table('institutions')->where('id', $instId)->first();
        $this->assertEquals(2, $instBefore->total_active_students);
        $this->assertEquals(2, $instBefore->ready_participant_count);

        $admin = User::factory()->create();
        $tfRole = DB::table('roles')->where('name', 'task_force')->first();
        $admin->roles()->sync([$tfRole->id]);

        $this->actingAs($admin)
            ->postJson('/business-data/candidates/batch-destroy', [
                'ids' => [$candId1, $candId2],
                'reason' => 'Uji penghapusan masal',
            ])
            ->assertSuccessful()
            ->assertJson([
                'success' => true,
                'count' => 2,
            ]);

        $this->assertSoftDeleted('job_seekers', ['id' => $candId1]);
        $this->assertSoftDeleted('job_seekers', ['id' => $candId2]);

        $instAfter = DB::table('institutions')->where('id', $instId)->first();
        $this->assertEquals(0, $instAfter->total_active_students);
        $this->assertEquals(0, $instAfter->ready_participant_count);
    }
}
