<?php

namespace App\Http\Middleware;

use App\Models\User;
use Inertia\Middleware;
use Illuminate\Http\Request;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        $user = $request->user();
        $user?->loadMissing('roles');
        $role = $user?->roles->first();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user && $role ? [
                    'id' => (string) $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'frontendRole' => $this->frontendRole($role->name),
                    'roleName' => $role->name,
                    'roleTitle' => $role->title,
                    'badge' => $role->badge,
                    'organization' => $user->organization ?? '',
                    'scope' => [
                        'level' => $user->scope_level,
                        'name' => $user->scope_name,
                        'provinsi' => $user->province_id,
                        'kabupatenKota' => $user->district_id,
                        'institutionId' => $user->institution_id,
                        'employerId' => $user->employer_id,
                    ],
                    'avatarInitials' => $user->avatar_initials,
                    'mfaEnabled' => $user->mfa_enabled,
                    'defaultTab' => $role->default_tab,
                    'accessibleTabs' => $this->accessibleTabs($user),
                ] : null,
            ],
        ];
    }

    private function frontendRole(string $roleName): string
    {
        return match ($roleName) {
            'super_admin' => 'superadmin',
            'leadership' => 'pimpinan',
            'task_force', 'directorate_admin' => 'taskforce',
            'province_admin', 'district_admin' => 'disnaker',
            'bp3mi_admin', 'placement_officer' => 'matching',
            'institution_admin', 'training_operator' => 'vokasi',
            'demand_admin' => 'demand',
            'verifier' => 'verifikator',
            'auditor' => 'pimpinan',
            default => 'taskforce',
        };
    }

    /**
     * @return list<string>
     */
    private function accessibleTabs(User $user): array
    {
        $tabs = [
            'dashboard',
            'overview',
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

        return array_values(array_filter($tabs, fn (string $tab): bool => $user->canAccessTab($tab)));
    }
}
