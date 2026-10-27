<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class DashboardTargetService
{
    private const LANDING_KPI_KEYS = [
        'registeredJobSeekers',
        'readyForPlacement',
        'activeTrainingPrograms',
        'activeVocationalInstitutions',
        'nationalLpkCount',
        'validatedDemandCount',
    ];

    private const LANDING_TRAINING_TYPES = [
        'upskilling' => 'Upskilling',
        'reskilling' => 'Reskilling',
        'language' => 'Pelatihan Bahasa',
        'integratedTechnical' => 'Teknis Terpadu',
    ];

    /**
     * @return array<string, int|null>
     */
    public function landingKpiTargets(int $year): array
    {
        $keys = array_map(fn (string $key): string => "{$key}_{$year}", self::LANDING_KPI_KEYS);
        $rows = DB::table('dashboard_targets')
            ->whereIn('metric_key', $keys)
            ->pluck('target_value', 'metric_key');

        return collect(self::LANDING_KPI_KEYS)->mapWithKeys(
            fn (string $key): array => [
                $key => isset($rows["{$key}_{$year}"]) ? (int) $rows["{$key}_{$year}"] : null,
            ],
        )->all();
    }

    /**
     * @return array<int, array{year: int, targets: array<string, int|null>}>
     */
    public function allLandingKpiTargets(): array
    {
        $rows = DB::table('dashboard_targets')
            ->where('metric_key', 'LIKE', '%_%')
            ->orderBy('metric_key')
            ->get(['metric_key', 'target_value']);
        $targetsByYear = [];

        foreach ($rows as $row) {
            if (! preg_match('/^([a-zA-Z]+)_(\d{4})$/', $row->metric_key, $matches)) {
                continue;
            }
            [$key, $year] = [$matches[1], (int) $matches[2]];
            if (! in_array($key, self::LANDING_KPI_KEYS, true)) {
                continue;
            }

            $targetsByYear[$year] ??= array_fill_keys(self::LANDING_KPI_KEYS, null);
            $targetsByYear[$year][$key] = $row->target_value === null ? null : (int) $row->target_value;
        }

        ksort($targetsByYear);

        return array_map(
            fn (int $year, array $targets): array => ['year' => $year, 'targets' => $targets],
            array_keys($targetsByYear),
            array_values($targetsByYear),
        );
    }

    /**
     * @return list<string>
     */
    public function landingProjectionCountryOptions(): array
    {
        $normalizedMasterCountries = [];
        foreach (DB::table('countries')->orderBy('name')->get(['name']) as $country) {
            $normalizedMasterCountries[mb_strtolower(trim($country->name))] = $country->name;
        }

        $countryNames = [];
        foreach ($normalizedMasterCountries as $countryName) {
            $countryNames[mb_strtolower($countryName)] = $countryName;
        }
        foreach ($this->landingPlacementProjection(null) as $target) {
            $destinations = preg_split('/[,\\/]/u', $target['projectionPlacement']) ?: [];
            foreach ($destinations as $destination) {
                $countryName = $this->canonicalProjectionCountry($destination, $normalizedMasterCountries);
                if ($countryName !== null) {
                    $countryNames[mb_strtolower($countryName)] = $countryName;
                }
            }
        }

        $options = array_values($countryNames);
        usort($options, 'strnatcasecmp');

        return $options;
    }

    /**
     * @return list<string>
     */
    public function landingProjectionCountries(): array
    {
        $settings = DB::table('dashboard_targets')
            ->where('metric_key', 'LIKE', 'landingProjectionCountry_%')
            ->get(['metric_key', 'target_value']);

        if ($settings->isEmpty()) {
            return $this->landingProjectionCountryOptions();
        }

        $optionByKey = [];
        foreach ($this->landingProjectionCountryOptions() as $countryName) {
            $optionByKey[$this->projectionCountryMetricKey($countryName)] = $countryName;
        }

        return $settings
            ->filter(fn (object $row): bool => (int) $row->target_value === 1)
            ->map(fn (object $row): ?string => $optionByKey[$row->metric_key] ?? null)
            ->filter(fn (?string $countryName): bool => $countryName !== null)
            ->values()
            ->all();
    }

    /**
     * @param  array<string, string>  $normalizedMasterCountries
     */
    private function canonicalProjectionCountry(string $destination, array $normalizedMasterCountries): ?string
    {
        $cleanDestination = preg_replace('/\\s*\\([^)]*\\)/u', '', $destination) ?? $destination;
        $normalizedDestination = mb_strtolower(trim($cleanDestination));
        if ($normalizedDestination === '' || in_array($normalizedDestination, ['eropa timur', 'timur tengah'], true)) {
            return null;
        }

        if (isset($normalizedMasterCountries[$normalizedDestination])) {
            return $normalizedMasterCountries[$normalizedDestination];
        }

        $aliases = [
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
        ];
        foreach ($aliases[$normalizedDestination] ?? [] as $alias) {
            $normalizedAlias = mb_strtolower($alias);
            if (isset($normalizedMasterCountries[$normalizedAlias])) {
                return $normalizedMasterCountries[$normalizedAlias];
            }
        }

        return $aliases[$normalizedDestination][0]
            ?? mb_convert_case(trim($cleanDestination), MB_CASE_TITLE, 'UTF-8');
    }

    /**
     * @param  list<array{year: int, sectorName: string, occupationName: string, projectionPlacement: string, target: int}>  $targets
     * @param  list<string>  $allowedCountryNames
     * @return list<array{year: int, sectorName: string, occupationName: string, projectionPlacement: string, target: int}>
     */
    public function filterLandingPlacementTargetsForCountries(array $targets, array $allowedCountryNames): array
    {
        if ($allowedCountryNames === []) {
            return [];
        }

        $normalizedMasterCountries = [];
        foreach (DB::table('countries')->orderBy('name')->get(['name']) as $country) {
            $normalizedMasterCountries[mb_strtolower(trim($country->name))] = $country->name;
        }

        $allowedCountryNames = array_fill_keys(
            array_map(fn (string $name): string => mb_strtolower(trim($name)), $allowedCountryNames),
            true,
        );
        $filteredTargets = [];
        foreach ($targets as $target) {
            $matchedCountries = [];
            $destinations = preg_split('/[,\\/]/u', $target['projectionPlacement']) ?: [];
            foreach ($destinations as $destination) {
                $countryName = $this->canonicalProjectionCountry($destination, $normalizedMasterCountries);
                if ($countryName !== null) {
                    $matchedCountries[mb_strtolower($countryName)] = $countryName;
                }
            }

            $countryCount = count($matchedCountries);
            if ($countryCount === 0) {
                continue;
            }

            $baseTarget = intdiv($target['target'], $countryCount);
            $remainingTarget = $target['target'] % $countryCount;
            foreach (array_values($matchedCountries) as $index => $countryName) {
                if (! isset($allowedCountryNames[mb_strtolower($countryName)])) {
                    continue;
                }

                $filteredTargets[] = [
                    ...$target,
                    'projectionPlacement' => $countryCount === 1
                        ? trim($target['projectionPlacement'])
                        : $countryName,
                    'target' => $baseTarget + ($index < $remainingTarget ? 1 : 0),
                ];
            }
        }

        return $filteredTargets;
    }

    private function projectionCountryMetricKey(string $countryName): string
    {
        return 'landingProjectionCountry_'.substr(hash('sha256', mb_strtolower(trim($countryName))), 0, 36);
    }

    /**
     * @return array<int, array{year: int, targets: array<string, int|null>}>
     */
    public function allLandingCountryTargets(): array
    {
        $rows = DB::table('dashboard_targets')
            ->where('metric_key', 'LIKE', 'countryTarget_%')
            ->orderBy('metric_key')
            ->get(['metric_key', 'target_value']);
        $targetsByYear = [];

        foreach ($rows as $row) {
            if (! preg_match('/^countryTarget_([A-Za-z0-9]{2})_(\d{4})$/', $row->metric_key, $matches)) {
                continue;
            }

            [$countryId, $year] = [$matches[1], (int) $matches[2]];
            $targetsByYear[$year][$countryId] = $row->target_value === null ? null : (int) $row->target_value;
        }

        ksort($targetsByYear);

        return array_map(
            fn (int $year, array $targets): array => ['year' => $year, 'targets' => $targets],
            array_keys($targetsByYear),
            array_values($targetsByYear),
        );
    }

    /**
     * @return array<int, array{year: int, targets: array<string, array<string, int|null>>}>
     */
    public function allLandingCountryTrainingTargets(): array
    {
        $rows = DB::table('dashboard_targets')
            ->where('metric_key', 'LIKE', 'countryTrainingTarget_%')
            ->orderBy('metric_key')
            ->get(['metric_key', 'target_value']);
        $targetsByYear = [];

        foreach ($rows as $row) {
            if (! preg_match('/^countryTrainingTarget_([A-Za-z0-9]{2})_([A-Za-z]+)_(\d{4})$/', $row->metric_key, $matches)) {
                continue;
            }

            [, $countryId, $typeKey, $year] = $matches;
            if (! array_key_exists($typeKey, self::LANDING_TRAINING_TYPES)) {
                continue;
            }

            $targetsByYear[(int) $year][$countryId][$typeKey] = $row->target_value === null
                ? null
                : (int) $row->target_value;
        }

        ksort($targetsByYear);

        return array_map(
            fn (int $year, array $targets): array => ['year' => $year, 'targets' => $targets],
            array_keys($targetsByYear),
            array_values($targetsByYear),
        );
    }

    /**
     * @return array<string, array<string, int>>
     */
    public function landingCountryTrainingTargets(int $year): array
    {
        $countryIds = DB::table('countries')->pluck('id');
        $keys = $countryIds->flatMap(fn (string $countryId) => collect(array_keys(self::LANDING_TRAINING_TYPES))
            ->map(fn (string $typeKey): string => "countryTrainingTarget_{$countryId}_{$typeKey}_{$year}"))
            ->all();

        if ($keys === []) {
            return [];
        }

        $targets = [];
        foreach (DB::table('dashboard_targets')->whereIn('metric_key', $keys)->get(['metric_key', 'target_value']) as $row) {
            if ($row->target_value === null
                || ! preg_match('/^countryTrainingTarget_([A-Za-z0-9]{2})_([A-Za-z]+)_\d{4}$/', $row->metric_key, $matches)) {
                continue;
            }
            $targets[$matches[1]][$matches[2]] = (int) $row->target_value;
        }

        return $targets;
    }

    /**
     * @return array<int, array{year: int, countryId: string, countryName: string, trainingType: string, trainingTypeKey: string, target: int, achieved: int, projected: int, percentage: float}>
     */
    public function allLandingCountryTrainingPerformance(): array
    {
        $countryNames = DB::table('countries')->orderBy('name')->pluck('name', 'id')->all();
        $periods = [];
        $programRows = DB::table('training_programs')
            ->select('target_country_id', 'program_type')
            ->selectRaw('SUBSTR(created_at, 1, 4) as year')
            ->selectRaw('SUM(quota) as program_target')
            ->selectRaw('SUM(enrolled_count) as achieved')
            ->groupBy('target_country_id', 'program_type')
            ->groupByRaw('SUBSTR(created_at, 1, 4)')
            ->get();

        foreach ($programRows as $row) {
            $countryId = (string) $row->target_country_id;
            $year = (int) $row->year;
            $typeKey = array_search($row->program_type, self::LANDING_TRAINING_TYPES, true);
            if (! isset($countryNames[$countryId]) || $year < 2000 || $typeKey === false) {
                continue;
            }

            $periods[$year][$countryId][$typeKey] = [
                'programTarget' => (int) $row->program_target,
                'achieved' => (int) $row->achieved,
            ];
        }

        foreach (DB::table('dashboard_targets')
            ->where('metric_key', 'LIKE', 'countryTrainingTarget_%')
            ->get(['metric_key', 'target_value']) as $row) {
            if (! preg_match('/^countryTrainingTarget_([A-Za-z0-9]{2})_([A-Za-z]+)_(\d{4})$/', $row->metric_key, $matches)) {
                continue;
            }

            [, $countryId, $typeKey, $year] = $matches;
            $year = (int) $year;
            if (! isset($countryNames[$countryId]) || $year < 2000 || ! array_key_exists($typeKey, self::LANDING_TRAINING_TYPES)) {
                continue;
            }

            $periods[$year][$countryId][$typeKey] ??= ['programTarget' => 0, 'achieved' => 0];
            $periods[$year][$countryId][$typeKey]['manualTarget'] = $row->target_value === null
                ? null
                : (int) $row->target_value;
        }

        krsort($periods);
        $performance = [];
        foreach ($periods as $year => $countryData) {
            foreach ($countryNames as $countryId => $countryName) {
                foreach (self::LANDING_TRAINING_TYPES as $typeKey => $trainingType) {
                    $data = $countryData[$countryId][$typeKey] ?? ['programTarget' => 0, 'achieved' => 0];
                    $target = $data['manualTarget'] ?? $data['programTarget'];
                    $achieved = $data['achieved'];
                    $performance[] = [
                        'year' => (int) $year,
                        'countryId' => (string) $countryId,
                        'countryName' => $countryName,
                        'trainingType' => $trainingType,
                        'trainingTypeKey' => $typeKey,
                        'target' => $target,
                        'achieved' => $achieved,
                        'projected' => max(0, $target - $achieved),
                        'percentage' => $target > 0 ? round(($achieved / $target) * 100, 1) : 0.0,
                    ];
                }
            }
        }

        return $performance;
    }

    /**
     * @return array<int, array{year: int, targets: array<string, array<string, int|null>>}>
     */
    public function allLandingCountrySectorTargets(): array
    {
        $targetsByYear = [];
        $hashes = $this->countrySectorHashes();
        foreach (DB::table('dashboard_targets')
            ->where('metric_key', 'LIKE', 'cst_%')
            ->get(['metric_key', 'target_value']) as $row) {
            if (! preg_match('/^cst_([a-f0-9]{40})_(\d{4})$/', $row->metric_key, $matches)
                || ! isset($hashes[$matches[1]])) {
                continue;
            }

            [, $pair, $year] = $matches;
            [$countryId, $sectorId] = $hashes[$pair];
            $targetsByYear[(int) $year][$countryId][$sectorId] = $row->target_value === null
                ? null
                : (int) $row->target_value;
        }

        krsort($targetsByYear);

        return array_map(
            fn (int $year, array $targets): array => ['year' => $year, 'targets' => $targets],
            array_keys($targetsByYear),
            array_values($targetsByYear),
        );
    }

    /**
     * @return array<int, array{year: int, countryId: string, countryName: string, sectorId: string, sectorName: string, target: int, achieved: int, projected: int, percentage: float}>
     */
    public function allLandingCountrySectorPerformance(): array
    {
        $countryNames = DB::table('countries')->pluck('name', 'id')->all();
        $sectorNames = DB::table('sectors')->pluck('name', 'id')->all();
        $hashes = $this->countrySectorHashes();
        $periods = [];

        $demandRows = DB::table('job_demands')
            ->where('verification_status', 'Approved')
            ->select('country_id', 'sector_id')
            ->selectRaw('SUBSTR(created_at, 1, 4) as year')
            ->selectRaw('SUM(headcount) as demand_target')
            ->selectRaw('SUM(filled_quota) as achieved')
            ->groupBy('country_id', 'sector_id')
            ->groupByRaw('SUBSTR(created_at, 1, 4)')
            ->get();
        foreach ($demandRows as $row) {
            $countryId = (string) $row->country_id;
            $sectorId = (string) $row->sector_id;
            $year = (int) $row->year;
            if (! isset($countryNames[$countryId], $sectorNames[$sectorId]) || $year < 2000) {
                continue;
            }

            $periods[$year][$countryId][$sectorId] = [
                'demandTarget' => (int) $row->demand_target,
                'achieved' => (int) $row->achieved,
            ];
        }

        foreach (DB::table('dashboard_targets')
            ->where('metric_key', 'LIKE', 'cst_%')
            ->get(['metric_key', 'target_value']) as $row) {
            if (! preg_match('/^cst_([a-f0-9]{40})_(\d{4})$/', $row->metric_key, $matches)
                || ! isset($hashes[$matches[1]])) {
                continue;
            }

            [, $pair, $year] = $matches;
            [$countryId, $sectorId] = $hashes[$pair];
            $year = (int) $year;
            if (! isset($countryNames[$countryId], $sectorNames[$sectorId]) || $year < 2000) {
                continue;
            }
            if ($row->target_value === null && ! isset($periods[$year][$countryId][$sectorId])) {
                continue;
            }

            $periods[$year][$countryId][$sectorId] ??= ['demandTarget' => 0, 'achieved' => 0];
            $periods[$year][$countryId][$sectorId]['manualTarget'] = $row->target_value === null
                ? null
                : (int) $row->target_value;
        }

        krsort($periods);
        $performance = [];
        foreach ($periods as $year => $countryData) {
            foreach ($countryData as $countryId => $sectorData) {
                foreach ($sectorData as $sectorId => $data) {
                    $target = $data['manualTarget'] ?? $data['demandTarget'];
                    $achieved = $data['achieved'];
                    $performance[] = [
                        'year' => (int) $year,
                        'countryId' => (string) $countryId,
                        'countryName' => $countryNames[$countryId],
                        'sectorId' => (string) $sectorId,
                        'sectorName' => $sectorNames[$sectorId],
                        'target' => $target,
                        'achieved' => $achieved,
                        'projected' => max(0, $target - $achieved),
                        'percentage' => $target > 0 ? round(($achieved / $target) * 100, 1) : 0.0,
                    ];
                }
            }
        }

        return $performance;
    }

    /**
     * @return array<int, array{year: int, countryId: string, countryName: string, target: int, achieved: int, projected: int, percentage: float}>
     */
    public function allLandingCountryPerformance(): array
    {
        $countryNames = DB::table('countries')->orderBy('name')->pluck('name', 'id')->all();
        $periods = [];
        $demandRows = DB::table('job_demands')
            ->where('verification_status', 'Approved')
            ->select('country_id')
            ->selectRaw('SUBSTR(created_at, 1, 4) as year')
            ->selectRaw('SUM(headcount) as demand_target')
            ->selectRaw('SUM(filled_quota) as achieved')
            ->groupBy('country_id')
            ->groupByRaw('SUBSTR(created_at, 1, 4)')
            ->get();

        foreach ($demandRows as $row) {
            $countryId = (string) $row->country_id;
            $year = (int) $row->year;
            if (! isset($countryNames[$countryId]) || $year < 2000) {
                continue;
            }

            $periods[$year][$countryId] = [
                'demandTarget' => (int) $row->demand_target,
                'achieved' => (int) $row->achieved,
            ];
        }

        $targetRows = DB::table('dashboard_targets')
            ->where('metric_key', 'LIKE', 'countryTarget_%')
            ->get(['metric_key', 'target_value']);
        foreach ($targetRows as $row) {
            if (! preg_match('/^countryTarget_([A-Za-z0-9]{2})_(\d{4})$/', $row->metric_key, $matches)) {
                continue;
            }

            [$countryId, $year] = [$matches[1], (int) $matches[2]];
            if (! isset($countryNames[$countryId]) || $year < 2000) {
                continue;
            }

            $periods[$year][$countryId] ??= ['demandTarget' => 0, 'achieved' => 0];
            $periods[$year][$countryId]['manualTarget'] = $row->target_value === null
                ? null
                : (int) $row->target_value;
        }

        $manualSectorTargets = $this->allLandingCountrySectorTargets();
        $hasManualSectorTarget = [];
        foreach ($manualSectorTargets as $period) {
            $year = $period['year'];
            $countries = $period['targets'];
            foreach ($countries as $countryId => $sectors) {
                $hasManualSectorTarget[$year][$countryId] = collect($sectors)
                    ->contains(fn (?int $target): bool => $target !== null);
            }
        }

        foreach ($this->allLandingCountrySectorPerformance() as $sectorRow) {
            $year = $sectorRow['year'];
            $countryId = $sectorRow['countryId'];
            $periods[$year][$countryId] ??= ['demandTarget' => 0, 'achieved' => 0];
            $periods[$year][$countryId]['sectorTarget'] =
                ($periods[$year][$countryId]['sectorTarget'] ?? 0) + $sectorRow['target'];
            $periods[$year][$countryId]['sectorAchieved'] =
                ($periods[$year][$countryId]['sectorAchieved'] ?? 0) + $sectorRow['achieved'];
        }

        krsort($periods);
        $performance = [];
        foreach ($periods as $year => $countryData) {
            foreach ($countryNames as $countryId => $countryName) {
                $data = $countryData[$countryId] ?? ['demandTarget' => 0, 'achieved' => 0];
                $target = ($hasManualSectorTarget[$year][$countryId] ?? false)
                    ? ($data['sectorTarget'] ?? $data['demandTarget'])
                    : ($data['manualTarget'] ?? $data['sectorTarget'] ?? $data['demandTarget']);
                $achieved = $data['sectorAchieved'] ?? $data['achieved'];
                $performance[] = [
                    'year' => (int) $year,
                    'countryId' => (string) $countryId,
                    'countryName' => $countryName,
                    'target' => $target,
                    'achieved' => $achieved,
                    'projected' => max(0, $target - $achieved),
                    'percentage' => $target > 0 ? round(($achieved / $target) * 100, 1) : 0.0,
                ];
            }
        }

        return $performance;
    }

    /**
     * @return array<string, int>
     */
    public function landingCountryTargets(int $year): array
    {
        $keys = DB::table('countries')
            ->pluck('id')
            ->map(fn (string $countryId): string => "countryTarget_{$countryId}_{$year}")
            ->all();

        if ($keys === []) {
            return [];
        }

        return DB::table('dashboard_targets')
            ->whereIn('metric_key', $keys)
            ->whereNotNull('target_value')
            ->get(['metric_key', 'target_value'])
            ->mapWithKeys(fn (object $row): array => [
                substr($row->metric_key, strlen('countryTarget_'), -strlen("_{$year}")) => (int) $row->target_value,
            ])
            ->all();
    }

    /**
     * @param  array<string, array<string, int|null>>  $targets
     */
    public function saveLandingCountryTrainingTargets(int $year, array $targets, int $userId): void
    {
        $now = now();
        $rows = [];
        foreach ($targets as $countryId => $trainingTypes) {
            foreach (array_keys(self::LANDING_TRAINING_TYPES) as $typeKey) {
                $rows[] = [
                    'metric_key' => "countryTrainingTarget_{$countryId}_{$typeKey}_{$year}",
                    'target_value' => $trainingTypes[$typeKey] ?? null,
                    'updated_by' => $userId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        if ($rows === []) {
            return;
        }

        DB::table('dashboard_targets')->upsert(
            $rows,
            ['metric_key'],
            ['target_value', 'updated_by', 'updated_at'],
        );
    }

    /**
     * @param  array<string, array<string, int|null>>  $targets
     */
    public function saveLandingCountrySectorTargets(int $year, array $targets, int $userId): void
    {
        $now = now();
        $rows = [];
        foreach ($targets as $countryId => $sectors) {
            foreach ($sectors as $sectorId => $target) {
                $rows[] = [
                    'metric_key' => $this->countrySectorTargetKey((string) $countryId, (string) $sectorId, $year),
                    'target_value' => $target,
                    'updated_by' => $userId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        if ($rows === []) {
            return;
        }

        DB::table('dashboard_targets')->upsert(
            $rows,
            ['metric_key'],
            ['target_value', 'updated_by', 'updated_at'],
        );
    }

    /**
     * @return array{
     *     sectors: list<string>,
     *     occupations: list<array{sectorName: string, occupationName: string}>
     * }
     */
    public function landingPlacementOptions(): array
    {
        $sectors = [];
        $occupations = [];

        foreach (DB::table('sectors')->orderBy('name')->get(['name']) as $sector) {
            $sectors[trim((string) $sector->name)] = true;
        }

        foreach (DB::table('occupations')
            ->join('sectors', 'sectors.id', '=', 'occupations.sector_id')
            ->orderBy('sectors.name')
            ->orderBy('occupations.title')
            ->get(['sectors.name as sector_name', 'occupations.title']) as $occupation) {
            $sectorName = trim((string) $occupation->sector_name);
            $occupationName = trim((string) $occupation->title);
            $occupations["{$sectorName}\0{$occupationName}"] = [
                'sectorName' => $sectorName,
                'occupationName' => $occupationName,
            ];
        }

        foreach (DB::table('institutions')
            ->whereNotNull('external_metadata')
            ->orWhereNotNull('supported_sectors')
            ->cursor(['external_metadata', 'supported_sectors']) as $institution) {
            if ($institution->supported_sectors) {
                $supportedSectors = json_decode($institution->supported_sectors, true, 512, JSON_THROW_ON_ERROR);
                if (is_array($supportedSectors)) {
                    foreach ($supportedSectors as $sectorName) {
                        if (is_string($sectorName) && trim($sectorName) !== '') {
                            $sectors[trim($sectorName)] = true;
                        }
                    }
                }
            }

            if (! $institution->external_metadata) {
                continue;
            }
            $metadata = json_decode($institution->external_metadata, true, 512, JSON_THROW_ON_ERROR);
            if (! is_array($metadata) || ! is_array($metadata['programs'] ?? null)) {
                continue;
            }

            foreach ($metadata['programs'] as $program) {
                if (! is_array($program)) {
                    continue;
                }
                $sectorName = trim((string) ($program['sector'] ?? ''));
                $occupationName = trim((string) ($program['occupation'] ?? ''));
                if ($sectorName === '' || $occupationName === '') {
                    continue;
                }
                $sectors[$sectorName] = true;
                $occupations["{$sectorName}\0{$occupationName}"] = [
                    'sectorName' => $sectorName,
                    'occupationName' => $occupationName,
                ];
            }
        }

        $sectorNames = array_keys($sectors);
        sort($sectorNames, SORT_NATURAL | SORT_FLAG_CASE);
        $occupationOptions = array_values($occupations);
        usort($occupationOptions, static fn (array $left, array $right): int => [$left['sectorName'], $left['occupationName']] <=> [$right['sectorName'], $right['occupationName']]
        );

        return ['sectors' => $sectorNames, 'occupations' => $occupationOptions];
    }

    /**
     * @return list<array{id: int, year: int, sectorName: string, occupationName: string, projectionPlacement: string, target: int}>
     */
    public function allLandingPlacementTargets(): array
    {
        return DB::table('landing_placement_targets')
            ->orderByDesc('year')
            ->orderBy('sector_name')
            ->orderBy('occupation_name')
            ->orderBy('projection_placement')
            ->get()
            ->map(fn (object $row): array => [
                'id' => (int) $row->id,
                'year' => (int) $row->year,
                'sectorName' => $row->sector_name,
                'occupationName' => $row->occupation_name,
                'projectionPlacement' => $row->projection_placement,
                'target' => (int) $row->target,
            ])
            ->all();
    }

    /**
     * @return list<array{year: int, sectorName: string, occupationName: string, projectionPlacement: string, target: int}>
     */
    public function landingPlacementProjection(?int $year): array
    {
        return DB::table('landing_placement_targets')
            ->when($year !== null, fn ($query) => $query->where('year', $year))
            ->orderByDesc('year')
            ->orderBy('sector_name')
            ->orderBy('occupation_name')
            ->orderBy('projection_placement')
            ->get(['year', 'sector_name', 'occupation_name', 'projection_placement', 'target'])
            ->map(fn (object $row): array => [
                'year' => (int) $row->year,
                'sectorName' => $row->sector_name,
                'occupationName' => $row->occupation_name,
                'projectionPlacement' => $row->projection_placement,
                'target' => (int) $row->target,
            ])
            ->all();
    }

    /**
     * @param  list<array{id?: int|null, sectorName: string, occupationName: string, projectionPlacement: string, target: int}>  $targets
     */
    public function saveLandingPlacementTargets(int $year, array $targets, int $userId): void
    {
        foreach ($targets as $target) {
            $attributes = [
                'year' => $year,
                'sector_name' => $target['sectorName'],
                'occupation_name' => $target['occupationName'],
                'projection_placement' => $target['projectionPlacement'],
                'target' => $target['target'],
                'updated_by' => $userId,
                'updated_at' => now(),
            ];

            if (! empty($target['id'])) {
                DB::table('landing_placement_targets')
                    ->where('id', $target['id'])
                    ->where('year', $year)
                    ->update($attributes);

                continue;
            }

            DB::table('landing_placement_targets')->updateOrInsert(
                [
                    'year' => $year,
                    'sector_name' => $target['sectorName'],
                    'occupation_name' => $target['occupationName'],
                    'projection_placement' => $target['projectionPlacement'],
                ],
                [...$attributes, 'created_at' => now()],
            );
        }
    }

    /**
     * @return array<string, array{0: string, 1: string}>
     */
    private function countrySectorHashes(): array
    {
        $hashes = [];
        $countries = DB::table('countries')->pluck('id');
        $sectors = DB::table('sectors')->pluck('id');
        foreach ($countries as $countryId) {
            foreach ($sectors as $sectorId) {
                $hashes[substr(hash('sha256', "{$countryId}\0{$sectorId}"), 0, 40)] = [
                    (string) $countryId,
                    (string) $sectorId,
                ];
            }
        }

        return $hashes;
    }

    private function countrySectorTargetKey(string $countryId, string $sectorId, int $year): string
    {
        $pair = substr(hash('sha256', "{$countryId}\0{$sectorId}"), 0, 40);

        return "cst_{$pair}_{$year}";
    }

    /**
     * @param  array<string, int>  $targets
     */
    public function saveLandingKpiTargets(int $year, array $targets, int $userId): void
    {
        $now = now();
        $rows = [];
        foreach (self::LANDING_KPI_KEYS as $key) {
            $rows[] = [
                'metric_key' => "{$key}_{$year}",
                'target_value' => $targets[$key],
                'updated_by' => $userId,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('dashboard_targets')->upsert(
            $rows,
            ['metric_key'],
            ['target_value', 'updated_by', 'updated_at'],
        );
    }

    /**
     * @param  array<string, int|null>  $targets
     */
    public function saveLandingCountryTargets(int $year, array $targets, int $userId): void
    {
        $now = now();
        $rows = [];
        foreach ($targets as $countryId => $target) {
            $rows[] = [
                'metric_key' => "countryTarget_{$countryId}_{$year}",
                'target_value' => $target,
                'updated_by' => $userId,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if ($rows === []) {
            return;
        }

        DB::table('dashboard_targets')->upsert(
            $rows,
            ['metric_key'],
            ['target_value', 'updated_by', 'updated_at'],
        );
    }

    /**
     * @param  list<string>  $selectedCountryNames
     */
    public function saveLandingProjectionCountries(array $selectedCountryNames, int $userId): void
    {
        $now = now();
        $selectedCountryNames = array_fill_keys(
            array_map(fn (string $name): string => mb_strtolower(trim($name)), $selectedCountryNames),
            true,
        );
        $rows = collect($this->landingProjectionCountryOptions())
            ->map(fn (string $countryName): array => [
                'metric_key' => $this->projectionCountryMetricKey($countryName),
                'target_value' => isset($selectedCountryNames[mb_strtolower(trim($countryName))]) ? 1 : 0,
                'updated_by' => $userId,
                'created_at' => $now,
                'updated_at' => $now,
            ])
            ->all();

        if ($rows === []) {
            return;
        }

        DB::table('dashboard_targets')->upsert(
            $rows,
            ['metric_key'],
            ['target_value', 'updated_by', 'updated_at'],
        );
    }
}
