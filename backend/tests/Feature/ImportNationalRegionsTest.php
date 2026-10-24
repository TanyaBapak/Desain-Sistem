<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ImportNationalRegionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_imports_normalized_national_region_codes_and_can_be_rerun(): void
    {
        $file = $this->writeRegionFile($this->validPayload());

        try {
            $this->artisan('regions:import', ['file' => $file])
                ->expectsOutput('Impor berhasil: 2 provinsi dan 2 kabupaten/kota diperbarui atau ditambahkan. Data lain tidak dihapus.')
                ->assertExitCode(0);
            $this->artisan('regions:import', ['file' => $file])->assertExitCode(0);
        } finally {
            unlink($file);
        }

        $this->assertDatabaseHas('provinces', ['id' => '32', 'name' => 'Jawa Barat']);
        $this->assertDatabaseHas('districts', [
            'id' => '3201',
            'province_id' => '32',
            'name' => 'Kabupaten Bogor',
            'type' => 'Kabupaten',
        ]);
        $this->assertDatabaseHas('districts', [
            'id' => '3271',
            'province_id' => '32',
            'name' => 'Kota Bogor',
            'type' => 'Kota',
        ]);
        $this->assertSame(2, DB::table('districts')->count());
    }

    public function test_dry_run_validates_without_writing_and_invalid_data_is_atomic(): void
    {
        $validFile = $this->writeRegionFile($this->validPayload());
        $invalidPayload = $this->validPayload();
        $invalidPayload['districts'][0]['province_id'] = '33';
        $invalidFile = $this->writeRegionFile($invalidPayload);

        try {
            $this->artisan('regions:import', ['file' => $validFile, '--dry-run' => true])
                ->assertExitCode(0);
            $this->assertDatabaseCount('provinces', 0);

            $this->artisan('regions:import', ['file' => $invalidFile])
                ->expectsOutputToContain('tidak sesuai')
                ->assertExitCode(1);
            $this->assertDatabaseCount('provinces', 0);
            $this->assertDatabaseCount('districts', 0);
        } finally {
            unlink($validFile);
            unlink($invalidFile);
        }
    }

    /**
     * @return array{provinces: list<array{id: string, name: string}>, districts: list<array{id: string, province_id: string, name: string, type: string}>}
     */
    private function validPayload(): array
    {
        return [
            'provinces' => [
                ['id' => '32', 'name' => 'Jawa Barat'],
                ['id' => '33', 'name' => 'Jawa Tengah'],
            ],
            'districts' => [
                ['id' => '32.01', 'province_id' => '32', 'name' => 'Kabupaten Bogor', 'type' => 'Kabupaten'],
                ['id' => '3271', 'province_id' => '32', 'name' => 'Kota Bogor', 'type' => 'Kota'],
            ],
        ];
    }

    private function writeRegionFile(array $payload): string
    {
        $file = tempnam(sys_get_temp_dir(), 'national-regions-');
        file_put_contents($file, json_encode($payload, JSON_THROW_ON_ERROR));

        return $file;
    }
}
