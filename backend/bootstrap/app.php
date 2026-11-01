<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');
        $middleware->redirectTo(
            guests: '/login',
            users: '/app',
        );
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);
        $middleware->validateCsrfTokens(except: [
            'integrations/gardata/webhook',
            'integrations/sippmi/webhook',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            $status = $response->getStatusCode();

            // Tangani sesi habis (401 Unauthenticated, 419 CSRF Token Mismatch / Expired, atau 403 saat sesi hilang)
            if (in_array($status, [401, 419], true) || ($status === 403 && ! auth()->check())) {
                if ($request->expectsJson() && ! $request->header('X-Inertia')) {
                    return response()->json([
                        'message' => 'Sesi Anda telah berakhir. Silakan masuk kembali.',
                        'redirect' => route('login'),
                    ], 401);
                }

                return redirect()->route('login')->withErrors([
                    'session' => 'Sesi Anda telah berakhir. Silakan masuk kembali.',
                ]);
            }

            return $response;
        });
    })->create();
