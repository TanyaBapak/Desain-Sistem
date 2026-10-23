<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->routeIs('impersonation.stop') && $request->session()->has('impersonator_id')) {
            return $next($request);
        }

        if ($request->user()?->status !== 'Aktif') {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'identifier' => 'Akun tidak aktif. Hubungi administrator untuk bantuan.',
            ]);
        }

        return $next($request);
    }
}
