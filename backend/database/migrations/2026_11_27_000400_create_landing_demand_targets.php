<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('landing_demand_targets', function (Blueprint $table): void {
            $table->unsignedSmallInteger('year')->primary();
            $table->unsignedBigInteger('target_quota');
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
        });

        if (Schema::hasTable('dashboard_targets')) {
            $legacyTarget = DB::table('dashboard_targets')
                ->where('metric_key', 'landingDemandQuota')
                ->first(['target_value', 'updated_by', 'created_at', 'updated_at']);

            if ($legacyTarget?->target_value !== null) {
                DB::table('landing_demand_targets')->insert([
                    'year' => now()->year,
                    'target_quota' => $legacyTarget->target_value,
                    'updated_by' => $legacyTarget->updated_by,
                    'created_at' => $legacyTarget->created_at ?? now(),
                    'updated_at' => $legacyTarget->updated_at ?? now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('landing_demand_targets');
    }
};
