import React, { lazy, Suspense, useEffect, useLayoutEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  CandidateParticipant,
  GlobalDemand,
  TrainingProgram,
  DataApprovalRequest,
  MonitoringData,
  UserRole,
  UserScope,
  VocationalProvider,
} from "@/types";

const KemendagriLandingPage = lazy(() =>
  import("@/components/landing/KemendagriLandingPage").then((module) => ({
    default: module.KemendagriLandingPage,
  })),
);
const UnifiedLoginPage = lazy(() =>
  import("@/components/auth/UnifiedLoginPage").then((module) => ({
    default: module.UnifiedLoginPage,
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
  businessData?: {
    candidates: CandidateParticipant[];
    programs: TrainingProgram[];
    providers: VocationalProvider[];
    demands: GlobalDemand[];
    reportSummary: {
      candidateCount: number;
      readyCandidateCount: number;
      programCount: number;
      institutionCount: number;
      demandCount: number;
      updatedAt: string | null;
      gardata: {
        candidateCount: number;
        trainingRecordCount: number;
        lastSyncStatus: string | null;
        lastSyncAt: string | null;
        recordsFetched: number;
        recordsInserted: number;
        recordsUpdated: number;
        recordsSkipped: number;
      };
    };
    approvalRequests: DataApprovalRequest[];
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
    user: {
      id: string;
      name: string;
      email: string;
      frontendRole: UserRole;
      roleName: string;
      roleTitle: string;
      badge: string | null;
      organization: string;
      scope: UserScope;
      avatarInitials: string | null;
      mfaEnabled: boolean;
      defaultTab: string;
      accessibleTabs: string[];
    } | null;
  };
}

export function App({ currentTab, isRoot, showLogin, auth, businessData }: AppProps) {
  const { setCurrentTab, setAuthenticatedUser, setBusinessData, businessDataLoaded } = useAppStore();
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
        role: authenticatedUser.frontendRole,
        roleTitle: authenticatedUser.roleTitle,
        badge: authenticatedUser.badge ?? undefined,
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

  const loading = (
    <div role="status" className="p-6 text-sm text-muted-foreground">
      Memuat halaman…
    </div>
  );

  if (showLogin && !authenticatedUser) {
    return (
      <Suspense fallback={loading}>
        <UnifiedLoginPage />
      </Suspense>
    );
  }

  if (!authenticatedUser) {
    return (
      <Suspense fallback={loading}>
        <KemendagriLandingPage />
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
      page = <DashboardPage currentTab="dashboard" setCurrentTab={setCurrentTab} />;
      break;
    case "overview":
      page = (
        <DashboardPage currentTab={activeTab} setCurrentTab={setCurrentTab} />
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
      page = <MatchingEngineView />;
      break;
    case "approvals":
      page = (
        <ApprovalWorkflowView
          approvalRequests={businessData?.approvalRequests ?? []}
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
      page = <RoleManagementPage />;
      break;
    case "sippmi-monitoring":
      page = <SippmiMonitoringPage monitoring={businessData?.monitoring ?? {
        summary: { totalClasses: 0, activeClasses: 0, gardataCandidates: 0, verifiedReports: 0 },
        classes: [],
        candidates: [],
        lastSync: null,
      }} />;
      break;
    default:
      page = <DashboardPage currentTab="overview" setCurrentTab={setCurrentTab} />;
  }

  return (
    <AdminLayout
      currentTab={activeTab}
      onTabChange={setCurrentTab}
      accessibleTabs={authenticatedUser.accessibleTabs}
    >
      <Suspense fallback={loading}>{page}</Suspense>
    </AdminLayout>
  );
}

export default App;
