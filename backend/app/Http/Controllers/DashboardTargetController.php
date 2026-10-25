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

        $targetKeys = implode(',', DashboardTargetService::METRIC_KEYS);
        $rules = ['targets' => ['required', "array:{$targetKeys}"]]
            + collect(DashboardTargetService::METRIC_KEYS)
                ->mapWithKeys(fn (string $key): array => [
                    "targets.{$key}" => ['required', 'integer', 'min:1', 'max:999999999'],
                ])
                ->all();
        $data = $request->validate($rules);
        $values = $data['targets'];

        DB::transaction(function () use ($request, $targets, $values, $user): void {
            $targets->saveTargets($values, (int) $user->id);
            DB::table('audit_logs')->insert([
                'id' => 'AUD-'.Str::upper(Str::random(12)),
                'user_id' => $user->id,
                'actor_name' => $user->name,
                'actor_role' => $user->roles()->value('title') ?? 'Super Admin',
                'scope' => 'Nasional',
                'action_type' => 'UPDATE_DATA',
                'entity' => 'dashboard_targets',
                'entity_id' => 'nasional',
                'new_value' => json_encode($values, JSON_THROW_ON_ERROR),
                'justification_reason' => 'Target indikator dashboard nasional diperbarui.',
                'ip_address' => $request->ip() ?? '127.0.0.1',
                'created_at' => now(),
            ]);
        });
        $businessDataPresenter->forgetAll();

        return back()->with('success', 'Target indikator dashboard berhasil diperbarui.');
    }
}
