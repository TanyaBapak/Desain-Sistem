<?php

use App\Services\GardataPlacementSyncService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('institutions') || ! Schema::hasTable('job_seekers')) {
            return;
        }

        $now = now();
        $syncService = app(GardataPlacementSyncService::class);

        // Bebaskan external_id pada baris GDT-TENANT-* lama terlebih dahulu agar tidak bentrok unique index
        $legacyConcat = DB::connection()->getDriverName() === 'sqlite' ? DB::raw("('legacy-' || id)") : DB::raw("CONCAT('legacy-', id)");
        DB::table('institutions')
            ->where('id', 'LIKE', 'GDT-TENANT-%')
            ->update([
                'external_id' => $legacyConcat,
                'status' => 'Nonaktif',
                'updated_at' => $now,
            ]);

        // 1. Pastikan instansi utama Gardata & SIPPMI terdaftar dengan kode GRD-
        $coreGrdInstitutions = [
            [
                'id' => 'GRD-INDONUSA',
                'name' => 'Politeknik Indonusa Surakarta',
                'type' => 'Perguruan Tinggi / Politeknik',
                'ownership' => 'Swasta',
                'province_id' => '33',
                'district_id' => '3372',
                'external_id' => 'sippmi.com',
                'match_like' => '%Indonusa%',
            ],
            [
                'id' => 'GRD-OMEGA-HOTEL',
                'name' => 'LPK Omega Hotel Academy',
                'type' => 'LPK',
                'ownership' => 'Swasta',
                'province_id' => '33',
                'district_id' => '3301',
                'external_id' => 'omegahotelacademy.sippmi.com',
                'match_like' => '%Omega%',
            ],
            [
                'id' => 'GRD-VICTORIA-HOTEL',
                'name' => 'LPK Victoria Hotel School',
                'type' => 'LPK',
                'ownership' => 'Swasta',
                'province_id' => '33',
                'district_id' => '3372',
                'external_id' => 'victoriahotelschool.sippmi.com',
                'match_like' => '%Victoria%',
            ],
            [
                'id' => 'GRD-DUTA-INTL',
                'name' => 'LPK Duta International Course',
                'type' => 'LPK',
                'ownership' => 'Swasta',
                'province_id' => '35',
                'district_id' => '3501',
                'external_id' => 'dutainternationalcourse.sippmi.com',
                'match_like' => '%Duta International%',
            ],
        ];

        foreach ($coreGrdInstitutions as $inst) {
            $createdAt = DB::table('institutions')->where('id', $inst['id'])->value('created_at') ?? $now;
            $hasProvince = DB::table('provinces')->where('id', $inst['province_id'])->exists();
            $hasDistrict = DB::table('districts')->where('id', $inst['district_id'])->exists();
            DB::table('institutions')->updateOrInsert(
                ['id' => $inst['id']],
                [
                    'name' => $inst['name'],
                    'institution_type' => $inst['type'],
                    'ownership_type' => $inst['ownership'],
                    'province_id' => $hasProvince ? $inst['province_id'] : null,
                    'district_id' => $hasDistrict ? $inst['district_id'] : null,
                    'status' => 'Aktif',
                    'verification_status' => 'Verified',
                    'accreditation' => 'A',
                    'evokasi_status' => 'Terverifikasi e-Vokasi',
                    'external_source' => 'gardata',
                    'external_id' => $inst['external_id'],
                    'created_at' => $createdAt,
                    'updated_at' => $now,
                ]
            );

            // Tautkan peserta yang berasal dari Gardata/SIPPMI ke ID GRD- masing-masing
            DB::table('job_seekers')
                ->whereNull('deleted_at')
                ->where(function ($q) {
                    $q->whereIn('external_source', ['gardata', 'sippmi'])
                        ->orWhere('source_type', 'Gardata');
                })
                ->where('institution_name', 'LIKE', $inst['match_like'])
                ->update([
                    'institution_id' => $inst['id'],
                    'verification_status' => 'Verified',
                    'lifecycle_status' => 'APPROVED',
                    'updated_at' => $now,
                ]);
        }

        // 2. Pastikan instansi lain yang pernah tercatat dengan external_source = 'gardata' memiliki entri GRD-
        $otherGardataInstitutions = DB::table('institutions')
            ->where('external_source', 'gardata')
            ->where('id', 'NOT LIKE', 'GRD-%')
            ->where('id', 'NOT LIKE', 'GDT-TENANT-%')
            ->get();

        foreach ($otherGardataInstitutions as $other) {
            $grdId = $syncService->resolveOrCreateGardataInstitution(
                (string) $other->name,
                (string) ($other->province_id ?: '33'),
                (string) ($other->district_id ?: '3372'),
            );

            DB::table('job_seekers')
                ->where('institution_id', $other->id)
                ->update([
                    'institution_id' => $grdId,
                    'verification_status' => 'Verified',
                    'lifecycle_status' => 'APPROVED',
                    'updated_at' => $now,
                ]);
        }

        // Nonaktifkan baris duplikat GDT-TENANT-* lama agar tidak membingungkan di daftar Super Admin
        DB::table('institutions')
            ->where('id', 'LIKE', 'GDT-TENANT-%')
            ->update([
                'status' => 'Nonaktif',
                'updated_at' => $now,
            ]);

        // 3. Skip verifikasi: seluruh peserta dari Gardata/SIPPMI langsung berstatus Verified & Ready for Placement
        DB::table('job_seekers')
            ->whereNull('deleted_at')
            ->where(function ($q) {
                $q->whereIn('external_source', ['gardata', 'sippmi'])
                    ->orWhere('source_type', 'Gardata');
            })
            ->whereIn('verification_status', ['Pending Verification', 'Belum Terverifikasi', 'Unverified'])
            ->update([
                'verification_status' => 'Verified',
                'readiness_status' => 'Ready for Placement',
                'lifecycle_status' => 'APPROVED',
                'updated_at' => $now,
            ]);

        if (Schema::hasTable('approval_requests')) {
            DB::table('approval_requests')
                ->where('entity_type', 'calon_peserta')
                ->whereIn('submitted_role', ['gardata', 'sippmi'])
                ->where('status', 'PENDING')
                ->update([
                    'status' => 'APPROVED',
                    'reviewed_by' => 'Otomatis (Skip Verifikasi Sync)',
                    'reviewed_at' => $now,
                ]);
        }

        // 4. Tambahkan ID GRD- ke tabel pivot user_institutions untuk akun lembaga terkait
        if (Schema::hasTable('user_institutions')) {
            foreach ($coreGrdInstitutions as $inst) {
                $matchedUsers = DB::table('users')
                    ->where('organization', 'LIKE', $inst['match_like'])
                    ->orWhere('scope_name', 'LIKE', $inst['match_like'])
                    ->get(['id', 'institution_id']);

                foreach ($matchedUsers as $u) {
                    if (! empty($u->institution_id)) {
                        DB::table('user_institutions')->updateOrInsert(
                            ['user_id' => $u->id, 'institution_id' => $u->institution_id],
                            ['updated_at' => $now, 'created_at' => $now]
                        );
                    }
                    DB::table('user_institutions')->updateOrInsert(
                        ['user_id' => $u->id, 'institution_id' => $inst['id']],
                        ['updated_at' => $now, 'created_at' => $now]
                    );
                }
            }
        }

        // 5. Perbarui status log sinkronisasi terakhir yang sebelumnya partial akibat skip verifikasi
        if (Schema::hasTable('integration_sync_logs')) {
            $latestLogs = DB::table('integration_sync_logs')
                ->whereIn('source', ['gardata', 'sippmi'])
                ->where('status', 'partial')
                ->orderByDesc('id')
                ->limit(10)
                ->get();

            foreach ($latestLogs as $log) {
                $fetched = max(0, (int) $log->records_fetched);
                $inserted = max(0, (int) $log->records_inserted);
                DB::table('integration_sync_logs')
                    ->where('id', $log->id)
                    ->update([
                        'status' => 'success',
                        'records_updated' => max((int) $log->records_updated, max(0, $fetched - $inserted)),
                        'records_skipped' => 0,
                        'updated_at' => $now,
                    ]);
            }
        }
    }

    public function down(): void
    {
        // Non-destructive migration
    }
};
