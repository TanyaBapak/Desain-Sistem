<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class DashboardTargetService
{
    public const METRIC_KEYS = [
        'registeredJobSeekers',
        'readyForPlacement',
        'activeTrainingPrograms',
        'activeVocationalInstitutions',
        'nationalRegisteredLpk',
        'validatedDemands',
    ];

    /**
     * @return array<string, int|null>
     */
    public function currentTargets(): array
    {
        $storedTargets = DB::table('dashboard_targets')
            ->whereIn('metric_key', self::METRIC_KEYS)
            ->pluck('target_value', 'metric_key');

        return collect(self::METRIC_KEYS)
            ->mapWithKeys(fn (string $key): array => [
                $key => $storedTargets->has($key) && $storedTargets->get($key) !== null
                    ? (int) $storedTargets->get($key)
                    : null,
            ])
            ->all();
    }

    /**
     * @param  array<string, int>  $targets
     */
    public function saveTargets(array $targets, int $userId): void
    {
        $now = now();
        $rows = collect(self::METRIC_KEYS)
            ->map(fn (string $key): array => [
                'metric_key' => $key,
                'target_value' => $targets[$key],
                'updated_by' => $userId,
                'created_at' => $now,
                'updated_at' => $now,
            ])
            ->all();

        DB::table('dashboard_targets')->upsert(
            $rows,
            ['metric_key'],
            ['target_value', 'updated_by', 'updated_at'],
        );
    }
}
