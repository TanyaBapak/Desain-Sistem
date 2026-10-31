import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Clock, Award, ArrowRight, Layers, CheckCircle2 } from "lucide-react";
import { TrainingProgram } from "@/types";
import { BreakdownBar, EmptyBreakdown } from "@/components/reports/ExecutiveDashboardBreakdowns";

interface DashboardProgramTabProps {
  programs: TrainingProgram[];
  onOpenDrilldown: () => void;
  onNavigateModulB: () => void;
}

export function DashboardProgramTab({
  programs,
  onOpenDrilldown,
  onNavigateModulB,
}: DashboardProgramTabProps) {
  const totalQuota = React.useMemo(
    () => programs.reduce((acc, p) => acc + (p.quota || 0), 0),
    [programs]
  );
  const totalEnrolled = React.useMemo(
    () => programs.reduce((acc, p) => acc + (p.enrolledCount || 0), 0),
    [programs]
  );
  const totalJP = React.useMemo(
    () => programs.reduce((acc, p) => acc + (p.durationJP || 0), 0),
    [programs]
  );

  const programsBySector = React.useMemo(() => {
    const map = new Map<string, number>();
    programs.forEach((p) => {
      const sector = p.targetSector || "Lainnya";
      map.set(sector, (map.get(sector) ?? 0) + 1);
    });
    return Array.from(map, ([sector, count]) => ({ sector, count })).sort((a, b) => b.count - a.count);
  }, [programs]);

  const sectorMax = React.useMemo(
    () => Math.max(0, ...programsBySector.map((s) => s.count)),
    [programsBySector]
  );

  const programsByCountry = React.useMemo(() => {
    const map = new Map<string, number>();
    programs.forEach((p) => {
      const country = p.targetCountry || "Belum Ditentukan";
      map.set(country, (map.get(country) ?? 0) + 1);
    });
    return Array.from(map, ([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count);
  }, [programs]);

  return (
    <div className="space-y-6">
      {/* Subpage Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-primary/5 to-transparent border border-indigo-500/20">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Pilar 2: Kurikulum & Program Pelatihan (Program)</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Katalog Pelatihan Terstandarisasi Luar Negeri
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            Kurikulum teknis terpadu, pemenuhan Jam Pelajaran (JP), dan sertifikasi kompetensi global (SSW, JIS, BNSP).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onOpenDrilldown} className="text-xs">
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Rincian Program
          </Button>
          <Button size="sm" onClick={onNavigateModulB} className="text-xs">
            Buka Modul Program Pelatihan
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* 4 Quantitative Program Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
            Total Program
          </span>
          <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">
            {programs.length.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Silabus aktif</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium uppercase tracking-wider block">
            Kapasitas Kuota Kursi
          </span>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
            {totalQuota.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Alokasi peserta pelatihan</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider block">
            Peserta Masuk Kelas
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {totalEnrolled.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            {totalQuota > 0 ? `${Math.round((totalEnrolled / totalQuota) * 100)}% kuota terisi` : "0%"}
          </span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider block">
            Akumulasi JP Pelatihan
          </span>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
            {totalJP.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Jam Pelajaran terstruktur</span>
        </Card>
      </div>

      {/* Program Distribution per Sector & Target Country */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Distribusi Program per Sektor Kejuruan</span>
              <span className="text-xs font-normal text-muted-foreground">
                {programsBySector.length} Sektor
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Konsentrasi bidang pelatihan kerja vokasi sesuai kebutuhan mitra internasional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {programsBySector.length > 0 ? (
              <div className="space-y-4">
                {programsBySector.map((item) => (
                  <BreakdownBar
                    key={item.sector}
                    label={item.sector}
                    value={item.count}
                    total={sectorMax}
                    showPercent={false}
                  />
                ))}
              </div>
            ) : (
              <EmptyBreakdown message="Belum ada program pelatihan yang tercatat." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Fokus Negara Tujuan Pelatihan</span>
              <span className="text-xs font-normal text-muted-foreground">
                {programsByCountry.length} Negara
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Distribusi kurikulum yang diselaraskan dengan standar pasar negara tujuan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {programsByCountry.length > 0 ? (
              <div className="space-y-4">
                {programsByCountry.map((item) => (
                  <div key={item.country} className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-medium text-sm text-foreground">{item.country}</span>
                    </div>
                    <span className="text-xs font-bold tabular-nums text-foreground bg-background px-2.5 py-1 rounded-md border border-border">
                      {item.count} Program
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyBreakdown message="Belum ada tujuan negara yang dipetakan." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
