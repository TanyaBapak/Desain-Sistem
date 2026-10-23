<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('institutions', function (Blueprint $table) {
            $table->string('external_source', 50)->nullable()->after('id');
            $table->string('external_id', 150)->nullable()->after('external_source');
            $table->json('external_metadata')->nullable()->after('supported_sectors');
            $table->char('province_id', 2)->nullable()->change();
            $table->char('district_id', 4)->nullable()->change();
            $table->string('ownership_type')->nullable()->default(null)->change();
            $table->unique(['external_source', 'external_id'], 'institutions_external_identity_unique');
        });

        Schema::create('integration_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->string('source', 50);
            $table->string('entity', 100);
            $table->string('status', 20);
            $table->unsignedInteger('records_fetched')->default(0);
            $table->unsignedInteger('records_inserted')->default(0);
            $table->unsignedInteger('records_updated')->default(0);
            $table->unsignedInteger('records_skipped')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();
            $table->index(['source', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integration_sync_logs');

        Schema::table('institutions', function (Blueprint $table) {
            $table->dropUnique('institutions_external_identity_unique');
            $table->dropColumn(['external_source', 'external_id', 'external_metadata']);
        });
    }
};
