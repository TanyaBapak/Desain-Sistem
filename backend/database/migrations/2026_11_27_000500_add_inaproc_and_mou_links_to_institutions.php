<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('institutions', function (Blueprint $table): void {
            if (! Schema::hasColumn('institutions', 'procurement_catalog_url')) {
                $table->text('procurement_catalog_url')->nullable();
            }
            if (! Schema::hasColumn('institutions', 'mou_drive_url')) {
                $table->text('mou_drive_url')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('institutions', function (Blueprint $table): void {
            $table->dropColumn(['procurement_catalog_url', 'mou_drive_url']);
        });
    }
};
