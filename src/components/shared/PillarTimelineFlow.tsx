import React, { useState, useMemo } from "react";
import {
  Users,
  GraduationCap,
  Building2,
  Globe2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/store/useAppStore";

export interface TimelineStage {
  id: string;
  stepNumber: number;
  pillarKey?: "sup" | "pel" | "lpk" | "dem" | "matching";
  title: string;
  subtitle: string;
  tag: string;
  desc: string;
  icon: React.ElementType;
  metricLabel: string;
  metricValue: string;
  status: "completed" | "active" | "ready";
  colorClass: string;
  badgeBg: string;
}

interface PillarTimelineFlowProps {
  className?: string;
  onStageChange?: (stageId: string, pillarKey?: string) => void;
  onOpenFull?: (stageId: string, pillarKey?: string) => void;
  onSelectStage?: (stageId: string, pillarKey?: string) => void;
}

export function PillarTimelineFlow({
  className,
  onStageChange,
  onOpenFull,
  onSelectStage,
}: PillarTimelineFlowProps) {
  const [activeStageId, setActiveStageId] = useState<string>("supply");
  const { candidates, programs, providers, demands } = useAppStore();

  const TARGET_SUPPLY = 12600;
  const TARGET_PROGRAM = 630;
  const TARGET_VOKASI = 2382;
  const TARGET_DEMAND_COUNTRIES = 4;

  const actualCandidates = candidates?.length ?? 0;
  const actualPrograms = programs?.length ?? 0;
  const actualProviders = providers?.length ?? 0;
  const actualDemands = demands?.length ?? 0;

  const totalDemandQuota = useMemo(
    () => demands?.reduce((acc, d) => acc + (d.requiredQuota || 0), 0) ?? 0,
    [demands]
  );

  const uniqueCountries = useMemo(() => {
    const set = new Set((demands || []).map((d) => d.country).filter(Boolean));
    return set.size || (actualDemands > 0 ? Math.min(actualDemands, 4) : 0);
  }, [demands, actualDemands]);

  const stages = useMemo<TimelineStage[]>(() => [
    {
      id: "supply",
      stepNumber: 1,
      pillarKey: "sup",
      title: "1. Supply",
      subtitle: "Calon Peserta Siap Latih",
      tag: "Penjaringan",
      desc: "Penjaringan dari Disnaker, SMK, & BP3MI. Validasi NIK dan kesiapan latar belakang keahlian.",
      icon: Users,
      metricLabel: "Target: 12.600",
      metricValue: actualCandidates > 0
        ? `${actualCandidates.toLocaleString("id-ID")} (${Math.round((actualCandidates / TARGET_SUPPLY) * 100)}%)`
        : "12.600 Peserta",
      status: "completed",
      colorClass: "text-blue-600 dark:text-blue-400 border-blue-500/40 bg-blue-500/10",
      badgeBg: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    },
    {
      id: "pelatihan",
      stepNumber: 2,
      pillarKey: "pel",
      title: "2. Program Pelatihan",
      subtitle: "Kurikulum & Pemenuhan JP",
      tag: "Standardisasi",
      desc: "Pembelajaran terstruktur (320-400 JP), bahasa asing (N4/A2), dan sertifikasi kompetensi (SSW/JIS/BNSP).",
      icon: GraduationCap,
      metricLabel: "Target: 630 Kelas",
      metricValue: actualPrograms > 0
        ? `${actualPrograms.toLocaleString("id-ID")} (${Math.round((actualPrograms / TARGET_PROGRAM) * 100)}%)`
        : "630 Kelas (5 Sektor)",
      status: "active",
      colorClass: "text-indigo-600 dark:text-indigo-400 border-indigo-500/40 bg-indigo-500/10",
      badgeBg: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    },
    {
      id: "vokasi",
      stepNumber: 3,
      pillarKey: "lpk",
      title: "3. Vokasi dan Lembaga",
      subtitle: "Kesiapan Balai e-Vokasi",
      tag: "Fasilitas",
      desc: "Verifikasi sarana bengkel kerja, instruktur berlisensi, akreditasi, dan kesiapan kapasitas kelas.",
      icon: Building2,
      metricLabel: "Target: 2.382 Vokasi",
      metricValue: actualProviders > 0
        ? `${actualProviders.toLocaleString("id-ID")} (${Math.round((actualProviders / TARGET_VOKASI) * 100)}%)`
        : "2.382 Vokasi",
      status: "ready",
      colorClass: "text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
      badgeBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    },
    {
      id: "demand",
      stepNumber: 4,
      pillarKey: "dem",
      title: "4. Demand",
      subtitle: "Permintaan Luar Negeri",
      tag: "Order Kerja",
      desc: "Validasi kebutuhan pekerja migran resmi via G2G/P2P untuk 4 negara mitra: Turki, Jepang, Malaysia, Korea.",
      icon: Globe2,
      metricLabel: "Target: 4 Negara",
      metricValue: actualDemands > 0
        ? `${uniqueCountries} Mitra (${totalDemandQuota.toLocaleString("id-ID")} Slot)`
        : "4 Negara (Turki, Jepang...)",
      status: "ready",
      colorClass: "text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/10",
      badgeBg: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    },
  ], [actualCandidates, actualPrograms, actualProviders, actualDemands, uniqueCountries, totalDemandQuota]);

  const handleCardClick = (stage: TimelineStage) => {
    // Switch active stage and immediately open the full modal / drilldown
    setActiveStageId(stage.id);
    onStageChange?.(stage.id, stage.pillarKey);
    const triggerFn = onOpenFull || onSelectStage;
    triggerFn?.(stage.id, stage.pillarKey);
  };

  return (
    <div className={cn("rounded-2xl border border-border bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm space-y-4", className)}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Alur Ekosistem SMK Go Global: Hulu ke Hilir
            </h3>
            <p className="text-xs text-muted-foreground">
              Rantai proses terpadu dari penjaringan talenta hingga penempatan luar negeri.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground shrink-0">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Alur Terhubung Real-Time
          </span>
        </div>
      </div>

      {/* Animated Timeline Stepper Nodes */}
      <div className="relative">
        {/* Animated Connecting Flow Beam Line (Desktop) */}
        <div className="hidden lg:block absolute top-6 left-8 right-8 h-1 bg-muted rounded-full overflow-hidden z-0">
          <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 via-emerald-500 to-amber-500 rounded-full animate-pulse opacity-80" />
        </div>

        {/* Stages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
          {stages.map((stage) => {
            const Icon = stage.icon;
            const isSelected = stage.id === activeStageId;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => handleCardClick(stage)}
                className={cn(
                  "p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between group",
                  isSelected
                    ? "border-primary bg-blue-50/90 dark:bg-slate-800 shadow-md ring-2 ring-primary/30 scale-[1.02]"
                    : "border-border bg-white dark:bg-slate-900 hover:border-primary/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 shadow-xs"
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs transition-transform group-hover:scale-110",
                        stage.colorClass
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                        stage.badgeBg
                      )}
                    >
                      {stage.tag}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {stage.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                    {stage.subtitle}
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground font-medium">{stage.metricLabel}:</span>
                  <span className="font-bold text-foreground tabular-nums">{stage.metricValue}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
