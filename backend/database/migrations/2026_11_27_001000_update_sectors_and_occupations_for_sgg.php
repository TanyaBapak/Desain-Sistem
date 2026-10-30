<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Update sectors
        $sectors = [
            [
                'id' => 'SECT-HOSP',
                'name' => 'Hospitality',
                'description' => 'Perhotelan dan layanan pariwisata',
                'icon' => 'Hotel',
                'aliases' => ['hospitality', 'hospitality & pariwisata', 'tourism', 'pariwisata', 'hotel', 'tourism, travel, dan hospitality'],
            ],
            [
                'id' => 'SECT-CARE',
                'name' => 'Kesehatan',
                'description' => 'Pelatihan perawatan lansia dan pasien',
                'icon' => 'HeartPulse',
                'aliases' => ['kesehatan', 'kesehatan / caregiver', 'caregiver', 'care giver', 'care-giving', 'health', 'healthcare', 'health care'],
            ],
            [
                'id' => 'SECT-WELD',
                'name' => 'Manufaktur',
                'description' => 'Pengelasan, fabrikasi, dan produksi manufaktur',
                'icon' => 'Hammer',
                'aliases' => ['manufaktur', 'manufaktur / pengelasan', 'manufactur', 'manufacturing', 'pengelasan', 'industri'],
            ],
            [
                'id' => 'SECT-AUTO',
                'name' => 'Konstruksi',
                'description' => 'Pekerjaan konstruksi dan infrastruktur',
                'icon' => 'Building2',
                'aliases' => ['konstruksi', 'construction', 'otomotif & alat berat', 'alat berat', 'teknik sipil', 'bangunan'],
            ],
            [
                'id' => 'SECT-AGRI',
                'name' => 'Fisherman',
                'description' => 'Perikanan, kelautan, dan budidaya hasil alam',
                'icon' => 'Fish',
                'aliases' => ['fisherman', 'fisherman (agricultur)', 'fishery', 'agricultur', 'agriculture', 'perikanan', 'pertanian', 'pertanian modern', 'pertanian & peternakan'],
            ],
        ];

        foreach ($sectors as $sector) {
            DB::table('sectors')->updateOrInsert(
                ['id' => $sector['id']],
                [
                    'name' => $sector['name'],
                    'description' => $sector['description'],
                    'icon' => $sector['icon'],
                    'aliases' => json_encode($sector['aliases'], JSON_THROW_ON_ERROR),
                ]
            );
        }

        // 2. Remove obsolete placeholder occupations
        DB::table('occupations')->whereIn('id', ['OCC-AT-01', 'OCC-HS-01'])->delete();

        // 3. Upsert detailed occupations
        $occupations = [
            // Hospitality
            ['OCC-HOSP-01', 'SECT-HOSP', 'Spa Therapist', 'HOSP-SPA', 'Standar terapi spa dan relaksasi', ['spa', 'spa therapist', 'therapist']],
            ['OCC-HOSP-02', 'SECT-HOSP', 'Housekeeping', 'HOSP-HK', 'Standar tata graha hotel internasional', ['housekeeping', 'house keeper', 'tata graha']],
            ['OCC-HOSP-03', 'SECT-HOSP', 'Cleaner', 'HOSP-CLN', 'Standar kebersihan komersial dan sanitasi', ['cleaner', 'cleaning service', 'pembersih']],
            ['OCC-HOSP-04', 'SECT-HOSP', 'Cook', 'HOSP-CK', 'Standar kuliner dan pengolahan makanan', ['cook', 'chef', 'koki', 'juru masak']],
            ['OCC-HOSP-05', 'SECT-HOSP', 'Waiter', 'HOSP-WT', 'Standar pelayanan restoran dan perhotelan', ['waiter', 'waitress', 'pramusaji']],
            ['OCC-HOSP-06', 'SECT-HOSP', 'Barista', 'HOSP-BAR', 'Standar peracikan kopi dan minuman', ['barista', 'coffee maker']],

            // Kesehatan
            ['OCC-KG-01', 'SECT-CARE', 'Caregiver (Lvl Pelaksana)', 'CARE-LVL', 'Standar perawat pelaksana lansia', ['caregiver (lvl pelaksana)', 'caregiver', 'kaigo', 'caregiver / kaigo']],
            ['OCC-CARE-02', 'SECT-CARE', 'Caregiver/Caretaker', 'CARE-CT', 'Standar pendampingan perawatan pasien', ['caregiver/caretaker', 'caretaker']],
            ['OCC-CARE-03', 'SECT-CARE', 'Elderly Caretaker', 'CARE-ELD', 'Standar perawatan khusus geriatri', ['elderly caretaker', 'geriatric care']],
            ['OCC-CARE-04', 'SECT-CARE', 'Nursing Home', 'CARE-NH', 'Standar pelayanan fasilitas panti wreda', ['nursing home', 'nurse assistant']],

            // Manufaktur
            ['OCC-WL-01', 'SECT-WELD', 'Welder', 'MFG-WELD', 'Sertifikasi pengelasan SMAW/GMAW/FCAW', ['welder', 'welder smaw / gmaw', 'pengelasan', 'juru las']],
            ['OCC-MFG-02', 'SECT-WELD', 'Molding', 'MFG-MOLD', 'Standar cetakan injeksi plastik dan logam', ['molding', 'moulding', 'cetakan']],
            ['OCC-MFG-03', 'SECT-WELD', 'Operation Production', 'MFG-PROD', 'Standar operator lini perakitan dan manufaktur', ['operation production', 'operator produksi', 'production operator']],

            // Fisherman
            ['OCC-FISH-01', 'SECT-AGRI', 'Plantation Worker Sawit', 'FISH-SAWIT', 'Standar pemanenan dan budidaya perkebunan kelapa sawit', ['plantation worker sawit', 'pekerja sawit', 'sawit']],
            ['OCC-FISH-02', 'SECT-AGRI', 'Peternakan', 'FISH-TERNAK', 'Standar pemeliharaan dan peternakan hewan', ['peternakan', 'livestock']],
            ['OCC-FISH-03', 'SECT-AGRI', 'Aquaculture', 'FISH-AQUA', 'Standar budidaya perikanan dan hasil laut', ['aquaculture', 'budidaya perikanan', 'abk fishermen']],
            ['OCC-FISH-04', 'SECT-AGRI', 'Kehutanan', 'FISH-HUTAN', 'Standar konservasi dan pemanenan hasil hutan', ['kehutanan', 'forestry']],
            ['OCC-FISH-05', 'SECT-AGRI', 'Farmer/Farming', 'FISH-FARM', 'Standar pertanian modern dan bercocok tanam', ['farmer/farming', 'farmer', 'farming', 'petani']],
            ['OCC-FISH-06', 'SECT-AGRI', 'Budidaya Tanaman/Agriculture', 'FISH-AGRI', 'Standar budidaya tanaman pangan dan hortikultura', ['budidaya tanaman/agriculture', 'agriculture', 'agrikultur']],
        ];

        foreach ($occupations as [$id, $sectorId, $title, $code, $skillStandard, $aliases]) {
            DB::table('occupations')->updateOrInsert(
                ['id' => $id],
                [
                    'sector_id' => $sectorId,
                    'title' => $title,
                    'code' => $code,
                    'skill_standard' => $skillStandard,
                    'aliases' => json_encode($aliases, JSON_THROW_ON_ERROR),
                ]
            );
        }

        // 4. Update landing placement targets
        DB::table('landing_placement_targets')
            ->where('sector_name', 'Agriculture')
            ->update(['sector_name' => 'Fisherman']);
    }

    public function down(): void
    {
        // Revert sector names
        DB::table('sectors')->where('id', 'SECT-HOSP')->update(['name' => 'Hospitality & Pariwisata']);
        DB::table('sectors')->where('id', 'SECT-CARE')->update(['name' => 'Kesehatan / Caregiver']);
        DB::table('sectors')->where('id', 'SECT-WELD')->update(['name' => 'Manufaktur / Pengelasan']);
        DB::table('sectors')->where('id', 'SECT-AUTO')->update(['name' => 'Otomotif & Alat Berat']);
        DB::table('sectors')->where('id', 'SECT-AGRI')->update(['name' => 'Pertanian Modern']);

        DB::table('landing_placement_targets')
            ->where('sector_name', 'Fisherman')
            ->update(['sector_name' => 'Agriculture']);
    }
};
