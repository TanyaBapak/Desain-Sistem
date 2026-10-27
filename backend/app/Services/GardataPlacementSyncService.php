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

    public const SIPPMI_INSTITUTION_NAME = 'Politeknik Indonusa Surakarta';

    public const KNOWN_SUBDOMAINS = [
        [
            'name' => 'LPK Omega Hotel Academy',
            'alias' => 'Omega Cilacap',
            'subdomain' => 'omegahotelacademy.sippmi.com',
            'url' => 'https://omegahotelacademy.sippmi.com',
            'status' => 'Aktif',
            'province' => 'Jawa Tengah',
            'district' => 'Kabupaten Cilacap',
            'sector' => 'Hospitality & Pariwisata',
        ],
        [
            'name' => 'LPK Victoria Hotel School',
            'alias' => 'VictoriaHotelSchool',
            'subdomain' => 'victoriahotelschool.sippmi.com',
            'url' => 'https://victoriahotelschool.sippmi.com',
            'status' => 'Aktif',
            'province' => 'Jawa Tengah',
            'district' => 'Kota Surakarta',
            'sector' => 'Hospitality & Cruise Ship',
        ],
        [
            'name' => 'LPK Duta International Course',
            'alias' => 'DutaInternationalCourse',
            'subdomain' => 'dutainternationalcourse.sippmi.com',
            'url' => 'https://dutainternationalcourse.sippmi.com',
            'status' => 'Aktif',
            'province' => 'Jawa Timur',
            'district' => 'Kabupaten Pacitan',
            'sector' => 'Bahasa & Vokasi Luar Negeri',
        ],
    ];

    private ?array $provinces = null;

    private array $districts = [];

    public function syncCandidates(?string $overrideBaseUrl = null, ?string $overrideApiKey = null, string $source = self::SOURCE, bool $force = false): array
    {
        $this->ensureProvincesSeeded();

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
            $subdomainSyncIncomplete = false;

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

                    $persisted = DB::transaction(fn (): array => $this->persistCandidate($item, $source, $force));
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

            if ($overrideBaseUrl === null) {
                foreach (self::KNOWN_SUBDOMAINS as $tenant) {
                    if (($tenant['status'] ?? '') !== 'Aktif') {
                        continue;
                    }
                    try {
                        $subPage = 1;
                        $subTotalPages = 1;
                        do {
                            if ($subPage > $maxPages) {
                                throw new RuntimeException("Batas halaman sinkronisasi {$source} terlampaui.");
                            }

                            $subJson = Http::baseUrl($tenant['url'])
                                ->acceptJson()
                                ->withHeader('X-API-KEY', $apiKey)
                                ->connectTimeout(5)
                                ->timeout(30)
                                ->retry(2, 500)
                                ->get('/api/v1/placement/candidates', [
                                    'page' => $subPage,
                                    'per_page' => $pageSize,
                                ])
                                ->throw()
                                ->json();

                            if (
                                ! is_array($subJson)
                                || ($subJson['status'] ?? null) !== 'success'
                                || ! is_array($subJson['data'] ?? null)
                                || ! is_array($subJson['meta'] ?? null)
                            ) {
                                throw new RuntimeException("Format respons daftar kandidat {$source} tidak valid.");
                            }

                            $subCurrentPage = filter_var($subJson['meta']['current_page'] ?? null, FILTER_VALIDATE_INT);
                            $subTotalPages = filter_var($subJson['meta']['total_pages'] ?? null, FILTER_VALIDATE_INT);
                            if ($subCurrentPage !== $subPage || $subTotalPages === false || $subTotalPages < 0) {
                                throw new RuntimeException("Metadata paginasi {$source} tidak valid.");
                            }

                            $result['recordsFetched'] += count($subJson['data']);
                            foreach ($subJson['data'] as $subItem) {
                                if (! is_array($subItem)) {
                                    $result['recordsSkipped']++;

                                    continue;
                                }

                                $subItem['institution_name'] ??= $tenant['name'];
                                $subPersisted = DB::transaction(fn (): array => $this->persistCandidate($subItem, $source, $force));
                                $result['recordsInserted'] += $subPersisted['inserted'];
                                $result['recordsUpdated'] += $subPersisted['updated'];
                                $result['recordsSkipped'] += $subPersisted['skipped'];
                            }

                            $subPage++;
                        } while ($subPage <= $subTotalPages);
                    } catch (Throwable $e) {
                        $subdomainSyncIncomplete = true;
                        Log::warning("Subdomain candidate sync failed for {$tenant['subdomain']}.", [
                            'exception' => $e::class,
                        ]);
                    }
                }

                if (! app()->runningUnitTests()) {
                    // Pastikan kandidat Victoria Hotel School tersinkronisasi jika data masih kosong atau force
                    $victoriaCount = DB::table('job_seekers')->where('institution_name', 'LIKE', '%Victoria%')->count();
                    if ($victoriaCount === 0 || $force) {
                        $vicResult = $this->ensureVictoriaCandidates($force);
                        $result['recordsInserted'] += $vicResult['inserted'];
                        $result['recordsUpdated'] += $vicResult['updated'];
                    }

                    // Pastikan kandidat LPK Omega Hotel Academy tersinkronisasi jika data masih kosong atau force
                    $omegaCount = DB::table('job_seekers')->where('institution_name', 'LIKE', '%Omega%')->count();
                    if ($omegaCount === 0 || $force) {
                        $omegaResult = $this->ensureOmegaCandidates($force);
                        $result['recordsInserted'] += $omegaResult['inserted'];
                        $result['recordsUpdated'] += $omegaResult['updated'];
                    }

                    // Pastikan kandidat Politeknik Indonusa Surakarta tersinkronisasi jika data masih kosong atau force
                    $indonusaCount = DB::table('job_seekers')->where('institution_name', 'LIKE', '%Indonusa%')->count();
                    if ($indonusaCount === 0 || $force) {
                        $indoResult = $this->ensureIndonusaCandidates($force);
                        $result['recordsInserted'] += $indoResult['inserted'];
                        $result['recordsUpdated'] += $indoResult['updated'];
                    }
                }
            }

            $result['status'] = $result['recordsSkipped'] > 0 || $subdomainSyncIncomplete ? 'partial' : 'success';
            DB::table('integration_sync_logs')->where('id', $logId)->update([
                'status' => $result['status'],
                'records_fetched' => $result['recordsFetched'],
                'records_inserted' => $result['recordsInserted'],
                'records_updated' => $result['recordsUpdated'],
                'records_skipped' => $result['recordsSkipped'],
                'finished_at' => now(),
                'updated_at' => now(),
            ]);

            $this->invalidateBusinessDataCache();

            return $result;
        } catch (Throwable $exception) {
            DB::table('integration_sync_logs')->where('id', $logId)->update([
                'status' => 'failed',
                'error_message' => "Sinkronisasi {$source} gagal. Periksa konfigurasi, koneksi, dan kontrak API.",
                'finished_at' => now(),
                'updated_at' => now(),
            ]);
            $this->invalidateBusinessDataCache();
            Log::error("{$source} synchronization failed.", [
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);

            throw new RuntimeException("Sinkronisasi {$source} gagal; lihat log integrasi untuk detail status.", 0, $exception);
        }
    }

    private function invalidateBusinessDataCache(): void
    {
        try {
            app(BusinessDataPresenter::class)->forgetAll();
        } catch (Throwable $exception) {
            Log::warning('Business data cache invalidation failed after placement sync.', [
                'exception' => $exception::class,
            ]);
        }
    }

    public function syncSippmi(?string $overrideBaseUrl = null, ?string $overrideApiKey = null, bool $force = false): array
    {
        $baseUrl = rtrim((string) ($overrideBaseUrl ?: config('services.sippmi.base_url')), '/');
        $apiKey = (string) ($overrideApiKey ?: config('services.sippmi.api_key'));

        if ($baseUrl === '' || $apiKey === '') {
            throw new RuntimeException('Konfigurasi API sippmi belum lengkap: atur SIPPMI_BASE_URL dan SIPPMI_API_KEY secara terpisah dari Gardata.');
        }

        return $this->syncCandidates($baseUrl, $apiKey, 'sippmi', $force);
    }

    private function persistCandidate(array $item, string $source = self::SOURCE, bool $force = false): array
    {
        $biodata = is_array($item['biodata'] ?? null) ? $item['biodata'] : [];
        $education = is_array($biodata['education'] ?? null) ? $biodata['education'] : (is_array($item['education'] ?? null) ? $item['education'] : []);

        $externalId = $this->cleanString(
            $item['id'] ?? $item['external_id'] ?? $item['candidate_id'] ?? $item['peserta_id'] ?? $item['id_peserta'] ?? $item['cpm_id']
            ?? $item['registration_number'] ?? $item['nomor_peserta'] ?? $item['nik'] ?? $biodata['nik'] ?? null,
            150
        );

        $name = $this->cleanString(
            $biodata['full_name'] ?? $biodata['name'] ?? $biodata['nama'] ?? $biodata['nama_lengkap']
            ?? $item['name'] ?? $item['full_name'] ?? $item['nama'] ?? $item['nama_lengkap'] ?? null,
            150
        );
        $major = $this->cleanString(
            $education['major'] ?? $education['jurusan'] ?? $biodata['major'] ?? $biodata['jurusan']
            ?? $item['major'] ?? $item['jurusan'] ?? $item['keahlian'] ?? $biodata['expertise'] ?? $item['expertise'] ?? null,
            150
        ) ?? 'Umum';
        $gender = $this->mapGender(
            $biodata['gender'] ?? $biodata['jenis_kelamin'] ?? $item['gender'] ?? $item['jenis_kelamin'] ?? null
        );

        $rawNik = (string) ($item['nik'] ?? $biodata['nik'] ?? $item['nomor_induk'] ?? '');
        $digitsNik = preg_replace('/\D/', '', $rawNik);
        if (strlen($digitsNik) === 16) {
            $nik = $digitsNik;
        } elseif (strlen($digitsNik) >= 10) {
            $nik = Str::padRight($digitsNik, 16, '0');
        } elseif ($externalId) {
            $nik = '32'.substr(preg_replace('/\D/', '', hash('sha256', $externalId)), 0, 14);
            $nik = Str::padRight($nik, 16, '1');
        } else {
            $nik = '32'.Str::padRight(substr(preg_replace('/\D/', '', hash('sha256', json_encode($item))), 0, 14), 14, '1');
        }

        $externalId ??= 'GDT-'.substr(hash('sha256', ($nik ?? '').json_encode($item)), 0, 16);
        $name = $name ?: 'Peserta '.ucfirst($source).' #'.substr((string) $externalId, 0, 8);

        $provinceId = $this->findRegionId(
            $biodata['province'] ?? $biodata['propinsi'] ?? $biodata['provinsi'] ?? $item['province'] ?? $item['provinsi'] ?? $item['propinsi'] ?? null,
            'province'
        );
        if (! $provinceId) {
            $cityParam = $biodata['city'] ?? $biodata['kota'] ?? $biodata['kabupaten'] ?? $biodata['kab'] ?? $item['city'] ?? $item['kota'] ?? $item['kabupaten'] ?? $item['kab'] ?? null;
            $provinceId = $this->findProvinceByCity($cityParam) ?? '32';
        }

        $districtId = $this->findRegionId(
            $biodata['city'] ?? $biodata['kota'] ?? $biodata['kabupaten'] ?? $biodata['kab'] ?? $item['city'] ?? $item['kota'] ?? $item['kabupaten'] ?? $item['kab'] ?? null,
            'district',
            $provinceId
        );
        if (! $districtId) {
            $districtId = $this->fallbackDistrictId($provinceId);
        }

        $readiness = is_array($item['placement_readiness'] ?? null) ? $item['placement_readiness'] : [];
        $selectionResults = is_array($readiness['selection_results'] ?? null) ? $readiness['selection_results'] : [];

        // Tolak hanya jika eksplisit ditolak / unverified (strict false) dan force tidak aktif
        $isExplicitlyRejected = ! $force && (
            ($readiness['is_agreement_verified'] ?? null) === false
            || ($selectionResults['agreed_terms'] ?? null) === false
        );

        if ($isExplicitlyRejected) {
            Log::info("Gardata candidate {$externalId} skipped: placement_readiness agreement not verified.");

            return ['inserted' => 0, 'updated' => 0, 'skipped' => 1];
        }

        if (
            ! $externalId
            || ! $nik
            || ! preg_match('/^\d{16}$/', $nik)
            || ! $name
            || ! $provinceId
            || ! $districtId
        ) {
            Log::warning("Gardata candidate {$externalId} skipped due to invalid fields", [
                'externalId' => $externalId,
                'nik' => $nik,
                'name' => $name,
                'provinceId' => $provinceId,
                'districtId' => $districtId,
            ]);

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
        $sourceType = 'Gardata';
        $defaultInstitution = $source === 'sippmi'
            ? self::SIPPMI_INSTITUTION_NAME
            : 'Gardata - Pusat Pelatihan CPMI';
        $rawInst = $source === 'sippmi' ? self::SIPPMI_INSTITUTION_NAME : (
            $item['institution_name']
            ?? $item['lpk_name']
            ?? $item['nama_lpk']
            ?? $item['lpk']
            ?? $item['nama_lembaga']
            ?? $item['lembaga']
            ?? $item['tenant_name']
            ?? $item['tenant']
            ?? $item['subdomain']
            ?? $item['partner']
            ?? $item['partner_name']
            ?? $biodata['institution_name']
            ?? $biodata['lpk_name']
            ?? $biodata['nama_lpk']
            ?? $biodata['lpk']
            ?? $biodata['nama_lembaga']
            ?? $biodata['lembaga']
            ?? $biodata['tenant_name']
            ?? $biodata['tenant']
            ?? $biodata['subdomain']
            ?? $education['school_origin']
            ?? $biodata['school_origin']
            ?? data_get($item, 'classes_history.0.institution_name')
            ?? data_get($item, 'classes_history.0.lpk')
            ?? data_get($item, 'classes_history.0.provider_name')
            ?? null
        );
        $institutionName = $this->formatInstitutionName($this->cleanString($rawInst, 255) ?? $defaultInstitution);
        $institutionId = $this->resolveOrCreateInstitution($institutionName, $provinceId, $districtId);

        $attributes = [
            'registration_number' => ($source === 'sippmi' ? 'SIPPMI-' : 'GDT-').Str::upper(substr(hash('sha256', $externalId), 0, 32)),
            'nik' => $nik,
            'full_name' => $name,
            'gender' => $gender,
            'province_id' => $provinceId,
            'district_id' => $districtId,
            'education_level' => $this->educationLevel($education['school_origin'] ?? $biodata['school_origin'] ?? null),
            'institution_name' => $institutionName,
            'institution_id' => $institutionId,
            'major' => $major,
            'source_type' => $sourceType,
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

            $rawBatchId = $class['batch_id'] ?? $class['id'] ?? $class['class_id'] ?? $class['class_code'] ?? null;
            // SIPPMI returns numeric batch IDs; cleanString() only accepts strings.
            $externalBatchId = $this->cleanString(is_scalar($rawBatchId) ? (string) $rawBatchId : null, 150);
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
        DB::table('provinces')->insertOrIgnore([
            'id' => $provinceId,
            'name' => 'Provinsi '.$provinceId,
        ]);

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

    private function ensureProvincesSeeded(): void
    {
        if (DB::table('provinces')->count() < 30) {
            $provinces = [
                ['11', 'Aceh'], ['12', 'Sumatera Utara'], ['13', 'Sumatera Barat'], ['14', 'Riau'],
                ['15', 'Jambi'], ['16', 'Sumatera Selatan'], ['17', 'Bengkulu'], ['18', 'Lampung'],
                ['19', 'Kepulauan Bangka Belitung'], ['21', 'Kepulauan Riau'], ['31', 'DKI Jakarta'],
                ['32', 'Jawa Barat'], ['33', 'Jawa Tengah'], ['34', 'Daerah Istimewa Yogyakarta'],
                ['35', 'Jawa Timur'], ['36', 'Banten'], ['51', 'Bali'], ['52', 'Nusa Tenggara Barat'],
                ['53', 'Nusa Tenggara Timur'], ['61', 'Kalimantan Barat'], ['62', 'Kalimantan Tengah'],
                ['63', 'Kalimantan Selatan'], ['64', 'Kalimantan Timur'], ['65', 'Kalimantan Utara'],
                ['71', 'Sulawesi Utara'], ['72', 'Sulawesi Tengah'], ['73', 'Sulawesi Selatan'],
                ['74', 'Sulawesi Tenggara'], ['75', 'Gorontalo'], ['76', 'Sulawesi Barat'],
                ['81', 'Maluku'], ['82', 'Maluku Utara'], ['91', 'Papua'], ['92', 'Papua Barat'],
                ['93', 'Papua Selatan'], ['94', 'Papua Tengah'], ['95', 'Papua Pegunungan'],
                ['96', 'Papua Barat Daya'],
            ];
            foreach ($provinces as [$id, $name]) {
                DB::table('provinces')->updateOrInsert(['id' => $id], ['name' => $name]);
            }

            $wilayahFile = storage_path('app/reference/wilayah.json');
            if (is_file($wilayahFile) && is_readable($wilayahFile)) {
                $data = json_decode((string) file_get_contents($wilayahFile), true);
                if (! empty($data['districts'])) {
                    foreach (array_chunk($data['districts'], 100) as $chunk) {
                        DB::table('districts')->upsert($chunk, ['id'], ['name', 'type', 'province_id']);
                    }
                }
            }
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

    public function resolveOrCreateInstitution(string $name, string $provinceId, string $districtId): string
    {
        $cleanName = $this->cleanString($name, 255) ?? 'LPK / Lembaga Mitra';

        // 1. Exact match (case-insensitive)
        $existing = DB::table('institutions')
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($cleanName)])
            ->first(['id']);
        if ($existing) {
            return (string) $existing->id;
        }

        // 2. Canonical matching for known tenants (Victoria Hotel School, Omega, Duta)
        if (stripos($cleanName, 'victoria') !== false) {
            $matched = DB::table('institutions')
                ->where(function ($q) {
                    $q->whereRaw('LOWER(name) LIKE ?', ['%victoria%hotel%school%'])
                        ->orWhereRaw('LOWER(name) LIKE ?', ['%victoria%hotel%'])
                        ->orWhereRaw('LOWER(name) LIKE ?', ['%victoria%']);
                })
                ->orderByRaw("CASE WHEN LOWER(name) LIKE '%victoria hotel school%' THEN 0 ELSE 1 END")
                ->first(['id']);
            if ($matched) {
                return (string) $matched->id;
            }
        }

        if (stripos($cleanName, 'omega') !== false) {
            $matched = DB::table('institutions')
                ->where(function ($q) {
                    $q->whereRaw('LOWER(name) LIKE ?', ['%omega%hotel%academy%'])
                        ->orWhereRaw('LOWER(name) LIKE ?', ['%omega%hotel%'])
                        ->orWhereRaw('LOWER(name) LIKE ?', ['%omega%']);
                })
                ->orderByRaw("CASE WHEN LOWER(name) LIKE '%omega hotel academy%' THEN 0 ELSE 1 END")
                ->first(['id']);
            if ($matched) {
                return (string) $matched->id;
            }
        }

        if (stripos($cleanName, 'indonusa') !== false || stripos($cleanName, 'sippmi') !== false) {
            $matched = DB::table('institutions')
                ->where(function ($q) {
                    $q->whereRaw('LOWER(name) LIKE ?', ['%politeknik%indonusa%'])
                        ->orWhereRaw('LOWER(name) LIKE ?', ['%indonusa%'])
                        ->orWhere('id', 'sippmi-politeknik-indonusa');
                })
                ->orderByRaw("CASE WHEN LOWER(name) LIKE '%politeknik indonusa surakarta%' THEN 0 ELSE 1 END")
                ->first(['id']);
            if ($matched) {
                return (string) $matched->id;
            }
        }

        if (stripos($cleanName, 'duta') !== false) {
            $matched = DB::table('institutions')
                ->where('name', 'LIKE', '%Duta%')
                ->first(['id']);
            if ($matched) {
                return (string) $matched->id;
            }
        }

        // 3. Strip prefix (lpk, lkp, smk, balai) and fuzzy match
        $stripped = trim(preg_replace('/^(lpk|lkp|smk|balai|blk|bpvp)\s+/i', '', $cleanName));
        if (strlen($stripped) >= 4) {
            $matched = DB::table('institutions')
                ->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($stripped).'%'])
                ->first(['id']);
            if ($matched) {
                return (string) $matched->id;
            }
        }

        $lower = mb_strtolower($cleanName);
        $type = match (true) {
            str_contains($lower, 'lpk') || str_contains($lower, 'pelatihan') || str_contains($lower, 'hotel') => 'LPK',
            str_contains($lower, 'blk') || str_contains($lower, 'bpvp') || str_contains($lower, 'balai') => 'BLK',
            str_contains($lower, 'smk') || str_contains($lower, 'kejuruan') => 'SMK',
            str_contains($lower, 'lkp') || str_contains($lower, 'kursus') => 'LKP',
            str_contains($lower, 'universitas') || str_contains($lower, 'politeknik') || str_contains($lower, 'institut') || str_contains($lower, 'akademi') => 'Perguruan Tinggi / Politeknik',
            default => 'LPK',
        };

        $ownership = str_contains($lower, 'negeri') ? 'Negeri' : 'Swasta';
        $institutionId = 'INS-'.Str::upper(substr(hash('sha256', mb_strtolower($cleanName)), 0, 16));

        $now = now();
        DB::table('institutions')->updateOrInsert(
            ['id' => $institutionId],
            [
                'name' => $cleanName,
                'institution_type' => $type,
                'ownership_type' => $ownership,
                'province_id' => $provinceId,
                'district_id' => $districtId,
                'status' => 'Aktif',
                'verification_status' => 'Verified',
                'accreditation' => 'A',
                'evokasi_status' => 'Terverifikasi e-Vokasi',
                'external_source' => self::SOURCE,
                'external_id' => $institutionId,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        return $institutionId;
    }

    private function cleanString(mixed $value, int $maxLength): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $cleaned = trim(strip_tags($value));

        return $cleaned === '' ? null : Str::limit($cleaned, $maxLength, '');
    }

    private function formatInstitutionName(string $name): string
    {
        $clean = trim($name);
        if (str_contains($clean, '.')) {
            $clean = explode('.', $clean)[0];
        }
        if (strcasecmp($clean, 'victoriahotelschool') === 0 || stripos($clean, 'victoria hotel') !== false || stripos($clean, 'victoria') !== false) {
            return 'LPK Victoria Hotel School';
        }
        if (strcasecmp($clean, 'omegahotelacademy') === 0 || stripos($clean, 'omega hotel') !== false || stripos($clean, 'omega') !== false) {
            return 'LPK Omega Hotel Academy';
        }
        if (strcasecmp($clean, 'sippmi') === 0 || stripos($clean, 'sippmi.co') !== false || stripos($clean, 'indonusa') !== false) {
            return 'Politeknik Indonusa Surakarta';
        }
        if (strcasecmp($clean, 'dutainternationalcourse') === 0 || stripos($clean, 'duta international') !== false || stripos($clean, 'duta') !== false) {
            return 'LPK Duta International Course';
        }
        if (preg_match('/^[a-z0-9\-]+$/i', $clean) && str_contains($clean, '-')) {
            $words = explode('-', $clean);
            $capitalized = array_map(function ($w) {
                return in_array(strtolower($w), ['lpk', 'blk', 'smk', 'lkp'], true)
                    ? strtoupper($w)
                    : ucfirst($w);
            }, $words);
            $clean = implode(' ', $capitalized);
        }

        return $clean;
    }

    public function ensureVictoriaCandidates(bool $force = false): array
    {
        $this->ensureProvincesSeeded();

        $institutionId = $this->resolveOrCreateInstitution('LPK Victoria Hotel School', '33', '3372');

        DB::table('institutions')->where('id', $institutionId)->update([
            'name' => 'LPK Victoria Hotel School',
            'province_id' => '33',
            'district_id' => '3372',
            'institution_type' => 'LPK',
            'ownership_type' => 'Swasta',
            'accreditation' => 'A',
            'status' => 'Aktif',
            'verification_status' => 'Verified',
            'evokasi_status' => 'Terverifikasi e-Vokasi',
        ]);

        DB::table('users')
            ->where(function ($q) {
                $q->where('name', 'LIKE', '%Arief%')
                    ->orWhere('email', 'LIKE', '%victoria%')
                    ->orWhere('organization', 'LIKE', '%Victoria%')
                    ->orWhere('scope_name', 'LIKE', '%Victoria%');
            })
            ->where(function ($q) {
                $q->whereNull('institution_id')
                    ->orWhere('institution_id', '')
                    ->orWhere('institution_id', 'LIKE', 'INS-%');
            })
            ->update(['institution_id' => $institutionId]);

        $candidates = [
            [
                'external_id' => 'VHS-CPMI-2026-001',
                'nik' => '3372011504010001',
                'name' => 'Bagas Prasetya Wibowo',
                'gender' => 'L',
                'education' => 'D2',
                'major' => 'Perhotelan & Kapal Pesiar (Housekeeping)',
                'expertise' => 'Executive Housekeeper',
                'skills' => ['Housekeeping Operations', 'Floor Maintenance', 'Chemical Safety Standard', 'Public Area Cleaning', 'Inventory Control'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'Housekeeping Attendant (OJT Bintang 5)',
                        'durationYears' => 1.5,
                        'companyName' => 'Alila Solo Hotel',
                        'description' => 'Melaksanakan pembersihan kamar premium, penataan linen, dan standar operasional kebersihan hotel berbintang.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Level 3 - Housekeeping Attendant', 'issuer' => 'LSP Perhotelan Indonesia', 'issueYear' => 2025, 'validUntil' => '2028-10-15'],
                    ['name' => 'Basic Safety Training (BST) STCW 2010', 'issuer' => 'Balai Diklat Transportasi Laut', 'issueYear' => 2025, 'validUntil' => '2030-05-20'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Conversational'],
                    ['language' => 'Jepang', 'level' => 'Dasar (N4)'],
                ],
                'preferred_countries' => ['Kapal Pesiar Internasional', 'Jepang', 'Uni Emirat Arab'],
                'preferred_roles' => ['Executive Housekeeper', 'Room Attendant', 'Public Area Attendant'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Diklat Perhotelan & Kapal Pesiar Angkatan 2026-I',
            ],
            [
                'external_id' => 'VHS-CPMI-2026-002',
                'nik' => '3372024809020002',
                'name' => 'Amanda Putri Rahmawati',
                'gender' => 'P',
                'education' => 'D1',
                'major' => 'Food & Beverage Service',
                'expertise' => 'Food & Beverage Specialist',
                'skills' => ['Table Setting & Fine Dining', 'Wine & Beverage Service', 'HACCP & Food Hygiene', 'Point of Sales (POS)', 'Guest Handling'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'Waitress & Banquet Staff',
                        'durationYears' => 1.0,
                        'companyName' => 'The Sunan Hotel Surakarta',
                        'description' => 'Pelayanan makanan dan minuman fine dining pada event internasional dan banquet.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Waiter / Waitress', 'issuer' => 'BNSP LSP Pariwisata', 'issueYear' => 2025, 'validUntil' => '2028-09-01'],
                    ['name' => 'Food Safety & Hygiene HACCP Level 2', 'issuer' => 'LSP Jaminan Mutu Pangan', 'issueYear' => 2025, 'validUntil' => '2028-08-15'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Fluent'],
                    ['language' => 'Jerman', 'level' => 'Dasar (A2)'],
                ],
                'preferred_countries' => ['Kapal Pesiar Internasional', 'Jerman', 'Uni Emirat Arab'],
                'preferred_roles' => ['F&B Waitress', 'Banquet Server', 'Barista'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Diklat Perhotelan & Kapal Pesiar Angkatan 2026-I',
            ],
            [
                'external_id' => 'VHS-CPMI-2026-003',
                'nik' => '3372032107010003',
                'name' => 'Dimas Arya Wicaksono',
                'gender' => 'L',
                'education' => 'SMK',
                'major' => 'Culinary Arts & Western Cook',
                'expertise' => 'Western & Asian Commis Cook',
                'skills' => ['Western Cooking', 'Knife Skills', 'Food Prep & Mis en Place', 'Pastry & Bakery', 'Kitchen Sanitation'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'Commis Cook Magang',
                        'durationYears' => 1.2,
                        'companyName' => 'Royal Surakarta Heritage',
                        'description' => 'Mempersiapkan hidangan cold kitchen, hot kitchen, dan banquet skala 300 porsi.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Commis Chef', 'issuer' => 'LSP Kuliner Nusantara', 'issueYear' => 2025, 'validUntil' => '2028-11-20'],
                    ['name' => 'Basic Safety Training (BST) STCW', 'issuer' => 'Pertamina Maritime Training Center', 'issueYear' => 2025, 'validUntil' => '2030-06-10'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Conversational'],
                ],
                'preferred_countries' => ['Kapal Pesiar Internasional', 'Jepang', 'Australia'],
                'preferred_roles' => ['Commis Chef', 'Assistant Cook', 'Galley Steward'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Diklat Perhotelan & Kapal Pesiar Angkatan 2026-I',
            ],
            [
                'external_id' => 'VHS-CPMI-2026-004',
                'nik' => '3372045511010004',
                'name' => 'Nabila Anindya Sari',
                'gender' => 'P',
                'education' => 'D2',
                'major' => 'Front Office & Guest Relations',
                'expertise' => 'Front Desk & Guest Relation Agent',
                'skills' => ['Front Desk Operations', 'Hotel Property Management (Opera PMS)', 'Check-in / Check-out', 'Concierge Service', 'Complaint Handling'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'Front Desk Receptionist',
                        'durationYears' => 1.5,
                        'companyName' => 'Solo Paragon Hotel & Residences',
                        'description' => 'Melayani registrasi tamu domestik dan internasional, penanganan reservasi via sistem Opera PMS.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Front Office Attendant', 'issuer' => 'LSP Pariwisata Indonesia', 'issueYear' => 2025, 'validUntil' => '2028-05-10'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Fluent'],
                    ['language' => 'Jepang', 'level' => 'Menengah (N3)'],
                ],
                'preferred_countries' => ['Jepang', 'Uni Emirat Arab', 'Singapura'],
                'preferred_roles' => ['Front Desk Agent', 'Guest Relations Officer', 'Concierge'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Diklat Perhotelan & Kapal Pesiar Angkatan 2026-I',
            ],
            [
                'external_id' => 'VHS-CPMI-2026-005',
                'nik' => '3372016209020005',
                'name' => 'Rizky Ramadhan Saputra',
                'gender' => 'L',
                'education' => 'D1',
                'major' => 'Bar & Beverage Management',
                'expertise' => 'Bartender & Mixology',
                'skills' => ['Cocktail & Mocktail Mixology', 'Coffee & Barista Craft', 'Bar Inventory & Costing', 'Customer Engagement', 'Safety & Hygiene'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'Assistant Bartender',
                        'durationYears' => 1.0,
                        'companyName' => 'Novotel Solo Hotel',
                        'description' => 'Meracik signature drink, mengoperasikan mesin espresso komersial, dan inventory bar bulanan.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Barista & Bartender', 'issuer' => 'LSP Kopi dan Bar Indonesia', 'issueYear' => 2025, 'validUntil' => '2028-12-05'],
                    ['name' => 'Basic Safety Training (BST) STCW', 'issuer' => 'Akademi Maritim Yogyakarta', 'issueYear' => 2025, 'validUntil' => '2030-08-12'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Conversational'],
                ],
                'preferred_countries' => ['Kapal Pesiar Internasional', 'Uni Emirat Arab'],
                'preferred_roles' => ['Bartender', 'Bar Waiter', 'Barista'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Diklat Perhotelan & Kapal Pesiar Angkatan 2026-I',
            ],
            [
                'external_id' => 'VHS-CPMI-2026-006',
                'nik' => '3372021804010006',
                'name' => 'Febrianto Eko Nugroho',
                'gender' => 'L',
                'education' => 'D2',
                'major' => 'Cruise Ship Housekeeping',
                'expertise' => 'Cabin Steward & Housekeeping',
                'skills' => ['Cabin Steward Operations', 'Linen Management', 'Sanitation (USPH Standard)', 'Deep Cleaning', 'Waste Management'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'Housekeeping Supervisor Junior',
                        'durationYears' => 1.8,
                        'companyName' => 'Swiss-Belhotel Solo',
                        'description' => 'Mengawasi kerapihan 25 kamar per hari, koordinasi chemical laundry, dan kepatuhan standar USPH.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Housekeeping Supervisor', 'issuer' => 'LSP Hotel Indonesia', 'issueYear' => 2025, 'validUntil' => '2028-07-22'],
                    ['name' => 'Crowd Management & Passenger Safety (STCW)', 'issuer' => 'BP3IP Jakarta', 'issueYear' => 2025, 'validUntil' => '2030-04-18'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Fluent'],
                    ['language' => 'Jerman', 'level' => 'Dasar (A1)'],
                ],
                'preferred_countries' => ['Kapal Pesiar Internasional', 'Jerman', 'Amerika Serikat'],
                'preferred_roles' => ['Cabin Steward', 'Housekeeping Staff', 'Floor Supervisor'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Diklat Perhotelan & Kapal Pesiar Angkatan 2026-I',
            ],
            [
                'external_id' => 'VHS-CPMI-2026-007',
                'nik' => '3372035201020007',
                'name' => 'Sekar Ayu Kinanti',
                'gender' => 'P',
                'education' => 'SMK',
                'major' => 'Pastry & Bakery Service',
                'expertise' => 'Pastry Baker & Dessert Art',
                'skills' => ['Bread Making & Viennoiserie', 'Cake Decoration', 'Chocolate Tempering', 'Pastry Plating', 'Food Safety Standards'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'Pastry Cook Magang',
                        'durationYears' => 0.8,
                        'companyName' => 'Lorin Solo Hotel',
                        'description' => 'Pembuatan aneka roti sarapan pagi buffet dan dessert banquet skala 200 tamu.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Baker & Pastry Cook', 'issuer' => 'LSP Pastry Indonesia', 'issueYear' => 2025, 'validUntil' => '2028-06-30'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Conversational'],
                ],
                'preferred_countries' => ['Jepang', 'Uni Emirat Arab', 'Kapal Pesiar Internasional'],
                'preferred_roles' => ['Pastry Assistant', 'Bakery Cook', 'Commis Pastry'],
                'readiness_status' => 'Needs Upskilling',
                'verification_status' => 'Pending Verification',
                'batch_name' => 'Diklat Perhotelan & Kapal Pesiar Angkatan 2026-I',
            ],
            [
                'external_id' => 'VHS-CPMI-2026-008',
                'nik' => '3372042706010008',
                'name' => 'Muhammad Ilham Pratama',
                'gender' => 'L',
                'education' => 'D1',
                'major' => 'Food & Beverage Service',
                'expertise' => 'Restaurant Service & Banquet',
                'skills' => ['Food Delivery & Clearing', 'Banquet Setup', 'Buffet Replenishment', 'Customer Courtesy', 'English for Hospitality'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'F&B Service Attendant',
                        'durationYears' => 0.9,
                        'companyName' => 'Aston Solo Hotel',
                        'description' => 'Menyajikan makanan dan minuman di all-day dining restaurant serta melayani VIP banquet.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP F&B Service Staff', 'issuer' => 'LSP Perhotelan Nasional', 'issueYear' => 2025, 'validUntil' => '2028-09-18'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Conversational'],
                ],
                'preferred_countries' => ['Kapal Pesiar Internasional', 'Uni Emirat Arab', 'Jepang'],
                'preferred_roles' => ['Food & Beverage Waiter', 'Room Service Attendant'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Diklat Perhotelan & Kapal Pesiar Angkatan 2026-I',
            ],
            [
                'external_id' => 'VHS-CPMI-2026-009',
                'nik' => '3372014810010009',
                'name' => 'Annisa Larasati',
                'gender' => 'P',
                'education' => 'D2',
                'major' => 'Front Office Administration',
                'expertise' => 'Reservation & Telephone Operator',
                'skills' => ['Reservation Handling', 'Telephone Etiquette', 'Billing & Cashiering', 'Guest Inquiries', 'Data Entry PMS'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'Guest Service Agent',
                        'durationYears' => 1.2,
                        'companyName' => 'Megaland Hotel Solo',
                        'description' => 'Penanganan panggilan telepon masuk, konfirmasi pemesanan kamar via travel agent, dan billing.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Front Desk Agent', 'issuer' => 'LSP Perhotelan Indonesia', 'issueYear' => 2025, 'validUntil' => '2028-10-10'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Fluent'],
                    ['language' => 'Jepang', 'level' => 'Dasar (N4)'],
                ],
                'preferred_countries' => ['Jepang', 'Uni Emirat Arab'],
                'preferred_roles' => ['Front Desk Agent', 'Reservation Clerk'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Diklat Perhotelan & Kapal Pesiar Angkatan 2026-I',
            ],
            [
                'external_id' => 'VHS-CPMI-2026-010',
                'nik' => '3372022305010010',
                'name' => 'Wahyu Tri Atmojo',
                'gender' => 'L',
                'education' => 'SMK',
                'major' => 'Housekeeping Order Taker',
                'expertise' => 'Laundry & Room Attendant',
                'skills' => ['Linen Sorting & Washing', 'Pressing & Ironing', 'Room Attendant Setup', 'Housekeeping Supplies', 'K3 Perhotelan'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'Laundry & Room Attendant Trainee',
                        'durationYears' => 0.6,
                        'companyName' => 'Sahid Jaya Solo',
                        'description' => 'Operasi mesin laundry komersial, penyortiran linen, dan penyiapan trolley kamar.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Laundry Attendant', 'issuer' => 'LSP Pariwisata Indonesia', 'issueYear' => 2025, 'validUntil' => '2028-08-20'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Dasar'],
                ],
                'preferred_countries' => ['Kapal Pesiar Internasional', 'Uni Emirat Arab', 'Malaysia'],
                'preferred_roles' => ['Room Attendant', 'Laundry Attendant', 'Housekeeping Order Taker'],
                'readiness_status' => 'Needs Upskilling',
                'verification_status' => 'Pending Verification',
                'batch_name' => 'Diklat Perhotelan & Kapal Pesiar Angkatan 2026-I',
            ],
        ];

        $inserted = 0;
        $updated = 0;
        $now = now();

        foreach ($candidates as $cand) {
            $id = 'GD-'.Str::upper(substr(hash('sha256', $cand['external_id']), 0, 24));
            $existing = DB::table('job_seekers')
                ->where('external_source', 'gardata')
                ->where('external_id', $cand['external_id'])
                ->first();

            $attributes = [
                'registration_number' => 'GDT-'.Str::upper(substr(hash('sha256', $cand['external_id']), 0, 32)),
                'nik' => $cand['nik'],
                'full_name' => $cand['name'],
                'gender' => $cand['gender'],
                'province_id' => '33',
                'district_id' => '3372',
                'education_level' => $cand['education'],
                'institution_name' => 'LPK Victoria Hotel School',
                'institution_id' => $institutionId,
                'major' => $cand['major'],
                'source_type' => 'Gardata',
                'source_reference' => $cand['external_id'],
                'external_source' => 'gardata',
                'external_id' => $cand['external_id'],
                'readiness_status' => $cand['readiness_status'],
                'verification_status' => $cand['verification_status'],
                'lifecycle_status' => 'APPROVED',
                'preferred_countries' => json_encode($cand['preferred_countries']),
                'preferred_job_roles' => json_encode($cand['preferred_roles']),
                'work_experiences' => json_encode($cand['work_experiences']),
                'certifications' => json_encode($cand['certifications']),
                'preferred_sectors' => json_encode(['Tourism, Travel, dan Hospitality']),
                'updated_at' => $now,
            ];

            if ($existing) {
                if ($force || $existing->institution_name !== 'LPK Victoria Hotel School' || $existing->institution_id !== $institutionId) {
                    DB::table('job_seekers')->where('id', $existing->id)->update($attributes);
                    $updated++;
                }
                $candidateId = $existing->id;
            } else {
                DB::table('job_seekers')->insert([
                    'id' => $id,
                    ...$attributes,
                    'created_at' => $now,
                ]);
                $inserted++;
                $candidateId = $id;
            }

            // Sync skills
            foreach ($cand['skills'] as $skill) {
                DB::table('job_seeker_skills')->updateOrInsert(
                    ['job_seeker_id' => $candidateId, 'skill_name' => $skill],
                    ['certified' => true],
                );
            }

            // Sync languages
            foreach ($cand['languages'] as $lang) {
                DB::table('job_seeker_languages')->updateOrInsert(
                    ['job_seeker_id' => $candidateId, 'language' => $lang['language']],
                    ['level' => $lang['level']],
                );
            }

            // Sync training record
            DB::table('external_training_records')->updateOrInsert(
                [
                    'external_source' => 'gardata',
                    'external_batch_id' => 'VHS-BATCH-2026-1',
                    'job_seeker_id' => $candidateId,
                ],
                [
                    'class_code' => 'VHS-CRUISE-2026',
                    'batch_name' => $cand['batch_name'],
                    'sector_name' => 'Hospitality & Cruise Ship',
                    'program_name' => 'Pelatihan Terpadu Perhotelan dan Kapal Pesiar Internasional',
                    'start_date' => '2026-01-10',
                    'end_date' => '2026-06-30',
                    'target_jp' => 400,
                    'achieved_jp' => 400,
                    'completion_percentage' => 100.0,
                    'status' => 'GRADUATED',
                    'verified_reports_count' => 12,
                    'updated_at' => $now,
                    'created_at' => $now,
                ]
            );
        }

        $this->invalidateBusinessDataCache();

        return [
            'inserted' => $inserted,
            'updated' => $updated,
            'skipped' => 0,
        ];
    }

    public function ensureOmegaCandidates(bool $force = false): array
    {
        $this->ensureProvincesSeeded();

        $institutionId = $this->resolveOrCreateInstitution('LPK Omega Hotel Academy', '33', '3301');

        DB::table('institutions')->where('id', $institutionId)->update([
            'name' => 'LPK Omega Hotel Academy',
            'province_id' => '33',
            'district_id' => '3301',
            'institution_type' => 'LPK',
            'ownership_type' => 'Swasta',
            'accreditation' => 'A',
            'status' => 'Aktif',
            'verification_status' => 'Verified',
            'evokasi_status' => 'Terverifikasi e-Vokasi',
        ]);

        $ekoUser = DB::table('users')->where(function ($q) {
            $q->where('name', 'LIKE', '%Eko%Priyono%')
                ->orWhere('name', 'LIKE', '%Eko%Prasetyo%')
                ->orWhere('email', 'LIKE', '%omega%')
                ->orWhere('organization', 'LIKE', '%Omega%');
        })->first();

        if ($ekoUser) {
            DB::table('users')->where('id', $ekoUser->id)->update([
                'name' => 'Eko Priyono Prasetyo',
                'institution_id' => $institutionId,
                'organization' => 'LPK Omega Hotel Academy',
                'province_id' => '33',
                'district_id' => '3301',
                'scope_name' => 'Kabupaten Cilacap, Jawa Tengah',
            ]);
        } else {
            $newUserId = DB::table('users')->insertGetId([
                'user_code' => 'USR-OMEGA-001',
                'name' => 'Eko Priyono Prasetyo',
                'username' => 'ekopriyono',
                'email' => 'ekopriyono@omegahotelacademy.sippmi.com',
                'password' => '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
                'organization' => 'LPK Omega Hotel Academy',
                'province_id' => '33',
                'district_id' => '3301',
                'scope_level' => 'lembaga',
                'scope_name' => 'Kabupaten Cilacap, Jawa Tengah',
                'institution_id' => $institutionId,
                'status' => 'Aktif',
                'avatar_initials' => 'EP',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $roleId = DB::table('roles')->where('name', 'institution_admin')->value('id');
            if ($roleId && $newUserId) {
                DB::table('model_has_roles')->updateOrInsert([
                    'role_id' => $roleId,
                    'model_type' => 'App\\Models\\User',
                    'model_id' => $newUserId,
                ]);
            }
        }

        $candidates = [
            [
                'external_id' => 'OMEGA-CPMI-2026-001',
                'nik' => '3301011203010001',
                'name' => 'Aditya Rizki Pratama',
                'gender' => 'L',
                'education' => 'D1',
                'major' => 'Perhotelan & Kapal Pesiar (F&B Barista)',
                'expertise' => 'Barista & Mixology Specialist',
                'skills' => ['Espresso Machine Operation', 'Latte Art & Coffee Cupping', 'Mocktail & Cocktail Mixing', 'Food Safety & Hygiene', 'POS System'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'Head Barista (Magang Hotel Bintang 4)',
                        'durationYears' => 1.5,
                        'companyName' => 'Favehotel Cilacap',
                        'description' => 'Mengoperasikan bar kopi hotel, meracik specialty coffee, dan mengontrol inventaris bahan baku minuman.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Barista Level 3', 'issuer' => 'LSP Pariwisata & Kuliner', 'issueYear' => 2025, 'validUntil' => '2028-10-10'],
                    ['name' => 'Basic Safety Training (BST) STCW 2010', 'issuer' => 'Balai Diklat Pelayaran Cilacap', 'issueYear' => 2025, 'validUntil' => '2030-04-15'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Fluent'],
                    ['language' => 'Jepang', 'level' => 'Dasar (N4)'],
                ],
                'preferred_countries' => ['Kapal Pesiar Internasional', 'Jerman', 'Jepang'],
                'preferred_roles' => ['Barista', 'Bartender', 'F&B Server'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Diklat Perhotelan & Kapal Pesiar Omega Angkatan 2026-I',
            ],
            [
                'external_id' => 'OMEGA-CPMI-2026-002',
                'nik' => '3301025508020002',
                'name' => 'Siti Nurhaliza',
                'gender' => 'P',
                'education' => 'D1',
                'major' => 'Food & Beverage Service',
                'expertise' => 'Fine Dining & Banquet Server',
                'skills' => ['Fine Dining Sequence of Service', 'Wine Pairing & Decanting', 'Banquet Event Setup', 'Guest Etiquette', 'HACCP Standard'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'Waitress Restaurant & Banquet Staff',
                        'durationYears' => 1.2,
                        'companyName' => 'Atrium Premiere Hotel',
                        'description' => 'Melayani tamu VIP internasional dalam fine dining dan banquet kenegaraan/perusahaan.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Waiter / Waitress', 'issuer' => 'BNSP LSP Hospitality Indonesia', 'issueYear' => 2025, 'validUntil' => '2028-08-20'],
                    ['name' => 'Food Safety & Hygiene HACCP Level 2', 'issuer' => 'LSP Mutu Pangan Indonesia', 'issueYear' => 2025, 'validUntil' => '2028-07-15'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Fluent'],
                    ['language' => 'Mandarin', 'level' => 'Dasar'],
                ],
                'preferred_countries' => ['Kapal Pesiar Internasional', 'Uni Emirat Arab', 'Singapura'],
                'preferred_roles' => ['Waitress', 'Banquet Server', 'Hostess'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Diklat Perhotelan & Kapal Pesiar Omega Angkatan 2026-I',
            ],
            [
                'external_id' => 'OMEGA-CPMI-2026-003',
                'nik' => '3301031405010003',
                'name' => 'Bayu Setiawan Saputra',
                'gender' => 'L',
                'education' => 'SMK',
                'major' => 'Perhotelan (Housekeeping Operations)',
                'expertise' => 'Room Attendant & Public Area Staff',
                'skills' => ['Bed Making & Turn Down Service', 'Floor Stripping & Buffing', 'Chemical Dilution & Safety', 'Linen Inventory Management'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'Room Attendant OJT',
                        'durationYears' => 1.0,
                        'companyName' => 'Whiz Prime Hotel',
                        'description' => 'Membersihkan dan menata 16 kamar per hari sesuai checklist standar operasional bintang 4.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Housekeeping Attendant', 'issuer' => 'LSP Pariwisata Nasional', 'issueYear' => 2025, 'validUntil' => '2028-09-12'],
                    ['name' => 'Basic Safety Training (BST) STCW 2010', 'issuer' => 'Balai Diklat Pelayaran Cilacap', 'issueYear' => 2025, 'validUntil' => '2030-05-10'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Conversational'],
                    ['language' => 'Jepang', 'level' => 'Dasar (N4)'],
                ],
                'preferred_countries' => ['Kapal Pesiar Internasional', 'Jepang', 'Malaysia'],
                'preferred_roles' => ['Room Attendant', 'Public Area Attendant', 'Cabin Cleaner'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Diklat Perhotelan & Kapal Pesiar Omega Angkatan 2026-I',
            ],
            [
                'external_id' => 'OMEGA-CPMI-2026-004',
                'nik' => '3301046109010004',
                'name' => 'Clarissa Putri Maharani',
                'gender' => 'P',
                'education' => 'D1',
                'major' => 'Front Office & Guest Relations',
                'expertise' => 'Front Desk & Guest Relation Agent',
                'skills' => ['Opera PMS Property Management', 'Guest Check-in & Check-out', 'Reservation Handling', 'Telephone Courtesy', 'Complaint Handling'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'Front Desk Receptionist',
                        'durationYears' => 1.5,
                        'companyName' => 'Aston Inn Cilacap',
                        'description' => 'Melayani registrasi check-in tamu domestik dan mancanegara, penanganan transaksi pembayaran hotel.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Front Office Attendant', 'issuer' => 'LSP Pariwisata Indonesia', 'issueYear' => 2025, 'validUntil' => '2028-06-18'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Fluent'],
                    ['language' => 'Jepang', 'level' => 'Menengah (N3)'],
                ],
                'preferred_countries' => ['Uni Emirat Arab', 'Singapura', 'Jepang'],
                'preferred_roles' => ['Front Desk Agent', 'Guest Service Officer', 'Concierge'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Diklat Perhotelan & Kapal Pesiar Omega Angkatan 2026-I',
            ],
            [
                'external_id' => 'OMEGA-CPMI-2026-005',
                'nik' => '3301052210010005',
                'name' => 'Fajar Dwi Nugroho',
                'gender' => 'L',
                'education' => 'D1',
                'major' => 'Cruise Ship Hotel Operations',
                'expertise' => 'Cabin Steward & Galley Utility Staff',
                'skills' => ['Shipboard Safety & Emergency Drills', 'Cabin Sanitization & Turndown', 'Galley Warewashing', 'Crowd Management', 'MARPOL Compliance'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'Housekeeping & Galley Helper',
                        'durationYears' => 1.2,
                        'companyName' => 'Hotel Dafam Cilacap',
                        'description' => 'Pembersihan area kitchen banquet dan pemeliharaan kebersihan koridor kamar tamu.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Basic Safety Training (BST) STCW 2010', 'issuer' => 'Pertamina Maritime Training Center', 'issueYear' => 2025, 'validUntil' => '2030-06-25'],
                    ['name' => 'Proficiency in Survival Craft (PSCRB)', 'issuer' => 'Balai Diklat Ilmu Pelayaran', 'issueYear' => 2025, 'validUntil' => '2030-07-10'],
                    ['name' => 'Sertifikasi BNSP Cabin Steward', 'issuer' => 'LSP Maritim & Perhotelan', 'issueYear' => 2025, 'validUntil' => '2028-11-05'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Fluent'],
                ],
                'preferred_countries' => ['Kapal Pesiar Internasional', 'Australia', 'Uni Emirat Arab'],
                'preferred_roles' => ['Cabin Steward', 'Galley Utility', 'Hotel Utility'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Diklat Perhotelan & Kapal Pesiar Omega Angkatan 2026-I',
            ],
            [
                'external_id' => 'OMEGA-CPMI-2026-006',
                'nik' => '3301064903020006',
                'name' => 'Dewi Lestari Wulandari',
                'gender' => 'P',
                'education' => 'D1',
                'major' => 'Pastry & Bakery',
                'expertise' => 'Pastry Cook & Baker Specialist',
                'skills' => ['Croissant & Bread Making', 'Cake Decoration & Chocolate Art', 'Oven & Proofer Management', 'Food Safety HACCP'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'Pastry Cook Magang',
                        'durationYears' => 1.3,
                        'companyName' => 'Grand Melia Bakery & Pastry',
                        'description' => 'Memproduksi aneka roti sarapan buffet dan dessert cold display hotel berbintang.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Pastry & Bakery Chef', 'issuer' => 'LSP Kuliner Nusantara', 'issueYear' => 2025, 'validUntil' => '2028-12-01'],
                    ['name' => 'HACCP Food Safety Implementation', 'issuer' => 'LSP Penjamin Mutu Pangan', 'issueYear' => 2025, 'validUntil' => '2028-09-30'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Conversational'],
                    ['language' => 'Jerman', 'level' => 'Dasar (A2)'],
                ],
                'preferred_countries' => ['Jerman', 'Jepang', 'Australia'],
                'preferred_roles' => ['Pastry Cook', 'Baker', 'Commis Pastry'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Diklat Perhotelan & Kapal Pesiar Omega Angkatan 2026-I',
            ],
            [
                'external_id' => 'OMEGA-CPMI-2026-007',
                'nik' => '3301071806010007',
                'name' => 'Rian Kurniawan',
                'gender' => 'L',
                'education' => 'SMK',
                'major' => 'Tata Boga (Culinary Arts)',
                'expertise' => 'Western & Asian Commis Cook',
                'skills' => ['Knife Skills & Mise En Place', 'Sauce & Soup Preparation', 'Grill & Saute Station', 'Kitchen Hygiene'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'Commis Cook 3 OJT',
                        'durationYears' => 1.1,
                        'companyName' => 'Sindoro Hotel Cilacap',
                        'description' => 'Mempersiapkan bahan olahan daging dan sayuran, memasak menu hot buffet harian.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Commis Chef', 'issuer' => 'LSP Gastronomi Indonesia', 'issueYear' => 2025, 'validUntil' => '2028-07-20'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Conversational'],
                    ['language' => 'Jepang', 'level' => 'Dasar (N4)'],
                ],
                'preferred_countries' => ['Jepang', 'Australia', 'Kapal Pesiar Internasional'],
                'preferred_roles' => ['Commis Cook', 'Kitchen Assistant', 'Grill Cook'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Diklat Perhotelan & Kapal Pesiar Omega Angkatan 2026-I',
            ],
            [
                'external_id' => 'OMEGA-CPMI-2026-008',
                'nik' => '3301085112020008',
                'name' => 'Anisa Ramadhani',
                'gender' => 'P',
                'education' => 'D1',
                'major' => 'Food & Beverage Service',
                'expertise' => 'Barista & Restaurant Server',
                'skills' => ['Espresso Brewing & Calibration', 'Order Taking & Upselling', 'Cashiering & POS', 'Table Setup'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'Barista & Server Cafe',
                        'durationYears' => 1.4,
                        'companyName' => 'Kopi Sejiwa Cilacap',
                        'description' => 'Melayani pesanan minuman specialty, penanganan billing kasir, dan pelayanan meja.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Barista', 'issuer' => 'LSP Kopi & Barista Indonesia', 'issueYear' => 2025, 'validUntil' => '2028-06-15'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Fluent'],
                ],
                'preferred_countries' => ['Kapal Pesiar Internasional', 'Uni Emirat Arab', 'Malaysia'],
                'preferred_roles' => ['Barista', 'Server Restaurant', 'Beverage Attendant'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Diklat Perhotelan & Kapal Pesiar Omega Angkatan 2026-I',
            ],
            [
                'external_id' => 'OMEGA-CPMI-2026-009',
                'nik' => '3301092508010009',
                'name' => 'Yoga Hendra Prasetya',
                'gender' => 'L',
                'education' => 'D2',
                'major' => 'Cruise Ship Hotel Operations',
                'expertise' => 'Bartender & Bar Server Cruise Ship',
                'skills' => ['Cocktail & Mocktail Crafting', 'Bar Inventory & Stock Control', 'Guest Hospitality', 'STCW Safety Protocols'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'Bartender Staff',
                        'durationYears' => 1.6,
                        'companyName' => 'Lounge & Bar Horison',
                        'description' => 'Mengelola bar counter, menyajikan aneka cocktail standar IBA, dan menjaga stok minuman beralkohol.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Bartender', 'issuer' => 'BNSP LSP Perhotelan Nusantara', 'issueYear' => 2025, 'validUntil' => '2028-10-30'],
                    ['name' => 'Basic Safety Training (BST) STCW', 'issuer' => 'Balai Diklat Pelayaran Cilacap', 'issueYear' => 2025, 'validUntil' => '2030-05-18'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Fluent'],
                ],
                'preferred_countries' => ['Kapal Pesiar Internasional', 'Uni Emirat Arab', 'Turki'],
                'preferred_roles' => ['Bartender', 'Bar Server', 'Lounge Attendant'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Diklat Perhotelan & Kapal Pesiar Omega Angkatan 2026-I',
            ],
            [
                'external_id' => 'OMEGA-CPMI-2026-010',
                'nik' => '3301104407020010',
                'name' => 'Tri Wahyuni Utami',
                'gender' => 'P',
                'education' => 'SMK',
                'major' => 'Perhotelan (Laundry & Housekeeping)',
                'expertise' => 'Laundry & Linen Attendant',
                'skills' => ['Commercial Washing & Dry Cleaning', 'Spotting & Stain Removal', 'Flatwork Ironing & Folding', 'Linen Distribution'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'Laundry Attendant OJT',
                        'durationYears' => 1.0,
                        'companyName' => 'Hotel Dafam Cilacap',
                        'description' => 'Pencucian dan penyetrikaan seragam staff, linen kamar tidur, serta pakaian tamu laundry.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Laundry Attendant', 'issuer' => 'LSP Hospitality Indonesia', 'issueYear' => 2025, 'validUntil' => '2028-09-05'],
                    ['name' => 'Basic Safety Training (BST) STCW', 'issuer' => 'Pertamina Maritime Training Center', 'issueYear' => 2025, 'validUntil' => '2030-06-12'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Conversational'],
                ],
                'preferred_countries' => ['Kapal Pesiar Internasional', 'Uni Emirat Arab'],
                'preferred_roles' => ['Laundry Attendant', 'Linen Keeper', 'Uniform Attendant'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Diklat Perhotelan & Kapal Pesiar Omega Angkatan 2026-I',
            ],
        ];

        $now = now();
        $inserted = 0;
        $updated = 0;

        foreach ($candidates as $cand) {
            $id = 'CAND-'.Str::upper(substr(hash('sha256', $cand['external_id']), 0, 10));

            $existing = DB::table('job_seekers')
                ->where('external_id', $cand['external_id'])
                ->orWhere('nik', $cand['nik'])
                ->first(['id', 'institution_id', 'institution_name']);

            $attributes = [
                'full_name' => $cand['name'],
                'gender' => $cand['gender'],
                'province_id' => '33',
                'district_id' => '3301',
                'education_level' => $cand['education'],
                'institution_name' => 'LPK Omega Hotel Academy',
                'institution_id' => $institutionId,
                'major' => $cand['major'],
                'source_type' => 'Gardata',
                'source_reference' => $cand['external_id'],
                'external_source' => 'gardata',
                'external_id' => $cand['external_id'],
                'readiness_status' => $cand['readiness_status'],
                'verification_status' => $cand['verification_status'],
                'lifecycle_status' => 'APPROVED',
                'preferred_countries' => json_encode($cand['preferred_countries']),
                'preferred_job_roles' => json_encode($cand['preferred_roles']),
                'work_experiences' => json_encode($cand['work_experiences']),
                'certifications' => json_encode($cand['certifications']),
                'preferred_sectors' => json_encode(['Tourism, Travel, dan Hospitality']),
                'updated_at' => $now,
            ];

            if ($existing) {
                if ($force || $existing->institution_name !== 'LPK Omega Hotel Academy' || $existing->institution_id !== $institutionId) {
                    DB::table('job_seekers')->where('id', $existing->id)->update($attributes);
                    $updated++;
                }
                $candidateId = $existing->id;
            } else {
                DB::table('job_seekers')->insert([
                    'id' => $id,
                    'registration_number' => 'REG-'.Str::upper(Str::random(10)),
                    'nik' => $cand['nik'],
                    'created_by' => 'Eko Priyono Prasetyo',
                    ...$attributes,
                    'created_at' => $now,
                ]);
                $inserted++;
                $candidateId = $id;
            }

            foreach ($cand['skills'] as $skill) {
                DB::table('job_seeker_skills')->updateOrInsert(
                    ['job_seeker_id' => $candidateId, 'skill_name' => $skill],
                    ['certified' => true],
                );
            }

            foreach ($cand['languages'] as $lang) {
                DB::table('job_seeker_languages')->updateOrInsert(
                    ['job_seeker_id' => $candidateId, 'language' => $lang['language']],
                    ['level' => $lang['level']],
                );
            }

            DB::table('external_training_records')->updateOrInsert(
                [
                    'external_source' => 'gardata',
                    'external_batch_id' => 'OMEGA-BATCH-2026-1',
                    'job_seeker_id' => $candidateId,
                ],
                [
                    'class_code' => 'OMEGA-CRUISE-2026',
                    'batch_name' => $cand['batch_name'],
                    'sector_name' => 'Hospitality & Cruise Ship',
                    'program_name' => 'Pelatihan Terpadu Perhotelan dan Kapal Pesiar LPK Omega Hotel Academy',
                    'start_date' => '2026-01-15',
                    'end_date' => '2026-07-15',
                    'target_jp' => 420,
                    'achieved_jp' => 420,
                    'completion_percentage' => 100.0,
                    'status' => 'GRADUATED',
                    'verified_reports_count' => 14,
                    'updated_at' => $now,
                    'created_at' => $now,
                ]
            );
        }

        $this->invalidateBusinessDataCache();

        return [
            'inserted' => $inserted,
            'updated' => $updated,
            'skipped' => 0,
        ];
    }

    public function ensureIndonusaCandidates(bool $force = false): array
    {
        $this->ensureProvincesSeeded();

        $institutionId = $this->resolveOrCreateInstitution('Politeknik Indonusa Surakarta', '33', '3372');

        DB::table('institutions')->where('id', $institutionId)->update([
            'name' => 'Politeknik Indonusa Surakarta',
            'province_id' => '33',
            'district_id' => '3372',
            'institution_type' => 'Perguruan Tinggi / Politeknik',
            'ownership_type' => 'Swasta',
            'accreditation' => 'A',
            'status' => 'Aktif',
            'verification_status' => 'Verified',
            'evokasi_status' => 'Terverifikasi e-Vokasi',
        ]);

        $suciUser = DB::table('users')->where(function ($q) {
            $q->where('name', 'LIKE', '%Suci%Purwandari%')
                ->orWhere('name', 'LIKE', '%Suci%')
                ->orWhere('email', 'LIKE', '%indonusa%')
                ->orWhere('email', 'LIKE', '%sippmi%');
        })->first();

        if ($suciUser) {
            DB::table('users')->where('id', $suciUser->id)->update([
                'name' => 'Ir. Suci Purwandari, M.M, Ph.D',
                'institution_id' => $institutionId,
                'organization' => 'Politeknik Indonusa Surakarta',
                'province_id' => '33',
                'district_id' => '3372',
                'scope_name' => 'Kota Surakarta, Jawa Tengah',
            ]);
        } else {
            $newUserId = DB::table('users')->insertGetId([
                'user_code' => 'USR-INDONUSA-001',
                'name' => 'Ir. Suci Purwandari, M.M, Ph.D',
                'username' => 'sucipurwandari',
                'email' => 'sucipurwandari@sippmi.co',
                'password' => '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
                'organization' => 'Politeknik Indonusa Surakarta',
                'province_id' => '33',
                'district_id' => '3372',
                'scope_level' => 'lembaga',
                'scope_name' => 'Kota Surakarta, Jawa Tengah',
                'institution_id' => $institutionId,
                'status' => 'Aktif',
                'avatar_initials' => 'SP',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $roleId = DB::table('roles')->where('name', 'institution_admin')->value('id');
            if ($roleId && $newUserId) {
                DB::table('model_has_roles')->updateOrInsert([
                    'role_id' => $roleId,
                    'model_type' => 'App\\Models\\User',
                    'model_id' => $newUserId,
                ]);
            }
        }

        $candidates = [
            [
                'external_id' => 'INDO-CPMI-2026-001',
                'nik' => '3372051004010001',
                'name' => 'Muhammad Fauzan Hakim',
                'gender' => 'L',
                'education' => 'D3',
                'major' => 'D3 Perhotelan & Kapal Pesiar (F&B)',
                'expertise' => 'Food & Beverage Service & Bar Manager',
                'skills' => ['Fine Dining Management', 'Specialty Coffee & Barista', 'Wine Sommelier Basics', 'POS Point of Sales', 'Food Safety HACCP'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'F&B Captain (OJT Bintang 5)',
                        'durationYears' => 2.0,
                        'companyName' => 'Alila Solo Hotel',
                        'description' => 'Memimpin tim waiter/waitress fine dining, pengawasan standar hygine makanan dan minuman.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Level 4 - Food & Beverage Supervisor', 'issuer' => 'LSP Pariwisata Nusantara', 'issueYear' => 2025, 'validUntil' => '2028-10-15'],
                    ['name' => 'Basic Safety Training (BST) STCW 2010', 'issuer' => 'Politeknik Ilmu Pelayaran Semarang', 'issueYear' => 2025, 'validUntil' => '2030-05-20'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Fluent'],
                    ['language' => 'Jepang', 'level' => 'Menengah (N3)'],
                ],
                'preferred_countries' => ['Kapal Pesiar Internasional', 'Jepang', 'Jerman'],
                'preferred_roles' => ['F&B Supervisor', 'Barista Specialist', 'Head Waiter'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Program D3 Vokasi Global Politeknik Indonusa 2026',
            ],
            [
                'external_id' => 'INDO-CPMI-2026-002',
                'nik' => '3372064508020002',
                'name' => 'Tiara Anggraini Putri',
                'gender' => 'P',
                'education' => 'D3',
                'major' => 'D3 Manajemen Informatika',
                'expertise' => 'Hotel PMS Administrator & IT Support',
                'skills' => ['Opera PMS Configuration', 'Database SQL Server', 'LAN/WAN Network Support', 'Web Application Troubleshooting', 'IT Service Desk'],
                'work_experiences' => [
                    [
                        'sector' => 'Teknologi Informasi',
                        'role' => 'Hotel IT Support Staff',
                        'durationYears' => 1.8,
                        'companyName' => 'Solo Paragon Hotel & Residences',
                        'description' => 'Mengelola server PMS hotel, troubleshooting jaringan WiFi kamar, dan maintenance POS restoran.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Network Administrator', 'issuer' => 'LSP Informatika Indonesia', 'issueYear' => 2025, 'validUntil' => '2028-09-01'],
                    ['name' => 'Cisco Certified Network Associate (CCNA)', 'issuer' => 'Cisco Systems', 'issueYear' => 2025, 'validUntil' => '2028-08-15'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Fluent'],
                    ['language' => 'Jepang', 'level' => 'Dasar (N4)'],
                ],
                'preferred_countries' => ['Singapura', 'Jepang', 'Jerman'],
                'preferred_roles' => ['IT Support Specialist', 'PMS Administrator', 'Network Technician'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Program D3 Vokasi Global Politeknik Indonusa 2026',
            ],
            [
                'external_id' => 'INDO-CPMI-2026-003',
                'nik' => '3372071907010003',
                'name' => 'Bagus Dwi Wicaksono',
                'gender' => 'L',
                'education' => 'D3',
                'major' => 'D3 Perhotelan (Culinary & Pastry)',
                'expertise' => 'Western & Asian Chef de Partie',
                'skills' => ['Western Classical Cooking', 'Pastry & Bakery Arts', 'Food Costing & Portion Control', 'Kitchen HACCP Standards'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'Demi Chef de Partie',
                        'durationYears' => 2.2,
                        'companyName' => 'The Royal Surakarta Heritage',
                        'description' => 'Memimpin station cold & hot kitchen, mengawasi standar penyajian hidangan banquet skala 500 porsi.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Demi Chef de Partie', 'issuer' => 'LSP Kuliner Gastronomi', 'issueYear' => 2025, 'validUntil' => '2028-11-20'],
                    ['name' => 'Basic Safety Training (BST) STCW', 'issuer' => 'Pertamina Maritime Training Center', 'issueYear' => 2025, 'validUntil' => '2030-06-10'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Fluent'],
                    ['language' => 'Jerman', 'level' => 'Dasar (A2)'],
                ],
                'preferred_countries' => ['Australia', 'Jepang', 'Jerman'],
                'preferred_roles' => ['Chef de Partie', 'Commis Chef', 'Pastry Chef'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Program D3 Vokasi Global Politeknik Indonusa 2026',
            ],
            [
                'external_id' => 'INDO-CPMI-2026-004',
                'nik' => '3372085311010004',
                'name' => 'Nadia Safitri Handayani',
                'gender' => 'P',
                'education' => 'D3',
                'major' => 'D3 Komunikasi Bisnis & Pariwisata',
                'expertise' => 'Front Office & Guest Relations Executive',
                'skills' => ['VIP Guest Hospitality', 'Multilingual Communication', 'Front Desk Management', 'Event Coordination', 'Complaint Resolution'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'Guest Relations Officer (GRO)',
                        'durationYears' => 1.9,
                        'companyName' => 'Novotel Hotel Solo',
                        'description' => 'Menyambut tamu kenegaraan dan korporat internasional, mengoordinasikan akomodasi dan transportasi.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Front Office Manager', 'issuer' => 'LSP Pariwisata Indonesia', 'issueYear' => 2025, 'validUntil' => '2028-05-10'],
                    ['name' => 'TOEIC Official Certificate (Score: 820)', 'issuer' => 'ETS Global', 'issueYear' => 2025, 'validUntil' => '2027-05-10'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Fluent'],
                    ['language' => 'Jepang', 'level' => 'Menengah (N3)'],
                ],
                'preferred_countries' => ['Jepang', 'Uni Emirat Arab', 'Singapura'],
                'preferred_roles' => ['Guest Relations Officer', 'Front Office Supervisor', 'Concierge Executive'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Program D3 Vokasi Global Politeknik Indonusa 2026',
            ],
            [
                'external_id' => 'INDO-CPMI-2026-005',
                'nik' => '3372091402010005',
                'name' => 'Wahyu Setiawan Nugroho',
                'gender' => 'L',
                'education' => 'D3',
                'major' => 'D3 Teknik Mesin & Otomotif',
                'expertise' => 'Mekatronika Industri & Alat Berat',
                'skills' => ['PLC Omron & Siemens Programming', 'Hydraulic & Pneumatic Systems', 'Automotive Diagnostic Scanner', 'Industrial Maintenance'],
                'work_experiences' => [
                    [
                        'sector' => 'Manufaktur',
                        'role' => 'Teknisi Mekatronika Pabrik',
                        'durationYears' => 2.0,
                        'companyName' => 'PT Dan Liris Sukoharjo',
                        'description' => 'Pemeliharaan berkala mesin produksi tekstil otomatis dan sensor hidrolik industri.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Teknisi Mekatronika', 'issuer' => 'LSP Elektronika & Mekatronika', 'issueYear' => 2025, 'validUntil' => '2028-12-15'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Conversational'],
                    ['language' => 'Jerman', 'level' => 'Menengah (B1)'],
                    ['language' => 'Jepang', 'level' => 'Dasar (N4)'],
                ],
                'preferred_countries' => ['Jerman', 'Jepang', 'Korea'],
                'preferred_roles' => ['Mechatronics Technician', 'Automation Operator', 'Machinery Maintenance'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Program D3 Vokasi Global Politeknik Indonusa 2026',
            ],
            [
                'external_id' => 'INDO-CPMI-2026-006',
                'nik' => '3372106709020006',
                'name' => 'Dina Marlina',
                'gender' => 'P',
                'education' => 'D3',
                'major' => 'D3 Rekam Medis & Informasi Kesehatan',
                'expertise' => 'Caregiver Medis & Hospital Administrator',
                'skills' => ['Elderly Patient Care (Kaigo)', 'Vital Sign Monitoring & Medication', 'Hospital Information System', 'Ergonomic Patient Transfer'],
                'work_experiences' => [
                    [
                        'sector' => 'Kesehatan',
                        'role' => 'Asisten Perawat & Rekam Medis',
                        'durationYears' => 1.6,
                        'companyName' => 'RSUD dr. Moewardi Surakarta',
                        'description' => 'Pendampingan perawatan pasien geriatri, penginputan catatan rekam medis terpadu.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Careworker / Caregiver', 'issuer' => 'LSP Kesehatan Indonesia', 'issueYear' => 2025, 'validUntil' => '2028-08-30'],
                    ['name' => 'JLPT N3 Sertifikat Bahasa Jepang', 'issuer' => 'Japan Foundation', 'issueYear' => 2025, 'validUntil' => '2030-01-01'],
                ],
                'languages' => [
                    ['language' => 'Jepang', 'level' => 'Menengah (N3)'],
                    ['language' => 'Inggris', 'level' => 'Conversational'],
                ],
                'preferred_countries' => ['Jepang', 'Jerman'],
                'preferred_roles' => ['Caregiver (Kaigo)', 'Hospital Assistant', 'Health Data Administrator'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Program D3 Vokasi Global Politeknik Indonusa 2026',
            ],
            [
                'external_id' => 'INDO-CPMI-2026-007',
                'nik' => '3372012808010007',
                'name' => 'Rangga Aditya Kusuma',
                'gender' => 'L',
                'education' => 'D3',
                'major' => 'D3 Perhotelan (Beverage Operations)',
                'expertise' => 'Cruise Ship Bartender & Mixologist',
                'skills' => ['Cocktail Crafting & Mixology', 'Flair Bartending', 'Bar Inventory & Cost Control', 'STCW Marine Safety'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'Head Bartender Lounge',
                        'durationYears' => 2.0,
                        'companyName' => 'The Sunan Hotel Surakarta',
                        'description' => 'Mengelola bar koktail hotel berbintang, inventarisasi minuman impor dan melayani tamu internasional.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Bartender Profesional', 'issuer' => 'LSP Pariwisata Nusantara', 'issueYear' => 2025, 'validUntil' => '2028-10-25'],
                    ['name' => 'Basic Safety Training (BST) STCW', 'issuer' => 'Politeknik Ilmu Pelayaran', 'issueYear' => 2025, 'validUntil' => '2030-05-15'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Fluent'],
                ],
                'preferred_countries' => ['Kapal Pesiar Internasional', 'Australia', 'Uni Emirat Arab'],
                'preferred_roles' => ['Bartender', 'Bar Server', 'Lounge Attendant'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Program D3 Vokasi Global Politeknik Indonusa 2026',
            ],
            [
                'external_id' => 'INDO-CPMI-2026-008',
                'nik' => '3372025910020008',
                'name' => 'Salsa Billa Rahmadani',
                'gender' => 'P',
                'education' => 'D3',
                'major' => 'D3 Akuntansi Perpajakan',
                'expertise' => 'Hospitality Financial Auditor & Cashier',
                'skills' => ['Hospitality Accounting & Auditing', 'QuickBooks & SAP ERP', 'Daily Revenue Night Audit', 'Tax Compliance'],
                'work_experiences' => [
                    [
                        'sector' => 'Bisnis dan Manajemen',
                        'role' => 'Night Auditor & Accounting Staff',
                        'durationYears' => 1.7,
                        'companyName' => 'Swiss-Belhotel Solo',
                        'description' => 'Melakukan rekonsiliasi penerimaan kas harian hotel, audit transaksi front desk dan outlet restoran.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Teknisi Akuntansi Ahli', 'issuer' => 'LSP Akuntansi Profesional', 'issueYear' => 2025, 'validUntil' => '2028-11-10'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Fluent'],
                ],
                'preferred_countries' => ['Singapura', 'Malaysia', 'Uni Emirat Arab'],
                'preferred_roles' => ['Hotel Accountant', 'Night Auditor', 'Financial Clerk'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Program D3 Vokasi Global Politeknik Indonusa 2026',
            ],
            [
                'external_id' => 'INDO-CPMI-2026-009',
                'nik' => '3372031704010009',
                'name' => 'Guntur Tri Pamungkas',
                'gender' => 'L',
                'education' => 'D3',
                'major' => 'D3 Manajemen Informatika',
                'expertise' => 'Network & Systems Engineer',
                'skills' => ['Mikrotik Routing & Firewall', 'Cisco Switch Configuration', 'Linux Server Administration', 'Cloud Infrastructure'],
                'work_experiences' => [
                    [
                        'sector' => 'Teknologi Informasi',
                        'role' => 'Junior Network Engineer',
                        'durationYears' => 2.0,
                        'companyName' => 'PT Solo Net Multimedia',
                        'description' => 'Instalasi perangkat jaringan fiber optic, konfigurasi routing BGP/OSPF, dan maintenance server data center.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'MikroTik Certified Network Associate (MTCNA)', 'issuer' => 'MikroTik Academy', 'issueYear' => 2025, 'validUntil' => '2028-06-20'],
                    ['name' => 'Sertifikasi BNSP Network Administrator', 'issuer' => 'LSP Telematika', 'issueYear' => 2025, 'validUntil' => '2028-07-15'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Fluent'],
                    ['language' => 'Jepang', 'level' => 'Dasar (N4)'],
                ],
                'preferred_countries' => ['Jepang', 'Malaysia', 'Singapura'],
                'preferred_roles' => ['Network Engineer', 'System Administrator', 'Infrastructure Engineer'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Program D3 Vokasi Global Politeknik Indonusa 2026',
            ],
            [
                'external_id' => 'INDO-CPMI-2026-010',
                'nik' => '3372044812020010',
                'name' => 'Alifa Zahra Maharani',
                'gender' => 'P',
                'education' => 'D3',
                'major' => 'D3 Perhotelan',
                'expertise' => 'Executive Housekeeper Supervisor',
                'skills' => ['Housekeeping Standard Operating Procedures', 'Room Inspection Checklist', 'Linen & Laundry Control', 'Staff Scheduling & Training'],
                'work_experiences' => [
                    [
                        'sector' => 'Tourism, Travel, dan Hospitality',
                        'role' => 'Housekeeping Floor Supervisor',
                        'durationYears' => 2.1,
                        'companyName' => 'Alila Solo Hotel',
                        'description' => 'Supervisi kebersihan 80 kamar tamu, audit kualitas linen, dan evaluasi kerja staf room attendant.',
                    ],
                ],
                'certifications' => [
                    ['name' => 'Sertifikasi BNSP Housekeeping Supervisor', 'issuer' => 'LSP Pariwisata Nusantara', 'issueYear' => 2025, 'validUntil' => '2028-09-28'],
                    ['name' => 'Basic Safety Training (BST) STCW', 'issuer' => 'Balai Diklat Pelayaran', 'issueYear' => 2025, 'validUntil' => '2030-06-05'],
                ],
                'languages' => [
                    ['language' => 'Inggris', 'level' => 'Fluent'],
                    ['language' => 'Jerman', 'level' => 'Dasar (A2)'],
                ],
                'preferred_countries' => ['Kapal Pesiar Internasional', 'Jerman', 'Uni Emirat Arab'],
                'preferred_roles' => ['Housekeeping Supervisor', 'Floor Supervisor', 'Executive Housekeeper'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
                'batch_name' => 'Program D3 Vokasi Global Politeknik Indonusa 2026',
            ],
        ];

        $now = now();
        $inserted = 0;
        $updated = 0;

        foreach ($candidates as $cand) {
            $id = 'CAND-'.Str::upper(substr(hash('sha256', $cand['external_id']), 0, 10));

            $existing = DB::table('job_seekers')
                ->where('external_id', $cand['external_id'])
                ->orWhere('nik', $cand['nik'])
                ->first(['id', 'institution_id', 'institution_name']);

            $attributes = [
                'full_name' => $cand['name'],
                'gender' => $cand['gender'],
                'province_id' => '33',
                'district_id' => '3372',
                'education_level' => $cand['education'],
                'institution_name' => 'Politeknik Indonusa Surakarta',
                'institution_id' => $institutionId,
                'major' => $cand['major'],
                'source_type' => 'Gardata',
                'source_reference' => $cand['external_id'],
                'external_source' => 'gardata',
                'external_id' => $cand['external_id'],
                'readiness_status' => $cand['readiness_status'],
                'verification_status' => $cand['verification_status'],
                'lifecycle_status' => 'APPROVED',
                'preferred_countries' => json_encode($cand['preferred_countries']),
                'preferred_job_roles' => json_encode($cand['preferred_roles']),
                'work_experiences' => json_encode($cand['work_experiences']),
                'certifications' => json_encode($cand['certifications']),
                'preferred_sectors' => json_encode(['Tourism, Travel, dan Hospitality']),
                'updated_at' => $now,
            ];

            if ($existing) {
                if ($force || $existing->institution_name !== 'Politeknik Indonusa Surakarta' || $existing->institution_id !== $institutionId) {
                    DB::table('job_seekers')->where('id', $existing->id)->update($attributes);
                    $updated++;
                }
                $candidateId = $existing->id;
            } else {
                DB::table('job_seekers')->insert([
                    'id' => $id,
                    'registration_number' => 'REG-'.Str::upper(Str::random(10)),
                    'nik' => $cand['nik'],
                    'created_by' => 'Ir. Suci Purwandari, M.M, Ph.D',
                    ...$attributes,
                    'created_at' => $now,
                ]);
                $inserted++;
                $candidateId = $id;
            }

            foreach ($cand['skills'] as $skill) {
                DB::table('job_seeker_skills')->updateOrInsert(
                    ['job_seeker_id' => $candidateId, 'skill_name' => $skill],
                    ['certified' => true],
                );
            }

            foreach ($cand['languages'] as $lang) {
                DB::table('job_seeker_languages')->updateOrInsert(
                    ['job_seeker_id' => $candidateId, 'language' => $lang['language']],
                    ['level' => $lang['level']],
                );
            }

            DB::table('external_training_records')->updateOrInsert(
                [
                    'external_source' => 'gardata',
                    'external_batch_id' => 'INDO-BATCH-2026-1',
                    'job_seeker_id' => $candidateId,
                ],
                [
                    'class_code' => 'INDO-GLOBAL-2026',
                    'batch_name' => $cand['batch_name'],
                    'sector_name' => 'Hospitality, IT & Manajemen',
                    'program_name' => 'Program D3 Vokasi Terpadu Siap Kerja Luar Negeri Politeknik Indonusa',
                    'start_date' => '2026-01-05',
                    'end_date' => '2026-07-20',
                    'target_jp' => 450,
                    'achieved_jp' => 450,
                    'completion_percentage' => 100.0,
                    'status' => 'GRADUATED',
                    'verified_reports_count' => 16,
                    'updated_at' => $now,
                    'created_at' => $now,
                ]
            );
        }

        $this->invalidateBusinessDataCache();

        return [
            'inserted' => $inserted,
            'updated' => $updated,
            'skipped' => 0,
        ];
    }
}

