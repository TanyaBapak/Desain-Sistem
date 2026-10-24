<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class BusinessDataPresenter
{
    public function make(User $user): array
    {
        $role = $user->roles()->value('name');

        return [
            'candidates' => $this->candidates($role, $user),
            'programs' => $this->programs($role, $user),
            'providers' => $this->providers($role, $user),
            'demands' => $this->demands($role, $user),
            'candidateMatches' => $this->candidateMatches($role),
            'allocations' => $this->allocations($role),
            'reportSummary' => $this->reportSummary($role),
            'approvalRequests' => $this->approvalRequests($role),
            'monitoring' => $this->monitoring($role, $user),
            'options' => [
                'provinces' => DB::table('provinces')->orderBy('name')->get(['id', 'name']),
                'districts' => DB::table('districts')->orderBy('name')->get(['id', 'province_id', 'name']),
                'sectors' => DB::table('sectors')->orderBy('name')->get(['id', 'name']),
                'occupations' => DB::table('occupations')->orderBy('title')->get(['id', 'sector_id', 'title']),
                'countries' => DB::table('countries')->orderBy('name')->get(['id', 'name']),
                'institutions' => $this->institutionOptions($role, $user),
            ],
        ];
    }

    private function candidateMatches(?string $role): array
    {
        if (! in_array($role, ['task_force', 'directorate_admin'], true)) {
            return [];
        }

        return DB::table('candidate_matches')
            ->join('job_seekers', 'job_seekers.id', '=', 'candidate_matches.job_seeker_id')
            ->join('job_demands', 'job_demands.id', '=', 'candidate_matches.job_demand_id')
            ->leftJoin('training_classes', 'training_classes.id', '=', 'candidate_matches.training_class_id')
            ->leftJoin('training_programs', 'training_programs.id', '=', 'training_classes.training_program_id')
            ->whereNull('job_seekers.deleted_at')
            ->where('job_seekers.verification_status', 'Verified')
            ->where('job_demands.verification_status', 'Approved')
            ->where('candidate_matches.match_status', 'Rekomendasi')
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
        if (! in_array($role, ['task_force', 'province_admin', 'district_admin', 'institution_admin', 'verifier'], true)) {
            return [];
        }

        return DB::table('job_seekers')
            ->whereNull('deleted_at')
            ->when($role === 'province_admin', fn ($query) => $query->where('job_seekers.province_id', $user->province_id))
            ->when($role === 'district_admin', fn ($query) => $query->where('job_seekers.district_id', $user->district_id))
            ->when($role === 'institution_admin', fn ($query) => $query->where('job_seekers.institution_id', $user->institution_id ?? ''))
            ->leftJoin('provinces', 'provinces.id', '=', 'job_seekers.province_id')
            ->leftJoin('districts', 'districts.id', '=', 'job_seekers.district_id')
            ->orderByDesc('job_seekers.created_at')
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
            ])
            ->map(function (object $row): array {
                return [
                    'id' => $row->id,
                    'nik' => substr($row->nik, 0, 4).'••••••••'.substr($row->nik, -4),
                    'fullName' => $row->full_name,
                    'gender' => $row->gender,
                    'provinsi' => $row->province_name,
                    'kabupatenKota' => $row->district_name,
                    'educationLevel' => $row->education_level,
                    'institutionName' => $row->institution_name,
                    'sourceType' => match ($row->source_type) {
                        'SMK', 'BLK', 'LPK' => 'Lembaga Vokasi',
                        'Mandiri' => 'SMK / Pendidikan Vokasi',
                        'Gardata' => 'Gardata / SIPPMI',
                        default => 'Disnaker Pemda',
                    },
                    'major' => $row->major,
                    'skills' => $this->pluckRelated('job_seeker_skills', 'skill_name', $row->id),
                    'languageProficiency' => DB::table('job_seeker_languages')
                        ->where('job_seeker_id', $row->id)
                        ->get(['language', 'level'])
                        ->map(fn (object $language): array => [
                            'language' => $language->language,
                            'level' => $language->level,
                        ])->all(),
                    'preferredCountry' => $this->decodeArray($row->preferred_countries),
                    'preferredJobRole' => $this->decodeArray($row->preferred_job_roles),
                    'readinessStatus' => $row->readiness_status,
                    'verificationStatus' => $row->verification_status,
                    'lifecycleStatus' => $row->lifecycle_status,
                ];
            })->all();
    }

    private function programs(?string $role, User $user): array
    {
        if (! in_array($role, ['task_force', 'directorate_admin', 'institution_admin', 'training_operator', 'verifier'], true)) {
            return [];
        }

        return DB::table('training_programs')
            ->leftJoin('sectors', 'sectors.id', '=', 'training_programs.sector_id')
            ->leftJoin('occupations', 'occupations.id', '=', 'training_programs.occupation_id')
            ->leftJoin('countries', 'countries.id', '=', 'training_programs.target_country_id')
            ->leftJoin('institutions', 'institutions.id', '=', 'training_programs.institution_id')
            ->where('training_programs.status', '!=', 'Nonaktif')
            ->when(
                in_array($role, ['institution_admin', 'training_operator'], true),
                fn ($query) => $query->where('training_programs.institution_id', $user->institution_id ?? ''),
            )
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
        if (! in_array($role, ['task_force', 'directorate_admin', 'institution_admin', 'verifier'], true)) {
            return [];
        }

        return DB::table('institutions')
            ->leftJoin('provinces', 'provinces.id', '=', 'institutions.province_id')
            ->leftJoin('districts', 'districts.id', '=', 'institutions.district_id')
            ->where('institutions.status', 'Aktif')
            ->when($role === 'institution_admin', fn ($query) => $query->where('institutions.id', $user->institution_id ?? ''))
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
            ->map(function (object $row): array {
                $metadata = $this->decodeArray($row->external_metadata);
                $facilities = DB::table('institution_facilities')
                    ->where('institution_id', $row->id)
                    ->orderBy('facility_name')
                    ->pluck('facility_name')
                    ->all();

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
                    'certifiedInstructorsCount' => $row->instructor_count === null ? null : (int) $row->instructor_count,
                    'facilities' => $facilities,
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
                    'institutionForm' => $metadata['institutionForm'] ?? null,
                    'sectorals' => is_array($metadata['sectorals'] ?? null) ? $metadata['sectorals'] : [],
                    'programs' => is_array($metadata['programs'] ?? null) ? $metadata['programs'] : [],
                    'source' => $row->external_source === 'kp2mi' ? 'kp2mi-api' : 'local',
                ];
            })->all();
    }

    private function demands(?string $role, User $user): array
    {
        if (! in_array($role, ['task_force', 'demand_admin', 'verifier'], true)) {
            return [];
        }

        return DB::table('job_demands')
            ->join('employers', 'employers.id', '=', 'job_demands.employer_id')
            ->leftJoin('countries', 'countries.id', '=', 'job_demands.country_id')
            ->leftJoin('sectors', 'sectors.id', '=', 'job_demands.sector_id')
            ->leftJoin('occupations', 'occupations.id', '=', 'job_demands.occupation_id')
            ->where('job_demands.verification_status', '!=', 'Draft')
            ->when($role === 'demand_admin', fn ($query) => $query->where('job_demands.employer_id', $user->employer_id ?? ''))
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

    private function allocations(?string $role): array
    {
        if (! in_array($role, ['task_force', 'directorate_admin'], true)) {
            return [];
        }

        $candidateIds = DB::table('program_allocation_candidates')
            ->join('program_allocations', 'program_allocations.id', '=', 'program_allocation_candidates.program_allocation_id')
            ->whereNull('program_allocations.deleted_at')
            ->get(['program_allocation_candidates.program_allocation_id', 'program_allocation_candidates.job_seeker_id'])
            ->groupBy('program_allocation_id')
            ->map(fn ($rows): array => $rows->pluck('job_seeker_id')->all());

        return DB::table('program_allocations')
            ->join('job_demands', 'job_demands.id', '=', 'program_allocations.job_demand_id')
            ->leftJoin('training_programs', 'training_programs.id', '=', 'program_allocations.training_program_id')
            ->leftJoin('institutions', 'institutions.id', '=', 'program_allocations.institution_id')
            ->whereNull('program_allocations.deleted_at')
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
        if (! in_array($role, ['task_force', 'directorate_admin', 'institution_admin', 'training_operator'], true)) {
            return [];
        }

        return DB::table('institutions')
            ->where('status', 'Aktif')
            ->when(
                in_array($role, ['institution_admin', 'training_operator'], true),
                fn ($query) => $query->where('id', $user->institution_id ?? ''),
            )
            ->orderBy('name')
            ->get(['id', 'name'])
            ->all();
    }

    private function reportSummary(?string $role): array
    {
        if (! in_array($role, ['leadership', 'task_force', 'directorate_admin', 'auditor'], true)) {
            return [];
        }

        $gardataLastSync = DB::table('integration_sync_logs')
            ->where('source', 'gardata')
            ->orderByDesc('started_at')
            ->first(['status', 'started_at', 'finished_at', 'records_fetched', 'records_inserted', 'records_updated', 'records_skipped']);

        $updatedAt = collect([
            DB::table('job_seekers')->whereNull('deleted_at')->max('updated_at'),
            DB::table('training_programs')->max('updated_at'),
            DB::table('institutions')->max('updated_at'),
            DB::table('job_demands')->max('updated_at'),
            $gardataLastSync?->finished_at,
        ])->filter()->max();

        return [
            'candidateCount' => DB::table('job_seekers')->whereNull('deleted_at')->count(),
            'readyCandidateCount' => DB::table('job_seekers')
                ->whereNull('deleted_at')
                ->where('readiness_status', 'Ready for Placement')
                ->count(),
            'programCount' => DB::table('training_programs')->where('status', 'Aktif')->count(),
            'institutionCount' => DB::table('institutions')->where('status', 'Aktif')->count(),
            'demandCount' => DB::table('job_demands')->where('verification_status', 'Approved')->count(),
            'dashboard' => [
                'candidateLifecycle' => DB::table('job_seekers')
                    ->whereNull('deleted_at')
                    ->select('lifecycle_status')
                    ->selectRaw('COUNT(*) as count')
                    ->groupBy('lifecycle_status')
                    ->orderBy('lifecycle_status')
                    ->get()
                    ->map(fn (object $row): array => [
                        'status' => $row->lifecycle_status,
                        'count' => (int) $row->count,
                    ])->all(),
                'candidatesByProvince' => DB::table('job_seekers')
                    ->leftJoin('provinces', 'provinces.id', '=', 'job_seekers.province_id')
                    ->whereNull('job_seekers.deleted_at')
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
                'institutionsByEvokasiStatus' => DB::table('institutions')
                    ->where('status', 'Aktif')
                    ->select('evokasi_status')
                    ->selectRaw('COUNT(*) as count')
                    ->groupBy('evokasi_status')
                    ->orderBy('evokasi_status')
                    ->get()
                    ->map(fn (object $row): array => [
                        'status' => $row->evokasi_status,
                        'count' => (int) $row->count,
                    ])->all(),
                'institutionDirectory' => DB::table('institutions')
                    ->leftJoin('provinces', 'provinces.id', '=', 'institutions.province_id')
                    ->leftJoin('districts', 'districts.id', '=', 'institutions.district_id')
                    ->where('institutions.status', 'Aktif')
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
                        'institutions.workshop_capacity',
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
                        'capacity' => $row->workshop_capacity === null ? null : (int) $row->workshop_capacity,
                    ])->all(),
                'demandByCountry' => DB::table('job_demands')
                    ->leftJoin('countries', 'countries.id', '=', 'job_demands.country_id')
                    ->where('job_demands.verification_status', 'Approved')
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
                'candidateCount' => DB::table('job_seekers')
                    ->whereNull('deleted_at')
                    ->where('external_source', 'gardata')
                    ->count(),
                'trainingRecordCount' => DB::table('external_training_records')
                    ->where('external_source', 'gardata')
                    ->count(),
                'lastSyncStatus' => $gardataLastSync?->status,
                'lastSyncAt' => $gardataLastSync?->finished_at,
                'recordsFetched' => (int) ($gardataLastSync?->records_fetched ?? 0),
                'recordsInserted' => (int) ($gardataLastSync?->records_inserted ?? 0),
                'recordsUpdated' => (int) ($gardataLastSync?->records_updated ?? 0),
                'recordsSkipped' => (int) ($gardataLastSync?->records_skipped ?? 0),
            ],
            'updatedAt' => $updatedAt,
        ];
    }

    private function approvalRequests(?string $role): array
    {
        if (! in_array($role, ['task_force', 'verifier'], true)) {
            return [];
        }

        return DB::table('approval_requests')
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
            ->map(fn (object $row): array => [
                'id' => $row->id,
                'entityType' => $row->entity_type,
                'entityId' => $row->entity_id,
                'entityTitle' => null,
                'details' => $this->approvalDetails($row->entity_type, $row->entity_id),
                'documents' => $row->entity_type === 'lembaga_vokasi'
                    ? DB::table('institution_registration_documents')
                        ->where('institution_id', $row->entity_id)
                        ->orderBy('document_type')
                        ->get(['id', 'document_type', 'original_name'])
                        ->map(fn (object $document): array => [
                            'id' => (int) $document->id,
                            'type' => $document->document_type,
                            'name' => $document->original_name,
                            'downloadUrl' => route('approvals.documents.download', [
                                'id' => $row->id,
                                'documentId' => $document->id,
                            ]),
                        ])->all()
                    : [],
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
            ])->all();
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
                ['label' => 'Instruktur / kapasitas per batch', 'value' => $details->instructor_count.' / '.$details->workshop_capacity],
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
        if (! in_array($role, ['task_force', 'directorate_admin', 'institution_admin', 'training_operator', 'bp3mi_admin', 'placement_officer'], true)) {
            return [];
        }

        $canViewGardata = in_array($role, ['task_force', 'directorate_admin'], true);
        $externalClasses = DB::table('external_training_records')
            ->where('external_source', 'gardata')
            ->when(! $canViewGardata, fn ($query) => $query->whereRaw('1 = 0'))
            ->orderByDesc('updated_at')
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
            ->leftJoin('training_enrollments', 'training_enrollments.training_class_id', '=', 'training_classes.id')
            ->when(
                in_array($role, ['institution_admin', 'training_operator'], true),
                fn ($query) => $query->where('training_classes.institution_id', $user->institution_id ?? ''),
            )
            ->when(
                in_array($role, ['bp3mi_admin', 'placement_officer'], true),
                fn ($query) => $query->where('institutions.province_id', $user->province_id ?? ''),
            )
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
            ->where('job_seekers.external_source', 'gardata')
            ->orderByDesc('job_seekers.updated_at')
            ->limit(100);
        $gardataCandidates = ($canViewGardata ? $gardataCandidatesQuery : $gardataCandidatesQuery->whereRaw('1 = 0'))
            ->get([
                'job_seekers.id',
                'job_seekers.nik',
                'job_seekers.full_name',
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
                'nik' => strlen($row->nik) === 16 ? substr($row->nik, 0, 4).'••••••••'.substr($row->nik, -4) : '••••',
                'region' => trim(($row->district_name ?? 'Belum diketahui').', '.($row->province_name ?? 'Belum diketahui')),
                'expertise' => $row->major,
                'targetCountry' => $this->decodeArray($row->preferred_countries)[0] ?? 'Belum ditentukan',
                'status' => $row->verification_status,
                'readinessStatus' => $row->readiness_status,
            ])->all();

        $lastSync = $canViewGardata ? DB::table('integration_sync_logs')
            ->where('source', 'gardata')
            ->orderByDesc('started_at')
            ->first(['status', 'started_at', 'finished_at', 'records_fetched', 'records_inserted', 'records_updated', 'records_skipped']) : null;

        $placements = in_array($role, ['task_force', 'directorate_admin', 'bp3mi_admin', 'placement_officer'], true)
            ? DB::table('placement_cases')
                ->join('candidate_matches', 'candidate_matches.id', '=', 'placement_cases.candidate_match_id')
                ->join('job_seekers', 'job_seekers.id', '=', 'candidate_matches.job_seeker_id')
                ->join('job_demands', 'job_demands.id', '=', 'candidate_matches.job_demand_id')
                ->join('employers', 'employers.id', '=', 'job_demands.employer_id')
                ->leftJoin('countries', 'countries.id', '=', 'job_demands.country_id')
                ->leftJoin('occupations', 'occupations.id', '=', 'job_demands.occupation_id')
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

        return [
            'summary' => [
                'totalClasses' => $localClasses->count() + $externalClasses->count(),
                'activeClasses' => $localClasses->where('status', 'Sedang Berjalan')->count()
                    + $externalClasses->where('status', 'IN_PROGRESS')->count(),
                'gardataCandidates' => $canViewGardata
                    ? DB::table('job_seekers')->whereNull('deleted_at')->where('external_source', 'gardata')->count()
                    : 0,
                'verifiedReports' => $canViewGardata
                    ? (int) DB::table('external_training_records')->where('external_source', 'gardata')->sum('verified_reports_count')
                    : 0,
                'averageAttendance' => $localClasses->whereNotNull('averageAttendance')->avg('averageAttendance'),
                'averageAssessmentScore' => $localClasses->whereNotNull('averageAssessmentScore')->avg('averageAssessmentScore'),
                'gardataTargetJp' => (int) $externalClasses->sum('targetJp'),
                'gardataAchievedJp' => (int) $externalClasses->sum('achievedJp'),
            ],
            'classes' => $localClasses->concat($externalClasses)->values()->all(),
            'candidates' => $gardataCandidates,
            'placements' => $placements,
            'lastSync' => $lastSync ? [
                'status' => $lastSync->status,
                'startedAt' => $lastSync->started_at,
                'finishedAt' => $lastSync->finished_at,
                'recordsFetched' => (int) $lastSync->records_fetched,
                'recordsInserted' => (int) $lastSync->records_inserted,
                'recordsUpdated' => (int) $lastSync->records_updated,
                'recordsSkipped' => (int) $lastSync->records_skipped,
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
