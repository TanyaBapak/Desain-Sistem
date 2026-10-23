<?php

namespace App\Http\Middleware;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        $user = $request->user();
        $user?->loadMissing('roles');
        $role = $user?->roles->first();
        $accessibleTabs = $user ? $this->accessibleTabs($user) : [];
        $defaultTab = in_array($role?->default_tab, $accessibleTabs, true)
            ? $role->default_tab
            : ($accessibleTabs[0] ?? 'overview');

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
                    'defaultTab' => $defaultTab,
                    'accessibleTabs' => $accessibleTabs,
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
        return User::accessibleTabsForRole($user->roles->first()?->name);
    }
}
