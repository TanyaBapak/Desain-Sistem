<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('roles')
            ->where('name', 'institution_admin')
            ->update(['default_tab' => 'modul-c']);
    }

    public function down(): void
    {
        DB::table('roles')
            ->where('name', 'institution_admin')
            ->where('default_tab', 'modul-c')
            ->update(['default_tab' => 'modul-a']);
    }
};
