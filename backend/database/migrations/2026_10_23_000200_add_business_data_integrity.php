<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_seekers', function (Blueprint $table) {
            $table->unique('nik', 'job_seekers_nik_unique');
            $table->json('preferred_countries')->nullable();
            $table->json('preferred_job_roles')->nullable();
        });

        Schema::table('institutions', function (Blueprint $table) {
            $table->json('supported_sectors')->nullable()->after('workshop_capacity');
        });

        Schema::table('training_programs', function (Blueprint $table) {
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('location')->nullable();
            $table->string('institution_id', 50)->nullable();
            $table->foreign('institution_id')->references('id')->on('institutions')->nullOnDelete();
        });

        Schema::table('job_demands', function (Blueprint $table) {
            $table->unsignedInteger('filled_quota')->default(0)->after('headcount');
            $table->string('salary_range_string')->nullable()->after('salary_monthly_idr');
            $table->json('required_certifications')->nullable()->after('required_skills');
            $table->unsignedSmallInteger('work_term_months')->default(0)->after('min_language_level');
        });

    }

    public function down(): void
    {
        Schema::table('job_demands', function (Blueprint $table) {
            $table->dropColumn([
                'filled_quota',
                'salary_range_string',
                'required_certifications',
                'work_term_months',
            ]);
        });

        Schema::table('institutions', function (Blueprint $table) {
            $table->dropColumn('supported_sectors');
        });

        Schema::table('job_seekers', function (Blueprint $table) {
            $table->dropColumn(['preferred_countries', 'preferred_job_roles']);
            $table->dropUnique('job_seekers_nik_unique');
        });

        Schema::table('training_programs', function (Blueprint $table) {
            $table->dropForeign(['institution_id']);
            $table->dropColumn(['start_date', 'end_date', 'location', 'institution_id']);
        });
    }
};
