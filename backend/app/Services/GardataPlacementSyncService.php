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

    public function syncCandidates(?string $overrideBaseUrl = null, ?string $overrideApiKey = null, string $source = self::SOURCE): array
    {
        $baseUrl = rtrim((string) ($overrideBaseUrl ?: config("services.{$source}.base_url") ?: config('services.gardata.base_url')), '/');
        $apiKey = (string) ($overrideApiKey ?: config("services.{$source}.api_key") ?: config('services.gardata.api_key'));
        $startedAt = now();
        $logId = DB::table('integration_sync_logs')->insertGetId([
            'source' => $source,
            'entity' => 'candidates_and_training_records',
            'status' => 'running',
            'started_at' => $startedAt,
            'created_at' => $startedAt,
            'updated_at' => $startedAt,
        ]);

        try {
            if ($apiKey === '') {
                throw new RuntimeException("Konfigurasi API {$source} belum tersedia.");
            }

            $pageSize = min(max((int) (config("services.{$source}.sync_page_size") ?: config('services.gardata.sync_page_size', 50)), 1), 100);
            $maxPages = max((int) (config("services.{$source}.max_pages") ?: config('services.gardata.max_pages', 1000)), 1);
            $page = 1;
            $result = [
                'recordsFetched' => 0,
                'recordsInserted' => 0,
                'recordsUpdated' => 0,
                'recordsSkipped' => 0,
            ];

            do {
                if ($page > $maxPages) {
                    throw new RuntimeException("Batas halaman sinkronisasi {$source} terlampaui.");
                }

                $response = Http::baseUrl($baseUrl)
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
                    throw new RuntimeException("Format respons daftar kandidat {$source} tidak valid.");
                }

                $items = $response['data'];
                $result['recordsFetched'] += count($items);
                foreach ($items as $item) {
                    if (! is_array($item)) {
                        $result['recordsSkipped']++;

                        continue;
                    }

                    $persisted = DB::transaction(fn (): array => $this->persistCandidate($item, $source));
                    $result['recordsInserted'] += $persisted['inserted'];
                    $result['recordsUpdated'] += $persisted['updated'];
                    $result['recordsSkipped'] += $persisted['skipped'];
                }

                $currentPage = filter_var($response['meta']['current_page'] ?? null, FILTER_VALIDATE_INT);
                $totalPages = filter_var($response['meta']['total_pages'] ?? null, FILTER_VALIDATE_INT);
                if ($currentPage !== $page || $totalPages === false || $totalPages < 0) {
                    throw new RuntimeException("Metadata paginasi {$source} tidak valid.");
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
                'error_message' => "Sinkronisasi {$source} gagal. Periksa konfigurasi, koneksi, dan kontrak API.",
                'finished_at' => now(),
                'updated_at' => now(),
            ]);
            Log::error("{$source} synchronization failed.", [
                'exception' => $exception::class,
            ]);

            throw new RuntimeException("Sinkronisasi {$source} gagal; lihat log integrasi untuk detail status.", 0);
        }
    }

    public function syncSippmi(?string $overrideBaseUrl = null, ?string $overrideApiKey = null): array
    {
        $baseUrl = $overrideBaseUrl ?: (string) (config('services.sippmi.base_url') ?: 'https://sippmi.com');
        $apiKey = $overrideApiKey ?: (string) (config('services.sippmi.api_key') ?: config('services.gardata.api_key'));

        return $this->syncCandidates($baseUrl, $apiKey, 'sippmi');
    }

    private function persistCandidate(array $item, string $source = self::SOURCE): array
    {
        $externalId = $this->cleanString($item['id'] ?? $item['external_id'] ?? $item['candidate_id'] ?? null, 150);
        $biodata = is_array($item['biodata'] ?? null) ? $item['biodata'] : [];
        $education = is_array($biodata['education'] ?? null) ? $biodata['education'] : [];
        $name = $this->cleanString($biodata['full_name'] ?? $biodata['name'] ?? $biodata['nama'] ?? $item['name'] ?? $item['full_name'] ?? null, 150);
        $major = $this->cleanString($education['major'] ?? $education['jurusan'] ?? $biodata['major'] ?? $biodata['jurusan'] ?? $item['major'] ?? null, 150) ?? 'Umum';
        $gender = $this->mapGender($biodata['gender'] ?? $biodata['jenis_kelamin'] ?? $item['gender'] ?? null);

        $rawNik = (string) ($item['nik'] ?? $biodata['nik'] ?? '');
        $digitsNik = preg_replace('/\D/', '', $rawNik);
        if (strlen($digitsNik) === 16) {
            $nik = $digitsNik;
        } elseif (strlen($digitsNik) >= 10) {
            $nik = Str::padRight($digitsNik, 16, '0');
        } elseif ($externalId) {
            $nik = '32' . substr(preg_replace('/\D/', '', hash('sha256', $externalId)), 0, 14);
            $nik = Str::padRight($nik, 16, '1');
        } else {
            $nik = null;
        }

        $name = $name ?: 'Peserta ' . ucfirst($source) . ' #' . substr((string) ($externalId ?? hash('sha256', $nik ?? 'unknown')), 0, 8);

        $provinceId = $this->findRegionId($biodata['province'] ?? $biodata['propinsi'] ?? $biodata['provinsi'] ?? $item['province'] ?? null, 'province');
        if (! $provinceId) {
            $cityParam = $biodata['city'] ?? $biodata['kota'] ?? $biodata['kabupaten'] ?? $item['city'] ?? null;
            $provinceId = $this->findProvinceByCity($cityParam) ?? '32';
        }

        $districtId = $this->findRegionId($biodata['city'] ?? $biodata['kota'] ?? $biodata['kabupaten'] ?? $item['city'] ?? null, 'district', $provinceId);
        if (! $districtId) {
            $districtId = $this->fallbackDistrictId($provinceId);
        }

        $readiness = is_array($item['placement_readiness'] ?? null) ? $item['placement_readiness'] : [];
        $selectionResults = is_array($readiness['selection_results'] ?? null) ? $readiness['selection_results'] : [];

        // Tolak hanya jika eksplisit ditolak / unverified (strict false)
        $isExplicitlyRejected = ($readiness['is_agreement_verified'] ?? null) === false
            || ($selectionResults['agreed_terms'] ?? null) === false;

        if (
            ! $externalId
            || ! $nik
            || ! preg_match('/^\d{16}$/', $nik)
            || ! $name
            || ! $provinceId
            || ! $districtId
            || $isExplicitlyRejected
        ) {
            return ['inserted' => 0, 'updated' => 0, 'skipped' => 1];
        }

        $existing = DB::table('job_seekers')
            ->where(function ($query) use ($source) {
                $query->where('external_source', $source)
                    ->orWhere('external_source', self::SOURCE);
            })
            ->where('external_id', $externalId)
            ->first();
        $idPrefix = $source === 'sippmi' ? 'SIPPMI-' : 'GD-';
        $id = $existing?->id ?? $idPrefix.Str::upper(substr(hash('sha256', $externalId), 0, 24));

        $nikOwner = DB::table('job_seekers')
            ->where('nik', $nik)
            ->where('id', '!=', $id)
            ->first();
        if ($nikOwner) {
            // Tautkan riwayat kelas ke record yang sudah ada
            $trainingHistory = $item['classes_history'] ?? $item['training_history'] ?? $item['classes'] ?? null;
            $this->syncTrainingRecords($trainingHistory, $nikOwner->id, $source);

            return ['inserted' => 0, 'updated' => 1, 'skipped' => 0];
        }

        $now = now();
        $preferredCountries = $this->cleanString($biodata['target_country'] ?? $item['target_country'] ?? null, 100);
        $expertise = $this->cleanString($biodata['expertise'] ?? $item['expertise'] ?? $major, 100);
        $sourceType = $source === 'sippmi' ? 'SIPPMI' : 'Gardata';
        $defaultInstitution = $source === 'sippmi'
            ? 'SIPPMI - Pusat Penempatan PMI'
            : 'Gardata - Pusat Pelatihan CPMI';

        $attributes = [
            'registration_number' => ($source === 'sippmi' ? 'SIPPMI-' : 'GDT-').Str::upper(substr(hash('sha256', $externalId), 0, 32)),
            'nik' => $nik,
            'full_name' => $name,
            'gender' => $gender,
            'province_id' => $provinceId,
            'district_id' => $districtId,
            'education_level' => $this->educationLevel($education['school_origin'] ?? $biodata['school_origin'] ?? null),
            'institution_name' => $this->cleanString($education['school_origin'] ?? $biodata['school_origin'] ?? null, 255) ?? $defaultInstitution,
            'institution_id' => null,
            'major' => $major,
            'source_type' => 'Gardata',
            'source_reference' => Str::limit($externalId, 100, ''),
            'external_source' => $source,
            'external_id' => $externalId,
            'readiness_status' => $this->readinessStatus($readiness['status'] ?? null),
            'verification_status' => $existing?->verification_status ?? 'Pending Verification',
            'lifecycle_status' => $existing?->lifecycle_status ?? 'SUBMITTED',
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
            $this->createApprovalRequest($id, $externalId, $source);
        }

        $trainingHistory = $item['classes_history'] ?? $item['training_history'] ?? $item['classes'] ?? null;
        $this->syncTrainingRecords($trainingHistory, $id, $source);

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

    private function createApprovalRequest(string $candidateId, string $externalId, string $source = self::SOURCE): void
    {
        if (DB::table('approval_requests')
            ->where('entity_type', 'calon_peserta')
            ->where('entity_id', $candidateId)
            ->exists()) {
            return;
        }

        $sourceLabel = $source === 'sippmi' ? 'SIPPMI' : 'Gardata';
        $requestId = Str::upper($source).'-'.Str::upper(substr(hash('sha256', $externalId), 0, 24));
        $now = now();
        DB::table('approval_requests')->insert([
            'id' => $requestId,
            'entity_type' => 'calon_peserta',
            'entity_id' => $candidateId,
            'title' => "Verifikasi peserta {$sourceLabel} #".$candidateId,
            'submitted_by' => "Integrasi {$sourceLabel}",
            'submitted_role' => $source,
            'scope_label' => 'Data terintegrasi Gardata / SIPPMI',
            'submitted_at' => $now,
            'validation_status' => 'PASSED',
            'status' => 'PENDING',
            'data_snapshot' => json_encode(['source' => $source, 'external_id' => $externalId], JSON_THROW_ON_ERROR),
        ]);
        DB::table('approval_histories')->insert([
            'approval_request_id' => $requestId,
            'actor_id' => null,
            'actor_name' => "Integrasi {$sourceLabel}",
            'action' => 'SUBMIT',
            'notes' => 'Data peserta tersinkron; menunggu verifikasi internal.',
            'created_at' => $now,
        ]);
    }

    private function syncTrainingRecords(mixed $history, string $jobSeekerId, string $source = self::SOURCE): void
    {
        if (! is_array($history)) {
            return;
        }

        foreach ($history as $class) {
            if (! is_array($class)) {
                continue;
            }

            $externalBatchId = $this->cleanString($class['batch_id'] ?? $class['id'] ?? $class['class_id'] ?? $class['class_code'] ?? null, 150);
            $batchName = $this->cleanString($class['batch_name'] ?? $class['name'] ?? $class['program_name'] ?? $class['class_name'] ?? 'Pelatihan '.ucfirst($source), 255);
            if (! $externalBatchId) {
                continue;
            }

            $now = now();
            $identity = [
                'external_source' => $source,
                'external_batch_id' => $externalBatchId,
                'job_seeker_id' => $jobSeekerId,
            ];
            $createdAt = DB::table('external_training_records')
                ->where($identity)
                ->value('created_at') ?? $now;
            DB::table('external_training_records')->updateOrInsert(
                $identity,
                [
                    'class_code' => $this->cleanString($class['class_code'] ?? $class['code'] ?? $externalBatchId, 100),
                    'batch_name' => $batchName,
                    'sector_name' => $this->cleanString($class['sector_name'] ?? $class['sector'] ?? null, 150),
                    'program_name' => $this->cleanString($class['program_name'] ?? $class['program'] ?? $batchName, 255),
                    'start_date' => $this->dateValue(data_get($class, 'period.start_date') ?? $class['start_date'] ?? null),
                    'end_date' => $this->dateValue(data_get($class, 'period.end_date') ?? $class['end_date'] ?? null),
                    'target_jp' => max(0, (int) ($class['target_jp'] ?? $class['targetJp'] ?? $class['jp_target'] ?? $class['jp'] ?? 0)),
                    'achieved_jp' => max(0, (int) ($class['achieved_jp'] ?? $class['achievedJp'] ?? $class['jp_realisasi'] ?? 0)),
                    'completion_percentage' => min(100, max(0, (float) ($class['completion_percentage'] ?? $class['progress'] ?? 0))),
                    'status' => $this->cleanString($class['status'] ?? null, 50) ?? 'BERJALAN',
                    'verified_reports_count' => max(0, (int) ($class['verified_reports_count'] ?? $class['verified_reports'] ?? 0)),
                    'updated_at' => $now,
                    'created_at' => $createdAt,
                ],
            );
        }
    }

    private function findProvinceByCity(mixed $cityName): ?string
    {
        $name = $this->cleanString($cityName, 100);
        if (! $name) {
            return null;
        }

        $norm = $this->normalizeRegionName($name);
        $district = DB::table('districts')
            ->where(function ($query) use ($name, $norm) {
                $query->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
                    ->orWhereRaw('LOWER(name) LIKE ?', ['%'.$norm.'%']);
            })
            ->first(['province_id']);

        return $district ? (string) $district->province_id : null;
    }

    private function fallbackDistrictId(string $provinceId): string
    {
        $first = DB::table('districts')->where('province_id', $provinceId)->orderBy('id')->first(['id']);
        if ($first) {
            return (string) $first->id;
        }

        $fallbackId = Str::padRight($provinceId, 4, '1');
        DB::table('districts')->updateOrInsert(
            ['id' => $fallbackId],
            [
                'province_id' => $provinceId,
                'name' => 'Wilayah Terpadu Prov. '.$provinceId,
                'type' => 'Kabupaten',
            ]
        );

        return $fallbackId;
    }

    private function findRegionId(mixed $value, string $type, ?string $provinceId = null): ?string
    {
        $name = $this->cleanString($value, 100);
        if (! $name) {
            return null;
        }

        if ($type === 'province') {
            $this->provinces ??= DB::table('provinces')->get(['id', 'name'])->all();
            $norm = $this->normalizeRegionName($name);

            $aliases = [
                'jabar' => 'Jawa Barat',
                'jateng' => 'Jawa Tengah',
                'jatim' => 'Jawa Timur',
                'dki' => 'DKI Jakarta',
                'jakarta' => 'DKI Jakarta',
                'diy' => 'Daerah Istimewa Yogyakarta',
                'jogja' => 'Daerah Istimewa Yogyakarta',
                'yogyakarta' => 'Daerah Istimewa Yogyakarta',
                'sumut' => 'Sumatera Utara',
                'sumbar' => 'Sumatera Barat',
                'sumsel' => 'Sumatera Selatan',
                'sulsel' => 'Sulawesi Selatan',
                'sulteng' => 'Sulawesi Tengah',
                'sulut' => 'Sulawesi Utara',
                'kalsel' => 'Kalimantan Selatan',
                'kaltim' => 'Kalimantan Timur',
                'kalbar' => 'Kalimantan Barat',
                'kalteng' => 'Kalimantan Tengah',
                'ntb' => 'Nusa Tenggara Barat',
                'ntt' => 'Nusa Tenggara Timur',
                'kepri' => 'Kepulauan Riau',
                'babel' => 'Kepulauan Bangka Belitung',
            ];
            $targetNorm = isset($aliases[$norm]) ? $this->normalizeRegionName($aliases[$norm]) : $norm;

            $matches = array_values(array_filter(
                $this->provinces,
                fn (object $province): bool => $this->normalizeRegionName($province->name) === $targetNorm,
            ));
            if (empty($matches)) {
                $matches = array_values(array_filter(
                    $this->provinces,
                    fn (object $province): bool => str_contains($this->normalizeRegionName($province->name), $targetNorm)
                        || str_contains($targetNorm, $this->normalizeRegionName($province->name)),
                ));
            }

            return ! empty($matches) ? (string) $matches[0]->id : null;
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
            if (empty($matches)) {
                $norm = $this->normalizeRegionName($name);
                $matches = array_values(array_filter(
                    $this->districts[$provinceId],
                    fn (object $district): bool => str_contains($this->normalizeRegionName($district->name), $norm)
                        || str_contains($norm, $this->normalizeRegionName($district->name)),
                ));
            }

            return ! empty($matches) ? (string) $matches[0]->id : null;
        }
    }

    private function normalizeRegionName(string $value): string
    {
        $name = mb_strtolower(trim($value));
        $name = preg_replace('/^(provinsi|kabupaten|kab\\.?|kota administrasi|kota)\\s+/u', '', $name) ?? $name;

        return trim($name);
    }

    private function mapGender(mixed $value): string
    {
        $gender = mb_strtolower(trim(is_string($value) ? $value : ''));

        return match ($gender) {
            'p', 'perempuan', 'female', 'wanita', '2' => 'P',
            default => 'L',
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
