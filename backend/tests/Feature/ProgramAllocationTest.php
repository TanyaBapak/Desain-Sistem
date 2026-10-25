<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Services\ProgramSyncFromProviders;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProgramAllocationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ReferenceDataSeeder::class);
    }

    public function test_task_force_persists_allocation_as_training_class_and_enrollments(): void
    {
        $user = $this->userWithRole('task_force');
        $this->createAllocationRecords();

        $this->actingAs($user)
            ->post('/allocations', $this->allocationData())
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $allocation = DB::table('program_allocations')->first();
        $this->assertNotNull($allocation);
        $this->assertDatabaseHas('program_allocations', [
            'job_demand_id' => 'DEM-ALLOC-001',
            'training_program_id' => 'PROG-ALLOC-001',
            'institution_id' => 'VOC-ALLOC-001',
            'total_budget' => 25000000,
            'status' => 'Approved',
        ]);
        $this->assertDatabaseHas('training_classes', [
            'id' => $allocation->training_class_id,
            'capacity' => 2,
            'status' => 'Pendaftaran',
        ]);
        $this->assertDatabaseCount('program_allocation_candidates', 2);
        $this->assertDatabaseCount('training_enrollments', 2);
        $this->assertDatabaseHas('training_programs', ['id' => 'PROG-ALLOC-001', 'enrolled_count' => 2]);
        $this->assertDatabaseHas('job_demands', ['id' => 'DEM-ALLOC-001', 'filled_quota' => 2]);
        $this->assertDatabaseHas('audit_logs', [
            'action_type' => 'ALOKASI_MATCHING',
            'entity_id' => $allocation->id,
        ]);

        $this->get('/app/matching')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('businessData.allocations.0.allocationId', $allocation->id)
                ->where('businessData.allocations.0.allocatedCandidateIds', ['CAND-ALLOC-001', 'CAND-ALLOC-002'])
                ->where('businessData.allocations.0.approvalStatus', 'Approved'));
    }

    public function test_allocation_rejects_participants_when_ready_participant_count_is_insufficient(): void
    {
        $user = $this->userWithRole('task_force');
        $this->createAllocationRecords();
        DB::table('institutions')->where('id', 'VOC-ALLOC-001')->update(['ready_participant_count' => 1]);

        $this->actingAs($user)
            ->from('/app/matching')
            ->post('/allocations', $this->allocationData())
            ->assertRedirect('/app/matching')
            ->assertSessionHasErrors('candidateIds');

        $this->assertDatabaseCount('program_allocations', 0);
        $this->assertDatabaseCount('training_classes', 0);
    }

    public function test_task_force_cannot_allocate_records_outside_its_bp3mi_province(): void
    {
        $user = $this->userWithRole('task_force', ['bp3mi_code' => 'BP3MI-JKT']);
        $this->createAllocationRecords();
        $this->assertSame('BP3MI-JKT', $user->bp3mi_code);
        $this->assertSame('task_force', $user->roles()->value('name'));

        $response = $this->actingAs($user)->postJson('/allocations', $this->allocationData());

        $this->assertDatabaseCount('program_allocations', 0);
        $response->assertForbidden();
    }

    public function test_task_force_without_valid_bp3mi_assignment_is_denied(): void
    {
        $user = $this->userWithRole('task_force', ['bp3mi_code' => null]);

        $this->actingAs($user)
            ->get('/app/matching')
            ->assertForbidden();
    }

    public function test_recommended_providers_are_scoped_and_report_remaining_capacity(): void
    {
        $this->createAllocationRecords();
        DB::table('training_programs')->where('id', 'PROG-ALLOC-001')->update([
            'enrolled_count' => 3,
        ]);
        $user = $this->userWithRole('task_force');

        $this->actingAs($user)
            ->getJson('/business-data/recommended-providers?occupation_id=OCC-WL-01')
            ->assertOk()
            ->assertJsonPath('data.0.remainingCapacity', 7)
            ->assertJsonPath('data.0.available', true);

        $user->update(['bp3mi_code' => 'BP3MI-JKT']);
        $this->getJson('/business-data/recommended-providers?occupation_id=OCC-WL-01')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_program_sync_preserves_enrolled_count_when_updating_existing_programs(): void
    {
        $this->createAllocationRecords();
        DB::table('training_programs')->where('id', 'PROG-ALLOC-001')->update([
            'enrolled_count' => 4,
        ]);
        DB::table('institutions')->where('id', 'VOC-ALLOC-001')->update([
            'external_metadata' => json_encode([
                'programs' => [[
                    'name' => 'Program Welder Contoh',
                    'occupation' => 'Welder SMAW / GMAW',
                    'sector' => 'Manufaktur / Pengelasan',
                    'target_country' => 'Jepang',
                    'quota' => 10,
                ]],
            ], JSON_THROW_ON_ERROR),
        ]);

        $firstSync = app(ProgramSyncFromProviders::class)->sync();
        $secondSync = app(ProgramSyncFromProviders::class)->sync();

        $this->assertSame(1, $firstSync['updated']);
        $this->assertSame(1, $secondSync['updated']);
        $this->assertDatabaseCount('training_programs', 1);
        $this->assertDatabaseHas('training_programs', [
            'id' => 'PROG-ALLOC-001',
            'enrolled_count' => 4,
        ]);
    }

    public function test_non_task_force_users_cannot_create_allocations(): void
    {
        $this->createAllocationRecords();

        $this->actingAs($this->userWithRole('directorate_admin'))
            ->post('/allocations', $this->allocationData())
            ->assertForbidden();

        $this->assertDatabaseCount('program_allocations', 0);
    }

    public function test_matching_stage_uses_persisted_candidate_match_results(): void
    {
        $user = $this->userWithRole('task_force');
        $this->createAllocationRecords();
        DB::table('job_seekers')->where('id', 'CAND-ALLOC-001')->update([
            'verification_status' => 'Verified',
        ]);
        DB::table('matching_runs')->insert([
            'id' => 'MATCH-RUN-ALLOC-001',
            'job_demand_id' => 'DEM-ALLOC-001',
            'run_date' => now(),
            'total_candidates_analyzed' => 1,
            'matches_found' => 1,
            'algorithm_version' => 'test',
        ]);
        DB::table('candidate_matches')->insert([
            'matching_run_id' => 'MATCH-RUN-ALLOC-001',
            'job_demand_id' => 'DEM-ALLOC-001',
            'job_seeker_id' => 'CAND-ALLOC-001',
            'match_score' => 76.5,
            'match_status' => 'Rekomendasi',
            'match_explanation' => 'Hasil matching tersimpan untuk pengujian.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($user)
            ->get('/app/matching')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('businessData.candidateMatches.0.candidateId', 'CAND-ALLOC-001')
                ->where('businessData.candidateMatches.0.matchScore', 76.5)
                ->where('businessData.candidateMatches.0.explanation', 'Hasil matching tersimpan untuk pengujian.')
                ->where('businessData.demands.0.verificationStatus', 'Approved'));

        DB::table('job_demands')->where('id', 'DEM-ALLOC-001')->update(['verification_status' => 'Pending']);
        app(\App\Services\BusinessDataPresenter::class)->forget($user);

        $this->get('/app/matching')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('businessData.candidateMatches', 0));
    }

    public function test_training_and_placement_stages_present_database_records(): void
    {
        $user = $this->userWithRole('task_force');
        $this->createAllocationRecords();
        $this->actingAs($user)->post('/allocations', $this->allocationData())->assertSessionHasNoErrors();

        $classId = DB::table('program_allocations')->value('training_class_id');
        DB::table('training_enrollments')->where('training_class_id', $classId)->update([
            'attendance_percent' => 84,
            'assessment_score' => 91,
        ]);
        DB::table('matching_runs')->insert([
            'id' => 'MATCH-RUN-PLACEMENT-001',
            'job_demand_id' => 'DEM-ALLOC-001',
            'run_date' => now(),
            'total_candidates_analyzed' => 1,
            'matches_found' => 1,
            'algorithm_version' => 'test',
        ]);
        $matchId = DB::table('candidate_matches')->insertGetId([
            'matching_run_id' => 'MATCH-RUN-PLACEMENT-001',
            'job_demand_id' => 'DEM-ALLOC-001',
            'job_seeker_id' => 'CAND-ALLOC-001',
            'training_class_id' => $classId,
            'match_score' => 82,
            'match_status' => 'Dialokasikan',
            'match_explanation' => 'Alokasi tersimpan.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('placement_cases')->insert([
            'id' => 'PLACEMENT-ALLOC-001',
            'candidate_match_id' => $matchId,
            'status' => 'Siap Berangkat',
            'flight_date' => '2026-12-20',
            'siskop2mi_id' => 'SISKOP-CONTOH-001',
            'started_at' => now(),
        ]);

        $this->actingAs($user)
            ->get('/app/matching')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('businessData.monitoring.classes.0.averageAttendance', 84)
                ->where('businessData.monitoring.classes.0.averageAssessmentScore', 91)
                ->where('businessData.monitoring.placements.0.id', 'PLACEMENT-ALLOC-001')
                ->where('businessData.monitoring.placements.0.siskop2miId', 'SISKOP-CONTOH-001'));

        DB::table('job_seekers')->where('id', 'CAND-ALLOC-001')->update([
            'province_id' => '31',
            'district_id' => '3171',
        ]);
        app(\App\Services\BusinessDataPresenter::class)->forget($user);

        $this->get('/app/matching')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('businessData.monitoring.placements', 0));
    }

    public function test_allocation_can_be_finalized_and_archived_with_quota_restored(): void
    {
        $this->actingAs($this->userWithRole('task_force'));
        $this->createAllocationRecords();
        $this->post('/allocations', $this->allocationData())->assertSessionHasNoErrors();
        $allocationId = DB::table('program_allocations')->value('id');

        $this->patch("/allocations/{$allocationId}", ['status' => 'Finalized'])
            ->assertRedirect()
            ->assertSessionHasNoErrors();
        $this->assertDatabaseHas('program_allocations', ['id' => $allocationId, 'status' => 'Finalized']);
        $this->assertDatabaseHas('training_classes', ['status' => 'Sedang Berjalan']);

        $this->delete("/allocations/{$allocationId}", ['reason' => 'Kesalahan penetapan'])
            ->assertStatus(409);

        $this->assertDatabaseHas('program_allocations', ['id' => $allocationId, 'deleted_at' => null]);
    }

    public function test_approved_allocation_can_be_cancelled_and_quotas_are_restored(): void
    {
        $this->actingAs($this->userWithRole('task_force'));
        $this->createAllocationRecords();
        $this->post('/allocations', $this->allocationData())->assertSessionHasNoErrors();
        $allocationId = DB::table('program_allocations')->value('id');

        $this->delete("/allocations/{$allocationId}", ['reason' => 'Perubahan kebutuhan demand'])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseMissing('program_allocations', ['id' => $allocationId, 'deleted_at' => null]);
        $this->assertDatabaseHas('training_classes', [
            'status' => 'Dibatalkan',
            'id' => DB::table('program_allocations')->where('id', $allocationId)->value('training_class_id'),
        ]);
        $this->assertDatabaseHas('training_enrollments', ['status' => 'Mengundurkan Diri']);
        $this->assertDatabaseHas('training_programs', ['id' => 'PROG-ALLOC-001', 'enrolled_count' => 0]);
        $this->assertDatabaseHas('job_demands', ['id' => 'DEM-ALLOC-001', 'filled_quota' => 0]);
        $this->assertDatabaseCount('audit_logs', 2);
    }

    private function createAllocationRecords(): void
    {
        DB::table('institutions')->insert([
            'id' => 'VOC-ALLOC-001',
            'name' => 'Lembaga Vokasi Contoh',
            'institution_type' => 'SMK',
            'ownership_type' => 'Negeri',
            'province_id' => '32',
            'district_id' => '3201',
            'workshop_capacity' => 10,
            'class_count' => 2,
            'ready_participant_count' => 10,
            'accreditation' => 'A',
            'evokasi_status' => 'Terverifikasi e-Vokasi',
            'verification_status' => 'Verified',
            'status' => 'Aktif',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('training_programs')->insert([
            'id' => 'PROG-ALLOC-001',
            'name' => 'Program Welder Contoh',
            'program_type' => 'Teknis Terpadu',
            'sector_id' => 'SECT-WELD',
            'occupation_id' => 'OCC-WL-01',
            'target_country_id' => 'JP',
            'total_jp' => 320,
            'certification_target' => 'Sertifikasi Contoh',
            'cost_per_participant' => 12500000,
            'quota' => 10,
            'enrolled_count' => 0,
            'status' => 'Aktif',
            'institution_id' => 'VOC-ALLOC-001',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('employers')->insert([
            'id' => 'EMP-ALLOC-001',
            'name' => 'Pemberi Kerja Contoh',
            'country_id' => 'JP',
            'industry' => 'Manufaktur',
            'verification_status' => 'Verified',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('job_demands')->insert([
            'id' => 'DEM-ALLOC-001',
            'employer_id' => 'EMP-ALLOC-001',
            'country_id' => 'JP',
            'sector_id' => 'SECT-WELD',
            'occupation_id' => 'OCC-WL-01',
            'headcount' => 10,
            'filled_quota' => 0,
            'deadline' => '2027-12-31',
            'placement_track' => 'P to P',
            'verification_status' => 'Approved',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        foreach (['CAND-ALLOC-001', 'CAND-ALLOC-002'] as $index => $candidateId) {
            DB::table('job_seekers')->insert([
                'id' => $candidateId,
                'registration_number' => 'REG-'.$candidateId,
                'nik' => '330000000000000'.($index + 1),
                'full_name' => 'Peserta Contoh '.($index + 1),
                'gender' => 'P',
                'province_id' => '32',
                'district_id' => '3201',
                'education_level' => 'SMK',
                'institution_name' => 'SMK Contoh',
                'major' => 'Teknik Pengelasan',
                'source_type' => 'Disnaker',
                'readiness_status' => 'Ready for Placement',
                'preferred_countries' => json_encode(['Jepang'], JSON_THROW_ON_ERROR),
                'verification_status' => 'Verified',
                'lifecycle_status' => 'APPROVED',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function allocationData(): array
    {
        return [
            'demandId' => 'DEM-ALLOC-001',
            'programId' => 'PROG-ALLOC-001',
            'providerId' => 'VOC-ALLOC-001',
            'candidateIds' => ['CAND-ALLOC-001', 'CAND-ALLOC-002'],
            'startDate' => '2026-12-01',
            'endDate' => '2027-03-31',
        ];
    }

    private function userWithRole(string $roleName, array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        $role = Role::query()->create([
            'name' => $roleName,
            'title' => str_replace('_', ' ', $roleName),
            'core_group' => 'test',
            'default_tab' => 'matching',
        ]);
        $user->roles()->attach($role->id);

        return $user;
    }
}
