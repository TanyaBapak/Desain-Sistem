<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Services\BusinessDataPresenter;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ImportVokasiCsvTest extends TestCase
{
    use RefreshDatabase;

    private const HEADERS = [
        'id_lembaga_vokasi',
        'institutionId',
        'nama',
        'email',
        'propinsi',
        'kota',
        'nomor_hp',
        'Jenis lembaga',
        'ownership',
        'jenis',
        'kapasitas',
        'legalityStatus',
        'facilityStatus',
        'programStatus',
        'sektor',
        'jabatan',
    ];

    public function test_it_imports_vokasi_csv_idempotently_and_preserves_offered_program_data(): void
    {
        $this->seed(ReferenceDataSeeder::class);
        $firstRow = $this->row('EVOK-1', 'Pelatihan Contoh', 'Manufaktur', 'Welder');
        $firstRow['kapasitas'] = '1.200';
        $firstRow['ownership'] = 'Non Pemerintah';
        $secondInstitution = $this->row('', 'Lembaga Contoh Kedua', 'Manufaktur', 'Operator');
        $secondInstitution['kapasitas'] = '.100';
        $unknownCapacity = $this->row('EVOK-3', 'Lembaga Contoh Ketiga', 'Manufaktur', 'Instruktur');
        $unknownCapacity['kapasitas'] = '5000000000';
        $duplicateOffering = $this->row('EVOK-1', 'Pelatihan Contoh', 'Manufaktur', 'Welder');
        $duplicateOffering['legalityStatus'] = 'rejected';
        $file = $this->writeCsv([
            $firstRow,
            $this->row('EVOK-1', 'Pelatihan Contoh', 'Hospitality', 'Staf Hotel'),
            $duplicateOffering,
            $secondInstitution,
            $unknownCapacity,
        ]);

        try {
            $this->artisan('institutions:import-vokasi', ['file' => $file])
                ->expectsOutputToContain('Kapasitas pada baris 6 di luar rentang')
                ->expectsOutput('Impor berhasil: 3 lembaga ditambahkan dan 0 diperbarui. Data lain tidak dihapus.')
                ->assertExitCode(0);
            $this->artisan('institutions:import-vokasi', ['file' => $file])
                ->expectsOutput('Impor berhasil: 0 lembaga ditambahkan dan 3 diperbarui. Data lain tidak dihapus.')
                ->assertExitCode(0);
        } finally {
            unlink($file);
        }

        $this->assertDatabaseCount('institutions', 3);
        $institution = DB::table('institutions')
            ->where('external_source', 'data_vokasi_csv')
            ->where('external_id', 'EVOK-1')
            ->first();
        $this->assertNotNull($institution);
        $this->assertSame('32', $institution->province_id);
        $this->assertSame('3273', $institution->district_id);
        $this->assertSame('SMK', $institution->institution_type);
        $this->assertSame(1200, $institution->workshop_capacity);
        $this->assertSame('Unverified', $institution->verification_status);
        $this->assertEqualsCanonicalizing(
            ['Manufaktur', 'Hospitality'],
            json_decode($institution->supported_sectors, true, flags: JSON_THROW_ON_ERROR),
        );
        $metadata = json_decode($institution->external_metadata, true, flags: JSON_THROW_ON_ERROR);
        $this->assertCount(2, $metadata['programs']);
        $this->assertSame('Welder', $metadata['programs'][0]['occupation']);
        $this->assertCount(2, $metadata['programs'][0]['sourceStatuses']);
        $user = User::factory()->create();
        $role = Role::query()->create([
            'name' => 'task_force',
            'title' => 'Task Force',
            'core_group' => 'test',
            'default_tab' => 'overview',
        ]);
        $user->roles()->attach($role->id);
        $presentedInstitution = collect(app(BusinessDataPresenter::class)->make($user)['providers'])
            ->firstWhere('id', $institution->id);
        $this->assertSame('Swasta', $presentedInstitution['institutionStatus']);
        $this->assertSame('SMK', $presentedInstitution['providerType']);
        $this->assertSame('Pendidikan dan Pelatihan', $presentedInstitution['institutionForm']);
        $this->assertSame('Welder', $presentedInstitution['offerings'][0]['occupation']);
        $this->assertCount(2, $presentedInstitution['offerings']);
        $this->assertDatabaseHas('institutions', [
            'external_source' => 'data_vokasi_csv',
            'external_id' => 'legacy-2',
            'workshop_capacity' => 100,
        ]);
        $this->assertDatabaseHas('institutions', [
            'external_source' => 'data_vokasi_csv',
            'external_id' => 'EVOK-3',
            'workshop_capacity' => null,
        ]);
        $this->assertDatabaseCount('training_programs', 0);
    }

    public function test_dry_run_does_not_write_and_invalid_rows_fail_without_partial_import(): void
    {
        $file = $this->writeCsv([
            $this->row('EVOK-1', 'Pelatihan Contoh', 'Manufaktur', 'Welder'),
            $this->row('EVOK-2', '', 'Hospitality', 'Staf Hotel'),
        ]);

        try {
            $this->artisan('institutions:import-vokasi', ['file' => $file, '--dry-run' => true])
                ->expectsOutputToContain('tidak valid pada baris 3')
                ->assertExitCode(1);
            $this->assertDatabaseCount('institutions', 0);
        } finally {
            unlink($file);
        }
    }

    /**
     * @param  list<array<string, string>>  $rows
     */
    private function writeCsv(array $rows): string
    {
        $file = tempnam(sys_get_temp_dir(), 'vokasi-csv-');
        $stream = fopen($file, 'w');
        fputcsv($stream, self::HEADERS, ',', '"', '');
        foreach ($rows as $row) {
            fputcsv($stream, array_values($row), ',', '"', '');
        }
        fclose($stream);

        return $file;
    }

    /**
     * @return array<string, string>
     */
    private function row(string $institutionId, string $name, string $sector, string $occupation): array
    {
        return [
            'id_lembaga_vokasi' => $institutionId === '' ? '2' : '1',
            'institutionId' => $institutionId,
            'nama' => $name,
            'email' => 'contoh@example.test',
            'propinsi' => 'Jawa Barat',
            'kota' => 'Kota Bandung',
            'nomor_hp' => '080000000000',
            'Jenis lembaga' => 'SMK',
            'ownership' => 'Pemerintah',
            'jenis' => 'Pendidikan dan Pelatihan',
            'kapasitas' => '120',
            'legalityStatus' => 'accepted',
            'facilityStatus' => 'accepted',
            'programStatus' => 'accepted',
            'sektor' => $sector,
            'jabatan' => $occupation,
        ];
    }
}
