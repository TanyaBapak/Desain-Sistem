import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InstitutionDirectoryItem } from "@/components/dashboard/InstitutionDirectory";
import { cn } from "@/lib/utils";

export interface ProvinceBreakdownItem {
  province: string;
  totalCount: number;
  registeredCount: number;
}

export interface ExecutiveDashboardBreakdownsData {
  candidateLifecycle: { status: string; count: number }[];
  candidatesByProvince: { province: string; count: number }[];
  institutionsByEvokasiStatus: { status: string; count: number }[];
  institutionsByProvince?: ProvinceBreakdownItem[];
  lpkByProvince?: ProvinceBreakdownItem[];
  nationalLpkByProvince?: ProvinceBreakdownItem[];
  institutionDirectory?: InstitutionDirectoryItem[];
  demandByCountry: {
    country: string;
    demandCount: number;
    quota: number;
    filledQuota: number;
  }[];
}

interface ExecutiveDashboardBreakdownsProps {
  data?: ExecutiveDashboardBreakdownsData;
}

const lifecycleLabels: Record<string, string> = {
  DRAFT: "Draf",
  SUBMITTED: "Diajukan",
  IN_REVIEW: "Dalam pemeriksaan",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

export function ExecutiveDashboardBreakdowns({ data }: ExecutiveDashboardBreakdownsProps) {
  const [lpkScopeTab, setLpkScopeTab] = useState<"scope" | "national">("scope");

  const lifecycleTotal = useMemo(
    () => data?.candidateLifecycle.reduce((total, item) => total + item.count, 0) ?? 0,
    [data],
  );
  const provinceMax = Math.max(0, ...(data?.candidatesByProvince.map((item) => item.count) ?? []));
  const institutionTotal = useMemo(
    () => data?.institutionsByEvokasiStatus.reduce((total, item) => total + item.count, 0) ?? 0,
    [data],
  );

  const vokasiProvinceMax = useMemo(
    () => Math.max(0, ...(data?.institutionsByProvince?.map((item) => item.totalCount) ?? [])),
    [data],
  );
  const totalVokasi = useMemo(
    () => data?.institutionsByProvince?.reduce((acc, curr) => acc + curr.totalCount, 0) ?? institutionTotal,
    [data, institutionTotal],
  );
  const totalRegisteredVokasi = useMemo(
    () =>
      data?.institutionsByProvince?.reduce((acc, curr) => acc + curr.registeredCount, 0) ??
      (data?.institutionsByEvokasiStatus?.find((s) => s.status === "Terverifikasi e-Vokasi")?.count ?? 0),
    [data],
  );

  const activeLpkList = useMemo(() => {
    if (lpkScopeTab === "national" && (data?.nationalLpkByProvince?.length ?? 0) > 0) {
      return data?.nationalLpkByProvince ?? [];
    }
    return data?.lpkByProvince ?? [];
  }, [lpkScopeTab, data]);

  const lpkProvinceMax = useMemo(
    () => Math.max(0, ...(activeLpkList.map((item) => item.totalCount) ?? [])),
    [activeLpkList],
  );
  const totalActiveLpk = useMemo(
    () => activeLpkList.reduce((acc, curr) => acc + curr.totalCount, 0),
    [activeLpkList],
  );
  const totalRegisteredActiveLpk = useMemo(
    () => activeLpkList.reduce((acc, curr) => acc + curr.registeredCount, 0),
    [activeLpkList],
  );

  return (
    <section className="space-y-3" aria-labelledby="dashboard-breakdowns-title">
      <div>
        <h2 id="dashboard-breakdowns-title" className="text-lg font-semibold text-foreground">
          Gambaran pelaksanaan
        </h2>
        <p className="text-sm text-muted-foreground">
          Rincian agregat tampil langsung di halaman, tanpa popup bertingkat.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status data calon peserta</CardTitle>
            <p className="text-sm text-muted-foreground">
              {lifecycleTotal.toLocaleString("id-ID")} data peserta
            </p>
          </CardHeader>
          <CardContent>
            {(data?.candidateLifecycle.length ?? 0) > 0 ? (
              <div className="space-y-4">
                {data?.candidateLifecycle.map((item) => (
                  <BreakdownBar
                    key={item.status}
                    label={lifecycleLabels[item.status] ?? item.status}
                    value={item.count}
                    total={lifecycleTotal}
                  />
                ))}
              </div>
            ) : (
              <EmptyBreakdown message="Belum ada data calon peserta." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sebaran peserta per provinsi</CardTitle>
            <p className="text-sm text-muted-foreground">Maksimal delapan wilayah dengan jumlah terbanyak</p>
          </CardHeader>
          <CardContent>
            {(data?.candidatesByProvince.length ?? 0) > 0 ? (
              <div className="space-y-4">
                {data?.candidatesByProvince.map((item) => (
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status lembaga e-Vokasi</CardTitle>
            <p className="text-sm text-muted-foreground">
              {institutionTotal.toLocaleString("id-ID")} lembaga aktif
            </p>
          </CardHeader>
          <CardContent>
            {(data?.institutionsByEvokasiStatus.length ?? 0) > 0 ? (
              <div className="space-y-4">
                {data?.institutionsByEvokasiStatus.map((item) => (
                  <BreakdownBar
                    key={item.status}
                    label={item.status}
                    value={item.count}
                    total={institutionTotal}
                  />
                ))}
              </div>
            ) : (
              <EmptyBreakdown message="Belum ada lembaga aktif untuk diringkas." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
            <div>
              <CardTitle className="text-base">Sebaran lembaga vokasi per provinsi</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {totalRegisteredVokasi.toLocaleString("id-ID")} terdaftar dari {totalVokasi.toLocaleString("id-ID")} lembaga aktif
              </p>
            </div>
            {totalVokasi > 0 && (
              <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 tabular-nums">
                {Math.round((totalRegisteredVokasi / (totalVokasi || 1)) * 100)}% Terverifikasi
              </span>
            )}
          </CardHeader>
          <CardContent>
            {(data?.institutionsByProvince?.length ?? 0) > 0 ? (
              <div className="space-y-4">
                {data?.institutionsByProvince?.map((item) => (
                  <ProvinceRatioBar
                    key={item.province}
                    label={item.province}
                    registered={item.registeredCount}
                    total={item.totalCount}
                    maxTotal={vokasiProvinceMax}
                    unitLabel="lembaga"
                  />
                ))}
                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-500 inline-block" />
                      Terverifikasi e-Vokasi
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-primary/25 dark:bg-primary/30 inline-block" />
                      Belum Terverifikasi
                    </span>
                  </div>
                  <span>Maksimal 8 wilayah</span>
                </div>
              </div>
            ) : (
              <EmptyBreakdown message="Sebaran lembaga vokasi per provinsi akan tampil setelah data tersedia." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
            <div>
              <CardTitle className="text-base">Sebaran lembaga terdaftar per provinsi</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {totalRegisteredActiveLpk.toLocaleString("id-ID")} lembaga terdaftar dari {totalActiveLpk.toLocaleString("id-ID")} total lembaga
              </p>
            </div>
            {(data?.nationalLpkByProvince?.length ?? 0) > 0 && (
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
            )}
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
                    unitLabel="LPK"
                  />
                ))}
                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-500 inline-block" />
                      Lembaga terdaftar
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-primary/25 dark:bg-primary/30 inline-block" />
                      Belum Terverifikasi
                    </span>
                  </div>
                  <span>{lpkScopeTab === "national" ? "Cakupan Nasional" : "Lingkup Wilayah"}</span>
                </div>
              </div>
            ) : (
              <EmptyBreakdown message="Sebaran lembaga terdaftar per provinsi akan tampil setelah data tersedia." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Demand tervalidasi per negara</CardTitle>
            <p className="text-sm text-muted-foreground">
              Target berasal dari total kuota Modul D yang disetujui; capaian berasal dari kuota terisi.
            </p>
          </CardHeader>
          <CardContent>
            {(data?.demandByCountry.length ?? 0) > 0 ? (
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
                    {data?.demandByCountry.map((item) => (
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
      </div>
    </section>
  );
}

export function CountryDemandProgress({ target, achieved }: { target: number; achieved: number }) {
  if (target <= 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const percentage = Math.round((achieved / target) * 100);
  const progressWidth = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className="flex min-w-24 items-center justify-end gap-2">
      <div
        className="h-2 w-12 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={`Capaian target ${percentage}%`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressWidth}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none"
          style={{ width: `${progressWidth}%` }}
        />
      </div>
      <span className="w-10 text-right tabular-nums">{percentage}%</span>
    </div>
  );
}

export function BreakdownBar({
  label,
  value,
  total,
  showPercent = true,
}: {
  label: string;
  value: number;
  total: number;
  showPercent?: boolean;
}) {
  const width = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-foreground">{label}</span>
        <span className="shrink-0 font-medium tabular-nums text-foreground">
          {value.toLocaleString("id-ID")}
          {showPercent && total !== value && <span className="ml-1 text-muted-foreground">({width}%)</span>}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={width}
      >
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function ProvinceRatioBar({
  label,
  registered,
  total,
  maxTotal,
  unitLabel = "lembaga",
}: {
  label: string;
  registered: number;
  total: number;
  maxTotal: number;
  unitLabel?: string;
}) {
  const safeTotal = Math.max(total, 1);
  const registeredPct = Math.round((registered / safeTotal) * 100);
  const totalBarWidth = maxTotal > 0 ? Math.min(Math.round((total / maxTotal) * 100), 100) : 0;
  const registeredSegmentWidth = Math.min(Math.round((registered / safeTotal) * 100), 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-foreground truncate">{label}</span>
        <div className="shrink-0 flex items-center gap-1.5 tabular-nums text-xs sm:text-sm">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {registered.toLocaleString("id-ID")} terdaftar
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground">
            {total.toLocaleString("id-ID")} {unitLabel}
          </span>
          <span className="text-xs text-muted-foreground font-normal">
            ({registeredPct}%)
          </span>
        </div>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-muted/80"
        role="progressbar"
        aria-label={`${label}: ${registered} terdaftar dari ${total} ${unitLabel}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={registeredPct}
      >
        <div
          className="h-full rounded-full flex overflow-hidden transition-[width] motion-reduce:transition-none"
          style={{ width: `${Math.max(totalBarWidth, 6)}%` }}
        >
          <div
            className="h-full bg-emerald-600 dark:bg-emerald-500 transition-[width]"
            style={{ width: `${registeredSegmentWidth}%` }}
            title={`Terdaftar: ${registered} (${registeredPct}%)`}
          />
          <div
            className="h-full bg-primary/25 dark:bg-primary/30 transition-[width]"
            style={{ width: `${100 - registeredSegmentWidth}%` }}
            title={`Belum terverifikasi: ${total - registered}`}
          />
        </div>
      </div>
    </div>
  );
}

export function EmptyBreakdown({ message }: { message: string }) {
  return <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">{message}</p>;
}
