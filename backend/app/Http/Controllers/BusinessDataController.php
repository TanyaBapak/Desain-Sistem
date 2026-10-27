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
            ->when($role === 'institution_admin', fn ($q) => $q->where('institutions.id', $user->institution_id ?? ''));

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
                'institutionStatus' => $metadata['sourceStatus'] ?? $row->ownership_type,
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
        if ($type === 'candidates' && $id && preg_match('/[•*]/u', (string) $request->input('nik'))) {
            $request->merge(['nik' => DB::table('job_seekers')->where('id', $id)->value('nik')]);
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
                'workExperiences.*.sector' => ['required', 'string', 'max:150'],
                'workExperiences.*.role' => ['required', 'string', 'max:150'],
                'workExperiences.*.durationYears' => ['required', 'numeric', 'min:0', 'max:100'],
                'workExperiences.*.companyName' => ['nullable', 'string', 'max:150'],
                'workExperiences.*.description' => ['nullable', 'string', 'max:2000'],
                'certifications' => ['array'],
                'certifications.*.name' => ['required', 'string', 'max:150'],
                'certifications.*.issuer' => ['required', 'string', 'max:150'],
                'certifications.*.issueYear' => ['nullable', 'integer', 'min:1900', 'max:'.now()->year],
                'certifications.*.validUntil' => ['nullable', 'date'],
                'preferredSectors' => ['array'],
                'preferredSectors.*' => ['string', 'max:150'],
                'languageProficiency' => ['array'],
                'languageProficiency.*.language' => ['required', 'string', 'max:50'],
                'languageProficiency.*.level' => ['required', 'string', 'max:50'],
                'preferredCountry' => ['array'],
                'preferredCountry.*' => ['string', 'max:100'],
                'preferredJobRole' => ['array'],
                'preferredJobRole.*' => ['string', 'max:150'],
                'readinessStatus' => ['required', Rule::in(['Ready for Placement', 'Needs Upskilling', 'Needs Reskilling'])],
                'verificationStatus' => ['required', Rule::in(['Verified', 'Pending Verification', 'Unverified'])],
                'lifecycleStatus' => ['nullable', Rule::in(['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED'])],
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
                'accreditation' => ['required', 'string', 'max:20'],
                'classCount' => ['required', 'integer', 'min:0', 'max:100000'],
                'readyParticipantCount' => ['required', 'integer', 'min:0', 'max:100000'],
                'certifiedInstructorsCount' => ['required', 'integer', 'min:0', 'max:100000'],
                'operationalReadinessScore' => ['required', 'integer', 'min:0', 'max:100'],
                'facilities' => ['array'],
                'facilities.*' => ['string', 'max:150'],
                'supportedSectors' => ['array'],
                'supportedSectors.*' => ['string', 'max:150'],
                'supportedCountries' => ['sometimes', 'array'],
                'supportedCountries.*' => ['required', 'string', 'exists:countries,id'],
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

    private function saveCandidate(Request $request, array $data, string $id, bool $creating): void
    {
        $user = $request->user();
        $role = $user->roles()->value('name');
        $provinceId = $this->referenceId('provinces', 'name', $data['provinsi'], 'provinsi');
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
        if (! $district) {
            abort(422, 'Kabupaten/kota tidak sesuai dengan provinsi yang dipilih.');
        }

        if ($role === 'province_admin' && $provinceId !== $user->province_id) {
            abort(403);
        }
        if ($role === 'district_admin' && $district->id !== $user->district_id) {
            abort(403);
        }
        if ($role === 'task_force' && ! app(Bp3miScope::class)->allowsProvinceId($user, $provinceId)) {
            abort(403);
        }
        if ($role === 'institution_admin' && ! $user->institution_id) {
            abort(403);
        }

        $institution = $role === 'institution_admin'
            ? DB::table('institutions')->where('id', $user->institution_id)->first()
            : null;
        abort_if($role === 'institution_admin' && ! $institution, 403);
        $canVerify = in_array($role, ['task_force', 'verifier'], true);
        $existingVerification = $creating
            ? 'Pending Verification'
            : DB::table('job_seekers')->where('id', $id)->value('verification_status');
        $existingLifecycle = $creating
            ? 'SUBMITTED'
            : DB::table('job_seekers')->where('id', $id)->value('lifecycle_status');

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

        $this->writeAudit($request, 'candidates', $id, $creating ? 'INPUT_DATA' : 'UPDATE_DATA', 'Data pencari kerja disimpan.');
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

        $this->writeAudit($request, 'programs', $id, $creating ? 'INPUT_DATA' : 'UPDATE_DATA', 'Program pelatihan disimpan.');
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
            'ownership_type' => $data['institutionStatus'] ?? 'Negeri',
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

        $this->writeAudit($request, 'providers', $id, $creating ? 'INPUT_DATA' : 'UPDATE_DATA', 'Data lembaga vokasi disimpan.');
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

        $this->writeAudit($request, 'demands', $id, $creating ? 'INPUT_DATA' : 'UPDATE_DATA', 'Permintaan tenaga kerja disimpan.');
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
        if ($type === 'candidates' && $role === 'institution_admin' && ! $request->user()->institution_id) {
            abort(403);
        }
        if ($action === 'create' && in_array($role, ['institution_admin', 'training_operator'], true) && ! $request->user()->institution_id && $type === 'programs') {
            abort(403);
        }
        if ($action === 'create' && $role === 'demand_admin' && ! $request->user()->employer_id) {
            abort(403);
        }
    }

    private function assertRecordScope(Request $request, string $type, object $record): void
    {
        $user = $request->user();
        $role = $user->roles()->value('name');
        if ($role === 'directorate_admin') {
            return;
        }

        $allowed = match ($type) {
            'candidates' => match ($role) {
                'task_force' => app(Bp3miScope::class)->allowsProvinceId($user, $record->province_id),
                'province_admin' => $record->province_id === $user->province_id,
                'district_admin' => $record->district_id === $user->district_id,
                'institution_admin' => $record->institution_id === $user->institution_id,
                default => true,
            },
            'programs' => match ($role) {
                'task_force' => app(Bp3miScope::class)->allowsProvinceId(
                    $user,
                    DB::table('institutions')->where('id', $record->institution_id)->value('province_id'),
                ),
                'institution_admin', 'training_operator' => $record->institution_id === $user->institution_id,
                default => true,
            },
            'providers' => match ($role) {
                'task_force' => app(Bp3miScope::class)->allowsProvinceId($user, $record->province_id),
                'institution_admin' => $record->id === $user->institution_id,
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

    private function writeAudit(Request $request, string $type, string $id, string $action, string $reason): void
    {
        $user = $request->user();
        $role = $user->roles()->first();
        DB::table('audit_logs')->insert([
            'id' => 'LOG-'.Str::upper(Str::random(12)),
            'user_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $role?->title ?? 'Pengguna',
            'scope' => $user->scope_name,
            'action_type' => $action,
            'entity' => $type,
            'entity_id' => $id,
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
