import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { KemendagriLandingPage } from "@/components/landing/KemendagriLandingPage";
import { UnifiedLoginPage } from "@/components/auth/UnifiedLoginPage";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { getDefaultTab, canAccessTab, getRoleInfo } from "@/lib/rbac";
import { mockRoles } from "@/data";

// --- Pages (lazy-ish inline imports) ---
import { DashboardPage } from "@/pages/DashboardPage";
import { RoleManagementPage } from "@/pages/RoleManagementPage";
import { SippmiMonitoringPage } from "@/pages/SippmiMonitoringPage";
import { SupplyTable } from "@/components/modul-a/SupplyTable";
import { TrainingProgramsView } from "@/components/modul-b/TrainingProgramsView";
import { ProvidersView } from "@/components/modul-c/ProvidersView";
import { GlobalDemandsView } from "@/components/modul-d/GlobalDemandsView";
import { MatchingEngineView } from "@/components/matching/MatchingEngineView";
import { ApprovalWorkflowView } from "@/components/approvals/ApprovalWorkflowView";
import { AuditLogView } from "@/components/audit/AuditLogView";
import { RbacMatrixView } from "@/components/rbac/RbacMatrixView";

// Wrapper that passes currentTab/onTabChange to legacy module components
function LegacyModulePage({ component: Component }: { component: React.FC }) {
  const { currentTab, setCurrentTab, currentRole } = useAppStore();
  const roleObj = getRoleInfo(currentRole);
  // Ensure tab is accessible for this role
  React.useEffect(() => {
    if (!canAccessTab(currentRole, currentTab)) {
      setCurrentTab(roleObj.defaultTab);
    }
  }, [currentRole, currentTab, roleObj, setCurrentTab]);
  return <Component />;
}

export const App: React.FC = () => {
  const { viewMode, isAuthenticated, currentTab, setCurrentTab, currentRole } =
    useAppStore();

  // 1. Landing page mode
  if (viewMode === "landing") {
    return <KemendagriLandingPage />;
  }

  // 2. Login / not authenticated
  if (viewMode === "login" || !isAuthenticated) {
    return <UnifiedLoginPage />;
  }

  // 3. Authenticated → Admin dashboard with routing
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to default tab for role */}
        <Route
          path="/"
          element={
            <Navigate to={`/app/${getDefaultTab(currentRole)}`} replace />
          }
        />

        <Route path="/app/*" element={<AdminLayout />}>
          <Route index element={<Navigate to={`/app/${getDefaultTab(currentRole)}`} replace />} />
          <Route
            path="dashboard"
            element={<DashboardPage currentTab={currentTab} setCurrentTab={setCurrentTab} />}
          />
          <Route path="modul-a" element={<LegacyModulePage component={SupplyTable} />} />
          <Route path="modul-b" element={<LegacyModulePage component={TrainingProgramsView} />} />
          <Route path="modul-c" element={<LegacyModulePage component={ProvidersView} />} />
          <Route path="modul-d" element={<LegacyModulePage component={GlobalDemandsView} />} />
          <Route path="matching" element={<LegacyModulePage component={MatchingEngineView} />} />
          <Route path="modul-e" element={<LegacyModulePage component={MatchingEngineView} />} />
          <Route path="approvals" element={<LegacyModulePage component={ApprovalWorkflowView} />} />
          <Route path="audit" element={<LegacyModulePage component={AuditLogView} />} />
          <Route path="rbac" element={<RoleManagementPage />} />
          <Route path="sippmi-monitoring" element={<SippmiMonitoringPage />} />
        </Route>
        </Routes>
      </BrowserRouter>
  );
};

export default App;
