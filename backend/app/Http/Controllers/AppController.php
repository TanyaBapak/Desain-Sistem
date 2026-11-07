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
        $role = $request->user()?->primaryRole();
        $accessibleTabs = User::accessibleTabsForRole($role?->name);

        if (! in_array($tab, self::TABS, true) || ! $request->user()?->canAccessTab($tab)) {
            return redirect()->route('app.show', $accessibleTabs[0] ?? 'overview');
        }

        try {
            $bp3miScope->activeCodeForUser($request->user());
        } catch (\Throwable $e) {
            \Log::warning('AppController bp3miScope warning: ' . $e->getMessage());
        }

        $needsBusinessData = !in_array($tab, ['rbac', 'targets'], true);

        if ($needsBusinessData) {
            if ($request->session()->has('impersonator_id')) {
                try {
                    $businessDataPresenter->forget($request->user());
                } catch (\Throwable $e) {
                    \Log::warning('AppController cache forget warning: ' . $e->getMessage());
                }
            }

            try {
                $businessData = $businessDataPresenter->make(
                    $request->user(),
                    array_merge(
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
                        ['tab' => $tab]
                    ),
                );

                \Log::info('AppController businessData loaded', [
                    'user_id' => $request->user()?->id,
                    'user_name' => $request->user()?->name,
                    'tab' => $tab,
                    'candidates_count' => count($businessData['candidates'] ?? []),
                    'is_impersonating' => $request->session()->has('impersonator_id'),
                ]);
            } catch (\Throwable $e) {
                \Log::error('AppController businessData error: ' . $e->getMessage(), [
                    'trace' => $e->getTraceAsString(),
                ]);
                $businessData = [];
            }
        } else {
            $businessData = [];
        }

        $props = [
            'currentTab' => $tab,
            'isRoot' => false,
            'showLogin' => false,
            'businessData' => $businessData,
        ];

        $isSuperAdmin = $request->user()?->primaryRole()?->name === 'super_admin'
            || \Illuminate\Support\Facades\DB::table('model_has_roles')
                ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                ->where('model_has_roles.model_id', $request->user()?->id)
                ->where('roles.name', 'super_admin')
                ->exists();

        if ($tab === 'rbac' && $isSuperAdmin) {
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

        if ($tab === 'targets' && $isSuperAdmin) {
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
