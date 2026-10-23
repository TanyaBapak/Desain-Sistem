<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use RuntimeException;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            throw new RuntimeException('Fixture pengembangan hanya boleh dijalankan di lingkungan local atau testing.');
        }

        $this->call([
            ReferenceDataSeeder::class,
            AccessControlSeeder::class,
            DemoDataSeeder::class,
            DevelopmentAdminSeeder::class,
            DevelopmentRoleUsersSeeder::class,
        ]);
    }
}
