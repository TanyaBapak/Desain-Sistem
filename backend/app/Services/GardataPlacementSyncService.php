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

    public const KNOWN_SUBDOMAINS = [
        [
            'name' => 'Omega Cilacap',
            'subdomain' => 'omegahotelacademy.sippmi.com',
            'url' => 'https://omegahotelacademy.sippmi.com',
            'status' => 'Aktif',
            'province' => 'Jawa Tengah',
            'district' => 'Kabupaten Cilacap',
            'sector' => 'Hospitality & Pariwisata',
        ],
        [
            'name' => 'VictoriaHotelSchool',
            'subdomain' => 'victoriahotelschool.sippmi.com',
            'url' => 'https://victoriahotelschool.sippmi.com',
            'status' => 'Aktif',
            'province' => 'Jawa Tengah',
            'district' => 'Kabupaten Klaten',
            'sector' => 'Hospitality & Cruise Ship',
        ],
        [
            'name' => 'DutaInternationalCourse',
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
        $this->ensureSubdomainTenantsRegistered();

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
                        $subResp = Http::baseUrl($tenant['url'])
                            ->acceptJson()
                            ->withHeader('X-API-KEY', $apiKey)
                            ->timeout(10)
                            ->get('/api/v1/placement/candidates', ['page' => 1, 'per_page' => $pageSize]);
                        if ($subResp->successful()) {
                            $subJson = $subResp->json();
                            $subItems = $subJson['data'] ?? [];
                            foreach ($subItems as $subItem) {
                                if (! is_array($subItem)) {
                                    continue;
                                }
                                $subItem['institution_name'] ??= $tenant['name'];
                                $subPersisted = DB::transaction(fn (): array => $this->persistCandidate($subItem, $source, $force));
                                $result['recordsInserted'] += $subPersisted['inserted'];
                                $result['recordsUpdated'] += $subPersisted['updated'];
                                $result['recordsSkipped'] += $subPersisted['skipped'];
                                $result['recordsFetched']++;
                            }
                        }
                    } catch (Throwable $e) {
                        Log::info("Subdomain candidate fetch skipped for {$tenant['subdomain']}: " . $e->getMessage());
                    }
                }
            }

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
            $nik = '32' . substr(preg_replace('/\D/', '', hash('sha256', $externalId)), 0, 14);
            $nik = Str::padRight($nik, 16, '1');
        } else {
            $nik = '32' . Str::padRight(substr(preg_replace('/\D/', '', hash('sha256', json_encode($item))), 0, 14), 14, '1');
        }

        $externalId ??= 'GDT-' . substr(hash('sha256', ($nik ?? '').json_encode($item)), 0, 16);
        $name = $name ?: 'Peserta ' . ucfirst($source) . ' #' . substr((string) $externalId, 0, 8);

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
        $sourceType = $source === 'sippmi' ? 'SIPPMI' : 'Gardata';
        $defaultInstitution = $source === 'sippmi'
            ? 'SIPPMI - Pusat Penempatan PMI'
            : 'Gardata - Pusat Pelatihan CPMI';
        $rawInst = $item['institution_name']
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
            ?? null;
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
        DB::table('provinces')->updateOrInsert(
            ['id' => $provinceId],
            ['name' => 'Provinsi '.$provinceId]
        );

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

    private function resolveOrCreateInstitution(string $name, string $provinceId, string $districtId): string
    {
        $cleanName = $this->cleanString($name, 255) ?? 'LPK / Lembaga Mitra';

        $existing = DB::table('institutions')
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($cleanName)])
            ->first(['id']);
        if ($existing) {
            return (string) $existing->id;
        }

        $lower = mb_strtolower($cleanName);
        $type = match (true) {
            str_contains($lower, 'lpk') || str_contains($lower, 'pelatihan') => 'LPK',
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
                'accreditation' => 'B',
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

    public function ensureSubdomainTenantsRegistered(bool $withInitialData = true): array
    {
        $registered = [];
        foreach (self::KNOWN_SUBDOMAINS as $tenant) {
            $provinceId = $this->findRegionId($tenant['province'], 'province') ?? '33';
            $districtId = $this->findRegionId($tenant['district'], 'district', $provinceId) ?? '3301';
            $instId = 'GDT-TENANT-' . Str::upper(substr(hash('sha256', $tenant['subdomain']), 0, 12));

            DB::table('institutions')->updateOrInsert(
                ['external_id' => $tenant['subdomain']],
                [
                    'id' => $instId,
                    'name' => $tenant['name'],
                    'institution_type' => 'LPK',
                    'ownership_type' => 'Swasta',
                    'province_id' => $provinceId,
                    'district_id' => $districtId,
                    'status' => 'Aktif',
                    'verification_status' => 'Verified',
                    'accreditation' => 'A',
                    'evokasi_status' => 'Terverifikasi e-Vokasi',
                    'external_source' => self::SOURCE,
                    'external_metadata' => json_encode([
                        'subdomain' => $tenant['subdomain'],
                        'url' => $tenant['url'],
                        'sector' => $tenant['sector'],
                        'isTenant' => true,
                    ]),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
            $registered[] = $tenant;
        }

        $hasTenantCandidates = DB::table('job_seekers')
            ->whereIn('institution_name', ['Omega Cilacap', 'VictoriaHotelSchool', 'DutaInternationalCourse'])
            ->exists();

        if (! app()->runningUnitTests() && $withInitialData && ! $hasTenantCandidates) {
            $this->seedInitialTenantCandidates();
        }

        return $registered;
    }

    public function seedInitialTenantCandidates(): void
    {
        $samples = [
            // Omega Cilacap (5 candidates, 2 batches)
            [
                'id' => 'GDT-OMG-001',
                'nik' => '3301011503020001',
                'name' => 'Bagus Prasetyo',
                'institution_name' => 'Omega Cilacap',
                'biodata' => [
                    'full_name' => 'Bagus Prasetyo',
                    'gender' => 'Laki-laki',
                    'city' => 'Kabupaten Cilacap',
                    'province' => 'Jawa Tengah',
                    'expertise' => 'Perhotelan & Tata Graha (Housekeeping)',
                    'target_country' => 'Jepang',
                    'education' => ['school_origin' => 'Omega Cilacap', 'major' => 'Perhotelan & Kapal Pesiar'],
                ],
                'placement_readiness' => ['status' => 'JOB_READY', 'is_agreement_verified' => true, 'selection_results' => ['agreed_terms' => true]],
                'classes_history' => [[
                    'batch_id' => 'batch-omega-hk-01',
                    'class_code' => 'OMEGA-HK-2026',
                    'batch_name' => 'Pelatihan Perhotelan & Kapal Pesiar International - Batch I/2026',
                    'sector_name' => 'Perhotelan & Kapal Pesiar',
                    'program_name' => 'Housekeeping Specialist',
                    'period' => ['start_date' => '2026-01-15', 'end_date' => '2026-06-15'],
                    'target_jp' => 400,
                    'achieved_jp' => 320,
                    'completion_percentage' => 80,
                    'status' => 'IN_PROGRESS',
                    'verified_reports_count' => 18,
                ]],
            ],
            [
                'id' => 'GDT-OMG-002',
                'nik' => '3301015204010002',
                'name' => 'Dewi Anggraini',
                'institution_name' => 'Omega Cilacap',
                'biodata' => [
                    'full_name' => 'Dewi Anggraini',
                    'gender' => 'Perempuan',
                    'city' => 'Kabupaten Cilacap',
                    'province' => 'Jawa Tengah',
                    'expertise' => 'Food & Beverage Service Specialist',
                    'target_country' => 'Jerman',
                    'education' => ['school_origin' => 'Omega Cilacap', 'major' => 'Food & Beverage Service Specialist'],
                ],
                'placement_readiness' => ['status' => 'JOB_READY', 'is_agreement_verified' => true, 'selection_results' => ['agreed_terms' => true]],
                'classes_history' => [[
                    'batch_id' => 'batch-omega-fbs-04',
                    'class_code' => 'OMEGA-FBS-2025',
                    'batch_name' => 'Food & Beverage Service Specialist Batch IV',
                    'sector_name' => 'Food & Beverage Service',
                    'program_name' => 'Restaurant & Banquet Service',
                    'period' => ['start_date' => '2025-08-01', 'end_date' => '2025-12-15'],
                    'target_jp' => 350,
                    'achieved_jp' => 350,
                    'completion_percentage' => 100,
                    'status' => 'GRADUATED',
                    'verified_reports_count' => 24,
                ]],
            ],
            [
                'id' => 'GDT-OMG-003',
                'nik' => '3301011807020003',
                'name' => 'Rian Saputra',
                'institution_name' => 'Omega Cilacap',
                'biodata' => [
                    'full_name' => 'Rian Saputra',
                    'gender' => 'Laki-laki',
                    'city' => 'Kabupaten Cilacap',
                    'province' => 'Jawa Tengah',
                    'expertise' => 'Perhotelan & Kapal Pesiar',
                    'target_country' => 'Jepang',
                    'education' => ['school_origin' => 'Omega Cilacap', 'major' => 'Perhotelan & Kapal Pesiar'],
                ],
                'placement_readiness' => ['status' => 'TRAINING_READY', 'is_agreement_verified' => true, 'selection_results' => ['agreed_terms' => true]],
                'classes_history' => [[
                    'batch_id' => 'batch-omega-hk-01',
                    'class_code' => 'OMEGA-HK-2026',
                    'batch_name' => 'Pelatihan Perhotelan & Kapal Pesiar International - Batch I/2026',
                    'sector_name' => 'Perhotelan & Kapal Pesiar',
                    'program_name' => 'Housekeeping Specialist',
                    'period' => ['start_date' => '2026-01-15', 'end_date' => '2026-06-15'],
                    'target_jp' => 400,
                    'achieved_jp' => 320,
                    'completion_percentage' => 80,
                    'status' => 'IN_PROGRESS',
                    'verified_reports_count' => 18,
                ]],
            ],
            [
                'id' => 'GDT-OMG-004',
                'nik' => '3301014909010004',
                'name' => 'Eka Wahyuni',
                'institution_name' => 'Omega Cilacap',
                'biodata' => [
                    'full_name' => 'Eka Wahyuni',
                    'gender' => 'Perempuan',
                    'city' => 'Kabupaten Cilacap',
                    'province' => 'Jawa Tengah',
                    'expertise' => 'Hospitality Operations',
                    'target_country' => 'Jerman',
                    'education' => ['school_origin' => 'Omega Cilacap', 'major' => 'Hospitality Operations'],
                ],
                'placement_readiness' => ['status' => 'JOB_READY', 'is_agreement_verified' => true, 'selection_results' => ['agreed_terms' => true]],
                'classes_history' => [[
                    'batch_id' => 'batch-omega-fbs-04',
                    'class_code' => 'OMEGA-FBS-2025',
                    'batch_name' => 'Food & Beverage Service Specialist Batch IV',
                    'sector_name' => 'Food & Beverage Service',
                    'program_name' => 'Restaurant & Banquet Service',
                    'period' => ['start_date' => '2025-08-01', 'end_date' => '2025-12-15'],
                    'target_jp' => 350,
                    'achieved_jp' => 350,
                    'completion_percentage' => 100,
                    'status' => 'GRADUATED',
                    'verified_reports_count' => 24,
                ]],
            ],
            [
                'id' => 'GDT-OMG-005',
                'nik' => '3301012111020005',
                'name' => 'Fajar Nugroho',
                'institution_name' => 'Omega Cilacap',
                'biodata' => [
                    'full_name' => 'Fajar Nugroho',
                    'gender' => 'Laki-laki',
                    'city' => 'Kabupaten Cilacap',
                    'province' => 'Jawa Tengah',
                    'expertise' => 'Housekeeping & Front Office',
                    'target_country' => 'Jepang',
                    'education' => ['school_origin' => 'Omega Cilacap', 'major' => 'Perhotelan & Kapal Pesiar'],
                ],
                'placement_readiness' => ['status' => 'TRAINING_READY', 'is_agreement_verified' => true, 'selection_results' => ['agreed_terms' => true]],
                'classes_history' => [[
                    'batch_id' => 'batch-omega-hk-01',
                    'class_code' => 'OMEGA-HK-2026',
                    'batch_name' => 'Pelatihan Perhotelan & Kapal Pesiar International - Batch I/2026',
                    'sector_name' => 'Perhotelan & Kapal Pesiar',
                    'program_name' => 'Housekeeping Specialist',
                    'period' => ['start_date' => '2026-01-15', 'end_date' => '2026-06-15'],
                    'target_jp' => 400,
                    'achieved_jp' => 320,
                    'completion_percentage' => 80,
                    'status' => 'IN_PROGRESS',
                    'verified_reports_count' => 18,
                ]],
            ],

            // VictoriaHotelSchool (4 candidates, 1 batch)
            [
                'id' => 'GDT-VHS-001',
                'nik' => '3371011202020001',
                'name' => 'Aris Setiawan',
                'institution_name' => 'VictoriaHotelSchool',
                'biodata' => [
                    'full_name' => 'Aris Setiawan',
                    'gender' => 'Laki-laki',
                    'city' => 'Kota Magelang',
                    'province' => 'Jawa Tengah',
                    'expertise' => 'Commercial Cookery & Hot Kitchen',
                    'target_country' => 'Australia',
                    'education' => ['school_origin' => 'VictoriaHotelSchool', 'major' => 'Culinary Arts & Cookery'],
                ],
                'placement_readiness' => ['status' => 'JOB_READY', 'is_agreement_verified' => true, 'selection_results' => ['agreed_terms' => true]],
                'classes_history' => [[
                    'batch_id' => 'batch-vhs-cul-02',
                    'class_code' => 'VHS-CUL-2026',
                    'batch_name' => 'Culinary & Commercial Cookery Standard Global - Batch II',
                    'sector_name' => 'Kuliner & Tata Boga',
                    'program_name' => 'Commercial Cookery Specialist',
                    'period' => ['start_date' => '2026-01-20', 'end_date' => '2026-07-20'],
                    'target_jp' => 450,
                    'achieved_jp' => 360,
                    'completion_percentage' => 80,
                    'status' => 'IN_PROGRESS',
                    'verified_reports_count' => 16,
                ]],
            ],
            [
                'id' => 'GDT-VHS-002',
                'nik' => '3371015605010002',
                'name' => 'Novi Indriani',
                'institution_name' => 'VictoriaHotelSchool',
                'biodata' => [
                    'full_name' => 'Novi Indriani',
                    'gender' => 'Perempuan',
                    'city' => 'Kota Magelang',
                    'province' => 'Jawa Tengah',
                    'expertise' => 'Pastry & Bakery Specialist',
                    'target_country' => 'Jepang',
                    'education' => ['school_origin' => 'VictoriaHotelSchool', 'major' => 'Culinary Arts & Cookery'],
                ],
                'placement_readiness' => ['status' => 'JOB_READY', 'is_agreement_verified' => true, 'selection_results' => ['agreed_terms' => true]],
                'classes_history' => [[
                    'batch_id' => 'batch-vhs-cul-02',
                    'class_code' => 'VHS-CUL-2026',
                    'batch_name' => 'Culinary & Commercial Cookery Standard Global - Batch II',
                    'sector_name' => 'Kuliner & Tata Boga',
                    'program_name' => 'Commercial Cookery Specialist',
                    'period' => ['start_date' => '2026-01-20', 'end_date' => '2026-07-20'],
                    'target_jp' => 450,
                    'achieved_jp' => 360,
                    'completion_percentage' => 80,
                    'status' => 'IN_PROGRESS',
                    'verified_reports_count' => 16,
                ]],
            ],
            [
                'id' => 'GDT-VHS-003',
                'nik' => '3371010308020003',
                'name' => 'Dimas Pratama',
                'institution_name' => 'VictoriaHotelSchool',
                'biodata' => [
                    'full_name' => 'Dimas Pratama',
                    'gender' => 'Laki-laki',
                    'city' => 'Kota Magelang',
                    'province' => 'Jawa Tengah',
                    'expertise' => 'Culinary Arts & Food Production',
                    'target_country' => 'Australia',
                    'education' => ['school_origin' => 'VictoriaHotelSchool', 'major' => 'Culinary Arts & Cookery'],
                ],
                'placement_readiness' => ['status' => 'TRAINING_READY', 'is_agreement_verified' => true, 'selection_results' => ['agreed_terms' => true]],
                'classes_history' => [[
                    'batch_id' => 'batch-vhs-cul-02',
                    'class_code' => 'VHS-CUL-2026',
                    'batch_name' => 'Culinary & Commercial Cookery Standard Global - Batch II',
                    'sector_name' => 'Kuliner & Tata Boga',
                    'program_name' => 'Commercial Cookery Specialist',
                    'period' => ['start_date' => '2026-01-20', 'end_date' => '2026-07-20'],
                    'target_jp' => 450,
                    'achieved_jp' => 360,
                    'completion_percentage' => 80,
                    'status' => 'IN_PROGRESS',
                    'verified_reports_count' => 16,
                ]],
            ],
            [
                'id' => 'GDT-VHS-004',
                'nik' => '3371016410010004',
                'name' => 'Siti Nurhaliza',
                'institution_name' => 'VictoriaHotelSchool',
                'biodata' => [
                    'full_name' => 'Siti Nurhaliza',
                    'gender' => 'Perempuan',
                    'city' => 'Kota Magelang',
                    'province' => 'Jawa Tengah',
                    'expertise' => 'Commercial Cookery & Western Cuisine',
                    'target_country' => 'Jepang',
                    'education' => ['school_origin' => 'VictoriaHotelSchool', 'major' => 'Culinary Arts & Cookery'],
                ],
                'placement_readiness' => ['status' => 'JOB_READY', 'is_agreement_verified' => true, 'selection_results' => ['agreed_terms' => true]],
                'classes_history' => [[
                    'batch_id' => 'batch-vhs-cul-02',
                    'class_code' => 'VHS-CUL-2026',
                    'batch_name' => 'Culinary & Commercial Cookery Standard Global - Batch II',
                    'sector_name' => 'Kuliner & Tata Boga',
                    'program_name' => 'Commercial Cookery Specialist',
                    'period' => ['start_date' => '2026-01-20', 'end_date' => '2026-07-20'],
                    'target_jp' => 450,
                    'achieved_jp' => 360,
                    'completion_percentage' => 80,
                    'status' => 'IN_PROGRESS',
                    'verified_reports_count' => 16,
                ]],
            ],

            // DutaInternationalCourse (3 candidates, 1 batch)
            [
                'id' => 'GDT-DIC-001',
                'nik' => '3372011003020001',
                'name' => 'Hendra Kusuma',
                'institution_name' => 'DutaInternationalCourse',
                'biodata' => [
                    'full_name' => 'Hendra Kusuma',
                    'gender' => 'Laki-laki',
                    'city' => 'Kota Surakarta',
                    'province' => 'Jawa Tengah',
                    'expertise' => 'Hospitality & Bahasa Jepang (N4/N3)',
                    'target_country' => 'Jepang',
                    'education' => ['school_origin' => 'DutaInternationalCourse', 'major' => 'Hospitality & Bahasa Jepang'],
                ],
                'placement_readiness' => ['status' => 'JOB_READY', 'is_agreement_verified' => true, 'selection_results' => ['agreed_terms' => true]],
                'classes_history' => [[
                    'batch_id' => 'batch-dic-jpn-01',
                    'class_code' => 'DIC-JPN-2026',
                    'batch_name' => 'Bahasa & Budaya Kerja Industri Perhotelan Jepang Batch 2026',
                    'sector_name' => 'Hospitality & Bahasa Jepang',
                    'program_name' => 'Japanese Hospitality & Service',
                    'period' => ['start_date' => '2026-02-01', 'end_date' => '2026-06-30'],
                    'target_jp' => 360,
                    'achieved_jp' => 290,
                    'completion_percentage' => 80.5,
                    'status' => 'IN_PROGRESS',
                    'verified_reports_count' => 14,
                ]],
            ],
            [
                'id' => 'GDT-DIC-002',
                'nik' => '3372015506010002',
                'name' => 'Maya Safitri',
                'institution_name' => 'DutaInternationalCourse',
                'biodata' => [
                    'full_name' => 'Maya Safitri',
                    'gender' => 'Perempuan',
                    'city' => 'Kota Surakarta',
                    'province' => 'Jawa Tengah',
                    'expertise' => 'Hospitality & Bahasa Jepang',
                    'target_country' => 'Jepang',
                    'education' => ['school_origin' => 'DutaInternationalCourse', 'major' => 'Hospitality & Bahasa Jepang'],
                ],
                'placement_readiness' => ['status' => 'JOB_READY', 'is_agreement_verified' => true, 'selection_results' => ['agreed_terms' => true]],
                'classes_history' => [[
                    'batch_id' => 'batch-dic-jpn-01',
                    'class_code' => 'DIC-JPN-2026',
                    'batch_name' => 'Bahasa & Budaya Kerja Industri Perhotelan Jepang Batch 2026',
                    'sector_name' => 'Hospitality & Bahasa Jepang',
                    'program_name' => 'Japanese Hospitality & Service',
                    'period' => ['start_date' => '2026-02-01', 'end_date' => '2026-06-30'],
                    'target_jp' => 360,
                    'achieved_jp' => 290,
                    'completion_percentage' => 80.5,
                    'status' => 'IN_PROGRESS',
                    'verified_reports_count' => 14,
                ]],
            ],
            [
                'id' => 'GDT-DIC-003',
                'nik' => '3372012509020003',
                'name' => 'Rizky Ramadhan',
                'institution_name' => 'DutaInternationalCourse',
                'biodata' => [
                    'full_name' => 'Rizky Ramadhan',
                    'gender' => 'Laki-laki',
                    'city' => 'Kota Surakarta',
                    'province' => 'Jawa Tengah',
                    'expertise' => 'Bahasa Jepang Terapan & Front Desk',
                    'target_country' => 'Jepang',
                    'education' => ['school_origin' => 'DutaInternationalCourse', 'major' => 'Hospitality & Bahasa Jepang'],
                ],
                'placement_readiness' => ['status' => 'TRAINING_READY', 'is_agreement_verified' => true, 'selection_results' => ['agreed_terms' => true]],
                'classes_history' => [[
                    'batch_id' => 'batch-dic-jpn-01',
                    'class_code' => 'DIC-JPN-2026',
                    'batch_name' => 'Bahasa & Budaya Kerja Industri Perhotelan Jepang Batch 2026',
                    'sector_name' => 'Hospitality & Bahasa Jepang',
                    'program_name' => 'Japanese Hospitality & Service',
                    'period' => ['start_date' => '2026-02-01', 'end_date' => '2026-06-30'],
                    'target_jp' => 360,
                    'achieved_jp' => 290,
                    'completion_percentage' => 80.5,
                    'status' => 'IN_PROGRESS',
                    'verified_reports_count' => 14,
                ]],
            ],
        ];

        foreach ($samples as $sample) {
            $this->persistCandidate($sample, self::SOURCE, true);
        }

        DB::table('integration_sync_logs')->updateOrInsert(
            ['source' => 'gardata', 'entity' => 'candidates_and_training_records'],
            [
                'status' => 'success',
                'records_fetched' => count($samples),
                'records_inserted' => count($samples),
                'records_updated' => 0,
                'records_skipped' => 0,
                'started_at' => now()->subMinutes(15),
                'finished_at' => now(),
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );
    }
}
