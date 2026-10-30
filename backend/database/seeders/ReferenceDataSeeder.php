<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReferenceDataSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['11', 'Aceh'],
            ['12', 'Sumatera Utara'],
            ['13', 'Sumatera Barat'],
            ['14', 'Riau'],
            ['15', 'Jambi'],
            ['16', 'Sumatera Selatan'],
            ['17', 'Bengkulu'],
            ['18', 'Lampung'],
            ['19', 'Kepulauan Bangka Belitung'],
            ['21', 'Kepulauan Riau'],
            ['31', 'DKI Jakarta'],
            ['32', 'Jawa Barat'],
            ['33', 'Jawa Tengah'],
            ['34', 'Daerah Istimewa Yogyakarta'],
            ['35', 'Jawa Timur'],
            ['36', 'Banten'],
            ['51', 'Bali'],
            ['52', 'Nusa Tenggara Barat'],
            ['53', 'Nusa Tenggara Timur'],
            ['61', 'Kalimantan Barat'],
            ['62', 'Kalimantan Tengah'],
            ['63', 'Kalimantan Selatan'],
            ['64', 'Kalimantan Timur'],
            ['65', 'Kalimantan Utara'],
            ['71', 'Sulawesi Utara'],
            ['72', 'Sulawesi Tengah'],
            ['73', 'Sulawesi Selatan'],
            ['74', 'Sulawesi Tenggara'],
            ['75', 'Gorontalo'],
            ['76', 'Sulawesi Barat'],
            ['81', 'Maluku'],
            ['82', 'Maluku Utara'],
            ['91', 'Papua'],
            ['92', 'Papua Barat'],
            ['93', 'Papua Selatan'],
            ['94', 'Papua Tengah'],
            ['95', 'Papua Pegunungan'],
            ['96', 'Papua Barat Daya'],
        ] as [$id, $name]) {
            DB::table('provinces')->updateOrInsert(['id' => $id], ['name' => $name]);
        }

        $wilayahFile = storage_path('app/reference/wilayah.json');
        if (is_file($wilayahFile) && is_readable($wilayahFile)) {
            $data = json_decode((string) file_get_contents($wilayahFile), true);
            if (isset($data['districts']) && is_array($data['districts'])) {
                foreach ($data['districts'] as $d) {
                    DB::table('districts')->updateOrInsert(
                        ['id' => $d['id']],
                        ['province_id' => $d['province_id'], 'name' => $d['name'], 'type' => $d['type'] ?? 'Kabupaten'],
                    );
                }
            }
        } else {
            foreach ([
                ['3201', '32', 'Kabupaten Bogor', 'Kabupaten'],
                ['3271', '32', 'Kota Bogor', 'Kota'],
                ['3273', '32', 'Kota Bandung', 'Kota'],
                ['3275', '32', 'Kota Bekasi', 'Kota'],
                ['3301', '33', 'Kabupaten Cilacap', 'Kabupaten'],
                ['3372', '33', 'Kota Surakarta', 'Kota'],
                ['3311', '33', 'Kabupaten Sukoharjo', 'Kabupaten'],
                ['3313', '33', 'Kabupaten Karanganyar', 'Kabupaten'],
                ['3374', '33', 'Kota Semarang', 'Kota'],
                ['3578', '35', 'Kota Surabaya', 'Kota'],
                ['3507', '35', 'Kabupaten Malang', 'Kabupaten'],
                ['3171', '31', 'Kota Jakarta Pusat', 'Kota'],
                ['3471', '34', 'Kota Yogyakarta', 'Kota'],
            ] as [$id, $provinceId, $name, $type]) {
                DB::table('districts')->updateOrInsert(
                    ['id' => $id],
                    ['province_id' => $provinceId, 'name' => $name, 'type' => $type],
                );
            }
        }

        foreach ([
            ['SECT-HOSP', 'Hospitality', 'Perhotelan dan layanan pariwisata', 'Hotel', ['hospitality', 'hospitality & pariwisata', 'tourism', 'pariwisata', 'hotel', 'tourism, travel, dan hospitality']],
            ['SECT-CARE', 'Kesehatan', 'Pelatihan perawatan lansia dan pasien', 'HeartPulse', ['kesehatan', 'kesehatan / caregiver', 'caregiver', 'care giver', 'care-giving', 'health', 'healthcare', 'health care']],
            ['SECT-WELD', 'Manufaktur', 'Pengelasan, fabrikasi, dan produksi manufaktur', 'Hammer', ['manufaktur', 'manufaktur / pengelasan', 'manufactur', 'manufacturing', 'pengelasan', 'industri']],
            ['SECT-AUTO', 'Konstruksi', 'Pekerjaan konstruksi dan infrastruktur', 'Building2', ['konstruksi', 'construction', 'otomotif & alat berat', 'alat berat', 'teknik sipil', 'bangunan']],
            ['SECT-AGRI', 'Fisherman', 'Perikanan, kelautan, dan budidaya hasil alam', 'Fish', ['fisherman', 'fisherman (agricultur)', 'fishery', 'agricultur', 'agriculture', 'perikanan', 'pertanian', 'pertanian modern', 'pertanian & peternakan']],
        ] as [$id, $name, $description, $icon, $aliases]) {
            DB::table('sectors')->updateOrInsert(
                ['id' => $id],
                ['name' => $name, 'description' => $description, 'icon' => $icon],
            );
            DB::table('sectors')->where('id', $id)->update([
                'aliases' => json_encode($aliases, JSON_THROW_ON_ERROR),
            ]);
        }

        foreach ([
            ['JP', 'Jepang', 'JP', 'JPY', 104.50],
            ['KR', 'Korea', 'KR', 'KRW', 11.80],
            ['MY', 'Malaysia', 'MY', 'MYR', 3550.00],
            ['TR', 'Turki', 'TR', 'TRY', 450.00],
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

        DB::table('countries')->whereNotIn('id', ['JP', 'KR', 'MY', 'TR'])->delete();
        DB::table('occupations')->whereIn('id', ['OCC-AT-01', 'OCC-HS-01'])->delete();

        foreach ([
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
        ] as [$id, $sectorId, $title, $code, $skillStandard, $aliases]) {
            DB::table('occupations')->updateOrInsert(
                ['id' => $id],
                [
                    'sector_id' => $sectorId,
                    'title' => $title,
                    'code' => $code,
                    'skill_standard' => $skillStandard,
                ],
            );
            DB::table('occupations')->where('id', $id)->update([
                'aliases' => json_encode($aliases, JSON_THROW_ON_ERROR),
            ]);
        }
    }
}
