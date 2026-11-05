<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Standardize preferred_job_roles in job_seekers table
        $targets = ['"WAITER"', '"Waiters"', '"WAITERS"', '"waiter"', '"waiters"', '"waitress"', '"Waitress"', '"WAITRESS"'];
        foreach ($targets as $target) {
            DB::table('job_seekers')
                ->where('preferred_job_roles', 'LIKE', '%' . $target . '%')
                ->update([
                    'preferred_job_roles' => DB::raw("REPLACE(preferred_job_roles, '{$target}', '\"Waiter\"')")
                ]);
        }

        // 2. Standardize skill_name in job_seeker_skills table
        DB::table('job_seeker_skills')
            ->whereIn('skill_name', ['WAITER', 'Waiters', 'WAITERS', 'waiter', 'waiters', 'waitress', 'Waitress', 'WAITRESS'])
            ->update([
                'skill_name' => 'Waiter'
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Non-destructive standardization does not need reversal
    }
};
