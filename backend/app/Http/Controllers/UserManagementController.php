<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use App\Services\DashboardTargetService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserManagementController extends Controller
{
    public function indexData(Request $request, DashboardTargetService $dashboardTargets): array
    {
        $this->authorizeSuperAdmin($request);

        $users = User::query()
            ->with('roles:id,name,title')
            ->orderBy('name')
            ->paginate(15);
        $users->through(fn (User $user): array => [
            'id' => (string) $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'status' => $user->status,
            'scopeName' => $user->scope_name,
            'scopeLevel' => $user->scope_level,
            'roleName' => $user->roles->first()?->name ?? '',
            'roleTitle' => $user->roles->first()?->title ?? 'Tanpa peran',
            'provinceId' => $user->province_id,
            'districtId' => $user->district_id,
            'institutionId' => $user->institution_id,
            'employerId' => $user->employer_id,
        ]);

        return [
            'data' => $users->items(),
            'currentPage' => $users->currentPage(),
            'lastPage' => $users->lastPage(),
            'total' => $users->total(),
            'roles' => Role::query()
                ->where('name', '!=', 'super_admin')
                ->orderBy('title')
                ->get(['name', 'title']),
            'provinces' => DB::table('provinces')->orderBy('name')->get(['id', 'name']),
            'districts' => DB::table('districts')->orderBy('name')->get(['id', 'province_id', 'name']),
            'institutions' => DB::table('institutions')->where('status', 'Aktif')->orderBy('name')->get(['id', 'name']),
            'employers' => DB::table('employers')->orderBy('name')->get(['id', 'name']),
        ];
    }

    public function targetData(Request $request, DashboardTargetService $dashboardTargets): array
    {
        $this->authorizeSuperAdmin($request);

        return [
            'landingKpiTargets' => $dashboardTargets->allLandingKpiTargets(),
            'landingCountries' => DB::table('countries')->orderBy('name')->get(['id', 'name']),
            'landingCountryTargets' => $dashboardTargets->allLandingCountryTargets(),
            'landingCountryPerformance' => $dashboardTargets->allLandingCountryPerformance(),
            'landingCountryTrainingTargets' => $dashboardTargets->allLandingCountryTrainingTargets(),
            'landingCountryTrainingPerformance' => $dashboardTargets->allLandingCountryTrainingPerformance(),
        ];
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeSuperAdmin($request);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'username' => ['required', 'string', 'max:100', 'alpha_dash', 'unique:users,username'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'password' => ['required', 'string', 'min:10', 'max:255'],
            'role' => ['required', Rule::exists('roles', 'name'), Rule::notIn(['super_admin'])],
            'scopeName' => ['nullable', 'string', 'max:255'],
            'provinceId' => ['nullable', 'string', 'exists:provinces,id'],
            'districtId' => ['nullable', 'string', 'exists:districts,id'],
            'institutionId' => ['nullable', 'string', 'exists:institutions,id'],
            'employerId' => ['nullable', 'string', 'exists:employers,id'],
        ]);
        $scope = $this->resolveScope($data);

        DB::transaction(function () use ($request, $data, $scope): void {
            $attributes = [
                'user_code' => 'USR-'.Str::upper(Str::random(10)),
                'name' => $data['name'],
                'username' => $data['username'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'scope_level' => $scope['level'],
                'scope_name' => $scope['name'],
                'province_id' => $data['provinceId'] ?? null,
                'district_id' => $data['districtId'] ?? null,
                'institution_id' => $data['institutionId'] ?? null,
                'employer_id' => $data['employerId'] ?? null,
                'status' => 'Aktif',
                'avatar_initials' => Str::upper(Str::substr($data['name'], 0, 2)),
            ];
            $user = User::query()->create($attributes);
            $role = Role::query()->where('name', $data['role'])->firstOrFail();
            $user->roles()->sync([$role->id]);
            $this->writeAudit($request, $user, 'Pembuatan akun dan penetapan peran.');
        });

        return back()->with('success', 'Akun pengguna berhasil dibuat.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $this->authorizeSuperAdmin($request);
        $this->authorizeManagedUser($request, $user);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'username' => ['required', 'string', 'max:100', 'alpha_dash', Rule::unique('users', 'username')->ignore($user->id)],
            'email' => ['required', 'email', 'max:150', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:10', 'max:255'],
            'role' => ['required', Rule::exists('roles', 'name'), Rule::notIn(['super_admin'])],
            'scopeName' => ['nullable', 'string', 'max:255'],
            'provinceId' => ['nullable', 'string', 'exists:provinces,id'],
            'districtId' => ['nullable', 'string', 'exists:districts,id'],
            'institutionId' => ['nullable', 'string', 'exists:institutions,id'],
            'employerId' => ['nullable', 'string', 'exists:employers,id'],
        ]);
        $scope = $this->resolveScope($data);

        DB::transaction(function () use ($request, $user, $data, $scope): void {
            $attributes = [
                'name' => $data['name'],
                'username' => $data['username'],
                'email' => $data['email'],
                'scope_level' => $scope['level'],
                'scope_name' => $scope['name'],
                'province_id' => $data['provinceId'] ?? null,
                'district_id' => $data['districtId'] ?? null,
                'institution_id' => $data['institutionId'] ?? null,
                'employer_id' => $data['employerId'] ?? null,
                'avatar_initials' => Str::upper(Str::substr($data['name'], 0, 2)),
            ];
            if (filled($data['password'] ?? null)) {
                $attributes['password'] = Hash::make($data['password']);
            }

            $user->update($attributes);
            $role = Role::query()->where('name', $data['role'])->firstOrFail();
            $user->roles()->sync([$role->id]);
            $this->writeAudit($request, $user, 'Data akun dan peran pengguna diperbarui.');
        });

        return back()->with('success', 'Data pengguna berhasil diperbarui.');
    }

    public function updateScope(Request $request, User $user): RedirectResponse
    {
        $this->authorizeSuperAdmin($request);
        $this->authorizeManagedUser($request, $user);

        $role = $user->roles()->value('name');
        abort_unless(is_string($role) && $role !== 'super_admin', 422);
        abort_if($role === 'task_force', 422, 'Lingkup Task Force dipilih melalui dropdown area di header.');

        $data = $request->validate([
            'scopeLevel' => ['required', Rule::in(['national', 'provinsi', 'kabupaten'])],
            'provinceId' => [
                Rule::requiredIf($request->input('scopeLevel') !== 'national'),
                'nullable',
                'string',
                'exists:provinces,id',
            ],
            'districtId' => [
                Rule::requiredIf($request->input('scopeLevel') === 'kabupaten'),
                'nullable',
                'string',
                Rule::exists('districts', 'id')->where('province_id', $request->input('provinceId')),
            ],
        ]);
        if ($role === 'province_admin' && $data['scopeLevel'] !== 'provinsi') {
            throw ValidationException::withMessages([
                'scopeLevel' => 'Admin provinsi harus menggunakan lingkup provinsi.',
            ]);
        }
        if ($role === 'district_admin' && $data['scopeLevel'] !== 'kabupaten') {
            throw ValidationException::withMessages([
                'scopeLevel' => 'Admin kabupaten/kota harus menggunakan lingkup kabupaten/kota.',
            ]);
        }

        $isDistrictScope = $data['scopeLevel'] === 'kabupaten';
        $scopeName = match ($data['scopeLevel']) {
            'national' => 'Nasional',
            'kabupaten' => (string) DB::table('districts')->where('id', $data['districtId'])->value('name'),
            default => (string) DB::table('provinces')->where('id', $data['provinceId'])->value('name'),
        };
        $attributes = [
            'scope_level' => $data['scopeLevel'],
            'scope_name' => $scopeName,
            'province_id' => $data['provinceId'] ?? null,
            'district_id' => $isDistrictScope ? $data['districtId'] : null,
        ];

        DB::transaction(function () use ($request, $user, $scopeName, $attributes): void {
            $user->update($attributes);
            $this->writeAudit($request, $user, 'Lingkup wilayah pengguna diperbarui menjadi '.$scopeName.'.');
        });

        return back()->with('success', 'Lingkup wilayah pengguna berhasil diperbarui.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $this->authorizeSuperAdmin($request);
        $this->authorizeManagedUser($request, $user);
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($request, $user, $data): void {
            $this->writeAudit($request, $user, 'Akun dihapus: '.$data['reason']);
            $user->delete();
        });

        return back()->with('success', 'Akun pengguna dihapus dan diarsipkan.');
    }

    public function updateStatus(Request $request, User $user): RedirectResponse
    {
        $this->authorizeSuperAdmin($request);
        abort_if($user->id === $request->user()->id || $user->roles()->where('name', 'super_admin')->exists(), 403);

        $data = $request->validate([
            'status' => ['required', Rule::in(['Aktif', 'Nonaktif', 'Ditangguhkan'])],
        ]);

        DB::transaction(function () use ($request, $user, $data): void {
            $oldStatus = $user->status;
            $user->update(['status' => $data['status']]);
            $this->writeAudit($request, $user, "Status akun diubah dari {$oldStatus} menjadi {$data['status']}.");
        });

        return back()->with('success', 'Status akun berhasil diperbarui.');
    }

    public function impersonate(Request $request, User $user): RedirectResponse
    {
        $admin = $this->authorizeSuperAdmin($request);
        abort_if($request->session()->has('impersonator_id'), 409, 'Sesi sedang menjalankan akun lain.');
        abort_if($user->id === $admin->id || $user->status !== 'Aktif', 422, 'Akun yang dipilih tidak dapat digunakan.');
        abort_if(
            $user->mfa_enabled
            || ! $user->roles()->exists()
            || $user->roles()->where('name', 'super_admin')->exists(),
            403,
            'Akun ini tidak dapat dijalankan melalui fitur login sebagai.',
        );

        $request->session()->put([
            'impersonator_id' => $admin->id,
            'impersonator_name' => $admin->name,
        ]);
        $this->writeAudit($request, $user, 'Super admin mulai menjalankan sesi sebagai pengguna ini.');
        Auth::login($user);
        $request->session()->regenerate();

        $role = $user->roles()->first();
        $tabs = User::accessibleTabsForRole($role?->name);

        return redirect()->route('app.show', $tabs[0] ?? 'overview');
    }

    public function stopImpersonating(Request $request): RedirectResponse
    {
        abort_unless($request->session()->has('impersonator_id'), 404);

        $admin = User::query()->find($request->session()->get('impersonator_id'));
        abort_unless(
            $admin
            && $admin->status === 'Aktif'
            && $admin->roles()->where('name', 'super_admin')->exists(),
            403,
        );

        $impersonatedUser = $request->user();
        $request->session()->forget(['impersonator_id', 'impersonator_name']);
        $this->writeAudit($request, $impersonatedUser, 'Super admin mengakhiri sesi sebagai pengguna ini.', $admin);
        Auth::login($admin);
        $request->session()->regenerate();

        return redirect()->route('app.show', 'rbac');
    }

    private function authorizeSuperAdmin(Request $request): User
    {
        $user = $request->user();
        abort_unless($user && $user->roles()->where('name', 'super_admin')->exists(), 403);

        return $user;
    }

    private function authorizeManagedUser(Request $request, User $user): void
    {
        abort_if(
            $user->id === $request->user()->id
            || $user->roles()->where('name', 'super_admin')->exists(),
            403,
        );
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{level: string, name: string}
     */
    private function resolveScope(array $data): array
    {
        $role = $data['role'];
        $provinceId = $data['provinceId'] ?? null;
        $districtId = $data['districtId'] ?? null;
        $institutionId = $data['institutionId'] ?? null;
        $employerId = $data['employerId'] ?? null;

        if (in_array($role, ['province_admin', 'district_admin'], true)) {
            validator($data, ['provinceId' => ['required', 'exists:provinces,id']])->validate();
        }
        if ($role === 'district_admin') {
            validator($data, ['districtId' => ['required', Rule::exists('districts', 'id')->where('province_id', $provinceId)]])->validate();
        }
        if (in_array($role, ['institution_admin', 'training_operator'], true)) {
            validator($data, ['institutionId' => ['required', 'exists:institutions,id']])->validate();
        }
        if ($role === 'demand_admin') {
            validator($data, ['employerId' => ['required', 'exists:employers,id']])->validate();
        }
        if ($role === 'district_admin') {
            return ['level' => 'kabupaten', 'name' => (string) DB::table('districts')->where('id', $districtId)->value('name')];
        }
        if ($role === 'province_admin') {
            return ['level' => 'provinsi', 'name' => (string) DB::table('provinces')->where('id', $provinceId)->value('name')];
        }
        if (in_array($role, ['institution_admin', 'training_operator'], true)) {
            return ['level' => 'lembaga', 'name' => (string) DB::table('institutions')->where('id', $institutionId)->value('name')];
        }
        if ($role === 'demand_admin') {
            return ['level' => 'demand', 'name' => (string) DB::table('employers')->where('id', $employerId)->value('name')];
        }
        if ($role === 'task_force') {
            return ['level' => 'provinsi', 'name' => 'Area BP3MI dipilih di header'];
        }

        return ['level' => 'national', 'name' => ($data['scopeName'] ?? null) ?: 'Nasional'];
    }

    private function writeAudit(Request $request, User $subject, string $reason, ?User $actor = null): void
    {
        $actor ??= $request->user();
        $role = $actor?->roles()->first();

        DB::table('audit_logs')->insert([
            'id' => 'AUD-'.Str::upper(Str::random(12)),
            'user_id' => $actor?->id,
            'actor_name' => $actor?->name ?? 'Pengguna',
            'actor_role' => $role?->title ?? $role?->name ?? 'Super Admin',
            'scope' => $actor?->scope_name ?? 'Nasional',
            'action_type' => 'AKUN_HAK_AKSES',
            'entity' => 'users',
            'entity_id' => (string) $subject->id,
            'new_value' => json_encode([
                'user_id' => $subject->id,
                'username' => $subject->username,
                'role' => $subject->roles()->value('name'),
                'status' => $subject->status,
            ], JSON_THROW_ON_ERROR),
            'justification_reason' => $reason,
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'created_at' => now(),
        ]);
    }
}
