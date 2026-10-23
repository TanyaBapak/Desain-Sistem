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
            'reportSummary' => $this->reportSummary($role),
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
                'institutions.evokasi_status',
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
                    'accreditation' => $row->accreditation,
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

        $updatedAt = collect([
            DB::table('job_seekers')->whereNull('deleted_at')->max('updated_at'),
            DB::table('training_programs')->max('updated_at'),
            DB::table('institutions')->max('updated_at'),
            DB::table('job_demands')->max('updated_at'),
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
            'updatedAt' => $updatedAt,
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
