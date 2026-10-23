<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use App\Services\BusinessDataPresenter;
use Inertia\Inertia;
use Inertia\Response;

class AppController extends Controller
{
    private const TABS = [
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

    public function __invoke(Request $request, string $tab, BusinessDataPresenter $businessDataPresenter): Response|RedirectResponse
    {
        if (! in_array($tab, self::TABS, true)) {
            return redirect()->route('app.show', 'overview');
        }

        abort_unless($request->user()?->canAccessTab($tab), 403);

        return Inertia::render('App', [
            'currentTab' => $tab,
            'isRoot' => false,
            'showLogin' => false,
            'businessData' => $businessDataPresenter->make($request->user()),
        ]);
    }
}
