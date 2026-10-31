"use client";

import * as React from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  Globe2,
  Workflow,
  Clock,
  Sparkles,
} from "lucide-react";
import { STAKEHOLDER_ROLES, getRoleInfo } from "@/lib/stakeholder-roles";
import { cn } from "@/lib/utils";
import {
  DashboardDrilldownModal,
  DrilldownType,
} from "@/components/dashboard/DashboardDrilldownModal";
import { InstitutionDirectoryItem } from "@/components/dashboard/InstitutionDirectory";
import { calculateDashboardBreakdowns } from "@/components/dashboard/dashboard-breakdowns-calc";
import { DashboardOverviewTab } from "@/components/dashboard/DashboardOverviewTab";
import { DashboardSupplyTab } from "@/components/dashboard/DashboardSupplyTab";
import { DashboardProgramTab } from "@/components/dashboard/DashboardProgramTab";
import { DashboardVokasiTab } from "@/components/dashboard/DashboardVokasiTab";
import { DashboardDemandTab } from "@/components/dashboard/DashboardDemandTab";
import { DashboardMatchingTab } from "@/components/dashboard/DashboardMatchingTab";

export type DashboardSubTab = "ringkasan" | "supply" | "program" | "vokasi" | "demand" | "matching";

interface DashboardPageProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  nationalLpkCount: number;
  nationalLpkByProvince?: { province: string; totalCount: number; registeredCount: number }[];
  accessibleTabs?: string[];
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  setCurrentTab,
  nationalLpkCount,
  nationalLpkByProvince,
  accessibleTabs,
}) => {
  const { candidates, programs, providers, demands, allocations, currentUser, currentRole, currentScope } =
    useAppStore();

  const [activeDrilldown, setActiveDrilldown] = React.useState<DrilldownType | null>(null);

  // Initialize sub-tab from URL search param if present, default to 'ringkasan'
  const [activeSubTab, setActiveSubTab] = React.useState<DashboardSubTab>(() => {
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("subtab");
      if (param && ["ringkasan", "supply", "program", "vokasi", "demand", "matching"].includes(param)) {
        return param as DashboardSubTab;
      }
    }
    return "ringkasan";
  });

  const handleSubTabChange = React.useCallback((tab: DashboardSubTab) => {
    setActiveSubTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("subtab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const roleObj = getRoleInfo(currentRole);
  const stakeholder = STAKEHOLDER_ROLES.find((r) => r.id === currentRole);

  const lpkProviders = React.useMemo(
    () =>
      providers.filter(
        (p) =>
          p.providerType === "LPK" ||
          p.providerType?.toUpperCase().includes("LPK") ||
          p.providerType === "BLKLN"
      ),
    [providers]
  );

  const institutionDirectory = React.useMemo<InstitutionDirectoryItem[]>(
    () =>
      providers
        .slice()
        .sort((left, right) => (right.operationalReadinessScore ?? -1) - (left.operationalReadinessScore ?? -1))
        .map((provider) => ({
          id: provider.id,
          name: provider.name,
          type: provider.providerType,
          province: provider.provinsi,
          district: provider.kabupatenKota,
          accreditation: provider.accreditation || null,
          evokasiStatus: provider.evokasiVerificationStatus,
          classCount: provider.classCount ?? null,
          readyParticipantCount: provider.readyParticipantCount ?? null,
        })),
    [providers]
  );

  const dashboardBreakdowns = React.useMemo(
    () => calculateDashboardBreakdowns(candidates, demands, providers, lpkProviders, nationalLpkByProvince),
    [candidates, demands, providers, lpkProviders, nationalLpkByProvince]
  );

  const subTabItems = [
    { id: "ringkasan", label: "Ringkasan Eksekutif", icon: LayoutDashboard },
    { id: "supply", label: "Supply (Pencari Kerja)", icon: Users, count: candidates.length },
    { id: "program", label: "Program Pelatihan", icon: GraduationCap, count: programs.length },
    { id: "vokasi", label: "Lembaga Vokasi / LPK", icon: Building2, count: providers.length },
    { id: "demand", label: "Demand Luar Negeri", icon: Globe2, count: demands.length },
    { id: "matching", label: "Pencocokan & Alokasi", icon: Workflow, count: allocations.length },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Command Center Master Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dashboard Command Center
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              SMK Go Global
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Selamat datang, <strong className="text-foreground">{currentUser?.name}</strong> ({roleObj?.title}). Lingkup:{" "}
            <span className="font-semibold text-foreground">{currentScope?.name ?? "Wilayah Kerja"}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card/60 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>Pembaruan: Real-time</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs (Page-based Views) */}
      <nav
        aria-label="Pilar Command Center"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border no-scrollbar"
      >
        {subTabItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSubTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSubTabChange(item.id)}
              className={cn(
                "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all select-none border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
              {"count" in item && typeof item.count === "number" && (
                <span
                  className={cn(
                    "ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {item.count.toLocaleString("id-ID")}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Main Tab Content Panels */}
      {activeSubTab === "ringkasan" && (
        <DashboardOverviewTab
          candidates={candidates}
          programs={programs}
          providers={providers}
          demands={demands}
          allocations={allocations}
          nationalLpkCount={nationalLpkCount}
          scopeName={currentScope?.name}
          stakeholder={stakeholder}
          roleTitle={roleObj?.title}
          onSelectTab={handleSubTabChange}
          onOpenDrilldown={setActiveDrilldown}
          onNavigateModul={setCurrentTab}
          accessibleTabs={accessibleTabs}
        />
      )}

      {activeSubTab === "supply" && (
        <DashboardSupplyTab
          candidates={candidates}
          candidatesByProvince={dashboardBreakdowns.candidatesByProvince}
          candidateLifecycle={dashboardBreakdowns.candidateLifecycle}
          onOpenDrilldown={() => setActiveDrilldown("peserta")}
          onNavigateModulA={() => setCurrentTab("modul-a")}
        />
      )}

      {activeSubTab === "program" && (
        <DashboardProgramTab
          programs={programs}
          onOpenDrilldown={() => setActiveDrilldown("program")}
          onNavigateModulB={() => setCurrentTab("modul-b")}
        />
      )}

      {activeSubTab === "vokasi" && (
        <DashboardVokasiTab
          providers={providers}
          nationalLpkCount={nationalLpkCount}
          institutionsByProvince={dashboardBreakdowns.institutionsByProvince}
          lpkByProvince={dashboardBreakdowns.lpkByProvince}
          nationalLpkByProvince={nationalLpkByProvince}
          institutionsByEvokasiStatus={dashboardBreakdowns.institutionsByEvokasiStatus}
          institutionDirectory={institutionDirectory}
          scopeName={currentScope?.name}
          onOpenDrilldown={() => setActiveDrilldown("lembaga")}
          onOpenNationalDrilldown={() => setActiveDrilldown("national_lpk")}
          onNavigateModulC={() => setCurrentTab("modul-c")}
        />
      )}

      {activeSubTab === "demand" && (
        <DashboardDemandTab
          demands={demands}
          demandByCountry={dashboardBreakdowns.demandByCountry}
          onOpenDrilldown={() => setActiveDrilldown("demand")}
          onNavigateModulD={() => setCurrentTab("modul-d")}
        />
      )}

      {activeSubTab === "matching" && (
        <DashboardMatchingTab
          candidates={candidates}
          demands={demands}
          allocations={allocations}
          onOpenDrilldown={() => setActiveDrilldown("alokasi")}
          onNavigateMatching={() => setCurrentTab("matching")}
          onNavigateSippmi={() => setCurrentTab("sippmi-monitoring")}
        />
      )}

      {/* Drill-Down Details Modal */}
      {activeDrilldown && (
        <DashboardDrilldownModal
          type={activeDrilldown}
          onClose={() => setActiveDrilldown(null)}
          scopeName={currentScope?.name ?? "Lingkup Anda"}
          nationalLpkCount={nationalLpkCount}
          nationalLpkByProvince={nationalLpkByProvince}
          providers={providers}
          candidates={candidates}
          programs={programs}
          demands={demands}
          allocations={allocations}
        />
      )}
    </div>
  );
};
