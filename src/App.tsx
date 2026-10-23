import React, { lazy, Suspense, useEffect, useLayoutEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  CandidateParticipant,
  GlobalDemand,
  TrainingProgram,
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

interface AppProps {
  currentTab: string;
  isRoot: boolean;
  showLogin: boolean;
  businessData?: {
    candidates: CandidateParticipant[];
    programs: TrainingProgram[];
    providers: VocationalProvider[];
    demands: GlobalDemand[];
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
      setBusinessData(businessData);
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
      page = <ApprovalWorkflowView />;
      break;
    case "audit":
      page = <AuditLogView />;
      break;
    case "rbac":
      page = <RoleManagementPage />;
      break;
    case "sippmi-monitoring":
      page = <SippmiMonitoringPage />;
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
