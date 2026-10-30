// ==========================================
// MODUL A: SUPPLY INTELLIGENCE
// ==========================================
export type ReadinessStatus = 'Ready for Placement' | 'Needs Upskilling' | 'Needs Reskilling';
export type VerificationStatus = 'Verified' | 'Pending Verification' | 'Unverified';

export interface LanguageProficiency {
  language: 'Jepang' | 'Jerman' | 'Inggris' | 'Mandarin' | 'Korea';
  level: string; // e.g. "JLPT N4", "A2", "TOEIC 600", "Basic"
}

export interface WorkExperienceItem {
  sector: string; // e.g. "Manufaktur & Pengelasan", "Kesehatan & Caregiver"
  role: string; // e.g. "Welder Junior", "Asisten Perawat Lansia"
  durationYears: number; // e.g. 1.5, 2, 0.5 (magang PKL)
  companyName?: string; // e.g. "PT Astra Honda Motor", "RSUD Banyumas"
  description?: string;
}

export interface CompetencyCertificateItem {
  name: string; // e.g. "Sertifikasi Welder 3G Plate", "SSW Tokutei Ginou Kaigo"
  issuer: string; // e.g. "BNSP / LSP Las", "Prometric Japan"
  issueYear?: number;
  validUntil?: string;
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
  institutionId?: string;
  createdBy?: string;
  sourceType?: 'Disnaker Pemda' | 'Lembaga Vokasi' | 'SMK / Pendidikan Vokasi' | 'Gardata / SIPPMI' | string;
  major: string; // e.g. "Teknik Pengelasan", "Kesehatan/Caregiver"
  skills: string[]; // e.g. ["Arc Welding", "GMAW", "Safety Standard"]
  workExperiences?: WorkExperienceItem[];
  certifications?: CompetencyCertificateItem[];
  preferredSectors?: string[]; // e.g. ["Manufaktur & Otomotif", "Kesehatan / Caregiver"]
  languageProficiency: LanguageProficiency[];
  preferredCountry: string[]; // e.g. ["Jepang", "Jerman"]
  preferredJobRole: string[]; // e.g. ["Welder", "Caregiver"]
  readinessStatus: ReadinessStatus;
  verificationStatus: VerificationStatus;
  lifecycleStatus?: DataLifecycleStatus;
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
  institutionId?: string;
  institutionName?: string;
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
export type ProviderType = 
  | 'SMK' 
  | 'BLK' 
  | 'LPK' 
  | 'LKP' 
  | 'Perguruan Tinggi / Politeknik' 
  | 'Universitas' 
  | 'Politeknik' 
  | 'SMA' 
  | 'Balai' 
  | 'BLKLN' 
  | 'Institut' 
  | 'Sekolah Tinggi' 
  | 'Akademi';

export interface SectoralPosition {
  sectoral: string;
  position: string;
}

export interface VocationalOffering {
  sector: string;
  occupation: string;
  legalityStatus?: string | null;
  facilityStatus?: string | null;
  programStatus?: string | null;
}

export interface ProviderProgram {
  name: string;
  capacity: number;
}

export interface VocationalProvider {
  id: string; // e.g. "VOC-JBR-002"
  name: string;
  providerType: ProviderType | string;
  provinsi: string;
  kabupatenKota: string;
  evokasiVerificationStatus: 'Terverifikasi e-Vokasi' | 'Proses Verifikasi' | 'Belum Terverifikasi';
  accreditation: 'A' | 'B' | 'Unggul' | 'Baik Sekali' | string;
  capacityPerBatch: number | null;
  classCount?: number | null;
  readyParticipantCount?: number | null;
  certifiedInstructorsCount: number | null;
  facilities: string[]; // e.g. ["Bengkel Las Standard ISO", "Lab Bahasa Komputer"]
  supportedSectors: string[];
  supportedCountries?: string[];
  operationalReadinessScore: number | null; // 0 - 100
  // Official KP2MI Portal vokasi.kp2mi.go.id fields
  slug?: string;
  logo?: string;
  logoUrl?: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  leaderName?: string;
  leaderPosition?: string;
  institutionStatus?: 'Negeri' | 'Swasta' | string;
  institutionForm?: string;
  sectorals?: SectoralPosition[];
  programs?: ProviderProgram[];
  offerings?: VocationalOffering[];
  source?: 'kp2mi-api' | 'vokasi.kp2mi.go.id' | 'local' | string;
  verificationStatus?: string;
  procurementMethod?: string | null;
  layer?: 'Layer 3/program' | 'Layer 2/fasilitas' | 'Layer 1/legalitas diterima' | 'Belum e-Vokasi' | string;
  institutionCategory?: string;
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
  verificationStatus?: string;
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

export interface PersistedCandidateMatch {
  id: number;
  candidateId: string;
  demandId: string;
  matchScore: number;
  matchStatus: string;
  explanation: string | null;
  programName: string | null;
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
// 3-LAYER SECURITY MODEL: ROLE, PERMISSION & SCOPE
// ==========================================

// 8 Core MVP Roles (as recommended in Blueprint) + Backwards compatibility aliases
export type UserRole =
  | 'superadmin'     // 1. Super Admin / Pusdatin
  | 'pimpinan'       // 2. Menteri / Pimpinan
  | 'taskforce'      // 3. Admin Task Force Nasional
  | 'disnaker'       // 4. Admin Disnaker Kabupaten/Kota / Pemprov
  | 'vokasi'         // 5. Admin Lembaga Vokasi (SMK / BLK / LPK)
  | 'demand'         // 6. Admin Demand / Pemberi Kerja
  | 'verifikator'    // 7. Verifikator Data & Keabsahan
  | 'matching'       // 8. Petugas Matching & Penempatan
  | 'admin'          // alias for superadmin/taskforce
  | 'employer'       // alias for demand
  | 'kandidat';      // alias for alumni

export type ViewMode = 'landing' | 'login' | 'app';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  badge?: string;
  organization: string;
  scope: UserScope;
  bp3miCode?: string | null;
  roleName?: string;
  bp3miAssignments?: { code: string; name: string; provinces: string[] }[];
  nip?: string;
  mfaEnabled: boolean;
  mfaVerified: boolean;
  loginTimestamp: string;
  ipAddress: string;
  avatarInitials?: string;
  authorizedScopes?: string[];
  sessionExpiresAt?: string;
}

export type AccessLevel = 'full' | 'limited' | 'none'; // ● Akses Utama, ◐ Akses Terbatas, — Tidak Ada Akses

export type MenuModuleId =
  | 'overview'       // Dashboard nasional
  | 'modul-a'        // Data calon peserta
  | 'modul-b'        // Program pelatihan
  | 'modul-c'        // Data lembaga vokasi
  | 'modul-d'        // Demand luar negeri
  | 'matching'       // Matching peserta
  | 'approvals'      // Alur persetujuan & verifikasi data
  | 'audit'          // Audit log & jejak perubahan
  | 'rbac'           // Matriks hak akses & manajemen akun
  | 'accounts';      // Manajemen akun

export interface MenuPermission {
  moduleId: MenuModuleId;
  moduleName: string;
  accessLevel: AccessLevel; // ●, ◐, —
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canVerify: boolean;
  canApprove: boolean;
  canDelete: boolean;
  canExport: boolean;
  scopeRule: string; // Penjelasan batasan scope
}

export type ScopeLevel = 'national' | 'provinsi' | 'kabupaten' | 'lembaga' | 'demand';

export interface UserScope {
  level: ScopeLevel;
  name: string; // e.g. "Nasional (Seluruh Indonesia)", "Kabupaten Bogor", "SMKN 1 Cibinong"
  provinsi?: string;
  kabupatenKota?: string;
  institutionId?: string;
  institutionName?: string;
  employerId?: string;
  employerName?: string;
}

export interface RoleInfo {
  id: UserRole;
  number: number; // 1 to 13 or 1 to 8
  title: string;
  badge: string;
  organization: string;
  description: string;
  defaultScope: UserScope;
  accessibleModules: string[];
  defaultTab: string;
  permissions: Record<MenuModuleId, MenuPermission>;
  crudMatrix: CrudMatrixByRole;
  permissionTokens: PermissionToken[];
}

// ==========================================
// CRUD MATRIX & DATA LIFECYCLE (BLUEPRINT BAGIAN 1 - 4)
// ==========================================

export type DataLifecycleStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'RETURNED';

export type PermissionToken =
  // Peserta
  | 'participant.create'
  | 'participant.read'
  | 'participant.update'
  | 'participant.delete'
  | 'participant.verify'
  // Pelatihan
  | 'training.create'
  | 'training.read'
  | 'training.update'
  | 'training.delete'
  | 'training.approve'
  // Lembaga Vokasi
  | 'provider.create'
  | 'provider.read'
  | 'provider.update'
  | 'provider.delete'
  | 'provider.verify'
  // Demand LN
  | 'demand.create'
  | 'demand.read'
  | 'demand.update'
  | 'demand.delete'
  | 'demand.verify'
  // Matching & Penempatan
  | 'matching.read'
  | 'matching.assign'
  | 'matching.update'
  | 'matching.cancel'
  | 'placement.read'
  | 'placement.update'
  | 'placement.verify'
  // Manajemen & Audit
  | 'user.manage'
  | 'role.manage'
  | 'audit.read'
  | 'report.export';

export interface CrudCapability {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canVerify: boolean;
  isScoped: boolean; // (*) Pembatasan wilayah, lembaga, atau program
  displayCode: string; // e.g. "C/R/U", "R/V", "R/U*", "R"
  operationalRule: string;
}

export interface CrudMatrixByRole {
  peserta: CrudCapability;
  pelatihan: CrudCapability;
  lembaga: CrudCapability;
  demand: CrudCapability;
  matching: CrudCapability;
}

export interface OperationalCrudRule {
  moduleId: string;
  moduleName: string;
  createRole: string;
  updateRole: string;
  deleteRole: string;
  lifecycleNote: string;
}

// 13 Full Stakeholder Roles blueprint mapping
export interface StakeholderRole13 {
  no: number;
  id: string;
  name: string;
  coreGroup: UserRole;
  primaryAccess: string;
  scopeType: ScopeLevel;
  crud: {
    peserta: string;
    pelatihan: string;
    lembaga: string;
    demand: string;
    matching: string;
  };
}

// ==========================================
// ALUR PERSETUJUAN DATA (APPROVAL WORKFLOW)
// ==========================================
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
export type ApprovalEntityType = 'calon_peserta' | 'lembaga_vokasi' | 'program_pelatihan' | 'demand_luar_negeri';

export interface AutomatedValidationCheck {
  ruleName: string;
  passed: boolean;
  message: string;
}

export interface DataApprovalRequest {
  id: string; // e.g. "REQ-2026-081"
  entityType: ApprovalEntityType;
  entityId: string;
  title: string;
  entityTitle?: string;
  submittedBy: string; // e.g. "Budi Santoso (Admin Disnaker Kab. Bogor)"
  submittedRole: string;
  scopeLabel: string; // e.g. "Kab. Bogor, Jawa Barat"
  submittedAt: string;
  validationStatus: 'PASSED' | 'FLAGGED';
  validationChecks: AutomatedValidationCheck[];
  approvalStatus: ApprovalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  revisionNotes?: string;
  dataSnapshot: Record<string, any>;
  details?: { label: string; value: string | number | null }[];
  documents?: { id: number; type: string; name: string; downloadUrl: string }[];
  externalLinks?: { label: string; url: string }[];
}

export interface MonitoringClassParticipant {
  id: string;
  fullName: string;
  nik: string;
  gender?: string;
  major?: string;
  readinessStatus?: string;
  achievedJp?: number | null;
  targetJp?: number;
  status?: string;
}

export interface MonitoringClassData {
  id: string;
  source: string;
  classCode: string;
  externalSource?: string;
  externalBatchId?: string;
  gardataBatchId?: string | null;
  name: string;
  sector: string;
  startDate: string | null;
  endDate: string | null;
  targetJp: number;
  achievedJp: number | null;
  participantCount: number;
  participants?: MonitoringClassParticipant[];
  verifiedReportsCount: number;
  averageAttendance: number | null;
  averageAssessmentScore: number | null;
  status: string;
}

export interface MonitoringCandidateData {
  id: string;
  fullName: string;
  institutionName?: string | null;
  subdomain?: string | null;
  nik: string;
  region: string;
  expertise: string | null;
  targetCountry: string;
  status: string;
  readinessStatus: string;
}

export interface MonitoringTenantLpk {
  id: string;
  name: string;
  subdomain: string;
  url: string;
  status: 'Aktif' | 'Nonaktif' | string;
  province?: string;
  district?: string;
  candidateCount: number;
  classCount: number;
}

export interface MonitoringData {
  summary: {
    totalClasses: number;
    activeClasses: number;
    gardataCandidates: number;
    verifiedReports: number;
    averageAttendance: number | null;
    averageAssessmentScore: number | null;
    gardataTargetJp: number;
    gardataAchievedJp: number;
  };
  classes: MonitoringClassData[];
  gardataBatches: {
    externalBatchId: string;
    name: string;
    participantCount: number;
  participants?: MonitoringClassParticipant[];
    status: string;
  }[];
  candidates: MonitoringCandidateData[];
  candidatePagination: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
  classPagination: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
  candidateSource: string;
  tenants?: MonitoringTenantLpk[];
  placements: {
    id: string;
    candidateMatchId: number;
    candidateName: string;
    occupation: string;
    country: string;
    employer: string;
    status: string;
    flightDate: string | null;
    siskop2miId: string | null;
  }[];
  placementCandidates: {
    candidateMatchId: number;
    candidateName: string;
    occupation: string;
    country: string;
    employer: string;
  }[];
  lastSync: {
    status: string;
    startedAt: string | null;
    finishedAt: string | null;
    recordsFetched: number | null;
    recordsInserted: number | null;
    recordsUpdated: number | null;
    recordsSkipped: number | null;
  } | null;
}

// ==========================================
// AUDIT LOG & JEJAK PERUBAHAN
// ==========================================
export type AuditActionType =
  | 'INPUT_DATA'
  | 'AUTO_VALIDATION'
  | 'VERIFIKASI'
  | 'PERSETUJUAN'
  | 'PENOLAKAN'
  | 'REVISI'
  | 'UPDATE_DATA'
  | 'HAPUS_DATA'
  | 'ALOKASI_MATCHING'
  | 'AKUN_HAK_AKSES'
  | 'LOGIN'
  | 'LOGOUT';

export interface AuditLogEntry {
  id: string; // e.g. "LOG-2026-1049"
  timestamp: string;
  actorName: string;
  actorRole: string;
  scope: string;
  actionType: AuditActionType;
  entity: string;
  entityId: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  justificationReason: string;
  ipAddress: string;
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

// ==========================================
// PUBLIC COMMAND CENTER (PORTAL PUBLIK)
// ==========================================
export interface PublicProvinceItem {
  id: string;
  name: string;
}

export interface PublicCommandCenterStats {
  scopeName: string;
  candidatesCount: number;
  programsCount: number;
  providersCount: number;
  registeredProvidersCount: number;
  nationalLpkCount: number;
  registeredNationalLpkCount: number;
  demandsCount: number;
  allocationsCount: number;
}

export interface PublicProvinceStats {
  province: string;
  candidatesCount: number;
  programsCount: number;
  providersCount: number;
  registeredProvidersCount: number;
  lpkCount: number;
  registeredLpkCount: number;
}

export interface PublicProvinceBreakdown {
  province: string;
  totalCount: number;
  registeredCount: number;
}

export interface PublicPreviewStudent {
  id: string;
  name: string;
  targetCountry: string;
  sector: string;
  occupation: string;
  status?: string;
  major?: string;
}

export interface PublicPreviewInstitution {
  id: string;
  name: string;
  type: string;
  province?: string;
  district?: string;
  accreditation?: string;
  evokasiStatus?: string;
  supportedSectors?: string[];
  supportedOccupations?: string[];
  totalActiveStudents?: number;
  workshopCapacity?: number;
  students?: PublicPreviewStudent[];
  studentCount?: number;
}

export interface PublicPreviewProgram {
  id: string;
  name: string;
  programType?: string;
  sector?: string;
  totalHours?: number;
  quota?: number;
  certificationTarget?: string;
}

export interface PublicPreviewDemand {
  id: string;
  country?: string;
  employerName?: string;
  sector?: string;
  occupation?: string;
  quota?: number;
  deadline?: string;
}

export interface TrainingSectorCatalogItem {
  id: string;
  name: string;
  aliases: string[];
  occupations: {
    id: string;
    title: string;
    aliases: string[];
  }[];
}

export interface PublicCommandCenterData {
  selectedProvince: string;
  provinces: PublicProvinceItem[];
  national: PublicCommandCenterStats;
  activeStats: PublicCommandCenterStats;
  byProvince: PublicProvinceStats[];
  institutionsByProvince: PublicProvinceBreakdown[];
  nationalLpkByProvince: PublicProvinceBreakdown[];
  previewDirectories?: {
    institutions: PublicPreviewInstitution[];
    programs: PublicPreviewProgram[];
    demands: PublicPreviewDemand[];
    candidateEducation?: { label: string; count: number }[];
  };
}
