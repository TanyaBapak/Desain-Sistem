<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sectors', function (Blueprint $table): void {
            $table->json('aliases')->nullable();
        });

        Schema::table('occupations', function (Blueprint $table): void {
            $table->json('aliases')->nullable();
        });

        $sectorAliases = [
            'SECT-HOSP' => ['hospitality'],
            'SECT-WELD' => ['manufactur', 'manufaktur', 'manufacturing'],
            'SECT-CARE' => [
                'caregiver',
                'care giver',
                'care-giving',
                'health',
                'healthcare',
                'health care',
                'kesehatan',
            ],
            'SECT-AGRI' => [
                'fisherman',
                'fisherman (agricultur)',
                'fishery',
                'agricultur',
                'agriculture',
                'perikanan',
                'pertanian',
            ],
        ];

        foreach ($sectorAliases as $id => $aliases) {
            DB::table('sectors')->where('id', $id)->update([
                'aliases' => json_encode($aliases, JSON_THROW_ON_ERROR),
            ]);
        }

        DB::table('occupations')->where('id', 'OCC-KG-01')->update([
            'aliases' => json_encode([
                'caregiver',
                'caregiver (lvl pelaksana)',
                'caregiver / kaigo',
                'kaigo',
            ], JSON_THROW_ON_ERROR),
        ]);
    }

    public function down(): void
    {
        Schema::table('occupations', function (Blueprint $table): void {
            $table->dropColumn('aliases');
        });

        Schema::table('sectors', function (Blueprint $table): void {
            $table->dropColumn('aliases');
        });
    }
};
