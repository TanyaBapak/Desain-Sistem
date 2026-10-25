<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Services\BusinessDataPresenter;
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

    public function test_task_force_cannot_decide_an_approval_outside_its_bp3mi_province(): void
    {
        $this->createCandidateAndApproval();
        DB::table('job_seekers')->where('id', 'CAND-APPROVAL-001')->update([
            'province_id' => '31',
            'district_id' => '3171',
        ]);

        $this->actingAs($this->userWithRole('task_force'))
            ->post('/approvals/APP-TEST-001', [
                'action' => 'approve',
                'notes' => 'Data telah diperiksa.',
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

    public function test_bulk_approval_updates_every_selected_request_and_records_audit(): void
    {
        $this->createCandidateAndApproval();
        $this->insertCandidate('CAND-APPROVAL-002', '3273010101010002', 'Disnaker', null, null);
        DB::table('approval_requests')->insert([
            'id' => 'APP-TEST-002',
            'entity_type' => 'calon_peserta',
            'entity_id' => 'CAND-APPROVAL-002',
            'title' => 'Pengajuan peserta kedua',
            'submitted_by' => 'Operator Contoh',
            'submitted_role' => 'district_admin',
            'scope_label' => 'Kabupaten Bogor',
            'submitted_at' => now(),
            'validation_status' => 'PASSED',
            'status' => 'PENDING',
            'data_snapshot' => json_encode(['source' => 'test'], JSON_THROW_ON_ERROR),
        ]);
        $reviewer = $this->userWithRole('verifier');

        $this->actingAs($reviewer)
            ->post('/approvals/bulk', ['ids' => ['APP-TEST-001', 'APP-TEST-002']])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertSame(2, DB::table('approval_requests')->whereIn('id', ['APP-TEST-001', 'APP-TEST-002'])->where('status', 'APPROVED')->count());
        $this->assertSame(2, DB::table('approval_histories')->whereIn('approval_request_id', ['APP-TEST-001', 'APP-TEST-002'])->where('action', 'APPROVE')->count());
        $this->assertSame(2, DB::table('audit_logs')->where('user_id', $reviewer->id)->where('action_type', 'PERSETUJUAN')->count());
    }

    public function test_bulk_approval_is_atomic_when_one_request_is_no_longer_pending(): void
    {
        $this->createCandidateAndApproval();
        DB::table('approval_requests')->insert([
            'id' => 'APP-TEST-002',
            'entity_type' => 'calon_peserta',
            'entity_id' => 'CAND-APPROVAL-001',
            'title' => 'Usulan yang sudah diproses',
            'submitted_by' => 'Operator Contoh',
            'submitted_role' => 'district_admin',
            'scope_label' => 'Kabupaten Bogor',
            'submitted_at' => now(),
            'validation_status' => 'PASSED',
            'status' => 'APPROVED',
            'data_snapshot' => json_encode(['source' => 'test'], JSON_THROW_ON_ERROR),
        ]);

        $this->actingAs($this->userWithRole('verifier'))
            ->post('/approvals/bulk', ['ids' => ['APP-TEST-001', 'APP-TEST-002']])
            ->assertStatus(409);

        $this->assertDatabaseHas('approval_requests', ['id' => 'APP-TEST-001', 'status' => 'PENDING']);
        $this->assertDatabaseMissing('approval_histories', ['approval_request_id' => 'APP-TEST-001', 'action' => 'APPROVE']);
    }

    public function test_approval_list_is_paginated_and_search_filters_are_applied_server_side(): void
    {
        $this->createCandidateAndApproval();
        foreach (range(2, 31) as $index) {
            DB::table('approval_requests')->insert([
                'id' => sprintf('APP-PAGE-%03d', $index),
                'entity_type' => 'calon_peserta',
                'entity_id' => 'CAND-APPROVAL-001',
                'title' => $index === 31 ? 'Permintaan khusus Surakarta' : "Usulan contoh {$index}",
                'submitted_by' => 'Operator Contoh',
                'submitted_role' => 'district_admin',
                'scope_label' => 'Kabupaten Bogor',
                'submitted_at' => now()->subSeconds($index),
                'validation_status' => 'PASSED',
                'status' => 'PENDING',
                'data_snapshot' => json_encode(['source' => 'test'], JSON_THROW_ON_ERROR),
            ]);
        }
        $presenter = app(BusinessDataPresenter::class);
        $reviewer = $this->userWithRole('verifier');

        $secondPage = $presenter->make($reviewer, ['approvalPage' => '2', 'approvalPerPage' => '10']);
        $this->assertCount(10, $secondPage['approvalRequests']);
        $this->assertSame(31, $secondPage['approvalPagination']['total']);
        $this->assertSame(2, $secondPage['approvalPagination']['currentPage']);

        $searched = $presenter->make($reviewer, ['approvalSearch' => 'Surakarta']);
        $this->assertCount(1, $searched['approvalRequests']);
        $this->assertSame('Permintaan khusus Surakarta', $searched['approvalRequests'][0]['title']);
    }

    public function test_monitoring_candidate_list_uses_server_side_pagination(): void
    {
        foreach (range(1, 30) as $index) {
            $candidateId = sprintf('GD-PAGE-%03d', $index);
            $this->insertCandidate(
                $candidateId,
                sprintf('3273%012d', $index),
                'Gardata',
                'gardata',
                'candidate-'.$index,
            );
        }

        $data = app(BusinessDataPresenter::class)->make(
            $this->userWithRole('super_admin'),
            ['candidatePage' => '2', 'candidatePerPage' => '10'],
        );

        $this->assertCount(10, $data['monitoring']['candidates']);
        $this->assertSame(30, $data['monitoring']['candidatePagination']['total']);
        $this->assertSame(2, $data['monitoring']['candidatePagination']['currentPage']);
    }

    public function test_monitoring_class_list_uses_pagination(): void
    {
        $this->createGardataCandidateWithTrainingRecord();
        $candidateId = 'GD-'.strtoupper(substr(hash('sha256', 'gardata-candidate'), 0, 24));
        foreach (range(1, 10) as $index) {
            DB::table('external_training_records')->insert([
                'external_source' => 'sippmi',
                'external_batch_id' => 'batch-second-'.$index,
                'job_seeker_id' => $candidateId,
                'class_code' => 'CLASS-SECOND-'.$index,
                'batch_name' => 'Pelatihan Kedua '.$index,
                'sector_name' => 'Hospitality',
                'program_name' => 'Bahasa',
                'target_jp' => 80,
                'achieved_jp' => 40,
                'completion_percentage' => 50,
                'status' => 'IN_PROGRESS',
                'verified_reports_count' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $data = app(BusinessDataPresenter::class)->make(
            $this->userWithRole('super_admin'),
            ['classPage' => '2', 'classPerPage' => '10'],
        );

        $this->assertCount(1, $data['monitoring']['classes']);
        $this->assertSame(11, $data['monitoring']['classPagination']['total']);
        $this->assertSame(2, $data['monitoring']['classPagination']['currentPage']);
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
                ->where('businessData.monitoring.lastSync.status', 'success')
                ->where('businessData.monitoring.candidatePagination.total', 1)
                ->where('businessData.monitoring.candidatePagination.currentPage', 1)
                ->where('businessData.monitoring.tenants.3.name', 'Politeknik Indonusa Surakarta')
                ->where('businessData.monitoring.tenants.3.subdomain', 'sippmi.com')
                ->where('businessData.monitoring.lastSync.recordsFetched', null)
                ->where('businessData.reportSummary.gardata.recordsFetched', null));

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
