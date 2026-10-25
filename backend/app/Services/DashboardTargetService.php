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
}
