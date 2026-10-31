import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Users, GraduationCap, Building2, Globe2, Workflow, ChevronRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicCommandCenterStats } from "@/types";
import { PublicDrilldownType } from "@/components/landing/PublicDrilldownModal";
import type { PublicCCTab } from "@/components/landing/PublicCommandCenterPillars";

interface PublicPillarOverviewProps {
  stats: PublicCommandCenterStats;
  programsCount: number;
  sectorsCount: number;
  onSelectTab: (tab: PublicCCTab) => void;
  onOpenDrilldown: (type: PublicDrilldownType) => void;
}

export function PublicPillarOverview({
  stats,
  programsCount,
  sectorsCount,
  onSelectTab,
  onOpenDrilldown,
}: PublicPillarOverviewProps) {
  return (
    <div className="space-y-6">
      {/* 6 Tipe Drill-down Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
        {/* 1. Calon Peserta */}
        <PublicPillarCard
          pillar="supply"
          pillarLabel="Tipe: Peserta"
          label="Calon Peserta"
          value={stats.candidatesCount}
          desc="Pencari kerja terdata cakupan nasional"
          badge="Nasional"
          icon={Users}
          onOpenTab={() => onSelectTab("peserta")}
          onDrilldown={() => onOpenDrilldown("peserta")}
        />

        {/* 2. Program Pelatihan */}
        <PublicPillarCard
          pillar="program"
          pillarLabel="Tipe: Program"
          label="Program Pelatihan"
          value={programsCount}
          desc={`${sectorsCount} sektor kejuruan terdaftar`}
          badge={`${sectorsCount} Sektor`}
          icon={GraduationCap}
          onOpenTab={() => onSelectTab("program")}
          onDrilldown={() => onOpenDrilldown("program")}
        />

        {/* 3. Lembaga Vokasi */}
        <PublicPillarCard
          pillar="vokasi"
          pillarLabel="Tipe: Lembaga"
          label="Lembaga Vokasi"
          value={stats.registeredProvidersCount}
          desc="Mitra diklat terverifikasi e-Vokasi"
          badge="e-Vokasi"
          icon={Building2}
          onOpenTab={() => onSelectTab("lembaga")}
          onDrilldown={() => onOpenDrilldown("lembaga")}
        />

        {/* 4. LPK Nasional */}
        <PublicPillarCard
          pillar="vokasi"
          pillarLabel="Tipe: LPK Nasional"
          label="LPK Terdaftar Nasional"
          value={stats.nationalLpkCount}
          desc="Balai latihan kerja 38 provinsi"
          badge="38 Provinsi"
          icon={Building2}
          onOpenTab={() => onSelectTab("national_lpk")}
          onDrilldown={() => onOpenDrilldown("national_lpk")}
        />

        {/* 5. Demand Luar Negeri */}
        <PublicPillarCard
          pillar="demand"
          pillarLabel="Tipe: Demand"
          label="Lowongan Luar Negeri"
          value={stats.demandsCount}
          desc="Order lowongan via SISKOP2MI"
          badge="SISKOP2MI"
          icon={Globe2}
          onOpenTab={() => onSelectTab("demand")}
          onDrilldown={() => onOpenDrilldown("demand")}
        />

        {/* 6. Alokasi Penempatan */}
        <PublicPillarCard
          pillar="alokasi"
          pillarLabel="Tipe: Alokasi"
          label="Alokasi Penempatan"
          value={stats.allocationsCount}
          desc="Batch SK kuota siap penempatan"
          badge="Tahap 4"
          icon={Workflow}
          onOpenTab={() => onSelectTab("alokasi")}
          onDrilldown={() => onOpenDrilldown("alokasi")}
        />
      </div>

      {/* Matriks Keseimbangan Ekosistem Task Force */}
      <Card className="border border-border/80 shadow-xs overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/60 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-1">
                <Activity className="w-3.5 h-3.5" />
                <span>Pusat Kendali Pengendalian SMK Go Global (Publik)</span>
              </div>
              <CardTitle className="text-base font-bold text-foreground">
                Keseimbangan Ekosistem Nasional (Supply ↔ Program ↔ Vokasi ↔ Demand ↔ Alokasi)
              </CardTitle>
              <CardDescription className="text-xs">
                Klik salah satu pilar untuk mengeksplorasi data drill-down penelusuran wilayah, kurikulum, dan lembaga.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <button
              type="button"
              onClick={() => onOpenDrilldown("peserta")}
              className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition text-center group cursor-pointer"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
                1. Pasokan Siap Latih
              </span>
              <span className="text-2xl font-black text-foreground block mt-1 tabular-nums group-hover:text-blue-600 transition-colors">
                {stats.candidatesCount.toLocaleString("id-ID")}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Drill-down Peserta &rarr;
              </span>
            </button>

            <button
              type="button"
              onClick={() => onOpenDrilldown("program")}
              className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 transition text-center group cursor-pointer"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block">
                2. Katalog Program
              </span>
              <span className="text-2xl font-black text-foreground block mt-1 tabular-nums group-hover:text-indigo-600 transition-colors">
                {programsCount.toLocaleString("id-ID")}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Drill-down Program &rarr;
              </span>
            </button>

            <button
              type="button"
              onClick={() => onOpenDrilldown("lembaga")}
              className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition text-center group cursor-pointer"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                3. Lembaga e-Vokasi
              </span>
              <span className="text-2xl font-black text-foreground block mt-1 tabular-nums group-hover:text-emerald-600 transition-colors">
                {stats.registeredProvidersCount.toLocaleString("id-ID")}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Drill-down Lembaga &rarr;
              </span>
            </button>

            <button
              type="button"
              onClick={() => onOpenDrilldown("demand")}
              className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition text-center group cursor-pointer"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                4. Demand Luar Negeri
              </span>
              <span className="text-2xl font-black text-foreground block mt-1 tabular-nums group-hover:text-amber-600 transition-colors">
                {stats.demandsCount.toLocaleString("id-ID")}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Drill-down Demand &rarr;
              </span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PublicPillarCard({
  pillar,
  pillarLabel,
  label,
  value,
  desc,
  badge,
  icon: Icon,
  onOpenTab,
  onDrilldown,
}: {
  pillar: "supply" | "program" | "vokasi" | "demand" | "alokasi";
  pillarLabel: string;
  label: string;
  value: number;
  desc: string;
  badge?: string;
  icon: React.ElementType;
  onOpenTab: () => void;
  onDrilldown: () => void;
}) {
  const colorMap = {
    supply: "text-blue-600 bg-blue-500/10 border-blue-500/20",
    program: "text-indigo-600 bg-indigo-500/10 border-indigo-500/20",
    vokasi: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    demand: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    alokasi: "text-purple-600 bg-purple-500/10 border-purple-500/20",
  };

  return (
    <Card className="flex flex-col justify-between p-4 border-border bg-card shadow-xs hover:border-primary/50 transition-all group">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border", colorMap[pillar])}>
            {pillarLabel}
          </span>
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0", colorMap[pillar])}>
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-2.5">
          <CardTitle className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {label}
          </CardTitle>
          <CardDescription className="text-xs line-clamp-1">{desc}</CardDescription>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-2xl font-bold tabular-nums text-foreground">
            {value.toLocaleString("id-ID")}
          </div>
          {badge && (
            <Badge variant="outline" className={cn("text-[11px] font-semibold", colorMap[pillar])}>
              {badge}
            </Badge>
          )}
        </div>

        <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={onOpenTab}
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline text-xs cursor-pointer"
          >
            <span>Sub-Halaman</span>
            <ChevronRight className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onDrilldown}
            className="text-[11px] text-muted-foreground hover:text-foreground font-medium underline-offset-2 hover:underline ml-auto cursor-pointer"
          >
            Rincian &rarr;
          </button>
        </div>
      </div>
    </Card>
  );
}
