<?php

namespace App\Providers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Dilarang keras menjalankan migrate:refresh, migrate:fresh, migrate:reset, db:wipe, dsb.
        // Data dan tabel database tidak boleh dihapus/di-drop ulang dalam kondisi apapun.
        DB::prohibitDestructiveCommands(true);

        if (
            $this->app->environment('production') ||
            request()->server('HTTP_X_FORWARDED_PROTO') === 'https' ||
            request()->header('X-Forwarded-Proto') === 'https'
        ) {
            URL::forceScheme('https');
        }
    }
}
