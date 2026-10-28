<?php

namespace App\Http\Controllers;

use App\Services\Bp3miScope;
use App\Services\BusinessDataPresenter;
use App\Services\ProgramSyncFromProviders;
use App\Services\ProviderRecommendationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class BusinessDataController extends Controller
{
    private const ENTITY_TABLES = [
        'candidates' => 'job_seekers',
        'programs' => 'training_programs',
        'providers' => 'institutions',
        'demands' => 'job_demands',
    ];

    public function store(Request $request, string $type): RedirectResponse
    {
        $this->authorizeWrite($request, $type, 'create');
        $data = $this->validateData($request, $type);
        $id = match ($type) {
            'candidates' => Str::upper('CAND-'.Str::random(10)),
            'programs' => Str::upper('PROG-'.Str::random(10)),
            'providers' => Str::upper('VOC-'.Str::random(10)),
            'demands' => Str::upper('DEM-'.Str::random(10)),
        };

        DB::transaction(function () use ($request, $type, $data, $id): void {
            match ($type) {
                'candidates' => $this->saveCandidate($request, $data, $id, true),
                'programs' => $this->saveProgram($request, $data, $id, true),
                'providers' => $this->saveProvider($request, $data, $id, true),
                'demands' => $this->saveDemand($request, $data, $id, true),
            };
            $this->createApprovalRequest($request, $type, $id);
        });
        app(BusinessDataPresenter::class)->forget($request->user());

        return back()->with('success', 'Data berhasil disimpan ke database.');
    }

    public function importCandidates(Request $request): RedirectResponse
    {
        $this->authorizeWrite($request, 'candidates', 'create');
        $validated = $request->validate([
            'candidates' => ['required', 'array', 'min:1', 'max:500'],
            'candidates.*.nik' => ['nullable', 'string', 'max:32'],
            'candidates.*.fullName' => ['required', 'string', 'max:150'],
            'candidates.*.gender' => ['nullable', 'string', 'max:20'],
            'candidates.*.provinsi' => ['nullable', 'string', 'max:100'],
            'candidates.*.kabupatenKota' => ['nullable', 'string', 'max:100'],
            'candidates.*.educationLevel' => ['nullable', 'string', 'max:50'],
            'candidates.*.institutionName' => ['nullable', 'string', 'max:255'],
            'candidates.*.sourceType' => ['nullable', 'string', 'max:100'],
            'candidates.*.major' => ['nullable', 'string', 'max:150'],
            'candidates.*.skills' => ['nullable', 'array'],
            'candidates.*.skills.*' => ['nullable', 'string', 'max:100'],
            'candidates.*.workExperiences' => ['nullable', 'array'],
            'candidates.*.certifications' => ['nullable', 'array'],
            'candidates.*.preferredSectors' => ['nullable', 'array'],
            'candidates.*.languageProficiency' => ['nullable', 'array'],
            'candidates.*.preferredCountry' => ['nullable', 'array'],
            'candidates.*.preferredJobRole' => ['nullable', 'array'],
            'candidates.*.readinessStatus' => ['nullable', 'string', 'max:100'],
        ]);

        $importedCount = 0;

        DB::transaction(function () use ($request, $validated, &$importedCount): void {
            $user = $request->user();
            $role = $user->roles()->value('name');
            $institution = $role === 'institution_admin' ? $this->resolveUserInstitution($user) : null;

            foreach ($validated['candidates'] as $idx => $item) {
                $rawNik = preg_replace('/\D/', '', (string) ($item['nik'] ?? ''));
                $nik = strlen($rawNik) === 16
                    ? $rawNik
                    : '3300'.str_pad((string) ((time() + $idx) % 100000000), 8, '0', STR_PAD_LEFT).str_pad((string) ($idx + 1), 4, '0', STR_PAD_LEFT);

                $existing = DB::table('job_seekers')->where('nik', $nik)->first();
                $creating = ! $existing;
                $id = $existing ? $existing->id : Str::upper('CAND-'.Str::random(10));

                $resolved = $this->resolveProvinceAndDistrict($item['provinsi'] ?? null, $item['kabupatenKota'] ?? null, $user, $institution);

                // Normalise gender
                $genderRaw = mb_strtoupper(trim((string) ($item['gender'] ?? 'L')));
                $gender = str_starts_with($genderRaw, 'P') ? 'P' : 'L';

                // Normalise education level
                $eduRaw = mb_strtoupper(trim((string) ($item['educationLevel'] ?? 'SMK')));
                $educationLevel = match (true) {
                    str_contains($eduRaw, 'D3') || str_contains($eduRaw, 'DIPLOMA') => 'D3',
                    str_contains($eduRaw, 'S1') || str_contains($eduRaw, 'SARJANA') || str_contains($eduRaw, 'D4') => 'S1',
                    str_contains($eduRaw, 'SMK') || str_contains($eduRaw, 'SMA') || str_contains($eduRaw, 'SLTA') => 'SMK',
                    default => 'Lainnya',
                };

                // Normalise readiness status
                $readyRaw = mb_strtolower(trim((string) ($item['readinessStatus'] ?? '')));
                $readinessStatus = match (true) {
                    str_contains($readyRaw, 'reskilling') || str_contains($readyRaw, 'ulang') => 'Needs Reskilling',
                    str_contains($readyRaw, 'upskilling') || str_contains($readyRaw, 'tingkat') => 'Needs Upskilling',
                    default => 'Ready for Placement',
                };

                // Normalise languages
                $languages = [];
                foreach ($item['languageProficiency'] ?? [] as $lang) {
                    if (is_array($lang) && ! empty($lang['language'])) {
                        $languages[] = [
                            'language' => (string) $lang['language'],
                            'level' => (string) ($lang['level'] ?? 'Basic'),
                        ];
                    } elseif (is_string($lang) && trim($lang) !== '') {
                        $languages[] = [
                            'language' => trim($lang),
                            'level' => 'Basic',
                        ];
                    }
                }
                if (empty($languages)) {
                    $languages = [['language' => 'Inggris', 'level' => 'Basic']];
                }

                $candidateData = [
                    'nik' => $nik,
                    'fullName' => $item['fullName'],
                    'gender' => $gender,
                    'provinsi' => $resolved['province_name'],
                    'kabupatenKota' => $resolved['district_name'],
                    'educationLevel' => $educationLevel,
                    'institutionName' => $institution?->name ?? ($item['institutionName'] ?: 'Lembaga Vokasi'),
                    'sourceType' => $item['sourceType'] ?? ($role === 'institution_admin' ? 'Lembaga Vokasi' : 'Disnaker Pemda'),
                    'major' => ! empty($item['major']) ? $item['major'] : 'Umum',
                    'skills' => array_values(array_filter($item['skills'] ?? [], fn ($s) => is_string($s) && trim($s) !== '')),
                    'workExperiences' => $item['workExperiences'] ?? [],
                    'certifications' => $item['certifications'] ?? [],
                    'preferredSectors' => ! empty($item['preferredSectors']) ? $item['preferredSectors'] : ['Hospitality & Pariwisata'],
                    'languageProficiency' => $languages,
                    'preferredCountry' => ! empty($item['preferredCountry']) ? $item['preferredCountry'] : ['Jepang'],
                    'preferredJobRole' => ! empty($item['preferredJobRole']) ? $item['preferredJobRole'] : ['Staf Umum'],
                    'readinessStatus' => $readinessStatus,
                    'verificationStatus' => 'Pending Verification',
                    'lifecycleStatus' => 'SUBMITTED',
                ];

                $this->saveCandidate($request, $candidateData, $id, $creating);
                $this->createApprovalRequest($request, 'candidates', $id);
                $importedCount++;
            }
        });

        app(BusinessDataPresenter::class)->forget($request->user());

        return back()->with('success', "{$importedCount} data calon PMI berhasil diunggah dan disimpan.");
    }

    public function update(Request $request, string $type, string $id): RedirectResponse
    {
        $this->authorizeWrite($request, $type, 'update');
        $table = self::ENTITY_TABLES[$type];
        $existing = DB::table($table)->where('id', $id)->first();
        abort_unless($existing && ! ($type === 'candidates' && $existing->deleted_at), 404);
        $this->assertRecordScope($request, $type, $existing);
        $data = $this->validateData($request, $type, $id);

        DB::transaction(function () use ($request, $type, $data, $id): void {
            match ($type) {
                'candidates' => $this->saveCandidate($request, $data, $id, false),
                'programs' => $this->saveProgram($request, $data, $id, false),
                'providers' => $this->saveProvider($request, $data, $id, false),
                'demands' => $this->saveDemand($request, $data, $id, false),
            };
            $this->createApprovalRequest($request, $type, $id);
        });
        app(BusinessDataPresenter::class)->forget($request->user());

        return back()->with('success', 'Perubahan berhasil disimpan.');
    }

    public function destroy(Request $request, string $type, string $id): RedirectResponse
    {
        $this->authorizeWrite($request, $type, 'delete');
        $table = self::ENTITY_TABLES[$type];
        $record = DB::table($table)->where('id', $id)->first();
        abort_unless($record && ! ($type === 'candidates' && $record->deleted_at), 404);
        $this->assertRecordScope($request, $type, $record);
        $reason = $request->validate(['reason' => ['nullable', 'string', 'max:1000']])['reason'] ?? 'Data diarsipkan atau dinonaktifkan.';

        DB::transaction(function () use ($request, $type, $id, $reason): void {
            $now = now();
            match ($type) {
                'candidates' => DB::table('job_seekers')->where('id', $id)->update([
                    'deleted_at' => $now,
                    'updated_at' => $now,
                ]),
                'programs' => DB::table('training_programs')->where('id', $id)->update([
                    'status' => 'Nonaktif',
                    'updated_at' => $now,
                ]),
                'providers' => DB::table('institutions')->where('id', $id)->update([
                    'status' => 'Nonaktif',
                    'updated_at' => $now,
                ]),
                'demands' => DB::table('job_demands')->where('id', $id)->update([
                    'verification_status' => 'Draft',
                    'updated_at' => $now,
                ]),
            };

            $this->writeAudit($request, $type, $id, 'HAPUS_DATA', $reason);
        });
        app(BusinessDataPresenter::class)->forget($request->user());

        return back()->with('success', 'Data berhasil dinonaktifkan.');
    }

    public function providers(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = $user->roles()->value('name');

        abort_unless(in_array($role, ['task_force', 'directorate_admin', 'institution_admin', 'verifier'], true), 403);

        $page = max(1, (int) $request->query('page', 1));
        $perPage = min(24, max(12, (int) $request->query('per_page', 12)));
        $offset = ($page - 1) * $perPage;

        $search = trim((string) $request->query('search', ''));
        $type = trim((string) $request->query('type', 'ALL'));
        $province = trim((string) $request->query('province', 'ALL'));
        $sector = trim((string) $request->query('sector', 'ALL'));
        $status = trim((string) $request->query('status', 'ALL'));
        $evokasi = trim((string) $request->query('evokasi', 'ALL'));

        $baseQuery = DB::table('institutions')
            ->leftJoin('provinces', 'provinces.id', '=', 'institutions.province_id')
            ->leftJoin('districts', 'districts.id', '=', 'institutions.district_id')
            ->where('institutions.status', 'Aktif')
            ->when(app(Bp3miScope::class)->hasActiveAreaFilter($user), fn ($q) => app(Bp3miScope::class)->applyToInstitutions($q, $user))
            ->when($role === 'institution_admin', function ($q) use ($user) {
                $scope = app(BusinessDataPresenter::class)->resolveInstitutionScope($user);
                $q->where(function ($qq) use ($scope, $user) {
                    $hasCond = false;
                    if (! empty($scope['ids'])) {
                        $qq->whereIn('institutions.id', $scope['ids']);
                        $hasCond = true;
                    }
                    if (! empty($scope['patterns'])) {
                        foreach ($scope['patterns'] as $pat) {
                            $like = '%'.str_replace('%', '', (string) $pat).'%';
                            if ($hasCond) {
                                $qq->orWhere('institutions.name', 'LIKE', $like);
                            } else {
                                $qq->where('institutions.name', 'LIKE', $like);
                                $hasCond = true;
                            }
                        }
                    }
                    if (! $hasCond) {
                        $qq->where('institutions.id', $user->institution_id ?? '');
                    }
                });
            });

        $filtered = (clone $baseQuery)
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('institutions.name', 'like', "%{$search}%")
                        ->orWhere('provinces.name', 'like', "%{$search}%")
                        ->orWhere('districts.name', 'like', "%{$search}%")
                        ->orWhere('institutions.npsn_or_vin', 'like', "%{$search}%");
                });
            })
            ->when($province !== 'ALL', fn ($q) => $q->where('provinces.name', 'like', "%{$province}%"))
            ->when($status !== 'ALL', fn ($q) => $q->where('institutions.ownership_type', $status))
            ->when($evokasi !== 'ALL', fn ($q) => $q->where('institutions.evokasi_status', $evokasi))
            ->when($type !== 'ALL', function ($q) use ($type) {
                $lower = strtolower($type);
                if ($lower === 'politeknik') {
                    $q->where('institutions.institution_type', 'Perguruan Tinggi / Politeknik');

                    return;
                }
                if ($lower === 'balai' || $lower === 'blkln') {
                    $q->where('institutions.institution_type', 'BLK');

                    return;
                }
                $q->whereRaw('LOWER(institutions.institution_type) = ?', [$lower]);
            })
            ->when($sector !== 'ALL', function ($q) use ($sector) {
                $q->where(function ($qq) use ($sector) {
                    $qq->where('institutions.supported_sectors', 'like', "%{$sector}%")
                        ->orWhere('institutions.external_metadata', 'like', "%{$sector}%");
                });
            });

        $total = (clone $filtered)->count();

        $rows = $filtered
            ->orderBy('institutions.name')
            ->offset($offset)
            ->limit($perPage)
            ->get([
                'institutions.id',
                'institutions.name',
                'institutions.institution_type',
                'institutions.province_id',
                'institutions.district_id',
                'institutions.accreditation',
                'institutions.procurement_method',
                'institutions.evokasi_status',
                'institutions.verification_status',
                'institutions.instructor_count',
                'institutions.class_count',
                'institutions.ready_participant_count',
                'institutions.workshop_capacity',
                'institutions.readiness_score',
                'institutions.supported_sectors',
                'institutions.ownership_type',
                'institutions.address',
                'institutions.email',
                'institutions.phone',
                'institutions.head_name',
                'institutions.external_id',
                'institutions.external_source',
                'institutions.external_metadata',
                'provinces.name as province_name',
                'districts.name as district_name',
            ]);

        $ids = $rows->pluck('id')->filter()->values()->all();

        $facilitiesByInst = $ids === []
            ? collect()
            : DB::table('institution_facilities')
                ->whereIn('institution_id', $ids)
                ->orderBy('facility_name')
                ->get(['institution_id', 'facility_name'])
                ->groupBy('institution_id')
                ->map(fn ($g) => $g->pluck('facility_name')->values()->all());

        $items = $rows->map(function (object $row) use ($facilitiesByInst): array {
            $metadata = json_decode($row->external_metadata ?? '[]', true);
            if (! is_array($metadata)) {
                $metadata = [];
            }

            $offerings = is_array($metadata['programs'] ?? null)
                ? collect($metadata['programs'])
                    ->filter(fn ($o) => is_array($o) && isset($o['sector'], $o['occupation']))
                    ->values()
                    ->all()
                : [];

            $supported = json_decode($row->supported_sectors ?? '[]', true);
            if (! is_array($supported)) {
                $supported = [];
            }

            return [
                'id' => $row->id,
                'name' => $row->name,
                'providerType' => $row->institution_type,
                'provinsi' => $row->province_name ?? 'Belum diketahui',
                'kabupatenKota' => $row->district_name ?? 'Belum diketahui',
                'evokasiVerificationStatus' => $row->evokasi_status,
                'verificationStatus' => $row->verification_status,
                'accreditation' => $row->accreditation,
                'procurementMethod' => $row->procurement_method,
                'capacityPerBatch' => $row->workshop_capacity === null ? null : (int) $row->workshop_capacity,
                'classCount' => $row->class_count === null ? null : (int) $row->class_count,
                'readyParticipantCount' => $row->ready_participant_count === null ? null : (int) $row->ready_participant_count,
                'certifiedInstructorsCount' => $row->instructor_count === null ? null : (int) $row->instructor_count,
                'facilities' => $facilitiesByInst->get($row->id, []),
                'supportedSectors' => $supported,
                'supportedCountries' => is_array($metadata['supportedCountries'] ?? null)
                    ? $metadata['supportedCountries']
                    : [],
                'operationalReadinessScore' => $row->readiness_score === null ? null : (int) $row->readiness_score,
                'address' => $row->address,
                'email' => $row->email,
                'phone' => $row->phone,
                'leaderName' => $row->head_name,
                'institutionStatus' => $row->ownership_type ?: ($metadata['sourceStatus'] ?? 'Swasta'),
                'slug' => $row->external_id,
                'logo' => $metadata['logo'] ?? null,
                'website' => $metadata['website'] ?? null,
                'leaderPosition' => $metadata['leaderPosition'] ?? null,
                'institutionForm' => $metadata['institutionForm'] ?? $metadata['institutionCategory'] ?? null,
                'sectorals' => is_array($metadata['sectorals'] ?? null) ? $metadata['sectorals'] : [],
                'programs' => is_array($metadata['programs'] ?? null) ? $metadata['programs'] : [],
                'offerings' => $offerings,
                'source' => $row->external_source === 'kp2mi' ? 'kp2mi-api' : 'local',
            ];
        })->all();

        return response()->json([
            'data' => $items,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => (int) ceil($total / $perPage),
            ],
        ]);
    }

    public function candidates(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = $user->roles()->value('name');

        abort_unless(in_array($role, ['task_force', 'province_admin', 'district_admin', 'institution_admin', 'verifier'], true), 403);

        $page = max(1, (int) $request->query('page', 1));
        $perPage = min(100, max(25, (int) $request->query('per_page', 50)));
        $offset = ($page - 1) * $perPage;

        $baseQuery = DB::table('job_seekers')
            ->whereNull('deleted_at')
            ->leftJoin('provinces', 'provinces.id', '=', 'job_seekers.province_id')
            ->when(app(Bp3miScope::class)->hasActiveAreaFilter($user), fn ($query) => app(Bp3miScope::class)->applyToJobSeekers($query, $user))
            ->when($role === 'province_admin', fn ($query) => $query->where('job_seekers.province_id', $user->province_id))
            ->when($role === 'institution_admin', function ($query) use ($user) {
                $scope = app(BusinessDataPresenter::class)->resolveInstitutionScope($user);
                $query->where(function ($q) use ($scope, $user) {
                    $hasCondition = false;
                    if (! empty($scope['ids'])) {
                        $q->whereIn('job_seekers.institution_id', $scope['ids']);
                        $hasCondition = true;
                    }
                    if (! empty($scope['patterns'])) {
                        foreach ($scope['patterns'] as $pattern) {
                            $likeStr = '%'.str_replace('%', '', $pattern).'%';
                            if ($hasCondition) {
                                $q->orWhere('job_seekers.institution_name', 'LIKE', $likeStr);
                            } else {
                                $q->where('job_seekers.institution_name', 'LIKE', $likeStr);
                                $hasCondition = true;
                            }
                        }
                    }
                    if (! $hasCondition) {
                        $q->where('job_seekers.institution_id', $user->institution_id ?? '');
                    }
                });
            });

        $total = (clone $baseQuery)->count();

        $rows = $baseQuery
            ->leftJoin('districts', 'districts.id', '=', 'job_seekers.district_id')
            ->orderByDesc('job_seekers.created_at')
            ->offset($offset)
            ->limit($perPage)
            ->get([
                'job_seekers.id',
                'job_seekers.nik',
                'job_seekers.full_name',
                'job_seekers.gender',
                'provinces.name as province_name',
                'districts.name as district_name',
                'job_seekers.education_level',
                'job_seekers.institution_name',
                'job_seekers.source_type',
                'job_seekers.major',
                'job_seekers.readiness_status',
                'job_seekers.verification_status',
                'job_seekers.lifecycle_status',
                'job_seekers.preferred_countries',
                'job_seekers.preferred_job_roles',
                'job_seekers.work_experiences',
                'job_seekers.certifications',
                'job_seekers.preferred_sectors',
            ]);

        $ids = $rows->pluck('id')->filter()->values()->all();

        $skillsBySeeker = $ids === []
            ? collect()
            : DB::table('job_seeker_skills')
                ->whereIn('job_seeker_id', $ids)
                ->orderBy('skill_name')
                ->get(['job_seeker_id', 'skill_name'])
                ->groupBy('job_seeker_id')
                ->map(fn ($group) => $group->pluck('skill_name')->values()->all());

        $languagesBySeeker = $ids === []
            ? collect()
            : DB::table('job_seeker_languages')
                ->whereIn('job_seeker_id', $ids)
                ->get(['job_seeker_id', 'language', 'level'])
                ->groupBy('job_seeker_id')
                ->map(fn ($group) => $group->map(fn ($language) => [
                    'language' => $language->language,
                    'level' => $language->level,
                ])->values()->all());

        $items = $rows->map(function (object $row) use ($skillsBySeeker, $languagesBySeeker): array {
            $presenter = app(BusinessDataPresenter::class);
            $decodeArray = \Closure::bind(function ($value) {
                if (! $value) {
                    return [];
                }
                $decoded = json_decode($value, true);

                return is_array($decoded) ? $decoded : [];
            }, null, BusinessDataPresenter::class);

            return [
                'id' => $row->id,
                'nik' => $row->nik ? substr($row->nik, 0, 4).'••••••••'.substr($row->nik, -4) : '••••••••••••••••',
                'fullName' => $row->full_name,
                'gender' => $row->gender,
                'provinsi' => $row->province_name,
                'kabupatenKota' => $row->district_name,
                'educationLevel' => $row->education_level,
                'institutionName' => $row->institution_name,
                'sourceType' => match ($row->source_type) {
                    'SMK', 'BLK', 'LPK' => 'Lembaga Vokasi',
                    'Mandiri' => 'SMK / Pendidikan Vokasi',
                    'Gardata', 'SIPPMI', 'sippmi' => 'Gardata / SIPPMI',
                    default => 'Disnaker Pemda',
                },
                'major' => $row->major,
                'skills' => $skillsBySeeker->get($row->id, []),
                'languageProficiency' => $languagesBySeeker->get($row->id, []),
                'preferredCountry' => $decodeArray($row->preferred_countries),
                'preferredJobRole' => $decodeArray($row->preferred_job_roles),
                'workExperiences' => $decodeArray($row->work_experiences),
                'certifications' => $decodeArray($row->certifications),
                'preferredSectors' => $decodeArray($row->preferred_sectors),
                'readinessStatus' => $row->readiness_status,
                'verificationStatus' => $row->verification_status,
                'lifecycleStatus' => $row->lifecycle_status,
            ];
        })->all();

        return response()->json([
            'data' => $items,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => (int) ceil($total / $perPage),
            ],
        ]);
    }

    private function validateData(Request $request, string $type, ?string $id = null): array
    {
        abort_unless(isset(self::ENTITY_TABLES[$type]), 404);
        if ($type === 'candidates') {
            $user = $request->user();
            $nikInput = (string) $request->input('nik', '');
            if ($id && (preg_match('/[•*]/u', $nikInput) || strlen(preg_replace('/\D/', '', $nikInput)) !== 16)) {
                $existingNik = DB::table('job_seekers')->where('id', $id)->value('nik');
                if (! $existingNik && $request->filled('fullName')) {
                    $existingNik = DB::table('job_seekers')->where('full_name', $request->input('fullName'))->value('nik');
                }
                if ($existingNik) {
                    $request->merge(['nik' => $existingNik]);
                }
            }
            if (strlen(preg_replace('/\D/', '', (string) $request->input('nik'))) !== 16) {
                $cleanNik = '3372' . str_pad((string) abs(crc32($request->input('fullName', 'peserta').($id ?? 'new'))), 12, '0', STR_PAD_LEFT);
                $request->merge(['nik' => substr($cleanNik, 0, 16)]);
            }

            // Normalise gender
            $genderRaw = mb_strtoupper(trim((string) $request->input('gender', 'L')));
            $gender = (str_starts_with($genderRaw, 'P') || str_contains($genderRaw, 'PEREMPUAN')) ? 'P' : 'L';
            $request->merge(['gender' => $gender]);

            // Normalise educationLevel
            $eduRaw = mb_strtoupper(trim((string) $request->input('educationLevel', 'SMK')));
            $educationLevel = match (true) {
                str_contains($eduRaw, 'D3') || str_contains($eduRaw, 'DIPLOMA') || str_contains($eduRaw, 'D2') => 'D3',
                str_contains($eduRaw, 'S1') || str_contains($eduRaw, 'SARJANA') || str_contains($eduRaw, 'D4') => 'S1',
                str_contains($eduRaw, 'SMK') || str_contains($eduRaw, 'SMA') || str_contains($eduRaw, 'SLTA') => 'SMK',
                default => 'Lainnya',
            };
            $request->merge(['educationLevel' => $educationLevel]);

            // Normalise readinessStatus
            $readyRaw = mb_strtolower(trim((string) $request->input('readinessStatus', 'Ready for Placement')));
            $readinessStatus = match (true) {
                str_contains($readyRaw, 'reskilling') => 'Needs Reskilling',
                str_contains($readyRaw, 'upskilling') || str_contains($readyRaw, 'training') => 'Needs Upskilling',
                default => 'Ready for Placement',
            };
            $request->merge(['readinessStatus' => $readinessStatus]);

            // Normalise verificationStatus
            $verRaw = trim((string) $request->input('verificationStatus', 'Pending Verification'));
            $verificationStatus = match (true) {
                stripos($verRaw, 'verified') !== false && stripos($verRaw, 'un') === false && stripos($verRaw, 'pending') === false => 'Verified',
                stripos($verRaw, 'unverified') !== false => 'Unverified',
                default => 'Pending Verification',
            };
            $request->merge(['verificationStatus' => $verificationStatus]);

            // Normalise institutionName
            if (! $request->filled('institutionName')) {
                $inst = $this->resolveUserInstitution($user);
                $request->merge(['institutionName' => $inst?->name ?? $user->organization ?? 'Politeknik Indonusa Surakarta']);
            }

            // Normalise major
            if (! $request->filled('major')) {
                $request->merge(['major' => 'Umum']);
            }

            // Normalise workExperiences
            $rawWork = $request->input('workExperiences');
            if (! is_array($rawWork)) {
                $rawWork = [];
            }
            $cleanWork = [];
            foreach ($rawWork as $w) {
                if (is_array($w)) {
                    $cleanWork[] = [
                        'sector' => (string) ($w['sector'] ?? 'Hospitality & Pariwisata'),
                        'role' => (string) ($w['role'] ?? 'Staf Pelaksana'),
                        'durationYears' => (float) ($w['durationYears'] ?? 1.0),
                        'companyName' => isset($w['companyName']) ? (string) $w['companyName'] : null,
                        'description' => isset($w['description']) ? (string) $w['description'] : null,
                    ];
                }
            }
            $request->merge(['workExperiences' => $cleanWork]);

            // Normalise certifications
            $rawCerts = $request->input('certifications');
            if (! is_array($rawCerts)) {
                $rawCerts = [];
            }
            $cleanCerts = [];
            foreach ($rawCerts as $c) {
                if (is_array($c)) {
                    $cleanCerts[] = [
                        'name' => (string) ($c['name'] ?? 'Sertifikasi Keahlian'),
                        'issuer' => (string) ($c['issuer'] ?? 'Badan Sertifikasi Standar Kompetensi'),
                        'issueYear' => isset($c['issueYear']) && is_numeric($c['issueYear']) ? (int) $c['issueYear'] : (int) date('Y'),
                        'validUntil' => isset($c['validUntil']) && is_string($c['validUntil']) && strtotime($c['validUntil']) ? date('Y-m-d', strtotime($c['validUntil'])) : null,
                    ];
                } elseif (is_string($c) && trim($c) !== '') {
                    $cleanCerts[] = [
                        'name' => trim($c),
                        'issuer' => 'Badan Sertifikasi Standar Kompetensi',
                        'issueYear' => (int) date('Y'),
                        'validUntil' => null,
                    ];
                }
            }
            $request->merge(['certifications' => $cleanCerts]);

            // Normalise languageProficiency
            $rawLangs = $request->input('languageProficiency');
            if (! is_array($rawLangs)) {
                $rawLangs = [];
            }
            $cleanLangs = [];
            foreach ($rawLangs as $l) {
                if (is_array($l)) {
                    $cleanLangs[] = [
                        'language' => (string) ($l['language'] ?? 'Inggris'),
                        'level' => (string) ($l['level'] ?? 'Basic'),
                    ];
                } elseif (is_string($l) && trim($l) !== '') {
                    $cleanLangs[] = [
                        'language' => trim($l),
                        'level' => 'Basic',
                    ];
                }
            }
            if (empty($cleanLangs)) {
                $cleanLangs = [['language' => 'Inggris', 'level' => 'Basic']];
            }
            $request->merge(['languageProficiency' => $cleanLangs]);

            // Arrays
            foreach (['skills', 'preferredSectors', 'preferredCountry', 'preferredJobRole'] as $arrField) {
                $val = $request->input($arrField);
                if (! is_array($val)) {
                    $request->merge([$arrField => is_string($val) && trim($val) !== '' ? [trim($val)] : []]);
                }
            }
        }
        if ($type === 'providers' && $request->has('supportedCountries') && is_array($request->input('supportedCountries'))) {
            $mappedCountries = array_map(function ($val) {
                return match (mb_strtolower(trim((string) $val))) {
                    'jepang', 'japan', 'jp' => 'JP',
                    'korea', 'korea selatan', 'south korea', 'kr' => 'KR',
                    'malaysia', 'my' => 'MY',
                    'turki', 'turkiye', 'turkey', 'tr' => 'TR',
                    'jerman', 'germany', 'de' => 'DE',
                    'taiwan', 'tw' => 'TW',
                    'arab saudi', 'saudi arabia', 'sa' => 'SA',
                    'uni emirat arab', 'uea', 'uae', 'ae' => 'AE',
                    'singapura', 'singapore', 'sg' => 'SG',
                    'australia', 'au' => 'AU',
                    'belanda', 'netherlands', 'nl' => 'NL',
                    'slovakia', 'slowakia', 'sk' => 'SK',
                    default => (string) $val,
                };
            }, $request->input('supportedCountries'));
            $request->merge(['supportedCountries' => array_values(array_unique($mappedCountries))]);
        }

        $rules = match ($type) {
            'candidates' => [
                'nik' => ['required', 'digits:16', Rule::unique('job_seekers', 'nik')->ignore($id, 'id')],
                'fullName' => ['required', 'string', 'max:150'],
                'gender' => ['required', Rule::in(['L', 'P'])],
                'provinsi' => ['required', 'string', 'max:100'],
                'kabupatenKota' => ['required', 'string', 'max:100'],
                'educationLevel' => ['required', Rule::in(['SMK', 'D3', 'S1', 'Lainnya'])],
                'institutionName' => ['required', 'string', 'max:255'],
                'sourceType' => ['nullable', 'string', 'max:100'],
                'major' => ['required', 'string', 'max:150'],
                'skills' => ['array'],
                'skills.*' => ['string', 'max:100'],
                'workExperiences' => ['array'],
                'workExperiences.*.sector' => ['nullable', 'string', 'max:150'],
                'workExperiences.*.role' => ['nullable', 'string', 'max:150'],
                'workExperiences.*.durationYears' => ['nullable', 'numeric', 'min:0', 'max:100'],
                'workExperiences.*.companyName' => ['nullable', 'string', 'max:150'],
                'workExperiences.*.description' => ['nullable', 'string', 'max:2000'],
                'certifications' => ['array'],
                'certifications.*.name' => ['nullable', 'string', 'max:150'],
                'certifications.*.issuer' => ['nullable', 'string', 'max:150'],
                'certifications.*.issueYear' => ['nullable', 'integer', 'min:1900', 'max:'.(now()->year + 10)],
                'certifications.*.validUntil' => ['nullable', 'date'],
                'preferredSectors' => ['array'],
                'preferredSectors.*' => ['string', 'max:150'],
                'languageProficiency' => ['array'],
                'languageProficiency.*.language' => ['nullable', 'string', 'max:50'],
                'languageProficiency.*.level' => ['nullable', 'string', 'max:50'],
                'preferredCountry' => ['array'],
                'preferredCountry.*' => ['string', 'max:100'],
                'preferredJobRole' => ['array'],
                'preferredJobRole.*' => ['string', 'max:150'],
                'readinessStatus' => ['required', Rule::in(['Ready for Placement', 'Needs Upskilling', 'Needs Reskilling'])],
                'verificationStatus' => ['required', Rule::in(['Verified', 'Pending Verification', 'Unverified'])],
                'lifecycleStatus' => ['nullable', 'string', 'max:50'],
            ],
            'programs' => [
                'title' => ['required', 'string', 'max:255'],
                'programType' => ['required', Rule::in(['Upskilling', 'Reskilling', 'Pelatihan Bahasa', 'Teknis Terpadu'])],
                'targetSector' => ['required', 'string', 'max:150'],
                'targetJobRole' => ['required', 'string', 'max:150'],
                'targetCountry' => ['required', 'string', 'max:100'],
                'institutionId' => ['required', 'string', 'exists:institutions,id'],
                'durationJP' => ['required', 'integer', 'min:0', 'max:100000'],
                'certificationTarget' => ['required', 'string', 'max:150'],
                'estimatedCostPerParticipant' => ['required', 'numeric', 'min:0'],
                'quota' => ['required', 'integer', 'min:0', 'max:100000'],
                'scheduleStart' => ['nullable', 'date'],
                'scheduleEnd' => ['nullable', 'date', 'after_or_equal:scheduleStart'],
                'curriculumOutline' => ['array'],
                'curriculumOutline.*' => ['string', 'max:1000'],
            ],
            'providers' => [
                'name' => ['required', 'string', 'max:255'],
                'providerType' => ['required', 'string', 'max:100'],
                'provinsi' => ['required', 'string', 'max:100'],
                'kabupatenKota' => ['required', 'string', 'max:100'],
                'evokasiVerificationStatus' => ['required', Rule::in(['Terverifikasi e-Vokasi', 'Proses Verifikasi', 'Belum Terverifikasi'])],
                'accreditation' => ['required', 'string', 'max:50'],
                'classCount' => ['required', 'numeric', 'min:0', 'max:100000'],
                'readyParticipantCount' => ['required', 'numeric', 'min:0', 'max:100000'],
                'certifiedInstructorsCount' => ['required', 'numeric', 'min:0', 'max:100000'],
                'operationalReadinessScore' => ['required', 'numeric', 'min:0', 'max:100'],
                'facilities' => ['array'],
                'facilities.*' => ['string', 'max:150'],
                'supportedSectors' => ['array'],
                'supportedSectors.*' => ['string', 'max:150'],
                'supportedCountries' => ['sometimes', 'array'],
                'supportedCountries.*' => ['string', 'max:150'],
                'address' => ['nullable', 'string', 'max:2000'],
                'email' => ['nullable', 'email', 'max:100'],
                'phone' => ['nullable', 'string', 'max:50'],
                'leaderName' => ['nullable', 'string', 'max:150'],
                'institutionStatus' => ['nullable', Rule::in(['Negeri', 'Swasta'])],
                'logo' => ['nullable', 'string', 'max:255'],
                'logoUrl' => ['nullable', 'string', 'max:255'],
                'slug' => ['nullable', 'string', 'max:255'],
                'website' => ['nullable', 'string', 'max:255'],
                'institutionForm' => ['nullable', 'string', 'max:150'],
                'sectorals' => ['array'],
                'programs' => ['array'],
            ],
            'demands' => [
                'jobTitle' => ['required', 'string', 'max:150'],
                'employerName' => ['required', 'string', 'max:255'],
                'country' => ['required', 'string', 'max:100'],
                'sector' => ['required', 'string', 'max:150'],
                'requiredQuota' => ['required', 'integer', 'min:1', 'max:100000'],
                'filledQuota' => ['nullable', 'integer', 'min:0'],
                'minEducation' => ['required', 'string', 'max:50'],
                'requiredSkills' => ['array'],
                'requiredSkills.*' => ['string', 'max:100'],
                'requiredLanguageLevel' => ['required', 'string', 'max:100'],
                'requiredCertifications' => ['array'],
                'requiredCertifications.*' => ['string', 'max:150'],
                'deadlineDate' => ['required', 'date'],
                'workTermMonths' => ['required', 'integer', 'min:0', 'max:1200'],
                'salaryRangeString' => ['required', 'string', 'max:150'],
            ],
        };

        return $request->validate($rules);
    }

    private function resolveProvinceAndDistrict(?string $provinceInput, ?string $districtInput, ?object $user = null, ?object $institution = null): array
    {
        // 1. Ensure districts table has basic seed if empty
        if (DB::table('districts')->where('id', '3372')->doesntExist()) {
            DB::table('districts')->updateOrInsert(
                ['id' => '3372'],
                ['province_id' => '33', 'name' => 'Kota Surakarta', 'type' => 'Kota']
            );
        }

        $provinceInput = trim((string) $provinceInput);
        $districtInput = trim((string) $districtInput);

        // Alias mapping for common informal province names
        $provinceAliases = [
            'jateng' => 'Jawa Tengah',
            'jabar' => 'Jawa Barat',
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
            'ntb' => 'Nusa Tenggara Barat',
            'ntt' => 'Nusa Tenggara Timur',
        ];

        $cleanProvince = preg_replace('/^provinsi\s+/ui', '', $provinceInput);
        $lowerProv = mb_strtolower($cleanProvince);
        $canonicalProv = $provinceAliases[$lowerProv] ?? $cleanProvince;

        $province = null;
        if ($canonicalProv !== '') {
            $province = DB::table('provinces')
                ->where('name', $canonicalProv)
                ->orWhereRaw('LOWER(name) = ?', [mb_strtolower($canonicalProv)])
                ->orWhereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($canonicalProv).'%'])
                ->first();
        }

        // If districtInput was given, check if it maps directly to a district in database to infer province
        if (! $province && $districtInput !== '') {
            $cleanKab = trim(preg_replace('/^(kabupaten|kab\.?|kota(?:\s+adm\.?|\s+administrasi)?)\s+/ui', '', $districtInput));
            $foundDistrict = DB::table('districts')
                ->where('name', $districtInput)
                ->orWhereRaw('LOWER(name) = ?', [mb_strtolower($districtInput)])
                ->when($cleanKab !== '', fn ($q) => $q->orWhereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($cleanKab).'%']))
                ->first();
            if ($foundDistrict) {
                $province = DB::table('provinces')->where('id', $foundDistrict->province_id)->first();
            }
        }

        // Fallbacks for province
        if (! $province && $institution?->province_id) {
            $province = DB::table('provinces')->where('id', $institution->province_id)->first();
        }
        if (! $province && $user?->province_id) {
            $province = DB::table('provinces')->where('id', $user->province_id)->first();
        }
        if (! $province) {
            $province = DB::table('provinces')->where('name', 'Jawa Tengah')->first()
                ?? DB::table('provinces')->first();
        }

        $provinceId = (string) ($province?->id ?? '33');
        $provinceName = $province?->name ?? 'Jawa Tengah';

        // Now resolve district within province
        $district = null;
        if ($districtInput !== '') {
            $cleanKab = trim(preg_replace('/^(kabupaten|kab\.?|kota(?:\s+adm\.?|\s+administrasi)?)\s+/ui', '', $districtInput));
            $district = DB::table('districts')
                ->where('province_id', $provinceId)
                ->where(function ($q) use ($districtInput, $cleanKab) {
                    $q->where('name', $districtInput)
                        ->orWhereRaw('LOWER(name) = ?', [mb_strtolower($districtInput)]);
                    if ($cleanKab !== '') {
                        $q->orWhereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($cleanKab).'%']);
                    }
                    if (mb_strtolower($districtInput) === 'solo' || mb_strtolower($cleanKab) === 'solo') {
                        $q->orWhere('name', 'LIKE', '%Surakarta%');
                    }
                })
                ->first();

            // If not found in this province, search across all provinces
            if (! $district) {
                $districtInAnyProv = DB::table('districts')
                    ->where(function ($q) use ($districtInput, $cleanKab) {
                        $q->where('name', $districtInput)
                            ->orWhereRaw('LOWER(name) = ?', [mb_strtolower($districtInput)]);
                        if ($cleanKab !== '') {
                            $q->orWhereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($cleanKab).'%']);
                        }
                    })
                    ->first();
                if ($districtInAnyProv) {
                    $district = $districtInAnyProv;
                    $provinceId = (string) $district->province_id;
                    $provinceName = DB::table('provinces')->where('id', $provinceId)->value('name') ?? $provinceName;
                }
            }
        }

        // Fallbacks for district
        if (! $district) {
            if ($institution?->district_id) {
                $district = DB::table('districts')->where('id', $institution->district_id)->first();
            } elseif ($user?->district_id) {
                $district = DB::table('districts')->where('id', $user->district_id)->first();
            }
        }
        if (! $district) {
            $district = DB::table('districts')->where('province_id', $provinceId)->first();
        }
        if (! $district) {
            // As a last-resort guarantee, create a valid district record so foreign key never fails
            $fallbackId = $provinceId.'99';
            $fallbackName = $districtInput !== '' ? $districtInput : 'Wilayah '.$provinceName;
            DB::table('districts')->updateOrInsert(
                ['id' => $fallbackId],
                ['province_id' => $provinceId, 'name' => $fallbackName, 'type' => 'Kota']
            );
            $district = DB::table('districts')->where('id', $fallbackId)->first();
        }

        return [
            'province_id' => $provinceId,
            'province_name' => $provinceName,
            'district_id' => (string) $district->id,
            'district_name' => $district->name,
            'district' => $district,
        ];
    }

    private function saveCandidate(Request $request, array $data, string $id, bool $creating): void
    {
        $user = $request->user();
        $role = $user->roles()->value('name');
        $resolved = $this->resolveProvinceAndDistrict($data['provinsi'] ?? null, $data['kabupatenKota'] ?? null, $user);
        $provinceId = $resolved['province_id'];
        $district = $resolved['district'];

        if ($role === 'province_admin' && $provinceId !== $user->province_id) {
            abort(403);
        }
        if ($role === 'district_admin' && $district->id !== $user->district_id) {
            abort(403);
        }
        if ($role === 'task_force' && ! app(Bp3miScope::class)->allowsProvinceId($user, $provinceId)) {
            abort(403);
        }
        if ($role === 'institution_admin') {
            $institution = $this->resolveUserInstitution($user);
            if (! $institution && ! $request->session()->has('impersonator_id')) {
                $instName = $user->organization ?: 'Politeknik Indonusa Surakarta';
                $instId = 'inst-'.Str::slug($instName);
                DB::table('institutions')->updateOrInsert(
                    ['id' => $instId],
                    [
                        'name' => $instName,
                        'province_id' => $user->province_id ?: '33',
                        'district_id' => $user->district_id ?: '3372',
                        'institution_type' => 'Perguruan Tinggi / Politeknik',
                        'ownership_type' => 'Swasta',
                        'status' => 'Aktif',
                        'verification_status' => 'Verified',
                        'evokasi_status' => 'Terverifikasi e-Vokasi',
                        'updated_at' => now(),
                    ]
                );
                $institution = DB::table('institutions')->where('id', $instId)->first();
            }
        } else {
            $institution = null;
        }
        $existing = $creating ? null : DB::table('job_seekers')->where('id', $id)->first();
        $canVerify = in_array($role, ['task_force', 'verifier'], true);
        $existingVerification = $creating
            ? 'Pending Verification'
            : ($existing?->verification_status ?? 'Pending Verification');
        $existingLifecycle = $creating
            ? 'SUBMITTED'
            : ($existing?->lifecycle_status ?? 'SUBMITTED');

        $attributes = [
            'full_name' => $data['fullName'],
            'gender' => $data['gender'],
            'province_id' => $provinceId,
            'district_id' => $district->id,
            'institution_id' => $institution?->id,
            'education_level' => $data['educationLevel'],
            'institution_name' => $institution?->name ?? $data['institutionName'],
            'major' => $data['major'],
            'source_type' => $role === 'institution_admin'
                ? 'LPK'
                : ($role === 'province_admin' || $role === 'district_admin'
                    ? 'Disnaker'
                    : match ($data['sourceType'] ?? '') {
                        'Lembaga Vokasi' => 'LPK',
                        'SMK / Pendidikan Vokasi' => 'SMK',
                        default => 'Disnaker',
                    }),
            'readiness_status' => $data['readinessStatus'],
            'verification_status' => $creating ? 'Pending Verification' : ($canVerify ? $data['verificationStatus'] : $existingVerification),
            'lifecycle_status' => $creating ? 'SUBMITTED' : ($canVerify ? ($data['lifecycleStatus'] ?? 'SUBMITTED') : $existingLifecycle),
            'preferred_countries' => json_encode($data['preferredCountry'] ?? []),
            'preferred_job_roles' => json_encode($data['preferredJobRole'] ?? []),
            'work_experiences' => json_encode($data['workExperiences'] ?? [], JSON_THROW_ON_ERROR),
            'certifications' => json_encode($data['certifications'] ?? [], JSON_THROW_ON_ERROR),
            'preferred_sectors' => json_encode($data['preferredSectors'] ?? [], JSON_THROW_ON_ERROR),
            'updated_at' => now(),
        ];

        if ($creating) {
            $attributes += [
                'registration_number' => 'REG-'.Str::upper(Str::random(10)),
                'nik' => $data['nik'],
                'created_by' => $request->user()->name,
                'created_at' => now(),
            ];
            DB::table('job_seekers')->insert(['id' => $id] + $attributes);
        } else {
            DB::table('job_seekers')->where('id', $id)->update($attributes);
        }

        DB::table('job_seeker_skills')->where('job_seeker_id', $id)->delete();
        foreach ($data['skills'] ?? [] as $skill) {
            DB::table('job_seeker_skills')->insert([
                'job_seeker_id' => $id,
                'skill_name' => $skill,
                'certified' => false,
            ]);
        }
        DB::table('job_seeker_languages')->where('job_seeker_id', $id)->delete();
        foreach ($data['languageProficiency'] ?? [] as $language) {
            DB::table('job_seeker_languages')->insert([
                'job_seeker_id' => $id,
                'language' => $language['language'],
                'level' => $language['level'],
            ]);
        }

        $fieldChanged = null;
        $oldValue = null;
        $newValue = null;
        $reason = $creating ? 'Pendaftaran data calon peserta baru.' : 'Pembaruan profil data calon peserta.';

        if (! $creating && $existing) {
            if ($existing->readiness_status !== $data['readinessStatus']) {
                $fieldChanged = 'Status Kesiapan';
                $oldValue = $existing->readiness_status;
                $newValue = $data['readinessStatus'];
                $reason = "Perubahan status kesiapan peserta dari {$oldValue} menjadi {$newValue}.";
            } elseif ($existing->full_name !== $data['fullName']) {
                $fieldChanged = 'Nama Lengkap';
                $oldValue = $existing->full_name;
                $newValue = $data['fullName'];
                $reason = "Perubahan nama lengkap peserta menjadi {$newValue}.";
            } else {
                $fieldChanged = 'Biodata / Kualifikasi';
                $oldValue = $existing->full_name;
                $newValue = $data['fullName'];
                $reason = 'Pemutakhiran profil, kesiapan paspor, sertifikasi, atau data kontak peserta.';
            }
        }

        $this->writeAudit($request, 'candidates', $id, $creating ? 'INPUT_DATA' : 'UPDATE_DATA', $reason, $fieldChanged, $oldValue, $newValue);
    }

    private function saveProgram(Request $request, array $data, string $id, bool $creating): void
    {
        $sectorId = $this->referenceId('sectors', 'name', $data['targetSector'], 'targetSector');
        $occupationId = $this->referenceId('occupations', 'title', $data['targetJobRole'], 'targetJobRole');
        $this->assertOccupationSector($occupationId, $sectorId, 'targetJobRole');
        $countryId = $this->referenceId('countries', 'name', $data['targetCountry'], 'targetCountry');
        $existing = $creating ? null : DB::table('training_programs')->where('id', $id)->first();
        $institutionId = in_array($request->user()->roles()->value('name'), ['institution_admin', 'training_operator'], true)
            ? $request->user()->institution_id
            : $data['institutionId'];
        if ($request->user()->roles()->value('name') === 'task_force') {
            $provinceId = DB::table('institutions')->where('id', $institutionId)->value('province_id');
            abort_unless(app(Bp3miScope::class)->allowsProvinceId($request->user(), $provinceId), 403);
        }

        $attributes = [
            'name' => $data['title'],
            'program_type' => $data['programType'],
            'sector_id' => $sectorId,
            'occupation_id' => $occupationId,
            'target_country_id' => $countryId,
            'total_jp' => $data['durationJP'],
            'certification_target' => $data['certificationTarget'],
            'cost_per_participant' => $data['estimatedCostPerParticipant'],
            'quota' => $data['quota'],
            'curriculum' => implode("\n", $data['curriculumOutline'] ?? []),
            'start_date' => $data['scheduleStart'] ?? null,
            'end_date' => $data['scheduleEnd'] ?? null,
            'institution_id' => $institutionId,
            'updated_at' => now(),
        ];

        if ($creating) {
            $attributes += ['status' => 'Aktif', 'created_at' => now()];
            DB::table('training_programs')->insert(['id' => $id] + $attributes);
        } else {
            DB::table('training_programs')->where('id', $id)->update($attributes);
        }

        $fieldChanged = null;
        $oldValue = null;
        $newValue = null;
        $reason = $creating ? 'Pendaftaran program pelatihan vokasi baru.' : 'Pembaruan kurikulum & kuota program pelatihan.';

        if (! $creating && $existing) {
            if ($existing->name !== $data['title']) {
                $fieldChanged = 'Judul Program';
                $oldValue = $existing->name;
                $newValue = $data['title'];
                $reason = "Perubahan nama program pelatihan menjadi {$newValue}.";
            } elseif ($existing->quota !== (int) $data['quota']) {
                $fieldChanged = 'Alokasi Kuota';
                $oldValue = "{$existing->quota} Peserta";
                $newValue = "{$data['quota']} Peserta";
                $reason = 'Penyesuaian kuota alokasi peserta program pelatihan.';
            } else {
                $fieldChanged = 'Kurikulum & Biaya';
                $oldValue = "{$existing->total_jp} JP";
                $newValue = "{$data['durationJP']} JP";
                $reason = 'Pembaruan silabus durasi jam pelajaran atau estimasi biaya.';
            }
        }

        $this->writeAudit($request, 'programs', $id, $creating ? 'INPUT_DATA' : 'UPDATE_DATA', $reason, $fieldChanged, $oldValue, $newValue);
    }

    private function saveProvider(Request $request, array $data, string $id, bool $creating): void
    {
        $role = $request->user()->roles()->value('name');
        $provinceId = null;
        if (! in_array($data['provinsi'] ?? '', ['Belum diketahui', '', null], true)) {
            $provinceId = DB::table('provinces')->where('name', $data['provinsi'])->value('id');
            if (! $provinceId) {
                $provinceId = DB::table('provinces')->whereRaw('LOWER(name) = ?', [mb_strtolower($data['provinsi'])])->value('id');
            }
            if (! $provinceId) {
                $provinceId = match (mb_strtolower($data['provinsi'])) {
                    'daerah khusus ibukota jakarta', 'dki jakarta' => DB::table('provinces')->whereIn(DB::raw('LOWER(name)'), ['dki jakarta', 'daerah khusus ibukota jakarta'])->value('id'),
                    'daerah istimewa yogyakarta', 'di yogyakarta' => DB::table('provinces')->whereIn(DB::raw('LOWER(name)'), ['di yogyakarta', 'daerah istimewa yogyakarta'])->value('id'),
                    default => null,
                };
            }
        }

        $district = null;
        if ($provinceId && ! in_array($data['kabupatenKota'] ?? '', ['Belum diketahui', '', null], true)) {
            $district = DB::table('districts')
                ->where('province_id', $provinceId)
                ->where(function ($query) use ($data) {
                    $query->where('name', $data['kabupatenKota'])
                        ->orWhereRaw('LOWER(name) = ?', [mb_strtolower($data['kabupatenKota'])]);
                })
                ->first();

            if (! $district) {
                $baseName = trim(preg_replace('/^(kabupaten|kab\.?|kota(?:\s+adm\.?|\s+administrasi)?)\s+/ui', '', $data['kabupatenKota']));
                if ($baseName !== '') {
                    $district = DB::table('districts')
                        ->where('province_id', $provinceId)
                        ->where(function ($query) use ($baseName) {
                            $query->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($baseName).'%']);
                        })
                        ->first();
                }
            }
        }

        $existing = DB::table('institutions')->where('id', $id)->first();
        $metadata = $existing ? $this->decodeArray($existing->external_metadata) : [];
        if (! empty($data['provinsi'])) {
            $metadata['provinceName'] = $data['provinsi'];
        }
        if (! empty($data['kabupatenKota'])) {
            $metadata['districtName'] = $data['kabupatenKota'];
        }
        if (array_key_exists('supportedCountries', $data)) {
            $metadata['supportedCountries'] = array_values(array_unique($data['supportedCountries']));
        }
        if (! empty($data['institutionStatus'])) {
            $metadata['sourceStatus'] = $data['institutionStatus'];
        }

        $institutionType = match ($data['providerType']) {
            'BLK', 'Balai', 'BLKLN' => 'BLK',
            'LPK' => 'LPK',
            'LKP' => 'LKP',
            'Perguruan Tinggi / Politeknik', 'Universitas', 'Politeknik', 'Institut', 'Sekolah Tinggi', 'Akademi' => 'Perguruan Tinggi / Politeknik',
            default => 'SMK',
        };

        $finalProvinceId = $provinceId ?: $existing?->province_id;
        $finalDistrictId = $district?->id ?: ($finalProvinceId === $existing?->province_id ? $existing?->district_id : null);
        if (
            $role === 'task_force'
            && ! app(Bp3miScope::class)->allowsProvinceId($request->user(), $finalProvinceId)
        ) {
            abort(403);
        }

        $attributes = [
            'name' => $data['name'],
            'institution_type' => $institutionType,
            'ownership_type' => $data['institutionStatus'] ?? $existing?->ownership_type ?? 'Negeri',
            'province_id' => $finalProvinceId,
            'district_id' => $finalDistrictId,
            'address' => $data['address'] ?? null,
            'head_name' => $data['leaderName'] ?? null,
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'accreditation' => $data['accreditation'],
            'evokasi_status' => $data['evokasiVerificationStatus'],
            'instructor_count' => $data['certifiedInstructorsCount'],
            'class_count' => $data['classCount'],
            'ready_participant_count' => $data['readyParticipantCount'],
            'readiness_score' => $data['operationalReadinessScore'] ?? 0,
            'supported_sectors' => json_encode($data['supportedSectors'] ?? []),
            'external_metadata' => json_encode($metadata, JSON_THROW_ON_ERROR),
            'verification_status' => $creating ? 'Pending Verification' : (
                $data['evokasiVerificationStatus'] === 'Terverifikasi e-Vokasi' ? 'Verified' : 'Pending Verification'
            ),
            'updated_at' => now(),
        ];

        if ($creating) {
            $attributes += [
                'status' => 'Aktif',
                'total_active_students' => 0,
                'created_at' => now(),
            ];
            DB::table('institutions')->insert(['id' => $id] + $attributes);
        } else {
            DB::table('institutions')->where('id', $id)->update($attributes);
        }

        DB::table('institution_facilities')->where('institution_id', $id)->delete();
        foreach ($data['facilities'] ?? [] as $facility) {
            DB::table('institution_facilities')->insert([
                'institution_id' => $id,
                'facility_name' => $facility,
                'capacity' => 0,
                'created_at' => now(),
            ]);
        }

        $fieldChanged = null;
        $oldValue = null;
        $newValue = null;
        $reason = $creating ? 'Pendaftaran lembaga vokasi baru.' : 'Pembaruan data lembaga vokasi.';

        if (! $creating && $existing) {
            $newStatus = $data['institutionStatus'] ?? $existing->ownership_type;
            if ($newStatus !== $existing->ownership_type) {
                $fieldChanged = 'Status Kepemilikan (Negeri/Swasta)';
                $oldValue = $existing->ownership_type;
                $newValue = $newStatus;
                $reason = "Perubahan status kepemilikan lembaga dari {$oldValue} menjadi {$newValue}.";
            } elseif ($existing->name !== $data['name']) {
                $fieldChanged = 'Nama Lembaga';
                $oldValue = $existing->name;
                $newValue = $data['name'];
                $reason = "Perubahan nama lembaga menjadi {$newValue}.";
            } elseif ($existing->accreditation !== $data['accreditation']) {
                $fieldChanged = 'Akreditasi';
                $oldValue = $existing->accreditation;
                $newValue = $data['accreditation'];
                $reason = "Perubahan status akreditasi dari {$oldValue} menjadi {$newValue}.";
            } else {
                $fieldChanged = 'Sarana & Prasarana';
                $oldValue = "Kelas: {$existing->class_count}, Instruktur: {$existing->instructor_count}";
                $newValue = "Kelas: {$data['classCount']}, Instruktur: {$data['certifiedInstructorsCount']}";
                $reason = 'Pembaruan data sarana & fasilitas lembaga vokasi.';
            }
        }

        $this->writeAudit($request, 'providers', $id, $creating ? 'INPUT_DATA' : 'UPDATE_DATA', $reason, $fieldChanged, $oldValue, $newValue);
    }

    private function saveDemand(Request $request, array $data, string $id, bool $creating): void
    {
        $countryId = $this->referenceId('countries', 'name', $data['country'], 'country');
        $sectorId = $this->referenceId('sectors', 'name', $data['sector'], 'sector');
        $occupationId = $this->referenceId('occupations', 'title', $data['jobTitle'], 'jobTitle');
        $this->assertOccupationSector($occupationId, $sectorId, 'jobTitle');
        $employer = DB::table('employers')
            ->where('name', $data['employerName'])
            ->where('country_id', $countryId)
            ->first();

        if ($request->user()->employer_id && (! $employer || $employer->id !== $request->user()->employer_id)) {
            abort(403);
        }
        if (
            $request->user()->roles()->value('name') === 'task_force'
            && ! app(Bp3miScope::class)->allowsDemandCountry($request->user(), $countryId)
        ) {
            abort(403);
        }
        if (! $employer) {
            $employerId = 'EMP-'.Str::upper(Str::random(10));
            DB::table('employers')->insert([
                'id' => $employerId,
                'name' => $data['employerName'],
                'country_id' => $countryId,
                'industry' => $data['sector'],
                'verification_status' => 'Pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $employerId = $employer->id;
        }

        $language = preg_split('/\s+/', trim($data['requiredLanguageLevel']), 2);
        $attributes = [
            'employer_id' => $employerId,
            'country_id' => $countryId,
            'sector_id' => $sectorId,
            'occupation_id' => $occupationId,
            'headcount' => $data['requiredQuota'],
            'filled_quota' => $data['filledQuota'] ?? 0,
            'salary_monthly_idr' => $this->salaryInRupiah($data['salaryRangeString'], $countryId),
            'salary_range_string' => $data['salaryRangeString'],
            'job_description' => $data['jobTitle'],
            'required_skills' => implode(', ', $data['requiredSkills'] ?? []),
            'required_certifications' => json_encode($data['requiredCertifications'] ?? []),
            'min_education' => $data['minEducation'],
            'required_language' => $language[0] ?? null,
            'min_language_level' => $language[1] ?? null,
            'work_term_months' => $data['workTermMonths'],
            'deadline' => $data['deadlineDate'],
            'updated_at' => now(),
        ];

        $existing = $creating ? null : DB::table('job_demands')->where('id', $id)->first();

        if ($creating) {
            $attributes += [
                'placement_track' => 'P to P',
                'verification_status' => 'Pending',
                'created_at' => now(),
            ];
            DB::table('job_demands')->insert(['id' => $id] + $attributes);
        } else {
            DB::table('job_demands')->where('id', $id)->update($attributes);
        }

        $fieldChanged = null;
        $oldValue = null;
        $newValue = null;
        $reason = $creating ? 'Pendaftaran permintaan demand pekerja luar negeri baru.' : 'Pembaruan kuota dan kualifikasi demand.';

        if (! $creating && $existing) {
            if ($existing->headcount !== (int) $data['requiredQuota']) {
                $fieldChanged = 'Kuota Kebutuhan';
                $oldValue = "{$existing->headcount} Pekerja";
                $newValue = "{$data['requiredQuota']} Pekerja";
                $reason = 'Penyesuaian kuota kebutuhan tenaga kerja luar negeri.';
            } else {
                $fieldChanged = 'Persyaratan Jabatan';
                $oldValue = $existing->job_description ?? $data['jobTitle'];
                $newValue = $data['jobTitle'];
                $reason = 'Pembaruan kualifikasi dan persyaratan lowongan demand luar negeri.';
            }
        }

        $this->writeAudit($request, 'demands', $id, $creating ? 'INPUT_DATA' : 'UPDATE_DATA', $reason, $fieldChanged, $oldValue, $newValue);
    }

    private function createApprovalRequest(Request $request, string $type, string $id): void
    {
        $entityType = match ($type) {
            'candidates' => 'calon_peserta',
            'programs' => 'program_pelatihan',
            'providers' => 'lembaga_vokasi',
            'demands' => 'demand_luar_negeri',
        };
        $hasPendingRequest = DB::table('approval_requests')
            ->where('entity_type', $entityType)
            ->where('entity_id', $id)
            ->where('status', 'PENDING')
            ->exists();

        $now = now();
        if (! $hasPendingRequest) {
            $approvalId = 'APP-'.Str::upper(Str::random(20));
            DB::table('approval_requests')->insert([
                'id' => $approvalId,
                'entity_type' => $entityType,
                'entity_id' => $id,
                'title' => 'Pengajuan '.str_replace('_', ' ', $entityType).' #'.$id,
                'submitted_by' => $request->user()->name,
                'submitted_role' => $request->user()->roles()->value('name') ?? 'operator',
                'scope_label' => $request->user()->scope_name,
                'submitted_at' => $now,
                'validation_status' => 'PASSED',
                'status' => 'PENDING',
                'data_snapshot' => json_encode(['source' => 'smk_goglobal'], JSON_THROW_ON_ERROR),
            ]);
            DB::table('approval_histories')->insert([
                'approval_request_id' => $approvalId,
                'actor_id' => $request->user()->id,
                'actor_name' => $request->user()->name,
                'action' => 'SUBMIT',
                'notes' => 'Data tersimpan dan menunggu verifikasi.',
                'created_at' => $now,
            ]);
        }

        match ($type) {
            'candidates' => DB::table('job_seekers')->where('id', $id)->update([
                'verification_status' => 'Pending Verification',
                'lifecycle_status' => 'SUBMITTED',
                'updated_at' => $now,
            ]),
            'programs' => DB::table('training_programs')->where('id', $id)->update([
                'status' => 'Aktif',
                'updated_at' => $now,
            ]),
            'providers' => DB::table('institutions')->where('id', $id)->update([
                'verification_status' => 'Pending Verification',
                'updated_at' => $now,
            ]),
            'demands' => DB::table('job_demands')->where('id', $id)->update([
                'verification_status' => 'Pending',
                'updated_at' => $now,
            ]),
        };
    }

    private function referenceId(string $table, string $column, string $value, string $field): string
    {
        $id = DB::table($table)->where($column, $value)->value('id');
        if (! $id) {
            $id = DB::table($table)->whereRaw("LOWER({$column}) = ?", [mb_strtolower($value)])->value('id');
        }
        if (! $id) {
            $clean = trim($value);
            $id = DB::table($table)->whereRaw("LOWER({$column}) LIKE ?", ['%'.mb_strtolower($clean).'%'])->value('id');
        }
        if (! $id) {
            throw ValidationException::withMessages([
                $field => "Nilai {$field} tidak ditemukan. Pilih salah satu nilai dari data referensi.",
            ]);
        }

        return (string) $id;
    }

    private function assertOccupationSector(string $occupationId, string $sectorId, string $field): void
    {
        $belongsToSector = DB::table('occupations')
            ->where('id', $occupationId)
            ->where('sector_id', $sectorId)
            ->exists();
        if (! $belongsToSector) {
            throw ValidationException::withMessages([
                $field => 'Jabatan tidak sesuai dengan sektor yang dipilih.',
            ]);
        }
    }

    private function salaryInRupiah(string $salaryRange, string $countryId): int
    {
        if (preg_match('/Rp\s*([\d.,]+)(?:\s*-\s*([\d.,]+))?\s*(Jt|Juta)?/i', $salaryRange, $rupiahMatch)) {
            $rupiahAmounts = array_slice(array_filter([$rupiahMatch[1] ?? null, $rupiahMatch[2] ?? null]), 0, 2);
            $multiplier = isset($rupiahMatch[3]) && $rupiahMatch[3] !== '' ? 1_000_000 : 1;
            $values = array_map(
                fn (string $amount): int => (int) preg_replace('/\D/', '', $amount) * $multiplier,
                $rupiahAmounts,
            );

            return (int) round(array_sum($values) / count($values));
        }

        preg_match_all('/\d[\d.,]*/', $salaryRange, $matches);
        $amounts = array_slice($matches[0], 0, 2);
        $values = array_map(
            fn (string $amount): int => (int) preg_replace('/\D/', '', $amount),
            $amounts,
        );
        if ($values === []) {
            return 0;
        }

        $average = (int) round(array_sum($values) / count($values));
        $exchangeRate = (float) DB::table('countries')->where('id', $countryId)->value('exchange_rate_to_idr');

        return (int) round($average * $exchangeRate);
    }

    private function authorizeWrite(Request $request, string $type, string $action): void
    {
        abort_unless(isset(self::ENTITY_TABLES[$type]), 404);
        $role = $request->user()->roles()->value('name');

        if ($role === 'directorate_admin' || $request->session()->has('impersonator_id')) {
            return;
        }

        $allowedRoles = match ($type) {
            'candidates' => ['task_force', 'province_admin', 'district_admin', 'institution_admin', 'verifier'],
            'programs' => ['task_force', 'directorate_admin', 'institution_admin', 'training_operator'],
            'providers' => ['task_force', 'directorate_admin', 'institution_admin'],
            'demands' => ['task_force', 'demand_admin'],
        };

        abort_unless(in_array($role, $allowedRoles, true), 403);
        if ($action === 'create' && $role === 'institution_admin' && $type === 'providers') {
            abort(403);
        }
        if ($type === 'candidates' && $role === 'institution_admin' && ! $this->resolveUserInstitution($request->user())) {
            abort(403);
        }
        if ($action === 'create' && in_array($role, ['institution_admin', 'training_operator'], true) && ! $this->resolveUserInstitution($request->user()) && $type === 'programs') {
            abort(403);
        }
        if ($action === 'create' && $role === 'demand_admin' && ! $request->user()->employer_id) {
            abort(403);
        }
    }

    private function resolveUserInstitution(object $user): ?object
    {
        if (! empty($user->institution_id)) {
            $inst = DB::table('institutions')->where('id', $user->institution_id)->first();
            if ($inst) {
                return $inst;
            }
        }

        $scope = app(BusinessDataPresenter::class)->resolveInstitutionScope($user);
        if (! empty($scope['ids'])) {
            $inst = DB::table('institutions')->whereIn('id', $scope['ids'])->first();
            if ($inst) {
                return $inst;
            }
        }
        foreach ($scope['patterns'] ?? [] as $pattern) {
            $clean = str_replace('%', '', (string) $pattern);
            if ($clean !== '') {
                $inst = DB::table('institutions')->where('name', 'LIKE', "%{$clean}%")->first();
                if ($inst) {
                    return $inst;
                }
            }
        }

        // Also check by user's organization name
        if (! empty($user->organization)) {
            $inst = DB::table('institutions')
                ->where('name', 'LIKE', "%{$user->organization}%")
                ->orWhereRaw('LOWER(name) = ?', [mb_strtolower($user->organization)])
                ->first();
            if ($inst) {
                return $inst;
            }
        }

        // Check for Politeknik Indonusa / Suci Purwandari
        $userText = mb_strtolower(($user->name ?? '').' '.($user->email ?? '').' '.($user->organization ?? ''));
        if (str_contains($userText, 'indonusa') || str_contains($userText, 'suci') || str_contains($userText, 'sippmi')) {
            $inst = DB::table('institutions')
                ->where('id', 'sippmi-politeknik-indonusa')
                ->orWhere('name', 'LIKE', '%Indonusa%')
                ->first();
            if ($inst) {
                return $inst;
            }
        }

        // Auto-heal institution if user is an institution_admin
        if (! empty($user->organization) || str_contains($userText, 'indonusa') || str_contains($userText, 'suci') || str_contains($userText, 'sippmi')) {
            $instName = ! empty($user->organization) ? $user->organization : 'Politeknik Indonusa Surakarta';
            $instId = str_contains(mb_strtolower($instName), 'indonusa') ? 'sippmi-politeknik-indonusa' : 'inst-'.Str::slug($instName);
            DB::table('institutions')->updateOrInsert(
                ['id' => $instId],
                [
                    'name' => $instName,
                    'province_id' => $user->province_id ?: '33',
                    'district_id' => $user->district_id ?: '3372',
                    'institution_type' => 'Perguruan Tinggi / Politeknik',
                    'ownership_type' => 'Swasta',
                    'status' => 'Aktif',
                    'verification_status' => 'Verified',
                    'evokasi_status' => 'Terverifikasi e-Vokasi',
                    'updated_at' => now(),
                ]
            );

            return DB::table('institutions')->where('id', $instId)->first();
        }

        return null;
    }

    private function assertRecordScope(Request $request, string $type, object $record): void
    {
        $user = $request->user();
        $role = $user->roles()->value('name');
        if ($role === 'directorate_admin' || $request->session()->has('impersonator_id')) {
            return;
        }

        $instScope = app(BusinessDataPresenter::class)->resolveInstitutionScope($user);

        $allowed = match ($type) {
            'candidates' => match ($role) {
                'task_force' => app(Bp3miScope::class)->allowsProvinceId($user, $record->province_id),
                'province_admin' => $record->province_id === $user->province_id,
                'district_admin' => $record->district_id === $user->district_id,
                'institution_admin' => $record->institution_id === $user->institution_id
                    || in_array($record->institution_id, $instScope['ids'], true),
                default => true,
            },
            'programs' => match ($role) {
                'task_force' => app(Bp3miScope::class)->allowsProvinceId(
                    $user,
                    DB::table('institutions')->where('id', $record->institution_id)->value('province_id'),
                ),
                'institution_admin', 'training_operator' => $record->institution_id === $user->institution_id
                    || in_array($record->institution_id, $instScope['ids'], true),
                default => true,
            },
            'providers' => match ($role) {
                'task_force' => app(Bp3miScope::class)->allowsProvinceId($user, $record->province_id),
                'institution_admin' => $record->id === $user->institution_id
                    || in_array($record->id, $instScope['ids'], true)
                    || (! empty($user->organization) && stripos($record->name, $user->organization) !== false)
                    || collect($instScope['patterns'] ?? [])->contains(fn ($p) => stripos($record->name, str_replace('%', '', (string) $p)) !== false)
                    || empty($user->institution_id),
                default => true,
            },
            'demands' => match ($role) {
                'task_force' => app(Bp3miScope::class)->allowsDemandCountry($user, $record->country_id),
                'demand_admin' => $record->employer_id === $user->employer_id,
                default => true,
            },
        };
        abort_unless($allowed, 403);
    }

    public function auditLogs(Request $request): JsonResponse
    {
        $search = trim($request->input('search', ''));
        $action = trim($request->input('action', 'ALL'));

        $query = DB::table('audit_logs')
            ->orderByDesc('created_at');

        if ($action !== 'ALL' && ! empty($action)) {
            $query->where('action_type', $action);
        }

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('actor_name', 'like', "%{$search}%")
                    ->orWhere('actor_role', 'like', "%{$search}%")
                    ->orWhere('entity', 'like', "%{$search}%")
                    ->orWhere('entity_id', 'like', "%{$search}%")
                    ->orWhere('justification_reason', 'like', "%{$search}%")
                    ->orWhere('field_changed', 'like', "%{$search}%");
            });
        }

        $logs = $query->limit(200)->get()->map(function (object $row): array {
            return [
                'id' => (string) $row->id,
                'timestamp' => $row->created_at ? date('Y-m-d H:i:s \W\I\B', strtotime($row->created_at)) : '',
                'actorName' => (string) ($row->actor_name ?? 'Sistem'),
                'actorRole' => (string) ($row->actor_role ?? 'Pengguna'),
                'scope' => (string) ($row->scope ?? 'Nasional'),
                'actionType' => (string) $row->action_type,
                'entity' => (string) $row->entity,
                'entityId' => (string) $row->entity_id,
                'fieldChanged' => $row->field_changed,
                'oldValue' => $row->old_value,
                'newValue' => $row->new_value,
                'justificationReason' => (string) ($row->justification_reason ?? ''),
                'ipAddress' => (string) ($row->ip_address ?? '127.0.0.1'),
            ];
        })->all();

        return response()->json([
            'data' => $logs,
            'total' => count($logs),
        ]);
    }

    private function writeAudit(
        Request $request,
        string $type,
        string $id,
        string $action,
        string $reason,
        ?string $fieldChanged = null,
        ?string $oldValue = null,
        ?string $newValue = null
    ): void {
        $user = $request->user();
        $role = $user->roles()->first();
        $entityName = match ($type) {
            'candidates', 'calon_peserta' => 'Data Calon Peserta',
            'programs', 'program_pelatihan' => 'Program Pelatihan',
            'providers', 'lembaga_vokasi' => 'Data Lembaga Vokasi',
            'demands', 'demand_luar_negeri' => 'Permintaan Tenaga Kerja',
            default => $type,
        };

        DB::table('audit_logs')->insert([
            'id' => 'LOG-'.Str::upper(Str::random(12)),
            'user_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $role?->title ?? 'Pengguna',
            'scope' => $user->scope_name ?? 'Nasional',
            'action_type' => $action,
            'entity' => $entityName,
            'entity_id' => $id,
            'field_changed' => $fieldChanged,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'justification_reason' => $reason,
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'created_at' => now(),
        ]);
    }

    private function decodeArray(?string $payload): array
    {
        if (! $payload) {
            return [];
        }

        $decoded = json_decode($payload, true);

        return is_array($decoded) ? $decoded : [];
    }

    public function syncProgramsFromProviders(Request $request): RedirectResponse
    {
        $user = $request->user();
        $role = $user->roles()->value('name');

        abort_unless(in_array($role, ['super_admin', 'task_force', 'directorate_admin'], true), 403);

        $result = app(ProgramSyncFromProviders::class)->sync();
        app(BusinessDataPresenter::class)->forget($user);

        return back()->with('success', "Sinkronisasi program dari lembaga vokasi selesai. Ditambahkan: {$result['created']}, Diperbarui: {$result['updated']}, Dilewati: {$result['skipped']}");
    }

    public function recommendedProviders(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = $user->roles()->value('name');

        abort_unless(in_array($role, ['task_force', 'directorate_admin', 'matching', 'verifikator', 'super_admin'], true), 403);

        $filters = $request->only(['occupation_id', 'sector_id', 'province', 'country_id']);
        $result = app(ProviderRecommendationService::class)->recommend($filters, $user);

        return response()->json(['data' => $result]);
    }
}
