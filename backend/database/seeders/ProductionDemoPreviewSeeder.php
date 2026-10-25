<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use RuntimeException;

class ProductionDemoPreviewSeeder extends Seeder
{
    private const ACCOUNTS = [
        ['pimpinan', 'Pimpinan Contoh', 'leadership', 'Nasional (data contoh)', 'national', null, null, null, null],
        ['taskforce', 'Koordinator Contoh Task Force', 'task_force', 'BP3MI Jawa Barat (data contoh)', 'provinsi', '32', null, null, null, 'BP3MI-JABAR'],
        ['direktorat', 'Administrator Contoh Direktorat', 'directorate_admin', 'Nasional (data contoh)', 'national', null, null, null, null],
        ['disnaker-provinsi', 'Petugas Contoh Disnaker Provinsi', 'province_admin', 'Jawa Barat (data contoh)', 'provinsi', '32', null, null, null],
        ['disnaker-kabupaten', 'Petugas Contoh Disnaker Kabupaten', 'district_admin', 'Kota Bogor (data contoh)', 'kabupaten', '32', '3271', null, null],
        ['bp3mi', 'Petugas Contoh BP3MI', 'bp3mi_admin', 'Nasional (data contoh)', 'national', null, null, null, null],
        ['lembaga-vokasi', 'Operator Contoh Lembaga Vokasi', 'institution_admin', 'SMK Contoh Cibinong', 'lembaga', '32', '3201', 'VOC-DEMO-001', null],
        ['pengelola-demand', 'Pengelola Contoh Demand', 'demand_admin', 'Pemberi Kerja Contoh', 'demand', null, null, null, 'EMP-DEMO-001'],
        ['verifikator', 'Verifikator Contoh', 'verifier', 'Nasional (data contoh)', 'national', null, null, null, null],
        ['operator-pelatihan', 'Operator Contoh Pelatihan', 'training_operator', 'SMK Contoh Cibinong', 'lembaga', '32', '3201', 'VOC-DEMO-001', null],
        ['petugas-penempatan', 'Petugas Contoh Penempatan', 'placement_officer', 'Nasional (data contoh)', 'national', null, null, null, null],
        ['auditor', 'Auditor Contoh', 'auditor', 'Nasional (data contoh)', 'national', null, null, null, null],
    ];

    public function run(): void
    {
        if (! (bool) config('smkgoglobal.demo_preview_enabled')) {
            throw new RuntimeException('Seeder preview demo dinonaktifkan. Set DEMO_PREVIEW_ENABLED=true secara sengaja sebelum menjalankannya.');
        }

        $this->assertReferenceDataExists();

        DB::transaction(function (): void {
            $this->call(DemoDataSeeder::class);
            $this->seedPreviewAccounts();
        });
    }

    private function assertReferenceDataExists(): void
    {
        $required = [
            'provinces' => ['32'],
            'districts' => ['3201', '3271'],
            'sectors' => ['SECT-WELD'],
            'occupations' => ['OCC-WL-01'],
            'countries' => ['JP'],
        ];

        foreach ($required as $table => $ids) {
            $missing = array_diff($ids, DB::table($table)->whereIn('id', $ids)->pluck('id')->all());
            if ($missing !== []) {
                throw new RuntimeException("Seeder preview demo membutuhkan referensi yang belum tersedia pada tabel {$table}.");
            }
        }

        foreach (self::ACCOUNTS as [, , $roleName]) {
            if (! Role::query()->where('name', $roleName)->exists()) {
                throw new RuntimeException("Peran {$roleName} belum tersedia. Jalankan seeder akses resmi terlebih dahulu.");
            }
        }
    }

    private function seedPreviewAccounts(): void
    {
        foreach (self::ACCOUNTS as [
            $username,
            $name,
            $roleName,
            $scopeName,
            $scopeLevel,
            $provinceId,
            $districtId,
            $institutionId,
            $employerId,
            $bp3miCode,
        ]) {
            $user = User::query()->firstOrCreate(
                ['username' => 'demo-'.$username],
                [
                    'user_code' => 'USR-DEMO-'.Str::upper(str_replace('-', '_', $username)),
                    'name' => $name,
                    'email' => 'demo-'.$username.'@example.invalid',
                    'password' => Hash::make(Str::random(64)),
                    'organization' => $name,
                    'scope_level' => $scopeLevel,
                    'scope_name' => $scopeName,
                    'province_id' => $provinceId,
                    'bp3mi_code' => $bp3miCode,
                    'district_id' => $districtId,
                    'institution_id' => $institutionId,
                    'employer_id' => $employerId,
                    'status' => 'Aktif',
                    'mfa_enabled' => false,
                    'avatar_initials' => 'DEMO',
                ],
            );

            $role = Role::query()->where('name', $roleName)->firstOrFail();
            $user->roles()->sync([$role->id]);
        }
    }
}
