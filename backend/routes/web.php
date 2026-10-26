<?php

use App\Http\Controllers\AppController;
use App\Http\Controllers\ApprovalWorkflowController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\BusinessDataController;
use App\Http\Controllers\DashboardTargetController;
use App\Http\Controllers\GardataSyncController;
use App\Http\Controllers\GardataTrainingMappingController;
use App\Http\Controllers\GardataWebhookController;
use App\Http\Controllers\InstitutionRegistrationController;
use App\Http\Controllers\Kp2miVokasiSyncController;
use App\Http\Controllers\MatchingRunController;
use App\Http\Controllers\PlacementWorkflowController;
use App\Http\Controllers\ProgramAllocationController;
use App\Http\Controllers\UserManagementController;
use App\Http\Middleware\EnsureUserIsActive;
use App\Models\User;
use App\Services\BusinessDataPresenter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function (Request $request, BusinessDataPresenter $businessDataPresenter) {
    if (auth()->check()) {
        $user = auth()->user();
        $role = $user->roles()->first();
        $accessibleTabs = User::accessibleTabsForRole($role?->name);
        $tab = in_array($role?->default_tab, $accessibleTabs, true)
            ? $role->default_tab
            : ($accessibleTabs[0] ?? 'overview');

        return redirect()->route('app.show', $tab);
    }

    $filters = $request->validate([
        'projectionYear' => ['nullable', 'regex:/^(all|20\d{2}|21\d{2}|2200)$/'],
    ]);
    $projectionPeriod = $filters['projectionYear'] ?? 'all';
    $projectionYear = $projectionPeriod === 'all' ? null : (int) $projectionPeriod;

    return Inertia::render('App', [
        'currentTab' => 'overview',
        'isRoot' => true,
        'showLogin' => false,
        'landingKpiSummary' => $businessDataPresenter->publicLandingKpiSummary(),
        'landingProjection' => $businessDataPresenter->publicLandingProjection($projectionYear),
    ]);
})->name('home');

Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
Route::post('/login', [AuthenticatedSessionController::class, 'store'])->middleware('throttle:5,1')->name('login.store');
Route::get('/lembaga/daftar', [InstitutionRegistrationController::class, 'create'])->name('institutions.register');
Route::post('/lembaga/daftar', [InstitutionRegistrationController::class, 'store'])
    ->middleware('throttle:3,1')
    ->name('institutions.register.store');
Route::post('/integrations/gardata/webhook', GardataWebhookController::class)->name('integrations.gardata.webhook');
Route::post('/integrations/sippmi/webhook', GardataWebhookController::class)->name('integrations.sippmi.webhook');

Route::middleware(['auth', EnsureUserIsActive::class])->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    Route::match(['get', 'post'], '/impersonation/stop', [UserManagementController::class, 'stopImpersonating'])->name('impersonation.stop');
    Route::post('/admin/users', [UserManagementController::class, 'store'])->name('admin.users.store');
    Route::patch('/admin/dashboard-targets', [DashboardTargetController::class, 'update'])
        ->name('admin.dashboard-targets.update');
    Route::patch('/admin/users/{user}', [UserManagementController::class, 'update'])
        ->whereNumber('user')
        ->name('admin.users.update');
    Route::patch('/admin/users/{user}/scope', [UserManagementController::class, 'updateScope'])
        ->whereNumber('user')
        ->name('admin.users.scope');
    Route::delete('/admin/users/{user}', [UserManagementController::class, 'destroy'])
        ->whereNumber('user')
        ->name('admin.users.destroy');
    Route::patch('/admin/users/{user}/status', [UserManagementController::class, 'updateStatus'])
        ->whereNumber('user')
        ->name('admin.users.status');
    Route::post('/admin/users/{user}/impersonate', [UserManagementController::class, 'impersonate'])
        ->whereNumber('user')
        ->name('admin.users.impersonate');
    Route::post('/integrations/gardata/sync', GardataSyncController::class)->name('integrations.gardata.sync');
    Route::put('/training-classes/{classId}/gardata-mapping', [GardataTrainingMappingController::class, 'update'])
        ->where('classId', '[A-Za-z0-9-]+')
        ->name('training-classes.gardata-mapping.update');
    Route::post('/integrations/kp2mi/sync', Kp2miVokasiSyncController::class)->name('integrations.kp2mi.sync');
    Route::post('/approvals/bulk', [ApprovalWorkflowController::class, 'bulkApprove'])
        ->name('approvals.bulk');
    Route::post('/approvals/{id}', [ApprovalWorkflowController::class, 'update'])
        ->where('id', '[A-Za-z0-9\-_]+')
        ->name('approvals.update');
    Route::get('/approvals/{id}/documents/{documentId}', [ApprovalWorkflowController::class, 'downloadDocument'])
        ->where(['id' => '[A-Za-z0-9\-_]+', 'documentId' => '[0-9]+'])
        ->name('approvals.documents.download');
    Route::post('/allocations', [ProgramAllocationController::class, 'store'])->name('allocations.store');
    Route::post('/matching/runs', [MatchingRunController::class, 'store'])->name('matching.runs.store');
    Route::post('/placements', [PlacementWorkflowController::class, 'store'])->name('placements.store');
    Route::patch('/placements/{id}', [PlacementWorkflowController::class, 'update'])
        ->where('id', '[A-Za-z0-9-]+')
        ->name('placements.update');
    Route::patch('/allocations/{id}', [ProgramAllocationController::class, 'updateStatus'])
        ->where('id', '[A-Za-z0-9-]+')
        ->name('allocations.update-status');
    Route::delete('/allocations/{id}', [ProgramAllocationController::class, 'destroy'])
        ->where('id', '[A-Za-z0-9-]+')
        ->name('allocations.destroy');
    Route::get('/business-data/candidates', [BusinessDataController::class, 'candidates'])
        ->name('business-data.candidates.index');
    Route::get('/business-data/candidates', [BusinessDataController::class, 'candidates'])
        ->name('business-data.candidates.index');
    Route::get('/business-data/providers', [BusinessDataController::class, 'providers'])
        ->name('business-data.providers.index');
    Route::get('/business-data/recommended-providers', [BusinessDataController::class, 'recommendedProviders'])
        ->name('business-data.recommended-providers');
    Route::post('/business-data/programs/sync-from-providers', [BusinessDataController::class, 'syncProgramsFromProviders'])
        ->name('business-data.programs.sync-from-providers');
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
