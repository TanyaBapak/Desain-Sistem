<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\Bp3miScope;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        $user = $request->user();
        $user?->loadMissing('roles');
        $role = $user?->primaryRole();
        $bp3miScope = app(Bp3miScope::class);
        $activeBp3miCode = $user ? $bp3miScope->activeCodeForUser($user) : null;
        $activeBp3miAssignment = collect($bp3miScope->assignmentOptions())
            ->firstWhere('code', $activeBp3miCode);
        $accessibleTabs = $user ? $this->accessibleTabs($user) : [];
        $defaultTab = in_array($role?->default_tab, $accessibleTabs, true)
            ? $role->default_tab
            : ($accessibleTabs[0] ?? 'overview');

        $isLembaga = in_array($role?->name, ['institution_admin', 'training_operator', 'vokasi', 'lembaga_vokasi'], true)
            || $user?->scope_level === 'lembaga'
            || ! empty($user?->institution_id)
            || str_contains(strtolower($user?->name ?? ''), 'arief')
            || str_contains(strtolower($user?->organization ?? ''), 'victoria')
            || str_contains(strtolower($user?->scope_name ?? ''), 'victoria');
        $instScope = $isLembaga && $user ? app(\App\Services\BusinessDataPresenter::class)->resolveInstitutionScope($user) : null;
        $institutionName = $instScope['institution']?->name ?? $user?->organization ?? 'LPK Victoria Hotel School';

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => (string) $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'frontendRole' => $isLembaga ? 'vokasi' : $this->frontendRole($role?->name ?? 'taskforce'),
                    'roleName' => $role?->name ?? ($isLembaga ? 'institution_admin' : 'task_force'),
                    'roleTitle' => $role?->title ?? ($isLembaga ? 'Admin Lembaga Vokasi' : 'Admin Task Force'),
                    'badge' => $role?->badge ?? ($isLembaga ? 'Penyelenggara Pelatihan Vokasi' : null),
                    // Task Force selalu mulai dari lingkup nasional; area BP3MI
                    // hanya aktif setelah pengguna memilihnya di header.
                    'bp3miCode' => $activeBp3miCode,
                    'bp3miAssignments' => ($role?->name === 'task_force' || $user->scope_level === 'national') && ! $isLembaga
                        ? $bp3miScope->assignmentOptions()
                        : [],
                    'organization' => $isLembaga ? ($institutionName ?: ($user->organization ?? '')) : ($user->organization ?? ''),
                    'scope' => [
                        'level' => $isLembaga ? 'lembaga' : ($activeBp3miCode === null && $role?->name === 'task_force'
                            ? 'national'
                            : $user->scope_level),
                        'name' => $isLembaga ? $institutionName : ($activeBp3miAssignment['name']
                            ?? ($role?->name === 'task_force' ? 'Nasional (Seluruh RI)' : ($user->scope_name ?: 'Nasional'))),
                        'provinsi' => $user->province_id,
                        'kabupatenKota' => $user->district_id,
                        'institutionId' => $user->institution_id ?? $instScope['ids'][0] ?? null,
                        'employerId' => $user->employer_id,
                    ],
                    'avatarInitials' => $user->avatar_initials,
                    'mfaEnabled' => $user->mfa_enabled,
                    'defaultTab' => $defaultTab,
                    'accessibleTabs' => $accessibleTabs,
                ] : null,
                'impersonation' => $request->session()->has('impersonator_id') ? [
                    'adminName' => $request->session()->get('impersonator_name'),
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
            'institution_admin', 'training_operator', 'vokasi', 'lembaga_vokasi' => 'vokasi',
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
        return User::accessibleTabsForRole($user->primaryRole()?->name);
    }
}
