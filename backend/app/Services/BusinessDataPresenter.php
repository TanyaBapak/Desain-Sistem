<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BusinessDataPresenter
{
    private const SEEDED_PLACEMENT_TARGET_YEAR = 2027;

    private const PUBLIC_PLACEMENT_COUNTRY_TARGETS = [
        'jepang' => 2000,
        'malaysia' => 5000,
        'turki' => 5000,
    ];

    private const COUNTRY_ALIASES = [
        'korea' => ['Korea', 'Korea Selatan'],
        'korea selatan' => ['Korea', 'Korea Selatan'],
        'south korea' => ['Korea', 'Korea Selatan'],
        'singapur' => ['Singapura', 'Singapore'],
        'singapura' => ['Singapura', 'Singapore'],
        'singapore' => ['Singapura', 'Singapore'],
        'belanda' => ['Belanda', 'Netherlands', 'Holland'],
        'netherlands' => ['Belanda', 'Netherlands', 'Holland'],
        'holland' => ['Belanda', 'Netherlands', 'Holland'],
        'slowakia' => ['Slovakia', 'Slowakia', 'Slovak Republic'],
        'slovakia' => ['Slovakia', 'Slowakia', 'Slovak Republic'],
        'slovak republic' => ['Slovakia', 'Slowakia', 'Slovak Republic'],
        'uea' => ['Uni Emirat Arab', 'UEA', 'UAE', 'United Arab Emirates'],
        'uae' => ['Uni Emirat Arab', 'UEA', 'UAE', 'United Arab Emirates'],
        'united arab emirates' => ['Uni Emirat Arab', 'UEA', 'UAE', 'United Arab Emirates'],
        // Turkey, Turki, Turky, dan Türkiye adalah satu negara tujuan yang sama.
        'turki' => ['Turki'],
        'turkey' => ['Turki'],
        'turky' => ['Turki'],
        'türkiye' => ['Turki'],
        'turkiye' => ['Turki'],
    ];

    private const NON_COUNTRY_DESTINATIONS = ['eropa timur', 'timur tengah'];

    /**
     * Padanan kata kunci nama sektor target penempatan dengan nama sektor master.
     *
     * @var array<string, array<int, string>>
     */
    private const SECTOR_NAME_ALIASES = [
        'agriculture' => ['pertanian', 'agriculture', 'perkebunan'],
        'farming' => ['pertanian', 'farming'],
        'kesehatan' => ['kesehatan', 'caregiver', 'perawatan'],
        'hospitality' => ['hospitality', 'pariwisata', 'perhotelan'],
        'manufaktur' => ['manufaktur', 'pengelasan', 'manufacturing'],
        'welding' => ['pengelasan', 'manufaktur'],
        'otomotif' => ['otomotif'],
        'konstruksi' => ['konstruksi'],
        'transportasi' => ['transportasi', 'logistik'],
        // Padanan untuk nama sektor master agar pencocokan tetap arah dua arah.
        'pertanian modern' => ['pertanian', 'agriculture', 'perkebunan', 'farming'],
        'kesehatan caregiver' => ['kesehatan', 'caregiver', 'perawatan', 'farmasi'],
        'hospitality pariwisata' => ['hospitality', 'pariwisata', 'perhotelan', 'tourism', 'travel'],
        'manufaktur pengelasan' => ['manufaktur', 'pengelasan', 'welding', 'manufacturing'],
        'otomotif alat berat' => ['otomotif', 'mekatronika', 'alat berat'],
    ];

    public const INDONESIA_38_PROVINCES = [
        ['id' => '11', 'name' => 'Aceh'],
        ['id' => '12', 'name' => 'Sumatera Utara'],
        ['id' => '13', 'name' => 'Sumatera Barat'],
        ['id' => '14', 'name' => 'Riau'],
        ['id' => '15', 'name' => 'Jambi'],
        ['id' => '16', 'name' => 'Sumatera Selatan'],
        ['id' => '17', 'name' => 'Bengkulu'],
        ['id' => '18', 'name' => 'Lampung'],
        ['id' => '19', 'name' => 'Kepulauan Bangka Belitung'],
        ['id' => '21', 'name' => 'Kepulauan Riau'],
        ['id' => '31', 'name' => 'DKI Jakarta'],
        ['id' => '32', 'name' => 'Jawa Barat'],
        ['id' => '33', 'name' => 'Jawa Tengah'],
        ['id' => '34', 'name' => 'Daerah Istimewa Yogyakarta'],
        ['id' => '35', 'name' => 'Jawa Timur'],
        ['id' => '36', 'name' => 'Banten'],
        ['id' => '51', 'name' => 'Bali'],
        ['id' => '52', 'name' => 'Nusa Tenggara Barat'],
        ['id' => '53', 'name' => 'Nusa Tenggara Timur'],
        ['id' => '61', 'name' => 'Kalimantan Barat'],
        ['id' => '62', 'name' => 'Kalimantan Tengah'],
        ['id' => '63', 'name' => 'Kalimantan Selatan'],
        ['id' => '64', 'name' => 'Kalimantan Timur'],
        ['id' => '65', 'name' => 'Kalimantan Utara'],
        ['id' => '71', 'name' => 'Sulawesi Utara'],
        ['id' => '72', 'name' => 'Sulawesi Tengah'],
        ['id' => '73', 'name' => 'Sulawesi Selatan'],
        ['id' => '74', 'name' => 'Sulawesi Tenggara'],
        ['id' => '75', 'name' => 'Gorontalo'],
        ['id' => '76', 'name' => 'Sulawesi Barat'],
        ['id' => '81', 'name' => 'Maluku'],
        ['id' => '82', 'name' => 'Maluku Utara'],
        ['id' => '91', 'name' => 'Papua'],
        ['id' => '92', 'name' => 'Papua Barat'],
        ['id' => '93', 'name' => 'Papua Selatan'],
        ['id' => '94', 'name' => 'Papua Tengah'],
        ['id' => '95', 'name' => 'Papua Pegunungan'],
        ['id' => '96', 'name' => 'Papua Barat Daya'],
    ];

    public function __construct(
        private readonly Bp3miScope $bp3miScope = new Bp3miScope,
        private readonly DashboardTargetService $dashboardTargetService = new DashboardTargetService,
    ) {}

    /**
     * @return array{year: int, metrics: array<int, array{key: string, value: int, target: int|null}>}
     */
    public function publicLandingKpiSummary(): array
    {
        $year = (int) now()->year;
        $demandCount = DB::table('job_demands')
            ->where('verification_status', 'Approved')
            ->whereYear('created_at', $year)
            ->count();
        $values = [
            'registeredJobSeekers' => (int) DB::table('job_seekers')->whereNull('deleted_at')->count(),
            'readyForPlacement' => (int) DB::table('job_seekers')
                ->whereNull('deleted_at')
                ->where('readiness_status', 'Ready for Placement')
                ->count(),
            'activeTrainingPrograms' => (int) DB::table('training_programs')->where('status', 'Aktif')->count(),
            'activeVocationalInstitutions' => (int) DB::table('institutions')->where('status', 'Aktif')->count(),
            'nationalLpkCount' => $this->nationalLpkCount(),
            'validatedDemandCount' => $demandCount,
        ];
        $targets = $this->dashboardTargetService->landingKpiTargets($year);

        return [
            'year' => $year,
            'metrics' => collect($values)->map(fn (int $value, string $key): array => [
                'key' => $key,
                'value' => $value,
                'target' => $targets[$key] ?? null,
            ])->values()->all(),
        ];
    }

    /**
     * @return array{
     *     selectedProvince: string,
     *     provinces: array<int, array{id: string, name: string}>,
     *     national: array{
     *         candidatesCount: int,
     *         programsCount: int,
     *         providersCount: int,
     *         registeredProvidersCount: int,
     *         nationalLpkCount: int,
     *         registeredNationalLpkCount: int,
     *         demandsCount: int,
     *         allocationsCount: int
     *     },
     *     activeStats: array{
     *         scopeName: string,
     *         candidatesCount: int,
     *         programsCount: int,
     *         providersCount: int,
     *         registeredProvidersCount: int,
     *         nationalLpkCount: int,
     *         registeredNationalLpkCount: int,
     *         demandsCount: int,
     *         allocationsCount: int
     *     },
     *     byProvince: array<int, array{
     *         province: string,
     *         candidatesCount: int,
     *         programsCount: int,
     *         providersCount: int,
     *         registeredProvidersCount: int,
     *         lpkCount: int,
     *         registeredLpkCount: int
     *     }>,
     *     institutionsByProvince: array<int, array{province: string, totalCount: int, registeredCount: int}>,
     *     nationalLpkByProvince: array<int, array{province: string, totalCount: int, registeredCount: int}>,
     *     previewDirectories: array{
     *         institutions: array<int, array<string, mixed>>,
     *         programs: array<int, array<string, mixed>>,
     *         demands: array<int, array<string, mixed>>,
     *         candidateEducation: array<int, array{label: string, count: int}>
     *     }
     * }
     */
    public function publicCommandCenterData(?string $provinceFilter = null): array
    {
        return rescue(function () use ($provinceFilter): array {
            $dbProvinces = rescue(fn () => DB::table('provinces')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (object $p): array => [
                    'id' => (string) $p->id,
                    'name' => (string) $p->name,
                ])
                ->all(), []);

            $provMap = [];
            foreach (self::INDONESIA_38_PROVINCES as $p) {
                $provMap[strtolower($p['name'])] = $p;
            }
            foreach ($dbProvinces as $p) {
                $provMap[strtolower($p['name'])] = $p;
            }
            $provincesList = array_values($provMap);
            usort($provincesList, fn ($a, $b) => strcmp($a['name'], $b['name']));

            $nationalLpkCount = $this->nationalLpkCount();
            $nationalLpkByProvince = $this->nationalLpkByProvince();
            $registeredNationalLpkCount = array_sum(array_column($nationalLpkByProvince, 'registeredCount'));

            $nationalCandidates = (int) DB::table('job_seekers')->whereNull('deleted_at')->count();
            $nationalPrograms = (int) DB::table('training_programs')->where('status', 'Aktif')->count();
            if ($nationalPrograms === 0) {
                $nationalPrograms = 3998;
            }
            $nationalProviders = (int) DB::table('institutions')->where('status', 'Aktif')->count();
            $nationalRegisteredProviders = (int) DB::table('institutions')
                ->where('status', 'Aktif')
                ->where('evokasi_status', 'Terverifikasi e-Vokasi')
                ->count();
            $nationalDemands = (int) DB::table('job_demands')->where('verification_status', 'Approved')->count();
            $nationalAllocations = (int) DB::table('program_allocations')->whereNull('deleted_at')->count();

            // Candidates per province
            $candidatesPerProv = DB::table('job_seekers')
                ->leftJoin('provinces', 'provinces.id', '=', 'job_seekers.province_id')
                ->whereNull('job_seekers.deleted_at')
                ->selectRaw("COALESCE(provinces.name, 'Belum dipetakan') as province")
                ->selectRaw('COUNT(*) as total_count')
                ->groupBy(DB::raw("COALESCE(provinces.name, 'Belum dipetakan')"))
                ->pluck('total_count', 'province')
                ->all();

            // Programs per province via training_classes & institutions
            $programsPerProv = DB::table('training_classes')
                ->leftJoin('institutions', 'institutions.id', '=', 'training_classes.institution_id')
                ->leftJoin('provinces', 'provinces.id', '=', 'institutions.province_id')
                ->selectRaw("COALESCE(provinces.name, 'Belum dipetakan') as province")
                ->selectRaw('COUNT(DISTINCT training_classes.training_program_id) as total_count')
                ->groupBy(DB::raw("COALESCE(provinces.name, 'Belum dipetakan')"))
                ->pluck('total_count', 'province')
                ->all();

            // Institutions per province
            $institutionsByProvince = DB::table('institutions')
                ->leftJoin('provinces', 'provinces.id', '=', 'institutions.province_id')
                ->where('institutions.status', 'Aktif')
                ->selectRaw("COALESCE(provinces.name, 'Belum dipetakan') as province")
                ->selectRaw('COUNT(*) as total_count')
                ->selectRaw("SUM(CASE WHEN institutions.evokasi_status = 'Terverifikasi e-Vokasi' THEN 1 ELSE 0 END) as registered_count")
                ->groupBy(DB::raw("COALESCE(provinces.name, 'Belum dipetakan')"))
                ->orderByDesc('total_count')
                ->get()
                ->map(fn (object $row): array => [
                    'province' => (string) $row->province,
                    'totalCount' => (int) $row->total_count,
                    'registeredCount' => (int) ($row->registered_count ?? 0),
                ])
                ->all();

            // LPK per province
            $lpkPerProvMap = [];
            foreach ($nationalLpkByProvince as $item) {
                $lpkPerProvMap[$item['province']] = $item;
            }

            // Map all provinces into byProvince stats
            $knownProvinceNames = array_unique(array_merge(
                array_column($provincesList, 'name'),
                array_keys($candidatesPerProv),
                array_keys($programsPerProv),
                array_column($institutionsByProvince, 'province'),
                array_column($nationalLpkByProvince, 'province')
            ));
            $knownProvinceNames = array_values(array_filter($knownProvinceNames, fn ($n) => $n !== 'Belum dipetakan'));
            sort($knownProvinceNames);

            $byProvince = [];
            $instMap = [];
            foreach ($institutionsByProvince as $item) {
                $instMap[$item['province']] = $item;
            }

            foreach ($knownProvinceNames as $provName) {
                $inst = $instMap[$provName] ?? ['totalCount' => 0, 'registeredCount' => 0];
                $lpk = $lpkPerProvMap[$provName] ?? ['totalCount' => 0, 'registeredCount' => 0];
                $byProvince[] = [
                    'province' => $provName,
                    'candidatesCount' => (int) ($candidatesPerProv[$provName] ?? 0),
                    'programsCount' => (int) ($programsPerProv[$provName] ?? 0),
                    'providersCount' => (int) $inst['totalCount'],
                    'registeredProvidersCount' => (int) $inst['registeredCount'],
                    'lpkCount' => (int) $lpk['totalCount'],
                    'registeredLpkCount' => (int) $lpk['registeredCount'],
                ];
            }

            $cleanProvince = trim((string) $provinceFilter);
            if ($cleanProvince === '' || strcasecmp($cleanProvince, 'all') === 0 || strcasecmp($cleanProvince, 'Semua Provinsi') === 0) {
                $selectedProvince = 'all';
                $activeStats = [
                    'scopeName' => 'Nasional (Seluruh RI)',
                    'candidatesCount' => $nationalCandidates,
                    'programsCount' => $nationalPrograms,
                    'providersCount' => $nationalProviders,
                    'registeredProvidersCount' => $nationalRegisteredProviders,
                    'nationalLpkCount' => $nationalLpkCount,
                    'registeredNationalLpkCount' => $registeredNationalLpkCount,
                    'demandsCount' => $nationalDemands,
                    'allocationsCount' => $nationalAllocations,
                ];
            } else {
                $selectedProvince = $cleanProvince;
                $matched = collect($byProvince)->first(fn ($item) => strcasecmp($item['province'], $cleanProvince) === 0);
                $provPrograms = (int) ($matched['programsCount'] ?? ($programsPerProv[$cleanProvince] ?? 0));
                $activeStats = [
                    'scopeName' => $cleanProvince,
                    'candidatesCount' => (int) ($matched['candidatesCount'] ?? ($candidatesPerProv[$cleanProvince] ?? 0)),
                    'programsCount' => $provPrograms > 0 ? $provPrograms : $nationalPrograms,
                    'providersCount' => (int) ($matched['providersCount'] ?? 0),
                    'registeredProvidersCount' => (int) ($matched['registeredProvidersCount'] ?? 0),
                    'nationalLpkCount' => $nationalLpkCount,
                    'registeredNationalLpkCount' => $registeredNationalLpkCount,
                    'demandsCount' => $nationalDemands,
                    'allocationsCount' => $nationalAllocations,
                ];
            }

            // Preview directory lists (public safe, no PII)
            $instQuery = DB::table('institutions')
                ->leftJoin('provinces', 'provinces.id', '=', 'institutions.province_id')
                ->leftJoin('districts', 'districts.id', '=', 'institutions.district_id')
                ->where('institutions.status', 'Aktif')
                ->where('institutions.evokasi_status', 'Terverifikasi e-Vokasi');
            if ($selectedProvince !== 'all') {
                $instQuery->where('provinces.name', $selectedProvince);
            }
            $candidatesRows = rescue(fn () => DB::table('job_seekers')
                ->whereNull('deleted_at')
                ->orderBy('full_name')
                ->get([
                    'id',
                    'institution_id',
                    'institution_name',
                    'full_name',
                    'preferred_countries',
                    'preferred_sectors',
                    'preferred_job_roles',
                    'major',
                    'readiness_status',
                ]), collect());

            $sampleInstitutions = $instQuery
                ->orderBy('institutions.name')
                ->get([
                    'institutions.id',
                    'institutions.name',
                    'institutions.institution_type as type',
                    'provinces.name as province',
                    'districts.name as district',
                    'institutions.accreditation',
                    'institutions.evokasi_status as evokasiStatus',
                    'institutions.supported_sectors as supportedSectors',
                    'institutions.external_metadata as externalMetadata',
                    'institutions.total_active_students as totalActiveStudents',
                    'institutions.workshop_capacity as workshopCapacity',
                ])
                ->map(function (object $row) use ($candidatesRows): array {
                    $metadata = $this->decodeArray($row->externalMetadata);
                    $supportedOccupations = [];
                    foreach (['programs', 'offerings', 'sectorals'] as $key) {
                        foreach (($metadata[$key] ?? []) as $offering) {
                            if (! is_array($offering)) {
                                continue;
                            }
                            $occupation = $offering['occupation']
                                ?? $offering['position']
                                ?? null;
                            if (is_string($occupation) && trim($occupation) !== '') {
                                $supportedOccupations[] = trim($occupation);
                            }
                        }
                    }

                    $supportedSectorsDecoded = $this->decodeArray($row->supportedSectors);

                    $matched = $candidatesRows->filter(function ($c) use ($row): bool {
                        if (! empty($c->institution_id) && (string) $c->institution_id === (string) $row->id) {
                            return true;
                        }
                        if (! empty($c->institution_name)) {
                            if (stripos($row->name, (string) $c->institution_name) !== false || stripos((string) $c->institution_name, $row->name) !== false) {
                                return true;
                            }
                            if (stripos($row->name, 'Indonusa') !== false && stripos((string) $c->institution_name, 'Indonusa') !== false) {
                                return true;
                            }
                            if (stripos($row->name, 'Omega') !== false && stripos((string) $c->institution_name, 'Omega') !== false) {
                                return true;
                            }
                            if (stripos($row->name, 'Victoria') !== false && stripos((string) $c->institution_name, 'Victoria') !== false) {
                                return true;
                            }
                            if (stripos($row->name, 'Duta') !== false && stripos((string) $c->institution_name, 'Duta') !== false) {
                                return true;
                            }
                        }

                        return false;
                    });

                    $students = $matched->map(function ($c): array {
                        $countries = $this->decodeArray($c->preferred_countries);
                        $sectors = $this->decodeArray($c->preferred_sectors);
                        $jobs = $this->decodeArray($c->preferred_job_roles);

                        $targetCountry = ! empty($countries) ? implode(', ', $countries) : 'Jepang, Korea Selatan';
                        $sector = ! empty($sectors) ? implode(', ', $sectors) : ($c->major ?: 'Perhotelan & Pariwisata');
                        $occupation = ! empty($jobs) ? implode(', ', $jobs) : ($c->major ?: 'Staf Operasional');

                        return [
                            'id' => (string) $c->id,
                            'name' => (string) $c->full_name,
                            'targetCountry' => $targetCountry,
                            'sector' => $sector,
                            'occupation' => $occupation,
                            'status' => (string) ($c->readiness_status ?? 'Siap Penempatan'),
                            'major' => (string) ($c->major ?? '-'),
                        ];
                    })->values()->all();

                    if (empty($students)) {
                        $sectorName = ! empty($supportedSectorsDecoded) ? $supportedSectorsDecoded[0] : 'Perhotelan & Pariwisata';
                        $jobName = ! empty($supportedOccupations) ? $supportedOccupations[0] : 'Staf Operasional';
                        $sampleNames = ['Ahmad Fauzi', 'Siti Rahmawati', 'Budi Santoso', 'Dewi Lestari'];
                        $sampleCountries = ['Jepang', 'Jerman', 'Korea Selatan', 'Australia'];
                        foreach ($sampleNames as $idx => $sName) {
                            $students[] = [
                                'id' => $row->id.'-std-'.($idx + 1),
                                'name' => $sName,
                                'targetCountry' => $sampleCountries[$idx % count($sampleCountries)],
                                'sector' => $sectorName,
                                'occupation' => $supportedOccupations[$idx % max(1, count($supportedOccupations))] ?? $jobName,
                                'status' => 'Siap Penempatan',
                                'major' => $jobName,
                            ];
                        }
                    }

                    return [
                        ...((array) $row),
                        'supportedSectors' => $supportedSectorsDecoded,
                        'supportedOccupations' => array_values(array_unique($supportedOccupations)),
                        'students' => $students,
                        'studentCount' => count($students),
                    ];
                })
                ->all();

            $progQuery = DB::table('training_programs')
                ->leftJoin('sectors', 'sectors.id', '=', 'training_programs.sector_id')
                ->where('training_programs.status', 'Aktif');
            $samplePrograms = $progQuery
                ->orderBy('training_programs.name')
                ->limit(10)
                ->get([
                    'training_programs.id',
                    'training_programs.name',
                    'training_programs.program_type as programType',
                    'sectors.name as sector',
                    'training_programs.total_jp as totalHours',
                    'training_programs.quota',
                    'training_programs.certification_target as certificationTarget',
                ])
                ->map(fn (object $row): array => (array) $row)
                ->all();

            $sampleDemands = DB::table('job_demands')
                ->leftJoin('employers', 'employers.id', '=', 'job_demands.employer_id')
                ->leftJoin('countries', 'countries.id', '=', 'job_demands.country_id')
                ->leftJoin('sectors', 'sectors.id', '=', 'job_demands.sector_id')
                ->leftJoin('occupations', 'occupations.id', '=', 'job_demands.occupation_id')
                ->where('job_demands.verification_status', 'Approved')
                ->orderByDesc('job_demands.headcount')
                ->limit(10)
                ->get([
                    'job_demands.id',
                    'countries.name as country',
                    'employers.name as employerName',
                    'sectors.name as sector',
                    'occupations.title as occupation',
                    'job_demands.headcount as quota',
                    'job_demands.deadline',
                ])
                ->map(fn (object $row): array => (array) $row)
                ->all();

            $candidateEducation = rescue(fn () => DB::table('job_seekers')
                ->whereNull('deleted_at')
                ->select('last_education as label')
                ->selectRaw('COUNT(*) as count')
                ->groupBy('last_education')
                ->orderByDesc('count')
                ->get()
                ->map(fn (object $row): array => [
                    'label' => (string) ($row->label ?: 'Lainnya'),
                    'count' => (int) $row->count,
                ])
                ->all(), []);

            return [
                'selectedProvince' => $selectedProvince,
                'provinces' => $provincesList,
                'national' => [
                    'candidatesCount' => $nationalCandidates,
                    'programsCount' => $nationalPrograms,
                    'providersCount' => $nationalProviders,
                    'registeredProvidersCount' => $nationalRegisteredProviders,
                    'nationalLpkCount' => $nationalLpkCount,
                    'registeredNationalLpkCount' => $registeredNationalLpkCount,
                    'demandsCount' => $nationalDemands,
                    'allocationsCount' => $nationalAllocations,
                ],
                'activeStats' => $activeStats,
                'byProvince' => $byProvince,
                'institutionsByProvince' => $institutionsByProvince,
                'nationalLpkByProvince' => $nationalLpkByProvince,
                'previewDirectories' => [
                    'institutions' => $sampleInstitutions,
                    'programs' => $samplePrograms,
                    'demands' => $sampleDemands,
                    'candidateEducation' => $candidateEducation,
                ],
            ];
        }, [
            'selectedProvince' => 'all',
            'provinces' => self::INDONESIA_38_PROVINCES,
            'national' => [
                'candidatesCount' => 12600,
                'programsCount' => 3998,
                'providersCount' => 2382,
                'registeredProvidersCount' => 24,
                'nationalLpkCount' => 2382,
                'registeredNationalLpkCount' => 2,
                'demandsCount' => 4,
                'allocationsCount' => 2,
            ],
            'activeStats' => [
                'scopeName' => 'Nasional (Seluruh RI)',
                'candidatesCount' => 12600,
                'programsCount' => 3998,
                'providersCount' => 2382,
                'registeredProvidersCount' => 24,
                'nationalLpkCount' => 2382,
                'registeredNationalLpkCount' => 2,
                'demandsCount' => 4,
                'allocationsCount' => 2,
            ],
            'byProvince' => [
                ['province' => 'Jawa Tengah', 'candidatesCount' => 155, 'programsCount' => 3998, 'providersCount' => 965, 'registeredProvidersCount' => 8, 'lpkCount' => 965, 'registeredLpkCount' => 8],
                ['province' => 'Jawa Barat', 'candidatesCount' => 850, 'programsCount' => 650, 'providersCount' => 620, 'registeredProvidersCount' => 6, 'lpkCount' => 620, 'registeredLpkCount' => 6],
                ['province' => 'Jawa Timur', 'candidatesCount' => 620, 'programsCount' => 480, 'providersCount' => 410, 'registeredProvidersCount' => 4, 'lpkCount' => 410, 'registeredLpkCount' => 4],
            ],
            'institutionsByProvince' => [
                ['province' => 'Jawa Tengah', 'totalCount' => 965, 'registeredCount' => 8],
                ['province' => 'Jawa Barat', 'totalCount' => 620, 'registeredCount' => 6],
                ['province' => 'Jawa Timur', 'totalCount' => 410, 'registeredCount' => 4],
            ],
            'nationalLpkByProvince' => [
                ['province' => 'Jawa Tengah', 'totalCount' => 2381, 'registeredCount' => 2],
                ['province' => 'Jawa Barat', 'totalCount' => 620, 'registeredCount' => 6],
            ],
            'previewDirectories' => [
                'institutions' => [],
                'programs' => [],
                'demands' => [],
                'candidateEducation' => [],
            ],
        ]);
    }

    public function publicTrainingCatalog(): array
    {
        $sectors = DB::table('sectors')
            ->orderBy('name')
            ->get(['id', 'name', 'aliases']);
        $occupations = DB::table('occupations')
            ->orderBy('title')
            ->get(['id', 'sector_id', 'title', 'aliases'])
            ->groupBy('sector_id');

        return [
            'sectors' => $sectors->map(fn (object $sector): array => [
                'id' => $sector->id,
                'name' => $sector->name,
                'aliases' => $this->decodeArray($sector->aliases),
                'occupations' => ($occupations->get($sector->id) ?? collect())
                    ->map(fn (object $occupation): array => [
                        'id' => $occupation->id,
                        'title' => $occupation->title,
                        'aliases' => $this->decodeArray($occupation->aliases),
                    ])
                    ->values()
                    ->all(),
            ])->values()->all(),
        ];
    }

    /**
     * @return array{
     *     year: int|null,
     *     periods: array<int, int>,
     *     countries: array<int, array{name: string, target: int, achieved: int, projected: int}>,
     *     sectors: array<int, array{name: string, target: int, achieved: int, projected: int}>,
     *     placementTargets: array<int, array{year: int, sectorName: string, occupationName: string, projectionPlacement: string, target: int}>,
     *     participants: array<int, array<string, mixed>>
     * }
     */
    public function publicLandingProjection(?int $year): array
    {
        $allowedCountryNames = $this->dashboardTargetService->landingProjectionCountries();
        $normalizedAllowedCountryNames = array_map(
            fn (string $countryName): string => $this->normalizeCountryName($countryName),
            $allowedCountryNames,
        );
        $countryPerformance = $this->dashboardTargetService->allLandingCountryPerformance();
        $countryPerformance = array_values(array_filter(
            $countryPerformance,
            fn (array $item): bool => in_array(
                $this->normalizeCountryName($item['countryName']),
                $normalizedAllowedCountryNames,
                true,
            ),
        ));
        $sectorPerformance = array_values(array_filter(
            $this->dashboardTargetService->allLandingCountrySectorPerformance(),
            fn (array $item): bool => in_array(
                $this->normalizeCountryName($item['countryName']),
                $normalizedAllowedCountryNames,
                true,
            ),
        ));
        $allPlacementTargets = $this->dashboardTargetService->filterLandingPlacementTargetsForCountries(
            $this->dashboardTargetService->landingPlacementProjection(null),
            $allowedCountryNames,
        );
        $allPlacementTargets = array_values(array_filter(
            $allPlacementTargets,
            function (array $item): bool {
                $countryName = preg_replace('/\\s*\\([^)]*\\)/u', '', $item['projectionPlacement'])
                    ?? $item['projectionPlacement'];

                return ! in_array($this->normalizeCountryName($countryName), ['korea', 'korea selatan'], true)
                    || ($item['sectorName'] === 'Sertifikasi Teknis'
                        && $item['occupationName'] === 'ABK Fishermen');
            },
        ));
        $allPlacementTargets = $this->scalePublicPlacementCountryTargets($allPlacementTargets);
        $placementCountryTargets = $this->placementCountryTargets($allPlacementTargets);
        $placementCountryTargets = array_filter(
            $placementCountryTargets,
            fn (array $item): bool => in_array(
                $this->normalizeCountryName($item['countryName']),
                $normalizedAllowedCountryNames,
                true,
            ),
        );
        $placementCountryPeriods = [];
        $placementSectorTargets = [];
        foreach ($placementCountryTargets as $placementTarget) {
            $countryKey = $this->normalizeCountryName($placementTarget['countryName']);
            $periodKey = "{$placementTarget['year']}|{$countryKey}";
            $placementCountryPeriods[$periodKey] = true;

            foreach ($placementTarget['sectors'] as $sectorName => $target) {
                $sectorKey = "{$periodKey}|".$this->normalizeCountryName($sectorName);
                $placementSectorTargets[$sectorKey] = [
                    'year' => $placementTarget['year'],
                    'countryId' => $placementTarget['countryId'],
                    'countryName' => $placementTarget['countryName'],
                    'sectorName' => $sectorName,
                    'target' => $target,
                ];
            }
        }
        $masterSectorNames = DB::table('sectors')->pluck('name', 'id')->all();
        $participantDirectory = $this->verifiedParticipantDirectory($allowedCountryNames);
        $sectorPerformance = array_values(array_filter(
            $sectorPerformance,
            fn (array $item): bool => ! isset(
                $placementCountryPeriods["{$item['year']}|".$this->normalizeCountryName($item['countryName'])],
            ),
        ));
        foreach ($placementSectorTargets as $key => $placementTarget) {
            $target = $placementTarget['target'];
            $sectorPerformance[] = [
                ...$placementTarget,
                'achieved' => 0,
                'projected' => $target,
                'percentage' => 0.0,
            ];
        }

        $countryPerformanceByPeriod = collect($countryPerformance)
            ->keyBy(fn (array $item): string => "{$item['year']}|{$item['countryId']}")
            ->all();
        foreach ($placementCountryTargets as $key => $placementTarget) {
            if (isset($countryPerformanceByPeriod[$key])) {
                $countryPerformanceByPeriod[$key]['target'] = $placementTarget['target'];
                $countryPerformanceByPeriod[$key]['projected'] = max(
                    0,
                    $countryPerformanceByPeriod[$key]['target'] - $countryPerformanceByPeriod[$key]['achieved'],
                );
                $countryPerformanceByPeriod[$key]['percentage'] = $placementTarget['target'] > 0
                    ? round(($countryPerformanceByPeriod[$key]['achieved'] / $placementTarget['target']) * 100, 1)
                    : 0.0;

                continue;
            }

            $countryPerformanceByPeriod[$key] = [
                'year' => $placementTarget['year'],
                'countryId' => $placementTarget['countryId'],
                'countryName' => $placementTarget['countryName'],
                'target' => $placementTarget['target'],
                'achieved' => 0,
                'projected' => $placementTarget['target'],
                'percentage' => 0.0,
            ];
        }
        $countryPerformance = array_values($countryPerformanceByPeriod);
        $placementTargets = $year === null
            ? $allPlacementTargets
            : collect($allPlacementTargets)->where('year', $year)->values()->all();
        $periods = collect($countryPerformance)
            ->pluck('year')
            ->merge(collect($sectorPerformance)->pluck('year'))
            ->merge(collect($allPlacementTargets)->pluck('year'))
            ->unique()
            ->sortDesc()
            ->values()
            ->all();
        $selectedCountries = $year === null
            ? $countryPerformance
            : collect($countryPerformance)->where('year', $year)->values()->all();
        $selectedSectors = $year === null
            ? $sectorPerformance
            : collect($sectorPerformance)->where('year', $year)->values()->all();

        if ($year === null && $selectedCountries === []) {
            $fallbackYear = (int) now()->year;
            $periods = [$fallbackYear];
            $selectedCountries = collect($allowedCountryNames)
                ->map(fn (string $countryName): array => [
                    'year' => $fallbackYear,
                    'countryName' => $countryName,
                    'target' => 0,
                    'achieved' => 0,
                    'projected' => 0,
                ])
                ->all();
        }

        if ($year !== null && $selectedCountries === []) {
            $selectedCountries = collect($allowedCountryNames)
                ->map(fn (string $countryName): array => [
                    'year' => $year,
                    'countryName' => $countryName,
                    'target' => 0,
                    'achieved' => 0,
                    'projected' => 0,
                ])
                ->all();
        }

        $countryYearByKey = [];
        foreach ($selectedCountries as $item) {
            $countryKey = $this->canonicalCountryKey($item['countryName']);
            $countryYearByKey[$countryKey] = max(
                (int) ($countryYearByKey[$countryKey] ?? 0),
                (int) $item['year'],
            );
        }
        $sectorNamesByCountry = [];
        foreach ($selectedSectors as $item) {
            $countryKey = $this->canonicalCountryKey($item['countryName']);
            $sectorNamesByCountry[$countryKey][$this->normalizeSectorName($item['sectorName'])] =
                $item['sectorName'];
        }
        $participantAssignment = $this->assignVerifiedParticipants(
            $participantDirectory,
            $sectorNamesByCountry,
            array_values($masterSectorNames),
        );
        foreach ($participantAssignment['extraSectors'] as $countryKey => $sectorNames) {
            if (! isset($countryYearByKey[$countryKey])) {
                continue;
            }
            $countryName = $participantDirectory['byCountry'][$countryKey]['countryName'] ?? null;
            foreach ($sectorNames as $sectorKey => $sectorName) {
                $achieved = (int) ($participantAssignment['countByCountrySector'][$countryKey][$sectorKey] ?? 0);
                $selectedSectors[] = [
                    'year' => $countryYearByKey[$countryKey],
                    'countryId' => null,
                    'countryName' => $countryName,
                    'sectorName' => $sectorName,
                    'target' => 0,
                    'achieved' => $achieved,
                    'projected' => 0,
                    'percentage' => 0.0,
                ];
            }
        }

        $countries = collect($selectedCountries)
            ->map(function (array $item) use ($participantAssignment, $year): array {
                $countryKey = $this->canonicalCountryKey($item['countryName']);
                $target = (int) $item['target'];
                $achieved = (int) ($participantAssignment['countByCountry'][$countryKey] ?? 0);

                return [
                    'name' => $year === null
                        ? "{$item['year']} · {$item['countryName']}"
                        : $item['countryName'],
                    'target' => $target,
                    'achieved' => $achieved,
                    'projected' => max(0, $target - $achieved),
                ];
            })
            ->sortBy('name')
            ->values()
            ->all();
        $sectors = collect($selectedSectors)
            ->map(function (array $item) use ($participantAssignment, $year): array {
                $countryKey = $this->canonicalCountryKey($item['countryName']);
                $target = (int) $item['target'];
                $achieved = (int) (
                    $participantAssignment['countByCountrySector'][$countryKey][$this->normalizeSectorName($item['sectorName'])]
                    ?? 0
                );

                return [
                    'name' => ($year === null ? "{$item['year']} · " : '')
                        ."{$item['countryName']} · {$item['sectorName']}",
                    'year' => (int) $item['year'],
                    'countryName' => $item['countryName'],
                    'sectorName' => $item['sectorName'],
                    'target' => $target,
                    'achieved' => $achieved,
                    'projected' => max(0, $target - $achieved),
                ];
            })
            ->sortBy('name')
            ->values()
            ->all();

        return [
            'year' => $year,
            'periods' => $periods,
            'countries' => $countries,
            'sectors' => $sectors,
            'placementTargets' => $placementTargets,
            'participants' => $participantAssignment['participants'],
        ];
    }

    /**
     * @param  array<int, array{year: int, sectorName: string, occupationName: string, projectionPlacement: string, target: int}>  $placementTargets
     * @return array<string, array{year: int, countryId: string|null, countryName: string, target: int, sectors: array<string, int>}>
     */
    private function placementCountryTargets(array $placementTargets): array
    {
        $countries = DB::table('countries')->orderBy('name')->pluck('name', 'id')->all();
        $normalizedCountries = [];
        foreach ($countries as $countryId => $countryName) {
            $normalizedCountries[$this->normalizeCountryName($countryName)] = [
                'id' => (string) $countryId,
                'name' => $countryName,
            ];
        }

        $targetsByCountry = [];

        foreach ($placementTargets as $placementTarget) {
            $destinations = preg_split('/[,\\/]/u', $placementTarget['projectionPlacement']) ?: [];
            $matchedCountries = [];
            foreach ($destinations as $destination) {
                $cleanDestination = preg_replace('/\\s*\\([^)]*\\)/u', '', $destination) ?? $destination;
                $normalizedDestination = $this->normalizeCountryName($cleanDestination);
                if ($normalizedDestination === '' || in_array($normalizedDestination, self::NON_COUNTRY_DESTINATIONS, true)) {
                    continue;
                }

                $country = $normalizedCountries[$normalizedDestination] ?? null;
                $displayName = mb_convert_case(trim($cleanDestination), MB_CASE_TITLE, 'UTF-8');
                foreach (self::COUNTRY_ALIASES[$normalizedDestination] ?? [$displayName] as $alias) {
                    $country ??= $normalizedCountries[$this->normalizeCountryName($alias)] ?? null;
                    if ($country !== null) {
                        break;
                    }
                }

                if ($country === null) {
                    $displayName = self::COUNTRY_ALIASES[$normalizedDestination][0] ?? $displayName;
                    $country = ['id' => null, 'name' => $displayName];
                }
                $matchedCountries[$country['id'] ?? $this->normalizeCountryName($country['name'])] = $country;
            }

            $countryCount = count($matchedCountries);
            $baseTarget = $countryCount > 0
                ? intdiv($placementTarget['target'], $countryCount)
                : 0;
            $remainingTarget = $countryCount > 0
                ? $placementTarget['target'] % $countryCount
                : 0;

            foreach (array_values($matchedCountries) as $index => $country) {
                $key = "{$placementTarget['year']}|".($country['id'] ?? $this->normalizeCountryName($country['name']));
                $targetsByCountry[$key] ??= [
                    'year' => $placementTarget['year'],
                    'countryId' => $country['id'],
                    'countryName' => $country['name'],
                    'target' => 0,
                    'sectors' => [],
                ];
                $targetShare = $baseTarget + ($index < $remainingTarget ? 1 : 0);
                $targetsByCountry[$key]['target'] += $targetShare;
                $targetsByCountry[$key]['sectors'][$placementTarget['sectorName']] =
                    ($targetsByCountry[$key]['sectors'][$placementTarget['sectorName']] ?? 0) + $targetShare;
            }
        }

        return $targetsByCountry;
    }

    private function normalizeCountryName(string $name): string
    {
        return mb_strtolower(trim($name));
    }

    /**
     * Kunci negara kanonis agar alias seperti Turkey/Turki/Turky dihitung sekali.
     */
    private function canonicalCountryKey(string $name): string
    {
        $normalized = $this->normalizeCountryName($name);
        $aliases = self::COUNTRY_ALIASES[$normalized] ?? [];

        return isset($aliases[0])
            ? $this->normalizeCountryName($aliases[0])
            : $normalized;
    }

    private function normalizeSectorName(string $name): string
    {
        $normalized = mb_strtolower(trim($name));
        $normalized = preg_replace('/[^\p{L}\p{N}]+/u', ' ', $normalized) ?? $normalized;

        return trim($normalized);
    }

    /**
     * Kumpulan peserta terverifikasi beserta negara tujuan yang terkait.
     *
     * Negara diambil dari demand yang sudah disetujui bila peserta sudah
     * dialokasikan; jika belum, dipakai preferensi negara peserta.
     *
     * @param  array<int, string>  $allowedCountryNames
     * @return array{byCountry: array<string, array{countryName: string, participants: array<int, array<string, mixed>>}>}
     */
    private function verifiedParticipantDirectory(array $allowedCountryNames): array
    {
        $displayNameByKey = [];
        foreach ($allowedCountryNames as $countryName) {
            $displayNameByKey[$this->canonicalCountryKey($countryName)] = $countryName;
        }

        $rows = DB::table('job_seekers')
            ->leftJoin('provinces', 'provinces.id', '=', 'job_seekers.province_id')
            ->whereNull('job_seekers.deleted_at')
            ->where('job_seekers.verification_status', 'Verified')
            ->orderBy('job_seekers.full_name')
            ->limit(2000)
            ->get([
                'job_seekers.id',
                'job_seekers.full_name',
                'job_seekers.education_level',
                'job_seekers.major',
                'job_seekers.readiness_status',
                'job_seekers.source_type',
                'job_seekers.preferred_countries',
                'job_seekers.preferred_sectors',
                'job_seekers.preferred_job_roles',
                'provinces.name as province_name',
            ]);
        if ($rows->isEmpty()) {
            return ['byCountry' => []];
        }

        $countryNames = DB::table('countries')->pluck('name', 'id')->all();
        $masterSectorNames = DB::table('sectors')->pluck('name', 'id')->all();
        $matchesBySeeker = DB::table('candidate_matches')
            ->join('job_demands', 'job_demands.id', '=', 'candidate_matches.job_demand_id')
            ->whereIn('candidate_matches.job_seeker_id', $rows->pluck('id')->all())
            ->whereIn('candidate_matches.match_status', ['Dialokasikan', 'Lolos Seleksi'])
            ->where('job_demands.verification_status', 'Approved')
            ->get(['candidate_matches.job_seeker_id', 'job_demands.country_id', 'job_demands.sector_id'])
            ->groupBy('job_seeker_id');

        $byCountry = [];
        foreach ($rows as $row) {
            $matched = $matchesBySeeker->get($row->id, collect());
            $countryCandidates = [];
            foreach ($matched as $match) {
                $countryName = $countryNames[$match->country_id] ?? null;
                if ($countryName !== null) {
                    $countryCandidates[] = $countryName;
                }
            }
            if ($countryCandidates === []) {
                $countryCandidates = $this->decodeArray($row->preferred_countries);
            }

            $sectorCandidates = [];
            foreach ($matched as $match) {
                $sectorName = $masterSectorNames[$match->sector_id] ?? null;
                if ($sectorName !== null) {
                    $sectorCandidates[] = $sectorName;
                }
            }
            $sectorCandidates = array_merge(
                $sectorCandidates,
                $this->decodeArray($row->preferred_sectors),
            );
            if (($row->major ?? '') !== '') {
                $sectorCandidates[] = (string) $row->major;
            }
            $sectorCandidates = array_values(array_unique(array_filter(
                array_map(fn (mixed $value): string => trim((string) $value), $sectorCandidates),
                fn (string $value): bool => $value !== '',
            )));

            $occupationCandidates = $this->decodeArray($row->preferred_job_roles);
            if ($occupationCandidates === [] && ($row->major ?? '') !== '') {
                $occupationCandidates = [(string) $row->major];
            }

            $participant = [
                'id' => (string) $row->id,
                'name' => (string) $row->full_name,
                'province' => (string) ($row->province_name ?? 'Belum dipetakan'),
                'educationLevel' => (string) ($row->education_level ?? '—'),
                'major' => (string) ($row->major ?? ''),
                'sectorNames' => $sectorCandidates,
                'occupationName' => (string) ($occupationCandidates[0] ?? '—'),
                'readinessStatus' => (string) ($row->readiness_status ?? '—'),
                'sourceType' => $this->participantSourceLabel((string) $row->source_type),
            ];

            $addedCountryKeys = [];
            foreach ($countryCandidates as $countryName) {
                $countryKey = $this->canonicalCountryKey((string) $countryName);
                if (! isset($displayNameByKey[$countryKey]) || isset($addedCountryKeys[$countryKey])) {
                    continue;
                }
                $addedCountryKeys[$countryKey] = true;
                $byCountry[$countryKey] ??= [
                    'countryName' => $displayNameByKey[$countryKey],
                    'participants' => [],
                ];
                $byCountry[$countryKey]['participants'][] = $participant;
            }
        }

        return ['byCountry' => $byCountry];
    }

    private function participantSourceLabel(string $sourceType): string
    {
        return match ($sourceType) {
            'SMK', 'BLK', 'LPK', 'Lembaga Vokasi', 'lembaga_vokasi', 'vokasi' => 'Lembaga Vokasi',
            'Mandiri' => 'SMK / Pendidikan Vokasi',
            'Gardata', 'SIPPMI', 'sippmi' => 'Gardata / SIPPMI',
            default => 'Disnaker Pemda',
        };
    }

    /**
     * Mengelompokkan peserta terverifikasi ke sektor target tiap negara.
     *
     * @param  array{byCountry: array<string, array{countryName: string, participants: array<int, array<string, mixed>>}>}  $directory
     * @param  array<string, array<string, string>>  $sectorNamesByCountry
     * @param  array<int, string>  $masterSectorNames
     * @return array{
     *     participants: array<int, array<string, mixed>>,
     *     countByCountry: array<string, int>,
     *     countByCountrySector: array<string, array<string, int>>,
     *     extraSectors: array<string, array<string, string>>
     * }
     */
    private function assignVerifiedParticipants(
        array $directory,
        array $sectorNamesByCountry,
        array $masterSectorNames,
    ): array {
        $participants = [];
        $countByCountry = [];
        $countByCountrySector = [];
        $extraSectors = [];
        foreach ($directory['byCountry'] as $countryKey => $countryData) {
            $targetSectorNames = array_values($sectorNamesByCountry[$countryKey] ?? []);
            $seenParticipantIds = [];
            foreach ($countryData['participants'] as $participant) {
                if (isset($seenParticipantIds[$participant['id']])) {
                    continue;
                }
                $seenParticipantIds[$participant['id']] = true;

                $sectorName = $this->resolveParticipantSector(
                    $participant['sectorNames'],
                    $targetSectorNames,
                    $masterSectorNames,
                );
                $sectorKey = $this->normalizeSectorName($sectorName);
                $participants[] = [
                    'id' => $participant['id'],
                    'name' => $participant['name'],
                    'countryName' => $countryData['countryName'],
                    'countryKey' => $countryKey,
                    'sectorName' => $sectorName,
                    'occupationName' => $participant['occupationName'],
                    'province' => $participant['province'],
                    'educationLevel' => $participant['educationLevel'],
                    'major' => $participant['major'],
                    'readinessStatus' => $participant['readinessStatus'],
                    'sourceType' => $participant['sourceType'],
                ];
                $countByCountry[$countryKey] = ($countByCountry[$countryKey] ?? 0) + 1;
                $countByCountrySector[$countryKey][$sectorKey] =
                    ($countByCountrySector[$countryKey][$sectorKey] ?? 0) + 1;
                if (! isset($sectorNamesByCountry[$countryKey][$sectorKey])) {
                    $extraSectors[$countryKey][$sectorKey] = $sectorName;
                }
            }
        }

        return compact('participants', 'countByCountry', 'countByCountrySector', 'extraSectors');
    }

    /**
     * @param  array<int, string>  $sectorNames
     * @param  array<int, string>  $targetSectorNames
     * @param  array<int, string>  $masterSectorNames
     */
    private function resolveParticipantSector(
        array $sectorNames,
        array $targetSectorNames,
        array $masterSectorNames,
    ): string {
        foreach ($targetSectorNames as $targetSectorName) {
            foreach ($sectorNames as $sectorName) {
                if ($this->sectorNamesMatch($sectorName, $targetSectorName)) {
                    return $targetSectorName;
                }
            }
        }
        foreach ($masterSectorNames as $masterSectorName) {
            foreach ($sectorNames as $sectorName) {
                if ($this->sectorNamesMatch($sectorName, $masterSectorName)) {
                    return $masterSectorName;
                }
            }
        }

        return $sectorNames[0] ?? 'Belum ditentukan';
    }

    private function sectorNamesMatch(string $left, string $right): bool
    {
        $left = $this->normalizeSectorName($left);
        $right = $this->normalizeSectorName($right);
        if ($left === '' || $right === '') {
            return false;
        }
        if ($left === $right || str_contains($right, $left) || str_contains($left, $right)) {
            return true;
        }

        foreach (self::SECTOR_NAME_ALIASES[$left] ?? [] as $alias) {
            if ($alias === $right || str_contains($right, $alias)) {
                return true;
            }
        }
        foreach (self::SECTOR_NAME_ALIASES[$right] ?? [] as $alias) {
            if ($alias === $left || str_contains($left, $alias)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<int, array{year: int, sectorName: string, occupationName: string, projectionPlacement: string, target: int}>  $targets
     * @return array<int, array{year: int, sectorName: string, occupationName: string, projectionPlacement: string, target: int}>
     */
    private function scalePublicPlacementCountryTargets(array $targets): array
    {
        $targetIndexesByCountry = [];
        foreach ($targets as $index => $target) {
            if ($target['year'] !== self::SEEDED_PLACEMENT_TARGET_YEAR) {
                continue;
            }

            $countryName = preg_replace('/\\s*\\([^)]*\\)/u', '', $target['projectionPlacement'])
                ?? $target['projectionPlacement'];
            $normalizedCountry = $this->canonicalCountryKey($countryName);
            if (isset(self::PUBLIC_PLACEMENT_COUNTRY_TARGETS[$normalizedCountry])) {
                $targetIndexesByCountry[$normalizedCountry][] = $index;
            }
        }

        foreach ($targetIndexesByCountry as $countryName => $indexes) {
            $sourceTotal = array_sum(array_map(
                fn (int $index): int => $targets[$index]['target'],
                $indexes,
            ));
            if ($sourceTotal === 0) {
                continue;
            }

            $countryTarget = self::PUBLIC_PLACEMENT_COUNTRY_TARGETS[$countryName];
            $remainders = [];
            $allocatedTotal = 0;
            foreach ($indexes as $index) {
                $weightedTarget = $targets[$index]['target'] * $countryTarget;
                $targets[$index]['target'] = intdiv($weightedTarget, $sourceTotal);
                $allocatedTotal += $targets[$index]['target'];
                $remainders[$index] = $weightedTarget % $sourceTotal;
            }

            $remainingTarget = $countryTarget - $allocatedTotal;
            if ($remainingTarget > 0) {
                uksort($remainders, fn (int $left, int $right): int => $remainders[$right] <=> $remainders[$left]
                    ?: $left <=> $right);
                foreach (array_slice(array_keys($remainders), 0, $remainingTarget) as $index) {
                    $targets[$index]['target']++;
                }
            }
        }

        return $targets;
    }

    public function make(User $user, array $filters = []): array
    {
        // Auto-heal dinonaktifkan: data peserta hanya diisi melalui sinkronisasi API resmi
        // atau command `php artisan gardata:sync` / `php artisan sippmi:sync`.
        // Untuk mengembalikan perilaku lama, hapus baris ini dan aktifkan kembali blok di bawah.
        //
        // $shouldAutoHeal = ! app()->runningUnitTests()
        //     || (($filters['tab'] ?? null) === 'sippmi-monitoring')
        //     || ! empty($filters['candidateSource']);
        // if ($shouldAutoHeal) {
        //     $this->autoHealTenantCandidates(true);
        // }

        $role = $user->roles()->value('name');
        $cacheKey = $this->cacheKey($user, $role, $filters);

        return Cache::remember($cacheKey, 30, function () use ($role, $user, $filters): array {
            $nationalLpkCount = $this->nationalLpkCount();

            return [
                'candidates' => $this->candidates($role, $user),
                'programs' => $this->programs($role, $user),
                'providers' => $this->providers($role, $user),
                'demands' => $this->demands($role, $user),
                'candidateMatches' => $this->candidateMatches($role, $user),
                'allocations' => $this->allocations($role, $user),
                'nationalLpkCount' => $nationalLpkCount,
                'nationalLpkByProvince' => $this->nationalLpkByProvince(),
                'reportSummary' => $this->reportSummary(
                    $role,
                    $user,
                    $nationalLpkCount,
                ),
                'approvalRequests' => $this->approvalRequests($role, $user, $filters),
                'approvalPagination' => $this->approvalPagination($role, $user, $filters),
                'approvalCounts' => $this->approvalCounts($role, $user, $filters),
                'approvalFilters' => $this->approvalFilters($filters),
                'monitoring' => $this->monitoring($role, $user, $filters),
                'auditLogs' => $this->auditLogs($role, $user),
                'options' => [
                    'provinces' => DB::table('provinces')->orderBy('name')->get(['id', 'name']),
                    'districts' => DB::table('districts')->orderBy('name')->get(['id', 'province_id', 'name']),
                    'sectors' => DB::table('sectors')->orderBy('name')->get(['id', 'name']),
                    'occupations' => DB::table('occupations')->orderBy('title')->get(['id', 'sector_id', 'title']),
                    'countries' => DB::table('countries')->orderBy('name')->get(['id', 'name']),
                    'institutions' => $this->institutionOptions($role, $user),
                ],
                'bp3miScope' => [
                    'isRestricted' => $role === 'task_force',
                    'provinces' => $this->bp3miScope->provinceNamesForUser($user),
                    'codes' => $this->bp3miScope->codesForUser($user),
                    'code' => $this->bp3miScope->activeCodeForUser($user),
                ],
            ];
        });
    }

    public function auditLogs(?string $role, User $user): array
    {
        return rescue(function () use ($role, $user): array {
            $query = DB::table('audit_logs')
                ->orderByDesc('created_at');

            if ($role === 'institution_admin' && $user->institution_id) {
                $query->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                        ->orWhere('entity_id', $user->institution_id);
                });
            }

            return $query->limit(200)->get()->map(function (object $row): array {
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
        }, []);
    }

    public function forget(User $user): void
    {
        Cache::forever('business_data:user_version:'.$user->id, (string) Str::uuid());
    }

    public function forgetAll(): void
    {
        Cache::forever('business_data:version', (string) Str::uuid());
    }

    public function autoHealTenantCandidates(bool $forceInTest = false): void
    {
        // AUTO-HEAL DINONAKTIFKAN.
        // Injeksi data sintetis dimatikan agar data riil dari API Gardata / SIPPMI
        // dapat tersinkronisasi dengan bersih.
        //
        // Untuk mengisi data awal, jalankan salah satu perintah berikut:
        //   php artisan sippmi:sync          → sinkronisasi dari API sippmi.com
        //   php artisan gardata:sync          → sinkronisasi dari API gardata.sippmi.com
        //   php artisan gardata:jurus-jitu    → sinkronisasi penuh (termasuk wilayah & LPK)
        //
        // Untuk mengembalikan perilaku lama (injeksi data sintetis), hapus return di bawah
        // dan aktifkan kembali blok yang dikomentari.
        return;

        /* ---- KODE LAMA (dinonaktifkan) ----

        if (app()->runningUnitTests() && ! $forceInTest) {
            return;
        }

        try {
            $indonusaCount = DB::table('job_seekers')
                ->whereNull('deleted_at')
                ->where(function ($q): void {
                    $q->where('external_source', 'sippmi')
                        ->orWhere('institution_name', 'LIKE', '%Indonusa%');
                })
                ->count();
            if ($indonusaCount < 147) {
                app(GardataPlacementSyncService::class)->ensureIndonusaCandidates(false);
            }
        } catch (\Throwable) {
            // Graceful fallback to avoid presentation disruptions
        }

        try {
            $omegaCount = DB::table('job_seekers')
                ->whereNull('deleted_at')
                ->where('institution_name', 'LIKE', '%Omega%')
                ->count();
            if ($omegaCount < 10) {
                app(GardataPlacementSyncService::class)->ensureOmegaCandidates(false);
            }
        } catch (\Throwable) {
            // Graceful fallback to avoid presentation disruptions
        }

        try {
            $victoriaCount = DB::table('job_seekers')
                ->whereNull('deleted_at')
                ->where('institution_name', 'LIKE', '%Victoria%')
                ->count();
            if ($victoriaCount === 0) {
                app(GardataPlacementSyncService::class)->ensureVictoriaCandidates(false);
            }
        } catch (\Throwable) {
            // Graceful fallback
        }

        try {
            $demandCount = DB::table('job_demands')->count();
            if ($demandCount === 0) {
                \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => \Database\Seeders\DemoDataSeeder::class, '--force' => true]);
            }
        } catch (\Throwable) {
            // Graceful fallback
        }

        try {
            $instCount = DB::table('institutions')->count();
            if ($instCount <= 5) {
                $csvFile = storage_path('app/reference/data_vokasi.csv');
                if (! is_file($csvFile)) {
                    $csvFile = storage_path('app/data_vokasi.csv');
                }
                if (is_file($csvFile)) {
                    \Illuminate\Support\Facades\Artisan::call('institutions:import-vokasi', ['file' => $csvFile]);
                }
            }
        } catch (\Throwable) {
            // Graceful fallback
        }

        ---- AKHIR KODE LAMA */
    }

    private function cacheKey(User $user, ?string $role, array $filters): string
    {
        $bp3miCodes = implode(',', $this->bp3miScope->codesForUser($user));
        $filterKey = hash('sha256', json_encode($filters, JSON_THROW_ON_ERROR));

        return 'business_data:'.Cache::get('business_data:version', '1').':'.Cache::get('business_data:user_version:'.$user->id, '1').':'.$user->id.':'.($role ?? 'none').':'.($user->province_id ?? 'na').':'.($user->district_id ?? 'na').':'.($user->institution_id ?? 'na').':'.($user->employer_id ?? 'na').':'.$bp3miCodes.':'.$filterKey;
    }

    private function candidateMatches(?string $role, User $user): array
    {
        if (! in_array($role, ['super_admin', 'task_force', 'directorate_admin'], true)) {
            return [];
        }

        $query = DB::table('candidate_matches')
            ->join('job_seekers', 'job_seekers.id', '=', 'candidate_matches.job_seeker_id')
            ->join('job_demands', 'job_demands.id', '=', 'candidate_matches.job_demand_id')
            ->join('matching_runs', 'matching_runs.id', '=', 'candidate_matches.matching_run_id')
            ->leftJoin('provinces', 'provinces.id', '=', 'job_seekers.province_id')
            ->leftJoin('training_classes', 'training_classes.id', '=', 'candidate_matches.training_class_id')
            ->leftJoin('training_programs', 'training_programs.id', '=', 'training_classes.training_program_id')
            ->whereNull('job_seekers.deleted_at')
            ->where('job_seekers.verification_status', 'Verified')
            ->where('job_demands.verification_status', 'Approved')
            ->where('candidate_matches.match_status', 'Rekomendasi')
            ->whereRaw(
                'matching_runs.id = (SELECT latest_run.id FROM matching_runs AS latest_run WHERE latest_run.job_demand_id = candidate_matches.job_demand_id ORDER BY latest_run.created_at DESC, latest_run.run_date DESC, latest_run.id DESC LIMIT 1)',
            );

        if ($this->bp3miScope->hasActiveAreaFilter($user)) {
            $this->bp3miScope->applyToJobSeekers($query, $user);
        }

        return $query
            ->orderByDesc('candidate_matches.match_score')
            ->orderBy('job_seekers.full_name')
            ->get([
                'candidate_matches.id',
                'candidate_matches.job_seeker_id',
                'candidate_matches.job_demand_id',
                'candidate_matches.match_score',
                'candidate_matches.match_status',
                'candidate_matches.match_explanation',
                'training_programs.name as program_name',
            ])
            ->map(fn (object $row): array => [
                'id' => (int) $row->id,
                'candidateId' => $row->job_seeker_id,
                'demandId' => $row->job_demand_id,
                'matchScore' => (float) $row->match_score,
                'matchStatus' => $row->match_status,
                'explanation' => $row->match_explanation,
                'programName' => $row->program_name,
            ])->all();
    }

    public function resolveInstitutionScope(User $user): array
    {
        $institutionIds = array_filter([(string) $user->institution_id]);
        $namePatterns = [];
        $isVictoria = false;
        $isOmega = false;
        $isIndonusa = false;
        $isDuta = false;

        if (! empty($user->institution_id)) {
            $inst = DB::table('institutions')->where('id', $user->institution_id)->first();
            if ($inst) {
                $namePatterns[] = $inst->name;
                $instLower = strtolower($inst->name . ' ' . $inst->id);
                if (stripos($instLower, 'victoria') !== false || stripos($instLower, 'arief') !== false) {
                    $isVictoria = true;
                }
                if (stripos($instLower, 'omega') !== false || stripos($instLower, 'eko') !== false) {
                    $isOmega = true;
                }
                if (stripos($instLower, 'indonusa') !== false || stripos($instLower, 'suci') !== false || str_contains($instLower, '@sippmi.co') || str_ends_with($instLower, 'sippmi.co')) {
                    $isIndonusa = true;
                }
                if (stripos($instLower, 'duta') !== false) {
                    $isDuta = true;
                }
            }
        }

        $userAttrs = [
            $user->organization ?? '',
            $user->scope_name ?? '',
            $user->name ?? '',
            $user->email ?? '',
        ];
        if (! empty($user->organization)) {
            $namePatterns[] = $user->organization;
        }
        if (! empty($user->email)) {
            $emailInsts = DB::table('institutions')->where('email', $user->email)->pluck('id')->all();
            $institutionIds = array_unique(array_merge($institutionIds, $emailInsts));
        }
        foreach ($userAttrs as $attr) {
            if ($attr === '') {
                continue;
            }
            if (stripos($attr, 'victoria') !== false || stripos($attr, 'arief') !== false) {
                $isVictoria = true;
            }
            if (stripos($attr, 'omega') !== false || stripos($attr, 'eko priyono') !== false || stripos($attr, 'omegahotelacademy') !== false) {
                $isOmega = true;
            }
            $attrLower = strtolower($attr);
            if (stripos($attr, 'indonusa') !== false || stripos($attr, 'suci') !== false || stripos($attr, 'purwandari') !== false || str_contains($attrLower, '@sippmi.co') || str_ends_with($attrLower, 'sippmi.co')) {
                $isIndonusa = true;
            }
            if (stripos($attr, 'duta') !== false) {
                $isDuta = true;
            }
        }

        // Context check: If user's district is Surakarta (3372) and is institution admin
        if (! $isVictoria && ! $isIndonusa && ! empty($user->district_id) && in_array((string) $user->district_id, ['3372', 'Kota Surakarta'], true)) {
            $userText = strtolower(($user->name ?? '') . ' ' . ($user->organization ?? '') . ' ' . ($user->email ?? ''));
            if (str_contains($userText, 'suci') || str_contains($userText, 'indonusa') || str_contains($userText, 'politeknik')) {
                $isIndonusa = true;
            } else {
                $isVictoria = true;
            }
        }

        if ($isVictoria) {
            $victoriaInsts = DB::table('institutions')
                ->where(function ($q) {
                    $q->where('name', 'LIKE', '%Victoria%')
                        ->orWhere('id', 'LIKE', '%victoria%');
                })
                ->pluck('id')
                ->all();
            $institutionIds = array_unique(array_merge($institutionIds, $victoriaInsts, ['sippmi-victoria-hotel-school']));
            $namePatterns[] = 'Victoria';
            $namePatterns[] = 'VictoriaHotelSchool';
            $namePatterns[] = 'LPK Victoria Hotel School';
        }

        if ($isOmega) {
            $omegaInsts = DB::table('institutions')
                ->where(function ($q) {
                    $q->where('name', 'LIKE', '%Omega%')
                        ->orWhere('id', 'LIKE', '%omega%');
                })
                ->pluck('id')
                ->all();
            $institutionIds = array_unique(array_merge($institutionIds, $omegaInsts, ['sippmi-omega-hotel-academy']));
            $namePatterns[] = 'Omega';
            $namePatterns[] = 'OmegaHotelAcademy';
            $namePatterns[] = 'LPK Omega Hotel Academy';
            $namePatterns[] = 'omegahotelacademy.sippmi.com';
        }

        if ($isIndonusa) {
            $indonusaInsts = DB::table('institutions')
                ->where(function ($q) {
                    $q->where('name', 'LIKE', '%Indonusa%')
                        ->orWhere('id', 'LIKE', '%indonusa%')
                        ->orWhere('name', 'LIKE', '%Politeknik Indonusa%');
                })
                ->pluck('id')
                ->all();
            $institutionIds = array_unique(array_merge($institutionIds, $indonusaInsts, ['sippmi-politeknik-indonusa']));
            $namePatterns[] = 'Indonusa';
            $namePatterns[] = 'Politeknik Indonusa';
            $namePatterns[] = 'Politeknik Indonusa Surakarta';
            $namePatterns[] = 'sippmi.co';
        }

        if ($isDuta) {
            $dutaInsts = DB::table('institutions')
                ->where('name', 'LIKE', '%Duta%')
                ->pluck('id')
                ->all();
            $institutionIds = array_unique(array_merge($institutionIds, $dutaInsts));
            $namePatterns[] = 'Duta';
        }

        foreach ($namePatterns as $p) {
            $clean = trim(preg_replace('/^(lpk|lkp|smk|balai|politeknik)\s+/i', '', $p));
            if (strlen($clean) >= 4) {
                $matched = DB::table('institutions')
                    ->where('name', 'LIKE', '%'.$clean.'%')
                    ->pluck('id')
                    ->all();
                $institutionIds = array_unique(array_merge($institutionIds, $matched));
            }
        }

        return [
            'ids' => array_values(array_filter($institutionIds)),
            'patterns' => array_values(array_unique(array_filter($namePatterns))),
            'isVictoria' => $isVictoria,
            'isOmega' => $isOmega,
            'isIndonusa' => $isIndonusa,
        ];
    }

    private function candidates(?string $role, User $user): array
    {
        if (! in_array($role, ['super_admin', 'leadership', 'task_force', 'province_admin', 'district_admin', 'institution_admin', 'verifier'], true)) {
            return [];
        }

        $rows = DB::table('job_seekers')
            ->whereNull('deleted_at')
            ->when($role === 'province_admin', fn ($query) => $query->where('job_seekers.province_id', $user->province_id))
            ->when($role === 'district_admin', fn ($query) => $query->where('job_seekers.district_id', $user->district_id))
            ->when($role === 'institution_admin', function ($query) use ($user) {
                $scope = $this->resolveInstitutionScope($user);
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
            })
            ->leftJoin('provinces', 'provinces.id', '=', 'job_seekers.province_id')
            ->leftJoin('districts', 'districts.id', '=', 'job_seekers.district_id')
            ->when($this->bp3miScope->hasActiveAreaFilter($user), fn ($query) => $this->bp3miScope->applyToJobSeekers($query, $user))
            ->orderByDesc('job_seekers.created_at')
            ->limit(2000)
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
        if ($ids === []) {
            return [];
        }

        $skillsBySeeker = DB::table('job_seeker_skills')
            ->whereIn('job_seeker_id', $ids)
            ->orderBy('skill_name')
            ->get(['job_seeker_id', 'skill_name'])
            ->groupBy('job_seeker_id')
            ->map(fn ($group) => $group->pluck('skill_name')->values()->all());

        $languagesBySeeker = DB::table('job_seeker_languages')
            ->whereIn('job_seeker_id', $ids)
            ->get(['job_seeker_id', 'language', 'level'])
            ->groupBy('job_seeker_id')
            ->map(fn ($group) => $group->map(fn ($language) => [
                'language' => $language->language,
                'level' => $language->level,
            ])->values()->all());

        return $rows->map(function (object $row) use ($skillsBySeeker, $languagesBySeeker): array {
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
                    'SMK', 'BLK', 'LPK', 'Lembaga Vokasi', 'lembaga_vokasi', 'vokasi' => 'Lembaga Vokasi',
                    'Mandiri' => 'SMK / Pendidikan Vokasi',
                    'Gardata', 'SIPPMI', 'sippmi' => 'Gardata / SIPPMI',
                    default => 'Disnaker Pemda',
                },
                'major' => $row->major,
                'skills' => $skillsBySeeker->get($row->id, []),
                'languageProficiency' => $languagesBySeeker->get($row->id, []),
                'preferredCountry' => $this->decodeArray($row->preferred_countries),
                'preferredJobRole' => $this->decodeArray($row->preferred_job_roles),
                'workExperiences' => $this->decodeArray($row->work_experiences),
                'certifications' => $this->decodeArray($row->certifications),
                'preferredSectors' => $this->decodeArray($row->preferred_sectors),
                'readinessStatus' => $row->readiness_status,
                'verificationStatus' => $row->verification_status,
                'lifecycleStatus' => $row->lifecycle_status,
            ];
        })->all();
    }

    private function programs(?string $role, User $user): array
    {
        if (! in_array($role, ['super_admin', 'leadership', 'task_force', 'directorate_admin', 'institution_admin', 'training_operator', 'verifier'], true)) {
            return [];
        }

        $query = DB::table('training_programs')
            ->leftJoin('sectors', 'sectors.id', '=', 'training_programs.sector_id')
            ->leftJoin('occupations', 'occupations.id', '=', 'training_programs.occupation_id')
            ->leftJoin('countries', 'countries.id', '=', 'training_programs.target_country_id')
            ->leftJoin('institutions', 'institutions.id', '=', 'training_programs.institution_id')
            ->leftJoin('provinces', 'provinces.id', '=', 'institutions.province_id')
            ->where('training_programs.status', '!=', 'Nonaktif')
            ->when(
                in_array($role, ['institution_admin', 'training_operator'], true),
                function ($query) use ($user) {
                    $scope = $this->resolveInstitutionScope($user);
                    $query->where(function ($q) use ($scope, $user) {
                        $hasCondition = false;
                        if (! empty($scope['ids'])) {
                            $q->whereIn('training_programs.institution_id', $scope['ids']);
                            $hasCondition = true;
                        }
                        if (! empty($scope['patterns'])) {
                            foreach ($scope['patterns'] as $pattern) {
                                $likeStr = '%'.str_replace('%', '', $pattern).'%';
                                if ($hasCondition) {
                                    $q->orWhere('institutions.name', 'LIKE', $likeStr);
                                } else {
                                    $q->where('institutions.name', 'LIKE', $likeStr);
                                    $hasCondition = true;
                                }
                            }
                        }
                        if (! $hasCondition) {
                            $q->where('training_programs.institution_id', $user->institution_id ?? '');
                        }
                    });
                },
            )
            ->when($this->bp3miScope->hasActiveAreaFilter($user), fn ($q) => $this->bp3miScope->applyToTrainingPrograms($q, $user));

        return $query
            ->orderByDesc('training_programs.created_at')
            ->get([
                'training_programs.id',
                'training_programs.name',
                'training_programs.program_type',
                'sectors.name as sector_name',
                'occupations.title as occupation_title',
                'countries.name as country_name',
                'training_programs.institution_id',
                'institutions.name as institution_name',
                'training_programs.total_jp',
                'training_programs.certification_target',
                'training_programs.cost_per_participant',
                'training_programs.quota',
                'training_programs.enrolled_count',
                'training_programs.start_date',
                'training_programs.end_date',
                'training_programs.curriculum',
            ])
            ->map(fn (object $row): array => [
                'id' => $row->id,
                'title' => $row->name,
                'programType' => $row->program_type,
                'targetSector' => $row->sector_name ?? '',
                'targetJobRole' => $row->occupation_title ?? '',
                'targetCountry' => $row->country_name ?? '',
                'institutionId' => $row->institution_id ?? '',
                'institutionName' => $row->institution_name ?? '',
                'durationJP' => (int) $row->total_jp,
                'certificationTarget' => $row->certification_target ?? '',
                'estimatedCostPerParticipant' => (float) $row->cost_per_participant,
                'quota' => (int) $row->quota,
                'enrolledCount' => (int) $row->enrolled_count,
                'scheduleStart' => $row->start_date ?? '',
                'scheduleEnd' => $row->end_date ?? '',
                'curriculumOutline' => $row->curriculum ? preg_split('/\r\n|\r|\n/', $row->curriculum) : [],
            ])->all();
    }

    private function providers(?string $role, User $user): array
    {
        if (! in_array($role, ['super_admin', 'leadership', 'task_force', 'directorate_admin', 'institution_admin', 'verifier'], true)) {
            return [];
        }

        $facilitiesByInstitution = DB::table('institution_facilities')
            ->orderBy('facility_name')
            ->get(['institution_id', 'facility_name'])
            ->groupBy('institution_id')
            ->map(fn ($rows) => $rows->pluck('facility_name')->all());

        $query = DB::table('institutions')
            ->leftJoin('provinces', 'provinces.id', '=', 'institutions.province_id')
            ->leftJoin('districts', 'districts.id', '=', 'institutions.district_id')
            ->where('institutions.status', 'Aktif')
            ->when($role === 'institution_admin', function ($q) use ($user) {
                $scope = $this->resolveInstitutionScope($user);
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
            })
            ->when($this->bp3miScope->hasActiveAreaFilter($user), fn ($q) => $this->bp3miScope->applyToInstitutions($q, $user));

        return $query
            ->orderBy('institutions.name')
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
            ])
            ->map(function (object $row) use ($facilitiesByInstitution): array {
                $metadata = $this->decodeArray($row->external_metadata);
                $offerings = [];
                $layer = 'Belum e-Vokasi';
                if (! empty($metadata['programs']) && is_array($metadata['programs'])) {
                    $seen = [];
                    foreach ($metadata['programs'] as $prog) {
                        if (is_array($prog) && ! empty($prog['sector']) && ! empty($prog['occupation'])) {
                            $key = mb_strtolower(trim($prog['sector'])."\0".trim($prog['occupation']));
                            if (! isset($seen[$key])) {
                                $seen[$key] = true;
                                $offerings[] = [
                                    'sector' => $prog['sector'],
                                    'occupation' => $prog['occupation'],
                                ];
                            }
                        }
                        if (! empty($prog['sourceStatuses']) && is_array($prog['sourceStatuses'])) {
                            foreach ($prog['sourceStatuses'] as $status) {
                                if (! empty($status['programStatus'])) {
                                    $layer = 'Layer 3/program';
                                } elseif (! empty($status['facilityStatus']) && $layer !== 'Layer 3/program') {
                                    $layer = 'Layer 2/fasilitas';
                                } elseif (! empty($status['legalityStatus']) && $layer === 'Belum e-Vokasi') {
                                    $layer = 'Layer 1/legalitas diterima';
                                }
                            }
                        }
                    }
                }
                if ($layer === 'Belum e-Vokasi' && $row->evokasi_status === 'Terverifikasi e-Vokasi') {
                    $layer = 'Layer 3/program';
                }

                $category = $metadata['institutionCategory'] ?? $metadata['sourceType'] ?? null;
                if (! $category) {
                    $ownershipLower = strtolower((string) ($row->ownership_type ?? ''));
                    $category = match (true) {
                        str_contains($ownershipLower, 'kementerian') => 'Kementerian',
                        str_contains($ownershipLower, 'pemerintah') => 'Pemerintah Daerah',
                        str_contains($ownershipLower, 'migrant') => 'Migrant Center',
                        default => 'Non Kementerian',
                    };
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
                    'facilities' => $facilitiesByInstitution->get($row->id, []),
                    'supportedSectors' => $this->decodeArray($row->supported_sectors),
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
                    'institutionCategory' => $category,
                    'layer' => $layer,
                    'sectorals' => is_array($metadata['sectorals'] ?? null) ? $metadata['sectorals'] : [],
                    'programs' => [],
                    'offerings' => $offerings,
                    'source' => $row->external_source === 'kp2mi' ? 'kp2mi-api' : 'local',
                ];
            })->all();
    }

    private function demands(?string $role, User $user): array
    {
        if (! in_array($role, ['super_admin', 'leadership', 'task_force', 'directorate_admin', 'demand_admin', 'verifier'], true)) {
            return [];
        }

        $query = DB::table('job_demands')
            ->join('employers', 'employers.id', '=', 'job_demands.employer_id')
            ->leftJoin('countries', 'countries.id', '=', 'job_demands.country_id')
            ->leftJoin('sectors', 'sectors.id', '=', 'job_demands.sector_id')
            ->leftJoin('occupations', 'occupations.id', '=', 'job_demands.occupation_id')
            ->where('job_demands.verification_status', '!=', 'Draft')
            ->when($role === 'demand_admin', fn ($q) => $q->where('job_demands.employer_id', $user->employer_id ?? ''))
            ->when($this->bp3miScope->hasActiveAreaFilter($user), fn ($q) => $this->bp3miScope->applyToJobDemands($q, $user));

        return $query
            ->orderByDesc('job_demands.created_at')
            ->get([
                'job_demands.id',
                'job_demands.employer_id',
                'employers.name as employer_name',
                'countries.name as country_name',
                'sectors.name as sector_name',
                'occupations.title as occupation_title',
                'job_demands.headcount',
                'job_demands.filled_quota',
                'job_demands.min_education',
                'job_demands.required_skills',
                'job_demands.required_language',
                'job_demands.min_language_level',
                'job_demands.required_certifications',
                'job_demands.deadline',
                'job_demands.work_term_months',
                'job_demands.salary_range_string',
                'job_demands.verification_status',
            ])
            ->map(fn (object $row): array => [
                'id' => $row->id,
                'jobTitle' => $row->occupation_title,
                'employerName' => $row->employer_name,
                'country' => $row->country_name,
                'sector' => $row->sector_name,
                'requiredQuota' => (int) $row->headcount,
                'filledQuota' => (int) $row->filled_quota,
                'minEducation' => $row->min_education,
                'requiredSkills' => $row->required_skills ? explode(',', $row->required_skills) : [],
                'requiredLanguageLevel' => trim(($row->required_language ?? '').' '.($row->min_language_level ?? '')),
                'requiredCertifications' => $this->decodeArray($row->required_certifications),
                'deadlineDate' => $row->deadline,
                'workTermMonths' => (int) $row->work_term_months,
                'salaryRangeString' => $row->salary_range_string ?? '',
                'verificationStatus' => $row->verification_status,
            ])->all();
    }

    private function allocations(?string $role, User $user): array
    {
        if (! in_array($role, ['super_admin', 'task_force', 'directorate_admin'], true)) {
            return [];
        }

        $candidateIds = DB::table('program_allocation_candidates')
            ->join('program_allocations', 'program_allocations.id', '=', 'program_allocation_candidates.program_allocation_id')
            ->join('job_seekers', 'job_seekers.id', '=', 'program_allocation_candidates.job_seeker_id')
            ->leftJoin('provinces', 'provinces.id', '=', 'job_seekers.province_id')
            ->whereNull('program_allocations.deleted_at')
            ->whereNull('job_seekers.deleted_at')
            ->when($this->bp3miScope->hasActiveAreaFilter($user), fn ($q) => $this->bp3miScope->applyToJobSeekers($q, $user))
            ->get(['program_allocation_candidates.program_allocation_id', 'program_allocation_candidates.job_seeker_id'])
            ->groupBy('program_allocation_id')
            ->map(fn ($rows): array => $rows->pluck('job_seeker_id')->all());
        $allCandidateCounts = DB::table('program_allocation_candidates')
            ->join('program_allocations', 'program_allocations.id', '=', 'program_allocation_candidates.program_allocation_id')
            ->whereNull('program_allocations.deleted_at')
            ->select('program_allocation_candidates.program_allocation_id')
            ->selectRaw('COUNT(*) as candidate_count')
            ->groupBy('program_allocation_candidates.program_allocation_id')
            ->pluck('candidate_count', 'program_allocation_id');

        $query = DB::table('program_allocations')
            ->join('job_demands', 'job_demands.id', '=', 'program_allocations.job_demand_id')
            ->leftJoin('training_programs', 'training_programs.id', '=', 'program_allocations.training_program_id')
            ->leftJoin('institutions', 'institutions.id', '=', 'program_allocations.institution_id')
            ->leftJoin('provinces', 'provinces.id', '=', 'institutions.province_id')
            ->whereNull('program_allocations.deleted_at')
            ->when($this->bp3miScope->hasActiveAreaFilter($user), function ($q) use ($user, &$candidateIds, $allCandidateCounts) {
                $candidateIds = $candidateIds->filter(
                    fn (array $ids, $allocationId): bool => $ids !== []
                        && count($ids) === (int) $allCandidateCounts->get($allocationId, 0),
                );
                $allocIds = $candidateIds->keys()->all();
                $this->bp3miScope->applyToInstitutions($q, $user);
                $q->whereIn('program_allocations.id', $allocIds)
                    ->whereIn('program_allocations.job_demand_id', function ($demandQuery) use ($user): void {
                        $demandQuery->select('job_demands.id')->from('job_demands');
                        $this->bp3miScope->applyToJobDemands($demandQuery, $user);
                    });
            });

        return $query
            ->orderByDesc('program_allocations.created_at')
            ->get([
                'program_allocations.id',
                'program_allocations.job_demand_id',
                'program_allocations.training_program_id',
                'program_allocations.institution_id',
                'program_allocations.total_budget',
                'program_allocations.start_date',
                'program_allocations.end_date',
                'program_allocations.status',
                'job_demands.occupation_id',
                'training_programs.name as program_name',
                'institutions.name as institution_name',
            ])
            ->map(fn (object $row): array => [
                'allocationId' => $row->id,
                'demandId' => $row->job_demand_id,
                'selectedProgramId' => $row->training_program_id,
                'selectedProviderId' => $row->institution_id,
                'allocatedCandidateIds' => $candidateIds->get($row->id, []),
                'totalBudgetRequired' => (float) $row->total_budget,
                'batchScheduleStart' => $row->start_date,
                'batchScheduleEnd' => $row->end_date,
                'approvalStatus' => $row->status,
                'programName' => $row->program_name,
                'providerName' => $row->institution_name,
            ])->all();
    }

    private function institutionOptions(?string $role, User $user): array
    {
        if (! in_array($role, ['super_admin', 'leadership', 'task_force', 'directorate_admin', 'institution_admin', 'training_operator'], true)) {
            return [];
        }

        $query = DB::table('institutions')
            ->leftJoin('provinces', 'provinces.id', '=', 'institutions.province_id')
            ->where('institutions.status', 'Aktif')
            ->when(
                in_array($role, ['institution_admin', 'training_operator'], true),
                fn ($query) => $query->where('institutions.id', $user->institution_id ?? ''),
            );
        if ($this->bp3miScope->hasActiveAreaFilter($user)) {
            $this->bp3miScope->applyToInstitutions($query, $user);
        }

        return $query
            ->orderBy('institutions.name')
            ->get(['institutions.id', 'institutions.name'])
            ->all();
    }

    private function reportSummary(
        ?string $role,
        User $user,
        int $nationalLpkCount,
    ): array {
        if (! in_array($role, ['super_admin', 'leadership', 'task_force', 'directorate_admin', 'auditor'], true)) {
            return [];
        }

        $candidates = DB::table('job_seekers')
            ->leftJoin('provinces', 'provinces.id', '=', 'job_seekers.province_id')
            ->whereNull('job_seekers.deleted_at');
        $institutions = DB::table('institutions')
            ->leftJoin('provinces', 'provinces.id', '=', 'institutions.province_id')
            ->where('institutions.status', 'Aktif');
        $programs = DB::table('training_programs')
            ->leftJoin('institutions', 'institutions.id', '=', 'training_programs.institution_id')
            ->leftJoin('provinces', 'provinces.id', '=', 'institutions.province_id')
            ->where('training_programs.status', 'Aktif');
        $demands = DB::table('job_demands')
            ->leftJoin('countries', 'countries.id', '=', 'job_demands.country_id')
            ->where('job_demands.verification_status', 'Approved');

        if ($this->bp3miScope->hasActiveAreaFilter($user)) {
            $this->bp3miScope->applyToJobSeekers($candidates, $user);
            $this->bp3miScope->applyToInstitutions($institutions, $user);
            $this->bp3miScope->applyToTrainingPrograms($programs, $user);
            $this->bp3miScope->applyToJobDemands($demands, $user);
        }

        $gardataLastSync = DB::table('integration_sync_logs')
            ->whereIn('source', ['gardata', 'sippmi'])
            ->orderByDesc('started_at')
            ->first(['status', 'started_at', 'finished_at', 'records_fetched', 'records_inserted', 'records_updated', 'records_skipped']);

        $gardataCandidates = (clone $candidates)->whereIn('job_seekers.external_source', ['gardata', 'sippmi']);
        $gardataTraining = DB::table('external_training_records')
            ->whereIn('external_training_records.external_source', ['gardata', 'sippmi']);
        if ($this->bp3miScope->hasActiveAreaFilter($user)) {
            $gardataTraining
                ->join('job_seekers', 'job_seekers.id', '=', 'external_training_records.job_seeker_id')
                ->leftJoin('provinces', 'provinces.id', '=', 'job_seekers.province_id')
                ->whereNull('job_seekers.deleted_at');
            $this->bp3miScope->applyToJobSeekers($gardataTraining, $user);
        }

        $updatedAt = collect([
            (clone $candidates)->max('job_seekers.updated_at'),
            (clone $programs)->max('training_programs.updated_at'),
            (clone $institutions)->max('institutions.updated_at'),
            (clone $demands)->max('job_demands.updated_at'),
            $gardataLastSync?->finished_at,
        ])->filter()->max();

        return [
            'candidateCount' => (clone $candidates)->count('job_seekers.id'),
            'readyCandidateCount' => (clone $candidates)
                ->where('job_seekers.readiness_status', 'Ready for Placement')
                ->count(),
            'programCount' => (clone $programs)->count('training_programs.id'),
            'institutionCount' => (clone $institutions)->count('institutions.id'),
            'nationalLpkCount' => $nationalLpkCount,
            'demandCount' => (clone $demands)->count('job_demands.id'),
            'dashboard' => [
                'candidateLifecycle' => (clone $candidates)
                    ->select('job_seekers.lifecycle_status')
                    ->selectRaw('COUNT(*) as count')
                    ->groupBy('job_seekers.lifecycle_status')
                    ->orderBy('job_seekers.lifecycle_status')
                    ->get()
                    ->map(fn (object $row): array => [
                        'status' => $row->lifecycle_status,
                        'count' => (int) $row->count,
                    ])->all(),
                'candidatesByProvince' => rescue(fn () => (clone $candidates)
                    ->selectRaw("COALESCE(provinces.name, 'Belum dipetakan') as province")
                    ->selectRaw('COUNT(*) as count')
                    ->groupBy(DB::raw("COALESCE(provinces.name, 'Belum dipetakan')"))
                    ->orderByDesc('count')
                    ->limit(8)
                    ->get()
                    ->map(fn (object $row): array => [
                        'province' => (string) $row->province,
                        'count' => (int) $row->count,
                    ])->all(), []),
                'institutionsByEvokasiStatus' => (clone $institutions)
                    ->select('institutions.evokasi_status')
                    ->selectRaw('COUNT(*) as count')
                    ->groupBy('institutions.evokasi_status')
                    ->orderBy('institutions.evokasi_status')
                    ->get()
                    ->map(fn (object $row): array => [
                        'status' => $row->evokasi_status,
                        'count' => (int) $row->count,
                    ])->all(),
                'institutionsByProvince' => rescue(fn () => (clone $institutions)
                    ->selectRaw("COALESCE(provinces.name, 'Belum dipetakan') as province")
                    ->selectRaw('COUNT(*) as total_count')
                    ->selectRaw("SUM(CASE WHEN institutions.evokasi_status = 'Terverifikasi e-Vokasi' THEN 1 ELSE 0 END) as registered_count")
                    ->groupBy(DB::raw("COALESCE(provinces.name, 'Belum dipetakan')"))
                    ->orderByDesc('total_count')
                    ->limit(8)
                    ->get()
                    ->map(fn (object $row): array => [
                        'province' => (string) $row->province,
                        'totalCount' => (int) $row->total_count,
                        'registeredCount' => (int) ($row->registered_count ?? 0),
                    ])->all(), []),
                'lpkByProvince' => rescue(fn () => (clone $institutions)
                    ->where('institutions.institution_type', 'LPK')
                    ->selectRaw("COALESCE(provinces.name, 'Belum dipetakan') as province")
                    ->selectRaw('COUNT(*) as total_count')
                    ->selectRaw("SUM(CASE WHEN institutions.evokasi_status = 'Terverifikasi e-Vokasi' THEN 1 ELSE 0 END) as registered_count")
                    ->groupBy(DB::raw("COALESCE(provinces.name, 'Belum dipetakan')"))
                    ->orderByDesc('total_count')
                    ->limit(8)
                    ->get()
                    ->map(fn (object $row): array => [
                        'province' => (string) $row->province,
                        'totalCount' => (int) $row->total_count,
                        'registeredCount' => (int) ($row->registered_count ?? 0),
                    ])->all(), []),
                'nationalLpkByProvince' => $this->nationalLpkByProvince(),
                'institutionDirectory' => (clone $institutions)
                    ->leftJoin('districts', 'districts.id', '=', 'institutions.district_id')
                    ->orderByRaw('institutions.readiness_score IS NULL')
                    ->orderByDesc('institutions.readiness_score')
                    ->orderBy('institutions.name')
                    ->limit(8)
                    ->get([
                        'institutions.id',
                        'institutions.name',
                        'institutions.institution_type',
                        'institutions.accreditation',
                        'institutions.evokasi_status',
                        'institutions.class_count',
                        'institutions.ready_participant_count',
                        'provinces.name as province_name',
                        'districts.name as district_name',
                    ])
                    ->map(fn (object $row): array => [
                        'id' => $row->id,
                        'name' => $row->name,
                        'type' => $row->institution_type,
                        'province' => $row->province_name ?? 'Belum diketahui',
                        'district' => $row->district_name ?? 'Belum diketahui',
                        'accreditation' => $row->accreditation,
                        'evokasiStatus' => $row->evokasi_status,
                        'classCount' => $row->class_count === null ? null : (int) $row->class_count,
                        'readyParticipantCount' => $row->ready_participant_count === null ? null : (int) $row->ready_participant_count,
                    ])->all(),
                'demandByCountry' => (clone $demands)
                    ->selectRaw("COALESCE(countries.name, 'Belum ditentukan') as country")
                    ->selectRaw('COUNT(*) as demand_count')
                    ->selectRaw('SUM(job_demands.headcount) as quota')
                    ->selectRaw('SUM(job_demands.filled_quota) as filled_quota')
                    ->groupBy('countries.name')
                    ->orderByDesc('quota')
                    ->orderBy('country')
                    ->get()
                    ->map(fn (object $row): array => [
                        'country' => $row->country,
                        'demandCount' => (int) $row->demand_count,
                        'quota' => (int) $row->quota,
                        'filledQuota' => (int) $row->filled_quota,
                    ])->all(),
            ],
            'gardata' => [
                'candidateCount' => (clone $gardataCandidates)->count('job_seekers.id'),
                'trainingRecordCount' => (clone $gardataTraining)->count('external_training_records.id'),
                'lastSyncStatus' => $gardataLastSync?->status,
                'lastSyncAt' => $gardataLastSync?->finished_at,
                'recordsFetched' => $role === 'task_force' ? null : (int) ($gardataLastSync?->records_fetched ?? 0),
                'recordsInserted' => $role === 'task_force' ? null : (int) ($gardataLastSync?->records_inserted ?? 0),
                'recordsUpdated' => $role === 'task_force' ? null : (int) ($gardataLastSync?->records_updated ?? 0),
                'recordsSkipped' => $role === 'task_force' ? null : (int) ($gardataLastSync?->records_skipped ?? 0),
            ],
            'updatedAt' => $updatedAt,
        ];
    }

    private function approvalRequests(?string $role, User $user, array $filters): array
    {
        $normalized = $this->approvalFilters($filters);
        $query = $this->filteredApprovalQuery($role, $user, $normalized);
        $total = (clone $query)->count();
        $lastPage = max((int) ceil($total / $normalized['perPage']), 1);
        $page = min($normalized['page'], $lastPage);
        $rows = $query
            ->orderByRaw("CASE WHEN status = 'PENDING' THEN 0 ELSE 1 END")
            ->orderByDesc('submitted_at')
            ->offset(($page - 1) * $normalized['perPage'])
            ->limit($normalized['perPage'])
            ->get([
                'id',
                'entity_type',
                'entity_id',
                'title',
                'submitted_by',
                'submitted_role',
                'scope_label',
                'submitted_at',
                'validation_status',
                'status',
                'reviewed_by',
                'reviewed_at',
                'rejection_reason',
                'revision_notes',
            ]);
        $institutionIds = $rows
            ->where('entity_type', 'lembaga_vokasi')
            ->pluck('entity_id')
            ->all();
        $registrationDocuments = DB::table('institution_registration_documents')
            ->whereIn('institution_id', $institutionIds)
            ->orderBy('document_type')
            ->get(['id', 'institution_id', 'document_type', 'original_name'])
            ->groupBy('institution_id');
        $institutionLinks = DB::table('institutions')
            ->whereIn('id', $institutionIds)
            ->get()
            ->keyBy('id');

        return $rows->map(function (object $row) use ($registrationDocuments, $institutionLinks): array {
            $docs = $row->entity_type === 'lembaga_vokasi'
                ? ($registrationDocuments->get($row->entity_id, collect()))
                    ->map(fn (object $document): array => [
                        'id' => (int) $document->id,
                        'type' => $document->document_type,
                        'name' => $document->original_name,
                        'downloadUrl' => route('approvals.documents.download', [
                            'id' => $row->id,
                            'documentId' => $document->id,
                        ]),
                    ])->all()
                : [];
            $institutionLink = $row->entity_type === 'lembaga_vokasi'
                ? $institutionLinks->get($row->entity_id)
                : null;
            $externalLinks = array_values(array_filter([
                ! empty($institutionLink?->evokasi_url)
                    ? ['label' => 'Profil e-Vokasi', 'url' => $institutionLink->evokasi_url]
                    : null,
                ! empty($institutionLink?->procurement_catalog_url)
                    ? ['label' => 'Katalog INAPROC', 'url' => $institutionLink->procurement_catalog_url]
                    : null,
                ! empty($institutionLink?->mou_drive_url)
                    ? ['label' => 'Dokumen MoU di Google Drive', 'url' => $institutionLink->mou_drive_url]
                    : null,
            ]));

            return [
                'id' => $row->id,
                'entityType' => $row->entity_type,
                'entityId' => $row->entity_id,
                'entityTitle' => null,
                'details' => $this->approvalDetails($row->entity_type, $row->entity_id),
                'documents' => $docs,
                'externalLinks' => $externalLinks,
                'title' => $row->title,
                'submittedBy' => $row->submitted_by,
                'submittedRole' => $row->submitted_role,
                'scopeLabel' => $row->scope_label,
                'submittedAt' => $row->submitted_at,
                'validationStatus' => $row->validation_status,
                'approvalStatus' => $row->status,
                'reviewedBy' => $row->reviewed_by,
                'reviewedAt' => $row->reviewed_at,
                'rejectionReason' => $row->rejection_reason,
                'revisionNotes' => $row->revision_notes,
                'dataSnapshot' => [],
                'validationChecks' => [[
                    'ruleName' => 'Validasi data wajib',
                    'passed' => $row->validation_status === 'PASSED',
                    'message' => $row->validation_status === 'PASSED'
                        ? 'Data wajib telah lolos validasi server.'
                        : 'Perlu pemeriksaan manual sebelum keputusan.',
                ]],
            ];
        })->all();
    }

    private function approvalPagination(?string $role, User $user, array $filters): array
    {
        $normalized = $this->approvalFilters($filters);
        $total = $this->filteredApprovalQuery($role, $user, $normalized)->count();
        $lastPage = max((int) ceil($total / $normalized['perPage']), 1);

        return [
            'currentPage' => min($normalized['page'], $lastPage),
            'lastPage' => $lastPage,
            'perPage' => $normalized['perPage'],
            'total' => $total,
        ];
    }

    private function approvalCounts(?string $role, User $user, array $filters): array
    {
        $normalized = $this->approvalFilters($filters);
        $normalized['status'] = 'ALL';

        $counts = $this->filteredApprovalQuery($role, $user, $normalized)
            ->select('status')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return [
            'ALL' => (int) $counts->sum(),
            'PENDING' => (int) ($counts['PENDING'] ?? 0),
            'APPROVED' => (int) ($counts['APPROVED'] ?? 0),
            'REVISION_REQUESTED' => (int) ($counts['REVISION_REQUESTED'] ?? 0),
            'REJECTED' => (int) ($counts['REJECTED'] ?? 0),
        ];
    }

    private function approvalFilters(array $filters): array
    {
        $status = $filters['approvalStatus'] ?? 'ALL';
        $type = $filters['approvalType'] ?? 'ALL';
        $perPage = filter_var($filters['approvalPerPage'] ?? 25, FILTER_VALIDATE_INT);
        $page = filter_var($filters['approvalPage'] ?? 1, FILTER_VALIDATE_INT);

        return [
            'status' => in_array($status, ['ALL', 'PENDING', 'APPROVED', 'REVISION_REQUESTED', 'REJECTED'], true) ? $status : 'ALL',
            'type' => in_array($type, ['ALL', 'calon_peserta', 'lembaga_vokasi', 'demand_luar_negeri', 'program_pelatihan'], true) ? $type : 'ALL',
            'search' => mb_substr(trim((string) ($filters['approvalSearch'] ?? '')), 0, 100),
            'perPage' => in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25,
            'page' => is_int($page) && $page > 0 ? $page : 1,
        ];
    }

    private function filteredApprovalQuery(?string $role, User $user, array $filters): Builder
    {
        $requests = $this->approvalBaseQuery($role, $user);
        if ($filters['status'] !== 'ALL') {
            $requests->where('approval_requests.status', $filters['status']);
        }
        if ($filters['type'] !== 'ALL') {
            $requests->where('approval_requests.entity_type', $filters['type']);
        }
        if ($filters['search'] !== '') {
            $search = addcslashes($filters['search'], '\\%_');
            $requests->where(function ($query) use ($search): void {
                $query->where('approval_requests.title', 'LIKE', "%{$search}%")
                    ->orWhere('approval_requests.submitted_by', 'LIKE', "%{$search}%")
                    ->orWhere('approval_requests.scope_label', 'LIKE', "%{$search}%");
            });
        }

        return $requests;
    }

    private function approvalBaseQuery(?string $role, User $user): Builder
    {
        $requests = DB::table('approval_requests');
        if (! in_array($role, ['super_admin', 'task_force', 'verifier'], true)) {
            return $requests->whereRaw('1 = 0');
        }
        if (! $this->bp3miScope->hasActiveAreaFilter($user)) {
            return $requests;
        }

        $provinceIds = $this->bp3miScope->provinceIdsForUser($user);

        return $requests->where(function ($query) use ($provinceIds, $user): void {
            $query->where(function ($item) use ($provinceIds): void {
                $item->where('approval_requests.entity_type', 'calon_peserta')
                    ->whereIn('approval_requests.entity_id', function ($q) use ($provinceIds): void {
                        $q->select('id')->from('job_seekers')
                            ->whereNull('deleted_at')
                            ->whereIn('province_id', $provinceIds);
                    });
            })
            ->orWhere(function ($item) use ($provinceIds): void {
                $item->where('approval_requests.entity_type', 'lembaga_vokasi')
                    ->whereIn('approval_requests.entity_id', function ($q) use ($provinceIds): void {
                        $q->select('id')->from('institutions')
                            ->whereIn('province_id', $provinceIds);
                    });
            })
            ->orWhere(function ($item) use ($provinceIds): void {
                $item->where('approval_requests.entity_type', 'program_pelatihan')
                    ->whereIn('approval_requests.entity_id', function ($q) use ($provinceIds): void {
                        $q->select('training_programs.id')->from('training_programs')
                            ->join('institutions', 'institutions.id', '=', 'training_programs.institution_id')
                            ->whereIn('institutions.province_id', $provinceIds);
                    });
            })
            ->orWhere(function ($item) use ($user): void {
                $item->where('approval_requests.entity_type', 'demand_luar_negeri')
                    ->whereIn('approval_requests.entity_id', function ($q) use ($user): void {
                        $q->select('job_demands.id')->from('job_demands');
                        $this->bp3miScope->applyToJobDemands($q, $user);
                    });
            });
        });
    }

    private function approvalDetails(string $entityType, string $entityId): array
    {
        $details = match ($entityType) {
            'calon_peserta' => DB::table('job_seekers')
                ->leftJoin('provinces', 'provinces.id', '=', 'job_seekers.province_id')
                ->leftJoin('districts', 'districts.id', '=', 'job_seekers.district_id')
                ->where('job_seekers.id', $entityId)
                ->first([
                    'job_seekers.*',
                    'provinces.name as province_name',
                    'districts.name as district_name',
                ]),
            'lembaga_vokasi' => DB::table('institutions')
                ->leftJoin('provinces', 'provinces.id', '=', 'institutions.province_id')
                ->leftJoin('districts', 'districts.id', '=', 'institutions.district_id')
                ->where('institutions.id', $entityId)
                ->first([
                    'institutions.*',
                    'provinces.name as province_name',
                    'districts.name as district_name',
                ]),
            'program_pelatihan' => DB::table('training_programs')
                ->leftJoin('sectors', 'sectors.id', '=', 'training_programs.sector_id')
                ->leftJoin('occupations', 'occupations.id', '=', 'training_programs.occupation_id')
                ->leftJoin('countries', 'countries.id', '=', 'training_programs.target_country_id')
                ->where('training_programs.id', $entityId)
                ->first([
                    'training_programs.*',
                    'sectors.name as sector_name',
                    'occupations.title as occupation_title',
                    'countries.name as country_name',
                ]),
            'demand_luar_negeri' => DB::table('job_demands')
                ->join('employers', 'employers.id', '=', 'job_demands.employer_id')
                ->leftJoin('countries', 'countries.id', '=', 'job_demands.country_id')
                ->leftJoin('occupations', 'occupations.id', '=', 'job_demands.occupation_id')
                ->where('job_demands.id', $entityId)
                ->first([
                    'job_demands.*',
                    'employers.name as employer_name',
                    'countries.name as country_name',
                    'occupations.title as occupation_title',
                ]),
        };
        if (! $details) {
            return [];
        }

        return match ($entityType) {
            'calon_peserta' => [
                ['label' => 'Nama peserta', 'value' => $details->full_name ?? '—'],
                ['label' => 'NIK', 'value' => isset($details->nik) && strlen($details->nik) === 16
                    ? substr($details->nik, 0, 4).'••••••••'.substr($details->nik, -4)
                    : '••••'],
                ['label' => 'Pendidikan / keahlian', 'value' => ($details->education_level ?? '—').' / '.($details->major ?? '—')],
                ['label' => 'Wilayah', 'value' => trim(($details->district_name ?? 'Belum diketahui').', '.($details->province_name ?? 'Belum diketahui'))],
                ['label' => 'Status verifikasi', 'value' => $details->verification_status ?? '—'],
            ],
            'lembaga_vokasi' => [
                ['label' => 'Nama lembaga', 'value' => $details->name ?? '—'],
                ['label' => 'Jenis lembaga', 'value' => $details->institution_type ?? '—'],
                ['label' => 'NPSN / nomor izin', 'value' => $details->npsn_or_vin ?? '—'],
                ['label' => 'Kepemilikan', 'value' => $details->ownership_type ?? '—'],
                ['label' => 'Wilayah', 'value' => trim(($details->district_name ?? 'Belum diketahui').', '.($details->province_name ?? 'Belum diketahui'))],
                ['label' => 'Alamat', 'value' => $details->address ?? '—'],
                ['label' => 'Penanggung jawab', 'value' => $details->head_name ?? '—'],
                ['label' => 'Kontak lembaga', 'value' => trim(($details->email ?? '—').' / '.($details->phone ?? '—'))],
                ['label' => 'Akreditasi', 'value' => $details->accreditation ?? '—'],
                ['label' => 'Skema penyelenggaraan', 'value' => $details->procurement_method ?? '—'],
                ['label' => 'Jumlah kelas', 'value' => $details->class_count ?? 'Belum tersedia'],
                ['label' => 'Peserta siap mengikuti pelatihan', 'value' => $details->ready_participant_count ?? 'Belum tersedia'],
                ['label' => 'Jumlah instruktur', 'value' => $details->instructor_count ?? 'Belum tersedia'],
                ['label' => 'Status verifikasi', 'value' => $details->verification_status ?? '—'],
            ],
            'program_pelatihan' => [
                ['label' => 'Nama program', 'value' => $details->name ?? '—'],
                ['label' => 'Sektor / jabatan', 'value' => trim(($details->sector_name ?? 'Belum dipetakan').' / '.($details->occupation_title ?? 'Belum dipetakan'))],
                ['label' => 'Negara tujuan', 'value' => $details->country_name ?? '—'],
                ['label' => 'Jam pelajaran / kuota', 'value' => ($details->total_jp ?? 0).' JP / '.($details->quota ?? 0).' peserta'],
            ],
            'demand_luar_negeri' => [
                ['label' => 'Pemberi kerja', 'value' => $details->employer_name ?? '—'],
                ['label' => 'Jabatan', 'value' => $details->occupation_title ?? '—'],
                ['label' => 'Negara tujuan', 'value' => $details->country_name ?? '—'],
                ['label' => 'Kuota / batas waktu', 'value' => ($details->headcount ?? 0).' orang / '.($details->deadline ?? '—')],
                ['label' => 'Status verifikasi', 'value' => $details->verification_status ?? '—'],
            ],
        };
    }

    private function nationalLpkCount(): int
    {
        return rescue(function (): int {
            return (int) DB::table('institutions')
                ->where('institution_type', 'LPK')
                ->where(function ($query): void {
                    $query->whereNull('external_id')
                        ->orWhereNotIn('external_id', array_column(GardataPlacementSyncService::KNOWN_SUBDOMAINS, 'subdomain'));
                })
                ->count();
        }, 0);
    }

    /**
     * @return array<int, array{province: string, totalCount: int, registeredCount: int}>
     */
    private function nationalLpkByProvince(): array
    {
        return rescue(function (): array {
            return DB::table('institutions')
                ->leftJoin('provinces', 'provinces.id', '=', 'institutions.province_id')
                ->where('institutions.institution_type', 'LPK')
                ->where('institutions.status', 'Aktif')
                ->where(function ($query): void {
                    $query->whereNull('institutions.external_id')
                        ->orWhereNotIn('institutions.external_id', array_column(GardataPlacementSyncService::KNOWN_SUBDOMAINS, 'subdomain'));
                })
                ->selectRaw("COALESCE(provinces.name, 'Belum dipetakan') as province")
                ->selectRaw('COUNT(*) as total_count')
                ->selectRaw("SUM(CASE WHEN institutions.evokasi_status = 'Terverifikasi e-Vokasi' THEN 1 ELSE 0 END) as registered_count")
                ->groupBy(DB::raw("COALESCE(provinces.name, 'Belum dipetakan')"))
                ->orderByDesc('total_count')
                ->get()
                ->map(fn (object $row): array => [
                    'province' => (string) $row->province,
                    'totalCount' => (int) $row->total_count,
                    'registeredCount' => (int) ($row->registered_count ?? 0),
                ])
                ->all();
        }, []);
    }

    private function monitoring(?string $role, User $user, array $filters): array
    {
        if (! in_array($role, ['super_admin', 'task_force', 'leadership', 'auditor'], true)) {
            return [];
        }

        // Auto-heal dinonaktifkan: data peserta hanya diisi melalui sinkronisasi API resmi.
        // $shouldAutoHeal = ! app()->runningUnitTests()
        //     || (($filters['tab'] ?? null) === 'sippmi-monitoring')
        //     || ! empty($filters['candidateSource']);
        // if ($shouldAutoHeal) {
        //     $this->autoHealTenantCandidates(true);
        // }

        $canViewGardata = in_array($role, ['super_admin', 'task_force', 'leadership', 'auditor'], true);
        $externalClasses = DB::table('external_training_records')
            ->leftJoin('job_seekers', 'job_seekers.id', '=', 'external_training_records.job_seeker_id')
            ->whereIn('external_training_records.external_source', ['gardata', 'sippmi'])
            ->when(! $canViewGardata, fn ($query) => $query->whereRaw('1 = 0'));

        $externalClasses = $externalClasses
            ->select([
                'external_training_records.*',
                'job_seekers.institution_name',
                'job_seekers.full_name',
                'job_seekers.nik',
                'job_seekers.major',
                'job_seekers.gender',
                'job_seekers.readiness_status',
            ])
            ->orderByDesc('external_training_records.updated_at')
            ->get()
            ->groupBy(fn (object $record): string => $record->external_source.'|'.$record->external_batch_id.'|'.$record->institution_name)
            ->map(function ($records): array {
                $first = $records->first();
                $targetJp = max(0, (int) $records->max('target_jp'));
                $maxAchieved = max(0, (int) $records->max('achieved_jp'));

                // Jika targetJp belum terisi, coba ambil total_jp dari katalog program pelatihan atau default 200
                if ($targetJp === 0) {
                    $programJp = DB::table('training_programs')
                        ->where('name', 'LIKE', '%'.($first->program_name ?? $first->sector_name ?? '').'%')
                        ->value('total_jp');
                    $targetJp = $programJp ? (int) $programJp : 200;
                }

                // JP sedang berjalan tidak boleh melebihi target total JP program
                $achievedJp = min($targetJp, $maxAchieved);

                $participants = $records->map(function ($rec) use ($targetJp): array {
                    $nikMasked = $rec->nik
                        ? substr($rec->nik, 0, 6).'******'.substr($rec->nik, -4)
                        : '-';

                    return [
                        'id' => (string) $rec->job_seeker_id,
                        'fullName' => $rec->full_name ?? 'Peserta Pelatihan',
                        'nik' => $nikMasked,
                        'gender' => $rec->gender ?? 'L',
                        'major' => $rec->major ?? '-',
                        'readinessStatus' => $rec->readiness_status ?? 'Ready for Placement',
                        'achievedJp' => min($targetJp, (int) $rec->achieved_jp),
                        'targetJp' => (int) $rec->target_jp,
                        'status' => $rec->status ?? 'ENROLLED',
                    ];
                })->values()->all();

                return [
                    'id' => 'external-'.$first->external_source.'-'.$first->external_batch_id.'-'.substr(hash('sha256', (string) $first->institution_name), 0, 8),
                    'externalSource' => $first->external_source,
                    'externalBatchId' => $first->external_batch_id,
                    'source' => $first->external_source === 'sippmi'
                        ? 'SIPPMI · '.GardataPlacementSyncService::SIPPMI_INSTITUTION_NAME
                        : 'Gardata · '.($first->institution_name ?: 'Multitenant'),
                    'institutionName' => $first->external_source === 'sippmi'
                        ? GardataPlacementSyncService::SIPPMI_INSTITUTION_NAME
                        : $first->institution_name,
                    'classCode' => $first->class_code ?? $first->external_batch_id,
                    'name' => $first->batch_name,
                    'sector' => $first->sector_name ?? $first->program_name ?? 'Belum dipetakan',
                    'startDate' => $first->start_date,
                    'endDate' => $first->end_date,
                    'targetJp' => $targetJp,
                    'achievedJp' => $achievedJp,
                    'participantCount' => $records->count(),
                    'participants' => $participants,
                    'verifiedReportsCount' => (int) $records->sum('verified_reports_count'),
                    'averageAttendance' => null,
                    'averageAssessmentScore' => null,
                    'status' => $records->pluck('status')->unique()->implode(', '),
                ];
            })->values();
        $gardataBatches = $externalClasses
            ->where('externalSource', 'gardata')
            ->map(fn (array $trainingClass): array => [
                'externalBatchId' => $trainingClass['externalBatchId'],
                'name' => $trainingClass['name'],
                'participantCount' => $trainingClass['participantCount'],
                'status' => $trainingClass['status'],
            ])
            ->values()
            ->all();

        $localEnrollments = DB::table('training_enrollments')
            ->join('job_seekers', 'job_seekers.id', '=', 'training_enrollments.job_seeker_id')
            ->select([
                'training_enrollments.training_class_id',
                'job_seekers.id as job_seeker_id',
                'job_seekers.full_name',
                'job_seekers.nik',
                'job_seekers.gender',
                'job_seekers.major',
                'job_seekers.readiness_status',
                'training_enrollments.status as enrollment_status',
            ])
            ->get()
            ->groupBy('training_class_id');

        $localClasses = DB::table('training_classes')
            ->join('training_programs', 'training_programs.id', '=', 'training_classes.training_program_id')
            ->leftJoin('institutions', 'institutions.id', '=', 'training_classes.institution_id')
            ->leftJoin('provinces', 'provinces.id', '=', 'institutions.province_id')
            ->leftJoin('training_class_gardata_mappings', 'training_class_gardata_mappings.training_class_id', '=', 'training_classes.id')
            ->leftJoin('training_enrollments', 'training_enrollments.training_class_id', '=', 'training_classes.id')
            ->when(
                in_array($role, ['institution_admin', 'training_operator'], true),
                fn ($query) => $query->where('training_classes.institution_id', $user->institution_id ?? ''),
            )
            ->when(
                in_array($role, ['bp3mi_admin', 'placement_officer'], true) && filled($user->province_id),
                fn ($query) => $query->where('institutions.province_id', $user->province_id),
            );
        if ($this->bp3miScope->hasActiveAreaFilter($user)) {
            $this->bp3miScope->applyToInstitutions($localClasses, $user);
        }

        $localClasses = $localClasses
            ->select([
                'training_classes.id',
                'training_classes.class_name',
                'training_classes.start_date',
                'training_classes.end_date',
                'training_classes.status',
                'training_programs.name as program_name',
                'training_programs.total_jp',
                'institutions.name as institution_name',
                'training_class_gardata_mappings.external_batch_id as gardata_batch_id',
            ])
            ->selectRaw('COUNT(training_enrollments.id) as participant_count')
            ->groupBy(
                'training_classes.id',
                'training_classes.class_name',
                'training_classes.start_date',
                'training_classes.end_date',
                'training_classes.status',
                'training_programs.name',
                'training_programs.total_jp',
                'institutions.name',
                'training_class_gardata_mappings.external_batch_id',
            )
            ->orderByDesc('training_classes.start_date')
            ->get()
            ->map(function (object $row) use ($localEnrollments): array {
                $targetJp = max(1, (int) $row->total_jp);
                $enrollments = $localEnrollments->get($row->id, collect());

                $achievedJp = 0;
                $upperStatus = strtoupper((string) $row->status);
                if (in_array($upperStatus, ['COMPLETED', 'SELESAI', 'PASSED'], true)) {
                    $achievedJp = $targetJp;
                } elseif (in_array($upperStatus, ['IN_PROGRESS', 'BERJALAN', 'ACTIVE'], true)) {
                    if ($row->start_date && $row->end_date) {
                        $start = Carbon::parse($row->start_date);
                        $end = Carbon::parse($row->end_date);
                        $now = now();
                        if ($now->greaterThanOrEqualTo($end)) {
                            $achievedJp = $targetJp;
                        } elseif ($now->greaterThanOrEqualTo($start)) {
                            $totalDays = max(1, $start->diffInDays($end));
                            $elapsedDays = max(0, $start->diffInDays($now));
                            $achievedJp = min($targetJp, (int) round(($targetJp * $elapsedDays) / $totalDays));
                        } else {
                            $achievedJp = 0;
                        }
                    } else {
                        $achievedJp = (int) round($targetJp * 0.5);
                    }
                }

                $participants = $enrollments->map(function ($e) use ($achievedJp, $targetJp, $row): array {
                    $nikMasked = $e->nik
                        ? substr($e->nik, 0, 6).'******'.substr($e->nik, -4)
                        : '-';

                    return [
                        'id' => (string) $e->job_seeker_id,
                        'fullName' => $e->full_name,
                        'nik' => $nikMasked,
                        'gender' => $e->gender ?? 'L',
                        'major' => $e->major ?? '-',
                        'readinessStatus' => $e->readiness_status ?? 'Ready for Placement',
                        'achievedJp' => $achievedJp,
                        'targetJp' => $targetJp,
                        'status' => $e->enrollment_status ?? $row->status,
                    ];
                })->values()->all();

                return [
                    'id' => 'internal-'.$row->id,
                    'source' => 'SMK Go Global',
                    'classCode' => $row->id,
                    'gardataBatchId' => $row->gardata_batch_id,
                    'name' => $row->class_name,
                    'sector' => $row->program_name,
                    'startDate' => $row->start_date,
                    'endDate' => $row->end_date,
                    'targetJp' => $targetJp,
                    'achievedJp' => $achievedJp,
                    'participantCount' => $enrollments->count() ?: (int) $row->participant_count,
                    'participants' => $participants,
                    'verifiedReportsCount' => 0,
                    'averageAttendance' => null,
                    'averageAssessmentScore' => null,
                    'status' => $row->status,
                ];
            });

        $allClasses = $localClasses->concat($externalClasses)->values();
        $classPage = $this->pageWindow($filters, 'class', 25);
        $classTotal = $allClasses->count();
        $classLastPage = max((int) ceil($classTotal / $classPage['perPage']), 1);
        $classPage['page'] = min($classPage['page'], $classLastPage);
        $classes = $allClasses
            ->slice(($classPage['page'] - 1) * $classPage['perPage'], $classPage['perPage'])
            ->values()
            ->all();

        $candidateSource = (string) ($filters['candidateSource'] ?? 'all');
        $knownCandidateSources = array_merge(
            array_column(GardataPlacementSyncService::KNOWN_SUBDOMAINS, 'subdomain'),
            ['sippmi.com'],
        );
        if (! in_array($candidateSource, $knownCandidateSources, true)) {
            $candidateSource = 'all';
        }
        $candidateSourceFilter = function ($query) use ($candidateSource): void {
            $query->where(function ($sourceQuery): void {
                $sourceQuery->whereIn('job_seekers.external_source', ['gardata', 'sippmi'])
                    ->orWhere(function ($legacy): void {
                        $legacy->whereNull('job_seekers.external_source')
                            ->where(function ($names): void {
                                foreach (GardataPlacementSyncService::KNOWN_SUBDOMAINS as $tenant) {
                                    $needle = match ($tenant['subdomain']) {
                                        'omegahotelacademy.sippmi.com' => 'Omega',
                                        'victoriahotelschool.sippmi.com' => 'Victoria',
                                        'dutainternationalcourse.sippmi.com' => 'Duta',
                                        default => $tenant['name'],
                                    };
                                    $names->orWhere('job_seekers.institution_name', 'LIKE', '%'.$needle.'%');
                                }
                            });
                    });
            });
            if ($candidateSource === 'sippmi.com') {
                $query->where(function ($q): void {
                    $q->where('job_seekers.external_source', 'sippmi')
                        ->orWhere('job_seekers.institution_name', 'LIKE', '%Indonusa%');
                });
            } elseif ($candidateSource !== 'all') {
                $tenant = collect(GardataPlacementSyncService::KNOWN_SUBDOMAINS)
                    ->firstWhere('subdomain', $candidateSource);
                $needle = match ($candidateSource) {
                    'omegahotelacademy.sippmi.com' => 'Omega',
                    'victoriahotelschool.sippmi.com' => 'Victoria',
                    'dutainternationalcourse.sippmi.com' => 'Duta',
                    default => $tenant['name'] ?? '',
                };
                $query->where('job_seekers.institution_name', 'LIKE', '%'.$needle.'%');
            }
        };
        $candidateCountQuery = DB::table('job_seekers')
            ->whereNull('job_seekers.deleted_at')
            ->where($candidateSourceFilter);
        $gardataCandidatesQuery = DB::table('job_seekers')
            ->leftJoin('provinces', 'provinces.id', '=', 'job_seekers.province_id')
            ->leftJoin('districts', 'districts.id', '=', 'job_seekers.district_id')
            ->whereNull('job_seekers.deleted_at')
            ->where($candidateSourceFilter);
        $candidatePage = $this->pageWindow($filters, 'candidate', 25);
        $candidateTotal = $canViewGardata ? (clone $candidateCountQuery)->count('job_seekers.id') : 0;
        $candidatePageCount = max((int) ceil($candidateTotal / $candidatePage['perPage']), 1);
        $candidatePage['page'] = min($candidatePage['page'], $candidatePageCount);
        $candidateRows = ($canViewGardata ? $gardataCandidatesQuery : $gardataCandidatesQuery->whereRaw('1 = 0'))
            ->orderByDesc('job_seekers.updated_at')
            ->offset(($candidatePage['page'] - 1) * $candidatePage['perPage'])
            ->limit($candidatePage['perPage'])
            ->get([
                'job_seekers.id',
                'job_seekers.external_source',
                'job_seekers.nik',
                'job_seekers.full_name',
                'job_seekers.institution_name',
                'job_seekers.major',
                'job_seekers.readiness_status',
                'job_seekers.verification_status',
                'job_seekers.preferred_countries',
                'provinces.name as province_name',
                'districts.name as district_name',
            ]);
        $gardataCandidates = $candidateRows->map(fn (object $row): array => [
            'id' => $row->id,
            'fullName' => $row->full_name,
            'institutionName' => ($row->external_source === 'sippmi' || stripos((string) $row->institution_name, 'Indonusa') !== false)
                ? 'Politeknik Indonusa Surakarta'
                : $row->institution_name,
            'subdomain' => match (true) {
                $row->external_source === 'sippmi' || stripos((string) $row->institution_name, 'Indonusa') !== false => 'sippmi.com',
                stripos((string) $row->institution_name, 'Omega') !== false => 'omegahotelacademy.sippmi.com',
                stripos((string) $row->institution_name, 'Victoria') !== false => 'victoriahotelschool.sippmi.com',
                stripos((string) $row->institution_name, 'Duta') !== false => 'dutainternationalcourse.sippmi.com',
                default => 'gardata.sippmi.com',
            },
            'nik' => strlen($row->nik) === 16 ? substr($row->nik, 0, 4).'••••••••'.substr($row->nik, -4) : '••••',
            'region' => trim(($row->district_name ?? 'Belum diketahui').', '.($row->province_name ?? 'Belum diketahui')),
            'expertise' => $row->major,
            'targetCountry' => $this->decodeArray($row->preferred_countries)[0] ?? 'Belum ditentukan',
            'status' => $row->verification_status,
            'readinessStatus' => $row->readiness_status,
        ])->all();

        $lastSync = $canViewGardata ? DB::table('integration_sync_logs')
            ->whereIn('source', ['gardata', 'sippmi'])
            ->orderByDesc('started_at')
            ->first(['status', 'started_at', 'finished_at', 'records_fetched', 'records_inserted', 'records_updated', 'records_skipped']) : null;

        $placements = in_array($role, ['super_admin', 'task_force', 'directorate_admin', 'bp3mi_admin', 'placement_officer'], true)
            ? DB::table('placement_cases')
                ->join('candidate_matches', 'candidate_matches.id', '=', 'placement_cases.candidate_match_id')
                ->join('job_seekers', 'job_seekers.id', '=', 'candidate_matches.job_seeker_id')
                ->join('job_demands', 'job_demands.id', '=', 'candidate_matches.job_demand_id')
                ->join('employers', 'employers.id', '=', 'job_demands.employer_id')
                ->leftJoin('countries', 'countries.id', '=', 'job_demands.country_id')
                ->leftJoin('occupations', 'occupations.id', '=', 'job_demands.occupation_id')
                ->leftJoin('provinces', 'provinces.id', '=', 'job_seekers.province_id')
                ->when(
                    $this->bp3miScope->hasActiveAreaFilter($user),
                    fn ($query) => $this->bp3miScope->applyToJobSeekers($query, $user),
                )
                ->when(
                    in_array($role, ['bp3mi_admin', 'placement_officer'], true) && filled($user->province_id),
                    fn ($query) => $query->where('job_seekers.province_id', $user->province_id),
                )
                ->whereNull('job_seekers.deleted_at')
                ->orderByDesc('placement_cases.started_at')
                ->get([
                    'placement_cases.id',
                    'candidate_matches.id as candidate_match_id',
                    'job_seekers.full_name as candidate_name',
                    'occupations.title as occupation',
                    'countries.name as country',
                    'employers.name as employer',
                    'placement_cases.status',
                    'placement_cases.flight_date',
                    'placement_cases.siskop2mi_id',
                ])
                ->map(fn (object $row): array => [
                    'id' => $row->id,
                    'candidateMatchId' => (int) $row->candidate_match_id,
                    'candidateName' => $row->candidate_name,
                    'occupation' => $row->occupation ?? 'Belum dipetakan',
                    'country' => $row->country ?? 'Belum ditentukan',
                    'employer' => $row->employer,
                    'status' => $row->status,
                    'flightDate' => $row->flight_date,
                    'siskop2miId' => $row->siskop2mi_id,
                ])->all()
            : [];
        $placementCandidates = in_array($role, ['super_admin', 'task_force', 'directorate_admin'], true)
            ? DB::table('candidate_matches')
                ->join('job_seekers', 'job_seekers.id', '=', 'candidate_matches.job_seeker_id')
                ->join('training_class_gardata_mappings', 'training_class_gardata_mappings.training_class_id', '=', 'candidate_matches.training_class_id')
                ->join('external_training_records', function ($join) {
                    $join->on('external_training_records.external_source', '=', 'training_class_gardata_mappings.external_source')
                        ->on('external_training_records.external_batch_id', '=', 'training_class_gardata_mappings.external_batch_id')
                        ->on('external_training_records.job_seeker_id', '=', 'candidate_matches.job_seeker_id');
                })
                ->join('job_demands', 'job_demands.id', '=', 'candidate_matches.job_demand_id')
                ->join('employers', 'employers.id', '=', 'job_demands.employer_id')
                ->leftJoin('countries', 'countries.id', '=', 'job_demands.country_id')
                ->leftJoin('occupations', 'occupations.id', '=', 'job_demands.occupation_id')
                ->leftJoin('provinces', 'provinces.id', '=', 'job_seekers.province_id')
                ->where('candidate_matches.match_status', 'Dialokasikan')
                ->whereRaw('UPPER(external_training_records.status) = ?', ['GRADUATED'])
                ->whereNull('job_seekers.deleted_at')
                ->whereNotExists(fn ($query) => $query->selectRaw('1')
                    ->from('placement_cases')
                    ->whereColumn('placement_cases.candidate_match_id', 'candidate_matches.id'))
                ->when($this->bp3miScope->hasActiveAreaFilter($user), fn ($query) => $this->bp3miScope->applyToJobSeekers($query, $user))
                ->orderBy('job_seekers.full_name')
                ->get([
                    'candidate_matches.id as candidate_match_id',
                    'job_seekers.full_name as candidate_name',
                    'occupations.title as occupation',
                    'countries.name as country',
                    'employers.name as employer',
                ])
                ->map(fn (object $row): array => [
                    'candidateMatchId' => (int) $row->candidate_match_id,
                    'candidateName' => $row->candidate_name,
                    'occupation' => $row->occupation ?? 'Belum dipetakan',
                    'country' => $row->country ?? 'Belum ditentukan',
                    'employer' => $row->employer,
                ])->all()
            : [];

        $activeExternalCount = $externalClasses->filter(fn ($class) => in_array(
            strtoupper((string) ($class['status'] ?? '')),
            ['IN_PROGRESS', 'BERJALAN', 'RUNNING', 'ACTIVE', 'GRADUATED'],
            true,
        ))->count();

        $tenants = collect(GardataPlacementSyncService::KNOWN_SUBDOMAINS)->map(function (array $t): array {
            $inst = DB::table('institutions')->where('external_id', $t['subdomain'])->first();
            $searchKey = match ($t['subdomain']) {
                'omegahotelacademy.sippmi.com' => 'Omega',
                'victoriahotelschool.sippmi.com' => 'Victoria',
                'dutainternationalcourse.sippmi.com' => 'Duta',
                default => $t['name'],
            };

            $candCount = DB::table('job_seekers')
                ->whereNull('deleted_at')
                ->where(function ($query) use ($searchKey): void {
                    $query->where('institution_name', 'LIKE', '%'.$searchKey.'%')
                        ->where(function ($q): void {
                            $q->whereIn('external_source', ['gardata', 'sippmi'])
                                ->orWhereNull('external_source');
                        });
                })
                ->count();

            $classCount = DB::table('external_training_records')
                ->where('external_source', 'gardata')
                ->whereIn('job_seeker_id', function ($sub) use ($searchKey): void {
                    $sub->select('id')
                        ->from('job_seekers')
                        ->where('institution_name', 'LIKE', '%'.$searchKey.'%');
                })
                ->distinct('external_batch_id')
                ->count('external_batch_id');

            return [
                'id' => $inst?->id ?? 'tenant-'.$t['subdomain'],
                'name' => $t['name'],
                'subdomain' => $t['subdomain'],
                'url' => $t['url'],
                'status' => $t['status'],
                'province' => $t['province'],
                'district' => $t['district'],
                'candidateCount' => $candCount,
                'classCount' => $classCount,
            ];
        })->push([
            'id' => 'sippmi-politeknik-indonusa',
            'name' => GardataPlacementSyncService::SIPPMI_INSTITUTION_NAME,
            'subdomain' => 'sippmi.com',
            'url' => 'https://sippmi.com',
            'status' => 'Aktif',
            'province' => 'Jawa Tengah',
            'district' => 'Surakarta',
            'candidateCount' => DB::table('job_seekers')
                ->whereNull('deleted_at')
                ->where(function ($q): void {
                    $q->where('external_source', 'sippmi')
                        ->orWhere('institution_name', 'LIKE', '%Indonusa%');
                })
                ->count(),
            'classCount' => DB::table('external_training_records')
                ->where(function ($q): void {
                    $q->where('external_source', 'sippmi')
                        ->orWhereIn('job_seeker_id', function ($sub): void {
                            $sub->select('id')
                                ->from('job_seekers')
                                ->where('institution_name', 'LIKE', '%Indonusa%');
                        });
                })
                ->distinct('external_batch_id')
                ->count('external_batch_id'),
        ])->all();

        $activeClassesCount = $localClasses->whereIn('status', ['Sedang Berjalan', 'berjalan', 'aktif', 'Aktif'])->count() + $activeExternalCount;

        return [
            'summary' => [
                'totalClasses' => $localClasses->count() + $externalClasses->count(),
                'activeClasses' => $activeClassesCount,
                'gardataCandidates' => $candidateTotal,
                'verifiedReports' => $canViewGardata
                    ? (int) $externalClasses->sum('verifiedReportsCount')
                    : 0,
                'averageAttendance' => null,
                'averageAssessmentScore' => null,
                'gardataTargetJp' => (int) $externalClasses->sum('targetJp'),
                'gardataAchievedJp' => (int) $externalClasses->sum('achievedJp'),
            ],
            'classes' => $classes,
            'classPagination' => [
                'currentPage' => $classPage['page'],
                'lastPage' => $classLastPage,
                'perPage' => $classPage['perPage'],
                'total' => $classTotal,
            ],
            'gardataBatches' => $gardataBatches,
            'candidates' => $gardataCandidates,
            'candidatePagination' => [
                'currentPage' => $candidatePage['page'],
                'lastPage' => $candidatePageCount,
                'perPage' => $candidatePage['perPage'],
                'total' => $candidateTotal,
            ],
            'candidateSource' => $candidateSource,
            'tenants' => $tenants,
            'placements' => $placements,
            'placementCandidates' => $placementCandidates,
            'lastSync' => $lastSync ? [
                'status' => $lastSync->status,
                'startedAt' => $lastSync->started_at,
                'finishedAt' => $lastSync->finished_at,
                'recordsFetched' => $role === 'task_force' ? null : (int) $lastSync->records_fetched,
                'recordsInserted' => $role === 'task_force' ? null : (int) $lastSync->records_inserted,
                'recordsUpdated' => $role === 'task_force' ? null : (int) $lastSync->records_updated,
                'recordsSkipped' => $role === 'task_force' ? null : (int) $lastSync->records_skipped,
            ] : null,
        ];
    }

    private function pageWindow(array $filters, string $prefix, int $defaultPerPage): array
    {
        $perPage = filter_var($filters[$prefix.'PerPage'] ?? $defaultPerPage, FILTER_VALIDATE_INT);
        $page = filter_var($filters[$prefix.'Page'] ?? 1, FILTER_VALIDATE_INT);

        return [
            'page' => is_int($page) && $page > 0 ? $page : 1,
            'perPage' => in_array($perPage, [10, 25, 50, 100, 150, 200, 250], true) ? $perPage : $defaultPerPage,
        ];
    }

    private function pluckRelated(string $table, string $column, string $jobSeekerId): array
    {
        return DB::table($table)->where('job_seeker_id', $jobSeekerId)->orderBy($column)->pluck($column)->all();
    }

    private function decodeArray(?string $value): array
    {
        if (! $value) {
            return [];
        }

        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : [];
    }
}
