<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use JsonException;
use RuntimeException;

class ImportNationalRegions extends Command
{
    protected $signature = 'regions:import {file : Path to the national regions JSON file} {--dry-run : Validate without writing to the database}';

    protected $description = 'Import province and regency/city reference data from a JSON file';

    public function handle(): int
    {
        $file = $this->argument('file');
        if (! is_file($file) || ! is_readable($file)) {
            $this->error("File tidak ditemukan atau tidak dapat dibaca: {$file}");

            return self::FAILURE;
        }

        try {
            $contents = file_get_contents($file);
            if ($contents === false) {
                throw new RuntimeException('File tidak dapat dibaca.');
            }

            $payload = json_decode($contents, true, flags: JSON_THROW_ON_ERROR);
            [$provinces, $districts] = $this->validatePayload($payload);
        } catch (JsonException|RuntimeException $exception) {
            $this->error('Data wilayah tidak valid: '.$exception->getMessage());

            return self::FAILURE;
        }

        if ($this->option('dry-run')) {
            $this->info(sprintf(
                'Validasi berhasil: %d provinsi dan %d kabupaten/kota. Tidak ada data yang ditulis.',
                count($provinces),
                count($districts),
            ));

            return self::SUCCESS;
        }

        DB::transaction(function () use ($provinces, $districts): void {
            foreach ($provinces as $province) {
                DB::table('provinces')->updateOrInsert(
                    ['id' => $province['id']],
                    ['name' => $province['name']],
                );
            }

            foreach ($districts as $district) {
                DB::table('districts')->updateOrInsert(
                    ['id' => $district['id']],
                    [
                        'province_id' => $district['province_id'],
                        'name' => $district['name'],
                        'type' => $district['type'],
                    ],
                );
            }
        });

        $this->info(sprintf(
            'Impor berhasil: %d provinsi dan %d kabupaten/kota diperbarui atau ditambahkan. Data lain tidak dihapus.',
            count($provinces),
            count($districts),
        ));

        return self::SUCCESS;
    }

    /**
     * @return array{0: list<array{id: string, name: string}>, 1: list<array{id: string, province_id: string, name: string, type: string}>}
     */
    private function validatePayload(mixed $payload): array
    {
        if (! is_array($payload) || ! isset($payload['provinces'], $payload['districts'])
            || ! is_array($payload['provinces']) || ! is_array($payload['districts'])) {
            throw new RuntimeException('JSON harus memiliki array "provinces" dan "districts".');
        }

        $provinces = [];
        foreach ($payload['provinces'] as $index => $row) {
            if (! is_array($row)) {
                throw new RuntimeException("Baris provinces[{$index}] harus berupa objek.");
            }

            $id = $row['id'] ?? null;
            $name = $row['name'] ?? null;
            if (! is_string($id) || ! preg_match('/^\d{2}$/', $id) || ! is_string($name)
                || trim($name) === '' || Str::length($name) > 100) {
                throw new RuntimeException("Baris provinces[{$index}] memerlukan id dua digit dan name maksimal 100 karakter.");
            }
            if (isset($provinces[$id])) {
                throw new RuntimeException("Kode provinsi duplikat: {$id}.");
            }

            $provinces[$id] = ['id' => $id, 'name' => trim($name)];
        }

        if ($provinces === []) {
            throw new RuntimeException('Setidaknya satu provinsi harus tersedia.');
        }

        $districts = [];
        foreach ($payload['districts'] as $index => $row) {
            if (! is_array($row)) {
                throw new RuntimeException("Baris districts[{$index}] harus berupa objek.");
            }

            $sourceId = $row['id'] ?? null;
            $name = $row['name'] ?? null;
            $provinceId = $row['province_id'] ?? null;
            $type = $row['type'] ?? null;
            if (! is_string($sourceId) || ! preg_match('/^\d{2}\.?\d{2}$/', $sourceId)
                || ! is_string($name) || trim($name) === '' || Str::length($name) > 100) {
                throw new RuntimeException("Baris districts[{$index}] memerlukan id empat digit (titik opsional) dan name maksimal 100 karakter.");
            }

            $id = str_replace('.', '', $sourceId);
            $derivedProvinceId = substr($id, 0, 2);
            if ($provinceId !== null && (! is_string($provinceId) || $provinceId !== $derivedProvinceId)) {
                throw new RuntimeException("Kode provinsi districts[{$index}] tidak sesuai dengan kode kabupaten/kota.");
            }
            if (! isset($provinces[$derivedProvinceId])) {
                throw new RuntimeException("Provinsi {$derivedProvinceId} untuk kabupaten/kota {$id} tidak ada di file.");
            }

            if (! is_string($type)) {
                $type = Str::startsWith(Str::lower(trim($name)), 'kota ') ? 'Kota' : (
                    Str::startsWith(Str::lower(trim($name)), 'kabupaten ') ? 'Kabupaten' : null
                );
            }
            if (! in_array($type, ['Kabupaten', 'Kota'], true)) {
                throw new RuntimeException("Baris districts[{$index}] memerlukan type \"Kabupaten\" atau \"Kota\".");
            }
            if (isset($districts[$id])) {
                throw new RuntimeException("Kode kabupaten/kota duplikat: {$id}.");
            }

            $districts[$id] = [
                'id' => $id,
                'province_id' => $derivedProvinceId,
                'name' => trim($name),
                'type' => $type,
            ];
        }

        if ($districts === []) {
            throw new RuntimeException('Setidaknya satu kabupaten/kota harus tersedia.');
        }

        return [array_values($provinces), array_values($districts)];
    }
}
