import { router } from "@inertiajs/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SupplyTargetProjectionPanel } from "@/components/landing/SupplyTargetProjectionPanel";

export interface LandingProjectionSeries {
  name: string;
  year?: number;
  countryName?: string;
  sectorName?: string;
  target: number;
  achieved: number;
  projected: number;
}

export interface LandingProjectionParticipant {
  id: string;
  name: string;
  countryName: string;
  countryKey?: string;
  sectorName: string;
  occupationName: string;
  province: string;
  educationLevel: string;
  major?: string;
  readinessStatus: string;
  sourceType: string;
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
    classCount?: number | null;
    technicalJp?: number | null;
    technicalCertificationJp?: number | null;
    languageJp?: number | null;
    languageCertificationJp?: number | null;
    totalJp?: number | null;
    scheduleStart?: string | null;
    scheduleEnd?: string | null;
  }[];
  participants: LandingProjectionParticipant[];
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

  const periodSelector = (
    <div className="flex items-center gap-1.5 text-xs font-medium">
      <span className="text-muted-foreground hidden sm:inline">Periode:</span>
      <select
        aria-label="Pilih periode proyeksi"
        className="h-8.5 rounded-xl border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        value={projection.year?.toString() ?? "all"}
        onChange={(event) => changePeriod(event.target.value)}
      >
        <option value="all">Semua Periode</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <section
      id="proyeksi-penempatan"
      className="border-b border-border bg-background py-8 text-foreground sm:py-10"
      aria-label="Proyeksi Penempatan Negara Target"
    >
      <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
        {/* Panel Penelusuran Suplai 4 Negara Target */}
        <SupplyTargetProjectionPanel
          projection={projection}
          periodSelector={periodSelector}
        />

        <p className="text-xs text-muted-foreground">
          Proyeksi menunjukkan sisa target dari kuota yang tercatat, bukan perkiraan otomatis
          keberangkatan. Capaian negara dan sektor dihitung dari peserta yang sudah terverifikasi
          untuk negara tujuan tersebut, sehingga angkanya ikut berubah saat verifikasi peserta
          diperbarui.
        </p>
      </div>
    </section>
  );
}
