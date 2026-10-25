<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProgramPlacementTargetSeeder extends Seeder
{
    private const TARGETS = [
        ['Kesehatan', 'Caregiver (lvl pelaksana)', 'Jepang (SSW)', 540],
        ['Kesehatan', 'Caregiver (lvl pelaksana)', 'Belanda, Singapura', 420],
        ['Kesehatan', 'Caregiver/Caretaker', 'Taiwan', 4900],
        ['Kesehatan', 'Elderly Caretaker', 'Malaysia', 4120],
        ['Kesehatan', 'Nursing Home', 'Taiwan (Nursing Home)', 1620],
        ['Hospitality', 'Spa Therapist', 'Turki, Malaysia, Maladewa, Kuwait, Eropa Timur', 1460],
        ['Hospitality', 'Housekeeping', 'Turki, Eropa Timur, Arab Saudi', 8020],
        ['Hospitality', 'Cleaner', 'Turki, Eropa Timur, Arab Saudi, UAE, Malaysia, Brunei Darussalam', 720],
        ['Hospitality', 'Cook', 'Kroasia, Bulgaria, Turki', 40],
        ['Hospitality', 'Waiter', 'Turki, Brunei Darussalam, Eropa Timur, UEA', 2600],
        ['Hospitality', 'Barista', 'Arab Saudi, Kuwait, UEA', 300],
        ['Manufaktur', 'Welder', 'Korea Selatan', 300],
        ['Manufaktur', 'Welder', 'Qatar', 200],
        ['Manufaktur', 'Molding', 'Korea Selatan', 40],
        ['Manufaktur', 'Operation Production', 'Taiwan', 3200],
        ['Manufaktur', 'Operation Production', 'Malaysia, Slovakia', 2260],
        ['Transportasi', 'Driver', 'Jepang', 20],
        ['Transportasi', 'Bus Driver', 'Arab Saudi', 20],
        ['Transportasi', 'Truck Driver', 'Jepang', 20],
        ['Agriculture', 'Plantation Worker Sawit', 'Malaysia/Papua Nugini', 2400],
        ['Agriculture', 'Peternakan', 'Taiwan', 300],
        ['Agriculture', 'Aquaculture', 'Taiwan', 500],
        ['Agriculture', 'Kehutanan', 'Taiwan', 260],
        ['Agriculture', 'Farmer/Farming', 'Jepang', 40],
        ['Agriculture', 'Budidaya Tanaman/Agriculture', 'Taiwan', 500],
        ['Bahasa', 'Bahasa Inggris', 'Eropa Timur, Malaysia, Singapur, Timur Tengah, Italia', 500],
        ['Bahasa', 'Bahasa Jerman', 'Jerman', 100],
        ['Bahasa', 'Bahasa Jepang', 'Jepang', 500],
        ['Bahasa', 'Bahasa Korea', 'Korea Selatan', 300],
        ['Bahasa', 'Bahasa Mandarin', 'Taiwan', 300],
        ['Pelatihan dan Sertifikasi Teknis', 'Kesehatan', 'Jepang (SSW), Belanda, Singapura, Taiwan, Malaysia, Jerman, Brunei Darussalam', 700],
        ['Pelatihan dan Sertifikasi Teknis', 'Manufaktur', 'Korea Selatan, Qatar, Taiwan, Malaysia, Slowakia', 300],
        ['Pelatihan dan Sertifikasi Teknis', 'Hospitality', 'Turki, Malaysia, Maladewa, Kuwait, Eropa Timur, Arab Saudi, UEA, Brunei Darussalam, Kroasia, Bulgaria', 600],
        ['Pelatihan dan Sertifikasi Teknis', 'Konstruksi', 'Taiwan, Malaysia, Brunei Darussalam, Eropa Timur, Jerman', 400],
        ['Sertifikasi Teknis', 'Kesehatan', 'Jepang (SSW), Belanda, Singapura, Taiwan, Malaysia, Jerman, Brunei Darussalam', 480],
        ['Sertifikasi Teknis', 'Manufaktur', 'Korea Selatan, Qatar, Taiwan, Malaysia, Slowakia', 100],
        ['Sertifikasi Teknis', 'Hospitality', 'Turki, Malaysia, Maladewa, Kuwait, Eropa Timur, Arab Saudi, UEA, Brunei Darussalam, Kroasia, Bulgaria', 400],
        ['Sertifikasi Teknis', 'Agrikultur', 'Malaysia, Taiwan, Jepang', 300],
        ['Sertifikasi Teknis', 'ABK Fishermen', 'Taiwan', 120],
        ['Sertifikasi Teknis', 'ABK Niaga', 'Italia', 100],
    ];

    public function run(): void
    {
        $year = 2027;
        $now = now();
        foreach (self::TARGETS as [$sectorName, $occupationName, $projectionPlacement, $target]) {
            DB::table('landing_placement_targets')->insertOrIgnore([
                'year' => $year,
                'sector_name' => $sectorName,
                'occupation_name' => $occupationName,
                'projection_placement' => $projectionPlacement,
                'target' => $target,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
