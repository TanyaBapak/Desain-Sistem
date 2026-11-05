-- =============================================================================
-- SQL SCRIPT: PEMBERSIHAN DATA SINTETIS INDONUSA & STANDARISASI JABATAN WAITER
-- File: cleanup_indonusa_synthetic_and_standardize_waiter.sql
-- Tanggal: 05 November 2026
-- 
-- Cakupan:
-- 1. Standarisasi variasi penulisan Waiter (Waiters, WAITER, WAITERS, waitress)
--    pada tabel `job_seekers` (preferred_job_roles) dan `job_seeker_skills`.
-- 2. Menghapus data calon peserta sintetis Politeknik Indonusa Surakarta
--    (external_id berawalan 'INDO-CPMI-%' atau external_source 'sippmi' dengan ID 'INDO-%')
--    beserta seluruh relasinya (external_training_records, skills, languages, approvals).
-- =============================================================================

START TRANSACTION;

-- -----------------------------------------------------------------------------
-- 1. STANDARISASI JABATAN WAITER (JOB_SEEKERS & JOB_SEEKER_SKILLS)
-- -----------------------------------------------------------------------------
UPDATE `job_seekers` 
SET `preferred_job_roles` = REPLACE(`preferred_job_roles`, '\"WAITER\"', '\"Waiter\"') 
WHERE `preferred_job_roles` LIKE '%\"WAITER\"%';

UPDATE `job_seekers` 
SET `preferred_job_roles` = REPLACE(`preferred_job_roles`, '\"Waiters\"', '\"Waiter\"') 
WHERE `preferred_job_roles` LIKE '%\"Waiters\"%';

UPDATE `job_seekers` 
SET `preferred_job_roles` = REPLACE(`preferred_job_roles`, '\"WAITERS\"', '\"Waiter\"') 
WHERE `preferred_job_roles` LIKE '%\"WAITERS\"%';

UPDATE `job_seekers` 
SET `preferred_job_roles` = REPLACE(`preferred_job_roles`, '\"waiter\"', '\"Waiter\"') 
WHERE `preferred_job_roles` LIKE '%\"waiter\"%';

UPDATE `job_seekers` 
SET `preferred_job_roles` = REPLACE(`preferred_job_roles`, '\"waiters\"', '\"Waiter\"') 
WHERE `preferred_job_roles` LIKE '%\"waiters\"%';

UPDATE `job_seekers` 
SET `preferred_job_roles` = REPLACE(`preferred_job_roles`, '\"Waitress\"', '\"Waiter\"') 
WHERE `preferred_job_roles` LIKE '%\"Waitress\"%';

UPDATE `job_seekers` 
SET `preferred_job_roles` = REPLACE(`preferred_job_roles`, '\"WAITRESS\"', '\"Waiter\"') 
WHERE `preferred_job_roles` LIKE '%\"WAITRESS\"%';

UPDATE `job_seekers` 
SET `preferred_job_roles` = REPLACE(`preferred_job_roles`, '\"waitress\"', '\"Waiter\"') 
WHERE `preferred_job_roles` LIKE '%\"waitress\"%';

UPDATE `job_seeker_skills` 
SET `skill_name` = 'Waiter' 
WHERE `skill_name` IN ('WAITER', 'Waiters', 'WAITERS', 'waiter', 'waiters', 'Waitress', 'WAITRESS', 'waitress');

-- -----------------------------------------------------------------------------
-- 2. IDENTIFIKASI ID PESERTA SINTETIS INDONUSA
-- -----------------------------------------------------------------------------
CREATE TEMPORARY TABLE IF NOT EXISTS `tmp_synthetic_candidates` (
    `id` VARCHAR(50) NOT NULL PRIMARY KEY
);
TRUNCATE TABLE `tmp_synthetic_candidates`;

INSERT INTO `tmp_synthetic_candidates` (`id`)
SELECT `id` FROM `job_seekers`
WHERE `external_id` LIKE 'INDO-CPMI-%'
   OR (`external_source` = 'sippmi' AND `external_id` LIKE 'INDO-%');

-- -----------------------------------------------------------------------------
-- 3. HAPUS DATA RELASI CALON PESERTA SINTETIS
-- -----------------------------------------------------------------------------
-- Hapus approval histories & approval requests
DELETE h FROM `approval_histories` h
INNER JOIN `approval_requests` r ON h.`approval_request_id` = r.`id`
WHERE r.`entity_type` = 'calon_peserta' 
  AND r.`entity_id` IN (SELECT `id` FROM `tmp_synthetic_candidates`);

DELETE FROM `approval_requests`
WHERE `entity_type` = 'calon_peserta' 
  AND `entity_id` IN (SELECT `id` FROM `tmp_synthetic_candidates`);

-- Hapus riwayat pelatihan eksternal
DELETE FROM `external_training_records` 
WHERE `job_seeker_id` IN (SELECT `id` FROM `tmp_synthetic_candidates`);

-- Hapus keahlian
DELETE FROM `job_seeker_skills` 
WHERE `job_seeker_id` IN (SELECT `id` FROM `tmp_synthetic_candidates`);

-- Hapus bahasa
DELETE FROM `job_seeker_languages` 
WHERE `job_seeker_id` IN (SELECT `id` FROM `tmp_synthetic_candidates`);

-- -----------------------------------------------------------------------------
-- 4. HAPUS CALON PESERTA SINTETIS DARI JOB_SEEKERS
-- -----------------------------------------------------------------------------
DELETE FROM `job_seekers` 
WHERE `id` IN (SELECT `id` FROM `tmp_synthetic_candidates`);

DROP TEMPORARY TABLE IF EXISTS `tmp_synthetic_candidates`;

COMMIT;

-- -----------------------------------------------------------------------------
-- Kueri Verifikasi Hasil Eksekusi:
-- SELECT COUNT(*) AS sisa_sintetis FROM `job_seekers` WHERE `external_id` LIKE 'INDO-CPMI-%';
-- SELECT `preferred_job_roles`, COUNT(*) FROM `job_seekers` WHERE LOWER(`preferred_job_roles`) LIKE '%wait%' GROUP BY `preferred_job_roles`;
-- -----------------------------------------------------------------------------
