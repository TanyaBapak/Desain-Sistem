<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ResetDevelopmentAdminPassword extends Command
{
    protected $signature = 'account:reset-demo-admin';

    protected $description = 'Buat atau atur ulang akun admin-demo di database lokal';

    public function handle(): int
    {
        if (! $this->laravel->environment(['local', 'testing'])) {
            $this->error('Perintah ini hanya dapat digunakan di lingkungan local atau testing.');

            return self::FAILURE;
        }

        $password = $this->secret('Kata sandi baru (minimal 10 karakter)');
        if (! is_string($password) || strlen($password) < 10) {
            $this->error('Kata sandi harus memiliki minimal 10 karakter.');

            return self::FAILURE;
        }

        $confirmation = $this->secret('Ulangi kata sandi baru');
        if (! is_string($confirmation) || ! hash_equals($password, $confirmation)) {
            $this->error('Konfirmasi kata sandi tidak cocok.');

            return self::FAILURE;
        }

        $role = Role::query()
            ->where('name', 'super_admin')
            ->where('guard_name', 'web')
            ->first();

        if ($role === null) {
            $this->error('Peran Super Admin belum tersedia. Jalankan seeder AccessControlSeeder terlebih dahulu.');

            return self::FAILURE;
        }

        DB::transaction(function () use ($password, $role): void {
            $user = User::withTrashed()->firstOrNew(['username' => 'admin-demo']);

            if (! $user->exists) {
                $user->fill([
                    'user_code' => 'USR-DEMO-001',
                    'name' => 'Administrator Contoh',
                    'email' => 'admin-demo@smkgoglobal.local',
                    'organization' => 'Lingkungan Pengembangan SMK Go Global',
                    'scope_level' => 'national',
                    'scope_name' => 'Nasional (data contoh)',
                    'avatar_initials' => 'AC',
                ]);
            }

            $user->password = Hash::make($password);
            $user->status = 'Aktif';
            $user->save();

            if ($user->trashed()) {
                $user->restore();
            }

            $user->roles()->sync([$role->id]);
        });

        $this->info('Akun admin-demo siap digunakan. Kata sandi tersimpan di database dalam bentuk hash.');

        return self::SUCCESS;
    }
}
