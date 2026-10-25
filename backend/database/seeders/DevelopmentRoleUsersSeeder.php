<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class DevelopmentRoleUsersSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            throw new RuntimeException('Akun demo peran hanya boleh dibuat di lingkungan local atau testing.');
        }

        $configuredPassword = config('smkgoglobal.demo_admin_password');
        $adminPasswordHash = User::query()->where('username', 'admin-demo')->value('password');
        if (
            (! is_string($configuredPassword) || strlen($configuredPassword) < 12)
            && ! is_string($adminPasswordHash)
        ) {
            throw new RuntimeException('Atur DEMO_ADMIN_PASSWORD atau buat akun admin-demo sebelum menjalankan seeder.');
        }
        $passwordHash = is_string($configuredPassword) && strlen($configuredPassword) >= 12
            ? Hash::make($configuredPassword)
            : $adminPasswordHash;

        $accounts = [
            ['pimpinan', 'Pimpinan Contoh', 'pimpinan@example.invalid', 'leadership', 'Nasional (data contoh)', 'national', null, null, null, null, null],
            ['taskforce', 'Koordinator Contoh Task Force', 'taskforce@example.invalid', 'task_force', 'BP3MI Jawa Barat (data contoh)', 'provinsi', '32', null, null, null, 'BP3MI-JABAR'],
            ['direktorat', 'Administrator Contoh Direktorat', 'direktorat@example.invalid', 'directorate_admin', 'Nasional (data contoh)', 'national', null, null, null, null, null],
            ['disnaker-provinsi', 'Petugas Contoh Disnaker Provinsi', 'disnaker-provinsi@example.invalid', 'province_admin', 'Jawa Barat (data contoh)', 'provinsi', '32', null, null, null, null],
            ['disnaker-kabupaten', 'Petugas Contoh Disnaker Kabupaten', 'disnaker-kabupaten@example.invalid', 'district_admin', 'Kota Bogor (data contoh)', 'kabupaten', '32', '3271', null, null, null],
            ['bp3mi', 'Petugas Contoh BP3MI', 'bp3mi@example.invalid', 'bp3mi_admin', 'Nasional (data contoh)', 'national', null, null, null, null, null],
            ['lembaga-vokasi', 'Operator Contoh Lembaga Vokasi', 'lembaga-vokasi@example.invalid', 'institution_admin', 'SMK Contoh Cibinong', 'lembaga', '32', '3201', 'VOC-DEMO-001', null, null],
            ['pengelola-demand', 'Pengelola Contoh Demand', 'pengelola-demand@example.invalid', 'demand_admin', 'Pemberi Kerja Contoh', 'demand', null, null, null, 'EMP-DEMO-001', null],
            ['verifikator', 'Verifikator Contoh', 'verifikator@example.invalid', 'verifier', 'Nasional (data contoh)', 'national', null, null, null, null, null],
            ['operator-pelatihan', 'Operator Contoh Pelatihan', 'operator-pelatihan@example.invalid', 'training_operator', 'SMK Contoh Cibinong', 'lembaga', '32', '3201', 'VOC-DEMO-001', null, null],
            ['petugas-penempatan', 'Petugas Contoh Penempatan', 'petugas-penempatan@example.invalid', 'placement_officer', 'Nasional (data contoh)', 'national', null, null, null, null, null],
            ['auditor', 'Auditor Contoh', 'auditor@example.invalid', 'auditor', 'Nasional (data contoh)', 'national', null, null, null, null, null],
        ];

        foreach ($accounts as $account) {
            $username = $account[0];
            $name = $account[1];
            $email = $account[2];
            $roleName = $account[3];
            $scopeName = $account[4];
            $scopeLevel = $account[5];
            $provinceId = $account[6] ?? null;
            $districtId = $account[7] ?? null;
            $institutionId = $account[8] ?? null;
            $employerId = $account[9] ?? null;
            $bp3miCode = $account[10] ?? null;
            $role = Role::query()->where('name', $roleName)->firstOrFail();
            $user = User::query()->updateOrCreate(
                ['username' => 'demo-'.$username],
                [
                    'user_code' => 'USR-DEMO-'.strtoupper(str_replace('-', '_', $username)),
                    'name' => $name,
                    'email' => $email,
                    'password' => $passwordHash,
                    'organization' => $name,
                    'scope_level' => $scopeLevel,
                    'scope_name' => $scopeName,
                    'province_id' => $provinceId,
                    'bp3mi_code' => $bp3miCode,
                    'district_id' => $districtId,
                    'institution_id' => $institutionId,
                    'employer_id' => $employerId,
                    'status' => 'Aktif',
                    'avatar_initials' => 'DEMO',
                ],
            );

            DB::table('model_has_roles')->where([
                'model_type' => User::class,
                'model_id' => $user->id,
            ])->delete();
            DB::table('model_has_roles')->insert([
                'role_id' => $role->id,
                'model_type' => User::class,
                'model_id' => $user->id,
            ]);
        }
    }
}
