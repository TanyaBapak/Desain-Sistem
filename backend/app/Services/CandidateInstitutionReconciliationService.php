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
        // 1. Ambil seluruh pengguna lembaga/vokasi yang memiliki institution_id atau institution_ids
        $users = DB::table('users')
            ->where(function ($q) {
                $q->whereNotNull('institution_id')->where('institution_id', '!=', '')
                    ->orWhereNotNull('institution_ids');
            })
            ->get(['id', 'username', 'name', 'organization', 'institution_id', 'institution_ids']);

        $institutions = DB::table('institutions')
            ->pluck('name', 'id')
            ->all();

        $details = [];
        $totalReconciled = 0;

        foreach ($users as $user) {
            $userInstIds = [];
            if (! empty($user->institution_id)) {
                $userInstIds[] = (string) $user->institution_id;
            }
            if (! empty($user->institution_ids)) {
                $decoded = is_array($user->institution_ids) ? $user->institution_ids : json_decode((string) $user->institution_ids, true);
                if (is_array($decoded)) {
                    foreach ($decoded as $extraId) {
                        if (! empty($extraId)) {
                            $userInstIds[] = (string) $extraId;
                        }
                    }
                }
            }
            $userInstIds = array_values(array_unique(array_filter($userInstIds)));

            foreach ($userInstIds as $instId) {
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
        if (! $userObj) {
            return 0;
        }

        $userInstIds = [];
        if (! empty($userObj->institution_id)) {
            $userInstIds[] = (string) $userObj->institution_id;
        }
        if (! empty($userObj->institution_ids)) {
            $decoded = is_array($userObj->institution_ids) ? $userObj->institution_ids : json_decode((string) $userObj->institution_ids, true);
            if (is_array($decoded)) {
                foreach ($decoded as $extraId) {
                    if (! empty($extraId)) {
                        $userInstIds[] = (string) $extraId;
                    }
                }
            }
        }
        $userInstIds = array_values(array_unique(array_filter($userInstIds)));

        if (empty($userInstIds)) {
            return 0;
        }

        $totalCount = 0;
        foreach ($userInstIds as $instId) {
            $inst = DB::table('institutions')->where('id', $instId)->first();
            if (! $inst) {
                continue;
            }

            $count = $this->reconcileForTarget($userObj, $inst->id, $inst->name, $dryRun);
            if (! $dryRun && $count > 0) {
                $this->syncInstitutionCountForId($inst->id);
            }
            $totalCount += $count;
        }

        if (! $dryRun && $totalCount > 0) {
            app(BusinessDataPresenter::class)->forgetAll();
        }

        return $totalCount;
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
            ->get()
            ->keyBy('institution_id');

        $unboundStats = DB::table('job_seekers')
            ->whereNull('deleted_at')
            ->where(function ($q) {
                $q->whereNull('institution_id')
                    ->orWhere('institution_id', '');
            })
            ->whereNotNull('institution_name')
            ->where('institution_name', '!=', '')
            ->select(
                'institution_name',
                DB::raw('count(*) as total_students'),
                DB::raw("sum(case when readiness_status = 'Ready for Placement' then 1 else 0 end) as ready_students")
            )
            ->groupBy('institution_name')
            ->get();

        $unboundByName = [];
        foreach ($unboundStats as $u) {
            $unboundByName[mb_strtolower(trim((string) $u->institution_name))] = $u;
        }

        $institutions = DB::table('institutions')
            ->where(function ($q) use ($stats) {
                if ($stats->isNotEmpty()) {
                    $q->whereIn('id', $stats->keys());
                }
                $q->orWhere('total_active_students', '>', 0)
                    ->orWhere('ready_participant_count', '>', 0);
            })
            ->get(['id', 'name', 'total_active_students', 'ready_participant_count']);

        foreach ($institutions as $inst) {
            $total = 0;
            $ready = 0;

            if ($stats->has($inst->id)) {
                $stat = $stats->get($inst->id);
                $total += (int) $stat->total_students;
                $ready += (int) $stat->ready_students;
            }

            $instNameKey = mb_strtolower(trim((string) $inst->name));
            if (isset($unboundByName[$instNameKey])) {
                $u = $unboundByName[$instNameKey];
                $total += (int) $u->total_students;
                $ready += (int) $u->ready_students;
            }

            if ((int) ($inst->total_active_students ?? 0) !== $total || (int) ($inst->ready_participant_count ?? 0) !== $ready) {
                DB::table('institutions')
                    ->where('id', $inst->id)
                    ->update([
                        'total_active_students' => $total,
                        'ready_participant_count' => $ready,
                    ]);
            }
        }
    }

    public function syncInstitutionCountForId(string $institutionId): void
    {
        $inst = DB::table('institutions')->where('id', $institutionId)->first(['id', 'name']);
        if (! $inst) {
            return;
        }

        $stat = DB::table('job_seekers')
            ->whereNull('deleted_at')
            ->where('institution_id', $inst->id)
            ->select(
                DB::raw('count(*) as total_students'),
                DB::raw("sum(case when readiness_status = 'Ready for Placement' then 1 else 0 end) as ready_students")
            )
            ->first();

        $total = (int) ($stat->total_students ?? 0);
        $ready = (int) ($stat->ready_students ?? 0);

        if (! empty($inst->name)) {
            $unboundStat = DB::table('job_seekers')
                ->whereNull('deleted_at')
                ->where(function ($q) {
                    $q->whereNull('institution_id')
                        ->orWhere('institution_id', '');
                })
                ->where(function ($q) use ($inst) {
                    $q->where('institution_name', $inst->name)
                        ->orWhereRaw('LOWER(institution_name) = ?', [mb_strtolower($inst->name)]);
                })
                ->select(
                    DB::raw('count(*) as total_students'),
                    DB::raw("sum(case when readiness_status = 'Ready for Placement' then 1 else 0 end) as ready_students")
                )
                ->first();

            $total += (int) ($unboundStat->total_students ?? 0);
            $ready += (int) ($unboundStat->ready_students ?? 0);
        }

        DB::table('institutions')
            ->where('id', $institutionId)
            ->update([
                'total_active_students' => $total,
                'ready_participant_count' => $ready,
            ]);
    }
}
