<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class DevelopmentAdminSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            throw new RuntimeException('Seeder akun demo hanya boleh dijalankan di lingkungan local atau testing.');
        }

        $password = config('smkgoglobal.demo_admin_password');
        if (! is_string($password) || strlen($password) < 12) {
            throw new RuntimeException('Atur DEMO_ADMIN_PASSWORD minimal 12 karakter sebelum menjalankan seeder.');
        }

        $user = User::query()->updateOrCreate(
            ['username' => 'admin-demo'],
            [
                'user_code' => 'USR-DEMO-001',
                'name' => 'Administrator Contoh',
                'email' => 'admin-demo@smkgoglobal.local',
                'password' => Hash::make($password),
                'organization' => 'Lingkungan Pengembangan SMK Go Global',
                'scope_level' => 'national',
                'scope_name' => 'Nasional (data contoh)',
                'status' => 'Aktif',
                'avatar_initials' => 'AC',
            ],
        );

        $role = Role::query()->where('name', 'super_admin')->firstOrFail();
        DB::table('model_has_roles')->updateOrInsert([
            'role_id' => $role->id,
            'model_type' => User::class,
            'model_id' => $user->id,
        ]);
    }
}
