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
}
