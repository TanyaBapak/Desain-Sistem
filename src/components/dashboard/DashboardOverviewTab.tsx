import * as React from "react";
import { Users, GraduationCap, Building2, Globe2, Workflow, ArrowRight, ShieldCheck, Activity, Monitor } from "lucide-react";
import { CandidateParticipant, GlobalDemand, ProgramAllocationDecision, TrainingProgram, VocationalProvider } from "@/types";
import { DashboardPillarCard } from "@/components/dashboard/DashboardPillarCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { ProcessStages } from "@/components/dashboard/ProcessStages";
import { StakeholderRoleItem } from "@/lib/stakeholder-roles";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { SectorGapList } from "@/components/shared/SectorGapList";
import { PillarTimelineFlow } from "@/components/shared/PillarTimelineFlow";

interface DashboardOverviewTabProps {
  candidates: CandidateParticipant[];
  programs: TrainingProgram[];
  providers: VocationalProvider[];
  demands: GlobalDemand[];
  allocations: ProgramAllocationDecision[];
  nationalLpkCount: number;
  scopeName?: string;
  stakeholder?: StakeholderRoleItem;
  roleTitle?: string;
  onSelectTab: (tab: "ringkasan" | "supply" | "program" | "vokasi" | "demand" | "matching") => void;
  onOpenDrilldown: (type: "lembaga" | "peserta" | "program" | "national_lpk" | "demand" | "alokasi") => void;
  onNavigateModul: (moduleTab: string) => void;
  accessibleTabs?: string[];
}

export function DashboardOverviewTab({
  candidates,
  programs,
  providers,
  demands,
  allocations,
  nationalLpkCount,
  scopeName = "Wilayah Anda",
  stakeholder,
  roleTitle,
  onSelectTab,
  onOpenDrilldown,
  onNavigateModul,
  accessibleTabs,
}: DashboardOverviewTabProps) {
  const registeredVokasiCount = React.useMemo(
    () => providers.filter((p) => p.evokasiVerificationStatus === "Terverifikasi e-Vokasi").length,
    [providers]
  );

  const readyCandidatesCount = React.useMemo(
    () => candidates.filter((c) => c.readinessStatus === "Ready for Placement").length,
    [candidates]
  );

  const totalDemandQuota = React.useMemo(
    () => demands.reduce((acc, d) => acc + (d.requiredQuota || 0), 0),
    [demands]
  );

  const totalTrainingQuota = React.useMemo(
    () => programs.reduce((acc, p) => acc + (p.quota || 0), 0),
    [programs]
  );

  const handleStageSelect = (stageId: string) => {
    switch (stageId) {
      case "supply":
        onSelectTab("supply");
        break;
      case "pelatihan":
        onSelectTab("program");
        break;
      case "vokasi":
        onSelectTab("vokasi");
        break;
      case "demand":
        onSelectTab("demand");
        break;
      case "penempatan":
        onSelectTab("matching");
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Animated Pipeline / Timeline Flow (Supply -> Demand -> Penempatan) */}
      <PillarTimelineFlow onSelectStage={handleStageSelect} />

      {/* 4 Pilar Utama Command Center KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
        {/* Pilar 1: Supply */}
        <DashboardPillarCard
          pillar="supply"
          pillarLabel="Pilar 1: Supply"
          label="Calon Peserta"
          value={candidates.length}
          desc="Pencari kerja terdata di sistem"
          badge={`${readyCandidatesCount} Siap`}
          icon={Users}
          onOpenPage={() => onSelectTab("supply")}
          pageActionLabel="Buka Tab Supply"
          onDrilldown={() => onOpenDrilldown("peserta")}
        />

        {/* Pilar 2: Program */}
        <DashboardPillarCard
          pillar="program"
          pillarLabel="Pilar 2: Program"
          label="Program Pelatihan"
          value={programs.length}
          desc="Katalog kurikulum kejuruan"
          badge={`${totalTrainingQuota} Kuota`}
          icon={GraduationCap}
          onOpenPage={() => onSelectTab("program")}
          pageActionLabel="Buka Tab Program"
          onDrilldown={() => onOpenDrilldown("program")}
        />

        {/* Pilar 3: Vokasi */}
        <DashboardPillarCard
          pillar="vokasi"
          pillarLabel="Pilar 3: Vokasi / LPK"
          label="Lembaga Wilayah"
          value={providers.length}
          desc={`Mitra diklat lingkup ${scopeName}`}
          badge={`${registeredVokasiCount} Terverifikasi`}
          icon={Building2}
          progressPercent={providers.length > 0 ? (registeredVokasiCount / providers.length) * 100 : 0}
          progressLabel={`${registeredVokasiCount} / ${providers.length} Terverifikasi`}
          onOpenPage={() => onSelectTab("vokasi")}
          pageActionLabel="Buka Tab Vokasi"
          onDrilldown={() => onOpenDrilldown("lembaga")}
        />

        {/* Lembaga Nasional */}
        <DashboardPillarCard
          pillar="vokasi"
          pillarLabel="Nasional"
          label="Lembaga Nasional"
          value={nationalLpkCount}
          desc="Seluruh wilayah Indonesia"
          badge="38 Provinsi"
          icon={Building2}
          onOpenPage={() => onSelectTab("vokasi")}
          pageActionLabel="Lihat Sebaran LPK"
          onDrilldown={() => onOpenDrilldown("national_lpk")}
        />

        {/* Pilar 4: Demand */}
        <DashboardPillarCard
          pillar="demand"
          pillarLabel="Pilar 4: Demand"
          label="Lowongan Luar Negeri"
          value={demands.length}
          desc="Order kebutuhan pekerja migran"
          badge={`${totalDemandQuota} Slot`}
          icon={Globe2}
          onOpenPage={() => onSelectTab("demand")}
          pageActionLabel="Buka Tab Demand"
          onDrilldown={() => onOpenDrilldown("demand")}
        />

        {/* Matching / Alokasi */}
        <DashboardPillarCard
          pillar="matching"
          pillarLabel="Matching"
          label="Alokasi Penempatan"
          value={allocations.length}
          desc="Batch yang telah dialokasikan"
          badge="Tahap 4"
          icon={Workflow}
          onOpenPage={() => onSelectTab("matching")}
          pageActionLabel="Buka Tab Matching"
          onDrilldown={() => onOpenDrilldown("alokasi")}
        />
      </div>

      {/* Keseimbangan 4 Pilar (Supply vs Program vs Vokasi vs Demand) */}
      <Card className="border border-border/80 shadow-xs overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/60 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-1">
                <Activity className="w-3.5 h-3.5" />
                <span>Analisis Keseimbangan Ekosistem Task Force</span>
              </div>
              <CardTitle className="text-base font-bold text-foreground">
                Korelasi 4 Pilar Utama (Supply ↔ Program ↔ Vokasi ↔ Demand)
              </CardTitle>
              <CardDescription className="text-xs">
                Memastikan ketersediaan pencari kerja dan daya tampung pelatihan selaras dengan permintaan luar negeri.
              </CardDescription>
            </div>

            <Button
              size="sm"
              onClick={() => onNavigateModul("matching")}
              className="text-xs font-semibold shrink-0"
            >
              <Workflow className="w-3.5 h-3.5 mr-1.5" />
              Mulai Simulasi Matching
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
                1. Pasokan Siap Latih
              </span>
              <span className="text-2xl font-black text-foreground block mt-1 tabular-nums">
                {candidates.length.toLocaleString("id-ID")}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                {readyCandidatesCount} siap penempatan
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block">
                2. Kapasitas Program
              </span>
              <span className="text-2xl font-black text-foreground block mt-1 tabular-nums">
                {totalTrainingQuota.toLocaleString("id-ID")}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                {programs.length} kurikulum terdaftar
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                3. Lembaga Penyelenggara
              </span>
              <span className="text-2xl font-black text-foreground block mt-1 tabular-nums">
                {providers.length.toLocaleString("id-ID")}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                {registeredVokasiCount} terverifikasi e-Vokasi
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                4. Demand Luar Negeri
              </span>
              <span className="text-2xl font-black text-foreground block mt-1 tabular-nums">
                {totalDemandQuota.toLocaleString("id-ID")}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                {demands.length} lowongan diverifikasi
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kesenjangan Supply vs Demand per Sektor */}
      <SectorGapList />

      {/* Role Context Info Banner */}
      {stakeholder && (
        <Card className="border-l-4 border-primary bg-primary/5">
          <CardHeader className="flex flex-row items-center gap-3 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-xs">
              {stakeholder.name.charAt(0)}
            </div>
            <div>
              <CardTitle className="text-sm font-bold">{stakeholder.name}</CardTitle>
              <CardDescription className="text-xs">{stakeholder.responsibility}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>
                <strong className="text-foreground">Lingkup:</strong> {stakeholder.scope}
              </span>
              <span>
                <strong className="text-foreground">Kelompok:</strong> {stakeholder.group}
              </span>
              <Badge variant="outline" className="text-xs">
                Peran: {roleTitle || stakeholder.name}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 6 Process Stages Pipeline */}
      <ProcessStages />

      {/* Quick Action Navigation Grid */}
      <DashboardQuickActions
        accessibleTabs={accessibleTabs}
        onNavigateModul={onNavigateModul}
      />
    </div>
  );
}
