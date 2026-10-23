<?php

use App\Http\Controllers\AppController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\BusinessDataController;
use App\Http\Controllers\GardataSyncController;
use App\Http\Controllers\Kp2miVokasiSyncController;
use App\Http\Middleware\EnsureUserIsActive;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        $user = auth()->user();
        $role = $user->roles()->first();
        $accessibleTabs = User::accessibleTabsForRole($role?->name);
        $tab = in_array($role?->default_tab, $accessibleTabs, true)
            ? $role->default_tab
            : ($accessibleTabs[0] ?? 'overview');

        return redirect()->route('app.show', $tab);
    }

    return Inertia::render('App', [
        'currentTab' => 'overview',
        'isRoot' => true,
        'showLogin' => false,
    ]);
})->name('home');

Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
Route::post('/login', [AuthenticatedSessionController::class, 'store'])->middleware('throttle:5,1')->name('login.store');

Route::middleware(['auth', EnsureUserIsActive::class])->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    Route::post('/integrations/gardata/sync', GardataSyncController::class)->name('integrations.gardata.sync');
    Route::post('/integrations/kp2mi/sync', Kp2miVokasiSyncController::class)->name('integrations.kp2mi.sync');
    Route::post('/business-data/{type}', [BusinessDataController::class, 'store'])
        ->where('type', 'candidates|programs|providers|demands')
        ->name('business-data.store');
    Route::put('/business-data/{type}/{id}', [BusinessDataController::class, 'update'])
        ->where('type', 'candidates|programs|providers|demands')
        ->name('business-data.update');
    Route::delete('/business-data/{type}/{id}', [BusinessDataController::class, 'destroy'])
        ->where('type', 'candidates|programs|providers|demands')
        ->name('business-data.destroy');
    Route::get('/app', function () {
        $user = auth()->user();
        $role = $user->roles()->first();
        $tabs = User::accessibleTabsForRole($role?->name);

        return redirect()->route('app.show', $tabs[0] ?? 'overview');
    });
    Route::get('/app/{tab}', AppController::class)->name('app.show');
});
