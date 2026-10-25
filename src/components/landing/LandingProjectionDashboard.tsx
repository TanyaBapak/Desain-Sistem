import { router } from "@inertiajs/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface LandingProjectionSeries {
  name: string;
  target: number;
  achieved: number;
  projected: number;
}

export interface LandingProjectionData {
  year: number | null;
  periods: number[];
  countries: LandingProjectionSeries[];
  sectors: LandingProjectionSeries[];
  placementTargets: {
    year: number;
    sectorName: string;
    occupationName: string;
    projectionPlacement: string;
    target: number;
  }[];
}

interface LandingProjectionDashboardProps {
  projection: LandingProjectionData;
}

const numberFormat = new Intl.NumberFormat("id-ID");

export function LandingProjectionDashboard({ projection }: LandingProjectionDashboardProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    new Set([
      currentYear,
      ...projection.periods,
      ...(projection.year === null ? [] : [projection.year]),
    ]),
  ).sort((left, right) => right - left);

  function changePeriod(value: string) {
    router.get(
      "/",
      { projectionYear: value },
      { preserveScroll: true, preserveState: true, replace: true },
    );
  }

  return (
    <section
      id="proyeksi-penempatan"
      className="border-b border-border bg-background py-12 text-foreground sm:py-14"
      aria-labelledby="projection-heading"
    >
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl space-y-2">
            <span className="block text-xs font-bold uppercase tracking-wider text-primary">
              PROYEKSI INTERNASIONAL DAN SEKTOR
            </span>
            <h2 id="projection-heading" className="text-2xl font-black tracking-tight sm:text-3xl">
              Target, capaian, dan proyeksi penempatan internasional
            </h2>
            <p className="text-sm text-muted-foreground">
              Pantau target, capaian, dan sisa target per negara serta sektor untuk seluruh periode
              atau periode pilihan.
            </p>
          </div>
          <label className="flex shrink-0 flex-col gap-1.5 text-sm font-medium">
            <span>Periode tahunan</span>
            <select
              aria-label="Pilih periode proyeksi"
              className="h-10 min-w-36 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={projection.year?.toString() ?? "all"}
              onChange={(event) => changePeriod(event.target.value)}
            >
              <option value="all">Semua periode</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <ProjectionCard
            title="Daftar negara tujuan"
            description="Target dan realisasi demand yang disetujui per negara."
            series={projection.countries}
            emptyMessage="Daftar negara tujuan belum tersedia pada master data."
          />
          <PlacementProjectionCard
            year={projection.year}
            items={projection.placementTargets}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Proyeksi menunjukkan sisa target dari kuota yang tercatat, bukan perkiraan otomatis
          keberangkatan. Capaian memakai demand berstatus disetujui berdasarkan tahun pembuatan
          demand.
        </p>
      </div>
    </section>
  );
}

function PlacementProjectionCard({
  year,
  items,
}: {
  year: number | null;
  items: LandingProjectionData["placementTargets"];
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-1.5 p-5">
        <CardTitle className="text-lg">Proyeksi program penempatan</CardTitle>
        <CardDescription>
          Target manual per sektor dan jabatan beserta negara atau wilayah tujuan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-5 pt-0">
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
            Belum ada proyeksi penempatan untuk periode ini.
          </p>
        ) : (
          items.map((item, index) => (
            <div
              key={`${item.year}-${item.sectorName}-${item.occupationName}-${index}`}
              className="space-y-1 rounded-md border border-border p-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-sm font-semibold">
                  {item.sectorName} · {item.occupationName}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {numberFormat.format(item.target)} target
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {year === null ? `${item.year} · ` : ""}{item.projectionPlacement}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ProjectionCard({
  title,
  description,
  series,
  emptyMessage,
}: {
  title: string;
  description: string;
  series: LandingProjectionSeries[];
  emptyMessage: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-1.5 p-5">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-xs text-muted-foreground" aria-label="Keterangan grafik">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary" aria-hidden="true" />
            Tercapai
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/30" aria-hidden="true" />
            Sisa target
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-0">
        {series.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          series.map((item) => {
            const target = Math.max(0, item.target);
            const achievedPercent = target ? Math.min(100, (item.achieved / target) * 100) : 0;
            const projectedPercent = target ? Math.min(100 - achievedPercent, (item.projected / target) * 100) : 0;

            return (
              <div key={item.name} className="space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="text-sm font-semibold text-foreground">{item.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {numberFormat.format(item.achieved)} tercapai / {numberFormat.format(target)} target
                  </span>
                </div>
                <div
                  className="flex h-3 overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label={`${item.name}: ${numberFormat.format(item.achieved)} tercapai dari target ${numberFormat.format(target)}, sisa ${numberFormat.format(item.projected)}`}
                >
                  <span className="h-full bg-primary" style={{ width: `${achievedPercent}%` }} />
                  <span className="h-full bg-muted-foreground/30" style={{ width: `${projectedPercent}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Proyeksi sisa target: {numberFormat.format(item.projected)}
                </p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
