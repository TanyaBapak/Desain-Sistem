import { router } from "@inertiajs/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CountryProjectionCard } from "@/components/landing/CountryProjectionCard";

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
              Pilih negara untuk melihat sektor, jabatan, dan target penempatan secara lebih rinci.
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

        <CountryProjectionCard projection={projection} />

        <p className="text-xs text-muted-foreground">
          Proyeksi menunjukkan sisa target dari kuota yang tercatat, bukan perkiraan otomatis
          keberangkatan. Capaian memakai demand berstatus disetujui berdasarkan tahun pembuatan
          demand.
        </p>
      </div>
    </section>
  );
}
