<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function create(): Response|RedirectResponse
    {
        if (Auth::check()) {
            return redirect()->route('home');
        }

        return Inertia::render('App', [
            'currentTab' => 'overview',
            'isRoot' => true,
            'showLogin' => true,
            'registrationStatus' => session('status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'identifier' => ['required', 'string', 'max:150'],
            'password' => ['required', 'string', 'max:255'],
            'remember' => ['sometimes', 'boolean'],
        ]);

        $identifier = trim($credentials['identifier']);
        $user = User::query()
            ->where('username', $identifier)
            ->orWhere('email', $identifier)
            ->orWhere('nip', $identifier)
            ->first();

        if (
            $user === null
            || $user->status !== 'Aktif'
            || $user->mfa_enabled
            || ! $user->roles()->exists()
            || ! Hash::check($credentials['password'], $user->password)
        ) {
            throw ValidationException::withMessages([
                'identifier' => 'Kredensial tidak valid, akun tidak aktif, atau verifikasi MFA belum tersedia.',
            ]);
        }

        Auth::login($user, $credentials['remember'] ?? false);
        $request->session()->regenerate();

        $role = $user->roles()->first();
        $accessibleTabs = User::accessibleTabsForRole($role?->name);
        $defaultTab = in_array($role?->default_tab, $accessibleTabs, true)
            ? $role->default_tab
            : ($accessibleTabs[0] ?? 'overview');

        return redirect()->intended(route('app.show', $defaultTab));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }
}
