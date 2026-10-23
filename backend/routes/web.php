<?php

use App\Http\Controllers\AppController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Middleware\EnsureUserIsActive;
use Inertia\Inertia;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (auth()->check()) {
        $tab = auth()->user()->roles()->value('default_tab') ?: 'overview';

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
    Route::get('/app', fn () => redirect()->route('app.show', 'overview'));
    Route::get('/app/{tab}', AppController::class)->name('app.show');
});
