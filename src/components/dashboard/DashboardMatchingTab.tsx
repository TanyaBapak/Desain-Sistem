import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Workflow, CheckCircle2, TrendingUp, Monitor, ArrowRight, Layers, Sparkles } from "lucide-react";
import { CandidateParticipant, GlobalDemand, ProgramAllocationDecision } from "@/types";
import { ProcessStages } from "@/components/dashboard/ProcessStages";

interface DashboardMatchingTabProps {
  candidates: CandidateParticipant[];
  demands: GlobalDemand[];
  allocations: ProgramAllocationDecision[];
  onOpenDrilldown: () => void;
  onNavigateMatching: () => void;
  onNavigateSippmi: () => void;
}

export function DashboardMatchingTab({
  candidates,
  demands,
  allocations,
  onOpenDrilldown,
  onNavigateMatching,
  onNavigateSippmi,
}: DashboardMatchingTabProps) {
  const readyCandidates = React.useMemo(
    () => candidates.filter((c) => c.readinessStatus === "Ready for Placement").length,
    [candidates]
  );

  const totalDemandQuota = React.useMemo(
    () => demands.reduce((acc, d) => acc + (d.requiredQuota || 0), 0),
    [demands]
  );

  const matchingPotential = Math.min(readyCandidates, totalDemandQuota);

  return (
    <div className="space-y-6">
      {/* Subpage Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-primary/5 to-transparent border border-purple-500/20">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
            <Workflow className="w-3.5 h-3.5" />
            <span>Integrasi & Analisis: Pencocokan dan Penempatan</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Smart Matching Engine & Alokasi Penempatan
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            Pencocokan algoritmik kualifikasi peserta (Modul A), program vokasi (Modul B), dan spesifikasi lowongan kerja luar negeri (Modul D).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onOpenDrilldown} className="text-xs">
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Rincian Alokasi
          </Button>
          <Button size="sm" onClick={onNavigateMatching} className="text-xs">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Buka Matching Engine
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* 4 Quantitative Matching Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
            Batch Teralokasi
          </span>
          <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">
            {allocations.length.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">SK kuota penetapan</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider block">
            Kandidat Siap Kerja
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {readyCandidates.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Telah tersertifikasi</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wider block">
            Target Demand Kuota
          </span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {totalDemandQuota.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Slot posisi internasional</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wider block">
            Potensi Kecocokan Segera
          </span>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1 tabular-nums">
            {matchingPotential.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            {totalDemandQuota > 0 ? `${Math.round((matchingPotential / totalDemandQuota) * 100)}% demand tercover` : "0%"}
          </span>
        </Card>
      </div>

      {/* 6 Process Stages Pipeline */}
      <ProcessStages />

      {/* Additional Quick Link to SIPPMI Monitoring */}
      <Card className="p-5 border-l-4 border-primary bg-primary/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              Pemantauan Lapangan & Progres Kelas (SIPPMI)
            </h3>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Pantau absensi harian, realisasi Jam Pelajaran (JP), modul teknis, dan verifikasi sertifikasi di gardata.sippmi.com.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onNavigateSippmi} className="shrink-0 text-xs">
            Buka Pemantauan SIPPMI &rarr;
          </Button>
        </div>
      </Card>
    </div>
  );
}
