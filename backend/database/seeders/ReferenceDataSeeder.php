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
                ['3578', '35', 'Kota Surabaya', 'Kota'],
                ['3507', '35', 'Kabupaten Malang', 'Kabupaten'],
                ['3171', '31', 'Kota Jakarta Pusat', 'Kota'],
            ] as [$id, $provinceId, $name, $type]) {
                DB::table('districts')->updateOrInsert(
                    ['id' => $id],
                    ['province_id' => $provinceId, 'name' => $name, 'type' => $type],
                );
            }
        }

        foreach ([
            ['SECT-CARE', 'Kesehatan / Caregiver', 'Pelatihan perawatan lansia dan pasien', 'HeartPulse'],
            ['SECT-WELD', 'Manufaktur / Pengelasan', 'Pengelasan dan fabrikasi logam', 'Hammer'],
            ['SECT-AUTO', 'Otomotif & Alat Berat', 'Perawatan kendaraan dan alat berat', 'Cpu'],
            ['SECT-HOSP', 'Hospitality & Pariwisata', 'Perhotelan dan layanan pariwisata', 'Hotel'],
            ['SECT-AGRI', 'Pertanian Modern', 'Pertanian dan pengolahan hasil pangan', 'Wheat'],
        ] as [$id, $name, $description, $icon]) {
            DB::table('sectors')->updateOrInsert(
                ['id' => $id],
                ['name' => $name, 'description' => $description, 'icon' => $icon],
            );
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

        foreach ([
            ['OCC-KG-01', 'SECT-CARE', 'Caregiver / Kaigo', 'KG-SSW-01', 'Standar keperawatan dan bahasa Jepang'],
            ['OCC-WL-01', 'SECT-WELD', 'Welder SMAW / GMAW', 'WL-JIS-01', 'Sertifikasi pengelasan tingkat lanjut'],
            ['OCC-AT-01', 'SECT-AUTO', 'Teknisi Perawatan Otomotif', 'AT-GER-01', 'Standar teknisi otomotif'],
            ['OCC-HS-01', 'SECT-HOSP', 'Staf Hotel dan Layanan Makanan', 'HS-TW-01', 'Standar perhotelan dan bahasa Mandarin'],
        ] as [$id, $sectorId, $title, $code, $skillStandard]) {
            DB::table('occupations')->updateOrInsert(
                ['id' => $id],
                [
                    'sector_id' => $sectorId,
                    'title' => $title,
                    'code' => $code,
                    'skill_standard' => $skillStandard,
                ],
            );
        }
    }
}
