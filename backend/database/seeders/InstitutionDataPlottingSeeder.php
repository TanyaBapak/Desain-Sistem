<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InstitutionDataPlottingSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $this->seedInstitutions();
            $this->bindInstitutionUsers();
            $this->seedApprovedDemands();
            $this->plotCandidates();
            $this->plotTrainingPrograms();
            $this->plotAllocationsAndMatches();
            $this->ensureTargetSettings();
        });
    }

    private function ensureTargetSettings(): void
    {
        $currentYear = (int) now()->year;
        foreach ([$currentYear, 2026, 2027] as $year) {
            DB::table('dashboard_targets')->updateOrInsert(
                ['metric_key' => 'registeredJobSeekers_' . $year],
                ['target_value' => 12600, 'updated_at' => now()]
            );
        }
    }

    private function seedInstitutions(): void
    {
        $institutions = [
            [
                'id' => 'VOC-DEMO-001',
                'name' => 'SMK Contoh Cibinong',
                'npsn_or_vin' => 'DEMO-001',
                'institution_type' => 'SMK',
                'ownership_type' => 'Negeri',
                'province_id' => '32',
                'district_id' => '3201',
                'address' => 'Jl. Raya Jakarta-Bogor Km. 43, Cibinong, Kab. Bogor',
                'head_name' => 'Drs. H. Ahmad Subarjo, M.Pd',
                'phone' => '021-8752001',
                'email' => 'smkcibinong.vokasi@sch.id',
                'accreditation' => 'A',
                'evokasi_status' => 'Terverifikasi e-Vokasi',
                'verification_status' => 'Verified',
                'status' => 'Aktif',
                'total_active_students' => 240,
                'instructor_count' => 24,
                'class_count' => 8,
                'ready_participant_count' => 49,
                'workshop_capacity' => 60,
                'readiness_score' => 94,
                'supported_sectors' => json_encode(['Manufaktur', 'Konstruksi', 'Teknik Mesin']),
            ],
            [
                'id' => 'INS-D1B455831B68B81E',
                'name' => 'LPK Omega Hotel Academy',
                'npsn_or_vin' => 'VIN-3301-OMEGA',
                'institution_type' => 'LPK',
                'ownership_type' => 'Swasta',
                'province_id' => '33',
                'district_id' => '3301',
                'address' => 'Jl. Gatot Subroto No. 45, Cilacap, Jawa Tengah',
                'head_name' => 'Eko Priyono Prasetyo, S.Par',
                'phone' => '0282-534001',
                'email' => 'info@omegahotelacademy.co.id',
                'accreditation' => 'A',
                'evokasi_status' => 'Terverifikasi e-Vokasi',
                'verification_status' => 'Verified',
                'status' => 'Aktif',
                'total_active_students' => 180,
                'instructor_count' => 18,
                'class_count' => 6,
                'ready_participant_count' => 49,
                'workshop_capacity' => 50,
                'readiness_score' => 92,
                'supported_sectors' => json_encode(['Hospitality', 'Pariwisata', 'Perhotelan']),
            ],
            [
                'id' => 'INS-11B789B1BA61DA82',
                'name' => 'Politeknik Indonusa Surakarta',
                'npsn_or_vin' => 'VIN-3372-INDONUSA',
                'institution_type' => 'Perguruan Tinggi / Politeknik',
                'ownership_type' => 'Swasta',
                'province_id' => '33',
                'district_id' => '3372',
                'address' => 'Jl. KH Samanhudi No. 84, Surakarta, Jawa Tengah',
                'head_name' => 'Ir. Suci Purwandari, M.M, Ph.D',
                'phone' => '0271-717001',
                'email' => 'kampus@poltekindonusa.ac.id',
                'accreditation' => 'A',
                'evokasi_status' => 'Terverifikasi e-Vokasi',
                'verification_status' => 'Verified',
                'status' => 'Aktif',
                'total_active_students' => 350,
                'instructor_count' => 32,
                'class_count' => 10,
                'ready_participant_count' => 49,
                'workshop_capacity' => 80,
                'readiness_score' => 96,
                'supported_sectors' => json_encode(['Manufaktur', 'Kesehatan', 'Teknologi Informasi']),
            ],
        ];

        foreach ($institutions as $inst) {
            DB::table('institutions')->updateOrInsert(['id' => $inst['id']], $inst);
        }
    }

    private function bindInstitutionUsers(): void
    {
        $mappings = [
            'demo-lembaga-vokasi' => 'VOC-DEMO-001',
            'demo-operator-pelatihan' => 'VOC-DEMO-001',
            'ekopriyono' => 'INS-D1B455831B68B81E',
            'sucipurwandari' => 'INS-11B789B1BA61DA82',
        ];

        foreach ($mappings as $username => $institutionId) {
            User::query()->where('username', $username)->update(['institution_id' => $institutionId]);
        }
    }

    private function seedApprovedDemands(): void
    {
        $employers = [
            [
                'id' => 'EMP-JP-001',
                'name' => 'Hitachi Zosen Heavy Industries Co., Ltd.',
                'country_id' => 'JP',
                'industry' => 'Manufaktur Presisi & Konstruksi Mesin',
                'contact_person' => 'Kenji Tanaka',
                'email' => 'recruitment@hitachizosen-recruit.jp',
                'phone' => '+81-3-5555-0199',
                'verification_status' => 'Verified',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 'EMP-TR-001',
                'name' => 'Rixos Hospitality & Resort Group Turkey',
                'country_id' => 'TR',
                'industry' => 'Hospitality & Luxury Hotel',
                'contact_person' => 'Mehmet Yilmaz',
                'email' => 'hr@rixos-hotels.tr',
                'phone' => '+90-212-334-0100',
                'verification_status' => 'Verified',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 'EMP-KR-001',
                'name' => 'Hyundai Mobis Parts Manufacturing Ltd.',
                'country_id' => 'KR',
                'industry' => 'Manufaktur Otomotif',
                'contact_person' => 'Park Min-Soo',
                'email' => 'global.talent@mobis-korea.kr',
                'phone' => '+82-2-3465-7000',
                'verification_status' => 'Verified',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 'EMP-MY-001',
                'name' => 'Shangri-La International Resort Penang',
                'country_id' => 'MY',
                'industry' => 'Hospitality & Tourism',
                'contact_person' => 'Nurul Ain binti Razak',
                'email' => 'careers@shangri-la-penang.my',
                'phone' => '+60-4-888-8888',
                'verification_status' => 'Verified',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($employers as $emp) {
            DB::table('employers')->updateOrInsert(['id' => $emp['id']], $emp);
        }

        DB::table('job_demands')->where('id', 'DEM-DEMO-001')->update([
            'verification_status' => 'Approved',
            'headcount' => 25,
            'employer_id' => 'EMP-DEMO-001',
        ]);

        $demands = [
            [
                'id' => 'DEM-JP-001',
                'employer_id' => 'EMP-JP-001',
                'country_id' => 'JP',
                'sector_id' => 'SECT-WELD',
                'occupation_id' => 'OCC-WL-01',
                'headcount' => 50,
                'filled_quota' => 15,
                'salary_monthly_idr' => 22000000,
                'salary_range_string' => '¥ 200.000 - 240.000 / bln',
                'job_description' => 'Welder konstruksi kapal dan manufaktur presisi di Prefektur Aichi, Jepang.',
                'required_skills' => json_encode(['SMAW 3G', 'GMAW', 'Membaca Gambar Teknik']),
                'required_certifications' => json_encode(['BNSP Welder', 'JIS Welding']),
                'min_education' => 'SMK',
                'required_language' => 'Jepang',
                'min_language_level' => 'JLPT N4',
                'work_term_months' => 36,
                'deadline' => now()->addMonths(3)->format('Y-m-d'),
                'placement_track' => 'P to P',
                'verification_status' => 'Approved',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 'DEM-TR-001',
                'employer_id' => 'EMP-TR-001',
                'country_id' => 'TR',
                'sector_id' => 'SECT-HOSP',
                'occupation_id' => 'OCC-HOSP-04',
                'headcount' => 40,
                'filled_quota' => 10,
                'salary_monthly_idr' => 16000000,
                'salary_range_string' => '₺ 32.000 - 38.000 / bln',
                'job_description' => 'Cook dan F&B Service di jaringan hotel bintang 5 kawasan Antalya & Istanbul, Turki.',
                'required_skills' => json_encode(['Hot & Cold Kitchen', 'Food Safety HACCP', 'Baking']),
                'required_certifications' => json_encode(['Sertifikat Kompetensi Tata Boga']),
                'min_education' => 'SMK / LPK',
                'required_language' => 'Inggris / Turki',
                'min_language_level' => 'A2 / Intermediate',
                'work_term_months' => 24,
                'deadline' => now()->addMonths(4)->format('Y-m-d'),
                'placement_track' => 'P to P',
                'verification_status' => 'Approved',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 'DEM-KR-001',
                'employer_id' => 'EMP-KR-001',
                'country_id' => 'KR',
                'sector_id' => 'SECT-WELD',
                'occupation_id' => 'OCC-MFG-03',
                'headcount' => 60,
                'filled_quota' => 20,
                'salary_monthly_idr' => 26000000,
                'salary_range_string' => '₩ 2.150.000 - 2.500.000 / bln',
                'job_description' => 'Operator lini perakitan manufaktur otomotif kawasan Gyeonggi-do, Korea Selatan.',
                'required_skills' => json_encode(['Operasi Mesin Otomasi', 'K3 Industri', 'Quality Inspection']),
                'required_certifications' => json_encode(['Sertifikat Teknis Manufaktur']),
                'min_education' => 'SMK',
                'required_language' => 'Korea',
                'min_language_level' => 'EPS-TOPIK',
                'work_term_months' => 36,
                'deadline' => now()->addMonths(5)->format('Y-m-d'),
                'placement_track' => 'G to G',
                'verification_status' => 'Approved',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 'DEM-MY-001',
                'employer_id' => 'EMP-MY-001',
                'country_id' => 'MY',
                'sector_id' => 'SECT-HOSP',
                'occupation_id' => 'OCC-HOSP-02',
                'headcount' => 35,
                'filled_quota' => 12,
                'salary_monthly_idr' => 12000000,
                'salary_range_string' => 'RM 2.800 - 3.400 / bln',
                'job_description' => 'Housekeeping dan Guest Room Attendant jaringan resort internasional di Penang & Langkawi.',
                'required_skills' => json_encode(['Housekeeping Standard', 'Chemical Handling', 'Linen Management']),
                'required_certifications' => json_encode(['BNSP Perhotelan']),
                'min_education' => 'SMK',
                'required_language' => 'Melayu / Inggris',
                'min_language_level' => 'Dasar',
                'work_term_months' => 24,
                'deadline' => now()->addMonths(2)->format('Y-m-d'),
                'placement_track' => 'P to P',
                'verification_status' => 'Approved',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($demands as $demand) {
            DB::table('job_demands')->updateOrInsert(['id' => $demand['id']], $demand);
        }
    }

    private function plotCandidates(): void
    {
        // Pulihkan kandidat contoh jika sebelumnya ter-softdelete
        DB::table('job_seekers')->where('id', 'CAND-DEMO-001')->update([
            'deleted_at' => null,
            'institution_id' => 'VOC-DEMO-001',
            'institution_name' => 'SMK Contoh Cibinong',
            'verification_status' => 'Verified',
        ]);

        $candidates = DB::table('job_seekers')
            ->whereNull('deleted_at')
            ->orderBy('id')
            ->get();

        $chunks = $candidates->chunk(ceil($candidates->count() / 3));
        $targetInstitutions = [
            0 => ['id' => 'VOC-DEMO-001', 'name' => 'SMK Contoh Cibinong', 'source' => 'SMK'],
            1 => ['id' => 'INS-D1B455831B68B81E', 'name' => 'LPK Omega Hotel Academy', 'source' => 'LPK'],
            2 => ['id' => 'INS-11B789B1BA61DA82', 'name' => 'Politeknik Indonusa Surakarta', 'source' => 'D3'],
        ];

        foreach ($chunks as $index => $chunk) {
            $target = $targetInstitutions[$index] ?? $targetInstitutions[0];
            $ids = $chunk->pluck('id')->all();
            if (! empty($ids)) {
                DB::table('job_seekers')->whereIn('id', $ids)->update([
                    'institution_id' => $target['id'],
                    'institution_name' => $target['name'],
                    'source_type' => $target['source'],
                ]);
            }
        }
    }

    private function plotTrainingPrograms(): void
    {
        // 1. Plot program SMK Contoh Cibinong
        $cibinongPrograms = DB::table('training_programs')
            ->where('sector_id', 'SECT-WELD')
            ->orWhere('name', 'like', '%Las%')
            ->orWhere('name', 'like', '%Mesin%')
            ->orWhere('name', 'like', '%Otomotif%')
            ->limit(10)
            ->pluck('id')
            ->all();

        if (! empty($cibinongPrograms)) {
            DB::table('training_programs')->whereIn('id', $cibinongPrograms)->update([
                'institution_id' => 'VOC-DEMO-001',
                'status' => 'Aktif',
            ]);
        }

        // 2. Plot program LPK Omega Hotel Academy
        $omegaPrograms = DB::table('training_programs')
            ->where('sector_id', 'SECT-HOSP')
            ->orWhere('name', 'like', '%Hotel%')
            ->orWhere('name', 'like', '%Boga%')
            ->orWhere('name', 'like', '%Cook%')
            ->orWhere('name', 'like', '%Pelayan%')
            ->limit(10)
            ->pluck('id')
            ->all();

        if (! empty($omegaPrograms)) {
            DB::table('training_programs')->whereIn('id', $omegaPrograms)->update([
                'institution_id' => 'INS-D1B455831B68B81E',
                'status' => 'Aktif',
            ]);
        }

        // 3. Plot program Politeknik Indonusa Surakarta
        $indonusaPrograms = DB::table('training_programs')
            ->where('sector_id', 'SECT-CARE')
            ->orWhere('name', 'like', '%Teknik%')
            ->orWhere('name', 'like', '%Komputer%')
            ->orWhere('name', 'like', '%Perawat%')
            ->limit(10)
            ->pluck('id')
            ->all();

        if (! empty($indonusaPrograms)) {
            DB::table('training_programs')->whereIn('id', $indonusaPrograms)->update([
                'institution_id' => 'INS-11B789B1BA61DA82',
                'status' => 'Aktif',
            ]);
        }
    }

    private function plotAllocationsAndMatches(): void
    {
        $institutions = ['VOC-DEMO-001', 'INS-D1B455831B68B81E', 'INS-11B789B1BA61DA82'];
        $demands = ['DEM-JP-001', 'DEM-TR-001', 'DEM-KR-001'];

        foreach ($institutions as $idx => $instId) {
            $demandId = $demands[$idx % count($demands)];
            $program = DB::table('training_programs')->where('institution_id', $instId)->first();
            $candidates = DB::table('job_seekers')->where('institution_id', $instId)->limit(15)->pluck('id')->all();

            if (! $program || empty($candidates)) {
                continue;
            }

            $classId = 'CLS-' . strtoupper(substr(md5($instId), 0, 8));
            DB::table('training_classes')->updateOrInsert(
                ['id' => $classId],
                [
                    'training_program_id' => $program->id,
                    'institution_id' => $instId,
                    'class_name' => 'Kelas Akselerasi SGG Batch 1',
                    'start_date' => now()->format('Y-m-d'),
                    'end_date' => now()->addMonths(2)->format('Y-m-d'),
                    'capacity' => 25,
                    'status' => 'Sedang Berjalan',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            $allocationId = 'ALOC-' . strtoupper(substr(md5($instId . $demandId), 0, 8));
            DB::table('program_allocations')->updateOrInsert(
                ['id' => $allocationId],
                [
                    'training_class_id' => $classId,
                    'job_demand_id' => $demandId,
                    'training_program_id' => $program->id,
                    'institution_id' => $instId,
                    'total_budget' => 75000000,
                    'start_date' => now()->format('Y-m-d'),
                    'end_date' => now()->addMonths(2)->format('Y-m-d'),
                    'status' => 'Approved',
                    'created_by' => User::query()->where('username', 'demo-taskforce')->value('id') ?? 1,
                    'deleted_at' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            // Alokasikan peserta ke program allocation
            foreach ($candidates as $candId) {
                DB::table('program_allocation_candidates')->updateOrInsert([
                    'program_allocation_id' => $allocationId,
                    'job_seeker_id' => $candId,
                ]);
            }
        }
    }
}
