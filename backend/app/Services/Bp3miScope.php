<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
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

    /**
     * Kode provinsi Kemendagri per area BP3MI. Filter data memakai kode ini
     * agar tidak bergantung pada teks nama provinsi.
     */
    private const BP3MI_PROVINCE_IDS = [
        'BP3MI-JKT' => ['31'],
        'BP3MI-JABAR' => ['32'],
        'BP3MI-JATIM' => ['35'],
        'BP3MI-JATENG' => ['33'],
        'BP3MI-BANTEN' => ['36'],
        'BP3MI-LAMPUNG' => ['18'],
        'BP3MI-NTB' => ['52'],
        'BP3MI-DIY' => ['34'],
        'BP3MI-SULSEL' => ['73'],
        'BP3MI-SUMSEL' => ['16'],
    ];

    public function activeCodeForUser(User $user): ?string
    {
        $role = $user->roles()->value('name');
        $isTaskForce = $role === 'task_force';
        $isNationalScope = $user->scope_level === 'national';

        if (! $isTaskForce && ! $isNationalScope) {
            return null;
        }

        /** @var Request $request */
        $request = request();
        $sessionKey = 'active_bp3mi_area_'.$user->id;
        $requestedCode = $request->query('bp3mi_area');

        if ($requestedCode !== null) {
            if ($isNationalScope && ! $isTaskForce && $requestedCode === 'all') {
                if ($request->hasSession()) {
                    $request->session()->forget($sessionKey);
                }

                return null;
            }
            if (! is_string($requestedCode) || ! isset(self::BP3MI_ASSIGNMENT[$requestedCode])) {
                abort(422, 'Area BP3MI yang dipilih tidak valid.');
            }

            if ($request->hasSession()) {
                $request->session()->put($sessionKey, $requestedCode);
            }

            return $requestedCode;
        }

        $activeCode = $request->hasSession()
            ? $request->session()->get($sessionKey)
            : null;

        if ($isNationalScope && ! $isTaskForce) {
            return is_string($activeCode) && isset(self::BP3MI_ASSIGNMENT[$activeCode])
                ? $activeCode
                : null;
        }

        if (! is_string($activeCode) || ! isset(self::BP3MI_ASSIGNMENT[$activeCode])) {
            $legacyCode = $user->bp3mi_code;
            $activeCode = is_string($legacyCode) && isset(self::BP3MI_ASSIGNMENT[$legacyCode])
                ? $legacyCode
                : 'BP3MI-JABAR';

            if ($request->hasSession()) {
                $request->session()->put($sessionKey, $activeCode);
            }
        }

        return $activeCode;
    }

    public function hasActiveAreaFilter(User $user): bool
    {
        return $this->activeCodeForUser($user) !== null;
    }

    public function codesForUser(User $user): array
    {
        $activeCode = $this->activeCodeForUser($user);

        return $activeCode === null ? [] : [$activeCode];
    }

    public function provinceNamesForUser(User $user): array
    {
        return collect($this->codesForUser($user))
            ->flatMap(fn (string $code): array => self::BP3MI_ASSIGNMENT[$code])
            ->unique()
            ->values()
            ->all();
    }

    public function provinceIdsForUser(User $user): array
    {
        $activeCode = $this->activeCodeForUser($user);

        return $activeCode === null ? [] : self::BP3MI_PROVINCE_IDS[$activeCode];
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
        if ($user->roles()->value('name') !== 'task_force' || ! $this->hasActiveAreaFilter($user)) {
            return true;
        }

        return in_array((string) $provinceId, $this->provinceIdsForUser($user), true);
    }

    public function allowsDemandCountry(User $user, ?string $countryId): bool
    {
        if ($user->roles()->value('name') !== 'task_force' || ! $this->hasActiveAreaFilter($user)) {
            return true;
        }
        if ($countryId === null) {
            return false;
        }

        $countryName = DB::table('countries')->where('id', $countryId)->value('name');
        if (! is_string($countryName)) {
            return false;
        }

        $provinceIds = $this->provinceIdsForUser($user);
        if ($provinceIds === []) {
            return false;
        }

        return DB::table('job_seekers')
            ->whereIn('job_seekers.province_id', $provinceIds)
            ->whereJsonContains('job_seekers.preferred_countries', $countryName)
            ->exists();
    }

    public function applyToJobSeekers($query, User $user)
    {
        if (! $this->hasActiveAreaFilter($user)) {
            return $query;
        }
        $provinceIds = $this->provinceIdsForUser($user);
        if ($provinceIds === []) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereIn('job_seekers.province_id', $provinceIds);
    }

    public function applyToInstitutions($query, User $user)
    {
        if (! $this->hasActiveAreaFilter($user)) {
            return $query;
        }
        $provinceIds = $this->provinceIdsForUser($user);
        if ($provinceIds === []) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereIn('institutions.province_id', $provinceIds);
    }

    public function applyToTrainingPrograms($query, User $user)
    {
        if (! $this->hasActiveAreaFilter($user)) {
            return $query;
        }
        $provinceIds = $this->provinceIdsForUser($user);
        if ($provinceIds === []) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereIn('institutions.province_id', $provinceIds);
    }

    public function applyToJobDemands($query, User $user)
    {
        if (! $this->hasActiveAreaFilter($user)) {
            return $query;
        }
        $provinceIds = $this->provinceIdsForUser($user);
        if ($provinceIds === []) {
            return $query->whereRaw('1 = 0');
        }

        $countries = DB::table('countries')->get(['id', 'name']);
        if ($countries->isEmpty()) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where(function ($demands) use ($countries, $provinceIds): void {
            foreach ($countries as $country) {
                $demands->orWhere(function ($demand) use ($country, $provinceIds): void {
                    $demand->where('job_demands.country_id', $country->id)
                        ->whereExists(function ($candidates) use ($country, $provinceIds): void {
                            $candidates->select(DB::raw(1))
                                ->from('job_seekers')
                                ->whereIn('job_seekers.province_id', $provinceIds)
                                ->whereJsonContains('job_seekers.preferred_countries', $country->name);
                        });
                });
            }
        });
    }
}
