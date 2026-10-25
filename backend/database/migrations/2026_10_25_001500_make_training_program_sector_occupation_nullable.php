<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_programs', function (Blueprint $table) {
            $table->string('sector_id', 50)->nullable()->change();
            $table->string('occupation_id', 50)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('training_programs', function (Blueprint $table) {
            $table->string('sector_id', 50)->nullable(false)->change();
            $table->string('occupation_id', 50)->nullable(false)->change();
        });
    }
};
