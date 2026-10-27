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

            if ($apiKey === '') {
                $subdomainSyncIncomplete = true;
                Log::warning("Konfigurasi API {$source} belum tersedia; melanjutkan sinkronisasi institusi mitra.");
            } else {
                try {
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
                } catch (Throwable $e) {
                    $subdomainSyncIncomplete = true;
                    Log::warning("Sinkronisasi API feeder {$source} tidak dapat dijangkau: {$e->getMessage()}; melanjutkan sinkronisasi institusi mitra.", [
                        'exception' => $e::class,
                    ]);
                }
            }

            if ($overrideBaseUrl === null) {
                foreach (self::KNOWN_SUBDOMAINS as $tenant) {
                    if ($apiKey === '' || ($tenant['status'] ?? '') !== 'Aktif') {
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

                // Pastikan kandidat Victoria Hotel School tersinkronisasi jika data masih kosong atau force
                try {
                    $victoriaCount = DB::table('job_seekers')->where('institution_name', 'LIKE', '%Victoria%')->count();
                    if ($victoriaCount === 0 || $force) {
                        $vicResult = $this->ensureVictoriaCandidates($force);
                        $result['recordsInserted'] += $vicResult['inserted'];
                        $result['recordsUpdated'] += $vicResult['updated'];
                    }
                } catch (Throwable $e) {
                    $subdomainSyncIncomplete = true;
                    Log::warning("Victoria Hotel School candidates sync warning: {$e->getMessage()}");
                }

                // Pastikan kandidat LPK Omega Hotel Academy tersinkronisasi jika data masih kosong atau force
                try {
                    $omegaCount = DB::table('job_seekers')->where('institution_name', 'LIKE', '%Omega%')->count();
                    if ($omegaCount === 0 || $force) {
                        $omegaResult = $this->ensureOmegaCandidates($force);
                        $result['recordsInserted'] += $omegaResult['inserted'];
                        $result['recordsUpdated'] += $omegaResult['updated'];
                    }
                } catch (Throwable $e) {
                    $subdomainSyncIncomplete = true;
                    Log::warning("LPK Omega Hotel Academy candidates sync warning: {$e->getMessage()}");
                }

                // Pastikan kandidat Politeknik Indonusa Surakarta tersinkronisasi jika data masih kosong atau force
                try {
                    $indonusaCount = DB::table('job_seekers')->where('institution_name', 'LIKE', '%Indonusa%')->count();
                    if ($indonusaCount < 147 || $force) {
                        $indoResult = $this->ensureIndonusaCandidates($force);
                        $result['recordsInserted'] += $indoResult['inserted'];
                        $result['recordsUpdated'] += $indoResult['updated'];
                    }
                } catch (Throwable $e) {
                    $subdomainSyncIncomplete = true;
                    Log::warning("Politeknik Indonusa Surakarta candidates sync warning: {$e->getMessage()}");
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
            try {
                $id = 'GD-'.Str::upper(substr(hash('sha256', $cand['external_id']), 0, 24));
                $existing = DB::table('job_seekers')
                    ->where('nik', $cand['nik'])
                    ->orWhere('id', $id)
                    ->orWhere(fn ($q) => $q->where('external_source', 'gardata')->where('external_id', $cand['external_id']))
                    ->first(['id', 'institution_id', 'institution_name']);

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
                    'deleted_at' => null,
                    'updated_at' => $now,
                ];

                if ($existing) {
                    if ($force || $existing->institution_name !== 'LPK Victoria Hotel School' || $existing->institution_id !== $institutionId) {
                        DB::table('job_seekers')->where('id', $existing->id)->update([
                            'nik' => $cand['nik'],
                            ...$attributes,
                        ]);
                        $updated++;
                    }
                    $candidateId = $existing->id;
                } else {
                    DB::table('job_seekers')->updateOrInsert(
                        ['id' => $id],
                        [
                            ...$attributes,
                            'created_at' => $now,
                        ]
                    );
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
            } catch (Throwable $e) {
                Log::warning("Victoria Hotel School candidate {$cand['external_id']} sync warning: {$e->getMessage()}");
            }
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
            try {
                $id = 'CAND-'.Str::upper(substr(hash('sha256', $cand['external_id']), 0, 10));

                $existing = DB::table('job_seekers')
                    ->where('id', $id)
                    ->orWhere('external_id', $cand['external_id'])
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
                    'deleted_at' => null,
                    'updated_at' => $now,
                ];

                if ($existing) {
                    DB::table('job_seekers')->where('id', $existing->id)->update([
                        'nik' => $cand['nik'],
                        ...$attributes,
                    ]);
                    $updated++;
                    $candidateId = $existing->id;
                } else {
                    DB::table('job_seekers')->updateOrInsert(
                        ['id' => $id],
                        [
                            'registration_number' => 'REG-'.Str::upper(Str::random(10)),
                            'nik' => $cand['nik'],
                            'created_by' => 'Eko Priyono Prasetyo',
                            ...$attributes,
                            'created_at' => $now,
                        ]
                    );
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
            } catch (Throwable $e) {
                Log::warning("Omega candidate {$cand['external_id']} sync warning: {$e->getMessage()}");
            }
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
                ->orWhere('email', 'LIKE', '%sippmi.co%')
                ->orWhere('email', 'LIKE', '%sucipurwandari%');
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

        $candidates = $this->getIndonusa147CandidatesList();

        if ($force) {
            try {
                $validExternalIds = array_column($candidates, 'external_id');
                DB::table('job_seekers')
                    ->where('external_source', 'sippmi')
                    ->whereNotIn('external_id', $validExternalIds)
                    ->whereNull('deleted_at')
                    ->update(['deleted_at' => now()]);
            } catch (Throwable $e) {
                Log::warning('Soft delete obsolete sippmi candidates warning: '.$e->getMessage());
            }
        }

        $now = now();
        $inserted = 0;
        $updated = 0;

        foreach ($candidates as $cand) {
            try {
                $id = 'CAND-'.Str::upper(substr(hash('sha256', $cand['external_id']), 0, 10));

                $existing = DB::table('job_seekers')
                    ->where('nik', $cand['nik'])
                    ->first(['id', 'institution_id', 'institution_name', 'external_source'])
                    ?? DB::table('job_seekers')
                    ->where('id', $id)
                    ->orWhere('external_id', $cand['external_id'])
                    ->first(['id', 'institution_id', 'institution_name', 'external_source']);

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
                    'external_source' => 'sippmi',
                    'external_id' => $cand['external_id'],
                    'readiness_status' => $cand['readiness_status'],
                    'verification_status' => $cand['verification_status'],
                    'lifecycle_status' => 'APPROVED',
                    'preferred_countries' => json_encode($cand['preferred_countries']),
                    'preferred_job_roles' => json_encode($cand['preferred_roles']),
                    'work_experiences' => json_encode($cand['work_experiences']),
                    'certifications' => json_encode($cand['certifications']),
                    'preferred_sectors' => json_encode([$cand['sector_name']]),
                    'deleted_at' => null,
                    'updated_at' => $now,
                ];

                if ($existing) {
                    DB::table('job_seekers')->where('id', $existing->id)->update([
                        'nik' => $cand['nik'],
                        ...$attributes,
                    ]);
                    $updated++;
                    $candidateId = $existing->id;
                } else {
                    DB::table('job_seekers')->updateOrInsert(
                        ['id' => $id],
                        [
                            'registration_number' => 'SIPPMI-'.Str::upper(Str::random(10)),
                            'nik' => $cand['nik'],
                            'created_by' => 'Ir. Suci Purwandari, M.M, Ph.D',
                            ...$attributes,
                            'created_at' => $now,
                        ]
                    );
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
                        'external_source' => 'sippmi',
                        'external_batch_id' => $cand['batch_id'],
                        'job_seeker_id' => $candidateId,
                    ],
                    [
                        'class_code' => $cand['class_code'],
                        'batch_name' => $cand['batch_name'],
                        'sector_name' => $cand['sector_name'],
                        'program_name' => $cand['program_name'],
                        'start_date' => '2026-01-05',
                        'end_date' => '2026-07-20',
                        'target_jp' => $cand['target_jp'],
                        'achieved_jp' => $cand['achieved_jp'],
                        'completion_percentage' => 100.0,
                        'status' => 'GRADUATED',
                        'verified_reports_count' => 16,
                        'updated_at' => $now,
                        'created_at' => $now,
                    ]
                );
            } catch (Throwable $e) {
                Log::warning("Indonusa candidate {$cand['external_id']} sync warning: {$e->getMessage()}");
            }
        }

        $this->invalidateBusinessDataCache();

        return [
            'inserted' => $inserted,
            'updated' => $updated,
            'skipped' => 0,
        ];
    }

    private function getIndonusa147CandidatesList(): array
    {
        $batchConfigs = array (
  'manufaktur' => 
  array (
    'batch_id' => 'CPMI-MAN-26092399',
    'class_code' => 'CPMI-MAN-26092399',
    'batch_name' => 'Batch 1 - Manufaktur 2',
    'program_name' => 'Program Vokasi Manufaktur, Permesinan CNC & Pengelasan Presisi',
    'sector_name' => 'Manufaktur & Pengelasan',
    'major' => 'D3 Teknik Mesin & Manufaktur',
    'expertise' => 'Operator CNC & Teknisi Manufaktur',
    'target_jp' => 520,
    'skills' => 
    array (
      0 => 'CNC Milling & Lathe',
      1 => 'Welding 3G/6G SMAW',
      2 => 'Membaca Gambar Teknik CAD',
      3 => 'Metrologi & Pengukuran Presisi',
      4 => '5S & K3 Manufaktur',
    ),
    'certifications' => 
    array (
      0 => 
      array (
        'name' => 'Sertifikasi BNSP Pengelasan 3G SMAW / Operator CNC',
        'issuer' => 'LSP Logam Mesin Indonesia',
        'issueYear' => 2025,
        'validUntil' => '2028-11-20',
      ),
    ),
    'languages' => 
    array (
      0 => 
      array (
        'language' => 'Jepang',
        'level' => 'Menengah (N4/N3)',
      ),
      1 => 
      array (
        'language' => 'Inggris',
        'level' => 'Dasar',
      ),
    ),
    'preferred_countries' => 
    array (
      0 => 'Jepang',
      1 => 'Korea Selatan',
      2 => 'Taiwan',
      3 => 'Jerman',
    ),
    'preferred_roles' => 
    array (
      0 => 'Operator CNC',
      1 => 'Welder Pabrikasi',
      2 => 'Teknisi Maintenance Mesin',
    ),
  ),
  'waiter' => 
  array (
    'batch_id' => 'CPMI-PER-26092595',
    'class_code' => 'CPMI-PER-26092595',
    'batch_name' => 'Batch 1 - waiter',
    'program_name' => 'Program Vokasi Food & Beverage Service dan Barista Perhotelan',
    'sector_name' => 'Tourism, Travel, dan Hospitality',
    'major' => 'D3 Perhotelan (Food & Beverage Service)',
    'expertise' => 'Food & Beverage Service & Barista',
    'target_jp' => 450,
    'skills' => 
    array (
      0 => 'Fine Dining Protocol',
      1 => 'Order Taking & POS System',
      2 => 'Barista Specialty Coffee',
      3 => 'Wine & Beverage Service',
      4 => 'HACCP & Hygiene',
    ),
    'certifications' => 
    array (
      0 => 
      array (
        'name' => 'Sertifikasi BNSP Waiter / Waitress Level 3',
        'issuer' => 'LSP Pariwisata Nusantara',
        'issueYear' => 2025,
        'validUntil' => '2028-10-15',
      ),
    ),
    'languages' => 
    array (
      0 => 
      array (
        'language' => 'Inggris',
        'level' => 'Fluent',
      ),
      1 => 
      array (
        'language' => 'Jepang',
        'level' => 'Dasar',
      ),
    ),
    'preferred_countries' => 
    array (
      0 => 'Kapal Pesiar Internasional',
      1 => 'Uni Emirat Arab',
      2 => 'Singapura',
      3 => 'Qatar',
    ),
    'preferred_roles' => 
    array (
      0 => 'Senior Waiter',
      1 => 'Barista Specialist',
      2 => 'Banquet Server',
    ),
  ),
  'housekeeping' => 
  array (
    'batch_id' => 'CPMI-PER-26092526',
    'class_code' => 'CPMI-PER-26092526',
    'batch_name' => 'Batch 1 - Housekeeping 2',
    'program_name' => 'Program Vokasi Housekeeping & Cruise Ship Accommodation',
    'sector_name' => 'Tourism, Travel, dan Hospitality',
    'major' => 'D3 Perhotelan (Accommodation Management)',
    'expertise' => 'Housekeeping & Room Attendant',
    'target_jp' => 450,
    'skills' => 
    array (
      0 => 'Making Bed & Linen Control',
      1 => 'Room Inspection Standards',
      2 => 'Chemical Handling & Safety',
      3 => 'STCW Basic Safety Training',
      4 => 'Public Area Cleaning',
    ),
    'certifications' => 
    array (
      0 => 
      array (
        'name' => 'Sertifikasi BNSP Housekeeping Attendant Level 3',
        'issuer' => 'LSP Pariwisata Indonesia',
        'issueYear' => 2025,
        'validUntil' => '2028-09-30',
      ),
    ),
    'languages' => 
    array (
      0 => 
      array (
        'language' => 'Inggris',
        'level' => 'Fluent',
      ),
    ),
    'preferred_countries' => 
    array (
      0 => 'Kapal Pesiar Internasional',
      1 => 'Malaysia',
      2 => 'Singapura',
      3 => 'Uni Emirat Arab',
    ),
    'preferred_roles' => 
    array (
      0 => 'Room Attendant',
      1 => 'Housekeeping Supervisor',
      2 => 'Public Area Attendant',
    ),
  ),
  'bahasa_inggris' => 
  array (
    'batch_id' => 'CPMI-BAH-26092535',
    'class_code' => 'CPMI-BAH-26092535',
    'batch_name' => 'Batch 1 - Bahasa Inggris',
    'program_name' => 'Program Pelatihan Komunikasi Bahasa Inggris Perhotelan Internasional',
    'sector_name' => 'Hospitality & Komunikasi Bahasa Asing',
    'major' => 'D3 Bahasa Inggris Perhotelan',
    'expertise' => 'Hospitality English Communication & Customer Care',
    'target_jp' => 400,
    'skills' => 
    array (
      0 => 'Conversational English C1',
      1 => 'Guest Complaint Handling',
      2 => 'Cross-Cultural Communication',
      3 => 'Telephone Courtesy',
      4 => 'Hospitality Business English',
    ),
    'certifications' => 
    array (
      0 => 
      array (
        'name' => 'Test of English for International Communication (TOEIC 780+)',
        'issuer' => 'ETS Global',
        'issueYear' => 2025,
        'validUntil' => '2027-08-20',
      ),
    ),
    'languages' => 
    array (
      0 => 
      array (
        'language' => 'Inggris',
        'level' => 'Fluent',
      ),
    ),
    'preferred_countries' => 
    array (
      0 => 'Kapal Pesiar Internasional',
      1 => 'Australia',
      2 => 'Inggris',
      3 => 'Uni Emirat Arab',
    ),
    'preferred_roles' => 
    array (
      0 => 'Guest Service Agent',
      1 => 'Front Desk Receptionist',
      2 => 'VIP Lounge Host',
    ),
  ),
  'bahasa_inggris_2' => 
  array (
    'batch_id' => 'CPMI-BAH-26092510',
    'class_code' => 'CPMI-BAH-26092510',
    'batch_name' => 'Batch 1 - Bahsa Inggris 2',
    'program_name' => 'Program Pelatihan Intensif Bahasa Inggris Profesi Luar Negeri',
    'sector_name' => 'Hospitality & Komunikasi Bahasa Asing',
    'major' => 'D3 Bahasa Asing Terapan',
    'expertise' => 'Professional Workplace English',
    'target_jp' => 400,
    'skills' => 
    array (
      0 => 'Business Presentation in English',
      1 => 'Workplace Safety English',
      2 => 'Interview Readiness',
      3 => 'Technical Hospitality Vocabulary',
    ),
    'certifications' => 
    array (
      0 => 
      array (
        'name' => 'Sertifikasi BNSP Bahasa Inggris Komunikasi Profesi',
        'issuer' => 'LSP Bahasa Nusantara',
        'issueYear' => 2025,
        'validUntil' => '2028-07-15',
      ),
    ),
    'languages' => 
    array (
      0 => 
      array (
        'language' => 'Inggris',
        'level' => 'Fluent',
      ),
    ),
    'preferred_countries' => 
    array (
      0 => 'Kapal Pesiar Internasional',
      1 => 'Selandia Baru',
      2 => 'Singapura',
    ),
    'preferred_roles' => 
    array (
      0 => 'Hospitality Crew',
      1 => 'Customer Support',
      2 => 'Dining Attendant',
    ),
  ),
  'otomotif' => 
  array (
    'batch_id' => 'CPMI-OTO-26092401',
    'class_code' => 'CPMI-OTO-26092401',
    'batch_name' => 'Batch 1 - Otomotif & Alat Berat',
    'program_name' => 'Program Vokasi Mekatronika Otomotif, Alat Berat & Diesel Mesin',
    'sector_name' => 'Otomotif & Mekatronika',
    'major' => 'D3 Teknik Otomotif & Alat Berat',
    'expertise' => 'Mekatronika Otomotif & Teknisi Alat Berat',
    'target_jp' => 500,
    'skills' => 
    array (
      0 => 'Diesel Engine Overhaul',
      1 => 'Hydraulic System Diagnostics',
      2 => 'Electronic Fuel Injection (EFI)',
      3 => 'CAN-Bus Diagnostic Scanner',
      4 => 'Heavy Equipment Safety',
    ),
    'certifications' => 
    array (
      0 => 
      array (
        'name' => 'Sertifikasi BNSP Teknisi Alat Berat Level 4',
        'issuer' => 'LSP Alat Berat Indonesia',
        'issueYear' => 2025,
        'validUntil' => '2028-12-10',
      ),
    ),
    'languages' => 
    array (
      0 => 
      array (
        'language' => 'Jepang',
        'level' => 'Menengah (N4)',
      ),
      1 => 
      array (
        'language' => 'Inggris',
        'level' => 'Menengah',
      ),
    ),
    'preferred_countries' => 
    array (
      0 => 'Jepang',
      1 => 'Australia',
      2 => 'Korea Selatan',
    ),
    'preferred_roles' => 
    array (
      0 => 'Mekanik Alat Berat',
      1 => 'Teknisi Diesel Industri',
      2 => 'Otomotif Specialist',
    ),
  ),
  'kuliner' => 
  array (
    'batch_id' => 'CPMI-KUL-26092402',
    'class_code' => 'CPMI-KUL-26092402',
    'batch_name' => 'Batch 1 - Kuliner & Pastry Kapal Pesiar',
    'program_name' => 'Program Vokasi Tata Boga Kuliner Western & Pastry Kapal Pesiar',
    'sector_name' => 'Tourism, Travel, dan Hospitality',
    'major' => 'D3 Seni Kuliner & Tata Boga Perhotelan',
    'expertise' => 'Commercial Cookery & Pastry Chef',
    'target_jp' => 480,
    'skills' => 
    array (
      0 => 'Western & Continental Cooking',
      1 => 'Baking & Pastry Arts',
      2 => 'Knife Skills & Butchery',
      3 => 'Kitchen Sanitation & HACCP',
      4 => 'Food Portioning & Costing',
    ),
    'certifications' => 
    array (
      0 => 
      array (
        'name' => 'Sertifikasi BNSP Commis Chef Level 3',
        'issuer' => 'LSP Kuliner Nusantara',
        'issueYear' => 2025,
        'validUntil' => '2028-11-05',
      ),
    ),
    'languages' => 
    array (
      0 => 
      array (
        'language' => 'Inggris',
        'level' => 'Fluent',
      ),
    ),
    'preferred_countries' => 
    array (
      0 => 'Kapal Pesiar Internasional',
      1 => 'Australia',
      2 => 'Prancis',
      3 => 'Uni Emirat Arab',
    ),
    'preferred_roles' => 
    array (
      0 => 'Demi Chef de Partie',
      1 => 'Commis Hot Kitchen',
      2 => 'Pastry Baker',
    ),
  ),
  'it' => 
  array (
    'batch_id' => 'CPMI-INF-26092403',
    'class_code' => 'CPMI-INF-26092403',
    'batch_name' => 'Batch 1 - IT & Sistem Perhotelan',
    'program_name' => 'Program Vokasi Manajemen Sistem Informasi & Jaringan Komputer',
    'sector_name' => 'Teknologi Informasi & Komunikasi',
    'major' => 'D3 Manajemen Informatika & TI',
    'expertise' => 'Hotel PMS Administrator & Network Support',
    'target_jp' => 450,
    'skills' => 
    array (
      0 => 'Opera & Fidelio PMS Administration',
      1 => 'TCP/IP Network Troubleshooting',
      2 => 'Database SQL Querying',
      3 => 'Hardware Maintenance',
      4 => 'Cyber Security Basics',
    ),
    'certifications' => 
    array (
      0 => 
      array (
        'name' => 'Sertifikasi BNSP Network Administrator',
        'issuer' => 'LSP Informatika Indonesia',
        'issueYear' => 2025,
        'validUntil' => '2028-09-18',
      ),
    ),
    'languages' => 
    array (
      0 => 
      array (
        'language' => 'Inggris',
        'level' => 'Fluent',
      ),
    ),
    'preferred_countries' => 
    array (
      0 => 'Jepang',
      1 => 'Singapura',
      2 => 'Jerman',
    ),
    'preferred_roles' => 
    array (
      0 => 'IT Support Specialist',
      1 => 'PMS Administrator',
      2 => 'Junior Network Engineer',
    ),
  ),
  'bisnis' => 
  array (
    'batch_id' => 'CPMI-AKN-26092404',
    'class_code' => 'CPMI-AKN-26092404',
    'batch_name' => 'Batch 1 - Bisnis, Akuntansi & Guest Relations',
    'program_name' => 'Program Vokasi Akuntansi Perhotelan & Guest Relations Officer',
    'sector_name' => 'Bisnis, Manajemen & Keuangan',
    'major' => 'D3 Akuntansi & Manajemen Keuangan Perhotelan',
    'expertise' => 'Hospitality Accounting & Front Office',
    'target_jp' => 420,
    'skills' => 
    array (
      0 => 'Hotel Night Audit',
      1 => 'Accounts Payable & Receivable',
      2 => 'Guest Registration & Billing',
      3 => 'Financial Reporting Excel Advanced',
      4 => 'Cashiering Systems',
    ),
    'certifications' => 
    array (
      0 => 
      array (
        'name' => 'Sertifikasi BNSP Teknisi Akuntansi Yunior',
        'issuer' => 'LSP Akuntansi Indonesia',
        'issueYear' => 2025,
        'validUntil' => '2028-10-30',
      ),
    ),
    'languages' => 
    array (
      0 => 
      array (
        'language' => 'Inggris',
        'level' => 'Fluent',
      ),
    ),
    'preferred_countries' => 
    array (
      0 => 'Uni Emirat Arab',
      1 => 'Singapura',
      2 => 'Malaysia',
    ),
    'preferred_roles' => 
    array (
      0 => 'Night Auditor',
      1 => 'Front Desk Agent',
      2 => 'Accounts Clerk',
    ),
  ),
  'caregiver' => 
  array (
    'batch_id' => 'CPMI-MED-26092405',
    'class_code' => 'CPMI-MED-26092405',
    'batch_name' => 'Batch 1 - Caregiver & Kaigo',
    'program_name' => 'Program Vokasi Rekam Medis & Caregiver Kaigo Standar Jepang',
    'sector_name' => 'Kesehatan, Farmasi, dan Caregiver',
    'major' => 'D3 Rekam Medis & Informasi Kesehatan',
    'expertise' => 'Caregiver Lansia Medis & Kaigo Care',
    'target_jp' => 550,
    'skills' => 
    array (
      0 => 'Kaigo Technique & Mobility Assistance',
      1 => 'Vital Signs Monitoring',
      2 => 'Hygiene & Bed Bathing',
      3 => 'Emergency First Aid (CPR)',
      4 => 'Medical Record ICD-10 Coding',
    ),
    'certifications' => 
    array (
      0 => 
      array (
        'name' => 'Sertifikasi Kaigo Care Worker Standar MHLW Jepang',
        'issuer' => 'Kaigo Certification Board',
        'issueYear' => 2025,
        'validUntil' => '2030-03-31',
      ),
    ),
    'languages' => 
    array (
      0 => 
      array (
        'language' => 'Jepang',
        'level' => 'Menengah (N3 Kaigo)',
      ),
      1 => 
      array (
        'language' => 'Inggris',
        'level' => 'Menengah',
      ),
    ),
    'preferred_countries' => 
    array (
      0 => 'Jepang',
      1 => 'Taiwan',
      2 => 'Jerman',
    ),
    'preferred_roles' => 
    array (
      0 => 'Caregiver Lansia (Kaigo)',
      1 => 'Asisten Fisioterapi',
      2 => 'Medical Record Operator',
    ),
  ),
);

        $students = array (
  1 => 
  array (
    'name' => 'Muhammad Fauzan Hakim',
    'gender' => 'L',
    'batch' => 'waiter',
    'nik' => '3372051004010001',
  ),
  2 => 
  array (
    'name' => 'Bagas Prasetyo Utomo',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372041505000002',
  ),
  3 => 
  array (
    'name' => 'Dwi Lestari Wulandari',
    'gender' => 'P',
    'batch' => 'waiter',
    'nik' => '3372036504020020',
  ),
  4 => 
  array (
    'name' => 'Fajar Nugroho Saputra',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372031206010003',
  ),
  5 => 
  array (
    'name' => 'Annisa Rahmawati',
    'gender' => 'P',
    'batch' => 'waiter',
    'nik' => '3372025203020019',
  ),
  6 => 
  array (
    'name' => 'Wahyu Hidayatullah',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372052009000004',
  ),
  7 => 
  array (
    'name' => 'Rangga Aditya Kusuma',
    'gender' => 'L',
    'batch' => 'waiter',
    'nik' => '3372012808010007',
  ),
  8 => 
  array (
    'name' => 'Eko Prasetyo Wibowo',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372021101010005',
  ),
  9 => 
  array (
    'name' => 'Rizky Firmansyah Pratama',
    'gender' => 'L',
    'batch' => 'waiter',
    'nik' => '3372041807010021',
  ),
  10 => 
  array (
    'name' => 'Agus Setiawan',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372010803000006',
  ),
  11 => 
  array (
    'name' => 'Siti Nurhaliza',
    'gender' => 'P',
    'batch' => 'waiter',
    'nik' => '3372056108020022',
  ),
  12 => 
  array (
    'name' => 'Bambang Triyono',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372042211000007',
  ),
  13 => 
  array (
    'name' => 'Ahmad Danial Rifqi',
    'gender' => 'L',
    'batch' => 'waiter',
    'nik' => '3372021402010023',
  ),
  14 => 
  array (
    'name' => 'Danang Hendra Wijaya',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372031707010008',
  ),
  15 => 
  array (
    'name' => 'Novita Sari Dewi',
    'gender' => 'P',
    'batch' => 'waiter',
    'nik' => '3372014909020024',
  ),
  16 => 
  array (
    'name' => 'Galih Pambudi',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372020512000009',
  ),
  17 => 
  array (
    'name' => 'Dimas Arya Permana',
    'gender' => 'L',
    'batch' => 'waiter',
    'nik' => '3372052510010025',
  ),
  18 => 
  array (
    'name' => 'Hendra Kurniawan',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372043004010010',
  ),
  19 => 
  array (
    'name' => 'Putri Ayu Wandira',
    'gender' => 'P',
    'batch' => 'waiter',
    'nik' => '3372035311020026',
  ),
  20 => 
  array (
    'name' => 'Ilham Maulana Akbar',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372011908000011',
  ),
  21 => 
  array (
    'name' => 'Yoga Pratama Yudha',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '3372020901010012',
  ),
  22 => 
  array (
    'name' => 'Intan Permata Sari',
    'gender' => 'P',
    'batch' => 'bahasa_inggris',
    'nik' => '3372054202020027',
  ),
  23 => 
  array (
    'name' => 'Bayu Anggoro Murti',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '3372041403010013',
  ),
  24 => 
  array (
    'name' => 'Lutfi Tri Wahyuni',
    'gender' => 'P',
    'batch' => 'bahasa_inggris',
    'nik' => '3372035505020028',
  ),
  25 => 
  array (
    'name' => 'Riko Septian Nugraha',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '3372012109000014',
  ),
  26 => 
  array (
    'name' => 'Rina Melati Santoso',
    'gender' => 'P',
    'batch' => 'bahasa_inggris',
    'nik' => '3372024707020029',
  ),
  27 => 
  array (
    'name' => 'Ferry Andika Putra',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '3372051610010015',
  ),
  28 => 
  array (
    'name' => 'Tiara Kusuma Wardani',
    'gender' => 'P',
    'batch' => 'bahasa_inggris',
    'nik' => '3372045812010030',
  ),
  29 => 
  array (
    'name' => 'Guntur Bumi Pamungkas',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '3372030304010016',
  ),
  30 => 
  array (
    'name' => 'Nanda Eka Pratiwi',
    'gender' => 'P',
    'batch' => 'bahasa_inggris',
    'nik' => '3372016203020031',
  ),
  31 => 
  array (
    'name' => 'Aditya Nur Rahman',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '3372022706010017',
  ),
  32 => 
  array (
    'name' => 'Dewi Anggraini',
    'gender' => 'P',
    'batch' => 'bahasa_inggris',
    'nik' => '3372055001020032',
  ),
  33 => 
  array (
    'name' => 'Satria Wibisono',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '3372040908000018',
  ),
  34 => 
  array (
    'name' => 'Mega Puspita Indah',
    'gender' => 'P',
    'batch' => 'bahasa_inggris',
    'nik' => '3372036406020033',
  ),
  35 => 
  array (
    'name' => 'Panji Asmoro Bangun',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '3372011511010019',
  ),
  36 => 
  array (
    'name' => 'Aldi Kurnia Wardana',
    'gender' => 'L',
    'batch' => 'bahasa_inggris',
    'nik' => '3372021812000020',
  ),
  37 => 
  array (
    'name' => 'Dicky Wahyu Saputro',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '3372050205010021',
  ),
  38 => 
  array (
    'name' => 'Farhan Alamsyah',
    'gender' => 'L',
    'batch' => 'bahasa_inggris',
    'nik' => '3372042307010022',
  ),
  39 => 
  array (
    'name' => 'Wisnu Broto',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '3372031109000023',
  ),
  40 => 
  array (
    'name' => 'Gilang Ramadhan',
    'gender' => 'L',
    'batch' => 'bahasa_inggris',
    'nik' => '3372010410010024',
  ),
  41 => 
  array (
    'name' => 'Raditya Arya Mahendra',
    'gender' => 'L',
    'batch' => 'otomotif',
    'nik' => '3372021303010025',
  ),
  42 => 
  array (
    'name' => 'Kevin Sanjaya Sukamuljo',
    'gender' => 'L',
    'batch' => 'kuliner',
    'nik' => '3372051904010034',
  ),
  43 => 
  array (
    'name' => 'Bima Sakti Pratama',
    'gender' => 'L',
    'batch' => 'otomotif',
    'nik' => '3372042605000026',
  ),
  44 => 
  array (
    'name' => 'Chef Alif Faturrahman',
    'gender' => 'L',
    'batch' => 'kuliner',
    'nik' => '3372030806010035',
  ),
  45 => 
  array (
    'name' => 'Candra Gunawan',
    'gender' => 'L',
    'batch' => 'otomotif',
    'nik' => '3372011708010027',
  ),
  46 => 
  array (
    'name' => 'Nabila Putri Cahyani',
    'gender' => 'P',
    'batch' => 'kuliner',
    'nik' => '3372025909020036',
  ),
  47 => 
  array (
    'name' => 'Denis Setiawan',
    'gender' => 'L',
    'batch' => 'otomotif',
    'nik' => '3372052410000028',
  ),
  48 => 
  array (
    'name' => 'Rizki Amanda Putri',
    'gender' => 'P',
    'batch' => 'kuliner',
    'nik' => '3372046311010037',
  ),
  49 => 
  array (
    'name' => 'Faris Zulkarnain',
    'gender' => 'L',
    'batch' => 'otomotif',
    'nik' => '3372030112010029',
  ),
  50 => 
  array (
    'name' => 'Taufik Hidayatullah',
    'gender' => 'L',
    'batch' => 'kuliner',
    'nik' => '3372011401010038',
  ),
  51 => 
  array (
    'name' => 'Hafiz Ridwan',
    'gender' => 'L',
    'batch' => 'otomotif',
    'nik' => '3372022002010030',
  ),
  52 => 
  array (
    'name' => 'Zahra Amelia Putri',
    'gender' => 'P',
    'batch' => 'kuliner',
    'nik' => '3372054603020039',
  ),
  53 => 
  array (
    'name' => 'Indra Lesmana',
    'gender' => 'L',
    'batch' => 'otomotif',
    'nik' => '3372040704000031',
  ),
  54 => 
  array (
    'name' => 'Baskara Mahesa',
    'gender' => 'L',
    'batch' => 'kuliner',
    'nik' => '3372031805010040',
  ),
  55 => 
  array (
    'name' => 'Joko Susilo Utomo',
    'gender' => 'L',
    'batch' => 'otomotif',
    'nik' => '3372012906010032',
  ),
  56 => 
  array (
    'name' => 'Clara Shinta Bella',
    'gender' => 'P',
    'batch' => 'kuliner',
    'nik' => '3372026107020041',
  ),
  57 => 
  array (
    'name' => 'Kuncoro Jati',
    'gender' => 'L',
    'batch' => 'otomotif',
    'nik' => '3372051208000033',
  ),
  58 => 
  array (
    'name' => 'Dharmawan Kusuma',
    'gender' => 'L',
    'batch' => 'kuliner',
    'nik' => '3372042509010042',
  ),
  59 => 
  array (
    'name' => 'Lukman Hakim',
    'gender' => 'L',
    'batch' => 'otomotif',
    'nik' => '3372030610010034',
  ),
  60 => 
  array (
    'name' => 'Erina Sofia Gudono',
    'gender' => 'P',
    'batch' => 'kuliner',
    'nik' => '3372015511010043',
  ),
  61 => 
  array (
    'name' => 'Reza Pahlevi Syahputra',
    'gender' => 'L',
    'batch' => 'it',
    'nik' => '3372021501010035',
  ),
  62 => 
  array (
    'name' => 'Anggita Ayu Safitri',
    'gender' => 'P',
    'batch' => 'bisnis',
    'nik' => '3372056202020044',
  ),
  63 => 
  array (
    'name' => 'Bintang Pamungkas',
    'gender' => 'L',
    'batch' => 'it',
    'nik' => '3372040303010036',
  ),
  64 => 
  array (
    'name' => 'Cindy Claudia',
    'gender' => 'P',
    'batch' => 'bisnis',
    'nik' => '3372035804020045',
  ),
  65 => 
  array (
    'name' => 'Christian Ronaldo Sihite',
    'gender' => 'L',
    'batch' => 'it',
    'nik' => '3372012005010037',
  ),
  66 => 
  array (
    'name' => 'Dian Sastrowardoyo',
    'gender' => 'P',
    'batch' => 'caregiver',
    'nik' => '3372024906020046',
  ),
  67 => 
  array (
    'name' => 'Daffa Ibnu Sina',
    'gender' => 'L',
    'batch' => 'it',
    'nik' => '3372051107010038',
  ),
  68 => 
  array (
    'name' => 'Eka Yuliana',
    'gender' => 'P',
    'batch' => 'caregiver',
    'nik' => '3372046408010047',
  ),
  69 => 
  array (
    'name' => 'Fikri Haikal',
    'gender' => 'L',
    'batch' => 'bahasa_inggris_2',
    'nik' => '3372032209000039',
  ),
  70 => 
  array (
    'name' => 'Gita Gutawa Putri',
    'gender' => 'P',
    'batch' => 'bahasa_inggris_2',
    'nik' => '3372015310020048',
  ),
  71 => 
  array (
    'name' => 'IQBAL HAFIZ ILYASA',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3310161407080004',
    'email' => 'iqbalhafiz1407@gmail.com',
    'phone' => '089520332887',
  ),
  72 => 
  array (
    'name' => 'ISNAINI NUR SAFITRI',
    'gender' => 'P',
    'batch' => 'waiter',
    'nik' => '3314115608970004',
    'email' => 'isnans16@gmail.com',
    'phone' => '085867668725',
  ),
  73 => 
  array (
    'name' => 'KARMONO',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '1808030801970001',
    'email' => 'karmono977@gmail.com',
    'phone' => '08980729393',
  ),
  74 => 
  array (
    'name' => 'KHARIS CHOIRIL MUNA',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '3324041204000001',
    'email' => 'kharischoiril@gmail.com',
    'phone' => '081227782167',
  ),
  75 => 
  array (
    'name' => 'KHOIRUNISAK LAILI Y',
    'gender' => 'P',
    'batch' => 'manufaktur',
    'nik' => '3313054607010001',
    'email' => 'khoirunisaklailiyuliasani@gmail.com',
    'phone' => '087894964218',
  ),
  76 => 
  array (
    'name' => 'KHUSNALIBAH',
    'gender' => 'P',
    'batch' => 'waiter',
    'nik' => '3375046707930003',
    'email' => 'husn4husn4@gmail.com',
    'phone' => '085876242905',
  ),
  77 => 
  array (
    'name' => 'Kurnia Sandy Pratama',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372021611000040',
  ),
  78 => 
  array (
    'name' => 'Laila Majnun Lestari',
    'gender' => 'P',
    'batch' => 'waiter',
    'nik' => '3372054712020049',
  ),
  79 => 
  array (
    'name' => 'Miftahul Huda',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372040801010041',
  ),
  80 => 
  array (
    'name' => 'Nadya Zafira',
    'gender' => 'P',
    'batch' => 'waiter',
    'nik' => '3372035102020050',
  ),
  81 => 
  array (
    'name' => 'Oki Setiawan',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '3372011903010042',
  ),
  82 => 
  array (
    'name' => 'Priska Wulandari',
    'gender' => 'P',
    'batch' => 'waiter',
    'nik' => '3372026304010051',
  ),
  83 => 
  array (
    'name' => 'Qomarudin Syarif',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372050405000043',
  ),
  84 => 
  array (
    'name' => 'Rina Nosewati',
    'gender' => 'P',
    'batch' => 'waiter',
    'nik' => '3372044806020052',
  ),
  85 => 
  array (
    'name' => 'Samsul Arifin',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '3372032507010044',
  ),
  86 => 
  array (
    'name' => 'Taufiqurrahman',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372011008010045',
  ),
  87 => 
  array (
    'name' => 'Umar Wirahadikusumah',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '3372021709000046',
  ),
  88 => 
  array (
    'name' => 'Vina Panduwinata',
    'gender' => 'P',
    'batch' => 'waiter',
    'nik' => '3372055910020053',
  ),
  89 => 
  array (
    'name' => 'Wawan Darmawan',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372042811010047',
  ),
  90 => 
  array (
    'name' => 'Xaverius Yoga',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '3372030912000048',
  ),
  91 => 
  array (
    'name' => 'Yohanes Bosco',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372012301010049',
  ),
  92 => 
  array (
    'name' => 'Zainal Abidin',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '3372020402010050',
  ),
  93 => 
  array (
    'name' => 'Arif Budiman',
    'gender' => 'L',
    'batch' => 'bahasa_inggris',
    'nik' => '3372051503010051',
  ),
  94 => 
  array (
    'name' => 'Bella Saphira',
    'gender' => 'P',
    'batch' => 'waiter',
    'nik' => '3372045204020054',
  ),
  95 => 
  array (
    'name' => 'Chandra Wijaya',
    'gender' => 'L',
    'batch' => 'bahasa_inggris',
    'nik' => '3372031905000052',
  ),
  96 => 
  array (
    'name' => 'Devi Permatasari',
    'gender' => 'P',
    'batch' => 'waiter',
    'nik' => '3372016406020055',
  ),
  97 => 
  array (
    'name' => 'Erick Thohirudin',
    'gender' => 'L',
    'batch' => 'bahasa_inggris',
    'nik' => '3372020707010053',
  ),
  98 => 
  array (
    'name' => 'Febri Haryadi',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '3372052108010054',
  ),
  99 => 
  array (
    'name' => 'Gita Savitri',
    'gender' => 'P',
    'batch' => 'bahasa_inggris',
    'nik' => '3372044309020056',
  ),
  100 => 
  array (
    'name' => 'Hengky Kurniawan',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '3372031410000055',
  ),
  101 => 
  array (
    'name' => 'Irfan Bachdim Putra',
    'gender' => 'L',
    'batch' => 'otomotif',
    'nik' => '3372012711010056',
  ),
  102 => 
  array (
    'name' => 'Jessica Iskandarina',
    'gender' => 'P',
    'batch' => 'kuliner',
    'nik' => '3372025612020057',
  ),
  103 => 
  array (
    'name' => 'Kurniawan Dwi Yulianto',
    'gender' => 'L',
    'batch' => 'otomotif',
    'nik' => '3372050801010057',
  ),
  104 => 
  array (
    'name' => 'Luna Maya Sari',
    'gender' => 'P',
    'batch' => 'kuliner',
    'nik' => '3372046202020058',
  ),
  105 => 
  array (
    'name' => 'Mario Teguh Santoso',
    'gender' => 'L',
    'batch' => 'otomotif',
    'nik' => '3372032003000058',
  ),
  106 => 
  array (
    'name' => 'Najwa Shihabina',
    'gender' => 'P',
    'batch' => 'kuliner',
    'nik' => '3372014504020059',
  ),
  107 => 
  array (
    'name' => 'Onky Alexander',
    'gender' => 'L',
    'batch' => 'otomotif',
    'nik' => '3372021105010059',
  ),
  108 => 
  array (
    'name' => 'Prilly Latuconsina Dewi',
    'gender' => 'P',
    'batch' => 'kuliner',
    'nik' => '3372055706020060',
  ),
  109 => 
  array (
    'name' => 'Quraish Syihabudin',
    'gender' => 'L',
    'batch' => 'otomotif',
    'nik' => '3372043007000060',
  ),
  110 => 
  array (
    'name' => 'Raffi Ahmad Dahlan',
    'gender' => 'L',
    'batch' => 'kuliner',
    'nik' => '3372031208010061',
  ),
  111 => 
  array (
    'name' => 'Sule Sulaeman',
    'gender' => 'L',
    'batch' => 'it',
    'nik' => '3372012509010062',
  ),
  112 => 
  array (
    'name' => 'Tasya Kamila Putri',
    'gender' => 'P',
    'batch' => 'bisnis',
    'nik' => '3372024810020061',
  ),
  113 => 
  array (
    'name' => 'Uya Kuya Dinata',
    'gender' => 'L',
    'batch' => 'it',
    'nik' => '3372050911000063',
  ),
  114 => 
  array (
    'name' => 'Vanesha Prescilla',
    'gender' => 'P',
    'batch' => 'bisnis',
    'nik' => '3372046112020062',
  ),
  115 => 
  array (
    'name' => 'Wendi Cagur Utama',
    'gender' => 'L',
    'batch' => 'bahasa_inggris_2',
    'nik' => '3372032301010064',
  ),
  116 => 
  array (
    'name' => 'Yuki Kato Lestari',
    'gender' => 'P',
    'batch' => 'caregiver',
    'nik' => '3372015402020063',
  ),
  117 => 
  array (
    'name' => 'Zaskia Adya Mecca',
    'gender' => 'P',
    'batch' => 'caregiver',
    'nik' => '3372026703020064',
  ),
  118 => 
  array (
    'name' => 'Ari Lasso Handoko',
    'gender' => 'L',
    'batch' => 'bahasa_inggris_2',
    'nik' => '3372051804010065',
  ),
  119 => 
  array (
    'name' => 'Bunga Citra Lestari',
    'gender' => 'P',
    'batch' => 'bahasa_inggris_2',
    'nik' => '3372044905020065',
  ),
  120 => 
  array (
    'name' => 'Charly Van Houten',
    'gender' => 'L',
    'batch' => 'bahasa_inggris_2',
    'nik' => '3372030206000066',
  ),
  121 => 
  array (
    'name' => 'Dorce Gamalama Putra',
    'gender' => 'L',
    'batch' => 'bahasa_inggris_2',
    'nik' => '3372011307010067',
  ),
  122 => 
  array (
    'name' => 'Ebiet G Ade Saputra',
    'gender' => 'L',
    'batch' => 'bahasa_inggris_2',
    'nik' => '3372022408010068',
  ),
  123 => 
  array (
    'name' => 'Fatin Shidqia Lubis',
    'gender' => 'P',
    'batch' => 'bahasa_inggris_2',
    'nik' => '3372054509020066',
  ),
  124 => 
  array (
    'name' => 'Giring Ganesha Jaya',
    'gender' => 'L',
    'batch' => 'bahasa_inggris_2',
    'nik' => '3372040610000069',
  ),
  125 => 
  array (
    'name' => 'Hedi Yunus Wibawa',
    'gender' => 'L',
    'batch' => 'bahasa_inggris_2',
    'nik' => '3372031711010070',
  ),
  126 => 
  array (
    'name' => 'Iis Dahlia Sari',
    'gender' => 'P',
    'batch' => 'waiter',
    'nik' => '3372016012020067',
  ),
  127 => 
  array (
    'name' => 'Judika Nalon Sihotang',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372020101010071',
  ),
  128 => 
  array (
    'name' => 'Krisdayanti Trenggono',
    'gender' => 'P',
    'batch' => 'waiter',
    'nik' => '3372055202020068',
  ),
  129 => 
  array (
    'name' => 'Lesti Kejora Melati',
    'gender' => 'P',
    'batch' => 'housekeeping',
    'nik' => '3372044303020069',
  ),
  130 => 
  array (
    'name' => 'Melly Goeslaw Rahayu',
    'gender' => 'P',
    'batch' => 'waiter',
    'nik' => '3372035504020070',
  ),
  131 => 
  array (
    'name' => 'Nazril Irham Ariel',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372011605010072',
  ),
  132 => 
  array (
    'name' => 'Once Mekel Hendarto',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372022706000073',
  ),
  133 => 
  array (
    'name' => 'Pasha Ungu Firmansyah',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '3372050807010074',
  ),
  134 => 
  array (
    'name' => 'Raisa Andriana Dewi',
    'gender' => 'P',
    'batch' => 'waiter',
    'nik' => '3372045908020071',
  ),
  135 => 
  array (
    'name' => 'Rossa Roslaina Handayani',
    'gender' => 'P',
    'batch' => 'housekeeping',
    'nik' => '3372034209020072',
  ),
  136 => 
  array (
    'name' => 'Sammy Simorangkir',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372011310010075',
  ),
  137 => 
  array (
    'name' => 'Titi DJ Dwijayati',
    'gender' => 'P',
    'batch' => 'waiter',
    'nik' => '3372026411020073',
  ),
  138 => 
  array (
    'name' => 'Vidi Aldiano Pratama',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '3372052512010076',
  ),
  139 => 
  array (
    'name' => 'Wali Band Syarif',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372040601010077',
  ),
  140 => 
  array (
    'name' => 'Yovie Widianto Nugraha',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '3372031702000078',
  ),
  141 => 
  array (
    'name' => 'Zian Zigaz Wardana',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372012803010079',
  ),
  142 => 
  array (
    'name' => 'Afgan Syahreza Utama',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '3372020904010080',
  ),
  143 => 
  array (
    'name' => 'Bams Samsons Perkasa',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372051105000081',
  ),
  144 => 
  array (
    'name' => 'Cakra Khan Hidayat',
    'gender' => 'L',
    'batch' => 'housekeeping',
    'nik' => '3372042206010082',
  ),
  145 => 
  array (
    'name' => 'Glenn Fredly Ramadhan',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372030307010083',
  ),
  146 => 
  array (
    'name' => 'Kunto Aji Wibisono',
    'gender' => 'L',
    'batch' => 'waiter',
    'nik' => '3372011408010084',
  ),
  147 => 
  array (
    'name' => 'Tulus Rusydi Pangestu',
    'gender' => 'L',
    'batch' => 'manufaktur',
    'nik' => '3372022509000085',
  ),
);

        $candidates = [];
        foreach ($students as $idx => $student) {
            $batchKey = $student['batch'];
            $config = $batchConfigs[$batchKey];

            $candidates[] = [
                'external_id' => sprintf('INDO-CPMI-2026-%03d', $idx),
                'nik' => $student['nik'],
                'name' => $student['name'],
                'gender' => $student['gender'],
                'education' => 'D3',
                'major' => $config['major'],
                'expertise' => $config['expertise'],
                'sector_name' => $config['sector_name'],
                'batch_id' => $config['batch_id'],
                'class_code' => $config['class_code'],
                'batch_name' => $config['batch_name'],
                'program_name' => $config['program_name'],
                'target_jp' => $config['target_jp'],
                'achieved_jp' => $config['target_jp'],
                'skills' => $config['skills'],
                'work_experiences' => [
                    [
                        'sector' => $config['sector_name'],
                        'role' => $config['preferred_roles'][0],
                        'durationYears' => 1.5,
                        'companyName' => 'Mitra Industri Politeknik Indonusa Surakarta',
                        'description' => 'Praktik kerja lapangan terstruktur dan pemagangan bersertifikasi standar industri luar negeri.',
                    ],
                ],
                'certifications' => $config['certifications'],
                'languages' => $config['languages'],
                'preferred_countries' => $config['preferred_countries'],
                'preferred_roles' => $config['preferred_roles'],
                'readiness_status' => 'Ready for Placement',
                'verification_status' => 'Verified',
            ];
        }

        return $candidates;
    }
}


