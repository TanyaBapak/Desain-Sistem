<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class Bp3miScope
{
    private const BP3MI_ASSIGNMENT = [
        'BP3MI-JKT' => ['DKI Jakarta'],
        'BP3MI-JABAR' => ['Jawa Barat'],
        'BP3MI-JATIM' => ['Jawa Timur'],
        'BP3MI-JATENG' => ['Jawa Tengah'],
        'BP3MI-BANTEN' => ['Banten'],
        'BP3MI-LAMPUNG' => ['Lampung'],
        'BP3MI-NTB' => ['Nusa Tenggara Barat'],
        'BP3MI-DIY' => ['Daerah Istimewa Yogyakarta'],
        'BP3MI-SULSEL' => ['Sulawesi Selatan'],
        'BP3MI-SUMSEL' => ['Sumatera Selatan'],
    ];

    public function provinceNamesForUser(User $user): array
    {
        $role = $user->roles()->value('name');

        if ($role !== 'task_force') {
            return [];
        }

        $bp3miCode = $user->bp3mi_code ?? null;
        if (! is_string($bp3miCode) || ! isset(self::BP3MI_ASSIGNMENT[$bp3miCode])) {
            abort(403, 'Akun Task Force belum memiliki penetapan BP3MI yang valid.');
        }

        return self::BP3MI_ASSIGNMENT[$bp3miCode];
    }

    public function assignmentOptions(): array
    {
        $labels = [
            'BP3MI-JKT' => 'BP3MI Jakarta',
            'BP3MI-JABAR' => 'BP3MI Jawa Barat',
            'BP3MI-JATIM' => 'BP3MI Jawa Timur',
            'BP3MI-JATENG' => 'BP3MI Jawa Tengah',
            'BP3MI-BANTEN' => 'BP3MI Banten',
            'BP3MI-LAMPUNG' => 'BP3MI Lampung',
            'BP3MI-NTB' => 'BP3MI Nusa Tenggara Barat',
            'BP3MI-DIY' => 'BP3MI Daerah Istimewa Yogyakarta',
            'BP3MI-SULSEL' => 'BP3MI Sulawesi Selatan',
            'BP3MI-SUMSEL' => 'BP3MI Sumatera Selatan',
        ];

        return collect(self::BP3MI_ASSIGNMENT)
            ->map(fn (array $provinces, string $code): array => [
                'code' => $code,
                'name' => $labels[$code],
                'provinces' => $provinces,
            ])
            ->values()
            ->all();
    }

    public function allowsProvinceId(User $user, ?string $provinceId): bool
    {
        if ($provinceId === null) {
            return false;
        }

        $provinceName = DB::table('provinces')->where('id', $provinceId)->value('name');

        return is_string($provinceName) && in_array($provinceName, $this->provinceNamesForUser($user), true);
    }

    public function allowsDemandCountry(User $user, ?string $countryId): bool
    {
        if ($countryId === null) {
            return false;
        }

        $countryName = DB::table('countries')->where('id', $countryId)->value('name');
        if (! is_string($countryName)) {
            return false;
        }

        return DB::table('job_seekers')
            ->join('provinces', 'provinces.id', '=', 'job_seekers.province_id')
            ->whereIn('provinces.name', $this->provinceNamesForUser($user))
            ->whereJsonContains('job_seekers.preferred_countries', $countryName)
            ->exists();
    }

    public function applyToJobSeekers($query, User $user)
    {
        $provinces = $this->provinceNamesForUser($user);
        if ($provinces === []) {
            return $query;
        }

        return $query->whereIn('provinces.name', $provinces);
    }

    public function applyToInstitutions($query, User $user)
    {
        $provinces = $this->provinceNamesForUser($user);
        if ($provinces === []) {
            return $query;
        }

        return $query->whereIn('provinces.name', $provinces);
    }

    public function applyToTrainingPrograms($query, User $user)
    {
        $provinces = $this->provinceNamesForUser($user);
        if ($provinces === []) {
            return $query;
        }

        return $query->whereIn('institutions.province_id', function ($sub) use ($provinces) {
            $sub->select('id')->from('provinces')->whereIn('name', $provinces);
        });
    }

    public function applyToJobDemands($query, User $user)
    {
        $provinces = $this->provinceNamesForUser($user);
        if ($provinces === []) {
            return $query;
        }

        $countries = DB::table('countries')->get(['id', 'name']);
        if ($countries->isEmpty()) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where(function ($demands) use ($countries, $provinces): void {
            foreach ($countries as $country) {
                $demands->orWhere(function ($demand) use ($country, $provinces): void {
                    $demand->where('job_demands.country_id', $country->id)
                        ->whereExists(function ($candidates) use ($country, $provinces): void {
                            $candidates->select(DB::raw(1))
                                ->from('job_seekers')
                                ->join('provinces', 'provinces.id', '=', 'job_seekers.province_id')
                                ->whereIn('provinces.name', $provinces)
                                ->whereJsonContains('job_seekers.preferred_countries', $country->name);
                        });
                });
            }
        });
    }
}
