<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class Kp2miVokasiSyncService
{
    public function syncFirstPage(): array
    {
        $startedAt = now();
        $logId = DB::table('integration_sync_logs')->insertGetId([
            'source' => 'kp2mi',
            'entity' => 'institutions',
            'status' => 'running',
            'started_at' => $startedAt,
            'created_at' => $startedAt,
            'updated_at' => $startedAt,
        ]);

        try {
            $response = Http::baseUrl(rtrim((string) config('services.kp2mi.base_url'), '/'))
                ->acceptJson()
                ->connectTimeout(5)
                ->timeout(20)
                ->retry(2, 300)
                ->get('/api/proxy/vocational-institution', [
                    'page' => 1,
                    'limit' => (int) config('services.kp2mi.sync_page_size', 36),
                ])
                ->throw()
                ->json();

            if (! is_array($response) || ! isset($response['data']) || ! is_array($response['data'])) {
                throw new RuntimeException('Respons daftar lembaga KP2MI tidak sesuai format yang diharapkan.');
            }

            $items = $response['data'];
            $result = DB::transaction(fn (): array => $this->persistItems($items));
            $result['recordsFetched'] = count($items);
            $paginationTotal = is_array($response['pagination'] ?? null)
                ? ($response['pagination']['total'] ?? null)
                : null;
            $result['totalAvailable'] = (int) ($response['countTotal'] ?? $paginationTotal ?? count($items));
            $result['status'] = $result['recordsSkipped'] > 0 ? 'partial' : 'success';

            DB::table('integration_sync_logs')->where('id', $logId)->update([
                'status' => $result['status'],
                'records_fetched' => $result['recordsFetched'],
                'records_inserted' => $result['recordsInserted'],
                'records_updated' => $result['recordsUpdated'],
                'records_skipped' => $result['recordsSkipped'],
                'finished_at' => now(),
                'updated_at' => now(),
            ]);

            return $result;
        } catch (\Throwable $exception) {
            DB::table('integration_sync_logs')->where('id', $logId)->update([
                'status' => 'failed',
                'error_message' => Str::limit($exception->getMessage(), 2000),
                'finished_at' => now(),
                'updated_at' => now(),
            ]);

            throw $exception;
        }
    }

    private function persistItems(array $items): array
    {
        $result = [
            'recordsInserted' => 0,
            'recordsUpdated' => 0,
            'recordsSkipped' => 0,
        ];

        foreach ($items as $item) {
            if (! is_array($item)) {
                $result['recordsSkipped']++;

                continue;
            }

            $attributes = $this->mapInstitution($item);
            if ($attributes === null) {
                $result['recordsSkipped']++;

                continue;
            }

            $existing = DB::table('institutions')
                ->where('external_source', 'kp2mi')
                ->where('external_id', $attributes['external_id'])
                ->first();

            $now = now();
            $attributes['updated_at'] = $now;

            if ($existing) {
                DB::table('institutions')->where('id', $existing->id)->update($attributes);
                $result['recordsUpdated']++;

                continue;
            }

            DB::table('institutions')->insert([
                'id' => 'KP2MI-'.Str::upper(Str::random(12)),
                ...$attributes,
                'status' => 'Aktif',
                'total_active_students' => null,
                'instructor_count' => null,
                'workshop_capacity' => null,
                'readiness_score' => null,
                'created_at' => $now,
            ]);
            $result['recordsInserted']++;
        }

        return $result;
    }

    private function mapInstitution(array $item): ?array
    {
        $name = $this->cleanString($item['name'] ?? null, 255);
        $externalId = $this->cleanString($item['slug'] ?? null, 150);
        $provinceName = $this->cleanString($item['province'] ?? null, 100);

        if (! $name || ! $externalId || ! $provinceName) {
            return null;
        }

        $provinceLookup = mb_strtolower(preg_replace('/^provinsi\s+/i', '', $provinceName) ?? $provinceName);
        $provinceNames = match ($provinceLookup) {
            'dki jakarta', 'daerah khusus ibukota jakarta' => ['dki jakarta', 'daerah khusus ibukota jakarta'],
            'di yogyakarta', 'daerah istimewa yogyakarta' => ['di yogyakarta', 'daerah istimewa yogyakarta'],
            default => [$provinceLookup],
        };
        $provinceId = DB::table('provinces')
            ->whereIn(DB::raw('LOWER(name)'), $provinceNames)
            ->value('id');
        if (! $provinceId) {
            return null;
        }

        $districtName = $this->cleanString($item['district'] ?? null, 100);
        $districtId = $districtName
            ? DB::table('districts')
                ->where('province_id', $provinceId)
                ->whereRaw('LOWER(name) = ?', [mb_strtolower($districtName)])
                ->value('id')
            : null;

        $sectors = [];
        foreach (is_array($item['sectorals'] ?? null) ? $item['sectorals'] : [] as $sector) {
            if (is_array($sector) && ($sectorName = $this->cleanString($sector['sectoral'] ?? null, 150))) {
                $sectors[] = $sectorName;
            }
        }

        $sourceStatus = $this->cleanString($item['institutionStatus'] ?? null, 100);
        $verification = 'Belum Terverifikasi';
        $type = $this->institutionType($item['type'] ?? null);
        if (! $type) {
            return null;
        }

        return [
            'external_source' => 'kp2mi',
            'external_id' => $externalId,
            'name' => $name,
            'institution_type' => $type,
            'ownership_type' => $this->ownershipType($item['ownership'] ?? null),
            'province_id' => $provinceId,
            'district_id' => $districtId,
            'address' => $this->cleanString($item['address'] ?? null, 2000),
            'head_name' => $this->cleanString($item['leaderName'] ?? null, 150),
            'phone' => $this->cleanString($item['phone'] ?? null, 50),
            'email' => $this->cleanString($item['email'] ?? null, 100),
            'accreditation' => $this->cleanString($item['accreditation'] ?? null, 20) ?? 'Belum diketahui',
            'evokasi_status' => $verification,
            'verification_status' => 'Unverified',
            'supported_sectors' => json_encode(array_values(array_unique($sectors))),
            'external_metadata' => json_encode([
                'logo' => $this->cleanString($item['logo'] ?? null, 255),
                'website' => $this->cleanString($item['website'] ?? null, 255),
                'leaderPosition' => $this->cleanString($item['leaderPosition'] ?? null, 150),
                'institutionForm' => $this->cleanString($item['institutionForm'] ?? null, 150),
                'sectorals' => $item['sectorals'] ?? [],
                'programs' => is_array($item['programs'] ?? null) ? $item['programs'] : [],
                'sourceStatus' => $sourceStatus,
                'sourceType' => $this->cleanString($item['type'] ?? null, 100),
            ]),
        ];
    }

    private function institutionType(mixed $value): ?string
    {
        $type = mb_strtolower(trim(is_string($value) ? $value : ''));

        return match (true) {
            str_contains($type, 'smk') => 'SMK',
            str_contains($type, 'blk'), str_contains($type, 'balai') => 'BLK',
            str_contains($type, 'lpk') => 'LPK',
            str_contains($type, 'lkp') => 'LKP',
            str_contains($type, 'universitas'),
            str_contains($type, 'politeknik'),
            str_contains($type, 'perguruan tinggi'),
            str_contains($type, 'institut'),
            str_contains($type, 'akademi') => 'Perguruan Tinggi / Politeknik',
            default => null,
        };
    }

    private function ownershipType(?string $value): ?string
    {
        $status = mb_strtolower(trim($value ?? ''));
        if (str_contains($status, 'negeri') || str_contains($status, 'pemerintah') || str_contains($status, 'public')) {
            return 'Negeri';
        }
        if (str_contains($status, 'swasta') || str_contains($status, 'private')) {
            return 'Swasta';
        }

        return null;
    }

    private function cleanString(mixed $value, int $maxLength): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim(strip_tags($value));

        return $value === '' ? null : mb_substr($value, 0, $maxLength);
    }
}
