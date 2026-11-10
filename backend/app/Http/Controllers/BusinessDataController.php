<?php

namespace App\Http\Controllers;

use App\Services\Bp3miScope;
use App\Services\BusinessDataPresenter;
use App\Services\CandidateInstitutionReconciliationService;
use App\Services\ProgramSyncFromProviders;
use App\Services\ProviderRecommendationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class BusinessDataController extends Controller
{
    private const ENTITY_TABLES = [
        'candidates' => 'job_seekers',
        'programs' => 'training_programs',
        'providers' => 'institutions',
        'demands' => 'job_demands',
    ];

    public static function parseCatalogUrls(mixed $raw): array
    {
        if (empty($raw)) {
            return [];
        }
        if (is_array($raw)) {
            return array_values(array_filter(array_map('trim', $raw)));
        }
        $raw = trim((string) $raw);
        if ($raw === '') {
            return [];
        }
        if (str_starts_with($raw, '[') && str_ends_with($raw, ']')) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                return array_values(array_filter(array_map('trim', $decoded)));
            }
        }
        $lines = preg_split('/[\r\n,]+/', $raw);
        return array_values(array_filter(array_map('trim', $lines ?: [])));
    }

    public function store(Request $request, string $type): RedirectResponse|JsonResponse
    {
        $this->authorizeWrite($request, $type, 'create');
        $data = $this->validateData($request, $type);
        $id = match ($type) {
            'candidates' => Str::upper('CAND-'.Str::random(10)),
            'programs' => Str::upper('PROG-'.Str::random(10)),
            'providers' => Str::upper('VOC-'.Str::random(10)),
            'demands' => Str::upper('DEM-'.Str::random(10)),
        };

        DB::transaction(function () use ($request, $type, $data, $id): void {
            match ($type) {
                'candidates' => $this->saveCandidate($request, $data, $id, true),
                'programs' => $this->saveProgram($request, $data, $id, true),
                'providers' => $this->saveProvider($request, $data, $id, true),
                'demands' => $this->saveDemand($request, $data, $id, true),
            };
            $this->createApprovalRequest($request, $type, $id);
        });
        app(BusinessDataPresenter::class)->forgetAll();

        if ($request->wantsJson() || ($request->ajax() && ! $request->header('X-Inertia'))) {
            return response()->json([
                'success' => true,
                'id' => $id,
                'message' => 'Data berhasil disimpan ke database.',
            ]);
        }

        return back()->with('success', 'Data berhasil disimpan ke database.');
    }

    public function importCandidates(Request $request): RedirectResponse|JsonResponse
    {
        $this->authorizeWrite($request, 'candidates', 'create');
        $validated = $request->validate([
            'candidates' => ['required', 'array', 'min:1', 'max:20000'],
            'candidates.*.nik' => ['nullable', 'string', 'max:32'],
            'candidates.*.fullName' => ['required', 'string', 'max:150'],
            'candidates.*.gender' => ['nullable', 'string', 'max:20'],
            'candidates.*.provinsi' => ['nullable', 'string', 'max:100'],
            'candidates.*.kabupatenKota' => ['nullable', 'string', 'max:100'],
            'candidates.*.educationLevel' => ['nullable', 'string', 'max:50'],
            'candidates.*.institutionName' => ['nullable', 'string', 'max:255'],
            'candidates.*.sourceType' => ['nullable', 'string', 'max:100'],
            'candidates.*.major' => ['nullable', 'string', 'max:150'],
            'candidates.*.skills' => ['nullable', 'array'],
            'candidates.*.skills.*' => ['nullable', 'string', 'max:100'],
            'candidates.*.workExperiences' => ['nullable', 'array'],
            'candidates.*.certifications' => ['nullable', 'array'],
            'candidates.*.preferredSectors' => ['nullable', 'array'],
            'candidates.*.languageProficiency' => ['nullable', 'array'],
            'candidates.*.preferredCountry' => ['nullable', 'array'],
            'candidates.*.preferredJobRole' => ['nullable', 'array'],
            'candidates.*.readinessStatus' => ['nullable', 'string', 'max:100'],
        ], [
            'candidates.required' => 'Daftar calon peserta wajib disertakan.',
            'candidates.array' => 'Format data calon peserta tidak valid.',
            'candidates.min' => 'Minimal 1 data calon peserta untuk diimpor.',
            'candidates.max' => 'Jumlah data calon peserta yang diunggah maksimal 20.000 baris sekaligus.',
        ]);

        $createdCount = 0;
        $updatedCount = 0;

        DB::transaction(function () use ($request, $validated, &$createdCount, &$updatedCount): void {
            $user = $request->user();
            $role = $user->roles()->value('name');
            $institution = (in_array($role, ['institution_admin', 'training_operator', 'vokasi', 'lembaga_vokasi'], true) || $user->scope_level === 'lembaga')
                ? $this->resolveUserInstitution($user)
                : null;

            $usedNiks = [];

            foreach ($validated['candidates'] as $idx => $item) {
                $rawNik = preg_replace('/\D/', '', (string) ($item['nik'] ?? ''));
                $hasValidNik = strlen($rawNik) === 16;
                $nik = $hasValidNik ? $rawNik : null;

                $existing = $nik ? DB::table('job_seekers')->where('nik', $nik)->first() : null;

                // An existing candidate should ONLY be updated if:
                // 1) The candidate's full name matches (case-insensitive) - preventing different people from overwriting each other
                // 2) The user has scope/permission to update this record (same institution or super_admin/taskforce)
                $nameMatches = $existing && mb_strtolower(trim((string) $existing->full_name)) === mb_strtolower(trim((string) $item['fullName']));
                $userOwnsRecord = $existing && (
                    empty($existing->institution_id)
                    || ($institution && $existing->institution_id === $institution->id)
                    || $user->id === $existing->created_by
                    || $user->name === $existing->created_by
                    || in_array($role, ['super_admin', 'superadmin', 'task_force', 'taskforce'], true)
                );

                $canUpdate = $existing && $nameMatches && $userOwnsRecord;

                if ($canUpdate) {
                    $creating = false;
                    $id = $existing->id;
                    $candidateNik = $nik;
                    $usedNiks[] = $candidateNik;
                    $updatedCount++;
                } else {
                    $creating = true;
                    $id = Str::upper('CAND-'.Str::random(10));

                    // If NIK is empty, or if NIK already belongs to another candidate in DB,
                    // or if NIK was already used by another row in this batch:
                    // Assign a guaranteed unique non-colliding NIK so this new candidate is safely inserted without overwriting anyone.
                    if (! $hasValidNik || ($existing && ! $nameMatches) || in_array($nik, $usedNiks, true) || ($nik && DB::table('job_seekers')->where('nik', $nik)->exists())) {
                        $prefix = $hasValidNik ? substr($rawNik, 0, 4) : '3300';
                        $candidateNik = $this->generateUniqueSyntheticNik($prefix, $usedNiks);
                    } else {
                        $candidateNik = $nik;
                        $usedNiks[] = $candidateNik;
                    }
                    $createdCount++;
                }

                $resolved = $this->resolveProvinceAndDistrict($item['provinsi'] ?? null, $item['kabupatenKota'] ?? null, $user, $institution);

                // Normalise gender
                $genderRaw = mb_strtoupper(trim((string) ($item['gender'] ?? 'L')));
                $gender = str_starts_with($genderRaw, 'P') ? 'P' : 'L';

                // Normalise education level
                $eduRaw = mb_strtoupper(trim((string) ($item['educationLevel'] ?? 'SMK')));
                $educationLevel = match (true) {
                    str_contains($eduRaw, 'D3') || str_contains($eduRaw, 'DIPLOMA') => 'D3',
                    str_contains($eduRaw, 'S1') || str_contains($eduRaw, 'SARJANA') || str_contains($eduRaw, 'D4') => 'S1',
                    str_contains($eduRaw, 'SMK') || str_contains($eduRaw, 'SMA') || str_contains($eduRaw, 'SLTA') => 'SMK',
                    default => 'Lainnya',
                };

                // Normalise readiness status
                $readyRaw = mb_strtolower(trim((string) ($item['readinessStatus'] ?? '')));
                $readinessStatus = match (true) {
                    str_contains($readyRaw, 'reskilling') || str_contains($readyRaw, 'ulang') => 'Needs Reskilling',
                    str_contains($readyRaw, 'upskilling') || str_contains($readyRaw, 'tingkat') => 'Needs Upskilling',
                    default => 'Ready for Placement',
                };

                // Normalise languages
                $languages = [];
                foreach ($item['languageProficiency'] ?? [] as $lang) {
                    if (is_array($lang) && ! empty($lang['language'])) {
                        $languages[] = [
                            'language' => (string) $lang['language'],
                            'level' => (string) ($lang['level'] ?? 'Basic'),
                        ];
                    } elseif (is_string($lang) && trim($lang) !== '') {
                        $languages[] = [
                            'language' => trim($lang),
                            'level' => 'Basic',
                        ];
                    }
                }
                if (empty($languages)) {
                    $languages = [['language' => 'Inggris', 'level' => 'Basic']];
                }

                $candidateData = [
                    'nik' => $candidateNik,
                    'fullName' => $item['fullName'],
                    'gender' => $gender,
                    'provinsi' => $resolved['province_name'],
                    'kabupatenKota' => $resolved['district_name'],
                    'educationLevel' => $educationLevel,
                    'institutionName' => $institution?->name ?? ($user->organization ?: ($user->scope_name ?: ($item['institutionName'] ?: 'Lembaga Vokasi'))),
                    'sourceType' => $item['sourceType'] ?? (in_array($role, ['institution_admin', 'vokasi', 'lembaga_vokasi', 'training_operator'], true) ? 'Lembaga Vokasi' : 'Disnaker Pemda'),
                    'major' => ! empty($item['major']) ? $item['major'] : 'Umum',
                    'skills' => array_values(array_filter($item['skills'] ?? [], fn ($s) => is_string($s) && trim($s) !== '')),
                    'workExperiences' => $item['workExperiences'] ?? [],
                    'certifications' => $item['certifications'] ?? [],
                    'preferredSectors' => ! empty($item['preferredSectors']) ? $item['preferredSectors'] : ['Hospitality & Pariwisata'],
                    'languageProficiency' => $languages,
                    'preferredCountry' => ! empty($item['preferredCountry']) ? $item['preferredCountry'] : ['Jepang'],
                    'preferredJobRole' => ! empty($item['preferredJobRole']) ? $item['preferredJobRole'] : ['Staf Umum'],
                    'readinessStatus' => $readinessStatus,
                    'verificationStatus' => 'Pending Verification',
                    'lifecycleStatus' => 'SUBMITTED',
                ];

                $this->saveCandidate($request, $candidateData, $id, $creating);
                $this->createApprovalRequest($request, 'candidates', $id);
            }
        });

        app(CandidateInstitutionReconciliationService::class)->syncInstitutionCounts();
        app(BusinessDataPresenter::class)->forgetAll();

        $totalProcessed = $createdCount + $updatedCount;
        $message = match (true) {
            $createdCount > 0 && $updatedCount > 0 => "{$createdCount} data calon PMI baru berhasil ditambahkan dan {$updatedCount} data berhasil diperbarui.",
            $createdCount > 0 => "{$createdCount} data calon PMI baru berhasil ditambahkan dan disimpan.",
            $updatedCount > 0 => "{$updatedCount} data calon PMI berhasil diperbarui.",
            default => "{$totalProcessed} data calon PMI berhasil diproses.",
        };

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'importedCount' => $totalProcessed,
                'createdCount' => $createdCount,
                'updatedCount' => $updatedCount,
                'message' => $message,
            ]);
        }

        return back()->with('success', $message);
    }

    public function update(Request $request, string $type, string $id): RedirectResponse|JsonResponse
    {
        $this->authorizeWrite($request, $type, 'update');
        $table = self::ENTITY_TABLES[$type];
        $existing = DB::table($table)->where('id', $id)->first();
        abort_unless($existing && ! ($type === 'candidates' && $existing->deleted_at), 404);
        $this->assertRecordScope($request, $type, $existing);
        $data = $this->validateData($request, $type, $id);

        DB::transaction(function () use ($request, $type, $data, $id): void {
            match ($type) {
                'candidates' => $this->saveCandidate($request, $data, $id, false),
                'programs' => $this->saveProgram($request, $data, $id, false),
                'providers' => $this->saveProvider($request, $data, $id, false),
                'demands' => $this->saveDemand($request, $data, $id, false),
            };
            $this->createApprovalRequest($request, $type, $id);
        });
        app(BusinessDataPresenter::class)->forgetAll();

        if ($request->wantsJson() || ($request->ajax() && ! $request->header('X-Inertia'))) {
            return response()->json([
                'success' => true,
                'id' => $id,
                'message' => 'Perubahan berhasil disimpan.',
            ]);
        }

        return back()->with('success', 'Perubahan berhasil disimpan.');
    }

    public function updateProgramSchedule(Request $request, string $id): RedirectResponse
    {
        $role = $request->user()->roles()->value('name');
        abort_if(in_array($role, ['institution_admin', 'vokasi', 'lembaga_vokasi', 'training_operator'], true), 403, 'Lembaga vokasi tidak memiliki hak akses untuk mengubah jadwal tanggal pelaksanaan.');
        $this->authorizeWrite($request, 'programs', 'update');
        $existing = DB::table('training_programs')->where('id', $id)->first();
        if (! $existing && str_starts_with($id, 'BP2MI-PROG-') && class_exists(\Database\Seeders\ProgramPlacementTargetSeeder::class)) {
            (new \Database\Seeders\ProgramPlacementTargetSeeder)->run();
            $existing = DB::table('training_programs')->where('id', $id)->first();
        }
        abort_unless($existing, 404);
        $this->assertRecordScope($request, 'programs', $existing);

        $validated = $request->validate([
            'scheduleStart' => ['required', 'date'],
            'scheduleEnd' => ['required', 'date', 'after_or_equal:scheduleStart'],
            'durationJP' => ['nullable', 'integer', 'min:0', 'max:100000'],
        ], [
            'scheduleStart.required' => 'Tanggal mulai pelatihan wajib diisi.',
            'scheduleStart.date' => 'Format tanggal mulai pelatihan tidak valid.',
            'scheduleEnd.required' => 'Tanggal selesai pelatihan wajib diisi.',
            'scheduleEnd.date' => 'Format tanggal selesai pelatihan tidak valid.',
            'scheduleEnd.after_or_equal' => 'Tanggal selesai pelatihan tidak boleh lebih awal dari tanggal mulai.',
        ]);

        DB::transaction(function () use ($request, $id, $existing, $validated): void {
            $totalJp = isset($validated['durationJP']) ? (int) $validated['durationJP'] : (int) ($existing->total_jp ?? 0);

            DB::table('training_programs')->where('id', $id)->update([
                'start_date' => $validated['scheduleStart'],
                'end_date' => $validated['scheduleEnd'],
                'total_jp' => $totalJp,
                'updated_at' => now(),
            ]);

            if ($existing->institution_id && ($totalJp > 0 || ! empty($validated['scheduleStart'])) && Schema::hasColumn('training_classes', 'program_id')) {
                $existingClass = DB::table('training_classes')->where('program_id', $id)->first();
                if ($existingClass) {
                    DB::table('training_classes')->where('id', $existingClass->id)->update([
                        'updated_at' => now(),
                    ]);
                } else {
                    $classId = 'CLS-'.strtoupper(substr(md5((string) $id), 0, 8));
                    DB::table('training_classes')->updateOrInsert(
                        ['id' => $classId],
                        [
                            'program_id' => $id,
                            'institution_id' => $existing->institution_id,
                            'class_name' => $existing->name.' - Batch I',
                            'capacity' => max(20, (int) ($existing->quota ?: 25)),
                            'enrolled_count' => (int) ($existing->enrolled_count ?? 0),
                            'status' => 'Berjalan',
                            'updated_at' => now(),
                            'created_at' => now(),
                        ]
                    );
                }
            }

            $oldRange = ($existing->start_date ?: '-').' s/d '.($existing->end_date ?: '-');
            $newRange = $validated['scheduleStart'].' s/d '.$validated['scheduleEnd'];
            $this->writeAudit(
                $request,
                'programs',
                $id,
                'UPDATE_DATA',
                "Pengaturan jadwal pelaksanaan program pelatihan ({$newRange}).",
                'Jadwal Pelaksanaan',
                $oldRange,
                $newRange,
            );
        });

        app(BusinessDataPresenter::class)->forgetAll();

        return back()->with('success', 'Jadwal tanggal program pelatihan berhasil disimpan.');
    }

    public function updateSectorSchedule(Request $request): RedirectResponse
    {
        $role = $request->user()->roles()->value('name');
        abort_if(in_array($role, ['institution_admin', 'vokasi', 'lembaga_vokasi', 'training_operator'], true), 403, 'Lembaga vokasi tidak memiliki hak akses untuk mengubah jadwal tanggal pelaksanaan.');
        $this->authorizeWrite($request, 'programs', 'update');

        $validated = $request->validate([
            'sectorName' => ['required', 'string', 'max:150'],
            'scheduleStart' => ['required', 'date'],
            'scheduleEnd' => ['required', 'date', 'after_or_equal:scheduleStart'],
        ], [
            'sectorName.required' => 'Nama sektor pelatihan wajib diisi.',
            'scheduleStart.required' => 'Tanggal mulai pelatihan wajib diisi.',
            'scheduleStart.date' => 'Format tanggal mulai pelatihan tidak valid.',
            'scheduleEnd.required' => 'Tanggal selesai pelatihan wajib diisi.',
            'scheduleEnd.date' => 'Format tanggal selesai pelatihan tidak valid.',
            'scheduleEnd.after_or_equal' => 'Tanggal selesai pelatihan tidak boleh lebih awal dari tanggal mulai.',
        ]);

        $sectorName = trim($validated['sectorName']);

        DB::transaction(function () use ($request, $sectorName, $validated): void {
            $affectedCount = DB::table('training_programs')
                ->where(function ($q) use ($sectorName) {
                    $q->where('sector_label', $sectorName)
                        ->orWhere('name', 'like', "%{$sectorName}%");
                    $sectorId = DB::table('sectors')->where('name', $sectorName)->value('id');
                    if ($sectorId) {
                        $q->orWhere('sector_id', $sectorId);
                    }
                })
                ->update([
                    'start_date' => $validated['scheduleStart'],
                    'end_date' => $validated['scheduleEnd'],
                    'updated_at' => now(),
                ]);

            $newRange = $validated['scheduleStart'].' s/d '.$validated['scheduleEnd'];
            $this->writeAudit(
                $request,
                'programs',
                'SECTOR-'.strtoupper(substr(md5($sectorName), 0, 8)),
                'UPDATE_DATA',
                "Pengaturan jadwal pelaksanaan sektor {$sectorName} ({$affectedCount} program diselaraskan ke {$newRange}).",
                'Jadwal Pelaksanaan Sektor',
                '-',
                $newRange,
            );
        });

        app(BusinessDataPresenter::class)->forgetAll();

        return back()->with('success', "Jadwal tanggal pelaksanaan untuk sektor {$sectorName} berhasil disimpan.");
    }

    public function destroy(Request $request, string $type, string $id): RedirectResponse|JsonResponse
    {
        $this->authorizeWrite($request, $type, 'delete');
        $table = self::ENTITY_TABLES[$type];
        $record = DB::table($table)->where('id', $id)->first();
        abort_unless($record && ! ($type === 'candidates' && $record->deleted_at), 404);
        $this->assertRecordScope($request, $type, $record);
        $reason = $request->input('reason') ?: ($request->validate(['reason' => ['nullable', 'string', 'max:1000']])['reason'] ?? 'Data diarsipkan atau dinonaktifkan.');

        DB::transaction(function () use ($request, $type, $id, $reason): void {
            $now = now();
            match ($type) {
                'candidates' => DB::table('job_seekers')->where('id', $id)->update([
                    'deleted_at' => $now,
                    'updated_at' => $now,
                ]),
                'programs' => DB::table('training_programs')->where('id', $id)->update([
                    'status' => 'Nonaktif',
                    'updated_at' => $now,
                ]),
                'providers' => DB::table('institutions')->where('id', $id)->update([
                    'status' => 'Nonaktif',
                    'updated_at' => $now,
                ]),
                'demands' => DB::table('job_demands')->where('id', $id)->update([
                    'verification_status' => 'Draft',
                    'updated_at' => $now,
                ]),
            };

            $this->writeAudit($request, $type, $id, 'HAPUS_DATA', $reason);
        });

        if ($type === 'candidates' && $record) {
            $recon = app(CandidateInstitutionReconciliationService::class);
            if (! empty($record->institution_id)) {
                $recon->syncInstitutionCountForId((string) $record->institution_id);
            }
            if (! empty($record->institution_name)) {
                $instIds = DB::table('institutions')
                    ->where('name', $record->institution_name)
                    ->orWhereRaw('LOWER(name) = ?', [mb_strtolower($record->institution_name)])
                    ->pluck('id');
                foreach ($instIds as $instId) {
                    $recon->syncInstitutionCountForId((string) $instId);
                }
            }
        }

        app(BusinessDataPresenter::class)->forgetAll();

        if ($request->wantsJson() || ($request->ajax() && ! $request->header('X-Inertia'))) {
            return response()->json([
                'success' => true,
                'message' => 'Data berhasil dinonaktifkan.',
            ]);
        }

        return back()->with('success', 'Data berhasil dinonaktifkan.');
    }

    public function batchDestroy(Request $request, string $type): JsonResponse
    {
        $this->authorizeWrite($request, $type, 'delete');
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'string'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $table = self::ENTITY_TABLES[$type];
        $records = DB::table($table)
            ->whereIn('id', $validated['ids'])
            ->when($type === 'candidates', fn ($q) => $q->whereNull('deleted_at'))
            ->get();

        if ($records->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada data valid yang ditemukan untuk dihapus.',
            ], 404);
        }

        foreach ($records as $record) {
            $this->assertRecordScope($request, $type, $record);
        }

        $reason = $validated['reason'] ?: 'Penghapusan data masal melalui antarmuka pengguna.';
        $validIds = $records->pluck('id')->map(fn ($id) => (string) $id)->all();

        DB::transaction(function () use ($request, $type, $validIds, $reason): void {
            $now = now();
            match ($type) {
                'candidates' => DB::table('job_seekers')->whereIn('id', $validIds)->update([
                    'deleted_at' => $now,
                    'updated_at' => $now,
                ]),
                'programs' => DB::table('training_programs')->whereIn('id', $validIds)->update([
                    'status' => 'Nonaktif',
                    'updated_at' => $now,
                ]),
                'providers' => DB::table('institutions')->whereIn('id', $validIds)->update([
                    'status' => 'Nonaktif',
                    'updated_at' => $now,
                ]),
                'demands' => DB::table('job_demands')->whereIn('id', $validIds)->update([
                    'verification_status' => 'Draft',
                    'updated_at' => $now,
                ]),
            };

            foreach ($validIds as $id) {
                $this->writeAudit($request, $type, $id, 'HAPUS_DATA', $reason);
            }
        });

        if ($type === 'candidates') {
            $recon = app(CandidateInstitutionReconciliationService::class);
            $instIds = $records->pluck('institution_id')->filter()->unique();
            foreach ($instIds as $instId) {
                $recon->syncInstitutionCountForId((string) $instId);
            }

            $instNames = $records->pluck('institution_name')->filter()->unique();
            foreach ($instNames as $name) {
                $matchedIds = DB::table('institutions')
                    ->where('name', $name)
                    ->orWhereRaw('LOWER(name) = ?', [mb_strtolower($name)])
                    ->pluck('id');
                foreach ($matchedIds as $instId) {
                    $recon->syncInstitutionCountForId((string) $instId);
                }
            }
        }

        app(BusinessDataPresenter::class)->forgetAll();

        return response()->json([
            'success' => true,
            'count' => count($validIds),
            'message' => count($validIds) . ' data ' . ($type === 'candidates' ? 'calon PMI' : 'data') . ' berhasil dinonaktifkan.',
        ]);
    }

    public function providers(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = $user->roles()->value('name');

        abort_unless(in_array($role, ['super_admin', 'superadmin', 'task_force', 'taskforce', 'directorate_admin', 'direktorat', 'institution_admin', 'verifier', 'vokasi', 'lembaga_vokasi', 'training_operator'], true), 403);

        $page = max(1, (int) $request->query('page', 1));
        $perPage = min(24, max(12, (int) $request->query('per_page', 12)));
        $offset = ($page - 1) * $perPage;

        $search = trim((string) $request->query('search', ''));
        $type = trim((string) $request->query('type', 'ALL'));
        $province = trim((string) $request->query('province', 'ALL'));
        $sector = trim((string) $request->query('sector', 'ALL'));
        $status = trim((string) $request->query('status', 'ALL'));
        $evokasi = trim((string) $request->query('evokasi', 'ALL'));
        $inaproc = trim((string) $request->query('inaproc', 'ALL'));

        $baseQuery = DB::table('institutions')
            ->leftJoin('provinces', 'provinces.id', '=', 'institutions.province_id')
            ->leftJoin('districts', 'districts.id', '=', 'institutions.district_id')
            ->where('institutions.status', 'Aktif')
            ->when(app(Bp3miScope::class)->hasActiveAreaFilter($user), fn ($q) => app(Bp3miScope::class)->applyToInstitutions($q, $user))
            ->when(in_array($role, ['institution_admin', 'training_operator', 'vokasi', 'lembaga_vokasi'], true) || $user->scope_level === 'lembaga', function ($q) use ($user) {
                $scope = app(BusinessDataPresenter::class)->resolveInstitutionScope($user);
                $q->where(function ($qq) use ($scope, $user) {
                    $hasCond = false;
                    if (! empty($scope['ids'])) {
                        $qq->whereIn('institutions.id', $scope['ids']);
                        $hasCond = true;
                    }
                    if (! empty($scope['patterns'])) {
                        foreach ($scope['patterns'] as $pat) {
                            $clean = trim((string) $pat);
                            if ($clean !== '') {
                                if ($hasCond) {
                                    $qq->orWhere('institutions.name', $clean);
                                } else {
                                    $qq->where('institutions.name', $clean);
                                    $hasCond = true;
                                }
                            }
                        }
                    }
                    if (! $hasCond) {
                        $qq->where('institutions.id', $user->institution_id ?? '');
                    }
                });
            });

        $filtered = (clone $baseQuery)
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('institutions.name', 'like', "%{$search}%")
                        ->orWhere('provinces.name', 'like', "%{$search}%")
                        ->orWhere('districts.name', 'like', "%{$search}%")
                        ->orWhere('institutions.npsn_or_vin', 'like', "%{$search}%");
                });
            })
            ->when($province !== 'ALL', fn ($q) => $q->where('provinces.name', 'like', "%{$province}%"))
            ->when($status !== 'ALL', fn ($q) => $q->where('institutions.ownership_type', $status))
            ->when($evokasi !== 'ALL', fn ($q) => $q->where('institutions.evokasi_status', $evokasi))
            ->when($inaproc === 'filled', function ($q) {
                $q->whereNotNull('institutions.procurement_catalog_url')
                    ->where('institutions.procurement_catalog_url', '!=', '');
            })
            ->when($inaproc === 'empty', function ($q) {
                $q->where(function ($qq) {
                    $qq->whereNull('institutions.procurement_catalog_url')
                        ->orWhere('institutions.procurement_catalog_url', '=', '');
                });
            })
            ->when($type !== 'ALL', function ($q) use ($type) {
                $lower = strtolower($type);
                if ($lower === 'politeknik') {
                    $q->where('institutions.institution_type', 'Perguruan Tinggi / Politeknik');

                    return;
                }
                if ($lower === 'balai' || $lower === 'blkln') {
                    $q->where('institutions.institution_type', 'BLK');

                    return;
                }
                $q->whereRaw('LOWER(institutions.institution_type) = ?', [$lower]);
            })
            ->when($sector !== 'ALL', function ($q) use ($sector) {
                $q->where(function ($qq) use ($sector) {
                    $qq->where('institutions.supported_sectors', 'like', "%{$sector}%")
                        ->orWhere('institutions.external_metadata', 'like', "%{$sector}%");
                });
            });

        $total = (clone $filtered)->count();

        $rows = $filtered
            ->orderBy('institutions.name')
            ->offset($offset)
            ->limit($perPage)
            ->get([
                'institutions.id',
                'institutions.name',
                'institutions.institution_type',
                'institutions.province_id',
                'institutions.district_id',
                'institutions.accreditation',
                'institutions.procurement_method',
                'institutions.procurement_catalog_url',
                'institutions.mou_drive_url',
                'institutions.evokasi_status',
                'institutions.verification_status',
                'institutions.instructor_count',
                'institutions.class_count',
                'institutions.ready_participant_count',
                'institutions.workshop_capacity',
                'institutions.readiness_score',
                'institutions.supported_sectors',
                'institutions.ownership_type',
                'institutions.address',
                'institutions.email',
                'institutions.phone',
                'institutions.head_name',
                'institutions.external_id',
                'institutions.external_source',
                'institutions.external_metadata',
                'provinces.name as province_name',
                'districts.name as district_name',
            ]);

        $ids = $rows->pluck('id')->filter()->values()->all();

        $facilitiesByInst = $ids === []
            ? collect()
            : DB::table('institution_facilities')
                ->whereIn('institution_id', $ids)
                ->orderBy('facility_name')
                ->get(['institution_id', 'facility_name'])
                ->groupBy('institution_id')
                ->map(fn ($g) => $g->pluck('facility_name')->values()->all());

        $candidateCountsByInst = $ids === []
            ? collect()
            : DB::table('job_seekers')
                ->whereNull('deleted_at')
                ->whereIn('institution_id', $ids)
                ->select(
                    'institution_id',
                    DB::raw('count(*) as total_students'),
                    DB::raw("sum(case when readiness_status = 'Ready for Placement' then 1 else 0 end) as ready_students")
                )
                ->groupBy('institution_id')
                ->get()
                ->keyBy('institution_id');

        $items = $rows->map(function (object $row) use ($facilitiesByInst, $candidateCountsByInst): array {
            $metadata = json_decode($row->external_metadata ?? '[]', true);
            if (! is_array($metadata)) {
                $metadata = [];
            }

            $offerings = is_array($metadata['programs'] ?? null)
                ? collect($metadata['programs'])
                    ->filter(fn ($o) => is_array($o) && isset($o['sector'], $o['occupation']))
                    ->values()
                    ->all()
                : [];

            $supported = json_decode($row->supported_sectors ?? '[]', true);
            if (! is_array($supported)) {
                $supported = [];
            }

            return [
                'id' => $row->id,
                'name' => $row->name,
                'providerType' => $row->institution_type,
                'provinsi' => $row->province_name ?? 'Belum diketahui',
                'kabupatenKota' => $row->district_name ?? 'Belum diketahui',
                'evokasiVerificationStatus' => $row->evokasi_status,
                'verificationStatus' => $row->verification_status,
                'accreditation' => $row->accreditation,
                'procurementMethod' => $row->procurement_method,
                'procurementCatalogUrl' => $row->procurement_catalog_url ?? ($metadata['procurementCatalogUrl'] ?? null),
                'procurementCatalogUrls' => self::parseCatalogUrls($row->procurement_catalog_url ?? ($metadata['procurementCatalogUrls'] ?? $metadata['procurementCatalogUrl'] ?? null)),
                'mouDriveUrl' => $row->mou_drive_url ?? ($metadata['mouDriveUrl'] ?? null),
                'capacityPerBatch' => $row->workshop_capacity === null ? null : (int) $row->workshop_capacity,
                'classCount' => $row->class_count === null ? null : (int) $row->class_count,
                'readyParticipantCount' => $candidateCountsByInst->has($row->id)
                    ? (int) $candidateCountsByInst->get($row->id)->ready_students
                    : ($row->ready_participant_count === null ? null : (int) $row->ready_participant_count),
                'certifiedInstructorsCount' => $row->instructor_count === null ? null : (int) $row->instructor_count,
                'facilities' => $facilitiesByInst->get($row->id, []),
                'supportedSectors' => $supported,
                'supportedCountries' => is_array($metadata['supportedCountries'] ?? null)
                    ? $metadata['supportedCountries']
                    : [],
                'operationalReadinessScore' => $row->readiness_score === null ? null : (int) $row->readiness_score,
                'address' => $row->address,
                'email' => $row->email,
                'phone' => $row->phone,
                'leaderName' => $row->head_name,
                'institutionStatus' => $row->ownership_type ?: ($metadata['sourceStatus'] ?? 'Swasta'),
                'slug' => $row->external_id,
                'logo' => $metadata['logo'] ?? null,
                'website' => $metadata['website'] ?? null,
                'leaderPosition' => $metadata['leaderPosition'] ?? null,
                'institutionForm' => $metadata['institutionForm'] ?? $metadata['institutionCategory'] ?? null,
                'sectorals' => is_array($metadata['sectorals'] ?? null) ? $metadata['sectorals'] : [],
                'programs' => is_array($metadata['programs'] ?? null) ? $metadata['programs'] : [],
                'offerings' => $offerings,
                'source' => $row->external_source === 'kp2mi' ? 'kp2mi-api' : 'local',
            ];
        })->all();

        return response()->json([
            'data' => $items,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => (int) ceil($total / $perPage),
            ],
        ]);
    }

    public function candidates(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = $user->roles()->value('name');

        abort_unless(in_array($role, ['task_force', 'province_admin', 'district_admin', 'institution_admin', 'verifier', 'vokasi', 'lembaga_vokasi', 'training_operator'], true), 403);

        $page = max(1, (int) $request->query('page', 1));
        $perPage = min(100, max(25, (int) $request->query('per_page', 50)));
        $offset = ($page - 1) * $perPage;

        $baseQuery = DB::table('job_seekers')
            ->whereNull('deleted_at')
            ->leftJoin('provinces', 'provinces.id', '=', 'job_seekers.province_id')
            ->when(app(Bp3miScope::class)->hasActiveAreaFilter($user), fn ($query) => app(Bp3miScope::class)->applyToJobSeekers($query, $user))
            ->when($role === 'province_admin', fn ($query) => $query->where('job_seekers.province_id', $user->province_id))
            ->when(in_array($role, ['institution_admin', 'training_operator', 'vokasi', 'lembaga_vokasi'], true) || $user->scope_level === 'lembaga', function ($query) use ($user) {
                $scope = app(BusinessDataPresenter::class)->resolveInstitutionScope($user);
                $query->where(function ($q) use ($scope, $user) {
                    $hasCondition = false;
                    if (! empty($scope['ids'])) {
                        $q->whereIn('job_seekers.institution_id', $scope['ids']);
                        $hasCondition = true;
                    }
                    if (! empty($scope['patterns'])) {
                        foreach ($scope['patterns'] as $pattern) {
                            $clean = trim((string) $pattern);
                            if ($clean !== '') {
                                if ($hasCondition) {
                                    $q->orWhere('job_seekers.institution_name', $clean);
                                    if (mb_strlen($clean) >= 4) {
                                        $q->orWhere('job_seekers.institution_name', 'LIKE', "%{$clean}%");
                                    }
                                } else {
                                    $q->where(function ($sub) use ($clean) {
                                        $sub->where('job_seekers.institution_name', $clean);
                                        if (mb_strlen($clean) >= 4) {
                                            $sub->orWhere('job_seekers.institution_name', 'LIKE', "%{$clean}%");
                                        }
                                    });
                                    $hasCondition = true;
                                }
                            }
                        }
                    }
                    if (! empty($user->id)) {
                        $q->orWhere('job_seekers.created_by', (string) $user->id)
                            ->orWhere('job_seekers.created_by', (string) $user->name)
                            ->orWhere('job_seekers.created_by', (string) $user->username);
                        if (! empty($user->email)) {
                            $q->orWhere('job_seekers.created_by', (string) $user->email);
                        }
                        $hasCondition = true;
                    }
                    $orgCandidate = trim((string) ($user->organization ?: $user->scope_name));
                    if (! empty($orgCandidate)) {
                        $q->orWhere('job_seekers.institution_name', $orgCandidate);
                        if (mb_strlen($orgCandidate) >= 4) {
                            $q->orWhere('job_seekers.institution_name', 'LIKE', "%{$orgCandidate}%");
                        }
                        $core = trim(preg_replace('/^(lpks|lpk|lkp|pk|blk|blkln|blkk|smkn|smk\s+negeri|smk|stikes|poltek|politeknik|universitas|sekolah\s+tinggi|institut)\.?\s+/i', '', $orgCandidate));
                        if (mb_strlen($core) >= 4) {
                            $q->orWhere('job_seekers.institution_name', 'LIKE', "%{$core}%");
                        }
                        $q->orWhere('job_seekers.created_by', $orgCandidate)
                            ->orWhere('job_seekers.created_by', 'LIKE', "%{$orgCandidate}%");
                        $hasCondition = true;
                    }
                    if (! empty($scope['institution']?->name)) {
                        $cleanInst = trim($scope['institution']->name);
                        $q->orWhere('job_seekers.created_by', $cleanInst)
                            ->orWhere('job_seekers.created_by', 'LIKE', "%{$cleanInst}%")
                            ->orWhere('job_seekers.institution_name', $cleanInst)
                            ->orWhere('job_seekers.institution_name', 'LIKE', "%{$cleanInst}%");
                        $hasCondition = true;
                    }
                    if (! $hasCondition) {
                        $q->where('job_seekers.institution_id', $user->institution_id ?? '');
                    }
                });
            });

        $total = (clone $baseQuery)->count();

        $rows = $baseQuery
            ->leftJoin('districts', 'districts.id', '=', 'job_seekers.district_id')
            ->orderByDesc(DB::raw("COALESCE(job_seekers.updated_at, job_seekers.created_at)"))
            ->offset($offset)
            ->limit($perPage)
            ->get([
                'job_seekers.id',
                'job_seekers.nik',
                'job_seekers.full_name',
                'job_seekers.gender',
                'provinces.name as province_name',
                'districts.name as district_name',
                'job_seekers.education_level',
                'job_seekers.institution_name',
                'job_seekers.source_type',
                'job_seekers.major',
                'job_seekers.readiness_status',
                'job_seekers.verification_status',
                'job_seekers.lifecycle_status',
                'job_seekers.preferred_countries',
                'job_seekers.preferred_job_roles',
                'job_seekers.work_experiences',
                'job_seekers.certifications',
                'job_seekers.preferred_sectors',
            ]);

        $ids = $rows->pluck('id')->filter()->values()->all();

        $skillsBySeeker = $ids === []
            ? collect()
            : DB::table('job_seeker_skills')
                ->whereIn('job_seeker_id', $ids)
                ->orderBy('skill_name')
                ->get(['job_seeker_id', 'skill_name'])
                ->groupBy('job_seeker_id')
                ->map(fn ($group) => $group->pluck('skill_name')->values()->all());

        $languagesBySeeker = $ids === []
            ? collect()
            : DB::table('job_seeker_languages')
                ->whereIn('job_seeker_id', $ids)
                ->get(['job_seeker_id', 'language', 'level'])
                ->groupBy('job_seeker_id')
                ->map(fn ($group) => $group->map(fn ($language) => [
                    'language' => $language->language,
                    'level' => $language->level,
                ])->values()->all());

        $items = $rows->map(function (object $row) use ($skillsBySeeker, $languagesBySeeker): array {
            $presenter = app(BusinessDataPresenter::class);
            $decodeArray = \Closure::bind(function ($value) {
                if (! $value) {
                    return [];
                }
                $decoded = json_decode($value, true);

                return is_array($decoded) ? $decoded : [];
            }, null, BusinessDataPresenter::class);

            return [
                'id' => $row->id,
                'nik' => $row->nik ? substr($row->nik, 0, 4).'••••••••'.substr($row->nik, -4) : '••••••••••••••••',
                'fullName' => $row->full_name,
                'gender' => $row->gender,
                'provinsi' => $row->province_name,
                'kabupatenKota' => $row->district_name,
                'educationLevel' => $row->education_level,
                'institutionName' => $row->institution_name,
                'sourceType' => match ($row->source_type) {
                    'SMK', 'BLK', 'LPK', 'Lembaga Vokasi', 'lembaga_vokasi', 'vokasi' => 'Lembaga Vokasi',
                    'Mandiri' => 'SMK / Pendidikan Vokasi',
                    'Gardata', 'SIPPMI', 'sippmi' => 'Gardata / SIPPMI',
                    default => 'Disnaker Pemda',
                },
                'major' => $row->major,
                'skills' => $skillsBySeeker->get($row->id, []),
                'languageProficiency' => $languagesBySeeker->get($row->id, []),
                'preferredCountry' => $decodeArray($row->preferred_countries),
                'preferredJobRole' => $decodeArray($row->preferred_job_roles),
                'workExperiences' => $decodeArray($row->work_experiences),
                'certifications' => $decodeArray($row->certifications),
                'preferredSectors' => $decodeArray($row->preferred_sectors),
                'readinessStatus' => $row->readiness_status,
                'verificationStatus' => $row->verification_status,
                'lifecycleStatus' => $row->lifecycle_status,
            ];
        })->all();

        return response()->json([
            'data' => $items,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => (int) ceil($total / $perPage),
            ],
        ]);
    }

    private function generateUniqueSyntheticNik(string $prefix = '3300', array &$usedNiks = []): string
    {
        $cleanPrefix = preg_replace('/\D/', '', $prefix) ?: '3300';
        $prefix4 = substr(str_pad($cleanPrefix, 4, '0'), 0, 4);

        do {
            $random = str_pad((string) random_int(0, 999999999999), 12, '0', STR_PAD_LEFT);
            $candidateNik = substr($prefix4 . $random, 0, 16);
        } while (in_array($candidateNik, $usedNiks, true) || DB::table('job_seekers')->where('nik', $candidateNik)->exists());

        $usedNiks[] = $candidateNik;

        return $candidateNik;
    }

    private function validateData(Request $request, string $type, ?string $id = null): array
    {
        abort_unless(isset(self::ENTITY_TABLES[$type]), 404);
        if ($type === 'candidates') {
            $user = $request->user();
            $nikInput = (string) $request->input('nik', '');
            if ($id && (preg_match('/[•*]/u', $nikInput) || strlen(preg_replace('/\D/', '', $nikInput)) !== 16)) {
                $existingNik = DB::table('job_seekers')->where('id', $id)->value('nik');
                if (! $existingNik && $request->filled('fullName')) {
                    $existingNik = DB::table('job_seekers')->where('full_name', $request->input('fullName'))->value('nik');
                }
                if ($existingNik) {
                    $request->merge(['nik' => $existingNik]);
                }
            }
            if (strlen(preg_replace('/\D/', '', (string) $request->input('nik'))) !== 16) {
                $cleanNik = $this->generateUniqueSyntheticNik('3372');
                $request->merge(['nik' => $cleanNik]);
            }

            // Normalise gender
            $genderRaw = mb_strtoupper(trim((string) $request->input('gender', 'L')));
            $gender = (str_starts_with($genderRaw, 'P') || str_contains($genderRaw, 'PEREMPUAN')) ? 'P' : 'L';
            $request->merge(['gender' => $gender]);

            // Normalise educationLevel
            $eduRaw = mb_strtoupper(trim((string) $request->input('educationLevel', 'SMK')));
            $educationLevel = match (true) {
                str_contains($eduRaw, 'D3') || str_contains($eduRaw, 'DIPLOMA') || str_contains($eduRaw, 'D2') => 'D3',
                str_contains($eduRaw, 'S1') || str_contains($eduRaw, 'SARJANA') || str_contains($eduRaw, 'D4') => 'S1',
                str_contains($eduRaw, 'SMK') || str_contains($eduRaw, 'SMA') || str_contains($eduRaw, 'SLTA') => 'SMK',
                default => 'Lainnya',
            };
            $request->merge(['educationLevel' => $educationLevel]);

            // Normalise readinessStatus
            $readyRaw = mb_strtolower(trim((string) $request->input('readinessStatus', 'Ready for Placement')));
            $readinessStatus = match (true) {
                str_contains($readyRaw, 'reskilling') => 'Needs Reskilling',
                str_contains($readyRaw, 'upskilling') || str_contains($readyRaw, 'training') => 'Needs Upskilling',
                default => 'Ready for Placement',
            };
            $request->merge(['readinessStatus' => $readinessStatus]);

            // Normalise verificationStatus
            $verRaw = trim((string) $request->input('verificationStatus', 'Pending Verification'));
            $verificationStatus = match (true) {
                stripos($verRaw, 'verified') !== false && stripos($verRaw, 'un') === false && stripos($verRaw, 'pending') === false => 'Verified',
                stripos($verRaw, 'unverified') !== false => 'Unverified',
                default => 'Pending Verification',
            };
            $request->merge(['verificationStatus' => $verificationStatus]);

            // Normalise institutionName
            if (! $request->filled('institutionName')) {
                $inst = $this->resolveUserInstitution($user);
                $request->merge(['institutionName' => $inst?->name ?? $user->organization ?? 'Politeknik Indonusa Surakarta']);
            }

            // Normalise major
            if (! $request->filled('major')) {
                $request->merge(['major' => 'Umum']);
            }

            // Normalise workExperiences
            $rawWork = $request->input('workExperiences');
            if (! is_array($rawWork)) {
                $rawWork = [];
            }
            $cleanWork = [];
            foreach ($rawWork as $w) {
                if (is_array($w)) {
                    $cleanWork[] = [
                        'sector' => mb_substr((string) ($w['sector'] ?? 'Hospitality & Pariwisata'), 0, 1000),
                        'role' => mb_substr((string) ($w['role'] ?? 'Staf Pelaksana'), 0, 1000),
                        'durationYears' => (float) ($w['durationYears'] ?? 1.0),
                        'companyName' => isset($w['companyName']) ? mb_substr((string) $w['companyName'], 0, 1000) : null,
                        'description' => isset($w['description']) ? mb_substr((string) $w['description'], 0, 5000) : null,
                    ];
                }
            }
            $request->merge(['workExperiences' => $cleanWork]);

            // Normalise certifications
            $rawCerts = $request->input('certifications');
            if (! is_array($rawCerts)) {
                $rawCerts = [];
            }
            $cleanCerts = [];
            foreach ($rawCerts as $c) {
                if (is_array($c)) {
                    $cleanCerts[] = [
                        'name' => mb_substr((string) ($c['name'] ?? 'Sertifikasi Keahlian'), 0, 1000),
                        'issuer' => mb_substr((string) ($c['issuer'] ?? 'Badan Sertifikasi Standar Kompetensi'), 0, 1000),
                        'issueYear' => isset($c['issueYear']) && is_numeric($c['issueYear']) ? (int) $c['issueYear'] : (int) date('Y'),
                        'validUntil' => isset($c['validUntil']) && is_string($c['validUntil']) && strtotime($c['validUntil']) ? date('Y-m-d', strtotime($c['validUntil'])) : null,
                    ];
                } elseif (is_string($c) && trim($c) !== '') {
                    $cleanCerts[] = [
                        'name' => mb_substr(trim($c), 0, 1000),
                        'issuer' => 'Badan Sertifikasi Standar Kompetensi',
                        'issueYear' => (int) date('Y'),
                        'validUntil' => null,
                    ];
                }
            }
            $request->merge(['certifications' => $cleanCerts]);

            // Normalise languageProficiency
            $rawLangs = $request->input('languageProficiency');
            if (! is_array($rawLangs)) {
                $rawLangs = [];
            }
            $cleanLangs = [];
            foreach ($rawLangs as $l) {
                if (is_array($l)) {
                    $cleanLangs[] = [
                        'language' => (string) ($l['language'] ?? 'Inggris'),
                        'level' => (string) ($l['level'] ?? 'Basic'),
                    ];
                } elseif (is_string($l) && trim($l) !== '') {
                    $cleanLangs[] = [
                        'language' => trim($l),
                        'level' => 'Basic',
                    ];
                }
            }
            if (empty($cleanLangs)) {
                $cleanLangs = [['language' => 'Inggris', 'level' => 'Basic']];
            }
            $request->merge(['languageProficiency' => $cleanLangs]);

            // Arrays
            foreach (['skills', 'preferredSectors', 'preferredCountry', 'preferredJobRole'] as $arrField) {
                $val = $request->input($arrField);
                if (! is_array($val)) {
                    $request->merge([$arrField => is_string($val) && trim($val) !== '' ? [trim($val)] : []]);
                }
            }

            $rawCountries = (array) $request->input('preferredCountry', []);
            $normalizedCountries = [];
            foreach ($rawCountries as $cItem) {
                if (! is_string($cItem) || trim($cItem) === '') {
                    continue;
                }
                $cClean = trim($cItem);
                $cLower = mb_strtolower($cClean);
                $normalized = match ($cLower) {
                    'korea selatan', 'korsel', 'south korea', 'republic of korea' => 'Korea',
                    'turkiye', 'turkey' => 'Turki',
                    'japan' => 'Jepang',
                    'germany' => 'Jerman',
                    default => $cClean,
                };
                $normalizedCountries[] = $normalized;
            }
            if (empty($normalizedCountries) && ! empty($request->input('preferredCountry'))) {
                $normalizedCountries = ['Korea'];
            }
            $request->merge(['preferredCountry' => array_values(array_unique($normalizedCountries))]);
        }
        if ($type === 'providers' && $request->has('supportedCountries') && is_array($request->input('supportedCountries'))) {
            $mappedCountries = array_map(function ($val) {
                return match (mb_strtolower(trim((string) $val))) {
                    'jepang', 'japan', 'jp' => 'JP',
                    'korea', 'korea selatan', 'south korea', 'kr' => 'KR',
                    'malaysia', 'my' => 'MY',
                    'turki', 'turkiye', 'turkey', 'tr' => 'TR',
                    'jerman', 'germany', 'de' => 'DE',
                    'taiwan', 'tw' => 'TW',
                    'arab saudi', 'saudi arabia', 'sa' => 'SA',
                    'uni emirat arab', 'uea', 'uae', 'ae' => 'AE',
                    'singapura', 'singapore', 'sg' => 'SG',
                    'australia', 'au' => 'AU',
                    'belanda', 'netherlands', 'nl' => 'NL',
                    'slovakia', 'slowakia', 'sk' => 'SK',
                    default => (string) $val,
                };
            }, $request->input('supportedCountries'));
            $request->merge(['supportedCountries' => array_values(array_unique($mappedCountries))]);
        }

        $rules = match ($type) {
            'candidates' => [
                'nik' => ['required', 'digits:16', Rule::unique('job_seekers', 'nik')->ignore($id, 'id')],
                'fullName' => ['required', 'string', 'max:150'],
                'gender' => ['required', Rule::in(['L', 'P'])],
                'provinsi' => ['required', 'string', 'max:100'],
                'kabupatenKota' => ['required', 'string', 'max:100'],
                'educationLevel' => ['required', Rule::in(['SMK', 'D3', 'S1', 'Lainnya'])],
                'institutionName' => ['required', 'string', 'max:255'],
                'sourceType' => ['nullable', 'string', 'max:100'],
                'major' => ['required', 'string', 'max:150'],
                'skills' => ['array'],
                'skills.*' => ['string', 'max:255'],
                'workExperiences' => ['array'],
                'workExperiences.*.sector' => ['nullable', 'string', 'max:1000'],
                'workExperiences.*.role' => ['nullable', 'string', 'max:1000'],
                'workExperiences.*.durationYears' => ['nullable', 'numeric', 'min:0', 'max:100'],
                'workExperiences.*.companyName' => ['nullable', 'string', 'max:1000'],
                'workExperiences.*.description' => ['nullable', 'string', 'max:5000'],
                'certifications' => ['array'],
                'certifications.*.name' => ['nullable', 'string', 'max:1000'],
                'certifications.*.issuer' => ['nullable', 'string', 'max:1000'],
                'certifications.*.issueYear' => ['nullable', 'integer', 'min:1900', 'max:'.(now()->year + 10)],
                'certifications.*.validUntil' => ['nullable', 'date'],
                'preferredSectors' => ['array'],
                'preferredSectors.*' => ['string', 'max:255'],
                'languageProficiency' => ['array'],
                'languageProficiency.*.language' => ['nullable', 'string', 'max:100'],
                'languageProficiency.*.level' => ['nullable', 'string', 'max:100'],
                'preferredCountry' => ['array'],
                'preferredCountry.*' => ['string', 'max:100'],
                'preferredJobRole' => ['array'],
                'preferredJobRole.*' => ['string', 'max:255'],
                'readinessStatus' => ['required', Rule::in(['Ready for Placement', 'Needs Upskilling', 'Needs Reskilling'])],
                'verificationStatus' => ['required', Rule::in(['Verified', 'Pending Verification', 'Unverified'])],
                'lifecycleStatus' => ['nullable', 'string', 'max:50'],
            ],
            'programs' => [
                'title' => ['required', 'string', 'max:255'],
                'programType' => ['required', Rule::in(['Upskilling', 'Reskilling', 'Pelatihan Bahasa', 'Teknis Terpadu'])],
                'targetSector' => ['required', 'string', 'max:150'],
                'targetJobRole' => ['required', 'string', 'max:150'],
                'targetCountry' => ['required', 'string', 'max:100'],
                'institutionId' => ['required', 'string', 'exists:institutions,id'],
                'durationJP' => ['required', 'integer', 'min:0', 'max:100000'],
                'certificationTarget' => ['required', 'string', 'max:150'],
                'estimatedCostPerParticipant' => ['required', 'numeric', 'min:0'],
                'quota' => ['required', 'integer', 'min:0', 'max:100000'],
                'scheduleStart' => ['nullable', 'date'],
                'scheduleEnd' => ['nullable', 'date', 'after_or_equal:scheduleStart'],
                'curriculumOutline' => ['array'],
                'curriculumOutline.*' => ['string', 'max:1000'],
            ],
            'providers' => [
                'name' => ['required', 'string', 'max:255'],
                'providerType' => ['required', 'string', 'max:100'],
                'provinsi' => ['required', 'string', 'max:100'],
                'kabupatenKota' => ['required', 'string', 'max:100'],
                'evokasiVerificationStatus' => ['required', Rule::in(['Terverifikasi e-Vokasi', 'Proses Verifikasi', 'Belum Terverifikasi'])],
                'accreditation' => ['required', 'string', 'max:50'],
                'classCount' => ['required', 'numeric', 'min:0', 'max:100000'],
                'readyParticipantCount' => ['required', 'numeric', 'min:0', 'max:100000'],
                'certifiedInstructorsCount' => ['required', 'numeric', 'min:0', 'max:100000'],
                'operationalReadinessScore' => ['required', 'numeric', 'min:0', 'max:100'],
                'facilities' => ['array'],
                'facilities.*' => ['string', 'max:150'],
                'supportedSectors' => ['array'],
                'supportedSectors.*' => ['string', 'max:150'],
                'supportedCountries' => ['sometimes', 'array'],
                'supportedCountries.*' => ['string', 'max:150'],
                'address' => ['nullable', 'string', 'max:2000'],
                'email' => ['nullable', 'email', 'max:100'],
                'phone' => ['nullable', 'string', 'max:50'],
                'leaderName' => ['nullable', 'string', 'max:150'],
                'institutionStatus' => ['nullable', Rule::in(['Negeri', 'Swasta'])],
                'logo' => ['nullable', 'string', 'max:255'],
                'logoUrl' => ['nullable', 'string', 'max:255'],
                'slug' => ['nullable', 'string', 'max:255'],
                'website' => ['nullable', 'string', 'max:255'],
                'institutionForm' => ['nullable', 'string', 'max:150'],
                'procurementMethod' => ['nullable', 'string', 'max:100'],
                'procurementCatalogUrl' => ['nullable'],
                'procurementCatalogUrls' => ['nullable', 'array'],
                'procurementCatalogUrls.*' => ['nullable', 'string', 'max:2000'],
                'mouDriveUrl' => ['nullable', 'string', 'max:2000'],
                'sectorals' => ['array'],
                'programs' => ['array'],
            ],
            'demands' => [
                'jobTitle' => ['required', 'string', 'max:150'],
                'employerName' => ['required', 'string', 'max:255'],
                'country' => ['required', 'string', 'max:100'],
                'sector' => ['required', 'string', 'max:150'],
                'requiredQuota' => ['required', 'integer', 'min:1', 'max:100000'],
                'filledQuota' => ['nullable', 'integer', 'min:0'],
                'minEducation' => ['required', 'string', 'max:50'],
                'requiredSkills' => ['array'],
                'requiredSkills.*' => ['string', 'max:100'],
                'requiredLanguageLevel' => ['required', 'string', 'max:100'],
                'requiredCertifications' => ['array'],
                'requiredCertifications.*' => ['string', 'max:150'],
                'deadlineDate' => ['required', 'date'],
                'workTermMonths' => ['required', 'integer', 'min:0', 'max:1200'],
                'salaryRangeString' => ['required', 'string', 'max:150'],
            ],
        };

        return $request->validate($rules);
    }

    private function resolveProvinceAndDistrict(?string $provinceInput, ?string $districtInput, ?object $user = null, ?object $institution = null): array
    {
        // 1. Ensure districts table has basic seed if empty
        if (DB::table('districts')->where('id', '3372')->doesntExist()) {
            DB::table('districts')->updateOrInsert(
                ['id' => '3372'],
                ['province_id' => '33', 'name' => 'Kota Surakarta', 'type' => 'Kota']
            );
        }

        $provinceInput = trim((string) $provinceInput);
        $districtInput = trim((string) $districtInput);

        // Alias mapping for common informal province names
        $provinceAliases = [
            'jateng' => 'Jawa Tengah',
            'jabar' => 'Jawa Barat',
            'jatim' => 'Jawa Timur',
            'dki' => 'DKI Jakarta',
            'jakarta' => 'DKI Jakarta',
            'diy' => 'Daerah Istimewa Yogyakarta',
            'jogja' => 'Daerah Istimewa Yogyakarta',
            'yogyakarta' => 'Daerah Istimewa Yogyakarta',
            'sumut' => 'Sumatera Utara',
            'sumbar' => 'Sumatera Barat',
            'sumsel' => 'Sumatera Selatan',
            'sulsel' => 'Sulawesi Selatan',
            'sulteng' => 'Sulawesi Tengah',
            'sulut' => 'Sulawesi Utara',
            'kalsel' => 'Kalimantan Selatan',
            'kaltim' => 'Kalimantan Timur',
            'kalbar' => 'Kalimantan Barat',
            'ntb' => 'Nusa Tenggara Barat',
            'ntt' => 'Nusa Tenggara Timur',
        ];

        $cleanProvince = preg_replace('/^provinsi\s+/ui', '', $provinceInput);
        $lowerProv = mb_strtolower($cleanProvince);
        $canonicalProv = $provinceAliases[$lowerProv] ?? $cleanProvince;

        $province = null;
        if ($canonicalProv !== '') {
            $province = DB::table('provinces')
                ->where('name', $canonicalProv)
                ->orWhereRaw('LOWER(name) = ?', [mb_strtolower($canonicalProv)])
                ->orWhereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($canonicalProv).'%'])
                ->first();
        }

        // If districtInput was given, check if it maps directly to a district in database to infer province
        if (! $province && $districtInput !== '') {
            $cleanKab = trim(preg_replace('/^(kabupaten|kab\.?|kota(?:\s+adm\.?|\s+administrasi)?)\s+/ui', '', $districtInput));
            $foundDistrict = DB::table('districts')
                ->where('name', $districtInput)
                ->orWhereRaw('LOWER(name) = ?', [mb_strtolower($districtInput)])
                ->when($cleanKab !== '', fn ($q) => $q->orWhereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($cleanKab).'%']))
                ->first();
            if ($foundDistrict) {
                $province = DB::table('provinces')->where('id', $foundDistrict->province_id)->first();
            }
        }

        // Fallbacks for province
        if (! $province && $institution?->province_id) {
            $province = DB::table('provinces')->where('id', $institution->province_id)->first();
        }
        if (! $province && $user?->province_id) {
            $province = DB::table('provinces')->where('id', $user->province_id)->first();
        }
        if (! $province) {
            $province = DB::table('provinces')->where('name', 'Jawa Tengah')->first()
                ?? DB::table('provinces')->first();
        }

        $provinceId = (string) ($province?->id ?? '33');
        $provinceName = $province?->name ?? 'Jawa Tengah';

        // Now resolve district within province
        $district = null;
        if ($districtInput !== '') {
            $cleanKab = trim(preg_replace('/^(kabupaten|kab\.?|kota(?:\s+adm\.?|\s+administrasi)?)\s+/ui', '', $districtInput));
            $district = DB::table('districts')
                ->where('province_id', $provinceId)
                ->where(function ($q) use ($districtInput, $cleanKab) {
                    $q->where('name', $districtInput)
                        ->orWhereRaw('LOWER(name) = ?', [mb_strtolower($districtInput)]);
                    if ($cleanKab !== '') {
                        $q->orWhereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($cleanKab).'%']);
                    }
                    if (mb_strtolower($districtInput) === 'solo' || mb_strtolower($cleanKab) === 'solo') {
                        $q->orWhere('name', 'LIKE', '%Surakarta%');
                    }
                })
                ->first();

            // If not found in this province and province was NOT explicitly specified, search across all provinces
            if (! $district && ! $province) {
                $districtInAnyProv = DB::table('districts')
                    ->where(function ($q) use ($districtInput, $cleanKab) {
                        $q->where('name', $districtInput)
                            ->orWhereRaw('LOWER(name) = ?', [mb_strtolower($districtInput)]);
                        if ($cleanKab !== '') {
                            $q->orWhereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($cleanKab).'%']);
                        }
                    })
                    ->first();
                if ($districtInAnyProv) {
                    $district = $districtInAnyProv;
                    $provinceId = (string) $district->province_id;
                    $provinceName = DB::table('provinces')->where('id', $provinceId)->value('name') ?? $provinceName;
                }
            }
        }

        // Fallbacks for district strictly within resolved province
        if (! $district) {
            $district = DB::table('districts')->where('province_id', $provinceId)->first();
        }
        if (! $district) {
            if ($institution?->district_id) {
                $instDistrict = DB::table('districts')->where('id', $institution->district_id)->first();
                if ($instDistrict && (string) $instDistrict->province_id === $provinceId) {
                    $district = $instDistrict;
                }
            } elseif ($user?->district_id) {
                $userDistrict = DB::table('districts')->where('id', $user->district_id)->first();
                if ($userDistrict && (string) $userDistrict->province_id === $provinceId) {
                    $district = $userDistrict;
                }
            }
        }
        if (! $district) {
            // As a last-resort guarantee, create a valid district record so foreign key never fails
            $fallbackId = $provinceId.'99';
            $fallbackName = $districtInput !== '' ? $districtInput : 'Wilayah '.$provinceName;
            DB::table('districts')->updateOrInsert(
                ['id' => $fallbackId],
                ['province_id' => $provinceId, 'name' => $fallbackName, 'type' => 'Kota']
            );
            $district = DB::table('districts')->where('id', $fallbackId)->first();
        }

        return [
            'province_id' => $provinceId,
            'province_name' => $provinceName,
            'district_id' => (string) $district->id,
            'district_name' => $district->name,
            'district' => $district,
        ];
    }

    private function saveCandidate(Request $request, array $data, string $id, bool $creating): void
    {
        $user = $request->user();
        $role = $user->roles()->value('name');
        $resolved = $this->resolveProvinceAndDistrict($data['provinsi'] ?? null, $data['kabupatenKota'] ?? null, $user);
        $provinceId = $resolved['province_id'];
        $district = $resolved['district'];

        if ($role === 'province_admin' && $provinceId !== $user->province_id) {
            abort(403);
        }
        if ($role === 'district_admin' && $district->id !== $user->district_id) {
            abort(403);
        }
        if ($role === 'task_force' && ! app(Bp3miScope::class)->allowsProvinceId($user, $provinceId)) {
            abort(403);
        }
        if (in_array($role, ['institution_admin', 'training_operator', 'vokasi', 'lembaga_vokasi'], true) || $user->scope_level === 'lembaga') {
            $institution = $this->resolveUserInstitution($user);
            if (! $institution && ! $request->session()->has('impersonator_id')) {
                $instName = $user->organization ?: ($user->scope_name ?: ('Lembaga Vokasi '.($user->name ?: 'Mitra')));
                $instId = 'inst-'.Str::slug($instName);
                DB::table('institutions')->updateOrInsert(
                    ['id' => $instId],
                    [
                        'name' => $instName,
                        'province_id' => $user->province_id ?: '33',
                        'district_id' => $user->district_id ?: '3372',
                        'institution_type' => 'Perguruan Tinggi / Politeknik',
                        'ownership_type' => 'Swasta',
                        'status' => 'Aktif',
                        'verification_status' => 'Verified',
                        'evokasi_status' => 'Terverifikasi e-Vokasi',
                        'updated_at' => now(),
                    ]
                );
                $institution = DB::table('institutions')->where('id', $instId)->first();
                if ($institution && empty($user->institution_id)) {
                    DB::table('users')->where('id', $user->id)->update(['institution_id' => $institution->id]);
                }
            }
        } else {
            $institution = null;
        }
        $existing = $creating ? null : DB::table('job_seekers')->where('id', $id)->first();
        $canVerify = in_array($role, ['task_force', 'verifier'], true);
        $existingVerification = $creating
            ? 'Pending Verification'
            : ($existing?->verification_status ?? 'Pending Verification');
        $existingLifecycle = $creating
            ? 'SUBMITTED'
            : ($existing?->lifecycle_status ?? 'SUBMITTED');

        $attributes = [
            'full_name' => $data['fullName'],
            'gender' => $data['gender'],
            'province_id' => $provinceId,
            'district_id' => $district->id,
            'institution_id' => $institution?->id ?? ($user->institution_id ?: $existing?->institution_id),
            'education_level' => $data['educationLevel'],
            'institution_name' => $institution?->name ?? ($user->organization ?: ($user->scope_name ?: ($data['institutionName'] ?: ($existing?->institution_name ?? 'Lembaga Vokasi')))),
            'major' => $data['major'],
            'source_type' => in_array($role, ['institution_admin', 'vokasi', 'lembaga_vokasi', 'training_operator'], true)
                ? 'LPK'
                : ($role === 'province_admin' || $role === 'district_admin'
                    ? 'Disnaker'
                    : match ($data['sourceType'] ?? '') {
                        'Lembaga Vokasi' => 'LPK',
                        'SMK / Pendidikan Vokasi' => 'SMK',
                        default => 'Disnaker',
                    }),
            'readiness_status' => $data['readinessStatus'],
            'verification_status' => $creating ? 'Pending Verification' : ($canVerify ? $data['verificationStatus'] : $existingVerification),
            'lifecycle_status' => $creating ? 'SUBMITTED' : ($canVerify ? ($data['lifecycleStatus'] ?? 'SUBMITTED') : $existingLifecycle),
            'preferred_countries' => json_encode($data['preferredCountry'] ?? []),
            'preferred_job_roles' => json_encode($data['preferredJobRole'] ?? []),
            'work_experiences' => json_encode($data['workExperiences'] ?? [], JSON_THROW_ON_ERROR),
            'certifications' => json_encode($data['certifications'] ?? [], JSON_THROW_ON_ERROR),
            'preferred_sectors' => json_encode($data['preferredSectors'] ?? [], JSON_THROW_ON_ERROR),
            'updated_at' => now(),
        ];

        if ($creating) {
            $attributes += [
                'registration_number' => 'REG-'.Str::upper(Str::random(10)),
                'nik' => $data['nik'],
                'created_by' => $request->user()->name,
                'external_source' => 'taskforce_roster',
                'created_at' => now(),
            ];
            DB::table('job_seekers')->insert(['id' => $id] + $attributes);
        } else {
            DB::table('job_seekers')->where('id', $id)->update($attributes);
        }

        DB::table('job_seeker_skills')->where('job_seeker_id', $id)->delete();
        foreach ($data['skills'] ?? [] as $skill) {
            DB::table('job_seeker_skills')->insert([
                'job_seeker_id' => $id,
                'skill_name' => $skill,
                'certified' => false,
            ]);
        }
        DB::table('job_seeker_languages')->where('job_seeker_id', $id)->delete();
        foreach ($data['languageProficiency'] ?? [] as $language) {
            DB::table('job_seeker_languages')->insert([
                'job_seeker_id' => $id,
                'language' => $language['language'],
                'level' => $language['level'],
            ]);
        }

        $fieldChanged = null;
        $oldValue = null;
        $newValue = null;
        $reason = $creating ? 'Pendaftaran data calon peserta baru.' : 'Pembaruan profil data calon peserta.';

        if (! $creating && $existing) {
            if ($existing->readiness_status !== $data['readinessStatus']) {
                $fieldChanged = 'Status Kesiapan';
                $oldValue = $existing->readiness_status;
                $newValue = $data['readinessStatus'];
                $reason = "Perubahan status kesiapan peserta dari {$oldValue} menjadi {$newValue}.";
            } elseif ($existing->full_name !== $data['fullName']) {
                $fieldChanged = 'Nama Lengkap';
                $oldValue = $existing->full_name;
                $newValue = $data['fullName'];
                $reason = "Perubahan nama lengkap peserta menjadi {$newValue}.";
            } else {
                $fieldChanged = 'Biodata / Kualifikasi';
                $oldValue = $existing->full_name;
                $newValue = $data['fullName'];
                $reason = 'Pemutakhiran profil, kesiapan paspor, sertifikasi, atau data kontak peserta.';
            }
        }

        $this->writeAudit($request, 'candidates', $id, $creating ? 'INPUT_DATA' : 'UPDATE_DATA', $reason, $fieldChanged, $oldValue, $newValue);

        $recon = app(CandidateInstitutionReconciliationService::class);
        $newInstId = $data['institutionId'] ?? null;
        $newInstName = $data['institutionName'] ?? null;
        if (! empty($newInstId)) {
            $recon->syncInstitutionCountForId((string) $newInstId);
        }
        if (! empty($newInstName)) {
            $instIds = DB::table('institutions')
                ->where('name', $newInstName)
                ->orWhereRaw('LOWER(name) = ?', [mb_strtolower($newInstName)])
                ->pluck('id');
            foreach ($instIds as $instId) {
                $recon->syncInstitutionCountForId((string) $instId);
            }
        }
        if (! $creating && $existing) {
            if (! empty($existing->institution_id) && $existing->institution_id !== $newInstId) {
                $recon->syncInstitutionCountForId((string) $existing->institution_id);
            }
            if (! empty($existing->institution_name) && $existing->institution_name !== $newInstName) {
                $oldInstIds = DB::table('institutions')
                    ->where('name', $existing->institution_name)
                    ->orWhereRaw('LOWER(name) = ?', [mb_strtolower($existing->institution_name)])
                    ->pluck('id');
                foreach ($oldInstIds as $instId) {
                    $recon->syncInstitutionCountForId((string) $instId);
                }
            }
        }
    }

    private function saveProgram(Request $request, array $data, string $id, bool $creating): void
    {
        $sectorId = $this->referenceId('sectors', 'name', $data['targetSector'], 'targetSector');
        $occupationId = $this->referenceId('occupations', 'title', $data['targetJobRole'], 'targetJobRole');
        $this->assertOccupationSector($occupationId, $sectorId, 'targetJobRole');
        $countryId = $this->referenceId('countries', 'name', $data['targetCountry'], 'targetCountry');
        $existing = $creating ? null : DB::table('training_programs')->where('id', $id)->first();
        $institutionId = in_array($request->user()->roles()->value('name'), ['institution_admin', 'training_operator', 'vokasi', 'lembaga_vokasi'], true)
            ? $request->user()->institution_id
            : $data['institutionId'];
        if ($request->user()->roles()->value('name') === 'task_force') {
            $provinceId = DB::table('institutions')->where('id', $institutionId)->value('province_id');
            abort_unless(app(Bp3miScope::class)->allowsProvinceId($request->user(), $provinceId), 403);
        }

        $attributes = [
            'name' => $data['title'],
            'program_type' => $data['programType'],
            'sector_id' => $sectorId,
            'occupation_id' => $occupationId,
            'target_country_id' => $countryId,
            'total_jp' => $data['durationJP'],
            'certification_target' => $data['certificationTarget'],
            'cost_per_participant' => $data['estimatedCostPerParticipant'],
            'quota' => $data['quota'],
            'curriculum' => implode("\n", $data['curriculumOutline'] ?? []),
            'start_date' => $data['scheduleStart'] ?? null,
            'end_date' => $data['scheduleEnd'] ?? null,
            'institution_id' => $institutionId,
            'updated_at' => now(),
        ];

        if ($creating) {
            $attributes += ['status' => 'Aktif', 'created_at' => now()];
            DB::table('training_programs')->insert(['id' => $id] + $attributes);
        } else {
            DB::table('training_programs')->where('id', $id)->update($attributes);
        }

        if ($institutionId && ((int) ($data['durationJP'] ?? 0) > 0 || ! empty($data['scheduleStart'])) && Schema::hasColumn('training_classes', 'program_id')) {
            $existingClass = DB::table('training_classes')->where('program_id', $id)->first();
            if ($existingClass) {
                DB::table('training_classes')->where('id', $existingClass->id)->update([
                    'institution_id' => $institutionId,
                    'class_name' => $data['title'].' - Batch I',
                    'capacity' => max(20, (int) ($data['quota'] ?: 25)),
                    'updated_at' => now(),
                ]);
            } else {
                $classId = 'CLS-'.strtoupper(substr(md5((string) $id), 0, 8));
                DB::table('training_classes')->updateOrInsert(
                    ['id' => $classId],
                    [
                        'program_id' => $id,
                        'institution_id' => $institutionId,
                        'class_name' => $data['title'].' - Batch I',
                        'capacity' => max(20, (int) ($data['quota'] ?: 25)),
                        'enrolled_count' => (int) ($existing->enrolled_count ?? 0),
                        'status' => 'Berjalan',
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }
        }

        $fieldChanged = null;
        $oldValue = null;
        $newValue = null;
        $reason = $creating ? 'Pendaftaran program pelatihan vokasi baru.' : 'Pembaruan kurikulum & kuota program pelatihan.';

        if (! $creating && $existing) {
            if ($existing->name !== $data['title']) {
                $fieldChanged = 'Judul Program';
                $oldValue = $existing->name;
                $newValue = $data['title'];
                $reason = "Perubahan nama program pelatihan menjadi {$newValue}.";
            } elseif ($existing->quota !== (int) $data['quota']) {
                $fieldChanged = 'Alokasi Kuota';
                $oldValue = "{$existing->quota} Peserta";
                $newValue = "{$data['quota']} Peserta";
                $reason = 'Penyesuaian kuota alokasi peserta program pelatihan.';
            } else {
                $fieldChanged = 'Kurikulum & Biaya';
                $oldValue = "{$existing->total_jp} JP";
                $newValue = "{$data['durationJP']} JP";
                $reason = 'Pembaruan silabus durasi jam pelajaran atau estimasi biaya.';
            }
        }

        $this->writeAudit($request, 'programs', $id, $creating ? 'INPUT_DATA' : 'UPDATE_DATA', $reason, $fieldChanged, $oldValue, $newValue);
    }

    private function saveProvider(Request $request, array $data, string $id, bool $creating): void
    {
        $role = $request->user()->roles()->value('name');
        $provinceId = null;
        if (! in_array($data['provinsi'] ?? '', ['Belum diketahui', '', null], true)) {
            $provinceId = DB::table('provinces')->where('name', $data['provinsi'])->value('id');
            if (! $provinceId) {
                $provinceId = DB::table('provinces')->whereRaw('LOWER(name) = ?', [mb_strtolower($data['provinsi'])])->value('id');
            }
            if (! $provinceId) {
                $provinceId = match (mb_strtolower($data['provinsi'])) {
                    'daerah khusus ibukota jakarta', 'dki jakarta' => DB::table('provinces')->whereIn(DB::raw('LOWER(name)'), ['dki jakarta', 'daerah khusus ibukota jakarta'])->value('id'),
                    'daerah istimewa yogyakarta', 'di yogyakarta' => DB::table('provinces')->whereIn(DB::raw('LOWER(name)'), ['di yogyakarta', 'daerah istimewa yogyakarta'])->value('id'),
                    default => null,
                };
            }
        }

        $district = null;
        if ($provinceId && ! in_array($data['kabupatenKota'] ?? '', ['Belum diketahui', '', null], true)) {
            $district = DB::table('districts')
                ->where('province_id', $provinceId)
                ->where(function ($query) use ($data) {
                    $query->where('name', $data['kabupatenKota'])
                        ->orWhereRaw('LOWER(name) = ?', [mb_strtolower($data['kabupatenKota'])]);
                })
                ->first();

            if (! $district) {
                $baseName = trim(preg_replace('/^(kabupaten|kab\.?|kota(?:\s+adm\.?|\s+administrasi)?)\s+/ui', '', $data['kabupatenKota']));
                if ($baseName !== '') {
                    $district = DB::table('districts')
                        ->where('province_id', $provinceId)
                        ->where(function ($query) use ($baseName) {
                            $query->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($baseName).'%']);
                        })
                        ->first();
                }
            }
        }

        $existing = DB::table('institutions')->where('id', $id)->first();
        $metadata = $existing ? $this->decodeArray($existing->external_metadata) : [];
        if (! empty($data['provinsi'])) {
            $metadata['provinceName'] = $data['provinsi'];
        }
        if (! empty($data['kabupatenKota'])) {
            $metadata['districtName'] = $data['kabupatenKota'];
        }
        if (array_key_exists('supportedCountries', $data)) {
            $metadata['supportedCountries'] = array_values(array_unique($data['supportedCountries']));
        }
        if (! empty($data['institutionStatus'])) {
            $metadata['sourceStatus'] = $data['institutionStatus'];
        }
        $catalogUrls = null;
        if (array_key_exists('procurementCatalogUrls', $data) && is_array($data['procurementCatalogUrls'])) {
            $catalogUrls = self::parseCatalogUrls($data['procurementCatalogUrls']);
        } elseif (array_key_exists('procurementCatalogUrl', $data)) {
            $catalogUrls = self::parseCatalogUrls($data['procurementCatalogUrl']);
        }
        if ($catalogUrls !== null) {
            $metadata['procurementCatalogUrls'] = $catalogUrls;
            $metadata['procurementCatalogUrl'] = ! empty($catalogUrls) ? implode("\n", $catalogUrls) : null;
        }
        if (array_key_exists('mouDriveUrl', $data)) {
            $metadata['mouDriveUrl'] = ! empty($data['mouDriveUrl']) ? trim((string) $data['mouDriveUrl']) : null;
        }
        if (array_key_exists('procurementMethod', $data)) {
            $metadata['procurementMethod'] = ! empty($data['procurementMethod']) ? trim((string) $data['procurementMethod']) : null;
        }

        $institutionType = match ($data['providerType']) {
            'BLK', 'Balai', 'BLKLN' => 'BLK',
            'LPK' => 'LPK',
            'LKP' => 'LKP',
            'Perguruan Tinggi / Politeknik', 'Universitas', 'Politeknik', 'Institut', 'Sekolah Tinggi', 'Akademi' => 'Perguruan Tinggi / Politeknik',
            default => 'SMK',
        };

        $finalProvinceId = $provinceId ?: $existing?->province_id;
        $finalDistrictId = $district?->id ?: ($finalProvinceId === $existing?->province_id ? $existing?->district_id : null);
        if (
            $role === 'task_force'
            && ! app(Bp3miScope::class)->allowsProvinceId($request->user(), $finalProvinceId)
        ) {
            abort(403);
        }

        $attributes = [
            'name' => $data['name'],
            'institution_type' => $institutionType,
            'ownership_type' => $data['institutionStatus'] ?? $existing?->ownership_type ?? 'Negeri',
            'province_id' => $finalProvinceId,
            'district_id' => $finalDistrictId,
            'address' => $data['address'] ?? null,
            'head_name' => $data['leaderName'] ?? null,
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'accreditation' => $data['accreditation'],
            'procurement_method' => $data['procurementMethod'] ?? $existing?->procurement_method,
            'procurement_catalog_url' => $catalogUrls !== null
                ? (! empty($catalogUrls) ? implode("\n", $catalogUrls) : null)
                : $existing?->procurement_catalog_url,
            'mou_drive_url' => array_key_exists('mouDriveUrl', $data)
                ? (! empty($data['mouDriveUrl']) ? trim((string) $data['mouDriveUrl']) : null)
                : $existing?->mou_drive_url,
            'evokasi_status' => $data['evokasiVerificationStatus'],
            'instructor_count' => $data['certifiedInstructorsCount'],
            'class_count' => $data['classCount'],
            'ready_participant_count' => $data['readyParticipantCount'],
            'readiness_score' => $data['operationalReadinessScore'] ?? 0,
            'supported_sectors' => json_encode($data['supportedSectors'] ?? []),
            'external_metadata' => json_encode($metadata, JSON_THROW_ON_ERROR),
            'verification_status' => $creating ? 'Pending Verification' : (
                $data['evokasiVerificationStatus'] === 'Terverifikasi e-Vokasi' ? 'Verified' : 'Pending Verification'
            ),
            'updated_at' => now(),
        ];

        if ($creating) {
            $attributes += [
                'status' => 'Aktif',
                'total_active_students' => 0,
                'created_at' => now(),
            ];
            DB::table('institutions')->insert(['id' => $id] + $attributes);
        } else {
            DB::table('institutions')->where('id', $id)->update($attributes);
        }

        DB::table('institution_facilities')->where('institution_id', $id)->delete();
        foreach ($data['facilities'] ?? [] as $facility) {
            DB::table('institution_facilities')->insert([
                'institution_id' => $id,
                'facility_name' => $facility,
                'capacity' => 0,
                'created_at' => now(),
            ]);
        }

        $fieldChanged = null;
        $oldValue = null;
        $newValue = null;
        $reason = $creating ? 'Pendaftaran lembaga vokasi baru.' : 'Pembaruan data lembaga vokasi.';

        if (! $creating && $existing) {
            $newStatus = $data['institutionStatus'] ?? $existing->ownership_type;
            if ($newStatus !== $existing->ownership_type) {
                $fieldChanged = 'Status Kepemilikan (Negeri/Swasta)';
                $oldValue = $existing->ownership_type;
                $newValue = $newStatus;
                $reason = "Perubahan status kepemilikan lembaga dari {$oldValue} menjadi {$newValue}.";
            } elseif ($existing->name !== $data['name']) {
                $fieldChanged = 'Nama Lembaga';
                $oldValue = $existing->name;
                $newValue = $data['name'];
                $reason = "Perubahan nama lembaga menjadi {$newValue}.";
            } elseif ($existing->accreditation !== $data['accreditation']) {
                $fieldChanged = 'Akreditasi';
                $oldValue = $existing->accreditation;
                $newValue = $data['accreditation'];
                $reason = "Perubahan status akreditasi dari {$oldValue} menjadi {$newValue}.";
            } elseif (($existing->procurement_catalog_url ?? null) !== ($attributes['procurement_catalog_url'] ?? null)) {
                $fieldChanged = 'Link Inaproc e-Katalog';
                $oldValue = $existing->procurement_catalog_url;
                $newValue = $attributes['procurement_catalog_url'];
                $reason = "Perubahan tautan Inaproc e-Katalog LKPP menjadi {$newValue}.";
            } elseif (($existing->mou_drive_url ?? null) !== ($attributes['mou_drive_url'] ?? null)) {
                $fieldChanged = 'Link Dokumen MoU';
                $oldValue = $existing->mou_drive_url;
                $newValue = $attributes['mou_drive_url'];
                $reason = "Perubahan tautan berkas dokumen MoU menjadi {$newValue}.";
            } else {
                $fieldChanged = 'Sarana & Prasarana';
                $oldValue = "Kelas: {$existing->class_count}, Instruktur: {$existing->instructor_count}";
                $newValue = "Kelas: {$data['classCount']}, Instruktur: {$data['certifiedInstructorsCount']}";
                $reason = 'Pembaruan data sarana & fasilitas lembaga vokasi.';
            }
        }

        $this->writeAudit($request, 'providers', $id, $creating ? 'INPUT_DATA' : 'UPDATE_DATA', $reason, $fieldChanged, $oldValue, $newValue);
    }

    private function saveDemand(Request $request, array $data, string $id, bool $creating): void
    {
        $countryId = $this->referenceId('countries', 'name', $data['country'], 'country');
        $sectorId = $this->referenceId('sectors', 'name', $data['sector'], 'sector');
        $occupationId = $this->referenceId('occupations', 'title', $data['jobTitle'], 'jobTitle');
        $this->assertOccupationSector($occupationId, $sectorId, 'jobTitle');
        $employer = DB::table('employers')
            ->where('name', $data['employerName'])
            ->where('country_id', $countryId)
            ->first();

        if ($request->user()->employer_id && (! $employer || $employer->id !== $request->user()->employer_id)) {
            abort(403);
        }
        if (
            $request->user()->roles()->value('name') === 'task_force'
            && ! app(Bp3miScope::class)->allowsDemandCountry($request->user(), $countryId)
        ) {
            abort(403);
        }
        if (! $employer) {
            $employerId = 'EMP-'.Str::upper(Str::random(10));
            DB::table('employers')->insert([
                'id' => $employerId,
                'name' => $data['employerName'],
                'country_id' => $countryId,
                'industry' => $data['sector'],
                'verification_status' => 'Pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $employerId = $employer->id;
        }

        $language = preg_split('/\s+/', trim($data['requiredLanguageLevel']), 2);
        $attributes = [
            'employer_id' => $employerId,
            'country_id' => $countryId,
            'sector_id' => $sectorId,
            'occupation_id' => $occupationId,
            'headcount' => $data['requiredQuota'],
            'filled_quota' => $data['filledQuota'] ?? 0,
            'salary_monthly_idr' => $this->salaryInRupiah($data['salaryRangeString'], $countryId),
            'salary_range_string' => $data['salaryRangeString'],
            'job_description' => $data['jobTitle'],
            'required_skills' => implode(', ', $data['requiredSkills'] ?? []),
            'required_certifications' => json_encode($data['requiredCertifications'] ?? []),
            'min_education' => $data['minEducation'],
            'required_language' => $language[0] ?? null,
            'min_language_level' => $language[1] ?? null,
            'work_term_months' => $data['workTermMonths'],
            'deadline' => $data['deadlineDate'],
            'updated_at' => now(),
        ];

        $existing = $creating ? null : DB::table('job_demands')->where('id', $id)->first();

        if ($creating) {
            $attributes += [
                'placement_track' => 'P to P',
                'verification_status' => 'Pending',
                'created_at' => now(),
            ];
            DB::table('job_demands')->insert(['id' => $id] + $attributes);
        } else {
            DB::table('job_demands')->where('id', $id)->update($attributes);
        }

        $fieldChanged = null;
        $oldValue = null;
        $newValue = null;
        $reason = $creating ? 'Pendaftaran permintaan demand pekerja luar negeri baru.' : 'Pembaruan kuota dan kualifikasi demand.';

        if (! $creating && $existing) {
            if ($existing->headcount !== (int) $data['requiredQuota']) {
                $fieldChanged = 'Kuota Kebutuhan';
                $oldValue = "{$existing->headcount} Pekerja";
                $newValue = "{$data['requiredQuota']} Pekerja";
                $reason = 'Penyesuaian kuota kebutuhan tenaga kerja luar negeri.';
            } else {
                $fieldChanged = 'Persyaratan Jabatan';
                $oldValue = $existing->job_description ?? $data['jobTitle'];
                $newValue = $data['jobTitle'];
                $reason = 'Pembaruan kualifikasi dan persyaratan lowongan demand luar negeri.';
            }
        }

        $this->writeAudit($request, 'demands', $id, $creating ? 'INPUT_DATA' : 'UPDATE_DATA', $reason, $fieldChanged, $oldValue, $newValue);
    }

    private function createApprovalRequest(Request $request, string $type, string $id): void
    {
        $entityType = match ($type) {
            'candidates' => 'calon_peserta',
            'programs' => 'program_pelatihan',
            'providers' => 'lembaga_vokasi',
            'demands' => 'demand_luar_negeri',
        };
        $hasPendingRequest = DB::table('approval_requests')
            ->where('entity_type', $entityType)
            ->where('entity_id', $id)
            ->where('status', 'PENDING')
            ->exists();

        $now = now();
        if (! $hasPendingRequest) {
            $approvalId = 'APP-'.Str::upper(Str::random(20));
            DB::table('approval_requests')->insert([
                'id' => $approvalId,
                'entity_type' => $entityType,
                'entity_id' => $id,
                'title' => 'Pengajuan '.str_replace('_', ' ', $entityType).' #'.$id,
                'submitted_by' => $request->user()->name,
                'submitted_role' => $request->user()->roles()->value('name') ?? 'operator',
                'scope_label' => $request->user()->scope_name,
                'submitted_at' => $now,
                'validation_status' => 'PASSED',
                'status' => 'PENDING',
                'data_snapshot' => json_encode(['source' => 'smk_goglobal'], JSON_THROW_ON_ERROR),
            ]);
            DB::table('approval_histories')->insert([
                'approval_request_id' => $approvalId,
                'actor_id' => $request->user()->id,
                'actor_name' => $request->user()->name,
                'action' => 'SUBMIT',
                'notes' => 'Data tersimpan dan menunggu verifikasi.',
                'created_at' => $now,
            ]);
        }

        match ($type) {
            'candidates' => DB::table('job_seekers')->where('id', $id)->update([
                'verification_status' => 'Pending Verification',
                'lifecycle_status' => 'SUBMITTED',
                'updated_at' => $now,
            ]),
            'programs' => DB::table('training_programs')->where('id', $id)->update([
                'status' => 'Aktif',
                'updated_at' => $now,
            ]),
            'providers' => DB::table('institutions')->where('id', $id)->update([
                'verification_status' => 'Pending Verification',
                'updated_at' => $now,
            ]),
            'demands' => DB::table('job_demands')->where('id', $id)->update([
                'verification_status' => 'Pending',
                'updated_at' => $now,
            ]),
        };
    }

    private function referenceId(string $table, string $column, string $value, string $field): string
    {
        $id = DB::table($table)->where($column, $value)->value('id');
        if (! $id) {
            $id = DB::table($table)->whereRaw("LOWER({$column}) = ?", [mb_strtolower($value)])->value('id');
        }
        if (! $id) {
            $clean = trim($value);
            $id = DB::table($table)->whereRaw("LOWER({$column}) LIKE ?", ['%'.mb_strtolower($clean).'%'])->value('id');
        }
        if (! $id) {
            // Cek kecocokan bagian split jika input mengandung slash/pemisah (mis. 'Manufaktur / Pengelasan')
            $parts = array_filter(array_map('trim', preg_split('/[\/,]/', $value)));
            foreach ($parts as $part) {
                if ($part !== '') {
                    $id = DB::table($table)->whereRaw("LOWER({$column}) = ?", [mb_strtolower($part)])->value('id');
                    if (! $id) {
                        $id = DB::table($table)->whereRaw("? LIKE CONCAT('%', LOWER({$column}), '%')", [mb_strtolower($part)])->value('id');
                    }
                    if ($id) {
                        break;
                    }
                }
            }
        }
        if (! $id) {
            throw ValidationException::withMessages([
                $field => "Nilai {$field} tidak ditemukan. Pilih salah satu nilai dari data referensi.",
            ]);
        }

        return (string) $id;
    }

    private function assertOccupationSector(string $occupationId, string $sectorId, string $field): void
    {
        $belongsToSector = DB::table('occupations')
            ->where('id', $occupationId)
            ->where('sector_id', $sectorId)
            ->exists();
        if (! $belongsToSector) {
            throw ValidationException::withMessages([
                $field => 'Jabatan tidak sesuai dengan sektor yang dipilih.',
            ]);
        }
    }

    private function salaryInRupiah(string $salaryRange, string $countryId): int
    {
        if (preg_match('/Rp\s*([\d.,]+)(?:\s*-\s*([\d.,]+))?\s*(Jt|Juta)?/i', $salaryRange, $rupiahMatch)) {
            $rupiahAmounts = array_slice(array_filter([$rupiahMatch[1] ?? null, $rupiahMatch[2] ?? null]), 0, 2);
            $multiplier = isset($rupiahMatch[3]) && $rupiahMatch[3] !== '' ? 1_000_000 : 1;
            $values = array_map(
                fn (string $amount): int => (int) preg_replace('/\D/', '', $amount) * $multiplier,
                $rupiahAmounts,
            );

            return (int) round(array_sum($values) / count($values));
        }

        preg_match_all('/\d[\d.,]*/', $salaryRange, $matches);
        $amounts = array_slice($matches[0], 0, 2);
        $values = array_map(
            fn (string $amount): int => (int) preg_replace('/\D/', '', $amount),
            $amounts,
        );
        if ($values === []) {
            return 0;
        }

        $average = (int) round(array_sum($values) / count($values));
        $exchangeRate = (float) DB::table('countries')->where('id', $countryId)->value('exchange_rate_to_idr');

        return (int) round($average * $exchangeRate);
    }

    private function authorizeWrite(Request $request, string $type, string $action): void
    {
        abort_unless(isset(self::ENTITY_TABLES[$type]), 404);
        $role = $request->user()->roles()->value('name');

        if (in_array($role, ['super_admin', 'superadmin', 'directorate_admin', 'direktorat'], true) || $request->session()->has('impersonator_id')) {
            return;
        }

        $allowedRoles = match ($type) {
            'candidates' => ['super_admin', 'superadmin', 'task_force', 'taskforce', 'province_admin', 'district_admin', 'institution_admin', 'verifier', 'vokasi', 'lembaga_vokasi'],
            'programs' => ['super_admin', 'superadmin', 'task_force', 'taskforce', 'directorate_admin', 'direktorat', 'institution_admin', 'training_operator', 'vokasi', 'lembaga_vokasi'],
            'providers' => ['super_admin', 'superadmin', 'task_force', 'taskforce', 'directorate_admin', 'direktorat', 'institution_admin', 'vokasi', 'lembaga_vokasi'],
            'demands' => ['super_admin', 'superadmin', 'task_force', 'taskforce', 'demand_admin'],
        };

        abort_unless(in_array($role, $allowedRoles, true), 403);
        if ($action === 'create' && in_array($role, ['institution_admin', 'vokasi', 'lembaga_vokasi'], true) && $type === 'providers') {
            abort(403);
        }
        if ($type === 'candidates' && in_array($role, ['institution_admin', 'vokasi', 'lembaga_vokasi'], true) && ! $this->resolveUserInstitution($request->user())) {
            abort(403);
        }
        if ($action === 'create' && in_array($role, ['institution_admin', 'training_operator', 'vokasi', 'lembaga_vokasi'], true) && ! $this->resolveUserInstitution($request->user()) && $type === 'programs') {
            abort(403);
        }
        if ($action === 'create' && $role === 'demand_admin' && ! $request->user()->employer_id) {
            abort(403);
        }
    }

    private function resolveUserInstitution(object $user): ?object
    {
        if (! empty($user->institution_id)) {
            $inst = DB::table('institutions')->where('id', $user->institution_id)->first();
            if ($inst) {
                return $inst;
            }
        }

        $scope = app(BusinessDataPresenter::class)->resolveInstitutionScope($user);
        if (! empty($scope['ids'])) {
            $inst = DB::table('institutions')->whereIn('id', $scope['ids'])->first();
            if ($inst) {
                return $inst;
            }
        }
        foreach ($scope['patterns'] ?? [] as $pattern) {
            $clean = str_replace('%', '', (string) $pattern);
            if ($clean !== '') {
                $inst = DB::table('institutions')->where('name', 'LIKE', "%{$clean}%")->first();
                if ($inst) {
                    return $inst;
                }
            }
        }

        // Also check by user's organization or scope_name
        $orgName = trim((string) ($user->organization ?: $user->scope_name));
        if (! empty($orgName)) {
            $inst = DB::table('institutions')
                ->where('name', 'LIKE', "%{$orgName}%")
                ->orWhereRaw('LOWER(name) = ?', [mb_strtolower($orgName)])
                ->first();
            if ($inst) {
                return $inst;
            }
            $core = trim(preg_replace('/^(lpks|lpk|lkp|pk|blk|blkln|blkk|smkn|smk\s+negeri|smk|stikes|poltek|politeknik|universitas|sekolah\s+tinggi|institut)\.?\s+/i', '', $orgName));
            if (mb_strlen($core) >= 4) {
                $inst = DB::table('institutions')
                    ->where('name', 'LIKE', "%{$core}%")
                    ->orWhereRaw('LOWER(name) = ?', [mb_strtolower($core)])
                    ->first();
                if ($inst) {
                    return $inst;
                }
            }
        }

        // Check for Politeknik Indonusa / Suci Purwandari
        $userText = mb_strtolower(($user->name ?? '').' '.($user->email ?? '').' '.($user->organization ?? ''));
        if (str_contains($userText, 'indonusa') || str_contains($userText, 'suci') || str_contains($userText, 'sippmi')) {
            $inst = DB::table('institutions')
                ->where('id', 'sippmi-politeknik-indonusa')
                ->orWhere('name', 'LIKE', '%Indonusa%')
                ->first();
            if ($inst) {
                return $inst;
            }
        }

        // Auto-heal institution if user is an institution_admin
        if (! empty($user->organization) || str_contains($userText, 'indonusa') || str_contains($userText, 'suci') || str_contains($userText, 'sippmi')) {
            $instName = ! empty($user->organization) ? $user->organization : 'Politeknik Indonusa Surakarta';
            $instId = str_contains(mb_strtolower($instName), 'indonusa') ? 'sippmi-politeknik-indonusa' : 'inst-'.Str::slug($instName);
            DB::table('institutions')->updateOrInsert(
                ['id' => $instId],
                [
                    'name' => $instName,
                    'province_id' => $user->province_id ?: '33',
                    'district_id' => $user->district_id ?: '3372',
                    'institution_type' => 'Perguruan Tinggi / Politeknik',
                    'ownership_type' => 'Swasta',
                    'status' => 'Aktif',
                    'verification_status' => 'Verified',
                    'evokasi_status' => 'Terverifikasi e-Vokasi',
                    'updated_at' => now(),
                ]
            );

            return DB::table('institutions')->where('id', $instId)->first();
        }

        return null;
    }

    private function assertRecordScope(Request $request, string $type, object $record): void
    {
        $user = $request->user();
        $role = $user->roles()->value('name');
        if (in_array($role, ['super_admin', 'superadmin', 'directorate_admin', 'direktorat'], true) || $request->session()->has('impersonator_id')) {
            return;
        }

        $instScope = app(BusinessDataPresenter::class)->resolveInstitutionScope($user);

        $allowed = match ($type) {
            'candidates' => match ($role) {
                'task_force', 'taskforce' => empty($record->province_id) || app(Bp3miScope::class)->allowsProvinceId($user, $record->province_id),
                'province_admin' => $record->province_id === $user->province_id,
                'district_admin' => $record->district_id === $user->district_id,
                'institution_admin', 'vokasi', 'lembaga_vokasi' => $record->institution_id === $user->institution_id
                    || in_array($record->institution_id, $instScope['ids'], true)
                    || (! empty($user->organization) && stripos((string) $record->institution_name, $user->organization) !== false)
                    || collect($instScope['patterns'] ?? [])->contains(fn ($p) => stripos((string) $record->institution_name, str_replace('%', '', (string) $p)) !== false)
                    || empty($user->institution_id),
                default => $user->scope_level === 'lembaga'
                    ? ($record->institution_id === $user->institution_id || in_array($record->institution_id, $instScope['ids'], true))
                    : true,
            },
            'programs' => match ($role) {
                'task_force', 'taskforce' => app(Bp3miScope::class)->allowsProvinceId(
                    $user,
                    DB::table('institutions')->where('id', $record->institution_id)->value('province_id'),
                ),
                'institution_admin', 'training_operator', 'vokasi', 'lembaga_vokasi' => $record->institution_id === $user->institution_id
                    || in_array($record->institution_id, $instScope['ids'], true),
                default => true,
            },
            'providers' => match ($role) {
                'task_force', 'taskforce' => empty($record->province_id) || app(Bp3miScope::class)->allowsProvinceId($user, $record->province_id),
                'institution_admin', 'vokasi', 'lembaga_vokasi' => $record->id === $user->institution_id
                    || in_array($record->id, $instScope['ids'], true)
                    || (! empty($user->organization) && stripos($record->name, $user->organization) !== false)
                    || collect($instScope['patterns'] ?? [])->contains(fn ($p) => stripos($record->name, str_replace('%', '', (string) $p)) !== false)
                    || empty($user->institution_id),
                default => true,
            },
            'demands' => match ($role) {
                'task_force', 'taskforce' => app(Bp3miScope::class)->allowsDemandCountry($user, $record->country_id),
                'demand_admin' => $record->employer_id === $user->employer_id,
                default => true,
            },
        };
        abort_unless($allowed, 403);
    }

    public function auditLogs(Request $request): JsonResponse
    {
        $search = trim($request->input('search', ''));
        $action = trim($request->input('action', 'ALL'));

        $query = DB::table('audit_logs')
            ->orderByDesc('created_at');

        if ($action !== 'ALL' && ! empty($action)) {
            $query->where('action_type', $action);
        }

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('actor_name', 'like', "%{$search}%")
                    ->orWhere('actor_role', 'like', "%{$search}%")
                    ->orWhere('entity', 'like', "%{$search}%")
                    ->orWhere('entity_id', 'like', "%{$search}%")
                    ->orWhere('justification_reason', 'like', "%{$search}%")
                    ->orWhere('field_changed', 'like', "%{$search}%");
            });
        }

        $logs = $query->limit(200)->get()->map(function (object $row): array {
            return [
                'id' => (string) $row->id,
                'timestamp' => $row->created_at ? date('Y-m-d H:i:s \W\I\B', strtotime($row->created_at)) : '',
                'actorName' => (string) ($row->actor_name ?? 'Sistem'),
                'actorRole' => (string) ($row->actor_role ?? 'Pengguna'),
                'scope' => (string) ($row->scope ?? 'Nasional'),
                'actionType' => (string) $row->action_type,
                'entity' => (string) $row->entity,
                'entityId' => (string) $row->entity_id,
                'fieldChanged' => $row->field_changed,
                'oldValue' => $row->old_value,
                'newValue' => $row->new_value,
                'justificationReason' => (string) ($row->justification_reason ?? ''),
                'ipAddress' => (string) ($row->ip_address ?? '127.0.0.1'),
            ];
        })->all();

        return response()->json([
            'data' => $logs,
            'total' => count($logs),
        ]);
    }

    private function writeAudit(
        Request $request,
        string $type,
        string $id,
        string $action,
        string $reason,
        ?string $fieldChanged = null,
        ?string $oldValue = null,
        ?string $newValue = null
    ): void {
        $user = $request->user();
        $role = $user->roles()->first();
        $entityName = match ($type) {
            'candidates', 'calon_peserta' => 'Data Calon Peserta',
            'programs', 'program_pelatihan' => 'Program Pelatihan',
            'providers', 'lembaga_vokasi' => 'Data Lembaga Vokasi',
            'demands', 'demand_luar_negeri' => 'Permintaan Tenaga Kerja',
            default => $type,
        };

        DB::table('audit_logs')->insert([
            'id' => 'LOG-'.Str::upper(Str::random(12)),
            'user_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $role?->title ?? 'Pengguna',
            'scope' => $user->scope_name ?? 'Nasional',
            'action_type' => $action,
            'entity' => $entityName,
            'entity_id' => $id,
            'field_changed' => $fieldChanged,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'justification_reason' => $reason,
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'created_at' => now(),
        ]);
    }

    private function decodeArray(?string $payload): array
    {
        if (! $payload) {
            return [];
        }

        $decoded = json_decode($payload, true);

        return is_array($decoded) ? $decoded : [];
    }

    public function syncProgramsFromProviders(Request $request): RedirectResponse
    {
        $user = $request->user();
        $role = $user->roles()->value('name');

        abort_unless(in_array($role, ['super_admin', 'task_force', 'directorate_admin'], true), 403);

        $result = app(ProgramSyncFromProviders::class)->sync();
        app(BusinessDataPresenter::class)->forget($user);

        return back()->with('success', "Sinkronisasi program dari lembaga vokasi selesai. Ditambahkan: {$result['created']}, Diperbarui: {$result['updated']}, Dilewati: {$result['skipped']}");
    }

    public function recommendedProviders(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = $user->roles()->value('name');

        abort_unless(in_array($role, ['task_force', 'directorate_admin', 'matching', 'verifikator', 'super_admin'], true), 403);

        $filters = $request->only(['occupation_id', 'sector_id', 'province', 'country_id']);
        $result = app(ProviderRecommendationService::class)->recommend($filters, $user);

        return response()->json(['data' => $result]);
    }
}
