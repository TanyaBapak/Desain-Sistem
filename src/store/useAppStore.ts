import { create } from 'zustand';
import {
  CandidateParticipant,
  TrainingProgram,
  VocationalProvider,
  GlobalDemand,
  MatchingResult,
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
  mockSupply,
  mockPrograms,
  mockProviders,
  mockDemand,
  mockStageDetails,
  mockAggregateMatching,
  mockRoles,
  mockApprovals,
  mockAuditLogs,
  getRoleById,
  mockUsers,
  UserAccount,
} from '../data';

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
  allocations: ProgramAllocationDecision[];

  // Approvals & Audit Trail
  approvalRequests: DataApprovalRequest[];
  auditLogs: AuditLogEntry[];

  // Workflow Stages & Selection State
  activeStage: number; // 1, 2, 3, 4, 5, 6
  selectedDemandId: string | null;
  selectedCandidateIds: string[];
  selectedProgramId: string | null;
  selectedProviderId: string | null;

  // Modul A Filters
  searchCandidate: string;
  filterProvinsi: string;
  filterEducation: string;
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

  // Modul D Filters
  searchDemand: string;
  filterDemandCountry: string;
  filterDemandSector: string;

  // Navigation & Role Actions
  setViewMode: (mode: ViewMode) => void;
  setCurrentRole: (role: UserRole) => void;
  setCurrentTab: (tab: string) => void;
  openLoginPage: () => void;
  loginWithAccount: (userAccount: UserAccount, options?: { mfaVerified?: boolean; ipAddress?: string }) => void;
  logout: () => void;
  switchRoleContext: (targetScopeName: string) => void;
  setSessionTimeRemaining: (time: number) => void;
  loginAsRole: (role: UserRole) => void;

  // SGG Command Center Actions
  setExecutiveTier: (tier: ExecutiveTier) => void;
  setActiveBusinessStage: (stage: BusinessStage) => void;
  setDrillDownFilter: (filter: Partial<DrillDownFilter>) => void;

  // RBAC & Scope Actions
  setCurrentScope: (scope: UserScope) => void;
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
  setFilterEducation: (val: string) => void;
  setFilterReadiness: (val: string) => void;
  setFilterVerification: (val: string) => void;
  setFilterLanguage: (val: string) => void;

  setSearchProgram: (val: string) => void;
  setFilterProgramType: (val: string) => void;
  setFilterProgramCountry: (val: string) => void;

  setSearchProvider: (val: string) => void;
  setFilterProviderType: (val: string) => void;
  setFilterEvokasiStatus: (val: string) => void;

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
  updateProviderEvokasi: (id: string, status: 'Terverifikasi e-Vokasi' | 'Proses Verifikasi' | 'Belum Terverifikasi') => void;

  // Program Allocation (Tahap 4)
  createAllocation: (params: {
    demandId: string;
    programId: string;
    providerId: string;
    candidateIds: string[];
    startDate: string;
    endDate: string;
  }) => ProgramAllocationDecision;
  updateAllocationStatus: (allocationId: string, status: 'Draft' | 'Approved' | 'Finalized') => void;
  deleteAllocation: (allocationId: string) => void;
}

// Initial Sample Allocation to demonstrate Dashboard
const initialAllocations: ProgramAllocationDecision[] = [
  {
    allocationId: "ALOK-2026-001",
    demandId: "DEM-JPN-2026-01",
    selectedProgramId: "PROG-JPN-01",
    selectedProviderId: "VOC-JTM-003",
    allocatedCandidateIds: ["CAND-2026-002"],
    totalBudgetRequired: 14500000,
    batchScheduleStart: "2026-11-10",
    batchScheduleEnd: "2027-02-15",
    approvalStatus: "Approved"
  }
];

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

  candidates: mockSupply,
  programs: mockPrograms,
  providers: mockProviders,
  demands: mockDemand,
  allocations: initialAllocations,
  approvalRequests: mockApprovals,
  auditLogs: mockAuditLogs,

  activeStage: 1,
  selectedDemandId: "DEM-JPN-2026-01",
  selectedCandidateIds: ["CAND-2026-001", "CAND-2026-002"],
  selectedProgramId: "PROG-JPN-01",
  selectedProviderId: "VOC-JTM-003",

  // Modul A Filters
  searchCandidate: '',
  filterProvinsi: 'ALL',
  filterEducation: 'ALL',
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

  // Modul D Filters
  searchDemand: '',
  filterDemandCountry: 'ALL',
  filterDemandSector: 'ALL',

  // Navigation & Role Actions
  setViewMode: (mode) => set({ viewMode: mode }),
  openLoginPage: () => set({ viewMode: 'login' }),
  setSessionTimeRemaining: (time) => set({ sessionTimeRemaining: time }),

  loginWithAccount: (userAccount, options) => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    const authUser: AuthUser = {
      id: userAccount.id,
      name: userAccount.name,
      email: userAccount.email,
      role: userAccount.role,
      roleTitle: userAccount.roleTitle,
      badge: userAccount.badge,
      organization: userAccount.organization,
      scope: userAccount.scope,
      nip: userAccount.nip,
      mfaEnabled: userAccount.mfaEnabled,
      mfaVerified: options?.mfaVerified ?? userAccount.mfaEnabled,
      loginTimestamp: timeStr,
      ipAddress: options?.ipAddress || '10.24.120.88',
      avatarInitials: userAccount.avatarInitials,
      authorizedScopes: userAccount.authorizedScopes,
      sessionExpiresAt: expiresAt,
    };

    const loginAudit: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
      actorName: userAccount.name,
      actorRole: userAccount.roleTitle,
      scope: userAccount.scope.name,
      actionType: 'LOGIN',
      entity: 'Sesi Autentikasi Pengguna',
      entityId: userAccount.id,
      fieldChanged: 'authSession',
      oldValue: 'UNAUTHENTICATED',
      newValue: `AUTHENTICATED_${userAccount.role.toUpperCase()}`,
      justificationReason: `Autentikasi SSO Terpadu berhasil untuk ${userAccount.name} (${userAccount.roleTitle}) dengan lingkup ${userAccount.scope.name}. MFA: ${userAccount.mfaEnabled ? 'Terverifikasi' : 'Standar'}. Diarahkan otomatis ke ${userAccount.landingTabTitle}.`,
      ipAddress: options?.ipAddress || '10.24.120.88',
    };

    set({
      isAuthenticated: true,
      currentUser: authUser,
      currentRole: userAccount.role,
      currentScope: userAccount.scope,
      currentTab: userAccount.landingTab,
      viewMode: 'app',
      sessionTimeRemaining: 1800,
      auditLogs: [loginAudit, ...get().auditLogs],
    });
  },

  logout: () => {
    const currentUser = get().currentUser;
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

    const logoutAudit: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
      actorName: currentUser ? currentUser.name : 'Pengguna SGG',
      actorRole: currentUser ? currentUser.roleTitle : 'Stakeholder',
      scope: currentUser ? currentUser.scope.name : 'Nasional',
      actionType: 'LOGOUT',
      entity: 'Sesi Autentikasi Pengguna',
      entityId: currentUser ? currentUser.id : 'USR-UNKNOWN',
      fieldChanged: 'authSession',
      oldValue: 'AUTHENTICATED',
      newValue: 'SESSION_TERMINATED',
      justificationReason: `Pengguna mengakhiri sesi kerja melalui tombol Logout resmi. Token sesi dinonaktifkan dari memori sistem.`,
      ipAddress: currentUser?.ipAddress || '10.24.120.88',
    };

    set({
      isAuthenticated: false,
      currentUser: null,
      viewMode: 'landing',
      currentTab: 'overview',
      sessionTimeRemaining: 0,
      auditLogs: [logoutAudit, ...get().auditLogs],
    });
  },

  switchRoleContext: (targetScopeName) => {
    const currentUser = get().currentUser;
    if (!currentUser) return;

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

    const updatedScope: UserScope = {
      ...currentUser.scope,
      name: targetScopeName,
    };

    const contextAudit: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
      actorName: currentUser.name,
      actorRole: currentUser.roleTitle,
      scope: targetScopeName,
      actionType: 'AKUN_HAK_AKSES',
      entity: 'Konteks Kewenangan Sesi',
      entityId: currentUser.id,
      fieldChanged: 'activeScopeContext',
      oldValue: currentUser.scope.name,
      newValue: targetScopeName,
      justificationReason: `Pengguna melakukan peralihan konteks wilayah/data yang diotorisasi ke ${targetScopeName}.`,
      ipAddress: currentUser.ipAddress,
    };

    set({
      currentScope: updatedScope,
      currentUser: {
        ...currentUser,
        scope: updatedScope,
      },
      auditLogs: [contextAudit, ...get().auditLogs],
    });
  },

  setCurrentRole: (role) => {
    const roleObj = getRoleById(role);
    set({
      currentRole: role,
      currentScope: roleObj.defaultScope,
    });
  },
  setCurrentTab: (tab) => set({ currentTab: tab }),
  setCurrentScope: (scope) => set({ currentScope: scope }),
  setIsRbacModalOpen: (open) => set({ isRbacModalOpen: open }),

  loginAsRole: (role) => {
    const matchingAccount = mockUsers.find((u) => u.role === role) || mockUsers[2];
    get().loginWithAccount(matchingAccount);
  },

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
    candidates: mockSupply,
    programs: mockPrograms,
    providers: mockProviders,
    demands: mockDemand,
    allocations: initialAllocations,
    selectedCandidateIds: [],
    selectedDemandId: null,
    selectedProgramId: null,
    selectedProviderId: null,
  }),

  // Filter Actions
  setSearchCandidate: (val) => set({ searchCandidate: val }),
  setFilterProvinsi: (val) => set({ filterProvinsi: val }),
  setFilterEducation: (val) => set({ filterEducation: val }),
  setFilterReadiness: (val) => set({ filterReadiness: val }),
  setFilterVerification: (val) => set({ filterVerification: val }),
  setFilterLanguage: (val) => set({ filterLanguage: val }),

  setSearchProgram: (val) => set({ searchProgram: val }),
  setFilterProgramType: (val) => set({ filterProgramType: val }),
  setFilterProgramCountry: (val) => set({ filterProgramCountry: val }),

  setSearchProvider: (val) => set({ searchProvider: val }),
  setFilterProviderType: (val) => set({ filterProviderType: val }),
  setFilterEvokasiStatus: (val) => set({ filterEvokasiStatus: val }),

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

  updateProviderEvokasi: (id, status) => {
    set({
      providers: get().providers.map((p) =>
        p.id === id ? { ...p, evokasiVerificationStatus: status } : p
      ),
    });
  },

  // Allocation Management (Tahap 4)
  createAllocation: ({ demandId, programId, providerId, candidateIds, startDate, endDate }) => {
    const program = get().programs.find((p) => p.id === programId);
    const costPer = program ? program.estimatedCostPerParticipant : 15000000;
    const totalBudget = costPer * candidateIds.length;

    const newAllocation: ProgramAllocationDecision = {
      allocationId: `ALOK-${new Date().getFullYear()}-${String(get().allocations.length + 1).padStart(3, '0')}`,
      demandId,
      selectedProgramId: programId,
      selectedProviderId: providerId,
      allocatedCandidateIds: candidateIds,
      totalBudgetRequired: totalBudget,
      batchScheduleStart: startDate,
      batchScheduleEnd: endDate,
      approvalStatus: 'Approved',
    };

    set({
      allocations: [newAllocation, ...get().allocations],
    });

    return newAllocation;
  },

  updateAllocationStatus: (allocationId, status) => {
    set({
      allocations: get().allocations.map((a) =>
        a.allocationId === allocationId ? { ...a, approvalStatus: status } : a
      ),
    });
  },

  deleteAllocation: (allocationId) => {
    set({
      allocations: get().allocations.filter((a) => a.allocationId !== allocationId),
    });
  },
}));

// ==========================================
// FORMULASI ALGORITMA MATCHING (TAHAP 3)
// Sesuai Formula di technical_spec.md
// Match Score = (Skill * 0.50) + (Language * 0.35) + (Education * 0.15)
// ==========================================
export function calculateMatchingScore(
  candidate: CandidateParticipant,
  demand: GlobalDemand
): MatchingResult {
  // 1. Skill Match Calculation
  const matchedSkills = candidate.skills.filter((s) =>
    demand.requiredSkills.some((req) => req.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(req.toLowerCase()))
  );
  const skillScore = demand.requiredSkills.length > 0
    ? (matchedSkills.length / demand.requiredSkills.length) * 100
    : 100;
  const skillGaps = demand.requiredSkills.filter(
    (req) => !candidate.skills.some((s) => s.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(s.toLowerCase()))
  );

  // 2. Language Match Calculation
  const candidateLang = candidate.languageProficiency.find((l) => {
    const langLower = l.language.toLowerCase();
    const countryLower = demand.country.toLowerCase();
    const reqLevelLower = demand.requiredLanguageLevel.toLowerCase();
    return langLower.includes(countryLower) || countryLower.includes(langLower) || reqLevelLower.includes(langLower);
  });

  const languageMatch = !!candidateLang && (
    candidateLang.level.toLowerCase().includes('n4') ||
    candidateLang.level.toLowerCase().includes('n3') ||
    candidateLang.level.toLowerCase().includes('b1') ||
    candidateLang.level.toLowerCase().includes('intermediate') ||
    candidateLang.level.toLowerCase().includes('level 2')
  );

  const languageScore = languageMatch ? 100 : candidateLang ? 65 : 35;

  // 3. Overall Weighted Score
  const totalScore = Math.min(100, Math.round((skillScore * 0.50) + (languageScore * 0.35) + (100 * 0.15)));

  // 4. Recommend Program based on gaps
  let recommendedProg = "PROG-JPN-01";
  if (demand.country.toLowerCase() === "jerman") recommendedProg = "PROG-GER-01";
  else if (demand.country.toLowerCase() === "korea") recommendedProg = "PROG-KOR-01";
  else if (demand.country.toLowerCase() === "taiwan") recommendedProg = "PROG-TWN-01";
  else if (demand.sector.toLowerCase().includes("manufaktur") || demand.jobTitle.toLowerCase().includes("welder")) {
    recommendedProg = "PROG-JPN-02";
  }

  return {
    candidateId: candidate.id,
    demandId: demand.id,
    matchScore: totalScore,
    skillsMatchPercentage: Math.round(skillScore),
    languageMatch,
    skillGaps,
    languageGapDescription: languageMatch
      ? `Tercapai (${candidateLang?.level || 'Standar Terpenuhi'})`
      : `Perlu peningkatan ke ${demand.requiredLanguageLevel} (Saat ini: ${candidateLang?.level || 'Belum Terdaftar'})`,
    recommendedProgramId: recommendedProg,
  };
}
