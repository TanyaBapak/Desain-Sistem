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

interface DashboardPageProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  nationalLpkCount: number;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentTab,
  setCurrentTab,
  nationalLpkCount,
}) => {
  const { candidates, programs, providers, demands, allocations, currentUser, currentRole, currentScope } =
    useAppStore();

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
      demandByCountry: Array.from(demandByCountry, ([country, summary]) => ({ country, ...summary }))
        .sort((left, right) => right.quota - left.quota),
    };
  }, [candidates, demands, providers]);

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
        />
        <StatCard
          label="Program Pelatihan"
          value={programs.length}
          icon={GraduationCap}
          desc="Program pada katalog Anda"
        />
        <StatCard
          label="Lembaga Vokasi (LPK)"
          value={providers.length}
          icon={Building2}
          desc="Mitra penyelenggara"
        />
        <StatCard
          label="LPK Terdaftar Nasional"
          value={nationalLpkCount}
          icon={Building2}
          desc="Seluruh Indonesia"
        />
        <StatCard
          label="Demand Luar Negeri"
          value={demands.length}
          icon={Globe2}
          desc="Lowongan kerja LN"
        />
        <StatCard
          label="Alokasi Penempatan"
          value={allocations.length}
          icon={Workflow}
          desc="Batch sudah dialokasi"
        />
      </div>

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

function StatCard({ label, value, icon: Icon, desc }: { label: string; value: number; icon: React.ElementType; desc: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-3">
        <div>
          <CardTitle className="text-sm font-semibold">{label}</CardTitle>
          <CardDescription className="text-xs">{desc}</CardDescription>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value.toLocaleString("id-ID")}</div>
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
