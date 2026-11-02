<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('training_programs') || ! Schema::hasTable('training_classes')) {
            return;
        }

        $now = now();

        // 1. Selaraskan total_jp dan tanggal pada 3 program yang sudah terhubung ke training_classes (CLS-*)
        //    serta PROG-DEMO-001 agar seluruh kelas berjalan memiliki JP sesuai standar BP2MI dan tanggal aktif.
        $linkedClassProgramUpdates = [
            '001a918c-9738-45bd-baf9-3c67b1fb2988' => [
                'total_jp' => 820, // Agriculture / Alsintan (140 + 20 + 640 + 20)
                'quota' => 25,
                'start_date' => '2026-11-01',
                'end_date' => '2027-01-01',
            ],
            '0021dca8-4394-413e-9877-cc2930c22910' => [
                'total_jp' => 840, // Kesehatan / Keperawatan (160 + 20 + 640 + 20)
                'quota' => 25,
                'start_date' => '2026-11-01',
                'end_date' => '2027-01-01',
            ],
            '00b5d034-9f4c-466f-ac25-efce50775674' => [
                'total_jp' => 960, // Hospitality / Cook (280 + 20 + 640 + 20)
                'quota' => 25,
                'start_date' => '2026-11-01',
                'end_date' => '2027-01-01',
            ],
            'PROG-DEMO-001' => [
                'total_jp' => 840, // Manufaktur / Welder (160 + 20 + 640 + 20)
                'institution_id' => 'VOC-DEMO-001',
                'start_date' => '2026-11-01',
                'end_date' => '2027-01-31',
            ],
        ];

        foreach ($linkedClassProgramUpdates as $programId => $attrs) {
            DB::table('training_programs')
                ->where('id', $programId)
                ->update([...$attrs, 'updated_at' => $now]);
        }

        // 2. Sinkronkan semua program aktif yang sudah memiliki JP (total_jp > 0) dan institution_id
        //    ke tabel training_classes agar jumlah Kelas Berjalan sesuai dengan program ber-JP.
        $jpPrograms = DB::table('training_programs')
            ->where('status', 'Aktif')
            ->whereNotNull('total_jp')
            ->where('total_jp', '>', 0)
            ->whereNotNull('institution_id')
            ->get();

        foreach ($jpPrograms as $program) {
            $existingClass = DB::table('training_classes')
                ->where('training_program_id', $program->id)
                ->first();

            $startDate = $program->start_date ?: '2026-11-01';
            $endDate = $program->end_date ?: '2027-01-31';
            $capacity = max(1, (int) ($program->quota ?: 20));

            if ($existingClass) {
                DB::table('training_classes')
                    ->where('id', $existingClass->id)
                    ->update([
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                        'capacity' => $capacity,
                        'updated_at' => $now,
                    ]);
            } else {
                $classId = 'CLS-' . strtoupper(substr(md5((string) $program->id), 0, 8));
                DB::table('training_classes')->updateOrInsert(
                    ['id' => $classId],
                    [
                        'training_program_id' => $program->id,
                        'institution_id' => $program->institution_id,
                        'class_name' => mb_substr((string) $program->name, 0, 140),
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                        'capacity' => $capacity,
                        'status' => 'Sedang Berjalan',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
            }
        }
    }

    public function down(): void
    {
        // Non-destructive migration
    }
};
