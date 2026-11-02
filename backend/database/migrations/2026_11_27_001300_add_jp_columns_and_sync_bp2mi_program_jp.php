<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('landing_placement_targets')) {
            Schema::table('landing_placement_targets', function (Blueprint $table): void {
                if (! Schema::hasColumn('landing_placement_targets', 'class_count')) {
                    $table->unsignedInteger('class_count')->nullable()->after('target');
                }
                if (! Schema::hasColumn('landing_placement_targets', 'technical_jp')) {
                    $table->unsignedInteger('technical_jp')->nullable()->after('class_count');
                }
                if (! Schema::hasColumn('landing_placement_targets', 'technical_certification_jp')) {
                    $table->unsignedInteger('technical_certification_jp')->nullable()->after('technical_jp');
                }
                if (! Schema::hasColumn('landing_placement_targets', 'language_jp')) {
                    $table->unsignedInteger('language_jp')->nullable()->after('technical_certification_jp');
                }
                if (! Schema::hasColumn('landing_placement_targets', 'language_certification_jp')) {
                    $table->unsignedInteger('language_certification_jp')->nullable()->after('language_jp');
                }
                if (! Schema::hasColumn('landing_placement_targets', 'total_jp')) {
                    $table->unsignedInteger('total_jp')->nullable()->after('language_certification_jp');
                }
            });

            // Data resmi BP2MI: "PENYIAPAN PROGRAM PELATIHAN" (Total 40.000 Target / 2.000 Kelas)
            $bp2miJpById = [
                // 1. Kesehatan (11.600)
                1 => ['class_count' => 27, 'technical_jp' => 160, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 840],
                2 => ['class_count' => 21, 'technical_jp' => 160, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 840],
                3 => ['class_count' => 245, 'technical_jp' => 260, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 940],
                4 => ['class_count' => 206, 'technical_jp' => 260, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 940],
                5 => ['class_count' => 81, 'technical_jp' => 160, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 840],
                // 2. Hospitality (13.140)
                6 => ['class_count' => 73, 'technical_jp' => 180, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 860],
                7 => ['class_count' => 401, 'technical_jp' => 180, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 860],
                8 => ['class_count' => 36, 'technical_jp' => 40, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 720],
                9 => ['class_count' => 2, 'technical_jp' => 280, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 960],
                10 => ['class_count' => 130, 'technical_jp' => 180, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 860],
                11 => ['class_count' => 15, 'technical_jp' => 50, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 730],
                // 3. Manufaktur (6.000)
                12 => ['class_count' => 15, 'technical_jp' => 160, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 840],
                13 => ['class_count' => 10, 'technical_jp' => 160, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 840],
                14 => ['class_count' => 2, 'technical_jp' => 320, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 1000],
                15 => ['class_count' => 160, 'technical_jp' => 100, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 780],
                16 => ['class_count' => 113, 'technical_jp' => 100, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 780],
                // 4. Transportasi (60)
                17 => ['class_count' => 1, 'technical_jp' => 200, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 880],
                18 => ['class_count' => 1, 'technical_jp' => 200, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 880],
                19 => ['class_count' => 1, 'technical_jp' => 160, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 840],
                // 5. Agriculture (4.000)
                20 => ['class_count' => 120, 'technical_jp' => 140, 'technical_certification_jp' => 20, 'language_jp' => 40, 'language_certification_jp' => 20, 'total_jp' => 220],
                21 => ['class_count' => 15, 'technical_jp' => 140, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 820],
                22 => ['class_count' => 25, 'technical_jp' => 140, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 820],
                23 => ['class_count' => 13, 'technical_jp' => 140, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 820],
                24 => ['class_count' => 2, 'technical_jp' => 140, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 820],
                25 => ['class_count' => 25, 'technical_jp' => 140, 'technical_certification_jp' => 20, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 820],
                // 6. Bahasa (1.700)
                26 => ['class_count' => 25, 'technical_jp' => null, 'technical_certification_jp' => null, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 660],
                27 => ['class_count' => 5, 'technical_jp' => null, 'technical_certification_jp' => null, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 660],
                28 => ['class_count' => 25, 'technical_jp' => null, 'technical_certification_jp' => null, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 660],
                29 => ['class_count' => 15, 'technical_jp' => null, 'technical_certification_jp' => null, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 660],
                30 => ['class_count' => 15, 'technical_jp' => null, 'technical_certification_jp' => null, 'language_jp' => 640, 'language_certification_jp' => 20, 'total_jp' => 660],
                // 7. Pelatihan dan Sertifikasi Teknis (2.000)
                31 => ['class_count' => 35, 'technical_jp' => 260, 'technical_certification_jp' => 20, 'language_jp' => null, 'language_certification_jp' => null, 'total_jp' => 280],
                32 => ['class_count' => 15, 'technical_jp' => 320, 'technical_certification_jp' => 20, 'language_jp' => null, 'language_certification_jp' => null, 'total_jp' => 340],
                33 => ['class_count' => 30, 'technical_jp' => 280, 'technical_certification_jp' => 20, 'language_jp' => null, 'language_certification_jp' => null, 'total_jp' => 200],
                34 => ['class_count' => 20, 'technical_jp' => 320, 'technical_certification_jp' => 20, 'language_jp' => null, 'language_certification_jp' => null, 'total_jp' => 340],
                // 8. Sertifikasi Teknis (1.500)
                35 => ['class_count' => 24, 'technical_jp' => null, 'technical_certification_jp' => 20, 'language_jp' => null, 'language_certification_jp' => null, 'total_jp' => 20],
                36 => ['class_count' => 5, 'technical_jp' => null, 'technical_certification_jp' => 20, 'language_jp' => null, 'language_certification_jp' => null, 'total_jp' => 20],
                37 => ['class_count' => 20, 'technical_jp' => null, 'technical_certification_jp' => 20, 'language_jp' => null, 'language_certification_jp' => null, 'total_jp' => 20],
                38 => ['class_count' => 15, 'technical_jp' => null, 'technical_certification_jp' => 20, 'language_jp' => null, 'language_certification_jp' => null, 'total_jp' => 20],
                39 => ['class_count' => 6, 'technical_jp' => null, 'technical_certification_jp' => 20, 'language_jp' => null, 'language_certification_jp' => null, 'total_jp' => 20],
                40 => ['class_count' => 5, 'technical_jp' => null, 'technical_certification_jp' => 20, 'language_jp' => null, 'language_certification_jp' => null, 'total_jp' => 20],
                55 => ['class_count' => 30, 'technical_jp' => null, 'technical_certification_jp' => 20, 'language_jp' => null, 'language_certification_jp' => null, 'total_jp' => 20],
            ];

            foreach ($bp2miJpById as $id => $jpData) {
                DB::table('landing_placement_targets')
                    ->where('id', $id)
                    ->update($jpData);
            }

            if (class_exists(\Database\Seeders\ProgramPlacementTargetSeeder::class)) {
                (new \Database\Seeders\ProgramPlacementTargetSeeder)->run();
            }
        }

        // Penyelarasan total_jp pada tabel training_programs agar sesuai dengan dokumen resmi BP2MI
        if (Schema::hasTable('training_programs')) {
            $programJpUpdates = [
                '0893eaed-1a8f-4492-ae51-b38dd8382993' => 660, // Bahasa Inggris (640 + 20)
                'PROG-BZYBNRQPSE' => 660,                      // Bahasa Jepang N4 / JFT Basic A2 (640 + 20)
                'PROG-DJMV4VC4T9' => 660,                      // Pelatihan dan Sertifikasi Bahasa Jepang (640 + 20)
                'PROG-T8CU7XN3CY' => 660,                      // Pelatihan dan Sertifikasi Bahasa Jepang (640 + 20)
                'PROG-PIBHCT2GKY' => 660,                      // Bahasa Jepang untuk penempatan Caregiver di Jepang (640 + 20)
                'PROG-SLB3TOWEXN' => 840,                      // Caregiver level Pelaksana & Bahasa Jepang (160 + 20 + 640 + 20)
                'PROG-EPRN0OPHVV' => 860,                      // Waiter dan Bahasa Inggris Hospitality (180 + 20 + 640 + 20)
                'PROG-YXK9J2OYQV' => 860,                      // Housekeeping dan Bahasa Inggris untuk Hospitality (180 + 20 + 640 + 20)
                'PROG-WUMVOUM12W' => 200,                      // Pelatihan dan Sertifikasi Teknis Housekeeping (180 + 20)
                'PROG-CKVGR92EOO' => 340,                      // Pelatihan dan Sertifikasi Teknik Konstruksi (320 + 20)
                'PROG-LCAQ1LIBXR' => 340,                      // Pelatihan dan Sertifikasi Teknik Konstruksi (320 + 20)
                'PROG-OWSS6PYUBC' => 340,                      // Pelatihan dan Sertifikasi Teknik Kendaraan Ringan / Manufaktur (320 + 20)
                'PROG-UJJR4NICOZ' => 340,                      // Pelatihan Manajemen Pemeliharaan & Servis Kendaraan Ringan (320 + 20)
                'PROG-YJVG00YR1H' => 340,                      // Pelatihan dan Sertifikasi Teknik Kendaraan Ringan Otomotif (320 + 20)
                'PROG-VDQ5IICLVO' => 220,                      // Plantation Worker Sawit & Bahasa Inggris (140 + 20 + 40 + 20)
                'PROG-DEMO-001' => 840,                        // Program Pengelasan Dasar / Welder (160 + 20 + 640 + 20)
            ];

            foreach ($programJpUpdates as $programId => $totalJp) {
                DB::table('training_programs')
                    ->where('id', $programId)
                    ->update(['total_jp' => $totalJp]);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('landing_placement_targets')) {
            Schema::table('landing_placement_targets', function (Blueprint $table): void {
                $columns = array_filter(
                    [
                        'class_count',
                        'technical_jp',
                        'technical_certification_jp',
                        'language_jp',
                        'language_certification_jp',
                        'total_jp',
                    ],
                    fn (string $col): bool => Schema::hasColumn('landing_placement_targets', $col),
                );
                if ($columns !== []) {
                    $table->dropColumn($columns);
                }
            });
        }
    }
};
