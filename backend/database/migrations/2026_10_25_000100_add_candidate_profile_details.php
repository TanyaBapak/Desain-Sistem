<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_seekers', function (Blueprint $table) {
            $table->json('work_experiences')->nullable();
            $table->json('certifications')->nullable();
            $table->json('preferred_sectors')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('job_seekers', function (Blueprint $table) {
            $table->dropColumn(['work_experiences', 'certifications', 'preferred_sectors']);
        });
    }
};
