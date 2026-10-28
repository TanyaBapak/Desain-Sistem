import { create } from 'zustand';
import { router } from '@inertiajs/react';
import {
  CandidateParticipant,
  TrainingProgram,
  VocationalProvider,
  GlobalDemand,
  ProgramAllocationDecision,
  VerificationStatus,
  UserRole,
  ViewMode,
  ExecutiveTier,
  BusinessStage,
  StageDetail,
  AggregateMatchingItem,
  DrillDownFilter,
  UserScope,
  DataApprovalRequest,
  AuditLogEntry,
  MenuModuleId,
  AuthUser,
} from '../types';
import {
  mockStageDetails,
  mockAggregateMatching,
  mockRoles,
  mockApprovals,
  mockAuditLogs,
  getRoleById,
} from '../data';
import { visitAppTab, visitPath } from '../lib/navigation';

export interface AppState {
  // Navigation & Role Modes (Kemendagri Portal Concept)
  viewMode: ViewMode; // 'landing' | 'login' | 'app'
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
  sessionTimeRemaining: number;
  currentRole: UserRole; // 'superadmin' | 'pimpinan' | 'taskforce' | 'disnaker' | 'vokasi' | 'demand' | 'verifikator' | 'matching'
  currentScope: UserScope; // 3-Layer: Scope (Nasional, Provinsi, Kab/Kota, Lembaga, Demand)
  currentTab: string; // 'overview' | 'modul-a' | 'modul-b' | 'modul-c' | 'modul-d' | 'matching' | 'approvals' | 'audit' | 'rbac'
  isRbacModalOpen: boolean;

  // SGG Command Center (SGG-CC) Specific State
  executiveTier: ExecutiveTier; // 'menteri' | 'dirjen' | 'bp3mi'
  activeBusinessStage: BusinessStage; // 1 | 2 | 3 | 4 | 5 | 6
  stageDetails: StageDetail[];
  aggregateMatching: AggregateMatchingItem[];
  drillDownFilter: DrillDownFilter;

  // Core Data Collections
  candidates: CandidateParticipant[];
  programs: TrainingProgram[];
  providers: VocationalProvider[];
  demands: GlobalDemand[];
  businessDataLoaded: boolean;
  setBusinessData: (data: {
    candidates: CandidateParticipant[];
    programs: TrainingProgram[];
    providers: VocationalProvider[];
    demands: GlobalDemand[];
    approvalRequests?: DataApprovalRequest[];
    allocations?: ProgramAllocationDecision[];
    auditLogs?: AuditLogEntry[];
    options: {
      provinces: { id: string; name: string }[];
      districts: { id: string; province_id: string; name: string }[];
      sectors: { id: string; name: string }[];
      occupations: { id: string; sector_id: string; title: string }[];
      countries: { id: string; name: string }[];
      institutions: { id: string; name: string }[];
    };
  }) => void;
  businessOptions: {
    provinces: { id: string; name: string }[];
    districts: { id: string; province_id: string; name: string }[];
    sectors: { id: string; name: string }[];
    occupations: { id: string; sector_id: string; title: string }[];
    countries: { id: string; name: string }[];
    institutions: { id: string; name: string }[];
  };
  allocations: ProgramAllocationDecision[];

  // Approvals & Audit Trail
  approvalRequests: DataApprovalRequest[];
  auditLogs: AuditLogEntry[];
  setAuditLogs: (logs: AuditLogEntry[]) => void;

  // Workflow Stages & Selection State
  activeStage: number; // 1, 2, 3, 4, 5, 6
  selectedDemandId: string | null;
  selectedCandidateIds: string[];
  selectedProgramId: string | null;
  selectedProviderId: string | null;

  // Modul A Filters
  searchCandidate: string;
  filterProvinsi: string;
  filterDistrict: string;
  filterEducation: string;
  filterSector: string;
  filterWorkExperience: string;
  filterCertification: string;
  filterCountry: string;
  filterReadiness: string;
  filterVerification: string;
  filterLanguage: string;

  // Modul B Filters
  searchProgram: string;
  filterProgramType: string;
  filterProgramCountry: string;

  // Modul C Filters
  searchProvider: string;
  filterProviderType: string;
  filterEvokasiStatus: string;
  filterProviderProvince: string;
  filterProviderSector: string;
  filterInstitutionStatus: string;
  setProviders: (providers: VocationalProvider[]) => void;

  // Modul D Filters
  searchDemand: string;
  filterDemandCountry: string;
  filterDemandSector: string;

  // Navigation & Role Actions
  setViewMode: (mode: ViewMode) => void;
  setCurrentTab: (tab: string) => void;
  openLoginPage: () => void;
  setAuthenticatedUser: (user: AuthUser, role: UserRole, scope: UserScope) => void;
  logout: () => void;
  setSessionTimeRemaining: (time: number) => void;

  // SGG Command Center Actions
  setExecutiveTier: (tier: ExecutiveTier) => void;
  setActiveBusinessStage: (stage: BusinessStage) => void;
  setDrillDownFilter: (filter: Partial<DrillDownFilter>) => void;

  // RBAC & Scope Actions
  setIsRbacModalOpen: (open: boolean) => void;

  // Approval Workflow Actions
  approveRequest: (requestId: string, reviewerNotes?: string) => void;
  rejectRequest: (requestId: string, rejectionReason: string) => void;
  requestRevision: (requestId: string, revisionNotes: string) => void;

  // Audit Log Actions
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;

  // Actions
  setActiveStage: (stage: number) => void;
  resetToDefaultData: () => void;

  // Filter setters
  setSearchCandidate: (val: string) => void;
  setFilterProvinsi: (val: string) => void;
  setFilterDistrict: (val: string) => void;
  setFilterEducation: (val: string) => void;
  setFilterSector: (val: string) => void;
  setFilterWorkExperience: (val: string) => void;
  setFilterCertification: (val: string) => void;
  setFilterCountry: (val: string) => void;
  setFilterReadiness: (val: string) => void;
  setFilterVerification: (val: string) => void;
  setFilterLanguage: (val: string) => void;

  setSearchProgram: (val: string) => void;
  setFilterProgramType: (val: string) => void;
  setFilterProgramCountry: (val: string) => void;

  setSearchProvider: (val: string) => void;
  setFilterProviderType: (val: string) => void;
  setFilterEvokasiStatus: (val: string) => void;
  setFilterProviderProvince: (val: string) => void;
  setFilterProviderSector: (val: string) => void;
  setFilterInstitutionStatus: (val: string) => void;

  setSearchDemand: (val: string) => void;
  setFilterDemandCountry: (val: string) => void;
  setFilterDemandSector: (val: string) => void;

  // Item & Workflow Selection
  setSelectedDemandId: (id: string | null) => void;
  setSelectedProgramId: (id: string | null) => void;
  setSelectedProviderId: (id: string | null) => void;
  toggleCandidateSelection: (id: string) => void;
  selectAllCandidates: (ids: string[]) => void;
  clearCandidateSelection: () => void;

  // Validation Simulation (Tahap 2)
  updateCandidateVerification: (id: string, status: VerificationStatus) => void;
  batchVerifyCandidates: (ids: string[]) => void;

  // CRUD Actions - Modul A: Calon Peserta
  createCandidate: (candidate: Omit<CandidateParticipant, 'id'>) => CandidateParticipant;
  updateCandidate: (id: string, updates: Partial<CandidateParticipant>) => void;
  deleteCandidate: (id: string, reason?: string) => { success: boolean; message: string };

  // CRUD Actions - Modul B: Program Pelatihan
  createProgram: (program: Omit<TrainingProgram, 'id'>) => TrainingProgram;
  updateProgram: (id: string, updates: Partial<TrainingProgram>) => void;
  deleteProgram: (id: string) => { success: boolean; message: string };

  // CRUD Actions - Modul C: Lembaga Vokasi
  createProvider: (provider: Omit<VocationalProvider, 'id'>) => VocationalProvider;
  updateProvider: (id: string, updates: Partial<VocationalProvider>) => void;
  deleteProvider: (id: string) => { success: boolean; message: string };

  // CRUD Actions - Modul D: Demand Luar Negeri
  createDemand: (demand: Omit<GlobalDemand, 'id'>) => GlobalDemand;
  updateDemand: (id: string, updates: Partial<GlobalDemand>) => void;
  deleteDemand: (id: string) => { success: boolean; message: string };
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation & Role Defaults
  viewMode: 'landing', // Opens landing page first by default
  isAuthenticated: false,
  currentUser: null,
  sessionTimeRemaining: 1800,
  currentRole: 'taskforce', // Default Task Force Nasional
  currentScope: mockRoles.find((r) => r.id === 'taskforce')?.defaultScope || {
    level: 'national',
    name: 'Nasional Terpadu (Lintas Kementerian & Lembaga)',
  },
  currentTab: 'overview',
  isRbacModalOpen: false,

  // SGG Command Center State
  executiveTier: 'menteri',
  activeBusinessStage: 3,
  stageDetails: mockStageDetails,
  aggregateMatching: mockAggregateMatching,
  drillDownFilter: {
    provinsi: 'Jawa Barat',
    kabupatenKota: 'Kabupaten Bogor',
    sektor: 'Kesehatan / Caregiver',
  },

  candidates: [],
  programs: [],
  providers: [],
  demands: [],
  businessDataLoaded: false,
  businessOptions: { provinces: [], districts: [], sectors: [], occupations: [], countries: [], institutions: [] },
  setBusinessData: (data) => set((state) => {
    const incomingCandidates = Array.isArray(data.candidates) ? data.candidates : [];
    const candidates = incomingCandidates;
    const incomingPrograms = Array.isArray(data.programs) ? data.programs : [];
    const programs = incomingPrograms;
    const incomingProviders = Array.isArray(data.providers) ? data.providers : [];
    const providers = incomingProviders;
    const incomingDemands = Array.isArray(data.demands) ? data.demands : [];
    const demands = incomingDemands;
    return {
      candidates,
      programs,
      providers,
      demands,
      approvalRequests: data.approvalRequests ?? [],
      allocations: data.allocations ?? [],
      auditLogs: Array.isArray(data.auditLogs) && data.auditLogs.length > 0 ? data.auditLogs : state.auditLogs,
      businessOptions: data.options,
      businessDataLoaded: true,
      selectedCandidateIds: state.selectedCandidateIds.filter((id) => candidates.some((candidate) => candidate.id === id)),
      selectedDemandId: demands.some((demand) => demand.id === state.selectedDemandId) ? state.selectedDemandId : null,
      selectedProgramId: programs.some((program) => program.id === state.selectedProgramId) ? state.selectedProgramId : null,
      selectedProviderId: providers.some((provider) => provider.id === state.selectedProviderId) ? state.selectedProviderId : null,
    };
  }),
  allocations: [],
  approvalRequests: mockApprovals,
  auditLogs: mockAuditLogs,
  setAuditLogs: (logs) => set({ auditLogs: logs }),

  activeStage: 1,
  selectedDemandId: null,
  selectedCandidateIds: [],
  selectedProgramId: null,
  selectedProviderId: null,

  // Modul A Filters
  searchCandidate: '',
  filterProvinsi: 'ALL',
  filterDistrict: 'ALL',
  filterEducation: 'ALL',
  filterSector: 'ALL',
  filterWorkExperience: 'ALL',
  filterCertification: 'ALL',
  filterCountry: 'ALL',
  filterReadiness: 'ALL',
  filterVerification: 'ALL',
  filterLanguage: 'ALL',

  // Modul B Filters
  searchProgram: '',
  filterProgramType: 'ALL',
  filterProgramCountry: 'ALL',

  // Modul C Filters
  searchProvider: '',
  filterProviderType: 'ALL',
  filterEvokasiStatus: 'ALL',
  filterProviderProvince: 'ALL',
  filterProviderSector: 'ALL',
  filterInstitutionStatus: 'ALL',

  // Modul D Filters
  searchDemand: '',
  filterDemandCountry: 'ALL',
  filterDemandSector: 'ALL',

  // Navigation & Role Actions
  setViewMode: (mode) => set({ viewMode: mode }),
  openLoginPage: () => visitPath('/login'),
  setSessionTimeRemaining: (time) => set({ sessionTimeRemaining: time }),
  setAuthenticatedUser: (user, role, scope) =>
    set({
      isAuthenticated: true,
      currentUser: user,
      currentRole: role,
      currentScope: scope,
      viewMode: 'app',
    }),
  logout: () => router.post('/logout'),

  setCurrentTab: (tab) => {
    set({ currentTab: tab });
    visitAppTab(tab);
  },
  setIsRbacModalOpen: (open) => set({ isRbacModalOpen: open }),

  // SGG Command Center Action Handlers
  setExecutiveTier: (tier) => set({ executiveTier: tier }),
  setActiveBusinessStage: (stage) => set({ activeBusinessStage: stage }),
  setDrillDownFilter: (filter) =>
    set({ drillDownFilter: { ...get().drillDownFilter, ...filter } }),

  // Approval Workflow Actions
  approveRequest: (requestId, reviewerNotes) => {
    const req = get().approvalRequests.find((r) => r.id === requestId);
    if (!req) return;

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

    const updatedRequests = get().approvalRequests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            approvalStatus: 'APPROVED' as const,
            reviewedBy: `${getRoleById(get().currentRole).title} (Petugas Berwenang)`,
            reviewedAt: timeStr,
            revisionNotes: reviewerNotes || 'Disetujui dan memenuhi seluruh persyaratan substantif.',
          }
        : r
    );

    let updatedCandidates = get().candidates;
    let updatedProviders = get().providers;

    if (req.entityType === 'calon_peserta') {
      updatedCandidates = updatedCandidates.map((c) => ({
        ...c,
        verificationStatus: 'Verified' as const,
      }));
    } else if (req.entityType === 'lembaga_vokasi') {
      updatedProviders = updatedProviders.map((p) =>
        p.id === req.entityId ? { ...p, evokasiVerificationStatus: 'Terverifikasi e-Vokasi' as const } : p
      );
    }

    const newAudit: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
      actorName: getRoleById(get().currentRole).title,
      actorRole: getRoleById(get().currentRole).badge,
      scope: get().currentScope.name,
      actionType: 'PERSETUJUAN',
      entity: req.entityType,
      entityId: req.entityId,
      fieldChanged: 'approvalStatus',
      oldValue: 'PENDING',
      newValue: 'APPROVED',
      justificationReason: reviewerNotes || `Persetujuan resmi data: ${req.title} setelah validasi keabsahan data.`,
      ipAddress: '10.24.120.45',
    };

    set({
      approvalRequests: updatedRequests,
      candidates: updatedCandidates,
      providers: updatedProviders,
      auditLogs: [newAudit, ...get().auditLogs],
    });
  },

  rejectRequest: (requestId, rejectionReason) => {
    const req = get().approvalRequests.find((r) => r.id === requestId);
    if (!req) return;

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

    const updatedRequests = get().approvalRequests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            approvalStatus: 'REJECTED' as const,
            reviewedBy: `${getRoleById(get().currentRole).title}`,
            reviewedAt: timeStr,
            rejectionReason,
          }
        : r
    );

    const newAudit: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
      actorName: getRoleById(get().currentRole).title,
      actorRole: getRoleById(get().currentRole).badge,
      scope: get().currentScope.name,
      actionType: 'PENOLAKAN',
      entity: req.entityType,
      entityId: req.entityId,
      fieldChanged: 'approvalStatus',
      oldValue: 'PENDING',
      newValue: 'REJECTED',
      justificationReason: rejectionReason,
      ipAddress: '10.24.120.45',
    };

    set({
      approvalRequests: updatedRequests,
      auditLogs: [newAudit, ...get().auditLogs],
    });
  },

  requestRevision: (requestId, revisionNotes) => {
    const req = get().approvalRequests.find((r) => r.id === requestId);
    if (!req) return;

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

    const updatedRequests = get().approvalRequests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            approvalStatus: 'REVISION_REQUESTED' as const,
            reviewedBy: `${getRoleById(get().currentRole).title}`,
            reviewedAt: timeStr,
            revisionNotes,
          }
        : r
    );

    const newAudit: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
      actorName: getRoleById(get().currentRole).title,
      actorRole: getRoleById(get().currentRole).badge,
      scope: get().currentScope.name,
      actionType: 'REVISI',
      entity: req.entityType,
      entityId: req.entityId,
      fieldChanged: 'approvalStatus',
      oldValue: 'PENDING',
      newValue: 'REVISION_REQUESTED',
      justificationReason: revisionNotes,
      ipAddress: '10.24.120.45',
    };

    set({
      approvalRequests: updatedRequests,
      auditLogs: [newAudit, ...get().auditLogs],
    });
  },

  addAuditLog: (entry) => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;
    const newLog: AuditLogEntry = {
      ...entry,
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
    };
    set({ auditLogs: [newLog, ...get().auditLogs] });
  },

  setActiveStage: (stage) => set({ activeStage: stage }),
  resetToDefaultData: () => set({
    candidates: [],
    programs: [],
    providers: [],
    demands: [],
    businessDataLoaded: false,
    allocations: [],
    selectedCandidateIds: [],
    selectedDemandId: null,
    selectedProgramId: null,
    selectedProviderId: null,
  }),

  // Filter Actions
  setSearchCandidate: (val) => set({ searchCandidate: val }),
  setFilterProvinsi: (val) => set({ filterProvinsi: val, filterDistrict: 'ALL' }),
  setFilterDistrict: (val) => set({ filterDistrict: val }),
  setFilterEducation: (val) => set({ filterEducation: val }),
  setFilterSector: (val) => set({ filterSector: val }),
  setFilterWorkExperience: (val) => set({ filterWorkExperience: val }),
  setFilterCertification: (val) => set({ filterCertification: val }),
  setFilterCountry: (val) => set({ filterCountry: val }),
  setFilterReadiness: (val) => set({ filterReadiness: val }),
  setFilterVerification: (val) => set({ filterVerification: val }),
  setFilterLanguage: (val) => set({ filterLanguage: val }),

  setSearchProgram: (val) => set({ searchProgram: val }),
  setFilterProgramType: (val) => set({ filterProgramType: val }),
  setFilterProgramCountry: (val) => set({ filterProgramCountry: val }),

  setSearchProvider: (val) => set({ searchProvider: val }),
  setFilterProviderType: (val) => set({ filterProviderType: val }),
  setFilterEvokasiStatus: (val) => set({ filterEvokasiStatus: val }),
  setFilterProviderProvince: (val) => set({ filterProviderProvince: val }),
  setFilterProviderSector: (val) => set({ filterProviderSector: val }),
  setFilterInstitutionStatus: (val) => set({ filterInstitutionStatus: val }),
  setProviders: (newProviders) => set({ providers: newProviders }),

  setSearchDemand: (val) => set({ searchDemand: val }),
  setFilterDemandCountry: (val) => set({ filterDemandCountry: val }),
  setFilterDemandSector: (val) => set({ filterDemandSector: val }),

  // Selection
  setSelectedDemandId: (id) => set({ selectedDemandId: id }),
  setSelectedProgramId: (id) => set({ selectedProgramId: id }),
  setSelectedProviderId: (id) => set({ selectedProviderId: id }),

  toggleCandidateSelection: (id) => {
    const current = get().selectedCandidateIds;
    if (current.includes(id)) {
      set({ selectedCandidateIds: current.filter((item) => item !== id) });
    } else {
      set({ selectedCandidateIds: [...current, id] });
    }
  },
  selectAllCandidates: (ids) => set({ selectedCandidateIds: ids }),
  clearCandidateSelection: () => set({ selectedCandidateIds: [] }),

  // Verification Updates (Tahap 2)
  updateCandidateVerification: (id, status) => {
    set({
      candidates: get().candidates.map((c) =>
        c.id === id ? { ...c, verificationStatus: status } : c
      ),
    });
  },

  batchVerifyCandidates: (ids) => {
    set({
      candidates: get().candidates.map((c) =>
        ids.includes(c.id) ? { ...c, verificationStatus: 'Verified' } : c
      ),
    });
  },

  // ==========================================
  // CRUD IMPLEMENTATIONS WITH AUDIT TRAIL
  // ==========================================

  // Modul A: Calon Peserta
  createCandidate: (candidateData) => {
    const newId = `CAND-2026-${String(get().candidates.length + 1).padStart(3, '0')}`;
    const newCandidate: CandidateParticipant = {
      ...candidateData,
      id: newId,
      verificationStatus: candidateData.verificationStatus || 'Pending Verification',
      lifecycleStatus: candidateData.lifecycleStatus || 'SUBMITTED',
    };

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

    const auditEntry: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
      actorName: get().currentUser?.name || getRoleById(get().currentRole).title,
      actorRole: get().currentUser?.roleTitle || getRoleById(get().currentRole).badge,
      scope: get().currentScope.name,
      actionType: 'INPUT_DATA',
      entity: 'Data Calon Peserta',
      entityId: newId,
      newValue: `${newCandidate.fullName} (${newCandidate.institutionName} - ${newCandidate.major})`,
      justificationReason: `Pendaftaran data pencari kerja baru ke dalam sistem bursa tenaga kerja luar negeri.`,
      ipAddress: get().currentUser?.ipAddress || '10.24.120.88',
    };

    const newApproval: DataApprovalRequest = {
      id: `REQ-2026-${String(get().approvalRequests.length + 80).padStart(3, '0')}`,
      entityType: 'calon_peserta',
      entityId: newId,
      title: `Pengusulan Data Peserta Baru: ${newCandidate.fullName}`,
      submittedBy: get().currentUser?.name || 'Operator Disnaker',
      submittedRole: get().currentRole,
      scopeLabel: get().currentScope.name,
      submittedAt: timeStr,
      validationStatus: 'PASSED',
      validationChecks: [
        { ruleName: 'Format NIK 16 Digit', passed: true, message: 'Valid NIK Dukcapil' },
        { ruleName: 'Kesesuaian Usia Produktif', passed: true, message: 'Usia 18-24 tahun' },
        { ruleName: 'Akreditasi Sekolah Asal', passed: true, message: 'Terdaftar Dapodik' },
      ],
      approvalStatus: 'PENDING',
      dataSnapshot: newCandidate,
    };

    set({
      candidates: [newCandidate, ...get().candidates],
      approvalRequests: [newApproval, ...get().approvalRequests],
      auditLogs: [auditEntry, ...get().auditLogs],
    });

    return newCandidate;
  },

  updateCandidate: (id, updates) => {
    const existing = get().candidates.find((c) => c.id === id);
    if (!existing) return;

    const updated = { ...existing, ...updates };
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

    let fieldChanged = 'Biodata / Kualifikasi';
    let oldValue: string | undefined = existing.fullName;
    let newValue: string | undefined = updated.fullName;
    let reason = 'Pemutakhiran profil, kesiapan paspor, sertifikasi, atau data kontak peserta.';

    if (updates.verificationStatus && updates.verificationStatus !== existing.verificationStatus) {
      fieldChanged = 'Status Verifikasi';
      oldValue = existing.verificationStatus;
      newValue = updates.verificationStatus;
      reason = `Perubahan status verifikasi dokumen peserta menjadi ${updates.verificationStatus}.`;
    } else if (updates.lifecycleStatus && updates.lifecycleStatus !== existing.lifecycleStatus) {
      fieldChanged = 'Status Tahapan';
      oldValue = existing.lifecycleStatus;
      newValue = updates.lifecycleStatus;
      reason = `Perubahan status tahapan peserta dari ${existing.lifecycleStatus} menjadi ${updates.lifecycleStatus}.`;
    } else if (updates.fullName && updates.fullName !== existing.fullName) {
      fieldChanged = 'Nama Lengkap';
      oldValue = existing.fullName;
      newValue = updates.fullName;
      reason = `Perubahan nama lengkap peserta menjadi ${updates.fullName}.`;
    } else if (updates.readinessStatus && updates.readinessStatus !== existing.readinessStatus) {
      fieldChanged = 'Status Kesiapan';
      oldValue = existing.readinessStatus;
      newValue = updates.readinessStatus;
      reason = `Perubahan status kesiapan penempatan peserta menjadi ${updates.readinessStatus}.`;
    }

    const auditEntry: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
      actorName: get().currentUser?.name || getRoleById(get().currentRole).title,
      actorRole: get().currentUser?.roleTitle || getRoleById(get().currentRole).badge,
      scope: get().currentScope.name,
      actionType: 'UPDATE_DATA',
      entity: 'Data Calon Peserta',
      entityId: id,
      fieldChanged,
      oldValue,
      newValue,
      justificationReason: reason,
      ipAddress: get().currentUser?.ipAddress || '10.24.120.88',
    };

    set({
      candidates: get().candidates.map((c) => (c.id === id ? updated : c)),
      auditLogs: [auditEntry, ...get().auditLogs],
    });
  },

  deleteCandidate: (id, reason) => {
    const existing = get().candidates.find((c) => c.id === id);
    if (!existing) return { success: false, message: 'Data peserta tidak ditemukan' };

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

    const auditEntry: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
      actorName: get().currentUser?.name || getRoleById(get().currentRole).title,
      actorRole: get().currentUser?.roleTitle || getRoleById(get().currentRole).badge,
      scope: get().currentScope.name,
      actionType: 'HAPUS_DATA',
      entity: 'Data Calon Peserta',
      entityId: id,
      oldValue: `${existing.fullName} (${existing.id})`,
      newValue: 'DELETED / ARCHIVED',
      justificationReason: reason || `Penghapusan data peserta karena duplikasi atau pembatalan pendaftaran.`,
      ipAddress: get().currentUser?.ipAddress || '10.24.120.88',
    };

    set({
      candidates: get().candidates.filter((c) => c.id !== id),
      selectedCandidateIds: get().selectedCandidateIds.filter((cid) => cid !== id),
      auditLogs: [auditEntry, ...get().auditLogs],
    });

    return { success: true, message: `Data calon peserta ${existing.fullName} berhasil dihapus.` };
  },

  // Modul B: Program Pelatihan
  createProgram: (programData) => {
    const newId = `PROG-2026-${String(get().programs.length + 1).padStart(2, '0')}`;
    const newProgram: TrainingProgram = {
      ...programData,
      id: newId,
      enrolledCount: 0,
    };

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

    const auditEntry: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
      actorName: get().currentUser?.name || getRoleById(get().currentRole).title,
      actorRole: get().currentUser?.roleTitle || getRoleById(get().currentRole).badge,
      scope: get().currentScope.name,
      actionType: 'INPUT_DATA',
      entity: 'Program Pelatihan',
      entityId: newId,
      newValue: `${newProgram.title} (${newProgram.targetCountry} - ${newProgram.targetSector})`,
      justificationReason: `Penetapan katalog program pelatihan vokasi baru dengan kurikulum berstandar internasional.`,
      ipAddress: get().currentUser?.ipAddress || '10.24.120.88',
    };

    set({
      programs: [newProgram, ...get().programs],
      auditLogs: [auditEntry, ...get().auditLogs],
    });

    return newProgram;
  },

  updateProgram: (id, updates) => {
    const existing = get().programs.find((p) => p.id === id);
    if (!existing) return;

    const updated = { ...existing, ...updates };
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

    let fieldChanged = 'Kurikulum & Biaya';
    let oldValue: string | undefined = `${existing.title} (${existing.durationJP} JP)`;
    let newValue: string | undefined = `${updated.title} (${updated.durationJP} JP)`;
    let reason = 'Pembaruan kurikulum, silabus, atau estimasi biaya program.';

    if (updates.title && updates.title !== existing.title) {
      fieldChanged = 'Nama Program';
      oldValue = existing.title;
      newValue = updates.title;
      reason = `Perubahan nama program pelatihan menjadi ${updates.title}.`;
    } else if (updates.quota !== undefined && updates.quota !== existing.quota) {
      fieldChanged = 'Alokasi Kuota';
      oldValue = `${existing.quota} Peserta`;
      newValue = `${updates.quota} Peserta`;
      reason = 'Penyesuaian kuota alokasi peserta program pelatihan.';
    } else if (updates.durationJP !== undefined && updates.durationJP !== existing.durationJP) {
      fieldChanged = 'Durasi Jam Pelajaran';
      oldValue = `${existing.durationJP} JP`;
      newValue = `${updates.durationJP} JP`;
      reason = 'Penyesuaian durasi jam pelajaran (JP) program pelatihan.';
    }

    const auditEntry: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
      actorName: get().currentUser?.name || getRoleById(get().currentRole).title,
      actorRole: get().currentUser?.roleTitle || getRoleById(get().currentRole).badge,
      scope: get().currentScope.name,
      actionType: 'UPDATE_DATA',
      entity: 'Program Pelatihan',
      entityId: id,
      fieldChanged,
      oldValue,
      newValue,
      justificationReason: reason,
      ipAddress: get().currentUser?.ipAddress || '10.24.120.88',
    };

    set({
      programs: get().programs.map((p) => (p.id === id ? updated : p)),
      auditLogs: [auditEntry, ...get().auditLogs],
    });
  },

  deleteProgram: (id) => {
    const existing = get().programs.find((p) => p.id === id);
    if (!existing) return { success: false, message: 'Program tidak ditemukan' };

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

    const auditEntry: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
      actorName: get().currentUser?.name || getRoleById(get().currentRole).title,
      actorRole: get().currentUser?.roleTitle || getRoleById(get().currentRole).badge,
      scope: get().currentScope.name,
      actionType: 'HAPUS_DATA',
      entity: 'Program Pelatihan',
      entityId: id,
      oldValue: existing.title,
      newValue: 'DELETED / CLOSED',
      justificationReason: `Penutupan atau penghapusan program pelatihan yang belum dialokasikan peserta.`,
      ipAddress: get().currentUser?.ipAddress || '10.24.120.88',
    };

    set({
      programs: get().programs.filter((p) => p.id !== id),
      auditLogs: [auditEntry, ...get().auditLogs],
    });

    return { success: true, message: `Program ${existing.title} berhasil dihapus.` };
  },

  // Modul C: Lembaga Vokasi
  createProvider: (providerData) => {
    const newId = `VOC-2026-${String(get().providers.length + 1).padStart(3, '0')}`;
    const newProvider: VocationalProvider = {
      ...providerData,
      id: newId,
      operationalReadinessScore: providerData.operationalReadinessScore || 85,
    };

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

    const auditEntry: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
      actorName: get().currentUser?.name || getRoleById(get().currentRole).title,
      actorRole: get().currentUser?.roleTitle || getRoleById(get().currentRole).badge,
      scope: get().currentScope.name,
      actionType: 'INPUT_DATA',
      entity: 'Data Lembaga Vokasi',
      entityId: newId,
      newValue: `${newProvider.name} (${newProvider.providerType} - ${newProvider.kabupatenKota})`,
      justificationReason: `Pendaftaran lembaga vokasi mitra penyelenggara pelatihan vokasi luar negeri.`,
      ipAddress: get().currentUser?.ipAddress || '10.24.120.88',
    };

    set({
      providers: [newProvider, ...get().providers],
      auditLogs: [auditEntry, ...get().auditLogs],
    });

    return newProvider;
  },

  updateProvider: (id, updates) => {
    const existing = get().providers.find((p) => p.id === id);
    if (!existing) return;

    const updated = { ...existing, ...updates };
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

    let fieldChanged = 'Profil Lembaga';
    let oldValue: string | undefined = existing.name;
    let newValue: string | undefined = updated.name;
    let reason = 'Pembaruan informasi data lembaga vokasi mitra penyelenggara pelatihan.';

    if (updates.institutionStatus && updates.institutionStatus !== existing.institutionStatus) {
      fieldChanged = 'Status Kepemilikan (Negeri/Swasta)';
      oldValue = existing.institutionStatus || 'Negeri';
      newValue = updates.institutionStatus;
      reason = `Perubahan status kepemilikan lembaga dari ${existing.institutionStatus || 'Negeri'} menjadi ${updates.institutionStatus}.`;
    } else if (updates.name && updates.name !== existing.name) {
      fieldChanged = 'Nama Lembaga';
      oldValue = existing.name;
      newValue = updates.name;
      reason = `Perubahan nama lembaga menjadi ${updates.name}.`;
    } else if (updates.accreditation && updates.accreditation !== existing.accreditation) {
      fieldChanged = 'Akreditasi';
      oldValue = existing.accreditation;
      newValue = updates.accreditation;
      reason = `Perubahan status akreditasi dari ${existing.accreditation} menjadi ${updates.accreditation}.`;
    } else if (updates.operationalReadinessScore !== undefined && updates.operationalReadinessScore !== existing.operationalReadinessScore) {
      fieldChanged = 'Skor Kesiapan Operasional';
      oldValue = `${existing.operationalReadinessScore}%`;
      newValue = `${updates.operationalReadinessScore}%`;
      reason = 'Pembaruan skor kesiapan operasional lembaga vokasi.';
    } else if (
      (updates.certifiedInstructorsCount !== undefined && updates.certifiedInstructorsCount !== existing.certifiedInstructorsCount) ||
      (updates.classCount !== undefined && updates.classCount !== existing.classCount)
    ) {
      fieldChanged = 'Sarana & Prasarana';
      oldValue = `Kelas: ${existing.classCount}, Instruktur: ${existing.certifiedInstructorsCount}`;
      newValue = `Kelas: ${updates.classCount ?? existing.classCount}, Instruktur: ${updates.certifiedInstructorsCount ?? existing.certifiedInstructorsCount}`;
      reason = 'Pembaruan data bengkel praktikum, sertifikasi e-Vokasi, atau jumlah instruktur.';
    }

    const auditEntry: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
      actorName: get().currentUser?.name || getRoleById(get().currentRole).title,
      actorRole: get().currentUser?.roleTitle || getRoleById(get().currentRole).badge,
      scope: get().currentScope.name,
      actionType: 'UPDATE_DATA',
      entity: 'Data Lembaga Vokasi',
      entityId: id,
      fieldChanged,
      oldValue,
      newValue,
      justificationReason: reason,
      ipAddress: get().currentUser?.ipAddress || '10.24.120.88',
    };

    set({
      providers: get().providers.map((p) => (p.id === id ? updated : p)),
      auditLogs: [auditEntry, ...get().auditLogs],
    });
  },

  deleteProvider: (id) => {
    const existing = get().providers.find((p) => p.id === id);
    if (!existing) return { success: false, message: 'Lembaga tidak ditemukan' };

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

    const auditEntry: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
      actorName: get().currentUser?.name || getRoleById(get().currentRole).title,
      actorRole: get().currentUser?.roleTitle || getRoleById(get().currentRole).badge,
      scope: get().currentScope.name,
      actionType: 'HAPUS_DATA',
      entity: 'Data Lembaga Vokasi',
      entityId: id,
      oldValue: existing.name,
      newValue: 'DEACTIVATED',
      justificationReason: `Penonaktifan lembaga vokasi dari daftar mitra penyelenggara pelatihan.`,
      ipAddress: get().currentUser?.ipAddress || '10.24.120.88',
    };

    set({
      providers: get().providers.filter((p) => p.id !== id),
      auditLogs: [auditEntry, ...get().auditLogs],
    });

    return { success: true, message: `Lembaga vokasi ${existing.name} berhasil dihapus/dinonaktifkan.` };
  },

  // Modul D: Demand Luar Negeri
  createDemand: (demandData) => {
    const newId = `DEM-2026-${String(get().demands.length + 1).padStart(2, '0')}`;
    const newDemand: GlobalDemand = {
      ...demandData,
      id: newId,
      filledQuota: 0,
    };

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

    const auditEntry: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
      actorName: get().currentUser?.name || getRoleById(get().currentRole).title,
      actorRole: get().currentUser?.roleTitle || getRoleById(get().currentRole).badge,
      scope: get().currentScope.name,
      actionType: 'INPUT_DATA',
      entity: 'Demand Tenaga Kerja LN',
      entityId: newId,
      newValue: `${newDemand.jobTitle} - ${newDemand.employerName} (${newDemand.country}, Kuota: ${newDemand.requiredQuota})`,
      justificationReason: `Input lowongan kerja luar negeri baru terverifikasi untuk diselaraskan dengan supply vokasi.`,
      ipAddress: get().currentUser?.ipAddress || '10.24.120.88',
    };

    set({
      demands: [newDemand, ...get().demands],
      auditLogs: [auditEntry, ...get().auditLogs],
    });

    return newDemand;
  },

  updateDemand: (id, updates) => {
    const existing = get().demands.find((d) => d.id === id);
    if (!existing) return;

    const updated = { ...existing, ...updates };
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

    let fieldChanged = 'Persyaratan & Kualifikasi';
    let oldValue: string | undefined = `${existing.jobTitle} (${existing.requiredQuota} Pekerja)`;
    let newValue: string | undefined = `${updated.jobTitle} (${updated.requiredQuota} Pekerja)`;
    let reason = 'Penyesuaian standar gaji, kualifikasi, atau batas waktu pemenuhan demand.';

    if (updates.requiredQuota !== undefined && updates.requiredQuota !== existing.requiredQuota) {
      fieldChanged = 'Kuota Kebutuhan';
      oldValue = `${existing.requiredQuota} Pekerja`;
      newValue = `${updates.requiredQuota} Pekerja`;
      reason = 'Penyesuaian kuota kebutuhan tenaga kerja luar negeri.';
    } else if (updates.jobTitle && updates.jobTitle !== existing.jobTitle) {
      fieldChanged = 'Jabatan / Pekerjaan';
      oldValue = existing.jobTitle;
      newValue = updates.jobTitle;
      reason = `Perubahan judul jabatan lowongan luar negeri menjadi ${updates.jobTitle}.`;
    }

    const auditEntry: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
      actorName: get().currentUser?.name || getRoleById(get().currentRole).title,
      actorRole: get().currentUser?.roleTitle || getRoleById(get().currentRole).badge,
      scope: get().currentScope.name,
      actionType: 'UPDATE_DATA',
      entity: 'Demand Tenaga Kerja LN',
      entityId: id,
      fieldChanged,
      oldValue,
      newValue,
      justificationReason: reason,
      ipAddress: get().currentUser?.ipAddress || '10.24.120.88',
    };

    set({
      demands: get().demands.map((d) => (d.id === id ? updated : d)),
      auditLogs: [auditEntry, ...get().auditLogs],
    });
  },

  deleteDemand: (id) => {
    const existing = get().demands.find((d) => d.id === id);
    if (!existing) return { success: false, message: 'Demand tidak ditemukan' };

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

    const auditEntry: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
      actorName: get().currentUser?.name || getRoleById(get().currentRole).title,
      actorRole: get().currentUser?.roleTitle || getRoleById(get().currentRole).badge,
      scope: get().currentScope.name,
      actionType: 'HAPUS_DATA',
      entity: 'Demand Tenaga Kerja LN',
      entityId: id,
      oldValue: `${existing.jobTitle} - ${existing.employerName}`,
      newValue: 'CANCELLED / REMOVED',
      justificationReason: `Pembatalan job order atau penarikan kuota lowongan oleh pemberi kerja luar negeri.`,
      ipAddress: get().currentUser?.ipAddress || '10.24.120.88',
    };

    set({
      demands: get().demands.filter((d) => d.id !== id),
      auditLogs: [auditEntry, ...get().auditLogs],
    });

    return { success: true, message: `Lowongan demand ${existing.jobTitle} berhasil dibatalkan/dihapus.` };
  },
}));
