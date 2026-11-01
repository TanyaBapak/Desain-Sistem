import React, { useMemo } from "react";
import {
  Users,
  GraduationCap,
  Building2,
  Globe2,
  Layers,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Activity,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { PublicDrilldownType } from "@/components/landing/PublicDrilldownModal";

interface PublicSystemMetricsProps {
  onOpenDrilldown: (type: PublicDrilldownType) => void;
  className?: string;
}

export function PublicSystemMetrics({ onOpenDrilldown, className }: PublicSystemMetricsProps) {
  const { candidates, programs, providers, demands, allocations } = useAppStore();

  const TARGET_SUPPLY = 12600;
  const TARGET_PROGRAM = 630;
  const TARGET_VOKASI = 2382;
  const TARGET_DEMAND_COUNTRIES = 4;

  const actualCandidates = candidates?.length ?? 0;
  const actualPrograms = programs?.length ?? 0;
  const actualProviders = providers?.length ?? 0;
  const actualDemands = demands?.length ?? 0;
  const actualAllocations = allocations?.length ?? 0;

  // 1. Supply Calculation
  const readyForPlacementCount = useMemo(
    () => candidates?.filter((c) => c.readinessStatus === "Ready for Placement").length ?? 0,
    [candidates]
  );
  const upskillingCount = useMemo(
    () => candidates?.filter((c) => c.readinessStatus === "Needs Upskilling").length ?? 0,
    [candidates]
  );
  const verifiedCandidateCount = useMemo(
    () => candidates?.filter((c) => c.verificationStatus === "Verified").length ?? 0,
    [candidates]
  );
  const supplyPct = Math.round((actualCandidates / TARGET_SUPPLY) * 100);

  // 2. Program Calculation
  const totalTrainingQuota = useMemo(
    () => programs?.reduce((acc, p) => acc + (p.quota || 0), 0) ?? 0,
    [programs]
  );
  const programPct = Math.round((actualPrograms / TARGET_PROGRAM) * 100);

  // 3. Vokasi Calculation
  const evokasiVerifiedCount = useMemo(
    () => providers?.filter((p) => p.evokasiVerificationStatus === "Terverifikasi e-Vokasi").length ?? 0,
    [providers]
  );
  const vokasiPct = Math.round((actualProviders / TARGET_VOKASI) * 100);

  // 4. Demand Calculation
  const totalDemandQuota = useMemo(
    () => demands?.reduce((acc, d) => acc + (d.requiredQuota || 0), 0) ?? 0,
    [demands]
  );
  const uniqueCountries = useMemo(() => {
    const set = new Set((demands || []).map((d) => d.country).filter(Boolean));
    return set.size || (actualDemands > 0 ? Math.min(actualDemands, 4) : 0);
  }, [demands, actualDemands]);
  const demandPct = Math.round((uniqueCountries / TARGET_DEMAND_COUNTRIES) * 100);

  return (
    <div className="space-y-6">
      {/* 4 Quantitative Pillar Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PILAR 1: SUPPLY */}
        <Card className="rounded-2xl border border-blue-500/30 bg-white dark:bg-slate-900/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
          <CardHeader className="p-4 sm:p-5 pb-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                1. Supply
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Users className="h-4 w-4" />
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground font-medium">Calon Peserta Siap Latih</div>
              <div className="text-2xl font-black text-foreground mt-0.5 tabular-nums">
                {actualCandidates.toLocaleString("id-ID")}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  / {TARGET_SUPPLY.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Ketercapaian</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">{supplyPct}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(3, supplyPct))}%` }}
                />
              </div>
            </div>

            {/* Breakdown item */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-[11px]">
              <div>
                <span className="text-muted-foreground block text-[10px]">Siap Penempatan</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {readyForPlacementCount.toLocaleString("id-ID")}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Perlu Diklat</span>
                <span className="font-bold text-foreground tabular-nums">
                  {upskillingCount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </CardHeader>

          <div className="p-4 sm:p-5 pt-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenDrilldown("peserta")}
              className="w-full text-xs font-semibold h-8 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/10 cursor-pointer justify-between"
            >
              <span>Buka Data Supply</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>

        {/* PILAR 2: PROGRAM PELATIHAN */}
        <Card className="rounded-2xl border border-indigo-500/30 bg-white dark:bg-slate-900/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
          <CardHeader className="p-4 sm:p-5 pb-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                2. Program Pelatihan
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground font-medium">Kurikulum & Pemenuhan JP</div>
              <div className="text-2xl font-black text-foreground mt-0.5 tabular-nums">
                {actualPrograms.toLocaleString("id-ID")}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  / {TARGET_PROGRAM.toLocaleString("id-ID")} Kelas
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Ketercapaian</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{programPct}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(3, programPct))}%` }}
                />
              </div>
            </div>

            {/* Breakdown item */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-[11px]">
              <div>
                <span className="text-muted-foreground block text-[10px]">Kapasitas Kuota</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {totalTrainingQuota.toLocaleString("id-ID")} Kursi
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Cakupan Sektor</span>
                <span className="font-bold text-foreground tabular-nums">5 Sektor Utama</span>
              </div>
            </div>
          </CardHeader>

          <div className="p-4 sm:p-5 pt-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenDrilldown("program")}
              className="w-full text-xs font-semibold h-8 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10 cursor-pointer justify-between"
            >
              <span>Buka Program Pelatihan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>

        {/* PILAR 3: VOKASI DAN LEMBAGA */}
        <Card className="rounded-2xl border border-emerald-500/30 bg-white dark:bg-slate-900/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
          <CardHeader className="p-4 sm:p-5 pb-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                3. Vokasi dan Lembaga
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <Building2 className="h-4 w-4" />
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground font-medium">Kesiapan Balai e-Vokasi & BLK</div>
              <div className="text-2xl font-black text-foreground mt-0.5 tabular-nums">
                {actualProviders.toLocaleString("id-ID")}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  / {TARGET_VOKASI.toLocaleString("id-ID")} Vokasi
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Ketercapaian</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{vokasiPct}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(3, vokasiPct))}%` }}
                />
              </div>
            </div>

            {/* Breakdown item */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-[11px]">
              <div>
                <span className="text-muted-foreground block text-[10px]">Terverifikasi</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {evokasiVerifiedCount.toLocaleString("id-ID")} Balai
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Cakupan Wilayah</span>
                <span className="font-bold text-foreground tabular-nums">38 Provinsi</span>
              </div>
            </div>
          </CardHeader>

          <div className="p-4 sm:p-5 pt-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenDrilldown("lembaga")}
              className="w-full text-xs font-semibold h-8 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer justify-between"
            >
              <span>Buka Vokasi & Lembaga</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>

        {/* PILAR 4: DEMAND */}
        <Card className="rounded-2xl border border-amber-500/30 bg-white dark:bg-slate-900/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
          <CardHeader className="p-4 sm:p-5 pb-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                4. Demand
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Globe2 className="h-4 w-4" />
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground font-medium">Permintaan Luar Negeri</div>
              <div className="text-2xl font-black text-foreground mt-0.5 tabular-nums">
                4
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  Negara Mitra
                </span>
              </div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium truncate mt-0.5">
                Turki, Jepang, Malaysia, Korea
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Kemitraan Negara</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">100%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full transition-all duration-500"
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* Breakdown item */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-[11px]">
              <div>
                <span className="text-muted-foreground block text-[10px]">Total Slot Order</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                  {totalDemandQuota.toLocaleString("id-ID")} Slot
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Jalur Kerja Sama</span>
                <span className="font-bold text-foreground text-[10.5px] truncate block">
                  G2G / P2P Resmi
                </span>
              </div>
            </div>
          </CardHeader>

          <div className="p-4 sm:p-5 pt-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenDrilldown("demand")}
              className="w-full text-xs font-semibold h-8 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer justify-between"
            >
              <span>Buka Data Demand</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Rangkuman Komparasi Data Sistem Riil */}
      <Card className="rounded-2xl border border-border/80 bg-slate-50/50 dark:bg-slate-900/40 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold text-foreground">
                Perhitungan Agregat Data Aktual Sistem Task Force
              </h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Konsolidasi data riil yang tercatat di database terhadap target penetapan program nasional.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
              Sinkronisasi Real-Time
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 text-center">
          <div className="p-3 rounded-xl bg-card border border-border/70">
            <span className="text-[11px] text-muted-foreground block font-medium">1. Data Supply Aktual</span>
            <span className="text-xl font-bold text-foreground block mt-0.5 tabular-nums">
              {actualCandidates.toLocaleString("id-ID")}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
              {readyForPlacementCount} siap diberangkatkan
            </span>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border/70">
            <span className="text-[11px] text-muted-foreground block font-medium">2. Kelas Pelatihan</span>
            <span className="text-xl font-bold text-foreground block mt-0.5 tabular-nums">
              {actualPrograms.toLocaleString("id-ID")}
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold block mt-0.5">
              {totalTrainingQuota.toLocaleString("id-ID")} kuota kursi
            </span>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border/70">
            <span className="text-[11px] text-muted-foreground block font-medium">3. Vokasi dan Lembaga</span>
            <span className="text-xl font-bold text-foreground block mt-0.5 tabular-nums">
              {actualProviders.toLocaleString("id-ID")}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
              {evokasiVerifiedCount} balai terverifikasi
            </span>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border/70">
            <span className="text-[11px] text-muted-foreground block font-medium">4. Demand Luar Negeri</span>
            <span className="text-xl font-bold text-foreground block mt-0.5 tabular-nums">
              4 Negara Mitra
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">
              {totalDemandQuota.toLocaleString("id-ID")} slot (Turki, Jepang, Malaysia, Korea)
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
