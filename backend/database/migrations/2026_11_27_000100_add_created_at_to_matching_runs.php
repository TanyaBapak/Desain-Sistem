<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('matching_runs', 'created_at')) {
            Schema::table('matching_runs', function (Blueprint $table): void {
                $table->timestamp('created_at', 6)->nullable();
            });
        }

        DB::table('matching_runs')
            ->whereNull('created_at')
            ->update(['created_at' => DB::raw('run_date')]);
    }

    public function down(): void
    {
        if (Schema::hasColumn('matching_runs', 'created_at')) {
            Schema::table('matching_runs', function (Blueprint $table): void {
                $table->dropColumn('created_at');
            });
        }
    }
};
