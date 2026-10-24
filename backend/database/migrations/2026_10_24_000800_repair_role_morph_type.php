<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('model_has_roles')
            ->where('model_type', 'AppModelsUser')
            ->update(['model_type' => User::class]);

        if (DB::getDriverName() === 'mysql') {
            $default = DB::connection()->getPdo()->quote(User::class);
            DB::statement("ALTER TABLE model_has_roles ALTER COLUMN model_type SET DEFAULT {$default}");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            $default = DB::connection()->getPdo()->quote('AppModelsUser');
            DB::statement("ALTER TABLE model_has_roles ALTER COLUMN model_type SET DEFAULT {$default}");
        }
    }
};
