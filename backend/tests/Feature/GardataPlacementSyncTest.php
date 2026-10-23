<?php

namespace Tests\Feature;

use App\Jobs\SyncGardataPlacementData;
use App\Models\Role;
use App\Models\User;
use App\Services\GardataPlacementSyncService;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use RuntimeException;
use Tests\TestCase;

class GardataPlacementSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ReferenceDataSeeder::class);
        config([
            'services.gardata.base_url' => 'https://gardata.test',
            'services.gardata.api_key' => 'gardata-test-key',
            'services.gardata.sync_page_size' => 50,
            'services.gardata.max_pages' => 10,
        ]);
    }

    public function test_sync_imports_consented_candidates_and_training_history_idempotently(): void
    {
        Http::fake([
            'gardata.test/api/v1/placement/candidates*' => Http::response($this->candidatePage(), 200),
        ]);

        $service = app(GardataPlacementSyncService::class);
        $firstResult = $service->syncCandidates();
        $secondResult = $service->syncCandidates();

        Http::assertSent(fn (HttpRequest $request): bool => $request->hasHeader('X-API-KEY', 'gardata-test-key')
            && ! str_contains($request->url(), 'api_key='));
        $this->assertSame(1, $firstResult['recordsInserted']);
        $this->assertSame(1, $secondResult['recordsUpdated']);
        $this->assertSame(1, DB::table('job_seekers')->where('external_source', 'gardata')->count());
        $this->assertDatabaseHas('job_seekers', [
            'external_source' => 'gardata',
            'external_id' => 'candidate-42',
            'nik' => '3273010101010001',
            'full_name' => 'Peserta Contoh',
            'gender' => 'P',
            'province_id' => '32',
            'district_id' => '3271',
            'source_type' => 'Gardata',
            'verification_status' => 'Pending Verification',
            'lifecycle_status' => 'SUBMITTED',
        ]);
        $this->assertDatabaseHas('external_training_records', [
            'external_source' => 'gardata',
            'external_batch_id' => 'batch-7',
            'batch_name' => 'Pelatihan Contoh',
            'job_seeker_id' => 'GD-'.strtoupper(substr(hash('sha256', 'candidate-42'), 0, 24)),
            'achieved_jp' => 120,
            'status' => 'GRADUATED',
        ]);
        $this->assertSame(1, DB::table('external_training_records')->count());
        $this->assertSame(2, DB::table('integration_sync_logs')->where('status', 'success')->count());
        $this->assertSame(1, DB::table('approval_requests')
            ->where('entity_type', 'calon_peserta')
            ->where('status', 'PENDING')
            ->count());
        $this->assertSame(1, DB::table('approval_histories')->where('action', 'SUBMIT')->count());
    }

    public function test_sync_skips_candidates_without_verified_consent(): void
    {
        $payload = $this->candidatePage();
        $payload['data'][0]['placement_readiness']['is_agreement_verified'] = false;
        Http::fake([
            'gardata.test/api/v1/placement/candidates*' => Http::response($payload, 200),
        ]);

        $result = app(GardataPlacementSyncService::class)->syncCandidates();

        $this->assertSame(1, $result['recordsSkipped']);
        $this->assertDatabaseCount('job_seekers', 0);
        $this->assertDatabaseHas('integration_sync_logs', [
            'source' => 'gardata',
            'status' => 'partial',
            'records_skipped' => 1,
        ]);
    }

    public function test_failed_sync_records_only_generic_errors(): void
    {
        Http::fake([
            'gardata.test/api/v1/placement/candidates*' => Http::response(['status' => 'error'], 401),
        ]);

        $exception = null;
        try {
            app(GardataPlacementSyncService::class)->syncCandidates();
        } catch (RuntimeException $caught) {
            $exception = $caught;
        }

        $this->assertInstanceOf(RuntimeException::class, $exception);
        $this->assertStringContainsString('log integrasi', $exception->getMessage());

        $failedLog = DB::table('integration_sync_logs')->where('status', 'failed')->first();
        $this->assertNotNull($failedLog);
        $this->assertStringNotContainsString('3273010101010001', $failedLog->error_message);
    }

    public function test_manual_sync_is_restricted_to_platform_administrators(): void
    {
        $this->actingAs($this->userWithRole('district_admin'))
            ->post('/integrations/gardata/sync')
            ->assertForbidden();

        Queue::fake();
        $this->actingAs($this->userWithRole('super_admin'))
            ->post('/integrations/gardata/sync')
            ->assertRedirect()
            ->assertSessionHasNoErrors();
        Queue::assertPushed(SyncGardataPlacementData::class);
    }

    private function candidatePage(): array
    {
        return [
            'status' => 'success',
            'meta' => [
                'current_page' => 1,
                'per_page' => 50,
                'total_items' => 1,
                'total_pages' => 1,
                'has_more_pages' => false,
            ],
            'data' => [[
                'id' => 'candidate-42',
                'nik' => '3273010101010001',
                'name' => 'Peserta Contoh',
                'biodata' => [
                    'full_name' => 'Peserta Contoh',
                    'gender' => 'Perempuan',
                    'city' => 'Kota Bogor',
                    'province' => 'Jawa Barat',
                    'expertise' => 'Pengelasan dasar',
                    'target_country' => 'Jepang',
                    'education' => [
                        'school_origin' => 'SMK Contoh',
                        'major' => 'Teknik Pengelasan',
                    ],
                ],
                'placement_readiness' => [
                    'status' => 'JOB_READY',
                    'is_agreement_verified' => true,
                    'selection_results' => ['agreed_terms' => true],
                ],
                'classes_history' => [[
                    'batch_id' => 'batch-7',
                    'class_code' => 'GD-CLASS-7',
                    'batch_name' => 'Pelatihan Contoh',
                    'sector_name' => 'Manufaktur',
                    'program_name' => 'Pengelasan',
                    'period' => ['start_date' => '2026-01-01', 'end_date' => '2026-03-01'],
                    'target_jp' => 120,
                    'achieved_jp' => 120,
                    'completion_percentage' => 100,
                    'status' => 'GRADUATED',
                    'verified_reports_count' => 12,
                ]],
            ]],
        ];
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
