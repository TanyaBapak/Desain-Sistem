<?php

namespace App\Http\Controllers;

use App\Services\BusinessDataPresenter;
use App\Services\DashboardTargetService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
        ]);

        DB::transaction(function () use ($request, $targets, $data, $user): void {
            $targets->saveLandingKpiTargets((int) $data['year'], $data['targets'], (int) $user->id);
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
                'justification_reason' => 'Enam target KPI landing page untuk tahun '.$data['year'].' diperbarui.',
                'ip_address' => $request->ip() ?? '127.0.0.1',
                'created_at' => now(),
            ]);
        });

        $businessDataPresenter->forgetAll();

        return back()->with('success', 'Target KPI landing page untuk tahun '.$data['year'].' berhasil diperbarui.');
    }
}
