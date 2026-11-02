<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('users') && ! Schema::hasColumn('users', 'institution_ids')) {
            Schema::table('users', function (Blueprint $table) {
                $table->json('institution_ids')->nullable()->after('institution_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'institution_ids')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('institution_ids');
            });
        }
    }
};
