<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\BusinessDataPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppController extends Controller
{
    private const TABS = [
        'dashboard',
        'overview',
        'reports',
        'modul-a',
        'modul-b',
        'modul-c',
        'modul-d',
        'matching',
        'modul-e',
        'approvals',
        'audit',
        'rbac',
        'sippmi-monitoring',
    ];

    public function __invoke(
        Request $request,
        string $tab,
        BusinessDataPresenter $businessDataPresenter,
        UserManagementController $userManagementController,
    ): Response|RedirectResponse {
        if (! in_array($tab, self::TABS, true)) {
            $role = $request->user()?->roles()->first();
            $accessibleTabs = User::accessibleTabsForRole($role?->name);

            return redirect()->route('app.show', $accessibleTabs[0] ?? 'overview');
        }

        abort_unless($request->user()?->canAccessTab($tab), 403);

        $props = [
            'currentTab' => $tab,
            'isRoot' => false,
            'showLogin' => false,
            'businessData' => $businessDataPresenter->make($request->user()),
        ];

        if ($tab === 'rbac' && $request->user()->roles()->where('name', 'super_admin')->exists()) {
            $props['adminUsers'] = $userManagementController->indexData($request);
        }

        return Inertia::render('App', $props);
    }
}
