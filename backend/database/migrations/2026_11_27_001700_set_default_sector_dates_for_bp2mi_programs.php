<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('training_programs')) {
            return;
        }

        $defaultSectorDates = [
            'Kesehatan' => ['2027-02-01', '2027-07-31'],
            'Hospitality' => ['2027-02-15', '2027-08-15'],
            'Manufaktur' => ['2027-03-01', '2027-09-30'],
            'Transportasi' => ['2027-03-15', '2027-08-31'],
            'Agriculture' => ['2027-04-01', '2027-09-30'],
            'Fisherman' => ['2027-04-01', '2027-09-30'],
            'Bahasa' => ['2027-01-15', '2027-06-15'],
            'Pelatihan dan Sertifikasi Teknis' => ['2027-02-01', '2027-07-31'],
            'Sertifikasi Teknis' => ['2027-03-01', '2027-06-30'],
        ];

        foreach ($defaultSectorDates as $sector => [$start, $end]) {
            DB::table('training_programs')
                ->where('sector_label', $sector)
                ->whereNull('start_date')
                ->update([
                    'start_date' => $start,
                    'end_date' => $end,
                    'updated_at' => now(),
                ]);
        }
    }

    public function down(): void
    {
        // Non-destructive migration
    }
};
