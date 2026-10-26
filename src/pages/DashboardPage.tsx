"use client";

import * as React from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  ExecutiveDashboardBreakdowns,
  ExecutiveDashboardBreakdownsData,
} from "@/components/reports/ExecutiveDashboardBreakdowns";
import { ProcessStages } from "@/components/dashboard/ProcessStages";
import { InstitutionDirectory, InstitutionDirectoryItem } from "@/components/dashboard/InstitutionDirectory";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, Building2, Globe2, Workflow, Monitor } from "lucide-react";
import { STAKEHOLDER_ROLES } from "@/lib/stakeholder-roles";
import { cn } from "@/lib/utils";
import {
  DashboardDrilldownModal,
  DrilldownType,
} from "@/components/dashboard/DashboardDrilldownModal";

interface DashboardPageProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  nationalLpkCount: number;
  nationalLpkByProvince?: { province: string; totalCount: number; registeredCount: number }[];
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentTab,
  setCurrentTab,
  nationalLpkCount,
  nationalLpkByProvince,
}) => {
  const { candidates, programs, providers, demands, allocations, currentUser, currentRole, currentScope } =
    useAppStore();

  const [activeDrilldown, setActiveDrilldown] = React.useState<DrilldownType | null>(null);

  const registeredVokasiCount = React.useMemo(
    () => providers.filter((p) => p.evokasiVerificationStatus === "Terverifikasi e-Vokasi").length,
    [providers]
  );
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
  const registeredLpkCount = React.useMemo(
    () => lpkProviders.filter((p) => p.evokasiVerificationStatus === "Terverifikasi e-Vokasi").length,
    [lpkProviders]
  );

  const roleObj = getRoleInfo(currentRole);
  const stakeholder = STAKEHOLDER_ROLES.find((r) => r.id === currentRole);
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
    [providers],
  );

  const dashboardBreakdowns = React.useMemo<ExecutiveDashboardBreakdownsData>(() => {
    const countBy = <T,>(items: T[], getKey: (item: T) => string) => {
      const counts = new Map<string, number>();
      items.forEach((item) => {
        const key = getKey(item);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      });
      return Array.from(counts, ([status, count]) => ({ status, count }));
    };

    const calculateProvinceBreakdown = (items: typeof providers) => {
      const map = new Map<string, { totalCount: number; registeredCount: number }>();
      items.forEach((item) => {
        const prov = item.provinsi || "Belum dipetakan";
        const current = map.get(prov) ?? { totalCount: 0, registeredCount: 0 };
        const isRegistered = item.evokasiVerificationStatus === "Terverifikasi e-Vokasi";
        map.set(prov, {
          totalCount: current.totalCount + 1,
          registeredCount: current.registeredCount + (isRegistered ? 1 : 0),
        });
      });
      return Array.from(map, ([province, stats]) => ({
        province,
        totalCount: stats.totalCount,
        registeredCount: stats.registeredCount,
      }))
        .sort((a, b) => b.totalCount - a.totalCount)
        .slice(0, 8);
    };

    const institutionsByProvince = calculateProvinceBreakdown(providers);
    const lpkByProvince = calculateProvinceBreakdown(lpkProviders);

    const demandByCountry = new Map<string, { demandCount: number; quota: number; filledQuota: number }>();

    demands.forEach((demand) => {
      const country = demand.country || "Belum ditentukan";
      const current = demandByCountry.get(country) ?? { demandCount: 0, quota: 0, filledQuota: 0 };
      demandByCountry.set(country, {
        demandCount: current.demandCount + 1,
        quota: current.quota + demand.requiredQuota,
        filledQuota: current.filledQuota + demand.filledQuota,
      });
    });

    return {
      candidateLifecycle: countBy(candidates, (candidate) => candidate.lifecycleStatus ?? "Belum ditentukan"),
      candidatesByProvince: countBy(candidates, (candidate) => candidate.provinsi || "Belum dipetakan")
        .map(({ status, count }) => ({ province: status, count }))
        .sort((left, right) => right.count - left.count)
        .slice(0, 8),
      institutionsByEvokasiStatus: countBy(providers, (provider) => provider.evokasiVerificationStatus),
      institutionsByProvince,
      lpkByProvince,
      nationalLpkByProvince,
      demandByCountry: Array.from(demandByCountry, ([country, summary]) => ({ country, ...summary }))
        .sort((left, right) => right.quota - left.quota),
    };
  }, [candidates, demands, providers, lpkProviders, nationalLpkByProvince]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Command Center</h1>
          <p className="text-sm text-muted-foreground">
            Selamat datang, <strong>{currentUser?.name}</strong> ({roleObj?.title}). Lingkup:{" "}
            <span className="font-medium">{currentScope?.name}</span>
          </p>
        </div>
      </div>
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
        <StatCard
          label="Calon Peserta"
          value={candidates.length}
          icon={Users}
          desc="Seluruh peserta pada lingkup Anda"
          onClick={() => setActiveDrilldown("peserta")}
        />
        <StatCard
          label="Program Pelatihan"
          value={programs.length}
          icon={GraduationCap}
          desc="Program pada katalog Anda"
          onClick={() => setActiveDrilldown("program")}
        />
        <StatCard
          label="Lembaga Vokasi (LPK)"
          value={providers.length}
          badge={`${registeredVokasiCount.toLocaleString("id-ID")} Terdaftar`}
          icon={Building2}
          desc="Mitra penyelenggara"
          onClick={() => setActiveDrilldown("lembaga")}
        />
        <StatCard
          label="LPK Terdaftar Nasional"
          value={nationalLpkCount}
          badge="Seluruh RI"
          icon={Building2}
          desc="Seluruh Indonesia"
          onClick={() => setActiveDrilldown("national_lpk")}
        />
        <StatCard
          label="Demand Luar Negeri"
          value={demands.length}
          icon={Globe2}
          desc="Lowongan kerja LN"
          onClick={() => setActiveDrilldown("demand")}
        />
        <StatCard
          label="Alokasi Penempatan"
          value={allocations.length}
          icon={Workflow}
          desc="Batch sudah dialokasi"
          onClick={() => setActiveDrilldown("alokasi")}
        />
      </div>

      <DashboardDrilldownModal
        type={activeDrilldown}
        onClose={() => setActiveDrilldown(null)}
        scopeName={currentScope?.name ?? "Lingkup Anda"}
        nationalLpkCount={nationalLpkCount}
        providers={providers}
        candidates={candidates}
        programs={programs}
        demands={demands}
        allocations={allocations}
      />

      <ExecutiveDashboardBreakdowns data={dashboardBreakdowns} />
      <InstitutionDirectory
        institutions={institutionDirectory}
        totalCount={providers.length}
        scopeLabel={currentScope?.name ?? "lingkup Anda"}
      />

      {/* Role context info */}
      {stakeholder && (
        <Card className="border-l-4 border-primary bg-primary/5">
          <CardHeader className="flex flex-row items-center gap-3 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
              {stakeholder.name.charAt(0)}
            </div>
            <div>
              <CardTitle className="text-sm font-bold">{stakeholder.name}</CardTitle>
              <CardDescription className="text-xs">{stakeholder.responsibility}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span><span className="font-semibold text-foreground">Lingkup:</span> {stakeholder.scope}</span>
              <span><span className="font-semibold text-foreground">Kelompok:</span> {stakeholder.group}</span>
              <Badge variant="outline">Hak akses: {getRoleInfo(currentRole).accessibleModules.length} modul</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <ProcessStages />

      {/* Quick actions */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          title="Input Calon Peserta (Modul A)"
          desc="Disnaker / LPK input data pencari kerja"
          icon={Users}
          onClick={() => setCurrentTab("modul-a")}
        />
        <QuickActionCard
          title="Kelola Program (Modul B)"
          desc="Direktorat menetapkan kurikulum & kuota"
          icon={GraduationCap}
          onClick={() => setCurrentTab("modul-b")}
        />
        <QuickActionCard
          title="Monitoring SIPPMI (T4-6)"
          desc="Batch, kehadiran, JP, sertifikasi & penempatan"
          icon={Monitor}
          onClick={() => setCurrentTab("sippmi-monitoring")}
        />
      </section>
    </div>
  );
};

function StatCard({
  label,
  value,
  icon: Icon,
  desc,
  badge,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  desc: string;
  badge?: string;
  onClick?: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "transition-all duration-200 select-none",
        onClick &&
          "cursor-pointer hover:border-primary/60 hover:shadow-md hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
        <div>
          <CardTitle className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {label}
          </CardTitle>
          <CardDescription className="text-xs">{desc}</CardDescription>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-2xl font-bold tabular-nums text-foreground">{value.toLocaleString("id-ID")}</div>
          {badge && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 tabular-nums">
              {badge}
            </span>
          )}
        </div>
        {onClick && (
          <p className="mt-2 text-[11px] font-medium text-primary flex items-center gap-1 group-hover:underline">
            Klik untuk melihat detail &rarr;
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionCard({ title, desc, icon: Icon, onClick }: { title: string; desc: string; icon: React.ElementType; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className="h-auto w-full justify-start gap-3 whitespace-normal rounded-xl border border-border bg-card p-4 text-left text-foreground shadow-sm hover:bg-muted"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
        <div className="flex-1">
          <CardTitle className="text-sm font-bold">{title}</CardTitle>
          <CardDescription className="text-xs">{desc}</CardDescription>
        </div>
    </Button>
  );
}

function getRoleInfo(role: string) {
  const mockRoles: Record<string, { title: string; accessibleModules: string[] }> = {
    superadmin: { title: "Super Admin / Pusdatin", accessibleModules: ["overview", "modul-a", "modul-b", "modul-c", "modul-d", "matching", "approvals", "audit", "rbac"] },
    pimpinan: { title: "Menteri / Pimpinan", accessibleModules: ["overview", "modul-a", "modul-b", "modul-c", "modul-d", "matching", "audit", "rbac"] },
    taskforce: { title: "Admin Task Force Nasional", accessibleModules: ["overview", "modul-a", "modul-b", "modul-c", "modul-d", "matching", "approvals", "audit", "rbac"] },
    disnaker: { title: "Admin Disnaker Kab/Kota", accessibleModules: ["overview", "modul-a", "modul-b", "modul-c", "modul-d", "matching", "approvals", "rbac"] },
    vokasi: { title: "Admin Lembaga Vokasi", accessibleModules: ["overview", "modul-c", "modul-b", "modul-a", "modul-d", "matching", "approvals", "rbac"] },
    demand: { title: "Admin Demand / Pemberi Kerja", accessibleModules: ["overview", "modul-d", "matching", "approvals", "rbac"] },
    verifikator: { title: "Verifikator Data & Dokumen", accessibleModules: ["overview", "modul-a", "modul-b", "modul-c", "modul-d", "matching", "approvals", "audit", "rbac"] },
    matching: { title: "Admin Matching & Penempatan", accessibleModules: ["overview", "modul-a", "modul-b", "modul-c", "modul-d", "matching", "approvals", "audit", "rbac"] },
    bp3mi: { title: "Admin BP3MI", accessibleModules: ["overview", "modul-a", "modul-b", "modul-c", "modul-d", "matching", "approvals", "audit", "rbac"] },
    direktorat: { title: "Direktorat PKV PMI", accessibleModules: ["overview", "modul-a", "modul-b", "modul-c", "modul-d", "matching", "approvals", "audit", "rbac"] },
  };
  return mockRoles[role] || mockRoles.superadmin;
}
