<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('training_programs')) {
            Schema::table('training_programs', function (Blueprint $table): void {
                if (! Schema::hasColumn('training_programs', 'sector_label')) {
                    $table->string('sector_label', 120)->nullable()->after('sector_id');
                }
                if (! Schema::hasColumn('training_programs', 'occupation_label')) {
                    $table->string('occupation_label', 150)->nullable()->after('occupation_id');
                }
                if (! Schema::hasColumn('training_programs', 'projection_placement')) {
                    $table->string('projection_placement', 255)->nullable()->after('target_country_id');
                }
                if (! Schema::hasColumn('training_programs', 'class_count')) {
                    $table->unsignedInteger('class_count')->nullable()->after('quota');
                }
                if (! Schema::hasColumn('training_programs', 'technical_jp')) {
                    $table->unsignedInteger('technical_jp')->nullable()->after('class_count');
                }
                if (! Schema::hasColumn('training_programs', 'technical_certification_jp')) {
                    $table->unsignedInteger('technical_certification_jp')->nullable()->after('technical_jp');
                }
                if (! Schema::hasColumn('training_programs', 'language_jp')) {
                    $table->unsignedInteger('language_jp')->nullable()->after('technical_certification_jp');
                }
                if (! Schema::hasColumn('training_programs', 'language_certification_jp')) {
                    $table->unsignedInteger('language_certification_jp')->nullable()->after('language_jp');
                }
            });
        }

        if (Schema::hasTable('landing_placement_targets')) {
            // Hapus 2 baris duplikat/ekstra agar tepat 40 baris sesuai dokumen BP2MI (40.000 Target / 2.000 Kelas)
            DB::table('landing_placement_targets')
                ->whereIn('id', [55, 123])
                ->delete();

            DB::table('landing_placement_targets')
                ->where('id', 16)
                ->update(['projection_placement' => 'Malaysia, Slowakia']);
        }

        if (class_exists(\Database\Seeders\ProgramPlacementTargetSeeder::class)) {
            (new \Database\Seeders\ProgramPlacementTargetSeeder)->run();
        }
    }

    public function down(): void
    {
        // Non-destructive migration
    }
};
