<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('institutions', function (Blueprint $table) {
            $table->unsignedInteger('total_active_students')->nullable()->default(null)->change();
            $table->unsignedInteger('instructor_count')->nullable()->default(null)->change();
            $table->unsignedInteger('workshop_capacity')->nullable()->default(null)->change();
            $table->unsignedTinyInteger('readiness_score')->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        // Keep unknown imported metrics nullable; converting them to zero would invent data.
    }
};
