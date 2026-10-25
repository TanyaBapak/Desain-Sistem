import { useMemo, useState } from "react";
import { ChevronRight, Globe2, Layers3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LandingProjectionData } from "@/components/landing/LandingProjectionDashboard";
import {
  CountryProjectionDetailsDialog,
  type CountryProjection,
  type SectorProjection,
} from "@/components/landing/CountryProjectionDetailsDialog";

const numberFormat = new Intl.NumberFormat("id-ID");

interface CountryProjectionCardProps {
  projection: LandingProjectionData;
}

const countryAliases = new Map([
  ["singapura", "singapura"],
  ["singapore", "singapura"],
  ["belanda", "belanda"],
  ["netherlands", "belanda"],
  ["holland", "belanda"],
  ["slowakia", "slowakia"],
  ["slovakia", "slowakia"],
  ["slovak republic", "slowakia"],
  ["uea", "uni emirat arab"],
  ["uae", "uni emirat arab"],
  ["united arab emirates", "uni emirat arab"],
  ["uni emirat arab", "uni emirat arab"],
]);

function normalizeCountryName(name: string) {
  const normalizedName = name
    .replace(/\s*\([^)]*\)/gu, "")
    .trim()
    .toLocaleLowerCase("id-ID");
  return countryAliases.get(normalizedName) ?? normalizedName;
}

function getCountryProjection(
  name: string,
  projection: LandingProjectionData,
  series: LandingProjectionData["countries"][number],
): CountryProjection {
  if (projection.year !== null) {
    return { ...series, name, year: projection.year };
  }

  const [yearLabel, ...countryName] = name.split(" · ");
  const year = Number(yearLabel);

  if (Number.isInteger(year) && countryName.length > 0) {
    return { ...series, name: countryName.join(" · "), year };
  }

  return { ...series, name, year: null };
}

function getCountrySectors(
  country: CountryProjection,
  placementTargets: LandingProjectionData["placementTargets"],
): SectorProjection[] {
  const sectors = new Map<string, Map<string, number>>();

  placementTargets.forEach((item) => {
    if (country.year !== null && item.year !== country.year) {
      return;
    }

    const matchesCountry = item.projectionPlacement
      .split(/[,/]/u)
      .some((destination) => normalizeCountryName(destination) === normalizeCountryName(country.name));

    if (!matchesCountry) {
      return;
    }

    const occupations = sectors.get(item.sectorName) ?? new Map<string, number>();
    occupations.set(
      item.occupationName,
      (occupations.get(item.occupationName) ?? 0) + item.target,
    );
    sectors.set(item.sectorName, occupations);
  });

  return Array.from(sectors, ([name, occupations]) => {
    const occupationRows = Array.from(occupations, ([occupationName, target]) => ({
      name: occupationName,
      target,
    })).sort((left, right) => left.name.localeCompare(right.name, "id"));

    return {
      name,
      target: occupationRows.reduce((total, occupation) => total + occupation.target, 0),
      occupations: occupationRows,
    };
  }).sort((left, right) => left.name.localeCompare(right.name, "id"));
}

export function CountryProjectionCard({ projection }: CountryProjectionCardProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryProjection | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const countries = useMemo(
    () =>
      projection.countries
        .map((item) => getCountryProjection(item.name, projection, item))
        .sort((left, right) => left.name.localeCompare(right.name, "id")),
    [projection],
  );
  const sectors = selectedCountry
    ? getCountrySectors(selectedCountry, projection.placementTargets)
    : [];
  const totalTarget = sectors.reduce((total, sector) => total + sector.target, 0);

  function closeDialog(open: boolean) {
    if (!open) {
      setSelectedCountry(null);
      setSelectedSector(null);
    }
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="space-y-1.5 p-5">
          <CardTitle className="text-lg">Negara tujuan penempatan</CardTitle>
          <CardDescription>
            Pilih negara untuk menelusuri target yang terdaftar per sektor dan jabatan.
          </CardDescription>
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-xs text-muted-foreground">
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
        <CardContent className="p-5 pt-0">
          {countries.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
              Daftar negara tujuan belum tersedia pada periode ini.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {countries.map((country) => {
                const target = Math.max(0, country.target);
                const achievedPercent = target
                  ? Math.min(100, (country.achieved / target) * 100)
                  : 0;
                const remainingPercent = target
                  ? Math.min(100 - achievedPercent, (country.projected / target) * 100)
                  : 0;
                const sectorCount = getCountrySectors(
                  country,
                  projection.placementTargets,
                ).length;

                return (
                  <button
                    key={`${country.year ?? "all"}-${country.name}`}
                    type="button"
                    onClick={() => {
                      setSelectedCountry(country);
                      setSelectedSector(null);
                    }}
                    className="group rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Lihat sektor dan jabatan tujuan ${country.name}${country.year ? ` tahun ${country.year}` : ""}`}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Globe2 className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-foreground">
                            {country.name}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {country.year ?? "Semua periode"}
                          </span>
                        </span>
                      </span>
                      <ChevronRight
                        className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="mt-4 flex items-end justify-between gap-3">
                      <span>
                        <span className="block text-xs text-muted-foreground">Target</span>
                        <span className="text-lg font-bold tabular-nums">
                          {numberFormat.format(country.target)}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block text-xs text-muted-foreground">Sektor terdaftar</span>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums">
                          <Layers3 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                          {numberFormat.format(sectorCount)}
                        </span>
                      </span>
                    </span>
                    <span
                      className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted"
                      role="img"
                      aria-label={`${numberFormat.format(country.achieved)} tercapai dari ${numberFormat.format(country.target)} target`}
                    >
                      <span className="h-full bg-primary" style={{ width: `${achievedPercent}%` }} />
                      <span
                        className="h-full bg-muted-foreground/30"
                        style={{ width: `${remainingPercent}%` }}
                      />
                    </span>
                    <span className="mt-2 flex justify-between gap-2 text-xs text-muted-foreground">
                      <span>{numberFormat.format(country.achieved)} tercapai</span>
                      <span>{numberFormat.format(country.projected)} tersisa</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CountryProjectionDetailsDialog
        country={selectedCountry}
        sectors={sectors}
        totalTarget={totalTarget}
        selectedSector={selectedSector}
        onOpenChange={closeDialog}
        onSectorSelect={(sectorName) =>
          setSelectedSector((current) => (current === sectorName ? null : sectorName))
        }
      />
    </>
  );
}
