<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('institutions')->updateOrInsert(
            ['id' => 'VOC-DEMO-001'],
            [
                'name' => 'SMK Contoh Cibinong',
                'npsn_or_vin' => 'DEMO-001',
                'institution_type' => 'SMK',
                'ownership_type' => 'Negeri',
                'province_id' => '32',
                'district_id' => '3201',
                'address' => 'Alamat fiktif untuk data pengembangan',
                'accreditation' => 'A',
                'evokasi_status' => 'Belum Terverifikasi',
                'total_active_students' => 120,
                'instructor_count' => 12,
                'workshop_capacity' => 30,
                'verification_status' => 'Unverified',
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        DB::table('institution_facilities')->updateOrInsert(
            ['institution_id' => 'VOC-DEMO-001', 'facility_name' => 'Ruang Praktik Contoh'],
            [
                'facility_type' => 'Workshop',
                'capacity' => 20,
                'condition_status' => 'Baik',
                'created_at' => now(),
            ],
        );

        DB::table('institution_instructors')->updateOrInsert(
            ['institution_id' => 'VOC-DEMO-001', 'name' => 'Instruktur Contoh'],
            [
                'expertise_field' => 'Pengelasan dasar',
                'bnsp_certified' => false,
                'overseas_experience' => null,
                'created_at' => now(),
            ],
        );

        DB::table('job_seekers')->updateOrInsert(
            ['id' => 'CAND-DEMO-001'],
            [
                'registration_number' => 'REG-DEMO-001',
                'nik' => '0000000000000001',
                'full_name' => 'Peserta Contoh 01',
                'gender' => 'L',
                'province_id' => '32',
                'district_id' => '3201',
                'education_level' => 'SMK',
                'institution_name' => 'SMK Contoh Cibinong',
                'institution_id' => 'VOC-DEMO-001',
                'major' => 'Teknik Pengelasan',
                'gpa_score' => 3.50,
                'source_type' => 'SMK',
                'source_reference' => 'Fixture pengembangan',
                'readiness_status' => 'Needs Upskilling',
                'verification_status' => 'Unverified',
                'lifecycle_status' => 'DRAFT',
                'passport_ready' => false,
                'mcu_ready' => false,
                'created_by' => 'Seeder pengembangan',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        DB::table('job_seeker_skills')->updateOrInsert(
            ['job_seeker_id' => 'CAND-DEMO-001', 'skill_name' => 'Pengelasan dasar'],
            ['certified' => false],
        );
        DB::table('job_seeker_languages')->updateOrInsert(
            ['job_seeker_id' => 'CAND-DEMO-001', 'language' => 'Jepang'],
            ['level' => 'Dasar'],
        );
        DB::table('job_seeker_documents')->updateOrInsert(
            ['job_seeker_id' => 'CAND-DEMO-001', 'document_type' => 'CV'],
            [
                'document_path' => 'fixtures/demo/cv-contoh.pdf',
                'verified_status' => 'Pending',
                'uploaded_at' => now(),
            ],
        );

        DB::table('training_programs')->updateOrInsert(
            ['id' => 'PROG-DEMO-001'],
            [
                'name' => 'Program Contoh Pengelasan Dasar',
                'program_type' => 'Upskilling',
                'sector_id' => 'SECT-WELD',
                'occupation_id' => 'OCC-WL-01',
                'target_country_id' => 'JP',
                'total_jp' => 120,
                'certification_target' => 'Sertifikasi kompetensi dasar',
                'cost_per_participant' => 0,
                'quota' => 20,
                'enrolled_count' => 0,
                'curriculum' => 'Kurikulum contoh untuk pengujian lokal',
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        DB::table('training_classes')->updateOrInsert(
            ['id' => 'CLASS-DEMO-001'],
            [
                'training_program_id' => 'PROG-DEMO-001',
                'institution_id' => 'VOC-DEMO-001',
                'class_name' => 'Kelas Contoh Pengelasan',
                'start_date' => '2026-11-01',
                'end_date' => '2027-01-31',
                'capacity' => 20,
                'status' => 'Pendaftaran',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        DB::table('training_enrollments')->updateOrInsert(
            ['training_class_id' => 'CLASS-DEMO-001', 'job_seeker_id' => 'CAND-DEMO-001'],
            [
                'enrolled_at' => now(),
                'status' => 'Aktif',
                'attendance_percent' => 0,
                'assessment_score' => null,
            ],
        );

        DB::table('employers')->updateOrInsert(
            ['id' => 'EMP-DEMO-001'],
            [
                'name' => 'Pemberi Kerja Contoh',
                'country_id' => 'JP',
                'industry' => 'Manufaktur',
                'contact_person' => 'Kontak Contoh',
                'email' => 'kontak@example.invalid',
                'verification_status' => 'Pending',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        DB::table('job_demands')->updateOrInsert(
            ['id' => 'DEM-DEMO-001'],
            [
                'employer_id' => 'EMP-DEMO-001',
                'country_id' => 'JP',
                'sector_id' => 'SECT-WELD',
                'occupation_id' => 'OCC-WL-01',
                'headcount' => 2,
                'salary_monthly_idr' => 0,
                'job_description' => 'Permintaan contoh untuk pengujian lokal.',
                'required_skills' => 'Pengelasan dasar',
                'min_education' => 'SMK',
                'required_language' => 'Jepang',
                'min_language_level' => 'Dasar',
                'deadline' => '2027-12-31',
                'placement_track' => 'P to P',
                'verification_status' => 'Draft',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        DB::table('matching_runs')->updateOrInsert(
            ['id' => 'MATCH-RUN-DEMO-001'],
            [
                'job_demand_id' => 'DEM-DEMO-001',
                'run_date' => now(),
                'total_candidates_analyzed' => 1,
                'matches_found' => 1,
                'algorithm_version' => 'demo-v1',
            ],
        );

        DB::table('candidate_matches')->updateOrInsert(
            [
                'matching_run_id' => 'MATCH-RUN-DEMO-001',
                'job_demand_id' => 'DEM-DEMO-001',
                'job_seeker_id' => 'CAND-DEMO-001',
            ],
            [
                'training_class_id' => 'CLASS-DEMO-001',
                'match_score' => 78,
                'match_status' => 'Rekomendasi',
                'match_explanation' => 'Data fixture untuk pengujian lokal.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        $matchId = DB::table('candidate_matches')
            ->where('matching_run_id', 'MATCH-RUN-DEMO-001')
            ->where('job_demand_id', 'DEM-DEMO-001')
            ->where('job_seeker_id', 'CAND-DEMO-001')
            ->value('id');
        DB::table('placement_cases')->updateOrInsert(
            ['id' => 'PLACEMENT-DEMO-001'],
            [
                'candidate_match_id' => $matchId,
                'status' => 'Proses Dokumen',
                'started_at' => now(),
            ],
        );

        DB::table('approval_requests')->updateOrInsert(
            ['id' => 'APPROVAL-DEMO-001'],
            [
                'entity_type' => 'calon_peserta',
                'entity_id' => 'CAND-DEMO-001',
                'title' => 'Verifikasi Peserta Contoh 01',
                'submitted_by' => 'Administrator Contoh',
                'submitted_role' => 'district_admin',
                'scope_label' => 'Kabupaten Bogor (fixture)',
                'submitted_at' => now(),
                'validation_status' => 'PASSED',
                'status' => 'PENDING',
                'data_snapshot' => json_encode(['fixture' => true], JSON_THROW_ON_ERROR),
            ],
        );

        DB::table('approval_histories')->updateOrInsert(
            ['approval_request_id' => 'APPROVAL-DEMO-001', 'action' => 'SUBMIT'],
            [
                'actor_id' => null,
                'actor_name' => 'Administrator Contoh',
                'notes' => 'Riwayat contoh untuk pengujian.',
                'created_at' => now(),
            ],
        );

        DB::table('audit_logs')->updateOrInsert(
            ['id' => 'AUDIT-DEMO-001'],
            [
                'user_id' => null,
                'actor_name' => 'Administrator Contoh',
                'actor_role' => 'Super Admin',
                'scope' => 'Nasional (data contoh)',
                'action_type' => 'INPUT_DATA',
                'entity' => 'calon_peserta',
                'entity_id' => 'CAND-DEMO-001',
                'justification_reason' => 'Fixture audit untuk pengujian lokal.',
                'created_at' => now(),
            ],
        );
    }
}
