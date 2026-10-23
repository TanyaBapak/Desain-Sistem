<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('program_allocations', function (Blueprint $table) {
            $table->string('id', 50)->primary();
            $table->string('training_class_id', 50)->unique();
            $table->string('job_demand_id', 50);
            $table->string('training_program_id', 50);
            $table->string('institution_id', 50);
            $table->decimal('total_budget', 15, 2)->default(0);
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['Draft', 'Approved', 'Finalized'])->default('Approved');
            $table->unsignedBigInteger('created_by');
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();
            $table->foreign('training_class_id')->references('id')->on('training_classes')->restrictOnDelete();
            $table->foreign('job_demand_id')->references('id')->on('job_demands')->restrictOnDelete();
            $table->foreign('training_program_id')->references('id')->on('training_programs')->restrictOnDelete();
            $table->foreign('institution_id')->references('id')->on('institutions')->restrictOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->restrictOnDelete();
            $table->index(['status', 'deleted_at']);
        });

        Schema::create('program_allocation_candidates', function (Blueprint $table) {
            $table->string('program_allocation_id', 50);
            $table->string('job_seeker_id', 50);
            $table->primary(['program_allocation_id', 'job_seeker_id']);
            $table->foreign('program_allocation_id')->references('id')->on('program_allocations')->restrictOnDelete();
            $table->foreign('job_seeker_id')->references('id')->on('job_seekers')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('program_allocation_candidates');
        Schema::dropIfExists('program_allocations');
    }
};
