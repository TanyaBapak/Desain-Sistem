<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Services\BusinessDataPresenter;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BusinessDataMonitoringScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_task_force_receives_business_data_when_training_records_exist(): void
    {
        $this->seed(ReferenceDataSeeder::class);
        $user = $this->userWithRole('task_force');
        $this->seedCandidateWithTrainingRecord($user, 80);

        $data = app(BusinessDataPresenter::class)->make($user, []);

        $this->assertNotEmpty($data['candidates'], 'Data pencari kerja harus tetap tampil untuk task force.');
        $this->assertNotEmpty($data['monitoring']['classes'] ?? [], 'Kelas monitoring harus terbaca dari data pelatihan eksternal.');
    }

    public function test_monitoring_participant_progress_is_capped_at_target_jp(): void
    {
        $this->seed(ReferenceDataSeeder::class);
        $user = $this->userWithRole('task_force');
        $this->seedCandidateWithTrainingRecord($user, 500);

        $data = app(BusinessDataPresenter::class)->make($user, []);
        $participant = $data['monitoring']['classes'][0]['participants'][0] ?? [];

        $this->assertSame(120, (int) ($data['monitoring']['classes'][0]['targetJp'] ?? 0));
        $this->assertSame(120, $participant['achievedJp'] ?? null, 'Capaian JP peserta tidak boleh melebihi target JP kelas.');
    }

    private function seedCandidateWithTrainingRecord(User $user, int $achievedJp): void
    {
        DB::table('job_seekers')->insert([
            'id' => 'JS-MONITORING-001',
            'registration_number' => 'REG-CONTOH-001',
            'nik' => '3300000000000002',
            'full_name' => 'Peserta Contoh Monitoring',
            'gender' => 'L',
            'institution_name' => 'Lembaga Contoh Monitoring',
            'province_id' => '32',
            'district_id' => '3271',
            'major' => 'Teknik Pengelasan',
            'readiness_status' => 'Ready for Placement',
            'external_source' => 'sippmi',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('external_training_records')->insert([
            'external_source' => 'sippmi',
            'external_batch_id' => 'BATCH-CONTOH-001',
            'job_seeker_id' => 'JS-MONITORING-001',
            'class_code' => 'KELAS-CONTOH-001',
            'batch_name' => 'Kelas Contoh Pengelasan',
            'sector_name' => 'Manufaktur',
            'program_name' => 'Pelatihan Pengelasan',
            'target_jp' => 120,
            'achieved_jp' => $achievedJp,
            'completion_percentage' => 0,
            'status' => 'ENROLLED',
            'verified_reports_count' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
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
