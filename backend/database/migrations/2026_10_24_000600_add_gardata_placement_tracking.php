<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_seekers', function (Blueprint $table) {
            $table->enum('source_type', ['Disnaker', 'SMK', 'D3', 'BLK', 'LPK', 'Mandiri', 'SISKOP2MI', 'Gardata'])
                ->default('Disnaker')
                ->change();
            $table->string('external_source', 50)->nullable()->after('source_reference');
            $table->string('external_id', 150)->nullable()->after('external_source');
            $table->unique(['external_source', 'external_id'], 'job_seekers_external_identity_unique');
        });

        Schema::create('external_training_records', function (Blueprint $table) {
            $table->id();
            $table->string('external_source', 50);
            $table->string('external_batch_id', 150);
            $table->string('job_seeker_id', 50);
            $table->string('class_code', 100)->nullable();
            $table->string('batch_name', 255);
            $table->string('sector_name', 150)->nullable();
            $table->string('program_name', 255)->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->unsignedInteger('target_jp')->default(0);
            $table->unsignedInteger('achieved_jp')->default(0);
            $table->decimal('completion_percentage', 5, 2)->default(0);
            $table->string('status', 50);
            $table->unsignedSmallInteger('verified_reports_count')->default(0);
            $table->timestamps();
            $table->unique(
                ['external_source', 'external_batch_id', 'job_seeker_id'],
                'external_training_identity_unique',
            );
            $table->foreign('job_seeker_id')->references('id')->on('job_seekers')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        if (DB::table('job_seekers')->where('source_type', 'Gardata')->exists()) {
            throw new RuntimeException('Archive Gardata candidate records before rolling back this migration.');
        }

        Schema::dropIfExists('external_training_records');

        Schema::table('job_seekers', function (Blueprint $table) {
            $table->dropUnique('job_seekers_external_identity_unique');
            $table->dropColumn(['external_source', 'external_id']);
            $table->enum('source_type', ['Disnaker', 'SMK', 'D3', 'BLK', 'LPK', 'Mandiri', 'SISKOP2MI'])
                ->default('Disnaker')
                ->change();
        });
    }
};
