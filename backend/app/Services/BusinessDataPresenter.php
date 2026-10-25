<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class BusinessDataPresenter
{
    public function __construct(private readonly Bp3miScope $bp3miScope = new Bp3miScope())
    {
    }

    public function make(User $user): array
    {
        $role = $user->roles()->value('name');
        $cacheKey = $this->cacheKey($user, $role);

        return Cache::remember($cacheKey, 30, function () use ($role, $user): array {
            return [
                'candidates' => $this->candidates($role, $user),
                'programs' => $this->programs($role, $user),
                'providers' => $this->providers($role, $user),
                'demands' => $this->demands($role, $user),
                'candidateMatches' => $this->candidateMatches($role, $user),
                'allocations' => $this->allocations($role, $user),
                'reportSummary' => $this->reportSummary($role, $user),
                'approvalRequests' => $this->approvalRequests($role, $user),
                'monitoring' => $this->monitoring($role, $user),
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
                    'code' => $user->bp3mi_code,
                ],
            ];
        });
    }

    public function forget(User $user): void
    {
        Cache::forget($this->cacheKey($user, $user->roles()->value('name')));
    }

    private function cacheKey(User $user, ?string $role): string
    {
        return 'business_data:'.$user->id.':'.($role ?? 'none').':'.($user->province_id ?? 'na').':'.($user->district_id ?? 'na').':'.($user->institution_id ?? 'na').':'.($user->employer_id ?? 'na').':'.($user->bp3mi_code ?? 'na');
    }

    private function candidateMatches(?string $role, User $user): array
    {
        if (! in_array($role, ['super_admin', 'task_force', 'directorate_admin'], true)) {
            return [];
        }

        $query = DB::table('candidate_matches')
            ->join('job_seekers', 'job_seekers.id', '=', 'candidate_matches.job_seeker_id')
            ->join('job_demands', 'job_demands.id', '=', 'candidate_matches.job_demand_id')
            ->leftJoin('provinces', 'provinces.id', '=', 'job_seekers.province_id')
            ->leftJoin('training_classes', 'training_classes.id', '=', 'candidate_matches.training_class_id')
            ->leftJoin('training_programs', 'training_programs.id', '=', 'training_classes.training_program_id')
            ->whereNull('job_seekers.deleted_at')
            ->where('job_seekers.verification_status', 'Verified')
            ->where('job_demands.verification_status', 'Approved')
            ->where('candidate_matches.match_status', 'Rekomendasi');

        if ($role === 'task_force') {
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

    private function candidates(?string $role, User $user): array
    {
        if (! in_array($role, ['super_admin', 'leadership', 'task_force', 'province_admin', 'district_admin', 'institution_admin', 'verifier'], true)) {
            return [];
        }

        $rows = DB::table('job_seekers')
            ->whereNull('deleted_at')
            ->when($role === 'province_admin', fn ($query) => $query->where('job_seekers.province_id', $user->province_id))
            ->when($role === 'district_admin', fn ($query) => $query->where('job_seekers.district_id', $user->district_id))
            ->when($role === 'institution_admin', fn ($query) => $query->where('job_seekers.institution_id', $user->institution_id ?? ''))
            ->leftJoin('provinces', 'provinces.id', '=', 'job_seekers.province_id')
            ->leftJoin('districts', 'districts.id', '=', 'job_seekers.district_id')
            ->when($role === 'task_force', fn ($query) => $this->bp3miScope->applyToJobSeekers($query, $user))
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
                    'SMK', 'BLK', 'LPK' => 'Lembaga Vokasi',
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
                fn ($q) => $q->where('training_programs.institution_id', $user->institution_id ?? ''),
            )
            ->when($role === 'task_force', fn ($q) => $this->bp3miScope->applyToTrainingPrograms($q, $user));

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
                'targetSector' => $row->sector_name,
                'targetJobRole' => $row->occupation_title,
                'targetCountry' => $row->country_name,
                'institutionId' => $row->institution_id,
                'institutionName' => $row->institution_name,
                'durationJP' => (int) $row->total_jp,
                'certificationTarget' => $row->certification_target,
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
            ->when($role === 'institution_admin', fn ($q) => $q->where('institutions.id', $user->institution_id ?? ''))
            ->when($role === 'task_force', fn ($q) => $this->bp3miScope->applyToInstitutions($q, $user));

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
                    }
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
            ->when($role === 'task_force', fn ($q) => $this->bp3miScope->applyToJobDemands($q, $user));

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
            ->when($role === 'task_force', fn ($q) => $this->bp3miScope->applyToJobSeekers($q, $user))
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
            ->when($role === 'task_force', function ($q) use ($user, &$candidateIds, $allCandidateCounts) {
                $candidateIds = $candidateIds->filter(
                    fn (array $ids, $allocationId): bool => $ids !== []
                        && count($ids) === (int) $allCandidateCounts->get($allocationId, 0),
                );
                $allocIds = $candidateIds->keys()->all();
                $this->bp3miScope->applyToInstitutions($q, $user);
                $demandIds = DB::table('job_demands');
                $this->bp3miScope->applyToJobDemands($demandIds, $user);
                $q->whereIn('program_allocations.id', $allocIds)
                    ->whereIn('program_allocations.job_demand_id', $demandIds->select('job_demands.id'));
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
        if ($role === 'task_force') {
            $this->bp3miScope->applyToInstitutions($query, $user);
        }

        return $query
            ->orderBy('institutions.name')
            ->get(['institutions.id', 'institutions.name'])
            ->all();
    }

    private function reportSummary(?string $role, User $user): array
    {
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

        if ($role === 'task_force') {
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
        if ($role === 'task_force') {
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
                'candidatesByProvince' => (clone $candidates)
                    ->selectRaw("COALESCE(provinces.name, 'Belum dipetakan') as province")
                    ->selectRaw('COUNT(*) as count')
                    ->groupBy('provinces.name')
                    ->orderByDesc('count')
                    ->orderBy('province')
                    ->limit(8)
                    ->get()
                    ->map(fn (object $row): array => [
                        'province' => $row->province,
                        'count' => (int) $row->count,
                    ])->all(),
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

    private function approvalRequests(?string $role, User $user): array
    {
        if (! in_array($role, ['super_admin', 'task_force', 'verifier'], true)) {
            return [];
        }

        $registrationDocumentQuery = DB::table('institution_registration_documents');
        $requests = DB::table('approval_requests');
        if ($role === 'task_force') {
            $provinceNames = $this->bp3miScope->provinceNamesForUser($user);
            $candidateIds = DB::table('job_seekers')
                ->join('provinces', 'provinces.id', '=', 'job_seekers.province_id')
                ->whereNull('job_seekers.deleted_at')
                ->whereIn('provinces.name', $provinceNames)
                ->select('job_seekers.id');
            $institutionIds = DB::table('institutions')
                ->join('provinces', 'provinces.id', '=', 'institutions.province_id')
                ->whereIn('provinces.name', $provinceNames)
                ->select('institutions.id');
            $programIds = DB::table('training_programs')
                ->join('institutions', 'institutions.id', '=', 'training_programs.institution_id')
                ->join('provinces', 'provinces.id', '=', 'institutions.province_id')
                ->whereIn('provinces.name', $provinceNames)
                ->select('training_programs.id');
            $demandIds = DB::table('job_demands');
            $this->bp3miScope->applyToJobDemands($demandIds, $user);

            $requests->where(function ($query) use ($candidateIds, $institutionIds, $programIds, $demandIds): void {
                $query->where(fn ($item) => $item->where('entity_type', 'calon_peserta')->whereIn('entity_id', $candidateIds))
                    ->orWhere(fn ($item) => $item->where('entity_type', 'lembaga_vokasi')->whereIn('entity_id', $institutionIds))
                    ->orWhere(fn ($item) => $item->where('entity_type', 'program_pelatihan')->whereIn('entity_id', $programIds))
                    ->orWhere(fn ($item) => $item->where('entity_type', 'demand_luar_negeri')->whereIn('entity_id', $demandIds->select('job_demands.id')));
            });
            $registrationDocumentQuery->whereIn('institution_id', $institutionIds);
        }

        $registrationDocuments = $registrationDocumentQuery
            ->orderBy('document_type')
            ->get(['id', 'institution_id', 'document_type', 'original_name'])
            ->groupBy('institution_id');

        return $requests
            ->orderByRaw("CASE WHEN status = 'PENDING' THEN 0 ELSE 1 END")
            ->orderByDesc('submitted_at')
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
            ])
            ->map(function (object $row) use ($registrationDocuments): array {
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

                return [
                    'id' => $row->id,
                    'entityType' => $row->entity_type,
                    'entityId' => $row->entity_id,
                    'entityTitle' => null,
                    'details' => $this->approvalDetails($row->entity_type, $row->entity_id),
                    'documents' => $docs,
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

    private function approvalDetails(string $entityType, string $entityId): array
    {
        $details = match ($entityType) {
            'calon_peserta' => DB::table('job_seekers')
                ->leftJoin('provinces', 'provinces.id', '=', 'job_seekers.province_id')
                ->leftJoin('districts', 'districts.id', '=', 'job_seekers.district_id')
                ->where('job_seekers.id', $entityId)
                ->first([
                    'job_seekers.full_name',
                    'job_seekers.nik',
                    'job_seekers.major',
                    'job_seekers.education_level',
                    'job_seekers.verification_status',
                    'provinces.name as province_name',
                    'districts.name as district_name',
                ]),
            'lembaga_vokasi' => DB::table('institutions')
                ->leftJoin('provinces', 'provinces.id', '=', 'institutions.province_id')
                ->leftJoin('districts', 'districts.id', '=', 'institutions.district_id')
                ->where('institutions.id', $entityId)
                ->first([
                    'institutions.name',
                    'institutions.institution_type',
                    'institutions.verification_status',
                    'institutions.npsn_or_vin',
                    'institutions.ownership_type',
                    'institutions.address',
                    'institutions.head_name',
                    'institutions.email',
                    'institutions.phone',
                    'institutions.accreditation',
                    'institutions.procurement_method',
                    'institutions.instructor_count',
                    'institutions.workshop_capacity',
                    'institutions.class_count',
                    'institutions.ready_participant_count',
                    'provinces.name as province_name',
                    'districts.name as district_name',
                ]),
            'program_pelatihan' => DB::table('training_programs')
                ->leftJoin('sectors', 'sectors.id', '=', 'training_programs.sector_id')
                ->leftJoin('occupations', 'occupations.id', '=', 'training_programs.occupation_id')
                ->leftJoin('countries', 'countries.id', '=', 'training_programs.target_country_id')
                ->where('training_programs.id', $entityId)
                ->first([
                    'training_programs.name',
                    'training_programs.total_jp',
                    'training_programs.quota',
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
                    'employers.name as employer_name',
                    'countries.name as country_name',
                    'occupations.title as occupation_title',
                    'job_demands.headcount',
                    'job_demands.deadline',
                    'job_demands.verification_status',
                ]),
        };
        if (! $details) {
            return [];
        }

        return match ($entityType) {
            'calon_peserta' => [
                ['label' => 'Nama peserta', 'value' => $details->full_name],
                ['label' => 'NIK', 'value' => strlen($details->nik) === 16
                    ? substr($details->nik, 0, 4).'••••••••'.substr($details->nik, -4)
                    : '••••'],
                ['label' => 'Pendidikan / keahlian', 'value' => $details->education_level.' / '.$details->major],
                ['label' => 'Wilayah', 'value' => trim(($details->district_name ?? 'Belum diketahui').', '.($details->province_name ?? 'Belum diketahui'))],
                ['label' => 'Status verifikasi', 'value' => $details->verification_status],
            ],
            'lembaga_vokasi' => [
                ['label' => 'Nama lembaga', 'value' => $details->name],
                ['label' => 'Jenis lembaga', 'value' => $details->institution_type],
                ['label' => 'NPSN / nomor izin', 'value' => $details->npsn_or_vin],
                ['label' => 'Kepemilikan', 'value' => $details->ownership_type],
                ['label' => 'Wilayah', 'value' => trim(($details->district_name ?? 'Belum diketahui').', '.($details->province_name ?? 'Belum diketahui'))],
                ['label' => 'Alamat', 'value' => $details->address],
                ['label' => 'Penanggung jawab', 'value' => $details->head_name],
                ['label' => 'Kontak lembaga', 'value' => trim(($details->email ?? '—').' / '.($details->phone ?? '—'))],
                ['label' => 'Akreditasi', 'value' => $details->accreditation],
                ['label' => 'Skema penyelenggaraan', 'value' => $details->procurement_method],
                ['label' => 'Jumlah kelas', 'value' => $details->class_count ?? 'Belum tersedia'],
                ['label' => 'Peserta siap mengikuti pelatihan', 'value' => $details->ready_participant_count ?? 'Belum tersedia'],
                ['label' => 'Jumlah instruktur', 'value' => $details->instructor_count ?? 'Belum tersedia'],
                ['label' => 'Status verifikasi', 'value' => $details->verification_status],
            ],
            'program_pelatihan' => [
                ['label' => 'Nama program', 'value' => $details->name],
                ['label' => 'Sektor / jabatan', 'value' => trim(($details->sector_name ?? 'Belum dipetakan').' / '.($details->occupation_title ?? 'Belum dipetakan'))],
                ['label' => 'Negara tujuan', 'value' => $details->country_name],
                ['label' => 'Jam pelajaran / kuota', 'value' => $details->total_jp.' JP / '.$details->quota.' peserta'],
            ],
            'demand_luar_negeri' => [
                ['label' => 'Pemberi kerja', 'value' => $details->employer_name],
                ['label' => 'Jabatan', 'value' => $details->occupation_title],
                ['label' => 'Negara tujuan', 'value' => $details->country_name],
                ['label' => 'Kuota / batas waktu', 'value' => $details->headcount.' orang / '.$details->deadline],
                ['label' => 'Status verifikasi', 'value' => $details->verification_status],
            ],
        };
    }

    private function monitoring(?string $role, User $user): array
    {
        if (! in_array($role, ['super_admin', 'task_force', 'directorate_admin', 'institution_admin', 'training_operator', 'bp3mi_admin', 'placement_officer'], true)) {
            return [];
        }

        $canViewGardata = in_array($role, ['super_admin', 'task_force', 'directorate_admin'], true);
        $externalClasses = DB::table('external_training_records')
            ->whereIn('external_training_records.external_source', ['gardata', 'sippmi'])
            ->when(! $canViewGardata, fn ($query) => $query->whereRaw('1 = 0'));
        if ($role === 'task_force') {
            $externalClasses
                ->join('job_seekers', 'job_seekers.id', '=', 'external_training_records.job_seeker_id')
                ->leftJoin('provinces', 'provinces.id', '=', 'job_seekers.province_id')
                ->whereNull('job_seekers.deleted_at');
            $this->bp3miScope->applyToJobSeekers($externalClasses, $user);
        }

        $externalClasses = $externalClasses
            ->select('external_training_records.*')
            ->orderByDesc('external_training_records.updated_at')
            ->get()
            ->groupBy('external_batch_id')
            ->map(fn ($records): array => [
                'id' => 'gardata-'.$records->first()->external_batch_id,
                'source' => 'Gardata / SIPPMI',
                'classCode' => $records->first()->class_code ?? $records->first()->external_batch_id,
                'name' => $records->first()->batch_name,
                'sector' => $records->first()->sector_name ?? $records->first()->program_name ?? 'Belum dipetakan',
                'startDate' => $records->first()->start_date,
                'endDate' => $records->first()->end_date,
                'targetJp' => (int) $records->max('target_jp'),
                'achievedJp' => (int) $records->sum('achieved_jp'),
                'participantCount' => $records->count(),
                'verifiedReportsCount' => (int) $records->sum('verified_reports_count'),
                'averageAttendance' => null,
                'averageAssessmentScore' => null,
                'status' => $records->first()->status,
            ])->values();

        $localClasses = DB::table('training_classes')
            ->join('training_programs', 'training_programs.id', '=', 'training_classes.training_program_id')
            ->leftJoin('institutions', 'institutions.id', '=', 'training_classes.institution_id')
            ->leftJoin('provinces', 'provinces.id', '=', 'institutions.province_id')
            ->leftJoin('training_enrollments', 'training_enrollments.training_class_id', '=', 'training_classes.id')
            ->when(
                in_array($role, ['institution_admin', 'training_operator'], true),
                fn ($query) => $query->where('training_classes.institution_id', $user->institution_id ?? ''),
            )
            ->when(
                in_array($role, ['bp3mi_admin', 'placement_officer'], true),
                fn ($query) => $query->where('institutions.province_id', $user->province_id ?? ''),
            )
            ;
        if ($role === 'task_force') {
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
            ])
            ->selectRaw('COUNT(training_enrollments.id) as participant_count')
            ->selectRaw('AVG(training_enrollments.attendance_percent) as average_attendance')
            ->selectRaw('AVG(training_enrollments.assessment_score) as average_assessment_score')
            ->groupBy(
                'training_classes.id',
                'training_classes.class_name',
                'training_classes.start_date',
                'training_classes.end_date',
                'training_classes.status',
                'training_programs.name',
                'training_programs.total_jp',
                'institutions.name',
            )
            ->orderByDesc('training_classes.start_date')
            ->get()
            ->map(fn (object $row): array => [
                'id' => 'internal-'.$row->id,
                'source' => 'SMK Go Global',
                'classCode' => $row->id,
                'name' => $row->class_name,
                'sector' => $row->program_name,
                'startDate' => $row->start_date,
                'endDate' => $row->end_date,
                'targetJp' => (int) $row->total_jp,
                'achievedJp' => null,
                'participantCount' => (int) $row->participant_count,
                'verifiedReportsCount' => 0,
                'averageAttendance' => $row->average_attendance === null ? null : (float) $row->average_attendance,
                'averageAssessmentScore' => $row->average_assessment_score === null ? null : (float) $row->average_assessment_score,
                'status' => $row->status,
            ]);

        $gardataCandidatesQuery = DB::table('job_seekers')
            ->leftJoin('provinces', 'provinces.id', '=', 'job_seekers.province_id')
            ->leftJoin('districts', 'districts.id', '=', 'job_seekers.district_id')
            ->whereNull('job_seekers.deleted_at')
            ->whereIn('job_seekers.external_source', ['gardata', 'sippmi'])
            ->orderByDesc('job_seekers.updated_at')
            ->limit(100);
        $gardataCandidateCountQuery = DB::table('job_seekers')
            ->whereNull('job_seekers.deleted_at')
            ->whereIn('job_seekers.external_source', ['gardata', 'sippmi']);
        if ($role === 'task_force') {
            $this->bp3miScope->applyToJobSeekers($gardataCandidatesQuery, $user);
            $gardataCandidateCountQuery
                ->join('provinces', 'provinces.id', '=', 'job_seekers.province_id');
            $this->bp3miScope->applyToJobSeekers($gardataCandidateCountQuery, $user);
        }
        $gardataCandidates = ($canViewGardata ? $gardataCandidatesQuery : $gardataCandidatesQuery->whereRaw('1 = 0'))
            ->get([
                'job_seekers.id',
                'job_seekers.nik',
                'job_seekers.full_name',
                'job_seekers.institution_name',
                'job_seekers.major',
                'job_seekers.readiness_status',
                'job_seekers.verification_status',
                'job_seekers.preferred_countries',
                'provinces.name as province_name',
                'districts.name as district_name',
            ])
            ->map(fn (object $row): array => [
                'id' => $row->id,
                'fullName' => $row->full_name,
                'institutionName' => $row->institution_name,
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
                    $role === 'task_force',
                    fn ($query) => $this->bp3miScope->applyToJobSeekers($query, $user),
                )
                ->when(
                    in_array($role, ['bp3mi_admin', 'placement_officer'], true),
                    fn ($query) => $query->where('job_seekers.province_id', $user->province_id ?? ''),
                )
                ->whereNull('job_seekers.deleted_at')
                ->orderByDesc('placement_cases.started_at')
                ->get([
                    'placement_cases.id',
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
                    'candidateName' => $row->candidate_name,
                    'occupation' => $row->occupation ?? 'Belum dipetakan',
                    'country' => $row->country ?? 'Belum ditentukan',
                    'employer' => $row->employer,
                    'status' => $row->status,
                    'flightDate' => $row->flight_date,
                    'siskop2miId' => $row->siskop2mi_id,
                ])->all()
            : [];

        $activeExternalCount = $externalClasses->filter(fn ($class) => in_array(
            strtoupper((string) ($class['status'] ?? '')),
            ['IN_PROGRESS', 'BERJALAN', 'RUNNING', 'ACTIVE', 'GRADUATED'],
            true,
        ))->count();

        $tenants = collect(GardataPlacementSyncService::KNOWN_SUBDOMAINS)->map(function (array $t): array {
            $inst = DB::table('institutions')->where('external_id', $t['subdomain'])->first();
            $candCount = DB::table('job_seekers')
                ->where(function ($q) use ($t) {
                    $q->where('institution_name', $t['name'])
                        ->orWhere('external_id', 'LIKE', '%'.$t['subdomain'].'%');
                })
                ->count();
            $classCount = DB::table('external_training_records')
                ->where(function ($q) use ($t) {
                    $q->where('batch_name', 'LIKE', '%'.$t['name'].'%')
                        ->orWhere('program_name', 'LIKE', '%'.$t['name'].'%');
                })
                ->count();

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
                'lastSyncAt' => now()->toIso8601String(),
            ];
        })->all();

        return [
            'summary' => [
                'totalClasses' => $localClasses->count() + $externalClasses->count(),
                'activeClasses' => $localClasses->whereIn('status', ['Sedang Berjalan', 'berjalan', 'aktif', 'Aktif'])->count()
                    + $activeExternalCount,
                'gardataCandidates' => $canViewGardata
                    ? $gardataCandidateCountQuery->count('job_seekers.id')
                    : 0,
                'verifiedReports' => $canViewGardata
                    ? (int) $externalClasses->sum('verifiedReportsCount')
                    : 0,
                'averageAttendance' => $localClasses->whereNotNull('averageAttendance')->avg('averageAttendance'),
                'averageAssessmentScore' => $localClasses->whereNotNull('averageAssessmentScore')->avg('averageAssessmentScore'),
                'gardataTargetJp' => (int) $externalClasses->sum('targetJp'),
                'gardataAchievedJp' => (int) $externalClasses->sum('achievedJp'),
                'totalLpk' => 8,
                'activeLpk' => count(array_filter($tenants, fn ($t) => ($t['status'] ?? '') === 'Aktif')),
                'tenantDbSizeEstimate' => '6.7 MB',
            ],
            'classes' => $localClasses->concat($externalClasses)->values()->all(),
            'candidates' => $gardataCandidates,
            'tenants' => $tenants,
            'placements' => $placements,
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
