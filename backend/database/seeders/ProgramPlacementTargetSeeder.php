<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ProgramPlacementTargetSeeder extends Seeder
{
    /**
     * Format:
     * [sector_name, occupation_name, projection_placement, target, class_count, technical_jp, technical_certification_jp, language_jp, language_certification_jp, total_jp]
     */
    public const TARGETS = [
        // 1. Kesehatan (Total Target: 11.600)
        ['Kesehatan', 'Caregiver (lvl pelaksana)', 'Jepang (SSW)', 540, 27, 160, 20, 640, 20, 840],
        ['Kesehatan', 'Caregiver (lvl pelaksana)', 'Belanda, Singapura', 420, 21, 160, 20, 640, 20, 840],
        ['Kesehatan', 'Caregiver/Caretaker', 'Taiwan', 4900, 245, 260, 20, 640, 20, 940],
        ['Kesehatan', 'Elderly Caretaker', 'Malaysia', 4120, 206, 260, 20, 640, 20, 940],
        ['Kesehatan', 'Nursing Home', 'Taiwan (Nursing Home)', 1620, 81, 160, 20, 640, 20, 840],

        // 2. Hospitality (Total Target: 13.140)
        ['Hospitality', 'Spa Therapist', 'Turki, Malaysia, Maladewa, Kuwait, Eropa Timur', 1460, 73, 180, 20, 640, 20, 860],
        ['Hospitality', 'Housekeeping', 'Turki, Eropa Timur, Arab Saudi', 8020, 401, 180, 20, 640, 20, 860],
        ['Hospitality', 'Cleaner', 'Turki, Eropa Timur, Arab Saudi, UAE, Malaysia, Brunei Darussalam', 720, 36, 40, 20, 640, 20, 720],
        ['Hospitality', 'Cook', 'Kroasia, Bulgaria, Turki', 40, 2, 280, 20, 640, 20, 960],
        ['Hospitality', 'Waiter', 'Turki, Brunei Darussalam, Eropa Timur, UEA', 2600, 130, 180, 20, 640, 20, 860],
        ['Hospitality', 'Barista', 'Arab Saudi, Kuwait, UEA', 300, 15, 50, 20, 640, 20, 730],

        // 3. Manufaktur (Total Target: 6.000)
        ['Manufaktur', 'Welder', 'Korea Selatan', 300, 15, 160, 20, 640, 20, 840],
        ['Manufaktur', 'Welder', 'Qatar', 200, 10, 160, 20, 640, 20, 840],
        ['Manufaktur', 'Molding', 'Korea Selatan', 40, 2, 320, 20, 640, 20, 1000],
        ['Manufaktur', 'Operation Production', 'Taiwan', 3200, 160, 100, 20, 640, 20, 780],
        ['Manufaktur', 'Operation Production', 'Malaysia, Slowakia', 2260, 113, 100, 20, 640, 20, 780],
        ['Manufaktur', 'Operation Production', 'Malaysia, Slovakia', 2260, 113, 100, 20, 640, 20, 780],

        // 4. Transportasi (Total Target: 60)
        ['Transportasi', 'Driver', 'Jepang', 20, 1, 200, 20, 640, 20, 880],
        ['Transportasi', 'Bus Driver', 'Arab Saudi', 20, 1, 200, 20, 640, 20, 880],
        ['Transportasi', 'Truck Driver', 'Jepang', 20, 1, 160, 20, 640, 20, 840],

        // 5. Agriculture / Fisherman (Total Target: 4.000)
        ['Agriculture', 'Plantation Worker Sawit', 'Malaysia/Papua Nugini', 2400, 120, 140, 20, 40, 20, 220],
        ['Agriculture', 'Peternakan', 'Taiwan', 300, 15, 140, 20, 640, 20, 820],
        ['Agriculture', 'Aquaculture', 'Taiwan', 500, 25, 140, 20, 640, 20, 820],
        ['Agriculture', 'Kehutanan', 'Taiwan', 260, 13, 140, 20, 640, 20, 820],
        ['Agriculture', 'Farmer/Farming', 'Jepang', 40, 2, 140, 20, 640, 20, 820],
        ['Agriculture', 'Budidaya Tanaman/Agriculture', 'Taiwan', 500, 25, 140, 20, 640, 20, 820],

        // 6. Bahasa (Total Target: 1.700)
        ['Bahasa', 'Bahasa Inggris', 'Eropa Timur, Malaysia, Singapur, Timur Tengah, Italia', 500, 25, null, null, 640, 20, 660],
        ['Bahasa', 'Bahasa Jerman', 'Jerman', 100, 5, null, null, 640, 20, 660],
        ['Bahasa', 'Bahasa Jepang', 'Jepang', 500, 25, null, null, 640, 20, 660],
        ['Bahasa', 'Bahasa Korea', 'Korea Selatan', 300, 15, null, null, 640, 20, 660],
        ['Bahasa', 'Bahasa Mandarin', 'Taiwan', 300, 15, null, null, 640, 20, 660],

        // 7. Pelatihan dan Sertifikasi Teknis (Total Target: 2.000)
        ['Pelatihan dan Sertifikasi Teknis', 'Kesehatan', 'Jepang (SSW), Belanda, Singapura, Taiwan, Malaysia, Jerman, Brunei Darussalam', 700, 35, 260, 20, null, null, 280],
        ['Pelatihan dan Sertifikasi Teknis', 'Manufaktur', 'Korea Selatan, Qatar, Taiwan, Malaysia, Slowakia', 300, 15, 320, 20, null, null, 340],
        ['Pelatihan dan Sertifikasi Teknis', 'Hospitality', 'Turki, Malaysia, Maladewa, Kuwait, Eropa Timur, Arab Saudi, UEA, Brunei Darussalam, Kroasia, Bulgaria', 600, 30, 280, 20, null, null, 200],
        ['Pelatihan dan Sertifikasi Teknis', 'Konstruksi', 'Taiwan, Malaysia, Brunei Darussalam, Eropa Timur, Jerman', 400, 20, 320, 20, null, null, 340],

        // 8. Sertifikasi Teknis (Total Target: 1.500)
        ['Sertifikasi Teknis', 'Kesehatan', 'Jepang (SSW), Belanda, Singapura, Taiwan, Malaysia, Jerman, Brunei Darussalam', 480, 24, null, 20, null, null, 20],
        ['Sertifikasi Teknis', 'Manufaktur', 'Korea Selatan, Qatar, Taiwan, Malaysia, Slowakia', 100, 5, null, 20, null, null, 20],
        ['Sertifikasi Teknis', 'Hospitality', 'Turki, Malaysia, Maladewa, Kuwait, Eropa Timur, Arab Saudi, UEA, Brunei Darussalam, Kroasia, Bulgaria', 400, 20, null, 20, null, null, 20],
        ['Sertifikasi Teknis', 'Agrikultur', 'Malaysia, Taiwan, Jepang', 300, 15, null, 20, null, null, 20],
        ['Sertifikasi Teknis', 'ABK Fishermen', 'Taiwan', 120, 6, null, 20, null, null, 20],
        ['Sertifikasi Teknis', 'ABK Fishermen', 'Korea Selatan', 600, 30, null, 20, null, null, 20],
        ['Sertifikasi Teknis', 'ABK Niaga', 'Italia', 100, 5, null, 20, null, null, 20],
    ];

    public const PROGRAM_JP_UPDATES = [
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

    public function run(): void
    {
        $year = 2027;
        $now = now();
        $hasJpColumns = Schema::hasColumn('landing_placement_targets', 'total_jp');

        foreach (self::TARGETS as [
            $sectorName,
            $occupationName,
            $projectionPlacement,
            $target,
            $classCount,
            $technicalJp,
            $technicalCertificationJp,
            $languageJp,
            $languageCertificationJp,
            $totalJp,
        ]) {
            $payload = [
                'target' => $target,
                'updated_at' => $now,
            ];

            if ($hasJpColumns) {
                $payload['class_count'] = $classCount;
                $payload['technical_jp'] = $technicalJp;
                $payload['technical_certification_jp'] = $technicalCertificationJp;
                $payload['language_jp'] = $languageJp;
                $payload['language_certification_jp'] = $languageCertificationJp;
                $payload['total_jp'] = $totalJp;
            }

            // Perbarui baris existing baik yang menggunakan nama sektor Agriculture maupun Fisherman
            $updated = DB::table('landing_placement_targets')
                ->where('year', $year)
                ->whereIn('sector_name', $sectorName === 'Agriculture' ? ['Agriculture', 'Fisherman'] : [$sectorName])
                ->where('occupation_name', $occupationName)
                ->where('projection_placement', $projectionPlacement)
                ->update($payload);

            if ($updated === 0 && $projectionPlacement !== 'Malaysia, Slovakia') {
                DB::table('landing_placement_targets')->insertOrIgnore([
                    'year' => $year,
                    'sector_name' => $sectorName,
                    'occupation_name' => $occupationName,
                    'projection_placement' => $projectionPlacement,
                    ...$payload,
                    'created_at' => $now,
                ]);
            }
        }

        // Pastikan baris Budidaya Tanaman/ Agriculture (dengan spasi setelah garis miring di DB) juga ter-update
        if ($hasJpColumns) {
            DB::table('landing_placement_targets')
                ->where('year', $year)
                ->where('occupation_name', 'like', 'Budidaya Tanaman/%')
                ->update([
                    'class_count' => 25,
                    'technical_jp' => 140,
                    'technical_certification_jp' => 20,
                    'language_jp' => 640,
                    'language_certification_jp' => 20,
                    'total_jp' => 820,
                    'updated_at' => $now,
                ]);
        }

        if (Schema::hasTable('training_programs')) {
            foreach (self::PROGRAM_JP_UPDATES as $programId => $totalJp) {
                DB::table('training_programs')
                    ->where('id', $programId)
                    ->update(['total_jp' => $totalJp]);
            }
        }
    }
}
