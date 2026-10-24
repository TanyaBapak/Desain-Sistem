<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provinces', function (Blueprint $table) {
            $table->char('id', 2)->primary();
            $table->string('name', 100);
        });

        Schema::create('districts', function (Blueprint $table) {
            $table->char('id', 4)->primary();
            $table->char('province_id', 2);
            $table->string('name', 100);
            $table->enum('type', ['Kabupaten', 'Kota'])->default('Kabupaten');
            $table->foreign('province_id')->references('id')->on('provinces')->restrictOnDelete()->cascadeOnUpdate();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('user_code', 50)->unique();
            $table->string('name', 150);
            $table->string('username', 100)->unique();
            $table->string('email', 150)->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('nip', 50)->nullable()->unique();
            $table->string('organization')->nullable();
            $table->enum('scope_level', ['national', 'provinsi', 'kabupaten', 'lembaga', 'demand'])->default('national');
            $table->string('scope_name')->default('Nasional Terpadu');
            $table->char('province_id', 2)->nullable();
            $table->char('district_id', 4)->nullable();
            $table->string('institution_id', 50)->nullable();
            $table->string('employer_id', 50)->nullable();
            $table->boolean('mfa_enabled')->default(false);
            $table->string('mfa_secret', 255)->nullable();
            $table->enum('status', ['Aktif', 'Nonaktif', 'Ditangguhkan'])->default('Aktif');
            $table->string('avatar_initials', 10)->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->foreign('province_id')->references('id')->on('provinces')->nullOnDelete();
            $table->foreign('district_id')->references('id')->on('districts')->nullOnDelete();
        });

        Schema::create('sectors', function (Blueprint $table) {
            $table->string('id', 50)->primary();
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->string('icon', 50)->nullable();
        });

        Schema::create('countries', function (Blueprint $table) {
            $table->char('id', 2)->primary();
            $table->string('name', 100);
            $table->string('flag_code', 10)->nullable();
            $table->string('currency', 10)->default('IDR');
            $table->decimal('exchange_rate_to_idr', 15, 2)->default(1);
        });

        Schema::create('occupations', function (Blueprint $table) {
            $table->string('id', 50)->primary();
            $table->string('sector_id', 50);
            $table->string('title', 150);
            $table->string('code', 50)->nullable();
            $table->string('skill_standard', 150)->nullable();
            $table->foreign('sector_id')->references('id')->on('sectors')->restrictOnDelete()->cascadeOnUpdate();
        });

        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name', 125)->unique();
            $table->string('guard_name', 125)->default('web');
            $table->string('title', 150);
            $table->string('badge', 150)->nullable();
            $table->string('core_group', 50);
            $table->string('default_tab', 50)->default('overview');
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name', 125)->unique();
            $table->string('guard_name', 125)->default('web');
            $table->string('module', 50);
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('role_has_permissions', function (Blueprint $table) {
            $table->unsignedBigInteger('permission_id');
            $table->unsignedBigInteger('role_id');
            $table->primary(['permission_id', 'role_id']);
            $table->foreign('permission_id')->references('id')->on('permissions')->cascadeOnDelete();
            $table->foreign('role_id')->references('id')->on('roles')->cascadeOnDelete();
        });

        Schema::create('model_has_roles', function (Blueprint $table) {
            $table->unsignedBigInteger('role_id');
            $table->string('model_type')->default('App\\\\Models\\\\User');
            $table->unsignedBigInteger('model_id');
            $table->primary(['role_id', 'model_id', 'model_type']);
            $table->foreign('role_id')->references('id')->on('roles')->cascadeOnDelete();
            $table->index(['model_id', 'model_type']);
        });

        Schema::create('model_has_permissions', function (Blueprint $table) {
            $table->unsignedBigInteger('permission_id');
            $table->string('model_type')->default('App\\Models\\User');
            $table->unsignedBigInteger('model_id');
            $table->primary(['permission_id', 'model_id', 'model_type']);
            $table->foreign('permission_id')->references('id')->on('permissions')->cascadeOnDelete();
            $table->index(['model_id', 'model_type']);
        });

        Schema::create('institutions', function (Blueprint $table) {
            $table->string('id', 50)->primary();
            $table->string('name');
            $table->string('npsn_or_vin', 50)->nullable();
            $table->enum('institution_type', ['SMK', 'BLK', 'LPK', 'LKP', 'Perguruan Tinggi / Politeknik']);
            $table->enum('ownership_type', ['Negeri', 'Swasta'])->default('Negeri');
            $table->char('province_id', 2);
            $table->char('district_id', 4);
            $table->text('address')->nullable();
            $table->string('head_name', 150)->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('accreditation', 20)->default('A');
            $table->enum('evokasi_status', ['Terverifikasi e-Vokasi', 'Proses Verifikasi', 'Belum Terverifikasi'])->default('Terverifikasi e-Vokasi');
            $table->unsignedInteger('total_active_students')->default(0);
            $table->unsignedInteger('instructor_count')->default(0);
            $table->unsignedInteger('workshop_capacity')->default(0);
            $table->enum('verification_status', ['Verified', 'Pending Verification', 'Unverified'])->default('Verified');
            $table->enum('status', ['Aktif', 'Nonaktif'])->default('Aktif');
            $table->timestamps();
            $table->foreign('province_id')->references('id')->on('provinces')->restrictOnDelete();
            $table->foreign('district_id')->references('id')->on('districts')->restrictOnDelete();
        });

        Schema::create('institution_facilities', function (Blueprint $table) {
            $table->id();
            $table->string('institution_id', 50);
            $table->string('facility_name', 150);
            $table->string('facility_type', 100)->nullable();
            $table->unsignedInteger('capacity')->default(0);
            $table->enum('condition_status', ['Sangat Baik', 'Baik', 'Cukup', 'Perlu Peremajaan'])->default('Baik');
            $table->timestamp('created_at')->nullable();
            $table->foreign('institution_id')->references('id')->on('institutions')->cascadeOnDelete();
        });

        Schema::create('institution_instructors', function (Blueprint $table) {
            $table->id();
            $table->string('institution_id', 50);
            $table->string('name', 150);
            $table->string('expertise_field', 150);
            $table->boolean('bnsp_certified')->default(true);
            $table->string('overseas_experience', 150)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->foreign('institution_id')->references('id')->on('institutions')->cascadeOnDelete();
        });

        Schema::create('job_seekers', function (Blueprint $table) {
            $table->string('id', 50)->primary();
            $table->string('registration_number', 50)->unique();
            $table->string('nik', 20);
            $table->string('full_name', 150);
            $table->enum('gender', ['L', 'P']);
            $table->char('province_id', 2);
            $table->char('district_id', 4);
            $table->enum('education_level', ['SMK', 'D3', 'S1', 'Lainnya'])->default('SMK');
            $table->string('institution_name');
            $table->string('institution_id', 50)->nullable();
            $table->string('major', 150);
            $table->decimal('gpa_score', 3, 2)->nullable();
            $table->enum('source_type', ['Disnaker', 'SMK', 'BLK', 'LPK', 'Mandiri', 'SISKOP2MI'])->default('Disnaker');
            $table->string('source_reference', 100)->nullable();
            $table->enum('readiness_status', ['Ready for Placement', 'Needs Upskilling', 'Needs Reskilling'])->default('Needs Upskilling');
            $table->enum('verification_status', ['Verified', 'Pending Verification', 'Unverified'])->default('Pending Verification');
            $table->enum('lifecycle_status', ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED'])->default('APPROVED');
            $table->boolean('passport_ready')->default(false);
            $table->boolean('mcu_ready')->default(false);
            $table->string('created_by', 150)->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->foreign('province_id')->references('id')->on('provinces')->restrictOnDelete();
            $table->foreign('district_id')->references('id')->on('districts')->restrictOnDelete();
            $table->foreign('institution_id')->references('id')->on('institutions')->nullOnDelete();
        });

        Schema::create('job_seeker_skills', function (Blueprint $table) {
            $table->id();
            $table->string('job_seeker_id', 50);
            $table->string('skill_name', 100);
            $table->boolean('certified')->default(false);
            $table->foreign('job_seeker_id')->references('id')->on('job_seekers')->cascadeOnDelete();
        });

        Schema::create('job_seeker_languages', function (Blueprint $table) {
            $table->id();
            $table->string('job_seeker_id', 50);
            $table->string('language', 50);
            $table->string('level', 50);
            $table->foreign('job_seeker_id')->references('id')->on('job_seekers')->cascadeOnDelete();
        });

        Schema::create('job_seeker_documents', function (Blueprint $table) {
            $table->id();
            $table->string('job_seeker_id', 50);
            $table->enum('document_type', ['KTP', 'Ijazah', 'Transkrip', 'Sertifikat_BNSP', 'Paspor', 'MCU', 'CV']);
            $table->string('document_path');
            $table->enum('verified_status', ['Pending', 'Valid', 'Invalid'])->default('Pending');
            $table->timestamp('uploaded_at')->nullable();
            $table->foreign('job_seeker_id')->references('id')->on('job_seekers')->cascadeOnDelete();
        });

        Schema::create('training_programs', function (Blueprint $table) {
            $table->string('id', 50)->primary();
            $table->string('name');
            $table->enum('program_type', ['Upskilling', 'Reskilling', 'Pelatihan Bahasa', 'Teknis Terpadu']);
            $table->string('sector_id', 50);
            $table->string('occupation_id', 50);
            $table->char('target_country_id', 2);
            $table->unsignedInteger('total_jp');
            $table->string('certification_target', 150);
            $table->decimal('cost_per_participant', 15, 2)->default(0);
            $table->unsignedInteger('quota')->default(50);
            $table->unsignedInteger('enrolled_count')->default(0);
            $table->text('curriculum')->nullable();
            $table->enum('status', ['Aktif', 'Nonaktif', 'Selesai'])->default('Aktif');
            $table->timestamps();
            $table->foreign('sector_id')->references('id')->on('sectors')->restrictOnDelete();
            $table->foreign('occupation_id')->references('id')->on('occupations')->restrictOnDelete();
            $table->foreign('target_country_id')->references('id')->on('countries')->restrictOnDelete();
        });

        Schema::create('training_classes', function (Blueprint $table) {
            $table->string('id', 50)->primary();
            $table->string('training_program_id', 50);
            $table->string('institution_id', 50);
            $table->string('class_name', 150);
            $table->date('start_date');
            $table->date('end_date');
            $table->unsignedInteger('capacity')->default(30);
            $table->enum('status', ['Pendaftaran', 'Sedang Berjalan', 'Selesai', 'Dibatalkan'])->default('Pendaftaran');
            $table->timestamps();
            $table->foreign('training_program_id')->references('id')->on('training_programs')->restrictOnDelete();
            $table->foreign('institution_id')->references('id')->on('institutions')->restrictOnDelete();
        });

        Schema::create('training_enrollments', function (Blueprint $table) {
            $table->id();
            $table->string('training_class_id', 50);
            $table->string('job_seeker_id', 50);
            $table->timestamp('enrolled_at')->nullable();
            $table->enum('status', ['Aktif', 'Lulus', 'Gagal', 'Mengundurkan Diri'])->default('Aktif');
            $table->decimal('attendance_percent', 5, 2)->default(0);
            $table->decimal('assessment_score', 5, 2)->nullable();
            $table->foreign('training_class_id')->references('id')->on('training_classes')->restrictOnDelete();
            $table->foreign('job_seeker_id')->references('id')->on('job_seekers')->restrictOnDelete();
        });

        Schema::create('employers', function (Blueprint $table) {
            $table->string('id', 50)->primary();
            $table->string('name');
            $table->char('country_id', 2);
            $table->string('industry', 150);
            $table->string('contact_person', 150)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('phone', 50)->nullable();
            $table->text('address')->nullable();
            $table->enum('verification_status', ['Verified', 'Pending', 'Rejected'])->default('Verified');
            $table->timestamps();
            $table->foreign('country_id')->references('id')->on('countries')->restrictOnDelete();
        });

        Schema::create('job_demands', function (Blueprint $table) {
            $table->string('id', 50)->primary();
            $table->string('employer_id', 50);
            $table->char('country_id', 2);
            $table->string('sector_id', 50);
            $table->string('occupation_id', 50);
            $table->unsignedInteger('headcount')->default(1);
            $table->decimal('salary_monthly_idr', 15, 2)->default(0);
            $table->text('job_description')->nullable();
            $table->text('required_skills')->nullable();
            $table->string('min_education', 50)->default('SMK');
            $table->string('required_language', 50)->nullable();
            $table->string('min_language_level', 50)->nullable();
            $table->date('deadline');
            $table->enum('placement_track', ['G to G', 'P to P', 'Mandiri'])->default('P to P');
            $table->enum('verification_status', ['Approved', 'Pending', 'Draft'])->default('Approved');
            $table->timestamps();
            $table->foreign('employer_id')->references('id')->on('employers')->restrictOnDelete();
            $table->foreign('country_id')->references('id')->on('countries')->restrictOnDelete();
            $table->foreign('sector_id')->references('id')->on('sectors')->restrictOnDelete();
            $table->foreign('occupation_id')->references('id')->on('occupations')->restrictOnDelete();
        });

        Schema::create('matching_runs', function (Blueprint $table) {
            $table->string('id', 50)->primary();
            $table->string('job_demand_id', 50);
            $table->timestamp('run_date')->nullable();
            $table->unsignedInteger('total_candidates_analyzed')->default(0);
            $table->unsignedInteger('matches_found')->default(0);
            $table->string('algorithm_version', 20)->default('v1.0-SSW');
            $table->foreign('job_demand_id')->references('id')->on('job_demands')->cascadeOnDelete();
        });

        Schema::create('candidate_matches', function (Blueprint $table) {
            $table->id();
            $table->string('matching_run_id', 50)->nullable();
            $table->string('job_demand_id', 50);
            $table->string('job_seeker_id', 50);
            $table->string('training_class_id', 50)->nullable();
            $table->decimal('match_score', 5, 2);
            $table->enum('match_status', ['Rekomendasi', 'Dialokasikan', 'Lolos Seleksi', 'Ditolak Employer'])->default('Rekomendasi');
            $table->text('match_explanation')->nullable();
            $table->timestamps();
            $table->foreign('matching_run_id')->references('id')->on('matching_runs')->nullOnDelete();
            $table->foreign('job_demand_id')->references('id')->on('job_demands')->restrictOnDelete();
            $table->foreign('job_seeker_id')->references('id')->on('job_seekers')->restrictOnDelete();
            $table->foreign('training_class_id')->references('id')->on('training_classes')->nullOnDelete();
        });

        Schema::create('placement_cases', function (Blueprint $table) {
            $table->string('id', 50)->primary();
            $table->unsignedBigInteger('candidate_match_id');
            $table->enum('status', ['Proses Dokumen', 'Penerbitan Visa', 'Medical Checkup 2', 'Siap Berangkat', 'Sudah di Negara Tujuan'])->default('Proses Dokumen');
            $table->string('visa_number', 100)->nullable();
            $table->date('flight_date')->nullable();
            $table->string('siskop2mi_id', 100)->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->foreign('candidate_match_id')->references('id')->on('candidate_matches')->restrictOnDelete();
        });

        Schema::create('approval_requests', function (Blueprint $table) {
            $table->string('id', 50)->primary();
            $table->enum('entity_type', ['calon_peserta', 'lembaga_vokasi', 'program_pelatihan', 'demand_luar_negeri']);
            $table->string('entity_id', 50);
            $table->string('title');
            $table->string('submitted_by', 150);
            $table->string('submitted_role', 50);
            $table->string('scope_label', 150);
            $table->timestamp('submitted_at')->nullable();
            $table->enum('validation_status', ['PASSED', 'FLAGGED'])->default('PASSED');
            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'])->default('PENDING');
            $table->string('reviewed_by', 150)->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->text('revision_notes')->nullable();
            $table->json('data_snapshot')->nullable();
            $table->index('status', 'idx_appreq_status');
            $table->index(['entity_type', 'entity_id'], 'idx_appreq_entity');
        });

        Schema::create('approval_histories', function (Blueprint $table) {
            $table->id();
            $table->string('approval_request_id', 50);
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->string('actor_name', 150);
            $table->enum('action', ['SUBMIT', 'AUTO_CHECK', 'VERIFY', 'APPROVE', 'REVISE', 'REJECT']);
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->foreign('approval_request_id')->references('id')->on('approval_requests')->cascadeOnDelete();
            $table->foreign('actor_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->string('id', 50)->primary();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('actor_name', 150);
            $table->string('actor_role', 100);
            $table->string('scope', 150);
            $table->enum('action_type', ['INPUT_DATA', 'AUTO_VALIDATION', 'VERIFIKASI', 'PERSETUJUAN', 'PENOLAKAN', 'REVISI', 'UPDATE_DATA', 'HAPUS_DATA', 'ALOKASI_MATCHING', 'AKUN_HAK_AKSES', 'LOGIN', 'LOGOUT']);
            $table->string('entity', 100);
            $table->string('entity_id', 100);
            $table->string('field_changed', 100)->nullable();
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();
            $table->text('justification_reason');
            $table->string('ip_address', 50)->default('127.0.0.1');
            $table->timestamp('created_at')->nullable();
            $table->index('actor_name', 'idx_audit_actor');
            $table->index('action_type', 'idx_audit_action');
            $table->index('created_at', 'idx_audit_created');
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('approval_histories');
        Schema::dropIfExists('approval_requests');
        Schema::dropIfExists('placement_cases');
        Schema::dropIfExists('candidate_matches');
        Schema::dropIfExists('matching_runs');
        Schema::dropIfExists('job_demands');
        Schema::dropIfExists('employers');
        Schema::dropIfExists('training_enrollments');
        Schema::dropIfExists('training_classes');
        Schema::dropIfExists('training_programs');
        Schema::dropIfExists('job_seeker_documents');
        Schema::dropIfExists('job_seeker_languages');
        Schema::dropIfExists('job_seeker_skills');
        Schema::dropIfExists('job_seekers');
        Schema::dropIfExists('institution_instructors');
        Schema::dropIfExists('institution_facilities');
        Schema::dropIfExists('institutions');
        Schema::dropIfExists('model_has_permissions');
        Schema::dropIfExists('model_has_roles');
        Schema::dropIfExists('role_has_permissions');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('occupations');
        Schema::dropIfExists('countries');
        Schema::dropIfExists('sectors');
        Schema::dropIfExists('users');
        Schema::dropIfExists('districts');
        Schema::dropIfExists('provinces');
    }
};
