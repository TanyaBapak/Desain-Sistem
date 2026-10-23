import React from 'react';
import { useAppStore } from './store/useAppStore';
import { KemendagriLandingPage } from './components/landing/KemendagriLandingPage';
import { UnifiedLoginPage } from './components/auth/UnifiedLoginPage';
import { HeaderNav } from './components/layout/HeaderNav';
import { Footer } from './components/layout/Footer';
import { ExecutiveCommandCenter } from './components/dashboard/ExecutiveCommandCenter';
import { SupplyTable } from './components/modul-a/SupplyTable';
import { TrainingProgramsView } from './components/modul-b/TrainingProgramsView';
import { ProvidersView } from './components/modul-c/ProvidersView';
import { GlobalDemandsView } from './components/modul-d/GlobalDemandsView';
import { MatchingEngineView } from './components/matching/MatchingEngineView';
import { ApprovalWorkflowView } from './components/approvals/ApprovalWorkflowView';
import { AuditLogView } from './components/audit/AuditLogView';
import { RbacMatrixView } from './components/rbac/RbacMatrixView';

export const App: React.FC = () => {
  const { viewMode, isAuthenticated, currentTab, setCurrentTab } = useAppStore();

  // 1. If currently on Landing Page mode, render the public portal
  if (viewMode === 'landing') {
    return <KemendagriLandingPage />;
  }

  // 2. If on Login mode, or unauthenticated when attempting to access internal views, render Unified Login Page
  if (viewMode === 'login' || !isAuthenticated) {
    return <UnifiedLoginPage />;
  }

  // 3. If authenticated in App mode, render the Internal Command Center Dashboard
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-red-600 selection:text-white font-sans">
      {/* Top Application Header Navigation (Unified with User Profile & Logout) */}
      <HeaderNav currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'overview' && (
          <ExecutiveCommandCenter onNavigate={(tab) => setCurrentTab(tab)} />
        )}

        {currentTab === 'modul-a' && <SupplyTable />}

        {currentTab === 'modul-b' && <TrainingProgramsView />}

        {currentTab === 'modul-c' && <ProvidersView />}

        {currentTab === 'modul-d' && <GlobalDemandsView />}

        {currentTab === 'matching' && <MatchingEngineView />}

        {currentTab === 'approvals' && <ApprovalWorkflowView />}

        {currentTab === 'audit' && <AuditLogView />}

        {currentTab === 'rbac' && <RbacMatrixView />}
      </main>

      {/* Comprehensive Ministry Footer */}
      <Footer />
    </div>
  );
};

export default App;
