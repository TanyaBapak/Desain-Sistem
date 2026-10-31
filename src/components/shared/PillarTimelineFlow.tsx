import React, { useState } from "react";
import {
  Users,
  GraduationCap,
  Building2,
  Globe2,
  Workflow,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

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

const STAGES: TimelineStage[] = [
  {
    id: "supply",
    stepNumber: 1,
    pillarKey: "sup",
    title: "1. Supply",
    subtitle: "Calon Peserta Siap Latih",
    tag: "Penjaringan",
    desc: "Penjaringan dari Disnaker, SMK, & BP3MI. Validasi NIK dan kesiapan latar belakang keahlian.",
    icon: Users,
    metricLabel: "Terdata Nasional",
    metricValue: "12.600 Peserta",
    status: "completed",
    colorClass: "text-blue-600 dark:text-blue-400 border-blue-500/40 bg-blue-500/10",
    badgeBg: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  },
  {
    id: "pelatihan",
    stepNumber: 2,
    pillarKey: "pel",
    title: "2. Pelatihan",
    subtitle: "Kurikulum & Pemenuhan JP",
    tag: "Standardisasi",
    desc: "Pembelajaran terstruktur (320-400 JP), bahasa asing (N4/A2), dan sertifikasi kompetensi (SSW/JIS/BNSP).",
    icon: GraduationCap,
    metricLabel: "Katalog Kursus",
    metricValue: "3.998 Program",
    status: "active",
    colorClass: "text-indigo-600 dark:text-indigo-400 border-indigo-500/40 bg-indigo-500/10",
    badgeBg: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
  },
  {
    id: "vokasi",
    stepNumber: 3,
    pillarKey: "lpk",
    title: "3. LPK & Vokasi",
    subtitle: "Kesiapan Balai e-Vokasi",
    tag: "Fasilitas",
    desc: "Verifikasi sarana bengkel kerja, instruktur berlisensi, akreditasi, dan kesiapan kapasitas kelas.",
    icon: Building2,
    metricLabel: "Lembaga Terverifikasi",
    metricValue: "2.382 Mitra",
    status: "ready",
    colorClass: "text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
    badgeBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
  {
    id: "demand",
    stepNumber: 4,
    pillarKey: "dem",
    title: "4. Demand",
    subtitle: "Lowongan Kerja Global",
    tag: "Order Kerja",
    desc: "Validasi kebutuhan pemberi kerja luar negeri via SISKOP2MI dan perjanjian G to G / P to P resmi.",
    icon: Globe2,
    metricLabel: "Kebutuhan Terbuka",
    metricValue: "1.330 Kuota",
    status: "ready",
    colorClass: "text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/10",
    badgeBg: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  {
    id: "penempatan",
    stepNumber: 5,
    pillarKey: "matching",
    title: "5. Penempatan",
    subtitle: "Matching & Keberangkatan",
    tag: "Hilirisasi",
    desc: "Pencocokan algoritmik skor kompetensi, seleksi employer, kontrak kerja legal, dan penerbitan visa.",
    icon: Workflow,
    metricLabel: "Batch Alokasi",
    metricValue: "12 Batch SK",
    status: "ready",
    colorClass: "text-purple-600 dark:text-purple-400 border-purple-500/40 bg-purple-500/10",
    badgeBg: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
  },
];

interface PillarTimelineFlowProps {
  className?: string;
  onSelectStage?: (stageId: string, pillarKey?: string) => void;
}

export function PillarTimelineFlow({ className, onSelectStage }: PillarTimelineFlowProps) {
  const [activeStageId, setActiveStageId] = useState<string>("supply");

  const currentStage = STAGES.find((s) => s.id === activeStageId) ?? STAGES[0];

  return (
    <div className={cn("rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-4", className)}>
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
          <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full animate-pulse opacity-80" />
        </div>

        {/* Stages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative z-10">
          {STAGES.map((stage) => {
            const Icon = stage.icon;
            const isSelected = stage.id === activeStageId;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => {
                  setActiveStageId(stage.id);
                  onSelectStage?.(stage.id, stage.pillarKey);
                }}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between group",
                  isSelected
                    ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-md ring-2 ring-primary/20 scale-[1.02]"
                    : "border-border bg-card/60 hover:bg-muted/50 hover:border-border/80"
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

                <div className="pt-2 mt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground font-medium">{stage.metricLabel}:</span>
                  <span className="font-bold text-foreground tabular-nums">{stage.metricValue}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Stage Detail Insight Card */}
      <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in-50 duration-200">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shrink-0 text-xs">
            {currentStage.stepNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-sm">{currentStage.title}</span>
              <span className="text-muted-foreground">—</span>
              <span className="font-semibold text-primary">{currentStage.subtitle}</span>
            </div>
            <p className="text-muted-foreground mt-0.5 leading-relaxed">{currentStage.desc}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelectStage?.(currentStage.id, currentStage.pillarKey)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition shrink-0 cursor-pointer self-start sm:self-center"
        >
          <span>Jelajahi Tahap Ini</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
