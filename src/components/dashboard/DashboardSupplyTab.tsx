import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, GraduationCap, MapPin, ArrowRight, Layers } from "lucide-react";
import { CandidateParticipant } from "@/types";
import { BreakdownBar, EmptyBreakdown } from "@/components/reports/ExecutiveDashboardBreakdowns";

interface DashboardSupplyTabProps {
  candidates: CandidateParticipant[];
  candidatesByProvince: { province: string; count: number }[];
  candidateLifecycle: { status: string; count: number }[];
  onOpenDrilldown: () => void;
  onNavigateModulA: () => void;
}

const lifecycleLabels: Record<string, string> = {
  DRAFT: "Draf",
  SUBMITTED: "Diajukan",
  IN_REVIEW: "Dalam pemeriksaan",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

export function DashboardSupplyTab({
  candidates,
  candidatesByProvince,
  candidateLifecycle,
  onOpenDrilldown,
  onNavigateModulA,
}: DashboardSupplyTabProps) {
  const readyForPlacementCount = React.useMemo(
    () => candidates.filter((c) => c.readinessStatus === "Ready for Placement").length,
    [candidates]
  );
  const needsUpskillingCount = React.useMemo(
    () => candidates.filter((c) => c.readinessStatus === "Needs Upskilling").length,
    [candidates]
  );
  const verifiedCount = React.useMemo(
    () => candidates.filter((c) => c.verificationStatus === "Verified").length,
    [candidates]
  );

  const lifecycleTotal = React.useMemo(
    () => candidateLifecycle.reduce((total, item) => total + item.count, 0) || candidates.length,
    [candidateLifecycle, candidates.length]
  );

  const provinceMax = React.useMemo(
    () => Math.max(0, ...candidatesByProvince.map((item) => item.count)),
    [candidatesByProvince]
  );

  return (
    <div className="space-y-6">
      {/* Subpage Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-primary/5 to-transparent border border-blue-500/20">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
            <Users className="w-3.5 h-3.5" />
            <span>Pilar 1: Pasokan Talenta Vokasi (Supply)</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Bank Data Calon Peserta & Pencari Kerja
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            Pemetaan calon tenaga kerja siap latih dari Disnaker, SMK, dan lembaga vokasi dengan verifikasi profil kompetensi terintegrasi.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onOpenDrilldown} className="text-xs">
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Rincian Peserta
          </Button>
          <Button size="sm" onClick={onNavigateModulA} className="text-xs">
            Buka Modul Pencari Kerja
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* 4 Quantitative Supply Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
            Total Terdata
          </span>
          <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">
            {candidates.length.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Seluruh basis data</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider block">
            Siap Penempatan
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {readyForPlacementCount.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Kompetensi teruji</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wider block">
            Butuh Upskilling
          </span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {needsUpskillingCount.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Kandidat masuk diklat</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider block">
            Terverifikasi NIK
          </span>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
            {verifiedCount.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Data tervalidasi</span>
        </Card>
      </div>

      {/* Visual Breakdowns: Lifecycle & Province Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Status Verifikasi & Siklus Data</span>
              <span className="text-xs font-normal text-muted-foreground">
                {lifecycleTotal.toLocaleString("id-ID")} entri
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Distribusi tahap administrasi calon peserta pada sistem Task Force.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {candidateLifecycle.length > 0 ? (
              <div className="space-y-4">
                {candidateLifecycle.map((item) => (
                  <BreakdownBar
                    key={item.status}
                    label={lifecycleLabels[item.status] ?? item.status}
                    value={item.count}
                    total={lifecycleTotal}
                  />
                ))}
              </div>
            ) : (
              <EmptyBreakdown message="Belum ada data calon peserta tercatat." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Sebaran Peserta per Provinsi</span>
              <span className="text-xs font-normal text-muted-foreground">8 Wilayah Terbanyak</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Konsentrasi asal domisili peserta siap latih di seluruh Indonesia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {candidatesByProvince.length > 0 ? (
              <div className="space-y-4">
                {candidatesByProvince.map((item) => (
                  <BreakdownBar
                    key={item.province}
                    label={item.province}
                    value={item.count}
                    total={provinceMax}
                    showPercent={false}
                  />
                ))}
              </div>
            ) : (
              <EmptyBreakdown message="Sebaran wilayah akan tampil setelah data peserta tersedia." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
