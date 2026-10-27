import React, { lazy, Suspense, useEffect, useLayoutEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { AdminLayout } from "@/components/layout/AdminLayout";
import type { ExecutiveDashboardBreakdownsData } from "@/components/reports/ExecutiveDashboardBreakdowns";
import type { DashboardTargetManagementData } from "@/pages/user-management-types";
import {
  CandidateParticipant,
  GlobalDemand,
  PersistedCandidateMatch,
  ProgramAllocationDecision,
  TrainingProgram,
  DataApprovalRequest,
  MonitoringData,
  UserRole,
  UserScope,
  VocationalProvider,
  PublicCommandCenterData,
} from "@/types";

const KemendagriLandingPage = lazy(() =>
  import("@/components/landing/KemendagriLandingPage").then((module) => ({
    default: module.KemendagriLandingPage,
  })),
);
interface LandingProjectionData {
  year: number | null;
  periods: number[];
  countries: { name: string; target: number; achieved: number; projected: number }[];
  sectors: { name: string; target: number; achieved: number; projected: number }[];
  placementTargets: {
    year: number;
    sectorName: string;
    occupationName: string;
    projectionPlacement: string;
    target: number;
  }[];
}
const UnifiedLoginPage = lazy(() =>
  import("@/components/auth/UnifiedLoginPage").then((module) => ({
    default: module.UnifiedLoginPage,
  })),
);
const InstitutionRegistrationPage = lazy(() =>
  import("@/pages/InstitutionRegistrationPage").then((module) => ({
    default: module.InstitutionRegistrationPage,
  })),
);
const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const RoleManagementPage = lazy(() =>
  import("@/pages/RoleManagementPage").then((module) => ({
    default: module.RoleManagementPage,
  })),
);
const UserManagementPage = lazy(() =>
  import("@/pages/UserManagementPage").then((module) => ({
    default: module.UserManagementPage,
  })),
);
const TargetManagementPage = lazy(() =>
  import("@/pages/TargetManagementPage").then((module) => ({
    default: module.TargetManagementPage,
  })),
);
const SippmiMonitoringPage = lazy(() =>
  import("@/pages/SippmiMonitoringPage").then((module) => ({
    default: module.SippmiMonitoringPage,
  })),
);
const SupplyTable = lazy(() =>
  import("@/components/modul-a/SupplyTable").then((module) => ({
    default: module.SupplyTable,
  })),
);
const TrainingProgramsView = lazy(() =>
  import("@/components/modul-b/TrainingProgramsView").then((module) => ({
    default: module.TrainingProgramsView,
  })),
);
const ProvidersView = lazy(() =>
  import("@/components/modul-c/ProvidersView").then((module) => ({
    default: module.ProvidersView,
  })),
);
const GlobalDemandsView = lazy(() =>
  import("@/components/modul-d/GlobalDemandsView").then((module) => ({
    default: module.GlobalDemandsView,
  })),
);
const MatchingEngineView = lazy(() =>
  import("@/components/matching/MatchingEngineView").then((module) => ({
    default: module.MatchingEngineView,
  })),
);
const ApprovalWorkflowView = lazy(() =>
  import("@/components/approvals/ApprovalWorkflowView").then((module) => ({
    default: module.ApprovalWorkflowView,
  })),
);
const AuditLogView = lazy(() =>
  import("@/components/audit/AuditLogView").then((module) => ({
    default: module.AuditLogView,
  })),
);
const ReportsView = lazy(() =>
  import("@/components/reports/ReportsView").then((module) => ({
    default: module.ReportsView,
  })),
);

interface AppProps {
  currentTab: string;
  isRoot: boolean;
  showLogin: boolean;
  showInstitutionRegistration?: boolean;
  registrationStatus?: string | null;
  registrationOptions?: {
    provinces: { id: string; name: string }[];
    districts: { id: string; province_id: string; name: string }[];
    sectors: { id: string; name: string }[];
    countries: { id: string; name: string }[];
  };
  landingKpiSummary: {
    year: number;
    metrics: {
      key: string;
      value: number;
      target: number | null;
    }[];
  };
  landingProjection: LandingProjectionData;
  publicCommandCenter?: PublicCommandCenterData;
  businessData?: {
    candidates: CandidateParticipant[];
    programs: TrainingProgram[];
    providers: VocationalProvider[];
    demands: GlobalDemand[];
    candidateMatches: PersistedCandidateMatch[];
    allocations: ProgramAllocationDecision[];
    nationalLpkCount: number;
    nationalLpkByProvince?: { province: string; totalCount: number; registeredCount: number }[];
    reportSummary: {
      candidateCount: number;
      readyCandidateCount: number;
      programCount: number;
      institutionCount: number;
      nationalLpkCount: number;
      demandCount: number;
      updatedAt: string | null;
      dashboard?: ExecutiveDashboardBreakdownsData;
      gardata: {
        candidateCount: number;
        trainingRecordCount: number;
        lastSyncStatus: string | null;
        lastSyncAt: string | null;
        recordsFetched: number | null;
        recordsInserted: number | null;
        recordsUpdated: number | null;
        recordsSkipped: number | null;
      };
    };
    approvalRequests: DataApprovalRequest[];
    approvalPagination: {
      currentPage: number;
      lastPage: number;
      perPage: number;
      total: number;
    };
    approvalCounts: Record<string, number>;
    approvalFilters: {
      status: string;
      type: string;
      search: string;
      page: number;
      perPage: number;
    };
    monitoring: MonitoringData;
    options: {
      provinces: { id: string; name: string }[];
      districts: { id: string; province_id: string; name: string }[];
      sectors: { id: string; name: string }[];
      occupations: { id: string; sector_id: string; title: string }[];
      countries: { id: string; name: string }[];
      institutions: { id: string; name: string }[];
    };
  };
  auth: {
    impersonation: { adminName: string | null } | null;
    user: {
      id: string;
      name: string;
      email: string;
      frontendRole: UserRole;
      roleName: string;
      roleTitle: string;
      badge: string | null;
      bp3miCode: string | null;
      bp3miAssignments: { code: string; name: string; provinces: string[] }[];
      organization: string;
      scope: UserScope;
      avatarInitials: string | null;
      mfaEnabled: boolean;
      defaultTab: string;
      accessibleTabs: string[];
    } | null;
  };
  adminUsers?: {
    data: {
      id: string;
      name: string;
      username: string;
      email: string;
      status: string;
      scopeName: string;
      scopeLevel: string;
      roleName: string;
      roleTitle: string;
      provinceId: string | null;
      districtId: string | null;
      institutionId: string | null;
      employerId: string | null;
    }[];
    currentPage: number;
    lastPage: number;
    total: number;
    perPage: number;
    roles: { name: string; title: string }[];
    provinces: { id: string; name: string }[];
    districts: { id: string; province_id: string; name: string }[];
    institutions: { id: string; name: string }[];
    employers: { id: string; name: string }[];
  };
  adminTargets?: DashboardTargetManagementData;
}

export function App({
  currentTab,
  isRoot,
  showLogin,
  showInstitutionRegistration,
  registrationStatus,
  registrationOptions,
  landingKpiSummary,
  landingProjection,
  publicCommandCenter,
  auth,
  businessData,
  adminUsers,
  adminTargets,
}: AppProps) {
  const {
    setCurrentTab,
    setAuthenticatedUser,
    setBusinessData,
    businessDataLoaded,
    setActiveStage,
    setSelectedProgramId,
    setSelectedProviderId,
  } = useAppStore();
  const authenticatedUser = auth.user;
  const activeTab = isRoot && authenticatedUser ? authenticatedUser.defaultTab : currentTab;

  useLayoutEffect(() => {
    if (businessData) {
      setBusinessData({
        ...businessData,
        approvalRequests: businessData.approvalRequests,
      });
    }
  }, [businessData, setBusinessData]);

  useEffect(() => {
    if (!authenticatedUser) {
      return;
    }

    setAuthenticatedUser(
      {
        id: authenticatedUser.id,
        name: authenticatedUser.name,
        email: authenticatedUser.email,
        roleName: authenticatedUser.roleName,
        role: authenticatedUser.frontendRole,
        roleTitle: authenticatedUser.roleTitle,
        badge: authenticatedUser.badge ?? undefined,
        bp3miCode: authenticatedUser.bp3miCode,
        bp3miAssignments: authenticatedUser.bp3miAssignments,
        organization: authenticatedUser.organization,
        scope: authenticatedUser.scope,
        mfaEnabled: authenticatedUser.mfaEnabled,
        mfaVerified: false,
        loginTimestamp: "",
        ipAddress: "",
        avatarInitials: authenticatedUser.avatarInitials ?? undefined,
      },
      authenticatedUser.frontendRole,
      authenticatedUser.scope,
    );
  }, [authenticatedUser, setAuthenticatedUser]);

  useLayoutEffect(() => {
    if (activeTab !== "matching" && activeTab !== "modul-e") return;
    const params = new URLSearchParams(window.location.search);
    const requestedStage = Number(params.get("stage"));
    if (Number.isInteger(requestedStage) && requestedStage >= 1 && requestedStage <= 6) {
      setActiveStage(requestedStage);
    }

    const programId = params.get("programId");
    if (programId && businessData?.programs.some((program) => program.id === programId)) {
      setSelectedProgramId(programId);
    }

    const providerId = params.get("providerId");
    if (providerId && businessData?.providers.some((provider) => provider.id === providerId)) {
      setSelectedProviderId(providerId);
    }
  }, [
    activeTab,
    businessData,
    setActiveStage,
    setSelectedProgramId,
    setSelectedProviderId,
  ]);

  const loading = (
    <div role="status" className="p-6 text-sm text-muted-foreground">
      Memuat halaman…
    </div>
  );

  if (showLogin && !authenticatedUser) {
    return (
      <Suspense fallback={loading}>
        <UnifiedLoginPage status={registrationStatus} />
      </Suspense>
    );
  }

  if (showInstitutionRegistration && !authenticatedUser && registrationOptions) {
    return (
      <Suspense fallback={loading}>
        <InstitutionRegistrationPage
          provinces={registrationOptions.provinces}
          districts={registrationOptions.districts}
          sectors={registrationOptions.sectors}
          countries={registrationOptions.countries}
        />
      </Suspense>
    );
  }

  if (!authenticatedUser) {
    return (
      <Suspense fallback={loading}>
        <KemendagriLandingPage
          kpiSummary={landingKpiSummary}
          projection={landingProjection}
          publicCommandCenter={publicCommandCenter}
        />
      </Suspense>
    );
  }

  if (!businessDataLoaded) {
    return loading;
  }

  let page: React.ReactNode;
  switch (activeTab) {
    case "dashboard":
      if (authenticatedUser.roleName === "leadership") {
        page = (
          <ReportsView
            summary={businessData?.reportSummary ?? {
              candidateCount: 0,
              readyCandidateCount: 0,
              programCount: 0,
              institutionCount: 0,
              nationalLpkCount: 0,
              demandCount: 0,
              updatedAt: null,
              gardata: {
                candidateCount: 0,
                trainingRecordCount: 0,
                lastSyncStatus: null,
                lastSyncAt: null,
                recordsFetched: 0,
                recordsInserted: 0,
                recordsUpdated: 0,
                recordsSkipped: 0,
              },
            }}
            isAuditor={false}
            title="Dashboard"
          />
        );
        break;
      }
      page = (
        <DashboardPage
          currentTab="dashboard"
          setCurrentTab={setCurrentTab}
          nationalLpkCount={businessData?.nationalLpkCount ?? 0}
          nationalLpkByProvince={businessData?.nationalLpkByProvince}
        />
      );
      break;
    case "overview":
      page = (
        <DashboardPage
          currentTab={activeTab}
          setCurrentTab={setCurrentTab}
          nationalLpkCount={businessData?.nationalLpkCount ?? 0}
          nationalLpkByProvince={businessData?.nationalLpkByProvince}
        />
      );
      break;
    case "modul-a":
      page = <SupplyTable />;
      break;
    case "modul-b":
      page = <TrainingProgramsView />;
      break;
    case "modul-c":
      page = <ProvidersView />;
      break;
    case "modul-d":
      page = <GlobalDemandsView />;
      break;
    case "matching":
    case "modul-e":
      page = <MatchingEngineView candidateMatches={businessData?.candidateMatches ?? []} monitoring={businessData?.monitoring} />;
      break;
    case "approvals":
      page = (
        <ApprovalWorkflowView
          approvalRequests={businessData?.approvalRequests ?? []}
          pagination={businessData?.approvalPagination ?? { currentPage: 1, lastPage: 1, perPage: 25, total: 0 }}
          counts={businessData?.approvalCounts ?? {}}
          filters={businessData?.approvalFilters ?? { status: "ALL", type: "ALL", search: "", page: 1, perPage: 25 }}
          canReview={["task_force", "verifier"].includes(authenticatedUser.roleName)}
        />
      );
      break;
    case "audit":
      page = <AuditLogView />;
      break;
    case "reports":
      page = (
        <ReportsView
          summary={businessData?.reportSummary ?? {
            candidateCount: 0,
            readyCandidateCount: 0,
            programCount: 0,
            institutionCount: 0,
            nationalLpkCount: 0,
            demandCount: 0,
            updatedAt: null,
            gardata: {
              candidateCount: 0,
              trainingRecordCount: 0,
              lastSyncStatus: null,
              lastSyncAt: null,
              recordsFetched: 0,
              recordsInserted: 0,
              recordsUpdated: 0,
              recordsSkipped: 0,
            },
          }}
          isAuditor={authenticatedUser.roleName === "auditor"}
        />
      );
      break;
    case "rbac":
      page = authenticatedUser.roleName === "super_admin" ? (
        <UserManagementPage adminUsers={adminUsers} currentUserId={authenticatedUser.id} />
      ) : (
        <RoleManagementPage />
      );
      break;
    case "targets":
      page = <TargetManagementPage adminTargets={adminTargets} />;
      break;
    case "sippmi-monitoring":
      page = <SippmiMonitoringPage monitoring={businessData?.monitoring ?? {
        summary: {
          totalClasses: 0,
          activeClasses: 0,
          gardataCandidates: 0,
          verifiedReports: 0,
          averageAttendance: null,
          averageAssessmentScore: null,
          gardataTargetJp: 0,
          gardataAchievedJp: 0,
        },
        classes: [],
        gardataBatches: [],
        candidates: [],
        candidatePagination: {
          currentPage: 1,
          lastPage: 1,
          perPage: 25,
          total: 0,
        },
        candidateSource: 'all',
        classPagination: {
          currentPage: 1,
          lastPage: 1,
          perPage: 25,
          total: 0,
        },
        placements: [],
        placementCandidates: [],
        lastSync: null,
      }} />;
      break;
    default:
      page = (
        <DashboardPage
          currentTab="overview"
          setCurrentTab={setCurrentTab}
          nationalLpkCount={businessData?.nationalLpkCount ?? 0}
          nationalLpkByProvince={businessData?.nationalLpkByProvince}
          accessibleTabs={authenticatedUser.accessibleTabs}
        />
      );
  }

  return (
    <AdminLayout
      currentTab={activeTab}
      onTabChange={setCurrentTab}
      accessibleTabs={authenticatedUser.accessibleTabs}
      impersonationAdminName={auth.impersonation?.adminName ?? null}
    >
      <Suspense fallback={loading}>{page}</Suspense>
    </AdminLayout>
  );
}

export default App;
