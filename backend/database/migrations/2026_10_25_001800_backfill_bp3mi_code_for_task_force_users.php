<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'bp3mi_code')) {
            return;
        }

        $provinceMap = [
            '31' => 'BP3MI-JKT',
            '32' => 'BP3MI-JABAR',
            '33' => 'BP3MI-JATENG',
            '35' => 'BP3MI-JATIM',
            '36' => 'BP3MI-BANTEN',
            '18' => 'BP3MI-LAMPUNG',
            '52' => 'BP3MI-NTB',
            '34' => 'BP3MI-DIY',
            '73' => 'BP3MI-SULSEL',
            '16' => 'BP3MI-SUMSEL',
        ];

        try {
            $users = User::query()
                ->whereHas('roles', fn ($q) => $q->where('name', 'task_force'))
                ->where(function ($q) {
                    $q->whereNull('bp3mi_code')->orWhere('bp3mi_code', '');
                })
                ->get();

            foreach ($users as $u) {
                $code = $provinceMap[(string) $u->province_id] ?? 'BP3MI-JABAR';
                DB::table('users')->where('id', $u->id)->update(['bp3mi_code' => $code]);
            }
        } catch (\Throwable) {
            // Fallback raw query if relations unavailable
            if (Schema::hasTable('model_has_roles') && Schema::hasTable('roles')) {
                $roleId = DB::table('roles')->where('name', 'task_force')->value('id');
                if ($roleId) {
                    $userIds = DB::table('model_has_roles')->where('role_id', $roleId)->pluck('model_id');
                    DB::table('users')
                        ->whereIn('id', $userIds)
                        ->where(function ($q) {
                            $q->whereNull('bp3mi_code')->orWhere('bp3mi_code', '');
                        })
                        ->update(['bp3mi_code' => 'BP3MI-JABAR']);
                }
            }
        }
    }

    public function down(): void
    {
        // No destructive rollback needed
    }
};
