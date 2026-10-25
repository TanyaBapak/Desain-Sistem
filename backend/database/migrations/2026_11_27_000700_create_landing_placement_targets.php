<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('landing_placement_targets', function (Blueprint $table): void {
            $table->id();
            $table->unsignedSmallInteger('year');
            $table->string('sector_name', 150);
            $table->string('occupation_name', 150);
            $table->string('projection_placement', 255);
            $table->unsignedBigInteger('target');
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->unique(
                ['year', 'sector_name', 'occupation_name', 'projection_placement'],
                'landing_placement_targets_identity_unique',
            );
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('landing_placement_targets');
    }
};
