// ==========================================
// MODUL A: SUPPLY INTELLIGENCE
// ==========================================
export type ReadinessStatus = 'Ready for Placement' | 'Needs Upskilling' | 'Needs Reskilling';
export type VerificationStatus = 'Verified' | 'Pending Verification' | 'Unverified';

export interface LanguageProficiency {
  language: 'Jepang' | 'Jerman' | 'Inggris' | 'Mandarin' | 'Korea';
  level: string; // e.g. "JLPT N4", "A2", "TOEIC 600", "Basic"
}

export interface CandidateParticipant {
  id: string; // e.g. "CAND-2026-001"
  nik: string; // Masked e.g. "3201************"
  fullName: string;
  gender: 'L' | 'P';
  provinsi: string;
  kabupatenKota: string;
  educationLevel: 'SMK' | 'D3' | 'S1' | 'Lainnya';
  institutionName: string; // e.g. "SMKN 1 Gandapura"
  major: string; // e.g. "Teknik Pengelasan", "Kesehatan/Caregiver"
  skills: string[]; // e.g. ["Arc Welding", "GMAW", "Safety Standard"]
  languageProficiency: LanguageProficiency[];
  preferredCountry: string[]; // e.g. ["Jepang", "Jerman"]
  preferredJobRole: string[]; // e.g. ["Welder", "Caregiver"]
  readinessStatus: ReadinessStatus;
  verificationStatus: VerificationStatus;
}

// ==========================================
// MODUL B: TRAINING PROGRAM INTELLIGENCE
// ==========================================
export type ProgramType = 'Upskilling' | 'Reskilling' | 'Pelatihan Bahasa' | 'Teknis Terpadu';

export interface TrainingProgram {
  id: string; // e.g. "PROG-JPN-01"
  title: string;
  programType: ProgramType;
  targetSector: string; // e.g. "Kesehatan", "Industri Manufaktur"
  targetJobRole: string; // e.g. "Caregiver / Kaigo", "Welder"
  targetCountry: string;
  durationJP: number; // Jam Pelajaran, e.g. 320
  certificationTarget: string; // e.g. "Sertifikasi BNSP + SSW Tokutei Ginou"
  estimatedCostPerParticipant: number; // IDR
  quota: number;
  enrolledCount: number;
  scheduleStart: string; // ISO Date String
  scheduleEnd: string;
  curriculumOutline: string[];
}

// ==========================================
// MODUL C: VOCATIONAL PROVIDER READINESS
// ==========================================
export type ProviderType = 'SMK' | 'BLK' | 'LPK' | 'LKP' | 'Perguruan Tinggi / Politeknik';

export interface VocationalProvider {
  id: string; // e.g. "VOC-JBR-002"
  name: string;
  providerType: ProviderType;
  provinsi: string;
  kabupatenKota: string;
  evokasiVerificationStatus: 'Terverifikasi e-Vokasi' | 'Proses Verifikasi' | 'Belum Terverifikasi';
  accreditation: 'A' | 'B' | 'Unggul' | 'Baik Sekali';
  capacityPerBatch: number;
  certifiedInstructorsCount: number;
  facilities: string[]; // e.g. ["Bengkel Las Standard ISO", "Lab Bahasa Komputer"]
  supportedSectors: string[];
  operationalReadinessScore: number; // 0 - 100
}

// ==========================================
// MODUL D: GLOBAL DEMAND INTELLIGENCE
// ==========================================
export interface GlobalDemand {
  id: string; // e.g. "DEM-JPN-2026-08"
  jobTitle: string;
  employerName: string;
  country: string;
  sector: string;
  requiredQuota: number;
  filledQuota: number;
  minEducation: string;
  requiredSkills: string[];
  requiredLanguageLevel: string; // e.g. "JLPT N4 or N3"
  requiredCertifications: string[];
  deadlineDate: string;
  workTermMonths: number;
  salaryRangeString: string; // e.g. "JPY 180,000 - 220,000 / bulan"
}

// ==========================================
// MATCHING & ALLOCATION MODELS (TAHAP 3 & 4)
// ==========================================
export interface MatchingResult {
  candidateId: string;
  demandId: string;
  matchScore: number; // Percentage 0 - 100%
  skillsMatchPercentage: number;
  languageMatch: boolean;
  skillGaps: string[];
  languageGapDescription: string;
  recommendedProgramId?: string;
}

export interface ProgramAllocationDecision {
  allocationId: string;
  demandId: string;
  selectedProgramId: string;
  selectedProviderId: string;
  allocatedCandidateIds: string[];
  totalBudgetRequired: number;
  batchScheduleStart: string;
  batchScheduleEnd: string;
  approvalStatus: 'Draft' | 'Approved' | 'Finalized';
}

// ==========================================
// ROLE & PORTAL GOVERNMENT TYPES (KEMENDAGRI STYLE)
// ==========================================
export type UserRole = 'admin' | 'vokasi' | 'kandidat' | 'disnaker' | 'employer';
export type ViewMode = 'landing' | 'app';

export interface RoleInfo {
  id: UserRole;
  title: string;
  badge: string;
  organization: string;
  description: string;
  accessibleModules: string[];
  defaultTab: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  category: 'Siaran Pers' | 'Pengumuman' | 'Regulasi' | 'Kerja Sama Bilateral';
  date: string;
  excerpt: string;
  readTime: string;
  author: string;
}

// ==========================================
// SGG COMMAND CENTER (SGG-CC) ADVANCED TYPES
// ==========================================
export type ExecutiveTier = 'menteri' | 'dirjen' | 'bp3mi';
export type BusinessStage = 1 | 2 | 3 | 4 | 5 | 6;

export interface StageDetail {
  id: BusinessStage;
  title: string;
  subtitle: string;
  pic: string;
  deadline: string;
  status: 'Selesai' | 'Sedang Berjalan' | 'Perlu Tindak Lanjut' | 'Menunggu';
  progressPercent: number;
  bottleneckNotes: string;
  keyActions: string[];
}

export interface AggregateMatchingItem {
  id: string;
  country: string;
  sector: string;
  jobTitle: string;
  demandQuota: number;
  verifiedSupply: number;
  providerCapacity: number;
  gapSeat: number; // Kesenjangan kursi pelatihan
  actionPlan: string;
  responsiblePic: string;
}

export interface DrillDownFilter {
  provinsi: string;
  kabupatenKota: string;
  sektor: string;
}
