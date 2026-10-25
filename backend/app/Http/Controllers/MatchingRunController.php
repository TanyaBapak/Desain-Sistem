<?php

namespace App\Http\Controllers;

use App\Services\Bp3miScope;
use App\Services\BusinessDataPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MatchingRunController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->roles()->value('name') === 'task_force', 403);

        $data = $request->validate([
            'demandId' => ['required', 'string', 'exists:job_demands,id'],
        ]);
        $demand = DB::table('job_demands')
            ->join('countries', 'countries.id', '=', 'job_demands.country_id')
            ->join('occupations', 'occupations.id', '=', 'job_demands.occupation_id')
            ->join('sectors', 'sectors.id', '=', 'job_demands.sector_id')
            ->where('job_demands.id', $data['demandId'])
            ->where('job_demands.verification_status', 'Approved')
            ->first([
                'job_demands.*',
                'countries.name as country_name',
                'occupations.title as occupation_title',
                'sectors.name as sector_name',
            ]);
        if (! $demand) {
            throw ValidationException::withMessages(['demandId' => 'Demand harus disetujui sebelum matching dijalankan.']);
        }

        $scope = app(Bp3miScope::class);
        abort_unless($scope->allowsDemandCountry($request->user(), $demand->country_id), 403);
        $candidatesQuery = DB::table('job_seekers')
            ->leftJoin('provinces', 'provinces.id', '=', 'job_seekers.province_id')
            ->whereNull('job_seekers.deleted_at')
            ->where('job_seekers.verification_status', 'Verified')
            ->whereNotExists(fn ($query) => $query->selectRaw('1')
                ->from('candidate_matches as prior_matches')
                ->whereColumn('prior_matches.job_seeker_id', 'job_seekers.id')
                ->whereIn('prior_matches.match_status', ['Dialokasikan', 'Lolos Seleksi']))
            ->whereNotExists(fn ($query) => $query->selectRaw('1')
                ->from('training_enrollments')
                ->whereColumn('training_enrollments.job_seeker_id', 'job_seekers.id')
                ->where('training_enrollments.status', 'Aktif'));
        $scope->applyToJobSeekers($candidatesQuery, $request->user());
        $candidates = $candidatesQuery->get([
            'job_seekers.id',
            'job_seekers.education_level',
            'job_seekers.major',
            'job_seekers.preferred_countries',
            'job_seekers.preferred_job_roles',
            'job_seekers.preferred_sectors',
            'job_seekers.work_experiences',
            'job_seekers.certifications',
        ]);
        $candidateIds = $candidates->pluck('id')->all();
        $skills = $candidateIds === [] ? collect() : DB::table('job_seeker_skills')
            ->whereIn('job_seeker_id', $candidateIds)
            ->get(['job_seeker_id', 'skill_name'])
            ->groupBy('job_seeker_id')
            ->map(fn ($rows) => $rows->pluck('skill_name')->all());
        $languages = $candidateIds === [] ? collect() : DB::table('job_seeker_languages')
            ->whereIn('job_seeker_id', $candidateIds)
            ->get(['job_seeker_id', 'language', 'level'])
            ->groupBy('job_seeker_id');

        $requiredSkills = $this->listValues($demand->required_skills);
        $requiredCertifications = $this->listValues($demand->required_certifications);
        $requiredLanguage = trim((string) $demand->required_language);
        $weights = config('matching.weights');
        $minimumScore = (float) config('matching.minimum_score');
        $scored = [];

        foreach ($candidates as $candidate) {
            $profileValues = [
                'occupation' => $this->listValues($candidate->preferred_job_roles),
                'education' => [$candidate->education_level],
                'country' => $this->listValues($candidate->preferred_countries),
                'sector' => array_merge(
                    $this->listValues($candidate->preferred_sectors),
                    [$candidate->major],
                ),
                'skills' => array_merge(
                    $skills->get($candidate->id, []),
                    [$candidate->major],
                    $this->flattenValues($candidate->work_experiences),
                ),
                'certification' => array_merge(
                    $this->listValues($candidate->certifications),
                    $skills->get($candidate->id, []),
                ),
            ];
            $requirements = [
                'occupation' => [$demand->occupation_title],
                'education' => [$demand->min_education],
                'country' => [$demand->country_name],
                'sector' => [$demand->sector_name],
                'skills' => $requiredSkills,
                'certification' => $requiredCertifications,
            ];
            $earned = 0.0;
            $possible = 0.0;
            $explanations = [];

            foreach ($requirements as $key => $required) {
                if ($required === []) {
                    continue;
                }
                $weight = (float) ($weights[$key] ?? 0);
                $possible += $weight;
                $matched = $key === 'education'
                    ? $this->educationMeets((string) $candidate->education_level, (string) $demand->min_education)
                    : $this->hasOverlap($profileValues[$key] ?? [], $required);
                if ($matched) {
                    $earned += $weight;
                    $explanations[] = ucfirst($key).' sesuai';
                }
            }

            if ($requiredLanguage !== '') {
                $possible += (float) ($weights['language'] ?? 0);
                $languageMatch = collect($languages->get($candidate->id, []))->contains(
                    fn (object $language): bool => $this->containsText($language->language, $requiredLanguage)
                        && $this->languageLevelMeets($language->level, $demand->min_language_level),
                );
                if ($languageMatch) {
                    $earned += (float) ($weights['language'] ?? 0);
                    $explanations[] = 'Bahasa dan level sesuai';
                }
            }

            $score = $possible > 0 ? round(($earned / $possible) * 100, 2) : 0.0;
            if ($score >= $minimumScore) {
                $scored[] = [
                    'candidateId' => $candidate->id,
                    'score' => $score,
                    'explanation' => $explanations === []
                        ? 'Kandidat memenuhi ambang skor berdasarkan data profil yang tersedia.'
                        : implode('; ', $explanations).'.',
                ];
            }
        }

        DB::transaction(function () use ($request, $demand, $candidates, $scored): void {
            $now = now();
            $runId = 'MATCH-'.$now->format('YmdHis.u').'-'.Str::upper(Str::random(8));
            DB::table('matching_runs')->insert([
                'id' => $runId,
                'job_demand_id' => $demand->id,
                'run_date' => $now,
                'created_at' => $now,
                'total_candidates_analyzed' => $candidates->count(),
                'matches_found' => count($scored),
                'algorithm_version' => (string) config('matching.algorithm_version'),
            ]);

            foreach ($scored as $match) {
                DB::table('candidate_matches')->insert([
                    'matching_run_id' => $runId,
                    'job_demand_id' => $demand->id,
                    'job_seeker_id' => $match['candidateId'],
                    'match_score' => $match['score'],
                    'match_status' => 'Rekomendasi',
                    'match_explanation' => $match['explanation'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $role = $request->user()->roles()->first();
            DB::table('audit_logs')->insert([
                'id' => 'AUD-'.Str::upper(Str::random(20)),
                'user_id' => $request->user()->id,
                'actor_name' => $request->user()->name,
                'actor_role' => $role?->title ?? 'Task Force',
                'scope' => $request->user()->scope_name,
                'action_type' => 'ALOKASI_MATCHING',
                'entity' => 'matching_run',
                'entity_id' => $runId,
                'justification_reason' => 'Matching dijalankan atas demand '.$demand->id.'; '.$candidates->count().' kandidat dianalisis dan '.count($scored).' rekomendasi disimpan.',
                'created_at' => $now,
            ]);
        });

        app(BusinessDataPresenter::class)->forget($request->user());

        return back()->with('success', count($scored).' rekomendasi matching berhasil dihitung dan disimpan.');
    }

    private function listValues(mixed $value): array
    {
        if (! is_string($value) || trim($value) === '') {
            return [];
        }
        $decoded = json_decode($value, true);
        $values = is_array($decoded) ? $decoded : explode(',', $value);

        return array_values(array_filter(array_map(
            fn (mixed $item): string => is_scalar($item) ? trim((string) $item) : '',
            $values,
        )));
    }

    private function flattenValues(mixed $value): array
    {
        $decoded = is_string($value) ? json_decode($value, true) : null;
        if (! is_array($decoded)) {
            return $this->listValues($value);
        }

        return collect($decoded)->flatMap(fn (mixed $item): array => is_array($item)
            ? array_values(array_filter(array_map('strval', $item)))
            : (is_scalar($item) ? [(string) $item] : []))->all();
    }

    private function hasOverlap(array $profile, array $requirements): bool
    {
        foreach ($profile as $value) {
            foreach ($requirements as $required) {
                if ($this->containsText($value, $required)) {
                    return true;
                }
            }
        }

        return false;
    }

    private function containsText(mixed $value, mixed $needle): bool
    {
        return is_scalar($value)
            && is_scalar($needle)
            && str_contains(mb_strtolower((string) $value), mb_strtolower((string) $needle));
    }

    private function educationMeets(string $candidate, string $required): bool
    {
        $levels = ['Lainnya' => 0, 'SMK' => 1, 'D3' => 2, 'S1' => 3, 'S2' => 4, 'S3' => 5];

        return ($levels[$candidate] ?? 0) >= ($levels[$required] ?? 0);
    }

    private function languageLevelMeets(string $candidate, ?string $required): bool
    {
        $levels = [
            'pemula' => 1, 'dasar' => 1, 'basic' => 1, 'a1' => 1, 'a2' => 2,
            'menengah' => 3, 'intermediate' => 3, 'b1' => 3, 'b2' => 4,
            'mahir' => 5, 'advanced' => 5, 'c1' => 5, 'c2' => 6,
        ];
        $candidateLevel = $levels[mb_strtolower(trim($candidate))] ?? 0;
        $requiredLevel = $levels[mb_strtolower(trim((string) $required))] ?? 0;

        return $candidateLevel > 0 && $candidateLevel >= $requiredLevel;
    }
}
