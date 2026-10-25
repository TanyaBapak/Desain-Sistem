<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProgramSyncFromProviders
{
    public function sync(): array
    {
        $institutions = DB::table('institutions')
            ->whereNotNull('external_metadata')
            ->get(['id', 'name', 'external_metadata']);

        if ($institutions->isEmpty()) {
            return ['created' => 0, 'updated' => 0, 'skipped' => 0];
        }

        $sectors = DB::table('sectors')->get()->keyBy(fn ($s) => Str::lower(trim((string) $s->name)));
        $occupations = DB::table('occupations')->get()->keyBy(fn ($o) => Str::lower(trim((string) $o->title)));
        $countries = DB::table('countries')->get()->keyBy(fn ($c) => Str::lower(trim((string) $c->name)));

        $created = 0;
        $updated = 0;
        $skipped = 0;

        DB::transaction(function () use ($institutions, $sectors, $occupations, $countries, &$created, &$updated, &$skipped): void {
            foreach ($institutions as $inst) {
                $meta = json_decode((string) $inst->external_metadata, true);
                if (! is_array($meta)) {
                    continue;
                }

                $programs = $meta['programs'] ?? $meta['offerings'] ?? $meta['sectorals'] ?? [];
                if (! is_array($programs)) {
                    continue;
                }

                foreach ($programs as $p) {
                    if (! is_array($p)) {
                        continue;
                    }

                    $title = trim((string) ($p['name'] ?? $p['program_name'] ?? $p['program'] ?? $p['occupation'] ?? $p['title'] ?? $p['job_role'] ?? ''));
                    if ($title === '') {
                        $skipped++;
                        continue;
                    }

                    $sectorName = trim((string) ($p['sector'] ?? $p['sector_name'] ?? $p['sectoral'] ?? ''));
                    $occName = trim((string) ($p['occupation'] ?? $p['job_role'] ?? $p['position'] ?? $title));

                    $sector = $sectorName !== '' ? ($sectors[Str::lower($sectorName)] ?? null) : null;
                    $occ = $occName !== '' ? ($occupations[Str::lower($occName)] ?? null) : null;

                    $targetCountry = $p['target_country'] ?? $p['country'] ?? null;
                    $country = is_string($targetCountry) && $targetCountry !== ''
                        ? ($countries[Str::lower(trim($targetCountry))] ?? null)
                        : null;

                    $quota = is_numeric($p['quota'] ?? null) ? (int) $p['quota'] : (is_numeric($p['capacity'] ?? null) ? (int) $p['capacity'] : (is_numeric($p['class_capacity'] ?? null) ? (int) $p['class_capacity'] : 0));
                    $jp = is_numeric($p['total_jp'] ?? $p['duration_jp'] ?? $p['jp'] ?? null) ? (int) ($p['total_jp'] ?? $p['duration_jp'] ?? $p['jp']) : null;
                    $cost = is_numeric($p['cost_per_participant'] ?? $p['cost'] ?? null) ? (float) ($p['cost_per_participant'] ?? $p['cost']) : 0.0;

                    $rawType = trim((string) ($p['program_type'] ?? $p['type'] ?? ''));
                    $programType = $this->normalizeProgramType($rawType);

                    $curriculum = $p['curriculum'] ?? $p['syllabus'] ?? null;
                    if (is_array($curriculum)) {
                        $curriculum = implode(PHP_EOL, array_filter(array_map('strval', $curriculum)));
                    }

                    $existing = DB::table('training_programs')
                        ->where('institution_id', $inst->id)
                        ->whereRaw('LOWER(name) = ?', [Str::lower($title)])
                        ->first();

                    $payload = [
                        'institution_id' => $inst->id,
                        'name' => $title,
                        'program_type' => $programType,
                        'sector_id' => $sector->id ?? null,
                        'occupation_id' => $occ->id ?? null,
                        'target_country_id' => $country->id ?? null,
                        'total_jp' => $jp,
                        'quota' => $quota,
                        'status' => 'Aktif',
                        'certification_target' => $p['certification_target'] ?? $p['certification'] ?? '-',
                        'cost_per_participant' => $cost,
                        'curriculum' => $curriculum ?? null,
                        'updated_at' => now(),
                    ];

                    if ($existing) {
                        DB::table('training_programs')->where('id', $existing->id)->update($payload);
                        $updated++;
                    } else {
                        $payload['id'] = (string) Str::uuid();
                        $payload['created_at'] = now();
                        DB::table('training_programs')->insert($payload);
                        $created++;
                    }
                }
            }
        });

        return ['created' => $created, 'updated' => $updated, 'skipped' => $skipped];
    }

    private function normalizeProgramType(string $raw): string
    {
        $lower = Str::lower(trim($raw));
        $map = [
            'upskilling' => 'Upskilling',
            'reskilling' => 'Reskilling',
            'pelatihan bahasa' => 'Pelatihan Bahasa',
            'teknis terpadu' => 'Teknis Terpadu',
            'pelatihan' => 'Teknis Terpadu',
            'training' => 'Teknis Terpadu',
            'keterampilan' => 'Teknis Terpadu',
            'bahasa' => 'Pelatihan Bahasa',
            'language' => 'Pelatihan Bahasa',
        ];

        if (isset($map[$lower])) {
            return $map[$lower];
        }

        // Cek partial match
        foreach ($map as $key => $value) {
            if (str_contains($lower, $key)) {
                return $value;
            }
        }

        return 'Teknis Terpadu';
    }
}
