<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class ImportVokasiCsv extends Command
{
    protected $signature = 'institutions:import-vokasi {file : Path to the data_vokasi.csv file} {--dry-run : Validate without writing to the database}';

    protected $description = 'Import vocational institutions and their offered sectors and occupations from a CSV file';

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

    public function handle(): int
    {
        $file = $this->argument('file');
        if (! is_file($file) || ! is_readable($file)) {
            $this->error("File tidak ditemukan atau tidak dapat dibaca: {$file}");

            return self::FAILURE;
        }

        try {
            $institutions = $this->readInstitutions($file);
            $locations = $this->resolveLocations($institutions);
        } catch (RuntimeException $exception) {
            $this->error('Data CSV tidak valid: '.$exception->getMessage());

            return self::FAILURE;
        }

        if ($this->option('dry-run')) {
            $this->info(sprintf(
                'Validasi berhasil: %d lembaga ditemukan. Tidak ada data yang ditulis.',
                count($institutions),
            ));

            return self::SUCCESS;
        }

        $result = DB::transaction(function () use ($institutions, $locations): array {
            $inserted = 0;
            $updated = 0;

            foreach ($institutions as $externalId => $institution) {
                $identity = ['external_source' => 'data_vokasi_csv', 'external_id' => $externalId];
                $existing = DB::table('institutions')->where($identity)->first();
                $attributes = [
                    'name' => $institution['name'],
                    'institution_type' => $institution['institution_type'],
                    'ownership_type' => $institution['ownership_type'],
                    'province_id' => $locations[$externalId]['province_id'],
                    'district_id' => $locations[$externalId]['district_id'],
                    'phone' => $institution['phone'],
                    'email' => $institution['email'],
                    'workshop_capacity' => $institution['capacity'],
                    'supported_sectors' => json_encode(array_keys($institution['sectors']), JSON_THROW_ON_ERROR),
                    'external_metadata' => json_encode([
                        'source' => 'data_vokasi.csv',
                        'legacyIds' => array_values(array_keys($institution['legacy_ids'])),
                        'provinceName' => $institution['province_name'],
                        'districtName' => $institution['district_name'],
                        'sourceType' => $institution['source_type'],
                        'sourceOwnership' => $institution['source_ownership'],
                        'institutionCategory' => $institution['category'],
                        'programs' => array_values($institution['programs']),
                    ], JSON_THROW_ON_ERROR),
                    'evokasi_status' => 'Belum Terverifikasi',
                    'verification_status' => 'Unverified',
                    'updated_at' => now(),
                ];

                if ($existing) {
                    DB::table('institutions')->where('id', $existing->id)->update($attributes);
                    $updated++;

                    continue;
                }

                DB::table('institutions')->insert([
                    ...$identity,
                    'id' => 'CSV-'.Str::upper(Str::random(12)),
                    ...$attributes,
                    'status' => 'Aktif',
                    'created_at' => now(),
                ]);
                $inserted++;
            }

            return ['inserted' => $inserted, 'updated' => $updated];
        });

        $this->info(sprintf(
            'Impor berhasil: %d lembaga ditambahkan dan %d diperbarui. Data lain tidak dihapus.',
            $result['inserted'],
            $result['updated'],
        ));

        return self::SUCCESS;
    }

    /**
     * @return array<string, array{
     *   name: string,
     *   institution_type: string,
     *   ownership_type: string,
     *   phone: string,
     *   email: string,
     *   capacity: int,
     *   province_name: string,
     *   district_name: string,
     *   source_type: string,
     *   source_ownership: string,
     *   category: string,
     *   legacy_ids: array<string, true>,
     *   sectors: array<string, true>,
     *   programs: array<string, array{sector: string, occupation: string, sourceStatuses: list<array{legalityStatus: ?string, facilityStatus: ?string, programStatus: ?string}>}>
     * }>
     */
    private function readInstitutions(string $file): array
    {
        $stream = fopen($file, 'r');
        if ($stream === false) {
            throw new RuntimeException('File tidak dapat dibuka.');
        }

        try {
            $header = fgetcsv($stream, null, ',', '"', '');
            if ($header === false) {
                throw new RuntimeException('File tidak memiliki baris header.');
            }
            $header[0] = preg_replace('/^\xEF\xBB\xBF/', '', (string) $header[0]) ?? (string) $header[0];
            $header = array_map(static fn ($value): string => trim((string) $value), $header);
            if ($header !== self::HEADERS) {
                throw new RuntimeException('Kolom tidak sesuai dengan format data_vokasi.csv.');
            }

            $institutions = [];
            $rowNumber = 1;
            while (($row = fgetcsv($stream, null, ',', '"', '')) !== false) {
                $rowNumber++;
                if (count($row) === 1 && trim((string) $row[0]) === '') {
                    continue;
                }
                if (count($row) !== count(self::HEADERS)) {
                    throw new RuntimeException("Jumlah kolom pada baris {$rowNumber} tidak sesuai.");
                }

                $record = array_combine(self::HEADERS, array_map(
                    static fn ($value): string => trim((string) $value),
                    $row,
                ));
                if ($record === false) {
                    throw new RuntimeException("Baris {$rowNumber} tidak dapat dibaca.");
                }

                $legacyId = $record['id_lembaga_vokasi'];
                $name = $this->cleanString($record['nama'], 255);
                $sourceType = $this->cleanString($record['Jenis lembaga'], 100);
                $provinceName = $this->cleanString($record['propinsi'], 100);
                $districtName = $this->cleanString($record['kota'], 100);
                $sector = $this->cleanString($record['sektor'], 150);
                $occupation = $this->cleanString($record['jabatan'], 150);
                $capacity = $this->parseCapacity($record['kapasitas'], $rowNumber);
                $institutionType = $this->institutionType($sourceType);

                if (! $legacyId || ! $name || ! $sourceType || ! $provinceName || ! $districtName
                    || ! $sector || ! $occupation || ! $institutionType) {
                    throw new RuntimeException("Data wajib tidak valid pada baris {$rowNumber}.");
                }

                $sourceId = $this->cleanString($record['institutionId'], 150);
                $externalId = $sourceId ?? 'legacy-'.$legacyId;
                $program = [
                    'sector' => $sector,
                    'occupation' => $occupation,
                    'sourceStatuses' => [[
                        'legalityStatus' => $this->nullableString($record['legalityStatus'], 50),
                        'facilityStatus' => $this->nullableString($record['facilityStatus'], 50),
                        'programStatus' => $this->nullableString($record['programStatus'], 50),
                    ]],
                ];
                $programKey = hash('sha256', json_encode([
                    $program['sector'],
                    $program['occupation'],
                ], JSON_THROW_ON_ERROR));

                if (! isset($institutions[$externalId])) {
                    $institutions[$externalId] = [
                        'name' => $name,
                        'institution_type' => $institutionType,
                        'ownership_type' => $this->ownershipType($record['ownership']),
                        'phone' => $this->cleanString($record['nomor_hp'], 50),
                        'email' => $this->cleanString($record['email'], 100),
                        'capacity' => $capacity,
                        'province_name' => $provinceName,
                        'district_name' => $districtName,
                        'source_type' => $sourceType,
                        'source_ownership' => $record['ownership'],
                        'category' => $record['jenis'],
                        'legacy_ids' => [],
                        'sectors' => [],
                        'programs' => [],
                    ];
                } elseif ($institutions[$externalId]['capacity'] === null && $capacity !== null) {
                    $institutions[$externalId]['capacity'] = $capacity;
                }

                $institutions[$externalId]['legacy_ids'][$legacyId] = true;
                $institutions[$externalId]['sectors'][$sector] = true;
                if (! isset($institutions[$externalId]['programs'][$programKey])) {
                    $institutions[$externalId]['programs'][$programKey] = $program;
                } else {
                    $statuses = $institutions[$externalId]['programs'][$programKey]['sourceStatuses'];
                    $status = $program['sourceStatuses'][0];
                    if (! in_array($status, $statuses, true)) {
                        $institutions[$externalId]['programs'][$programKey]['sourceStatuses'][] = $status;
                    }
                }
            }

            if ($institutions === []) {
                throw new RuntimeException('File tidak berisi data lembaga.');
            }

            return $institutions;
        } finally {
            fclose($stream);
        }
    }

    /**
     * @param  array<string, array{province_name: string, district_name: string}>  $institutions
     * @return array<string, array{province_id: ?string, district_id: ?string}>
     */
    private function resolveLocations(array $institutions): array
    {
        $locations = [];
        foreach ($institutions as $externalId => $institution) {
            $provinceId = DB::table('provinces')
                ->whereRaw('LOWER(name) = ?', [mb_strtolower($institution['province_name'])])
                ->value('id');
            $provinceId ??= match (mb_strtolower($institution['province_name'])) {
                'daerah khusus ibukota jakarta', 'dki jakarta' => DB::table('provinces')
                    ->whereIn(DB::raw('LOWER(name)'), ['dki jakarta', 'daerah khusus ibukota jakarta'])
                    ->value('id'),
                'daerah istimewa yogyakarta', 'di yogyakarta' => DB::table('provinces')
                    ->whereIn(DB::raw('LOWER(name)'), ['di yogyakarta', 'daerah istimewa yogyakarta'])
                    ->value('id'),
                default => null,
            };

            $districtId = null;
            if ($provinceId) {
                $districtName = mb_strtolower($institution['district_name']);
                $districtBaseName = preg_replace(
                    '/^(kabupaten|kab\.?|kota(?:\s+adm\.?|\s+administrasi)?)\s+/u',
                    '',
                    $districtName,
                ) ?? $districtName;
                $districtNames = array_unique([
                    $districtName,
                    $districtBaseName,
                    'kota '.$districtBaseName,
                    'kabupaten '.$districtBaseName,
                    'kota administrasi '.$districtBaseName,
                ]);
                $districtId = DB::table('districts')
                    ->where('province_id', $provinceId)
                    ->whereIn(DB::raw('LOWER(name)'), $districtNames)
                    ->value('id');
            }

            $locations[$externalId] = [
                'province_id' => $provinceId,
                'district_id' => $districtId,
            ];
        }

        return $locations;
    }

    private function institutionType(string $value): ?string
    {
        $type = mb_strtolower($value);

        return match (true) {
            str_contains($type, 'smk'), str_contains($type, 'sma') => 'SMK',
            str_contains($type, 'blk'), str_contains($type, 'balai') => 'BLK',
            str_contains($type, 'lpk'), str_contains($type, 'lsp') => 'LPK',
            str_contains($type, 'lkp') => 'LKP',
            str_contains($type, 'universitas'),
            str_contains($type, 'politeknik'),
            str_contains($type, 'perguruan tinggi'),
            str_contains($type, 'institut'),
            str_contains($type, 'akademi'),
            str_contains($type, 'sekolah tinggi') => 'Perguruan Tinggi / Politeknik',
            default => null,
        };
    }

    private function ownershipType(string $value): string
    {
        $ownership = mb_strtolower($value);
        if (str_contains($ownership, 'non pemerintah')
            || str_contains($ownership, 'swasta')
            || str_contains($ownership, 'private')) {
            return 'Swasta';
        }

        return 'Negeri';
    }

    private function parseCapacity(string $value, int $rowNumber): ?int
    {
        if (preg_match('/^\d{0,3}(?:\.\d{3})+$/', $value) === 1) {
            $value = str_replace('.', '', $value);
        }
        if (! ctype_digit($value)) {
            throw new RuntimeException("Nilai kapasitas pada baris {$rowNumber} bukan bilangan bulat.");
        }

        $normalizedValue = ltrim($value, '0');
        $normalizedValue = $normalizedValue === '' ? '0' : $normalizedValue;
        if (strlen($normalizedValue) > 10
            || (strlen($normalizedValue) === 10 && strcmp($normalizedValue, '4294967295') > 0)) {
            $this->warn("Kapasitas pada baris {$rowNumber} di luar rentang kolom dan akan disimpan sebagai tidak diketahui.");

            return null;
        }

        return (int) $normalizedValue;
    }

    private function cleanString(string $value, int $maxLength): ?string
    {
        $value = trim(strip_tags($value));

        return $value === '' ? null : mb_substr($value, 0, $maxLength);
    }

    private function nullableString(string $value, int $maxLength): ?string
    {
        return $this->cleanString($value, $maxLength);
    }
}
