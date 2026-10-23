-- ==============================================================================
-- DATABASE SCHEMA: SMK GO GLOBAL COMMAND CENTER (SGG-CC)
-- Target RDBMS: MySQL 8.0+ / MariaDB 10.5+
-- Charset: utf8mb4 / utf8mb4_unicode_ci
-- Architected for: Kementerian Pelindungan Pekerja Migran Indonesia (P2MI) & Kemnaker
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `smk_goglobal` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `smk_goglobal`;

-- Disable Foreign Key Checks during setup
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. WILAYAH ADMINISTRATIF INDONESIA (Master Data)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `districts`;
DROP TABLE IF EXISTS `provinces`;

CREATE TABLE `provinces` (
  `id` CHAR(2) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `districts` (
  `id` CHAR(4) NOT NULL,
  `province_id` CHAR(2) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('Kabupaten', 'Kota') NOT NULL DEFAULT 'Kabupaten',
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_districts_province` FOREIGN KEY (`province_id`) REFERENCES `provinces` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. SEKTOR, NEGARA TUJUAN, DAN JABATAN KERJA (Master Data)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `occupations`;
DROP TABLE IF EXISTS `sectors`;
DROP TABLE IF EXISTS `countries`;

CREATE TABLE `sectors` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `icon` VARCHAR(50) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `countries` (
  `id` CHAR(2) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `flag_code` VARCHAR(10) NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'IDR',
  `exchange_rate_to_idr` DECIMAL(15,2) DEFAULT 1.00,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `occupations` (
  `id` VARCHAR(50) NOT NULL,
  `sector_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `code` VARCHAR(50) NULL,
  `skill_standard` VARCHAR(150) NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_occupations_sector` FOREIGN KEY (`sector_id`) REFERENCES `sectors` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. IDENTITY & ROLE-BASED ACCESS CONTROL (Spatie-Compatible Engine)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `role_has_permissions`;
DROP TABLE IF EXISTS `model_has_roles`;
DROP TABLE IF EXISTS `model_has_permissions`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `roles` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(125) NOT NULL UNIQUE,
  `guard_name` VARCHAR(125) NOT NULL DEFAULT 'web',
  `title` VARCHAR(150) NOT NULL,
  `badge` VARCHAR(150) NULL,
  `core_group` VARCHAR(50) NOT NULL,
  `default_tab` VARCHAR(50) NOT NULL DEFAULT 'overview',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `permissions` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(125) NOT NULL UNIQUE,
  `guard_name` VARCHAR(125) NOT NULL DEFAULT 'web',
  `module` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `role_has_permissions` (
  `permission_id` BIGINT UNSIGNED NOT NULL,
  `role_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`permission_id`, `role_id`),
  CONSTRAINT `fk_rhp_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rhp_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `nip` VARCHAR(50) NULL,
  `organization` VARCHAR(255) NULL,
  `scope_level` ENUM('national', 'provinsi', 'kabupaten', 'lembaga', 'demand') NOT NULL DEFAULT 'national',
  `scope_name` VARCHAR(255) NOT NULL DEFAULT 'Nasional Terpadu',
  `province_id` CHAR(2) NULL,
  `district_id` CHAR(4) NULL,
  `institution_id` VARCHAR(50) NULL,
  `employer_id` VARCHAR(50) NULL,
  `mfa_enabled` BOOLEAN NOT NULL DEFAULT FALSE,
  `mfa_secret` VARCHAR(255) NULL,
  `status` ENUM('Aktif', 'Nonaktif', 'Ditangguhkan') NOT NULL DEFAULT 'Aktif',
  `avatar_initials` VARCHAR(10) NULL,
  `remember_token` VARCHAR(100) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_users_province` FOREIGN KEY (`province_id`) REFERENCES `provinces` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_users_district` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `model_has_roles` (
  `role_id` BIGINT UNSIGNED NOT NULL,
  `model_type` VARCHAR(255) NOT NULL DEFAULT 'App\\Models\\User',
  `model_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`role_id`, `model_id`, `model_type`),
  CONSTRAINT `fk_mhr_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `model_has_permissions` (
  `permission_id` BIGINT UNSIGNED NOT NULL,
  `model_type` VARCHAR(255) NOT NULL DEFAULT 'App\\Models\\User',
  `model_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`permission_id`, `model_id`, `model_type`),
  CONSTRAINT `fk_mhp_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. MASTER LEMBAGA VOKASI (SMK, BLK, LPK, LKP, POLITEKNIK) - MODUL C
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `institution_facilities`;
DROP TABLE IF EXISTS `institution_instructors`;
DROP TABLE IF EXISTS `institutions`;

CREATE TABLE `institutions` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `npsn_or_vin` VARCHAR(50) NULL,
  `institution_type` ENUM('SMK', 'BLK', 'LPK', 'LKP', 'Perguruan Tinggi / Politeknik') NOT NULL,
  `ownership_type` ENUM('Negeri', 'Swasta') NOT NULL DEFAULT 'Negeri',
  `province_id` CHAR(2) NOT NULL,
  `district_id` CHAR(4) NOT NULL,
  `address` TEXT NULL,
  `head_name` VARCHAR(150) NULL,
  `phone` VARCHAR(50) NULL,
  `email` VARCHAR(100) NULL,
  `accreditation` VARCHAR(20) NOT NULL DEFAULT 'A',
  `evokasi_status` ENUM('Terverifikasi e-Vokasi', 'Proses Verifikasi', 'Belum Terverifikasi') NOT NULL DEFAULT 'Terverifikasi e-Vokasi',
  `total_active_students` INT NOT NULL DEFAULT 0,
  `instructor_count` INT NOT NULL DEFAULT 0,
  `workshop_capacity` INT NOT NULL DEFAULT 0,
  `verification_status` ENUM('Verified', 'Pending Verification', 'Unverified') NOT NULL DEFAULT 'Verified',
  `status` ENUM('Aktif', 'Nonaktif') NOT NULL DEFAULT 'Aktif',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_institutions_province` FOREIGN KEY (`province_id`) REFERENCES `provinces` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_institutions_district` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `institution_facilities` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `institution_id` VARCHAR(50) NOT NULL,
  `facility_name` VARCHAR(150) NOT NULL,
  `facility_type` VARCHAR(100) NULL,
  `capacity` INT NOT NULL DEFAULT 0,
  `condition_status` ENUM('Sangat Baik', 'Baik', 'Cukup', 'Perlu Peremajaan') NOT NULL DEFAULT 'Baik',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_facilities_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `institution_instructors` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `institution_id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `expertise_field` VARCHAR(150) NOT NULL,
  `bnsp_certified` BOOLEAN NOT NULL DEFAULT TRUE,
  `overseas_experience` VARCHAR(150) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_instructors_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. SUPPLY / CALON PESERTA PELATIHAN VOKASI - MODUL A
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `job_seeker_languages`;
DROP TABLE IF EXISTS `job_seeker_skills`;
DROP TABLE IF EXISTS `job_seeker_documents`;
DROP TABLE IF EXISTS `job_seekers`;

CREATE TABLE `job_seekers` (
  `id` VARCHAR(50) NOT NULL,
  `registration_number` VARCHAR(50) NOT NULL UNIQUE,
  `nik` VARCHAR(20) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `gender` ENUM('L', 'P') NOT NULL,
  `province_id` CHAR(2) NOT NULL,
  `district_id` CHAR(4) NOT NULL,
  `education_level` ENUM('SMK', 'D3', 'S1', 'Lainnya') NOT NULL DEFAULT 'SMK',
  `institution_name` VARCHAR(255) NOT NULL,
  `institution_id` VARCHAR(50) NULL,
  `major` VARCHAR(150) NOT NULL,
  `gpa_score` DECIMAL(3,2) NULL,
  `source_type` ENUM('Disnaker', 'SMK', 'BLK', 'LPK', 'Mandiri', 'SISKOP2MI') NOT NULL DEFAULT 'Disnaker',
  `source_reference` VARCHAR(100) NULL,
  `readiness_status` ENUM('Ready for Placement', 'Needs Upskilling', 'Needs Reskilling') NOT NULL DEFAULT 'Needs Upskilling',
  `verification_status` ENUM('Verified', 'Pending Verification', 'Unverified') NOT NULL DEFAULT 'Pending Verification',
  `lifecycle_status` ENUM('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'APPROVED',
  `passport_ready` BOOLEAN NOT NULL DEFAULT FALSE,
  `mcu_ready` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_by` VARCHAR(150) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_jobseekers_province` FOREIGN KEY (`province_id`) REFERENCES `provinces` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_jobseekers_district` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_jobseekers_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_seeker_skills` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `job_seeker_id` VARCHAR(50) NOT NULL,
  `skill_name` VARCHAR(100) NOT NULL,
  `certified` BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT `fk_skills_jobseeker` FOREIGN KEY (`job_seeker_id`) REFERENCES `job_seekers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_seeker_languages` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `job_seeker_id` VARCHAR(50) NOT NULL,
  `language` VARCHAR(50) NOT NULL,
  `level` VARCHAR(50) NOT NULL,
  CONSTRAINT `fk_languages_jobseeker` FOREIGN KEY (`job_seeker_id`) REFERENCES `job_seekers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_seeker_documents` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `job_seeker_id` VARCHAR(50) NOT NULL,
  `document_type` ENUM('KTP', 'Ijazah', 'Transkrip', 'Sertifikat_BNSP', 'Paspor', 'MCU', 'CV') NOT NULL,
  `document_path` VARCHAR(255) NOT NULL,
  `verified_status` ENUM('Pending', 'Valid', 'Invalid') NOT NULL DEFAULT 'Pending',
  `uploaded_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_docs_jobseeker` FOREIGN KEY (`job_seeker_id`) REFERENCES `job_seekers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. PROGRAM PELATIHAN & KELAS VOKASI - MODUL B
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `training_enrollments`;
DROP TABLE IF EXISTS `training_classes`;
DROP TABLE IF EXISTS `training_programs`;

CREATE TABLE `training_programs` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `program_type` ENUM('Upskilling', 'Reskilling', 'Pelatihan Bahasa', 'Teknis Terpadu') NOT NULL,
  `sector_id` VARCHAR(50) NOT NULL,
  `occupation_id` VARCHAR(50) NOT NULL,
  `target_country_id` CHAR(2) NOT NULL,
  `total_jp` INT NOT NULL,
  `certification_target` VARCHAR(150) NOT NULL,
  `cost_per_participant` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `quota` INT NOT NULL DEFAULT 50,
  `enrolled_count` INT NOT NULL DEFAULT 0,
  `curriculum` TEXT NULL,
  `status` ENUM('Aktif', 'Nonaktif', 'Selesai') NOT NULL DEFAULT 'Aktif',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_programs_sector` FOREIGN KEY (`sector_id`) REFERENCES `sectors` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_programs_occupation` FOREIGN KEY (`occupation_id`) REFERENCES `occupations` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_programs_country` FOREIGN KEY (`target_country_id`) REFERENCES `countries` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `training_classes` (
  `id` VARCHAR(50) NOT NULL,
  `training_program_id` VARCHAR(50) NOT NULL,
  `institution_id` VARCHAR(50) NOT NULL,
  `class_name` VARCHAR(150) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `capacity` INT NOT NULL DEFAULT 30,
  `status` ENUM('Pendaftaran', 'Sedang Berjalan', 'Selesai', 'Dibatalkan') NOT NULL DEFAULT 'Pendaftaran',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_classes_program` FOREIGN KEY (`training_program_id`) REFERENCES `training_programs` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_classes_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `training_enrollments` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `training_class_id` VARCHAR(50) NOT NULL,
  `job_seeker_id` VARCHAR(50) NOT NULL,
  `enrolled_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('Aktif', 'Lulus', 'Gagal', 'Mengundurkan Diri') NOT NULL DEFAULT 'Aktif',
  `attendance_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `assessment_score` DECIMAL(5,2) NULL,
  CONSTRAINT `fk_enrollments_class` FOREIGN KEY (`training_class_id`) REFERENCES `training_classes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_enrollments_jobseeker` FOREIGN KEY (`job_seeker_id`) REFERENCES `job_seekers` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. DEMAND TENAGA KERJA LUAR NEGERI - MODUL D
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `job_demands`;
DROP TABLE IF EXISTS `employers`;

CREATE TABLE `employers` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `country_id` CHAR(2) NOT NULL,
  `industry` VARCHAR(150) NOT NULL,
  `contact_person` VARCHAR(150) NULL,
  `email` VARCHAR(150) NULL,
  `phone` VARCHAR(50) NULL,
  `address` TEXT NULL,
  `verification_status` ENUM('Verified', 'Pending', 'Rejected') NOT NULL DEFAULT 'Verified',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_employers_country` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_demands` (
  `id` VARCHAR(50) NOT NULL,
  `employer_id` VARCHAR(50) NOT NULL,
  `country_id` CHAR(2) NOT NULL,
  `sector_id` VARCHAR(50) NOT NULL,
  `occupation_id` VARCHAR(50) NOT NULL,
  `headcount` INT NOT NULL DEFAULT 1,
  `salary_monthly_idr` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `job_description` TEXT NULL,
  `required_skills` TEXT NULL,
  `min_education` VARCHAR(50) NOT NULL DEFAULT 'SMK',
  `required_language` VARCHAR(50) NULL,
  `min_language_level` VARCHAR(50) NULL,
  `deadline` DATE NOT NULL,
  `placement_track` ENUM('G to G', 'P to P', 'Mandiri') NOT NULL DEFAULT 'P to P',
  `verification_status` ENUM('Approved', 'Pending', 'Draft') NOT NULL DEFAULT 'Approved',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_demands_employer` FOREIGN KEY (`employer_id`) REFERENCES `employers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_demands_country` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_demands_sector` FOREIGN KEY (`sector_id`) REFERENCES `sectors` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_demands_occupation` FOREIGN KEY (`occupation_id`) REFERENCES `occupations` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. MATCHING ENGINE & STATUS PENEMPATAN
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `placement_cases`;
DROP TABLE IF EXISTS `candidate_matches`;
DROP TABLE IF EXISTS `matching_runs`;

CREATE TABLE `matching_runs` (
  `id` VARCHAR(50) NOT NULL,
  `job_demand_id` VARCHAR(50) NOT NULL,
  `run_date` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `total_candidates_analyzed` INT NOT NULL DEFAULT 0,
  `matches_found` INT NOT NULL DEFAULT 0,
  `algorithm_version` VARCHAR(20) NOT NULL DEFAULT 'v1.0-SSW',
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_mruns_demand` FOREIGN KEY (`job_demand_id`) REFERENCES `job_demands` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `candidate_matches` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `matching_run_id` VARCHAR(50) NULL,
  `job_demand_id` VARCHAR(50) NOT NULL,
  `job_seeker_id` VARCHAR(50) NOT NULL,
  `training_class_id` VARCHAR(50) NULL,
  `match_score` DECIMAL(5,2) NOT NULL,
  `match_status` ENUM('Rekomendasi', 'Dialokasikan', 'Lolos Seleksi', 'Ditolak Employer') NOT NULL DEFAULT 'Rekomendasi',
  `match_explanation` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_cmatches_run` FOREIGN KEY (`matching_run_id`) REFERENCES `matching_runs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cmatches_demand` FOREIGN KEY (`job_demand_id`) REFERENCES `job_demands` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_cmatches_jobseeker` FOREIGN KEY (`job_seeker_id`) REFERENCES `job_seekers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_cmatches_class` FOREIGN KEY (`training_class_id`) REFERENCES `training_classes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `placement_cases` (
  `id` VARCHAR(50) NOT NULL,
  `candidate_match_id` BIGINT UNSIGNED NOT NULL,
  `status` ENUM('Proses Dokumen', 'Penerbitan Visa', 'Medical Checkup 2', 'Siap Berangkat', 'Sudah di Negara Tujuan') NOT NULL DEFAULT 'Proses Dokumen',
  `visa_number` VARCHAR(100) NULL,
  `flight_date` DATE NULL,
  `siskop2mi_id` VARCHAR(100) NULL,
  `started_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_placements_match` FOREIGN KEY (`candidate_match_id`) REFERENCES `candidate_matches` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. ALUR PERSETUJUAN DATA & WORKFLOW VERIFIKASI
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `approval_histories`;
DROP TABLE IF EXISTS `approval_requests`;

CREATE TABLE `approval_requests` (
  `id` VARCHAR(50) NOT NULL,
  `entity_type` ENUM('calon_peserta', 'lembaga_vokasi', 'program_pelatihan', 'demand_luar_negeri') NOT NULL,
  `entity_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `submitted_by` VARCHAR(150) NOT NULL,
  `submitted_role` VARCHAR(50) NOT NULL,
  `scope_label` VARCHAR(150) NOT NULL,
  `submitted_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `validation_status` ENUM('PASSED', 'FLAGGED') NOT NULL DEFAULT 'PASSED',
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED') NOT NULL DEFAULT 'PENDING',
  `reviewed_by` VARCHAR(150) NULL,
  `reviewed_at` TIMESTAMP NULL,
  `rejection_reason` TEXT NULL,
  `revision_notes` TEXT NULL,
  `data_snapshot` JSON NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_appreq_status` (`status`),
  INDEX `idx_appreq_entity` (`entity_type`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `approval_histories` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `approval_request_id` VARCHAR(50) NOT NULL,
  `actor_id` BIGINT UNSIGNED NULL,
  `actor_name` VARCHAR(150) NOT NULL,
  `action` ENUM('SUBMIT', 'AUTO_CHECK', 'VERIFY', 'APPROVE', 'REVISE', 'REJECT') NOT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_apphist_request` FOREIGN KEY (`approval_request_id`) REFERENCES `approval_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. AUDIT TRAIL LOGGING (Keterlacakan Mutasi Data & Autentikasi)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;

CREATE TABLE `audit_logs` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` BIGINT UNSIGNED NULL,
  `actor_name` VARCHAR(150) NOT NULL,
  `actor_role` VARCHAR(100) NOT NULL,
  `scope` VARCHAR(150) NOT NULL,
  `action_type` ENUM('INPUT_DATA', 'AUTO_VALIDATION', 'VERIFIKASI', 'PERSETUJUAN', 'PENOLAKAN', 'REVISI', 'UPDATE_DATA', 'HAPUS_DATA', 'ALOKASI_MATCHING', 'AKUN_HAK_AKSES', 'LOGIN', 'LOGOUT') NOT NULL,
  `entity` VARCHAR(100) NOT NULL,
  `entity_id` VARCHAR(100) NOT NULL,
  `field_changed` VARCHAR(100) NULL,
  `old_value` TEXT NULL,
  `new_value` TEXT NULL,
  `justification_reason` TEXT NOT NULL,
  `ip_address` VARCHAR(50) NOT NULL DEFAULT '127.0.0.1',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_audit_actor` (`actor_name`),
  INDEX `idx_audit_action` (`action_type`),
  INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable Foreign Key Checks
SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- INITIAL SEED DATA (DATA AWAL STAKEHOLDER, WILAYAH, DAN SAMPEL PROGRAM)
-- ==============================================================================

-- 1. Insert Provinsi
INSERT INTO `provinces` (`id`, `name`) VALUES
('31', 'DKI Jakarta'),
('32', 'Jawa Barat'),
('33', 'Jawa Tengah'),
('35', 'Jawa Timur'),
('51', 'Bali'),
('12', 'Sumatera Utara'),
('73', 'Sulawesi Selatan');

-- 2. Insert Kabupaten/Kota
INSERT INTO `districts` (`id`, `province_id`, `name`, `type`) VALUES
('3201', '32', 'Kabupaten Bogor', 'Kabupaten'),
('3271', '32', 'Kota Bogor', 'Kota'),
('3273', '32', 'Kota Bandung', 'Kota'),
('3275', '32', 'Kota Bekasi', 'Kota'),
('3301', '33', 'Kabupaten Cilacap', 'Kabupaten'),
('3578', '35', 'Kota Surabaya', 'Kota'),
('3507', '35', 'Kabupaten Malang', 'Kabupaten'),
('3171', '31', 'Kota Jakarta Pusat', 'Kota');

-- 3. Insert Sektor
INSERT INTO `sectors` (`id`, `name`, `description`, `icon`) VALUES
('SECT-CARE', 'Kesehatan / Caregiver', 'Perawatan lansia & pasien fasilitas kesehatan luar negeri', 'HeartPulse'),
('SECT-WELD', 'Manufaktur / Pengelasan (Welder)', 'Pekerjaan konstruksi, galangan kapal, dan fabrikasi logam', 'Hammer'),
('SECT-AUTO', 'Otomotif & Alat Berat', 'Teknisi perakitan dan perawatan kendaraan bermotor', 'Cpu'),
('SECT-HOSP', 'Hospitality & Pariwisata', 'Perhotelan, tata boga, dan industri pelayanan kapal pesiar', 'Hotel'),
('SECT-AGRI', 'Pertanian Modern & Food Processing', 'Smart agriculture dan pengolahan hasil panen ekspor', 'Wheat');

-- 4. Insert Negara Tujuan
INSERT INTO `countries` (`id`, `name`, `flag_code`, `currency`, `exchange_rate_to_idr`) VALUES
('JP', 'Jepang', 'JP', 'JPY', 104.50),
('DE', 'Jerman', 'DE', 'EUR', 17200.00),
('KR', 'Korea Selatan', 'KR', 'KRW', 11.80),
('TW', 'Taiwan', 'TW', 'TWD', 490.00),
('SA', 'Arab Saudi', 'SA', 'SAR', 4200.00);

-- 5. Insert Jabatan Kerja
INSERT INTO `occupations` (`id`, `sector_id`, `title`, `code`, `skill_standard`) VALUES
('OCC-KG-01', 'SECT-CARE', 'Caregiver / Kaigo (SSW)', 'KG-SSW-01', 'SSW Nursing Caregiver Prometric + JLPT N4'),
('OCC-WL-01', 'SECT-WELD', 'Welder SMAW / GMAW JIS', 'WL-JIS-01', 'Sertifikasi BNSP 3G/4G + SSW Manufacturing'),
('OCC-AT-01', 'SECT-AUTO', 'Automotive Maintenance Tech', 'AT-GER-01', 'Ausbildung Level 2 Standard'),
('OCC-HS-01', 'SECT-HOSP', 'Hotel Staff & Food Service', 'HS-TW-01', 'TOCFL A2 + BNSP Perhotelan');

-- 6. Insert 13 Role Resmi SGG Command Center
INSERT INTO `roles` (`id`, `name`, `guard_name`, `title`, `badge`, `core_group`, `default_tab`) VALUES
(1, 'super_admin', 'web', 'Super Admin / Pusdatin', 'Tata Kelola Sistem & Keamanan', 'superadmin', 'rbac'),
(2, 'leadership', 'web', 'Menteri / Pimpinan', 'Pengambil Kebijakan Strategis', 'pimpinan', 'overview'),
(3, 'task_force', 'web', 'Admin Task Force Nasional', 'Pengendali & Koordinator Program', 'taskforce', 'overview'),
(4, 'directorate_admin', 'web', 'Admin Direktorat', 'Pembina & Pengelola Program', 'taskforce', 'modul-b'),
(5, 'province_admin', 'web', 'Admin Disnaker Provinsi', 'Koordinator Ketenagakerjaan Provinsi', 'disnaker', 'overview'),
(6, 'district_admin', 'web', 'Admin Disnaker Kabupaten/Kota', 'Operator Data Wilayah Daerah', 'disnaker', 'modul-a'),
(7, 'bp3mi_admin', 'web', 'Admin BP3MI', 'Pelayanan & Pelindungan Kawasan BP3MI', 'matching', 'matching'),
(8, 'institution_admin', 'web', 'Admin Lembaga Vokasi', 'Penyelenggara Pelatihan Vokasi', 'vokasi', 'modul-c'),
(9, 'demand_admin', 'web', 'Admin Demand / Pemberi Kerja', 'Mitra Industri Luar Negeri', 'demand', 'modul-d'),
(10, 'verifier', 'web', 'Verifikator', 'Pemeriksa Keabsahan & Validasi', 'verifikator', 'approvals'),
(11, 'training_operator', 'web', 'Operator Pelatihan', 'Pengelola Presensi & Kelas Pelatihan', 'vokasi', 'modul-b'),
(12, 'placement_officer', 'web', 'Petugas Matching / Penempatan', 'Penyelaras Suplai & Penempatan LN', 'matching', 'matching'),
(13, 'auditor', 'web', 'Auditor / Monitoring', 'Pengawasan Internal & Tata Kelola', 'superadmin', 'audit');

-- 7. Insert 13 Akun Pengguna Resmi
INSERT INTO `users` (`id`, `user_code`, `name`, `username`, `email`, `password`, `nip`, `organization`, `scope_level`, `scope_name`, `province_id`, `district_id`, `mfa_enabled`, `avatar_initials`) VALUES
(1, 'USR-001', 'Ir. Agus Wijaya, M.Kom', 'superadmin', 'admin.pusdatin@p2mi.go.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '197805142002121002', 'Pusdatin Kementerian P2MI', 'national', 'Pusdatin Nasional (Seluruh Indonesia)', NULL, NULL, 1, 'AW'),
(2, 'USR-002', 'Menteri Pelindungan PMI RI', 'menteri', 'menteri@p2mi.go.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '196803201994031001', 'Kementerian P2MI RI', 'national', 'Nasional Republik Indonesia (38 Provinsi)', NULL, NULL, 1, 'MN'),
(3, 'USR-003', 'Dr. Ir. Budi Santoso, M.Sc', 'taskforce', 'taskforce.nasional@p2mi.go.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '197508121999031003', 'Task Force Percepatan SMK Go Global', 'national', 'Nasional Terpadu (Lintas K/L)', NULL, NULL, 1, 'BS'),
(4, 'USR-004', 'Dra. Ratna Kusuma, M.Si', 'direktorat', 'bina.vokasi@p2mi.go.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '197904162003122001', 'Ditjen Pembinaan Pelatihan Vokasi', 'national', 'Standardisasi & Kurikulum Vokasi LN', NULL, NULL, 1, 'RK'),
(5, 'USR-005', 'Drs. H. Mulyadi Kartasasmita', 'disnaker.prov', 'disnaker@jabarprov.go.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '197306121998031002', 'Disnakertrans Provinsi Jawa Barat', 'provinsi', 'Provinsi Jawa Barat (27 Kab/Kota)', '32', NULL, 0, 'MK'),
(6, 'USR-006', 'Hendra Setiawan, S.Sos', 'disnaker.bogor', 'disnaker.bogor@jabarprov.go.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '198204192008011005', 'Dinas Tenaga Kerja Kab. Bogor', 'kabupaten', 'Kabupaten Bogor, Provinsi Jawa Barat', '32', '3201', 0, 'HS'),
(7, 'USR-007', 'Wahyu Nugroho, S.H', 'bp3mi.jabar', 'bp3mi.jabar@p2mi.go.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '198409052009121003', 'Balai BP3MI Jawa Barat', 'provinsi', 'Wilayah Pelayanan BP3MI Jawa Barat', '32', NULL, 1, 'WN'),
(8, 'USR-008', 'Drs. Supriyadi, M.Pd', 'smkn1cibinong', 'smkn1cibinong@kemdikbud.go.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '196911041995121001', 'SMKN 1 Cibinong Bogor', 'lembaga', 'SMKN 1 Cibinong (NPSN: 20231418)', '32', '3201', 0, 'SP'),
(9, 'USR-009', 'Kenji Takahashi', 'zenkoukai.jp', 'kenji.takahashi@zenkoukai.or.jp', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Zenkoukai Medical Group Tokyo', 'demand', 'Zenkoukai Medical Group, Tokyo, Jepang', NULL, NULL, 0, 'KT'),
(10, 'USR-010', 'Siti Aminah, S.Kom, M.T', 'verifikator', 'verifikator.pusat@p2mi.go.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '198506242010012004', 'Tim Verifikasi Terpadu Kemenaker-BP3MI', 'national', 'Tim Verifikasi Terpadu Nasional', NULL, NULL, 1, 'SA'),
(11, 'USR-011', 'Ahmad Fauzi, S.Pd', 'operator.latih', 'operator.pelatihan@smkn1cibinong.sch.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '199107182019021004', 'UPT Pelatihan SMKN 1 Cibinong', 'lembaga', 'Lab Bahasa SMKN 1 Cibinong', '32', '3201', 0, 'AF'),
(12, 'USR-012', 'Rian Pratama, S.T', 'matching.officer', 'matching@p2mi.go.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '198902152014021001', 'Direktorat Penempatan Kawasan Asia Pasifik', 'national', 'Direktorat Penempatan Asia Pasifik', NULL, NULL, 0, 'RP'),
(13, 'USR-013', 'Drs. Tri Wahyudi, Ak., CA', 'auditor', 'inspektorat@p2mi.go.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '197103151996031002', 'Inspektorat Jenderal Kementerian P2MI', 'national', 'Inspektorat Jenderal Pengawasan Internal', NULL, NULL, 1, 'TW');

-- Assign Role ke User
INSERT INTO `model_has_roles` (`role_id`, `model_type`, `model_id`) VALUES
(1, 'App\\Models\\User', 1),
(2, 'App\\Models\\User', 2),
(3, 'App\\Models\\User', 3),
(4, 'App\\Models\\User', 4),
(5, 'App\\Models\\User', 5),
(6, 'App\\Models\\User', 6),
(7, 'App\\Models\\User', 7),
(8, 'App\\Models\\User', 8),
(9, 'App\\Models\\User', 9),
(10, 'App\\Models\\User', 10),
(11, 'App\\Models\\User', 11),
(12, 'App\\Models\\User', 12),
(13, 'App\\Models\\User', 13);

-- 8. Insert Lembaga Vokasi (SMK/BLK/LPK)
INSERT INTO `institutions` (`id`, `name`, `npsn_or_vin`, `institution_type`, `ownership_type`, `province_id`, `district_id`, `address`, `accreditation`, `evokasi_status`, `total_active_students`, `instructor_count`, `workshop_capacity`) VALUES
('VOC-JBR-002', 'SMKN 1 Cibinong', '20231418', 'SMK', 'Negeri', '32', '3201', 'Jl. Karadenan No. 7, Cibinong, Kab. Bogor', 'A', 'Terverifikasi e-Vokasi', 1420, 48, 120),
('VOC-JTM-003', 'Balai Besar Pelatihan Vokasi Surabaya', 'VIN-SUR-201', 'BLK', 'Negeri', '35', '3578', 'Jl. Dukuh Menanggal III/29, Surabaya', 'A', 'Terverifikasi e-Vokasi', 850, 32, 200),
('VOC-JBR-001', 'SMKN 1 Gandapura', '10103112', 'SMK', 'Negeri', '32', '3273', 'Jl. Soekarno-Hatta No. 210, Bandung', 'A', 'Terverifikasi e-Vokasi', 1100, 36, 90),
('VOC-JTG-004', 'LPK Mirai Nusantara Cilacap', 'LPK-CLC-99', 'LPK', 'Swasta', '33', '3301', 'Jl. Gatot Subroto No. 45, Cilacap', 'A', 'Terverifikasi e-Vokasi', 320, 14, 60);

-- 9. Insert Calon Peserta Vokasi (Modul A)
INSERT INTO `job_seekers` (`id`, `registration_number`, `nik`, `full_name`, `gender`, `province_id`, `district_id`, `education_level`, `institution_name`, `institution_id`, `major`, `gpa_score`, `source_type`, `readiness_status`, `verification_status`, `lifecycle_status`, `passport_ready`, `mcu_ready`, `created_by`) VALUES
('CAND-2026-001', 'REG-2026-3201-001', '3201081504030001', 'Rizky Pratama', 'L', '32', '3201', 'SMK', 'SMKN 1 Cibinong', 'VOC-JBR-002', 'Teknik Pengelasan', 3.65, 'Disnaker', 'Ready for Placement', 'Verified', 'APPROVED', 1, 1, 'Hendra Setiawan (Disnaker Bogor)'),
('CAND-2026-002', 'REG-2026-3201-002', '3201045209040003', 'Nurul Annisa', 'P', '32', '3201', 'SMK', 'SMKN 1 Cibinong', 'VOC-JBR-002', 'Kesehatan / Keperawatan', 3.82, 'SMK', 'Ready for Placement', 'Verified', 'APPROVED', 1, 1, 'Drs. Supriyadi (SMKN 1 Cibinong)'),
('CAND-2026-003', 'REG-2026-3578-001', '3578121008020005', 'Dimas Prasetyo', 'L', '35', '3578', 'SMK', 'BBPVP Surabaya', 'VOC-JTM-003', 'Teknik Fabrikasi Logam', 3.40, 'BLK', 'Needs Upskilling', 'Verified', 'APPROVED', 0, 1, 'BBPVP Surabaya'),
('CAND-2026-004', 'REG-2026-3301-001', '3301096503050002', 'Siti Rahmawati', 'P', '33', '3301', 'SMK', 'LPK Mirai Cilacap', 'VOC-JTG-004', 'Asisten Keperawatan', 3.55, 'LPK', 'Needs Reskilling', 'Pending Verification', 'SUBMITTED', 0, 0, 'LPK Mirai Cilacap');

-- Insert Skills
INSERT INTO `job_seeker_skills` (`job_seeker_id`, `skill_name`, `certified`) VALUES
('CAND-2026-001', 'Arc Welding SMAW 3G', 1),
('CAND-2026-001', 'GMAW Mig Welding', 1),
('CAND-2026-001', 'Safety Standard OHS', 1),
('CAND-2026-002', 'Kaigo Caregiving Dasar', 1),
('CAND-2026-002', 'Bantuan Hidup Dasar (BHD)', 1),
('CAND-2026-002', 'Geriatri Care', 0);

-- Insert Languages
INSERT INTO `job_seeker_languages` (`job_seeker_id`, `language`, `level`) VALUES
('CAND-2026-001', 'Jepang', 'JLPT N4'),
('CAND-2026-001', 'Inggris', 'Conversational'),
('CAND-2026-002', 'Jepang', 'JLPT N4 (Lolos)'),
('CAND-2026-003', 'Jepang', 'JLPT N5 (Proses N4)');

-- 10. Insert Program Pelatihan (Modul B)
INSERT INTO `training_programs` (`id`, `name`, `program_type`, `sector_id`, `occupation_id`, `target_country_id`, `total_jp`, `certification_target`, `cost_per_participant`, `quota`, `enrolled_count`, `curriculum`, `status`) VALUES
('PROG-JPN-01', 'Program Percepatan SSW Kaigo Nursing Care Tokyo 2026', 'Teknis Terpadu', 'SECT-CARE', 'OCC-KG-01', 'JP', 320, 'Sertifikasi BNSP + SSW Prometric Kaigo', 14500000.00, 120, 85, 'Modul Bahasa Jepang Medis, Praktikum Bedmaking, Mobilisasi Pasien, Etika Kerja Kaigo Jepang', 'Aktif'),
('PROG-JPN-02', 'Pelatihan Lanjutan Welder Standar Galangan Kapal JIS', 'Upskilling', 'SECT-WELD', 'OCC-WL-01', 'JP', 280, 'Sertifikasi BNSP 4G + JIS Z 3801', 12000000.00, 80, 60, 'Fabrikasi Plat Berat, WPS & PQR, Pengujian Radiografi NDT, K3 Internasional', 'Aktif'),
('PROG-GER-01', 'Ausbildung Preparation: Automotive & Dual Vocational System', 'Teknis Terpadu', 'SECT-AUTO', 'OCC-AT-01', 'DE', 450, 'Goethe Zertifikat B1 + IHK Certified', 22000000.00, 40, 28, 'Bahasa Jerman B1 Teknis, Sistem Kelistrikan ECU, Standar Keselamatan Kerja Jerman (TUV)', 'Aktif');

-- 11. Insert Employer & Demand LN (Modul D)
INSERT INTO `employers` (`id`, `name`, `country_id`, `industry`, `contact_person`, `email`) VALUES
('EMP-JPN-01', 'Zenkoukai Medical & Social Welfare Corp.', 'JP', 'Kesehatan & Panti Lansia', 'Kenji Takahashi', 'kenji.takahashi@zenkoukai.or.jp'),
('EMP-JPN-02', 'Tsuneishi Heavy Shipbuilding Corp.', 'JP', 'Galangan Kapal & Maritim', 'Hiroshi Tanaka', 'recruitment@tsuneishi.co.jp'),
('EMP-GER-01', 'Bavaria Automotive Service GmbH', 'DE', 'Perawatan Otomotif & Mesin', 'Hans Schmidt', 'karriere@bavaria-auto.de');

INSERT INTO `job_demands` (`id`, `employer_id`, `country_id`, `sector_id`, `occupation_id`, `headcount`, `salary_monthly_idr`, `job_description`, `required_skills`, `min_education`, `required_language`, `min_language_level`, `deadline`, `placement_track`, `verification_status`) VALUES
('DEM-JPN-2026-01', 'EMP-JPN-01', 'JP', 'SECT-CARE', 'OCC-KG-01', 150, 24500000.00, 'Tenaga kerja caregiver perawat lansia di fasilitas rumah perawatan modern Tokyo & Kanagawa.', 'Perawatan harian lansia, komunikasi sopan (Keigo), dokumentasi medis', 'SMK', 'Jepang', 'JLPT N4', '2026-12-31', 'P to P', 'Approved'),
('DEM-JPN-2026-02', 'EMP-JPN-02', 'JP', 'SECT-WELD', 'OCC-WL-01', 80, 26000000.00, 'Juru las konstruksi galangan kapal Hiroshima. Menguasai pengelasan pelat lambung kapal 3G/4G.', 'SMAW, GMAW, pembacaan gambar teknik maritim', 'SMK', 'Jepang', 'JLPT N4', '2026-11-30', 'P to P', 'Approved'),
('DEM-GER-2026-01', 'EMP-GER-01', 'DE', 'SECT-AUTO', 'OCC-AT-01', 25, 38000000.00, 'Program magang kerja Duale Ausbildung teknisi otomotif di fasilitas servis Munich & Stuttgart.', 'Diagnostik mesin kendaraan, overhaul, kelistrikan mobil', 'SMK', 'Jerman', 'Goethe B1', '2027-01-31', 'P to P', 'Approved');

-- 12. Insert Matching Allocation Simulation
INSERT INTO `candidate_matches` (`id`, `job_demand_id`, `job_seeker_id`, `match_score`, `match_status`, `match_explanation`) VALUES
(1, 'DEM-JPN-2026-01', 'CAND-2026-002', 96.50, 'Dialokasikan', 'Kesesuaian 96.5%: Lulusan SMK Keperawatan, JLPT N4, Paspor & MCU Lengkap'),
(2, 'DEM-JPN-2026-02', 'CAND-2026-001', 94.00, 'Dialokasikan', 'Kesesuaian 94.0%: Lulusan SMK Pengelasan, BNSP 3G/4G, JLPT N4, Paspor Siap');

-- 13. Insert Approval Request Sample
INSERT INTO `approval_requests` (`id`, `entity_type`, `entity_id`, `title`, `submitted_by`, `submitted_role`, `scope_label`, `validation_status`, `status`, `reviewed_by`, `reviewed_at`) VALUES
('REQ-2026-081', 'calon_peserta', 'CAND-2026-001', 'Pengusulan Verifikasi Data Pencari Kerja (Rizky Pratama)', 'Hendra Setiawan (Disnaker Bogor)', 'disnaker', 'Kab. Bogor, Jawa Barat', 'PASSED', 'APPROVED', 'Siti Aminah (Verifikator Pusat)', '2026-10-23 09:15:00'),
('REQ-2026-082', 'program_pelatihan', 'PROG-JPN-01', 'Pengesahan Kurikulum Pelatihan Kaigo Tokyo Batch 1', 'Dra. Ratna Kusuma (Admin Direktorat)', 'taskforce', 'Standardisasi Kurikulum Nasional', 'PASSED', 'APPROVED', 'Dr. Budi Santoso (Task Force)', '2026-10-23 09:30:00');

-- 14. Insert Audit Log Sample
INSERT INTO `audit_logs` (`id`, `user_id`, `actor_name`, `actor_role`, `scope`, `action_type`, `entity`, `entity_id`, `justification_reason`, `ip_address`, `created_at`) VALUES
('LOG-2026-1001', 6, 'Hendra Setiawan', 'Admin Disnaker Kabupaten/Kota', 'Kabupaten Bogor, Jawa Barat', 'INPUT_DATA', 'Data Calon Peserta', 'CAND-2026-001', 'Pendaftaran data alumni SMK ke dalam bursa supply luar negeri.', '10.24.120.45', '2026-10-23 08:45:10'),
('LOG-2026-1002', 10, 'Siti Aminah, S.Kom, M.T', 'Verifikator', 'Tim Verifikasi Nasional', 'VERIFIKASI', 'Data Calon Peserta', 'CAND-2026-001', 'Verifikasi keabsahan NIK Dukcapil & Ijazah SMK selesai dan valid.', '10.24.120.12', '2026-10-23 09:15:00'),
('LOG-2026-1003', 3, 'Dr. Ir. Budi Santoso, M.Sc', 'Admin Task Force Nasional', 'Nasional Terpadu', 'LOGIN', 'Sesi Autentikasi Pengguna', 'USR-003', 'Autentikasi SSO Terpadu berhasil dengan proteksi MFA.', '10.24.120.88', '2026-10-23 08:30:00');
