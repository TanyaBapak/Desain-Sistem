<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('institution_registration_documents', function (Blueprint $table) {
            $table->id();
            $table->string('institution_id', 50);
            $table->string('document_type', 50);
            $table->string('original_name', 255);
            $table->string('document_path');
            $table->string('mime_type', 100);
            $table->unsignedInteger('file_size');
            $table->timestamp('uploaded_at');
            $table->timestamps();
            $table->foreign('institution_id')->references('id')->on('institutions')->cascadeOnDelete();
            $table->unique(['institution_id', 'document_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('institution_registration_documents');
    }
};
