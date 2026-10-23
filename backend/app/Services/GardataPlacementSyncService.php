<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class GardataPlacementSyncService
{
    private const SOURCE = 'gardata';

    private ?array $provinces = null;

    private array $districts = [];

    public function syncCandidates(): array
    {
        $apiKey = (string) config('services.gardata.api_key');
        $startedAt = now();
        $logId = DB::table('integration_sync_logs')->insertGetId([
            'source' => self::SOURCE,
            'entity' => 'candidates_and_training_records',
            'status' => 'running',
            'started_at' => $startedAt,
            'created_at' => $startedAt,
            'updated_at' => $startedAt,
        ]);

        try {
            if ($apiKey === '') {
                throw new RuntimeException('Konfigurasi API Gardata belum tersedia.');
            }

            $pageSize = min(max((int) config('services.gardata.sync_page_size', 50), 1), 100);
            $maxPages = max((int) config('services.gardata.max_pages', 1000), 1);
            $page = 1;
            $result = [
                'recordsFetched' => 0,
                'recordsInserted' => 0,
                'recordsUpdated' => 0,
                'recordsSkipped' => 0,
            ];

            do {
                if ($page > $maxPages) {
                    throw new RuntimeException('Batas halaman sinkronisasi Gardata terlampaui.');
                }

                $response = Http::baseUrl(rtrim((string) config('services.gardata.base_url'), '/'))
                    ->acceptJson()
                    ->withHeader('X-API-KEY', $apiKey)
                    ->connectTimeout(5)
                    ->timeout(30)
                    ->retry(2, 500)
                    ->get('/api/v1/placement/candidates', [
                        'page' => $page,
                        'per_page' => $pageSize,
                    ])
                    ->throw()
                    ->json();

                if (
                    ! is_array($response)
                    || ($response['status'] ?? null) !== 'success'
                    || ! is_array($response['data'] ?? null)
                    || ! is_array($response['meta'] ?? null)
                ) {
                    throw new RuntimeException('Format respons daftar kandidat Gardata tidak valid.');
                }

                $items = $response['data'];
                $result['recordsFetched'] += count($items);
                foreach ($items as $item) {
                    if (! is_array($item)) {
                        $result['recordsSkipped']++;

                        continue;
                    }

                    $persisted = DB::transaction(fn (): array => $this->persistCandidate($item));
                    $result['recordsInserted'] += $persisted['inserted'];
                    $result['recordsUpdated'] += $persisted['updated'];
                    $result['recordsSkipped'] += $persisted['skipped'];
                }

                $currentPage = filter_var($response['meta']['current_page'] ?? null, FILTER_VALIDATE_INT);
                $totalPages = filter_var($response['meta']['total_pages'] ?? null, FILTER_VALIDATE_INT);
                if ($currentPage !== $page || $totalPages === false || $totalPages < 0) {
                    throw new RuntimeException('Metadata paginasi Gardata tidak valid.');
                }

                $page++;
            } while ($page <= $totalPages);

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
        } catch (Throwable $exception) {
            DB::table('integration_sync_logs')->where('id', $logId)->update([
                'status' => 'failed',
                'error_message' => 'Sinkronisasi Gardata gagal. Periksa konfigurasi, koneksi, dan kontrak API.',
                'finished_at' => now(),
                'updated_at' => now(),
            ]);
            Log::error('Gardata synchronization failed.', [
                'exception' => $exception::class,
            ]);

            throw new RuntimeException('Sinkronisasi Gardata gagal; lihat log integrasi untuk detail status.', 0);
        }
    }

    private function persistCandidate(array $item): array
    {
        $externalId = $this->cleanString($item['id'] ?? null, 150);
        $nik = $this->cleanString($item['nik'] ?? null, 20);
        $biodata = is_array($item['biodata'] ?? null) ? $item['biodata'] : [];
        $education = is_array($biodata['education'] ?? null) ? $biodata['education'] : [];
        $name = $this->cleanString($biodata['full_name'] ?? $item['name'] ?? null, 150);
        $major = $this->cleanString($education['major'] ?? null, 150);
        $gender = $this->mapGender($biodata['gender'] ?? null);
        $provinceId = $this->findRegionId($biodata['province'] ?? null, 'province');
        $districtId = $this->findRegionId($biodata['city'] ?? null, 'district', $provinceId);
        $readiness = is_array($item['placement_readiness'] ?? null) ? $item['placement_readiness'] : [];
        $selectionResults = is_array($readiness['selection_results'] ?? null) ? $readiness['selection_results'] : [];

        if (
            ! $externalId
            || ! $nik
            || ! preg_match('/^\d{16}$/', $nik)
            || ! $name
            || ! $major
            || ! $gender
            || ! $provinceId
            || ! $districtId
            || ($readiness['is_agreement_verified'] ?? false) !== true
            || ($selectionResults['agreed_terms'] ?? false) !== true
        ) {
            return ['inserted' => 0, 'updated' => 0, 'skipped' => 1];
        }

        $existing = DB::table('job_seekers')
            ->where('external_source', self::SOURCE)
            ->where('external_id', $externalId)
            ->first();
        $id = $existing?->id ?? 'GD-'.Str::upper(substr(hash('sha256', $externalId), 0, 24));

        $nikOwner = DB::table('job_seekers')
            ->where('nik', $nik)
            ->where('id', '!=', $id)
            ->exists();
        if ($nikOwner) {
            return ['inserted' => 0, 'updated' => 0, 'skipped' => 1];
        }

        $now = now();
        $preferredCountries = $this->cleanString($biodata['target_country'] ?? null, 100);
        $expertise = $this->cleanString($biodata['expertise'] ?? null, 100);
        $attributes = [
            'registration_number' => 'GDT-'.Str::upper(substr(hash('sha256', $externalId), 0, 32)),
            'nik' => $nik,
            'full_name' => $name,
            'gender' => $gender,
            'province_id' => $provinceId,
            'district_id' => $districtId,
            'education_level' => $this->educationLevel($education['school_origin'] ?? null),
            'institution_name' => $this->cleanString($education['school_origin'] ?? null, 255) ?? 'Gardata - Pusat Pelatihan CPMI',
            'institution_id' => null,
            'major' => $major,
            'source_type' => 'Gardata',
            'source_reference' => Str::limit($externalId, 100, ''),
            'external_source' => self::SOURCE,
            'external_id' => $externalId,
            'readiness_status' => $this->readinessStatus($readiness['status'] ?? null),
            'verification_status' => 'Pending Verification',
            'lifecycle_status' => 'SUBMITTED',
            'preferred_countries' => $preferredCountries ? json_encode([$preferredCountries]) : null,
            'preferred_job_roles' => $expertise ? json_encode([$expertise]) : null,
            'updated_at' => $now,
        ];

        if ($existing) {
            DB::table('job_seekers')->where('id', $id)->update($attributes);
        } else {
            DB::table('job_seekers')->insert([
                'id' => $id,
                ...$attributes,
                'created_at' => $now,
            ]);
        }

        $this->syncTrainingRecords($item['classes_history'] ?? null, $id);

        if ($expertise) {
            DB::table('job_seeker_skills')->updateOrInsert(
                ['job_seeker_id' => $id, 'skill_name' => $expertise],
                ['certified' => false],
            );
        }

        return [
            'inserted' => $existing ? 0 : 1,
            'updated' => $existing ? 1 : 0,
            'skipped' => 0,
        ];
    }

    private function syncTrainingRecords(mixed $history, string $jobSeekerId): void
    {
        if (! is_array($history)) {
            return;
        }

        foreach ($history as $class) {
            if (! is_array($class)) {
                continue;
            }

            $externalBatchId = $this->cleanString($class['batch_id'] ?? null, 150);
            $batchName = $this->cleanString($class['batch_name'] ?? null, 255);
            if (! $externalBatchId || ! $batchName) {
                continue;
            }

            $now = now();
            $identity = [
                'external_source' => self::SOURCE,
                'external_batch_id' => $externalBatchId,
                'job_seeker_id' => $jobSeekerId,
            ];
            $createdAt = DB::table('external_training_records')
                ->where($identity)
                ->value('created_at') ?? $now;
            DB::table('external_training_records')->updateOrInsert(
                $identity,
                [
                    'class_code' => $this->cleanString($class['class_code'] ?? null, 100),
                    'batch_name' => $batchName,
                    'sector_name' => $this->cleanString($class['sector_name'] ?? null, 150),
                    'program_name' => $this->cleanString($class['program_name'] ?? null, 255),
                    'start_date' => $this->dateValue(data_get($class, 'period.start_date')),
                    'end_date' => $this->dateValue(data_get($class, 'period.end_date')),
                    'target_jp' => max(0, (int) ($class['target_jp'] ?? 0)),
                    'achieved_jp' => max(0, (int) ($class['achieved_jp'] ?? 0)),
                    'completion_percentage' => min(100, max(0, (float) ($class['completion_percentage'] ?? 0))),
                    'status' => $this->cleanString($class['status'] ?? null, 50) ?? 'UNKNOWN',
                    'verified_reports_count' => max(0, (int) ($class['verified_reports_count'] ?? 0)),
                    'updated_at' => $now,
                    'created_at' => $createdAt,
                ],
            );
        }
    }

    private function findRegionId(mixed $value, string $type, ?string $provinceId = null): ?string
    {
        $name = $this->cleanString($value, 100);
        if (! $name) {
            return null;
        }

        if ($type === 'province') {
            $this->provinces ??= DB::table('provinces')->get(['id', 'name'])->all();
            $matches = array_values(array_filter(
                $this->provinces,
                fn (object $province): bool => $this->normalizeRegionName($province->name) === $this->normalizeRegionName($name),
            ));
        } else {
            if (! $provinceId) {
                return null;
            }
            $this->districts[$provinceId] ??= DB::table('districts')
                ->where('province_id', $provinceId)
                ->get(['id', 'name'])
                ->all();
            $exactMatches = array_values(array_filter(
                $this->districts[$provinceId],
                fn (object $district): bool => mb_strtolower(trim($district->name)) === mb_strtolower(trim($name)),
            ));
            $matches = $exactMatches ?: array_values(array_filter(
                $this->districts[$provinceId],
                fn (object $district): bool => $this->normalizeRegionName($district->name) === $this->normalizeRegionName($name),
            ));
        }

        return count($matches) === 1 ? (string) $matches[0]->id : null;
    }

    private function normalizeRegionName(string $value): string
    {
        $name = mb_strtolower(trim($value));
        $name = preg_replace('/^(provinsi|kabupaten|kab\\.?|kota administrasi|kota)\\s+/u', '', $name) ?? $name;

        return trim($name);
    }

    private function mapGender(mixed $value): ?string
    {
        $gender = mb_strtolower(trim(is_string($value) ? $value : ''));

        return match ($gender) {
            'l', 'laki-laki', 'laki laki', 'male' => 'L',
            'p', 'perempuan', 'female' => 'P',
            default => null,
        };
    }

    private function educationLevel(mixed $school): string
    {
        $name = mb_strtolower(is_string($school) ? $school : '');

        return match (true) {
            str_contains($name, 'd3'), str_contains($name, 'diploma') => 'D3',
            str_contains($name, 's1'), str_contains($name, 'sarjana') => 'S1',
            str_contains($name, 'smk') => 'SMK',
            default => 'Lainnya',
        };
    }

    private function readinessStatus(mixed $status): string
    {
        return strtoupper(is_string($status) ? $status : '') === 'JOB_READY'
            ? 'Ready for Placement'
            : 'Needs Upskilling';
    }

    private function dateValue(mixed $value): ?string
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        $date = \DateTimeImmutable::createFromFormat('!Y-m-d', $value);

        return $date && $date->format('Y-m-d') === $value ? $value : null;
    }

    private function cleanString(mixed $value, int $maxLength): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $cleaned = trim(strip_tags($value));

        return $cleaned === '' ? null : Str::limit($cleaned, $maxLength, '');
    }
}
