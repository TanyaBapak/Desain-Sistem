<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ApprovalWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ReferenceDataSeeder::class);
    }

    public function test_authorized_reviewer_persists_approval_and_updates_candidate_status(): void
    {
        $reviewer = $this->userWithRole('task_force');
        $this->createCandidateAndApproval();

        $this->actingAs($reviewer)
            ->post('/approvals/APP-TEST-001', [
                'action' => 'approve',
                'notes' => 'Data telah diperiksa.',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('approval_requests', [
            'id' => 'APP-TEST-001',
            'status' => 'APPROVED',
            'reviewed_by' => $reviewer->name,
        ]);
        $this->assertDatabaseHas('job_seekers', [
            'id' => 'CAND-APPROVAL-001',
            'verification_status' => 'Verified',
            'lifecycle_status' => 'APPROVED',
        ]);
        $this->assertDatabaseHas('approval_histories', [
            'approval_request_id' => 'APP-TEST-001',
            'actor_id' => $reviewer->id,
            'action' => 'APPROVE',
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $reviewer->id,
            'action_type' => 'PERSETUJUAN',
            'entity_id' => 'CAND-APPROVAL-001',
        ]);
    }

    public function test_only_task_force_and_verifier_can_decide_approval_requests(): void
    {
        $this->createCandidateAndApproval();

        $this->actingAs($this->userWithRole('institution_admin'))
            ->post('/approvals/APP-TEST-001', [
                'action' => 'approve',
                'notes' => 'Tidak berwenang.',
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('approval_requests', [
            'id' => 'APP-TEST-001',
            'status' => 'PENDING',
        ]);
    }

    public function test_revision_request_keeps_candidate_unverified_and_records_reason(): void
    {
        $this->createCandidateAndApproval();

        $this->actingAs($this->userWithRole('verifier'))
            ->post('/approvals/APP-TEST-001', [
                'action' => 'revision',
                'notes' => 'Mohon lengkapi dokumen pendidikan.',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('approval_requests', [
            'id' => 'APP-TEST-001',
            'status' => 'REVISION_REQUESTED',
            'revision_notes' => 'Mohon lengkapi dokumen pendidikan.',
        ]);
        $this->assertDatabaseHas('job_seekers', [
            'id' => 'CAND-APPROVAL-001',
            'verification_status' => 'Pending Verification',
            'lifecycle_status' => 'IN_REVIEW',
        ]);
        $this->assertDatabaseHas('approval_histories', [
            'approval_request_id' => 'APP-TEST-001',
            'action' => 'REVISE',
            'notes' => 'Mohon lengkapi dokumen pendidikan.',
        ]);
    }

    public function test_monitoring_and_reports_present_persisted_gardata_data_with_masked_nik(): void
    {
        $this->withoutVite();
        $this->createGardataCandidateWithTrainingRecord();
        DB::table('integration_sync_logs')->insert([
            'source' => 'gardata',
            'entity' => 'candidates_and_training_records',
            'status' => 'success',
            'records_fetched' => 1,
            'records_inserted' => 1,
            'started_at' => now()->subMinute(),
            'finished_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($this->userWithRole('task_force'))
            ->get('/app/sippmi-monitoring')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('businessData.monitoring.summary.gardataCandidates', 1)
                ->where('businessData.monitoring.candidates.0.nik', '3273••••••••0001')
                ->where('businessData.monitoring.classes.0.participantCount', 1)
                ->where('businessData.monitoring.classes.0.targetJp', 120)
                ->where('businessData.monitoring.classes.0.achievedJp', 60)
                ->where('businessData.monitoring.summary.gardataTargetJp', 120)
                ->where('businessData.monitoring.summary.gardataAchievedJp', 60)
                ->where('businessData.monitoring.lastSync.status', 'success'));

        $this->actingAs($this->userWithRole('leadership'))
            ->get('/app/reports')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('businessData.reportSummary.gardata.candidateCount', 1)
                ->where('businessData.reportSummary.gardata.trainingRecordCount', 1)
                ->where('businessData.reportSummary.gardata.lastSyncStatus', 'success'));
    }

    private function createCandidateAndApproval(): void
    {
        $this->insertCandidate('CAND-APPROVAL-001', '3273010101010001', 'Disnaker', null, null);
        DB::table('approval_requests')->insert([
            'id' => 'APP-TEST-001',
            'entity_type' => 'calon_peserta',
            'entity_id' => 'CAND-APPROVAL-001',
            'title' => 'Pengajuan peserta contoh',
            'submitted_by' => 'Operator Contoh',
            'submitted_role' => 'district_admin',
            'scope_label' => 'Kabupaten Bogor',
            'submitted_at' => now(),
            'validation_status' => 'PASSED',
            'status' => 'PENDING',
            'data_snapshot' => json_encode(['source' => 'test'], JSON_THROW_ON_ERROR),
        ]);
    }

    private function createGardataCandidateWithTrainingRecord(): void
    {
        $candidateId = 'GD-'.strtoupper(substr(hash('sha256', 'gardata-candidate'), 0, 24));
        $this->insertCandidate(
            $candidateId,
            '3273010101010001',
            'Gardata',
            'gardata',
            'gardata-candidate',
        );
        DB::table('external_training_records')->insert([
            'external_source' => 'gardata',
            'external_batch_id' => 'batch-test',
            'job_seeker_id' => $candidateId,
            'class_code' => 'CLASS-TEST',
            'batch_name' => 'Pelatihan Contoh',
            'sector_name' => 'Manufaktur',
            'program_name' => 'Pengelasan',
            'target_jp' => 120,
            'achieved_jp' => 60,
            'completion_percentage' => 50,
            'status' => 'IN_PROGRESS',
            'verified_reports_count' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function insertCandidate(
        string $id,
        string $nik,
        string $sourceType,
        ?string $externalSource,
        ?string $externalId,
    ): void {
        DB::table('job_seekers')->insert([
            'id' => $id,
            'registration_number' => 'REG-'.$id,
            'nik' => $nik,
            'full_name' => 'Peserta Contoh',
            'gender' => 'P',
            'province_id' => '32',
            'district_id' => '3273',
            'education_level' => 'SMK',
            'institution_name' => 'SMK Contoh',
            'major' => 'Teknik Pengelasan',
            'source_type' => $sourceType,
            'external_source' => $externalSource,
            'external_id' => $externalId,
            'readiness_status' => 'Needs Upskilling',
            'verification_status' => 'Pending Verification',
            'lifecycle_status' => 'SUBMITTED',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
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
