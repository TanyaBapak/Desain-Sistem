<?php

namespace App\Http\Controllers;

use App\Services\BusinessDataPresenter;
use App\Services\DashboardTargetService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DashboardTargetController extends Controller
{
    public function update(
        Request $request,
        DashboardTargetService $targets,
        BusinessDataPresenter $businessDataPresenter,
    ): RedirectResponse {
        $user = $request->user();
        abort_unless($user && $user->roles()->where('name', 'super_admin')->exists(), 403);

        $data = $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2200'],
            'targets.registeredJobSeekers' => ['required', 'integer', 'min:1', 'max:999999999'],
            'targets.readyForPlacement' => ['required', 'integer', 'min:1', 'max:999999999'],
            'targets.activeTrainingPrograms' => ['required', 'integer', 'min:1', 'max:999999999'],
            'targets.activeVocationalInstitutions' => ['required', 'integer', 'min:1', 'max:999999999'],
            'targets.nationalLpkCount' => ['required', 'integer', 'min:1', 'max:999999999'],
            'targets.validatedDemandCount' => ['required', 'integer', 'min:1', 'max:999999999'],
            'targets.placementTargets' => ['present', 'array'],
            'targets.placementTargets.*.id' => ['nullable', 'integer', 'min:1'],
            'targets.placementTargets.*.sectorName' => ['required', 'string', 'max:150'],
            'targets.placementTargets.*.occupationName' => ['required', 'string', 'max:150'],
            'targets.placementTargets.*.projectionPlacement' => ['required', 'string', 'max:255'],
            'targets.placementTargets.*.target' => ['required', 'integer', 'min:0', 'max:999999999'],
            'targets.projectionCountries' => ['sometimes', 'array'],
            'targets.projectionCountries.*' => ['required', 'string', 'max:150'],
            'targets.countrySectors' => ['sometimes', 'array'],
            'targets.countrySectors.*' => ['required', 'array'],
            'targets.countrySectors.*.*' => ['nullable', 'integer', 'min:0', 'max:999999999'],
            'targets.countries' => ['sometimes', 'array'],
            'targets.countries.*' => ['nullable', 'integer', 'min:0', 'max:999999999'],
            'targets.countryTrainingTypes' => ['sometimes', 'array'],
            'targets.countryTrainingTypes.*' => ['required', 'array'],
            'targets.countryTrainingTypes.*.*' => ['nullable', 'integer', 'min:0', 'max:999999999'],
        ]);
        if (isset($data['targets']['projectionCountries'])) {
            $invalidCountryNames = array_diff(
                array_unique($data['targets']['projectionCountries']),
                $targets->landingProjectionCountryOptions(),
            );
            if ($invalidCountryNames !== []) {
                throw ValidationException::withMessages([
                    'targets.projectionCountries' => 'Negara harus dipilih dari daftar negara tujuan yang tersedia.',
                ]);
            }
        }
        $placementOptions = $targets->landingPlacementOptions();
        $validPairs = collect($placementOptions['occupations'])
            ->mapWithKeys(fn (array $option): array => [
                "{$option['sectorName']}\0{$option['occupationName']}" => true,
            ]);
        foreach ($data['targets']['placementTargets'] as $index => $target) {
            $isAvailablePair = $validPairs->has("{$target['sectorName']}\0{$target['occupationName']}")
                || DB::table('landing_placement_targets')
                    ->where('sector_name', $target['sectorName'])
                    ->where('occupation_name', $target['occupationName'])
                    ->exists();
            if (! $isAvailablePair) {
                throw ValidationException::withMessages([
                    "targets.placementTargets.{$index}.occupationName" => 'Jabatan harus berasal dari data lembaga vokasi. Muat ulang halaman.',
                ]);
            }
            if (isset($target['id']) && ! DB::table('landing_placement_targets')
                ->where('id', $target['id'])
                ->where('year', $data['year'])
                ->exists()) {
                throw ValidationException::withMessages([
                    "targets.placementTargets.{$index}.id" => 'Data target tidak sesuai dengan periode yang dipilih. Muat ulang halaman.',
                ]);
            }
            $conflictingTarget = DB::table('landing_placement_targets')
                ->where('year', $data['year'])
                ->where('sector_name', $target['sectorName'])
                ->where('occupation_name', $target['occupationName'])
                ->where('projection_placement', $target['projectionPlacement'])
                ->when(isset($target['id']), fn ($query) => $query->where('id', '!=', $target['id']))
                ->exists();
            if ($conflictingTarget) {
                throw ValidationException::withMessages([
                    "targets.placementTargets.{$index}.projectionPlacement" => 'Proyeksi ini sudah terdaftar untuk jabatan dan periode tersebut.',
                ]);
            }
        }

        $countryIds = DB::table('countries')->pluck('id')->map(fn (string $id): string => $id)->all();
        $sectorIds = DB::table('sectors')->pluck('id')->map(fn (string $id): string => $id)->all();
        if (isset($data['targets']['countrySectors'])) {
            $submittedCountryIds = array_map('strval', array_keys($data['targets']['countrySectors']));
            if (array_diff($submittedCountryIds, $countryIds) !== []) {
                throw ValidationException::withMessages([
                    'targets.countrySectors' => 'Negara tidak sesuai dengan data yang tersedia. Muat ulang halaman.',
                ]);
            }
            foreach ($data['targets']['countrySectors'] as $countryId => $sectorTargets) {
                $submittedSectorIds = array_map('strval', array_keys($sectorTargets));
                if (array_diff($submittedSectorIds, $sectorIds) !== []) {
                    throw ValidationException::withMessages([
                        "targets.countrySectors.{$countryId}" => 'Sektor tidak sesuai dengan data yang tersedia. Muat ulang halaman.',
                    ]);
                }
            }
        }
        $legacyTargets = $data['targets'];
        if (isset($legacyTargets['countries'])) {
            $legacyCountryIds = array_map('strval', array_keys($legacyTargets['countries']));
            if (array_diff($legacyCountryIds, $countryIds) !== [] || array_diff($countryIds, $legacyCountryIds) !== []) {
                throw ValidationException::withMessages([
                    'targets.countries' => 'Daftar target negara tidak sesuai dengan data yang tersedia. Muat ulang halaman.',
                ]);
            }
        }
        if (isset($legacyTargets['countryTrainingTypes'])) {
            $submittedTrainingCountryIds = array_map('strval', array_keys($legacyTargets['countryTrainingTypes']));
            $trainingTypeKeys = ['upskilling', 'reskilling', 'language', 'integratedTechnical'];
            if (array_diff($submittedTrainingCountryIds, $countryIds) !== []
                || array_diff($countryIds, $submittedTrainingCountryIds) !== []) {
                throw ValidationException::withMessages([
                    'targets.countryTrainingTypes' => 'Daftar negara tidak sesuai dengan data yang tersedia. Muat ulang halaman.',
                ]);
            }
            foreach ($legacyTargets['countryTrainingTypes'] as $countryId => $trainingTargets) {
                $submittedTypeKeys = array_map('strval', array_keys($trainingTargets));
                if (array_diff($submittedTypeKeys, $trainingTypeKeys) !== []
                    || array_diff($trainingTypeKeys, $submittedTypeKeys) !== []) {
                    throw ValidationException::withMessages([
                        "targets.countryTrainingTypes.{$countryId}" => 'Jenis pelatihan tidak sesuai. Muat ulang halaman.',
                    ]);
                }
            }
        }
        $kpiTargets = $data['targets'];
        $placementTargets = $kpiTargets['placementTargets'];
        unset($kpiTargets['placementTargets']);
        $countrySectorTargets = $kpiTargets['countrySectors'] ?? null;
        $countryTargets = $kpiTargets['countries'] ?? null;
        $countryTrainingTargets = $kpiTargets['countryTrainingTypes'] ?? null;
        $projectionCountries = $kpiTargets['projectionCountries'] ?? null;
        unset($kpiTargets['countries'], $kpiTargets['countryTrainingTypes']);
        unset($kpiTargets['projectionCountries']);

        DB::transaction(function () use ($request, $targets, $data, $user, $kpiTargets, $countryTargets, $countryTrainingTargets, $countrySectorTargets, $projectionCountries, $placementTargets): void {
            $targets->saveLandingKpiTargets((int) $data['year'], $kpiTargets, (int) $user->id);
            $targets->saveLandingPlacementTargets((int) $data['year'], $placementTargets, (int) $user->id);
            if ($projectionCountries !== null) {
                $targets->saveLandingProjectionCountries(
                    array_values(array_unique($projectionCountries)),
                    (int) $user->id,
                );
            }
            if ($countryTargets !== null) {
                $targets->saveLandingCountryTargets((int) $data['year'], $countryTargets, (int) $user->id);
            }
            if ($countryTrainingTargets !== null) {
                $targets->saveLandingCountryTrainingTargets((int) $data['year'], $countryTrainingTargets, (int) $user->id);
            }
            if ($countrySectorTargets !== null) {
                $targets->saveLandingCountrySectorTargets((int) $data['year'], $countrySectorTargets, (int) $user->id);
            }
            DB::table('audit_logs')->insert([
                'id' => 'AUD-'.Str::upper(Str::random(12)),
                'user_id' => $user->id,
                'actor_name' => $user->name,
                'actor_role' => $user->roles()->value('title') ?? 'Super Admin',
                'scope' => 'Nasional',
                'action_type' => 'UPDATE_DATA',
                'entity' => 'dashboard_targets',
                'entity_id' => (string) $data['year'],
                'new_value' => json_encode($data, JSON_THROW_ON_ERROR),
                'justification_reason' => 'Target KPI, proyeksi program, dan negara yang ditampilkan pada landing page diperbarui untuk tahun '.$data['year'].'.',
                'ip_address' => $request->ip() ?? '127.0.0.1',
                'created_at' => now(),
            ]);
        });

        $businessDataPresenter->forgetAll();

        return back()->with('success', 'Target KPI dan proyeksi program penempatan untuk tahun '.$data['year'].' berhasil diperbarui.');
    }
}
