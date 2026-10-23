<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AccessControlSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['super_admin', 'Super Admin / Pusdatin', 'Tata Kelola Sistem & Keamanan', 'superadmin', 'rbac'],
            ['leadership', 'Menteri / Pimpinan', 'Pengambil Kebijakan Strategis', 'pimpinan', 'dashboard'],
            ['task_force', 'Admin Task Force Nasional', 'Pengendali & Koordinator Program', 'taskforce', 'dashboard'],
            ['directorate_admin', 'Admin Direktorat', 'Pembina & Pengelola Program', 'taskforce', 'modul-b'],
            ['province_admin', 'Admin Disnaker Provinsi', 'Koordinator Ketenagakerjaan Provinsi', 'disnaker', 'modul-a'],
            ['district_admin', 'Admin Disnaker Kabupaten/Kota', 'Operator Data Wilayah Daerah', 'disnaker', 'modul-a'],
            ['bp3mi_admin', 'Admin BP3MI', 'Pelayanan & Pelindungan Kawasan BP3MI', 'matching', 'matching'],
            ['institution_admin', 'Admin Lembaga Vokasi', 'Penyelenggara Pelatihan Vokasi', 'vokasi', 'modul-a'],
            ['demand_admin', 'Admin Demand / Pemberi Kerja', 'Mitra Industri Luar Negeri', 'demand', 'modul-d'],
            ['verifier', 'Verifikator', 'Pemeriksa Keabsahan & Validasi', 'verifikator', 'approvals'],
            ['training_operator', 'Operator Pelatihan', 'Pengelola Presensi & Kelas Pelatihan', 'vokasi', 'modul-b'],
            ['placement_officer', 'Petugas Matching / Penempatan', 'Penyelaras Suplai & Penempatan LN', 'matching', 'matching'],
            ['auditor', 'Auditor / Monitoring', 'Pengawasan Internal & Tata Kelola', 'superadmin', 'reports'],
        ];

        foreach ($roles as [$name, $title, $badge, $coreGroup, $defaultTab]) {
            Role::query()->updateOrCreate(
                ['name' => $name, 'guard_name' => 'web'],
                [
                    'title' => $title,
                    'badge' => $badge,
                    'core_group' => $coreGroup,
                    'default_tab' => $defaultTab,
                ],
            );
        }

        $permissions = [
            ['participant.read', 'Peserta', 'Melihat data calon peserta'],
            ['participant.create', 'Peserta', 'Menambahkan calon peserta'],
            ['participant.verify', 'Peserta', 'Memverifikasi data calon peserta'],
            ['program.read', 'Pelatihan', 'Melihat program pelatihan'],
            ['program.manage', 'Pelatihan', 'Mengelola program pelatihan'],
            ['institution.read', 'Lembaga', 'Melihat data lembaga vokasi'],
            ['institution.manage', 'Lembaga', 'Mengelola lembaga vokasi'],
            ['demand.read', 'Demand', 'Melihat permintaan tenaga kerja'],
            ['demand.manage', 'Demand', 'Mengelola permintaan tenaga kerja'],
            ['matching.manage', 'Matching', 'Menjalankan proses matching'],
            ['placement.manage', 'Penempatan', 'Mengelola penempatan'],
            ['approval.manage', 'Persetujuan', 'Memproses persetujuan data'],
            ['audit.read', 'Audit', 'Melihat jejak audit'],
            ['access.manage', 'Akses', 'Mengelola peran dan izin akses'],
            ['user.manage', 'Pengguna', 'Mengelola akun pengguna'],
            ['master_data.manage', 'Data Induk', 'Mengelola data referensi utama'],
            ['configuration.manage', 'Konfigurasi', 'Mengelola konfigurasi sistem'],
            ['reports.read', 'Laporan', 'Melihat ringkasan laporan'],
        ];

        foreach ($permissions as [$name, $module, $description]) {
            DB::table('permissions')->updateOrInsert(
                ['name' => $name, 'guard_name' => 'web'],
                ['module' => $module, 'description' => $description],
            );
        }

        $permissionIds = DB::table('permissions')->pluck('id', 'name');
        $rolePermissions = [
            'super_admin' => ['access.manage', 'user.manage', 'master_data.manage', 'configuration.manage', 'audit.read'],
            'leadership' => ['participant.read', 'program.read', 'institution.read', 'demand.read', 'reports.read'],
            'task_force' => ['participant.read', 'participant.create', 'participant.verify', 'program.read', 'program.manage', 'institution.read', 'institution.manage', 'demand.read', 'demand.manage', 'matching.manage', 'placement.manage', 'approval.manage', 'reports.read'],
            'directorate_admin' => ['program.read', 'program.manage', 'institution.read', 'institution.manage'],
            'province_admin' => ['participant.read', 'participant.create'],
            'district_admin' => ['participant.read', 'participant.create'],
            'bp3mi_admin' => ['participant.read', 'matching.manage', 'placement.manage'],
            'institution_admin' => ['participant.read', 'participant.create', 'program.read', 'program.manage', 'institution.read', 'institution.manage'],
            'demand_admin' => ['demand.read', 'demand.manage'],
            'verifier' => ['participant.read', 'participant.verify', 'approval.manage'],
            'training_operator' => ['participant.read', 'program.read'],
            'placement_officer' => ['participant.read', 'matching.manage', 'placement.manage'],
            'auditor' => ['reports.read'],
        ];

        foreach ($rolePermissions as $roleName => $names) {
            $roleId = Role::query()->where('name', $roleName)->value('id');
            foreach ($names as $permissionName) {
                DB::table('role_has_permissions')->updateOrInsert([
                    'role_id' => $roleId,
                    'permission_id' => $permissionIds[$permissionName],
                ]);
            }
        }
    }
}
