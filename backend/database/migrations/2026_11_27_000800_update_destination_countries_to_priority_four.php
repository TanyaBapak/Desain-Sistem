<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const PRIORITY_COUNTRIES = [
        ['JP', 'Jepang', 'JP', 'JPY', 104.50],
        ['KR', 'Korea', 'KR', 'KRW', 11.80],
        ['MY', 'Malaysia', 'MY', 'MYR', 3550.00],
        ['TR', 'Turki', 'TR', 'TRY', 450.00],
    ];

    public function up(): void
    {
        if (! Schema::hasTable('countries')) {
            return;
        }

        foreach (self::PRIORITY_COUNTRIES as [$id, $name, $flagCode, $currency, $exchangeRate]) {
            DB::table('countries')->updateOrInsert(
                ['id' => $id],
                [
                    'name' => $name,
                    'flag_code' => $flagCode,
                    'currency' => $currency,
                    'exchange_rate_to_idr' => $exchangeRate,
                ],
            );
        }

        if (Schema::hasTable('training_programs')) {
            DB::table('training_programs')
                ->whereNotIn('target_country_id', ['JP', 'KR', 'MY', 'TR'])
                ->update(['target_country_id' => null]);
        }

        if (Schema::hasTable('job_demands')) {
            DB::table('job_demands')
                ->whereNotIn('country_id', ['JP', 'KR', 'MY', 'TR'])
                ->update(['country_id' => 'JP']);
        }

        if (Schema::hasTable('placements')) {
            DB::table('placements')
                ->whereNotIn('country_id', ['JP', 'KR', 'MY', 'TR'])
                ->update(['country_id' => 'JP']);
        }

        DB::table('countries')->whereNotIn('id', ['JP', 'KR', 'MY', 'TR'])->delete();
    }

    public function down(): void
    {
        if (! Schema::hasTable('countries')) {
            return;
        }

        foreach ([
            ['JP', 'Jepang', 'JP', 'JPY', 104.50],
            ['DE', 'Jerman', 'DE', 'EUR', 17200.00],
            ['KR', 'Korea Selatan', 'KR', 'KRW', 11.80],
            ['TW', 'Taiwan', 'TW', 'TWD', 490.00],
            ['SA', 'Arab Saudi', 'SA', 'SAR', 4200.00],
        ] as [$id, $name, $flagCode, $currency, $exchangeRate]) {
            DB::table('countries')->updateOrInsert(
                ['id' => $id],
                [
                    'name' => $name,
                    'flag_code' => $flagCode,
                    'currency' => $currency,
                    'exchange_rate_to_idr' => $exchangeRate,
                ],
            );
        }
    }
};
