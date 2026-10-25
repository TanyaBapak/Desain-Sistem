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
            'targets.countries' => ['required', 'array'],
            'targets.countries.*' => ['nullable', 'integer', 'min:0', 'max:999999999'],
            'targets.countryTrainingTypes' => ['required', 'array'],
            'targets.countryTrainingTypes.*' => ['required', 'array'],
            'targets.countryTrainingTypes.*.*' => ['nullable', 'integer', 'min:0', 'max:999999999'],
        ]);
        $countryIds = DB::table('countries')->pluck('id')->map(fn (string $id): string => $id)->all();
        $submittedCountryIds = array_map('strval', array_keys($data['targets']['countries']));
        $submittedTrainingCountryIds = array_map('strval', array_keys($data['targets']['countryTrainingTypes']));
        $trainingTypeKeys = ['upskilling', 'reskilling', 'language', 'integratedTechnical'];
        if (array_diff($countryIds, $submittedCountryIds) !== []
            || array_diff($submittedCountryIds, $countryIds) !== []
            || array_diff($countryIds, $submittedTrainingCountryIds) !== []
            || array_diff($submittedTrainingCountryIds, $countryIds) !== []) {
            throw ValidationException::withMessages([
                'targets.countries' => 'Daftar target negara tidak sesuai dengan data negara yang tersedia. Muat ulang halaman.',
            ]);
        }
        foreach ($data['targets']['countryTrainingTypes'] as $countryId => $trainingTargets) {
            $submittedTypeKeys = array_map('strval', array_keys($trainingTargets));
            if (array_diff($trainingTypeKeys, $submittedTypeKeys) !== []
                || array_diff($submittedTypeKeys, $trainingTypeKeys) !== []) {
                throw ValidationException::withMessages([
                    "targets.countryTrainingTypes.{$countryId}" => 'Jenis pelatihan tidak sesuai. Muat ulang halaman.',
                ]);
            }
        }
        $countryTargets = $data['targets']['countries'];
        $countryTrainingTargets = $data['targets']['countryTrainingTypes'];
        $kpiTargets = $data['targets'];
        unset($kpiTargets['countries']);
        unset($kpiTargets['countryTrainingTypes']);

        DB::transaction(function () use ($request, $targets, $data, $user, $kpiTargets, $countryTargets, $countryTrainingTargets): void {
            $targets->saveLandingKpiTargets((int) $data['year'], $kpiTargets, (int) $user->id);
            $targets->saveLandingCountryTargets(
                (int) $data['year'],
                $countryTargets,
                (int) $user->id,
            );
            $targets->saveLandingCountryTrainingTargets(
                (int) $data['year'],
                $countryTrainingTargets,
                (int) $user->id,
            );
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
                'justification_reason' => 'Target KPI, negara tujuan, dan jenis pelatihan landing page untuk tahun '.$data['year'].' diperbarui.',
                'ip_address' => $request->ip() ?? '127.0.0.1',
                'created_at' => now(),
            ]);
        });

        $businessDataPresenter->forgetAll();

        return back()->with('success', 'Target KPI, negara tujuan, dan jenis pelatihan landing page untuk tahun '.$data['year'].' berhasil diperbarui.');
    }
}
