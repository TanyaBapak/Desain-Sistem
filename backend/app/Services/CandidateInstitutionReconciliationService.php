<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class CandidateInstitutionReconciliationService
{
    /**
     * Rekonsiliasi seluruh data peserta (job_seekers) ke institusi vokasi
     * yang sesuai berdasarkan pembuat (created_by), nama organisasi,
     * serta pengaturan institution_id pada akun pengguna.
     *
     * @param bool $dryRun Jika true, hanya kalkulasi tanpa melakukan update ke database
     * @return array{
     *     total_processed: int,
     *     total_reconciled: int,
     *     institutions_affected: int,
     *     details: array<string, array{name: string, count: int}>
     * }
     */
    public function reconcileAll(bool $dryRun = false): array
    {
        // 1. Ambil seluruh pengguna lembaga/vokasi yang memiliki institution_id
        $users = DB::table('users')
            ->whereNotNull('institution_id')
            ->where('institution_id', '!=', '')
            ->get(['id', 'username', 'name', 'organization', 'institution_id']);

        $institutions = DB::table('institutions')
            ->pluck('name', 'id')
            ->all();

        $details = [];
        $totalReconciled = 0;

        foreach ($users as $user) {
            $instId = (string) $user->institution_id;
            $instName = $institutions[$instId] ?? null;
            if (! $instName) {
                continue;
            }

            $count = $this->reconcileForTarget($user, $instId, $instName, $dryRun);
            if ($count > 0) {
                if (! isset($details[$instId])) {
                    $details[$instId] = [
                        'name' => $instName,
                        'count' => 0,
                    ];
                }
                $details[$instId]['count'] += $count;
                $totalReconciled += $count;
            }
        }

        // 2. Rekonsiliasi sisa kandidat yang masih belum ter-bind (NULL atau demo)
        $unboundCreators = DB::table('job_seekers')
            ->whereNull('deleted_at')
            ->where(function ($q) {
                $q->whereNull('institution_id')
                    ->orWhere('institution_id', 'VOC-DEMO-001');
            })
            ->whereNotNull('created_by')
            ->where('created_by', '!=', '')
            ->distinct()
            ->pluck('created_by')
            ->all();

        foreach ($unboundCreators as $creator) {
            $creatorClean = trim((string) $creator);
            if (mb_strlen($creatorClean) < 4 || in_array(strtolower($creatorClean), ['admin', 'null', 'demo', 'seeder', 'seeder pengembangan'], true)) {
                continue;
            }

            // Cari institusi resmi (bukan CSV) yang cocok
            $matchedInst = DB::table('institutions')
                ->where('status', 'Aktif')
                ->where('id', 'NOT LIKE', 'CSV-%')
                ->where(function ($q) use ($creatorClean) {
                    $q->where('name', $creatorClean)
                        ->orWhere('name', 'LIKE', "%{$creatorClean}%");
                })
                ->orderByRaw("CASE WHEN id LIKE 'VOC-%' THEN 1 WHEN id LIKE 'INS-%' THEN 2 ELSE 3 END")
                ->first(['id', 'name']);

            if ($matchedInst) {
                $query = DB::table('job_seekers')
                    ->whereNull('deleted_at')
                    ->where('created_by', $creator)
                    ->where(function ($q) use ($matchedInst) {
                        $q->whereNull('institution_id')
                            ->orWhere('institution_id', '!=', $matchedInst->id)
                            ->orWhere('institution_name', '!=', $matchedInst->name);
                    });

                $matchedCount = $query->count();
                if ($matchedCount > 0) {
                    if (! $dryRun) {
                        $query->update([
                            'institution_id' => $matchedInst->id,
                            'institution_name' => $matchedInst->name,
                        ]);
                    }
                    if (! isset($details[$matchedInst->id])) {
                        $details[$matchedInst->id] = [
                            'name' => $matchedInst->name,
                            'count' => 0,
                        ];
                    }
                    $details[$matchedInst->id]['count'] += $matchedCount;
                    $totalReconciled += $matchedCount;
                }
            }
        }

        // 3. Sinkronkan ready_participant_count pada tabel institutions
        if (! $dryRun) {
            $this->syncInstitutionCounts();
            app(BusinessDataPresenter::class)->forgetAll();
        }

        return [
            'total_processed' => DB::table('job_seekers')->whereNull('deleted_at')->count(),
            'total_reconciled' => $totalReconciled,
            'institutions_affected' => count($details),
            'details' => $details,
        ];
    }

    /**
     * Rekonsiliasi data peserta untuk satu akun pengguna tertentu.
     */
    public function reconcileForUser(User|int|string $user, bool $dryRun = false): int
    {
        $userObj = is_object($user) ? $user : DB::table('users')->where('id', $user)->first();
        if (! $userObj || empty($userObj->institution_id)) {
            return 0;
        }

        $inst = DB::table('institutions')->where('id', $userObj->institution_id)->first();
        if (! $inst) {
            return 0;
        }

        $count = $this->reconcileForTarget($userObj, $inst->id, $inst->name, $dryRun);

        if (! $dryRun && $count > 0) {
            $this->syncInstitutionCountForId($inst->id);
            app(BusinessDataPresenter::class)->forgetAll();
        }

        return $count;
    }

    /**
     * Logika inti rekonsiliasi per target institusi dan pengguna.
     */
    private function reconcileForTarget(object $user, string $instId, string $instName, bool $dryRun): int
    {
        $patterns = array_values(array_unique(array_filter([
            trim((string) ($user->name ?? '')),
            trim((string) ($user->username ?? '')),
            trim((string) ($user->organization ?? '')),
            trim($instName),
        ])));

        $query = DB::table('job_seekers')
            ->whereNull('deleted_at')
            ->where(function ($q) use ($patterns, $user) {
                if (! empty($user->id)) {
                    $q->where('created_by', (string) $user->id);
                }
                foreach ($patterns as $pattern) {
                    if (mb_strlen($pattern) >= 3) {
                        $q->orWhere('created_by', $pattern)
                            ->orWhere('created_by', 'LIKE', "%{$pattern}%");
                    }
                }
            })
            ->where(function ($q) use ($instId, $instName) {
                $q->whereNull('institution_id')
                    ->orWhere('institution_id', 'VOC-DEMO-001')
                    ->orWhere(function ($sub) use ($instId, $instName) {
                        $sub->where('institution_id', '!=', $instId)
                            ->where('institution_name', '!=', $instName);
                    });
            });

        $count = $query->count();
        if ($count > 0 && ! $dryRun) {
            $query->update([
                'institution_id' => $instId,
                'institution_name' => $instName,
            ]);
        }

        return $count;
    }

    /**
     * Update ready_participant_count dan total_active_students di tabel institutions
     * agar data di layar profil/daftar lembaga vokasi akurat dan mencerminkan database nyata.
     */
    public function syncInstitutionCounts(): void
    {
        $stats = DB::table('job_seekers')
            ->whereNull('deleted_at')
            ->whereNotNull('institution_id')
            ->where('institution_id', '!=', '')
            ->select(
                'institution_id',
                DB::raw('count(*) as total_students'),
                DB::raw("sum(case when readiness_status = 'Ready for Placement' then 1 else 0 end) as ready_students")
            )
            ->groupBy('institution_id')
            ->get();

        foreach ($stats as $stat) {
            DB::table('institutions')
                ->where('id', $stat->institution_id)
                ->update([
                    'total_active_students' => (int) $stat->total_students,
                    'ready_participant_count' => (int) $stat->ready_students,
                ]);
        }
    }

    public function syncInstitutionCountForId(string $institutionId): void
    {
        $stat = DB::table('job_seekers')
            ->whereNull('deleted_at')
            ->where('institution_id', $institutionId)
            ->select(
                DB::raw('count(*) as total_students'),
                DB::raw("sum(case when readiness_status = 'Ready for Placement' then 1 else 0 end) as ready_students")
            )
            ->first();

        DB::table('institutions')
            ->where('id', $institutionId)
            ->update([
                'total_active_students' => (int) ($stat->total_students ?? 0),
                'ready_participant_count' => (int) ($stat->ready_students ?? 0),
            ]);
    }
}
