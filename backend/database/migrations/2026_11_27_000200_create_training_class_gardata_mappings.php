<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('training_class_gardata_mappings', function (Blueprint $table): void {
            $table->string('training_class_id', 50)->primary();
            $table->string('external_source', 50)->default('gardata');
            $table->string('external_batch_id', 150);
            $table->unsignedBigInteger('mapped_by');
            $table->timestamps();
            $table->unique(
                ['external_source', 'external_batch_id'],
                'training_class_gardata_batch_unique',
            );
            $table->foreign('training_class_id')
                ->references('id')
                ->on('training_classes')
                ->restrictOnDelete();
            $table->foreign('mapped_by')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_class_gardata_mappings');
    }
};
