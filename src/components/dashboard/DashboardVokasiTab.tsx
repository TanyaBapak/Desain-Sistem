import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Globe2, ShieldCheck, CheckCircle2, ArrowRight, Layers } from "lucide-react";
import { VocationalProvider } from "@/types";
import {
  BreakdownBar,
  ProvinceRatioBar,
  EmptyBreakdown,
  ProvinceBreakdownItem,
} from "@/components/reports/ExecutiveDashboardBreakdowns";
import { InstitutionDirectory, InstitutionDirectoryItem } from "@/components/dashboard/InstitutionDirectory";
import { cn } from "@/lib/utils";

interface DashboardVokasiTabProps {
  providers: VocationalProvider[];
  nationalLpkCount: number;
  institutionsByProvince?: ProvinceBreakdownItem[];
  lpkByProvince?: ProvinceBreakdownItem[];
  nationalLpkByProvince?: ProvinceBreakdownItem[];
  institutionsByEvokasiStatus: { status: string; count: number }[];
  institutionDirectory: InstitutionDirectoryItem[];
  scopeName?: string;
  onOpenDrilldown: () => void;
  onOpenNationalDrilldown: () => void;
  onNavigateModulC: () => void;
}

export function DashboardVokasiTab({
  providers,
  nationalLpkCount,
  institutionsByProvince = [],
  lpkByProvince = [],
  nationalLpkByProvince = [],
  institutionsByEvokasiStatus,
  institutionDirectory,
  scopeName = "Wilayah Anda",
  onOpenDrilldown,
  onOpenNationalDrilldown,
  onNavigateModulC,
}: DashboardVokasiTabProps) {
  const [lpkScopeTab, setLpkScopeTab] = React.useState<"scope" | "national">("scope");

  const registeredVokasiCount = React.useMemo(
    () => providers.filter((p) => p.evokasiVerificationStatus === "Terverifikasi e-Vokasi").length,
    [providers]
  );

  const accreditedCount = React.useMemo(
    () => providers.filter((p) => p.accreditation && p.accreditation !== "-").length,
    [providers]
  );

  const institutionTotal = React.useMemo(
    () => institutionsByEvokasiStatus.reduce((total, item) => total + item.count, 0) || providers.length,
    [institutionsByEvokasiStatus, providers.length]
  );

  const activeLpkList = React.useMemo(() => {
    if (lpkScopeTab === "national" && nationalLpkByProvince.length > 0) {
      return nationalLpkByProvince;
    }
    return lpkByProvince.length > 0 ? lpkByProvince : institutionsByProvince;
  }, [lpkScopeTab, nationalLpkByProvince, lpkByProvince, institutionsByProvince]);

  const lpkProvinceMax = React.useMemo(
    () => Math.max(0, ...activeLpkList.map((item) => item.totalCount)),
    [activeLpkList]
  );

  return (
    <div className="space-y-6">
      {/* Subpage Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent border border-emerald-500/20">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <Building2 className="w-3.5 h-3.5" />
            <span>Pilar 3: Ekosistem Penyelenggara Diklat (Vokasi / LPK)</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Kesiapan Lembaga Vokasi & Balai Latihan Kerja
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            Verifikasi kelayakan fasilitas, rasio instruktur bersertifikat, akreditasi, dan keselarasan dengan e-Vokasi.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onOpenDrilldown} className="text-xs">
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Rincian Lembaga
          </Button>
          <Button size="sm" onClick={onNavigateModulC} className="text-xs">
            Buka Modul Lembaga Vokasi
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* 4 Quantitative Vokasi Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
            Lembaga Wilayah
          </span>
          <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">
            {providers.length.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Lingkup {scopeName}</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider block">
            Terverifikasi e-Vokasi
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {registeredVokasiCount.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            {providers.length > 0 ? `${Math.round((registeredVokasiCount / providers.length) * 100)}% kepatuhan verifikasi` : "0%"}
          </span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider block">
            Lembaga Terdaftar Nasional
          </span>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
            {nationalLpkCount.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Seluruh 38 Provinsi</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium uppercase tracking-wider block">
            Terakreditasi Resmi
          </span>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
            {accreditedCount.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Akreditasi A / B / Unggul</span>
        </Card>
      </div>

      {/* Visual Breakdowns: Evokasi Status & Province Ratio Bars */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Status Integrasi e-Vokasi</span>
              <span className="text-xs font-normal text-muted-foreground">
                {institutionTotal.toLocaleString("id-ID")} Lembaga
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Kesiapan status hukum, izin operasional balai, dan sinkronisasi feeder data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {institutionsByEvokasiStatus.length > 0 ? (
              <div className="space-y-4">
                {institutionsByEvokasiStatus.map((item) => (
                  <BreakdownBar
                    key={item.status}
                    label={item.status}
                    value={item.count}
                    total={institutionTotal}
                  />
                ))}
              </div>
            ) : (
              <EmptyBreakdown message="Belum ada data status e-Vokasi." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
            <div>
              <CardTitle className="text-base">Sebaran Lembaga per Provinsi</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Perbandingan lembaga terdaftar vs total lembaga per wilayah.
              </CardDescription>
            </div>
            <div className="flex items-center rounded-lg border border-border p-0.5 text-xs bg-muted/40 shrink-0">
              <button
                type="button"
                onClick={() => setLpkScopeTab("scope")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-all text-xs",
                  lpkScopeTab === "scope"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Lingkup
              </button>
              <button
                type="button"
                onClick={() => setLpkScopeTab("national")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-all text-xs",
                  lpkScopeTab === "national"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Nasional
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {activeLpkList.length > 0 ? (
              <div className="space-y-4">
                {activeLpkList.map((item) => (
                  <ProvinceRatioBar
                    key={item.province}
                    label={item.province}
                    registered={item.registeredCount}
                    total={item.totalCount}
                    maxTotal={lpkProvinceMax}
                    unitLabel="lembaga"
                  />
                ))}
              </div>
            ) : (
              <EmptyBreakdown message="Sebaran lembaga per provinsi akan tampil setelah data tersedia." />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Embedded Searchable Institution Directory */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Direktori Lembaga Vokasi & LPK</h3>
          <span className="text-xs text-muted-foreground">Pencarian dan penelusuran akreditasi</span>
        </div>
        <InstitutionDirectory
          institutions={institutionDirectory}
          totalCount={providers.length}
          scopeLabel={scopeName}
        />
      </div>
    </div>
  );
}
