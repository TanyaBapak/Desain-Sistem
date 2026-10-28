<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\Bp3miScope;
use App\Services\BusinessDataPresenter;
use App\Services\DashboardTargetService;
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
        'targets',
        'sippmi-monitoring',
    ];

    public function __invoke(
        Request $request,
        string $tab,
        Bp3miScope $bp3miScope,
        BusinessDataPresenter $businessDataPresenter,
        DashboardTargetService $dashboardTargetService,
        UserManagementController $userManagementController,
    ): Response|RedirectResponse {
        if (! in_array($tab, self::TABS, true)) {
            $role = $request->user()?->roles()->first();
            $accessibleTabs = User::accessibleTabsForRole($role?->name);

            return redirect()->route('app.show', $accessibleTabs[0] ?? 'overview');
        }

        abort_unless($request->user()?->canAccessTab($tab), 403);

        try {
            $bp3miScope->activeCodeForUser($request->user());
        } catch (\Throwable $e) {
            \Log::warning('AppController bp3miScope warning: ' . $e->getMessage());
        }

        try {
            $businessData = $businessDataPresenter->make(
                $request->user(),
                $request->only([
                    'candidatePage',
                    'candidatePerPage',
                    'candidateSource',
                    'classPage',
                    'classPerPage',
                    'approvalPage',
                    'approvalPerPage',
                    'approvalStatus',
                    'approvalType',
                    'approvalSearch',
                ]),
            );
        } catch (\Throwable $e) {
            \Log::error('AppController businessData error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            $businessData = [];
        }

        $props = [
            'currentTab' => $tab,
            'isRoot' => false,
            'showLogin' => false,
            'businessData' => $businessData,
        ];

        if ($tab === 'rbac' && $request->user()->roles()->where('name', 'super_admin')->exists()) {
            try {
                $props['adminUsers'] = $userManagementController->indexData($request, $dashboardTargetService);
            } catch (\Throwable $e) {
                \Log::error('AppController rbac error: ' . $e->getMessage(), [
                    'trace' => $e->getTraceAsString(),
                ]);
                $props['adminUsers'] = [
                    'data' => [],
                    'currentPage' => 1,
                    'lastPage' => 1,
                    'total' => 0,
                    'perPage' => 50,
                    'selectedRole' => '',
                    'search' => '',
                    'roles' => [],
                    'filterRoles' => [],
                    'provinces' => [],
                    'districts' => [],
                    'institutions' => [],
                    'employers' => [],
                ];
            }
        }

        if ($tab === 'targets' && $request->user()->roles()->where('name', 'super_admin')->exists()) {
            try {
                $props['adminTargets'] = $userManagementController->targetData($request, $dashboardTargetService);
            } catch (\Throwable $e) {
                \Log::error('AppController targets error: ' . $e->getMessage(), [
                    'trace' => $e->getTraceAsString(),
                ]);
                $props['adminTargets'] = [];
            }
        }

        return Inertia::render('App', $props);
    }
}
