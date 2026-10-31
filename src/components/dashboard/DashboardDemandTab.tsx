import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe2, Briefcase, TrendingUp, AlertCircle, ArrowRight, Layers } from "lucide-react";
import { GlobalDemand } from "@/types";
import { CountryDemandProgress, EmptyBreakdown } from "@/components/reports/ExecutiveDashboardBreakdowns";

interface DashboardDemandTabProps {
  demands: GlobalDemand[];
  demandByCountry: {
    country: string;
    demandCount: number;
    quota: number;
    filledQuota: number;
  }[];
  onOpenDrilldown: () => void;
  onNavigateModulD: () => void;
}

export function DashboardDemandTab({
  demands,
  demandByCountry,
  onOpenDrilldown,
  onNavigateModulD,
}: DashboardDemandTabProps) {
  const totalRequiredQuota = React.useMemo(
    () => demands.reduce((acc, d) => acc + (d.requiredQuota || 0), 0),
    [demands]
  );
  const totalFilledQuota = React.useMemo(
    () => demands.reduce((acc, d) => acc + (d.filledQuota || 0), 0),
    [demands]
  );
  const quotaGap = Math.max(0, totalRequiredQuota - totalFilledQuota);
  const fillPercentage = totalRequiredQuota > 0 ? Math.round((totalFilledQuota / totalRequiredQuota) * 100) : 0;

  const demandBySector = React.useMemo(() => {
    const map = new Map<string, { count: number; quota: number }>();
    demands.forEach((d) => {
      const sector = d.sector || "Lainnya";
      const current = map.get(sector) ?? { count: 0, quota: 0 };
      map.set(sector, {
        count: current.count + 1,
        quota: current.quota + (d.requiredQuota || 0),
      });
    });
    return Array.from(map, ([sector, data]) => ({ sector, ...data })).sort((a, b) => b.quota - a.quota);
  }, [demands]);

  return (
    <div className="space-y-6">
      {/* Subpage Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-primary/5 to-transparent border border-amber-500/20">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <Globe2 className="w-3.5 h-3.5" />
            <span>Pilar 4: Permintaan Pasar Global (Demand)</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Peta Kebutuhan Tenaga Kerja Internasional
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            Permintaan slot kerja luar negeri tervalidasi via SISKOP2MI dan perjanjian kerja sama bilateral (G2G, P to P).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onOpenDrilldown} className="text-xs">
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Rincian Demand
          </Button>
          <Button size="sm" onClick={onNavigateModulD} className="text-xs">
            Buka Modul Permintaan Tenaga Kerja
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* 4 Quantitative Demand Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
            Permintaan Terverifikasi
          </span>
          <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">
            {demands.length.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Paket kerja aktif</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wider block">
            Target Kuota PMI
          </span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {totalRequiredQuota.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Slot posisi terbuka</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider block">
            Realisasi Terpenuhi
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {totalFilledQuota.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
            {fillPercentage}% tercapai
          </span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-rose-600 dark:text-rose-400 font-medium uppercase tracking-wider block">
            Kekurangan / Gap
          </span>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
            {quotaGap.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Perlu percepatan matching</span>
        </Card>
      </div>

      {/* Demand per Country Table & Sektor Summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Demand Tervalidasi per Negara Tujuan</span>
              <span className="text-xs font-normal text-muted-foreground">
                {demandByCountry.length} Negara
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Perbandingan kuota target vs kuota terisi pada masing-masing negara mitra.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {demandByCountry.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[360px] text-left text-sm">
                  <thead className="border-b text-muted-foreground">
                    <tr>
                      <th scope="col" className="pb-2 pr-3 font-medium">Negara tujuan</th>
                      <th scope="col" className="pb-2 px-3 text-right font-medium">Permintaan</th>
                      <th scope="col" className="pb-2 px-3 text-right font-medium">Target</th>
                      <th scope="col" className="pb-2 px-3 text-right font-medium">Terpenuhi</th>
                      <th scope="col" className="pb-2 pl-3 text-right font-medium">Capaian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {demandByCountry.map((item) => (
                      <tr key={item.country}>
                        <th scope="row" className="py-3 pr-3 font-medium text-foreground">{item.country}</th>
                        <td className="py-3 px-3 text-right tabular-nums">{item.demandCount.toLocaleString("id-ID")}</td>
                        <td className="py-3 px-3 text-right tabular-nums">{item.quota.toLocaleString("id-ID")}</td>
                        <td className="py-3 pl-3 text-right tabular-nums">{item.filledQuota.toLocaleString("id-ID")}</td>
                        <td className="py-3 pl-3 text-right">
                          <CountryDemandProgress target={item.quota} achieved={item.filledQuota} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyBreakdown message="Belum ada demand tervalidasi." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Permintaan Terbanyak per Sektor</CardTitle>
            <CardDescription className="text-xs">
              Prioritas bidang keahlian yang paling banyak diminta negara tujuan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {demandBySector.length > 0 ? (
              <div className="space-y-3">
                {demandBySector.map((item) => (
                  <div key={item.sector} className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground truncate">{item.sector}</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {item.quota.toLocaleString("id-ID")} slot
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {item.count} paket lowongan kerja
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyBreakdown message="Belum ada data sektor demand." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
