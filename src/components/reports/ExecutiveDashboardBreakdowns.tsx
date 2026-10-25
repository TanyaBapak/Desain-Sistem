import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InstitutionDirectoryItem } from "@/components/dashboard/InstitutionDirectory";

export interface ExecutiveDashboardBreakdownsData {
  candidateLifecycle: { status: string; count: number }[];
  candidatesByProvince: { province: string; count: number }[];
  institutionsByEvokasiStatus: { status: string; count: number }[];
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
  const lifecycleTotal = useMemo(
    () => data?.candidateLifecycle.reduce((total, item) => total + item.count, 0) ?? 0,
    [data],
  );
  const provinceMax = Math.max(0, ...(data?.candidatesByProvince.map((item) => item.count) ?? []));
  const institutionTotal = useMemo(
    () => data?.institutionsByEvokasiStatus.reduce((total, item) => total + item.count, 0) ?? 0,
    [data],
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

function CountryDemandProgress({ target, achieved }: { target: number; achieved: number }) {
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

function BreakdownBar({
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

function EmptyBreakdown({ message }: { message: string }) {
  return <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">{message}</p>;
}
