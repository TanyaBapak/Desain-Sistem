<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Services\BusinessDataPresenter;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ApprovalsWorkflowReproduceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ReferenceDataSeeder::class);
    }

    public function test_approvals_page_loads_for_task_force_with_jateng_scope(): void
    {
        $role = Role::query()->create([
            'name' => 'task_force',
            'title' => 'Admin Task Force Nasional',
            'core_group' => 'taskforce',
            'default_tab' => 'dashboard',
        ]);
        $user = User::factory()->create([
            'username' => 'contoh',
            'name' => 'contoh',
            'scope_level' => 'provinsi',
            'bp3mi_code' => 'BP3MI-JATENG',
            'scope_name' => 'BP3MI Jawa Tengah',
            'province_id' => '33',
        ]);
        $user->roles()->attach($role->id);

        // Create an institution in Jawa Tengah (province 33)
        $instId = 'VOC-JATENG-001';
        DB::table('institutions')->insert([
            'id' => $instId,
            'name' => 'SMK Negeri 1 Contoh Jawa Tengah',
            'npsn_or_vin' => '12345678',
            'institution_type' => 'SMK',
            'ownership_type' => 'Negeri',
            'province_id' => '33',
            'district_id' => '3301',
            'address' => 'Jl. Contoh Jateng No. 1',
            'head_name' => 'Jaenur,S.Pd., M.Pd',
            'phone' => '081234567890',
            'email' => 'jaenur@example.com',
            'accreditation' => 'A',
            'procurement_method' => 'Swakelola Tipe 2',
            'instructor_count' => 15,
            'class_count' => 6,
            'ready_participant_count' => 120,
            'verification_status' => 'Pending Verification',
            'status' => 'Aktif',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $appId = 'APP-JATENG-001';
        DB::table('approval_requests')->insert([
            'id' => $appId,
            'entity_type' => 'lembaga_vokasi',
            'entity_id' => $instId,
            'title' => 'Pendaftaran lembaga vokasi: SMK Negeri 1 Contoh Jawa Tengah',
            'submitted_by' => 'Jaenur,S.Pd., M.Pd',
            'submitted_role' => 'institution_admin',
            'scope_label' => 'Kabupaten Cilacap, Jawa Tengah',
            'submitted_at' => now(),
            'validation_status' => 'PASSED',
            'status' => 'PENDING',
        ]);

        // Request approvals tab with filters from screenshot
        $response = $this->actingAs($user)
            ->get('/app/approvals?approvalPage=1&approvalPerPage=25&approvalStatus=PENDING');

        $response->assertOk();

        // Now test approving
        $approveResponse = $this->actingAs($user)
            ->post("/approvals/{$appId}", [
                'action' => 'approve',
                'notes' => 'Disetujui untuk uji coba',
            ]);
        $approveResponse->assertRedirect();

        // Reset status to PENDING for testing rejection
        DB::table('approval_requests')->where('id', $appId)->update(['status' => 'PENDING']);

        // Now test rejecting with reason
        $rejectResponse = $this->actingAs($user)
            ->post("/approvals/{$appId}", [
                'action' => 'reject',
                'notes' => 'Berkas tidak lengkap',
            ]);
        $rejectResponse->assertRedirect();
    }

    public function test_approving_institution_with_existing_duplicate_persists_deduplication_audit_log(): void
    {
        $role = Role::query()->create([
            'name' => 'task_force',
            'title' => 'Admin Task Force Nasional',
            'core_group' => 'taskforce',
            'default_tab' => 'dashboard',
        ]);
        $user = User::factory()->create([
            'username' => 'contoh2',
            'name' => 'contoh',
            'scope_level' => 'provinsi',
            'bp3mi_code' => 'BP3MI-JATENG',
            'scope_name' => 'BP3MI Jawa Tengah',
            'province_id' => '33',
        ]);
        $user->roles()->attach($role->id);

        // Older duplicate institution with exact same name in same district
        DB::table('institutions')->insert([
            'id' => 'VOC-DUPLICATE-OLD',
            'name' => 'SMK Contoh Duplikasi',
            'npsn_or_vin' => '99999991',
            'institution_type' => 'SMK',
            'ownership_type' => 'Negeri',
            'province_id' => '33',
            'district_id' => '3301',
            'verification_status' => 'Verified',
            'status' => 'Aktif',
            'created_at' => now()->subMonths(2),
            'updated_at' => now()->subMonths(2),
        ]);

        // New pending institution with same name
        $newInstId = 'VOC-DUPLICATE-NEW';
        DB::table('institutions')->insert([
            'id' => $newInstId,
            'name' => 'SMK Contoh Duplikasi',
            'npsn_or_vin' => '99999992',
            'institution_type' => 'SMK',
            'ownership_type' => 'Negeri',
            'province_id' => '33',
            'district_id' => '3301',
            'verification_status' => 'Pending Verification',
            'status' => 'Aktif',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $appId = 'APP-DUPLICATE-001';
        DB::table('approval_requests')->insert([
            'id' => $appId,
            'entity_type' => 'lembaga_vokasi',
            'entity_id' => $newInstId,
            'title' => 'Pendaftaran lembaga vokasi: SMK Contoh Duplikasi',
            'submitted_by' => 'Kepala Sekolah',
            'submitted_role' => 'institution_admin',
            'scope_label' => 'Kabupaten Cilacap, Jawa Tengah',
            'submitted_at' => now(),
            'validation_status' => 'PASSED',
            'status' => 'PENDING',
        ]);

        $response = $this->actingAs($user)
            ->post("/approvals/{$appId}", [
                'action' => 'approve',
                'notes' => 'Disetujui setelah konfirmasi duplikasi',
            ]);
        $response->assertRedirect();

        // Old duplicate should now be Nonaktif
        $this->assertDatabaseHas('institutions', [
            'id' => 'VOC-DUPLICATE-OLD',
            'status' => 'Nonaktif',
        ]);

        // Audit log must have valid action_type 'UPDATE_DATA'
        $this->assertDatabaseHas('audit_logs', [
            'action_type' => 'UPDATE_DATA',
            'entity' => 'institutions',
            'entity_id' => 'VOC-DUPLICATE-OLD',
        ]);
    }
}
