<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class ProviderRecommendationService
{
    public function __construct(private readonly Bp3miScope $bp3miScope = new Bp3miScope) {}

    public function recommend(array $filters, ?User $user = null): array
    {
        $occupationId = $filters['occupation_id'] ?? null;
        $sectorId = $filters['sector_id'] ?? null;
        $province = $filters['province'] ?? null;
        $countryId = $filters['country_id'] ?? null;

        $query = DB::table('training_programs')
            ->join('institutions', 'institutions.id', '=', 'training_programs.institution_id')
            ->leftJoin('provinces', 'provinces.id', '=', 'institutions.province_id')
            ->leftJoin('districts', 'districts.id', '=', 'institutions.district_id')
            ->leftJoin('sectors', 'sectors.id', '=', 'training_programs.sector_id')
            ->leftJoin('occupations', 'occupations.id', '=', 'training_programs.occupation_id')
            ->where('institutions.status', 'Aktif')
            ->where('training_programs.status', 'Aktif')
            ->when($occupationId, fn ($q) => $q->where('training_programs.occupation_id', $occupationId))
            ->when(! $occupationId && $sectorId, fn ($q) => $q->where('training_programs.sector_id', $sectorId))
            ->when($province, fn ($q) => $q->where('provinces.name', $province))
            ->when($countryId, fn ($q) => $q->where('training_programs.target_country_id', $countryId));

        if ($user) {
            if ($this->bp3miScope->hasActiveAreaFilter($user)) {
                $this->bp3miScope->applyToInstitutions($query, $user);
            }
        }

        return $query
            ->select([
                'institutions.id as institution_id',
                'institutions.name as institution_name',
                'institutions.institution_type',
                'institutions.evokasi_status',
                'institutions.verification_status',
                'institutions.readiness_score',
                'institutions.class_count',
                'institutions.workshop_capacity',
                'institutions.instructor_count',
                'provinces.name as province_name',
                'districts.name as district_name',
                'training_programs.id as training_program_id',
                'training_programs.name as program_name',
                'occupations.id as occupation_id',
                'occupations.title as occupation_title',
                'sectors.id as sector_id',
                'sectors.name as sector_name',
                'training_programs.quota',
                'training_programs.enrolled_count',
                'training_programs.total_jp',
                'training_programs.target_country_id',
                'training_programs.program_type',
            ])
            ->orderByDesc('institutions.readiness_score')
            ->orderBy('institutions.name')
            ->get()
            ->map(function (object $row): array {
                $quota = (int) ($row->quota ?? 0);
                $enrolled = (int) ($row->enrolled_count ?? 0);
                $remaining = $quota - $enrolled;
                if ($remaining < 0) {
                    $remaining = 0;
                }

                return [
                    'institutionId' => $row->institution_id,
                    'institutionName' => $row->institution_name,
                    'institutionType' => $row->institution_type,
                    'provinsi' => $row->province_name ?? 'Belum diketahui',
                    'kabupatenKota' => $row->district_name ?? 'Belum diketahui',
                    'evokasiStatus' => $row->evokasi_status,
                    'verificationStatus' => $row->verification_status,
                    'readinessScore' => $row->readiness_score === null ? null : (int) $row->readiness_score,
                    'classCount' => $row->class_count === null ? null : (int) $row->class_count,
                    'workshopCapacity' => $row->workshop_capacity === null ? null : (int) $row->workshop_capacity,
                    'instructorCount' => $row->instructor_count === null ? null : (int) $row->instructor_count,
                    'trainingProgramId' => $row->training_program_id,
                    'programName' => $row->program_name,
                    'occupationId' => $row->occupation_id,
                    'occupation' => $row->occupation_title,
                    'sectorId' => $row->sector_id,
                    'sector' => $row->sector_name,
                    'quota' => $quota,
                    'enrolledCount' => $enrolled,
                    'remainingCapacity' => $remaining,
                    'totalJp' => $row->total_jp === null ? null : (int) $row->total_jp,
                    'targetCountryId' => $row->target_country_id,
                    'programType' => $row->program_type,
                    'available' => $remaining > 0,
                ];
            })
            ->all();
    }
}
