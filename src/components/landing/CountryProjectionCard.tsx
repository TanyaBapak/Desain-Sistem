import { useMemo, useState } from "react";
import { ChevronRight, Globe2, Layers3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  LandingProjectionData,
  LandingProjectionParticipant,
} from "@/components/landing/LandingProjectionDashboard";
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
  ["turki", "turki"],
  ["turkey", "turki"],
  ["turky", "turki"],
  ["türkiye", "turki"],
  ["turkiye", "turki"],
]);

function normalizeCountryName(name: string) {
  const normalizedName = name
    .replace(/\s*\([^)]*\)/gu, "")
    .trim()
    .toLocaleLowerCase("id-ID");
  return countryAliases.get(normalizedName) ?? normalizedName;
}

function normalizeSectorName(name: string) {
  return name
    .trim()
    .toLocaleLowerCase("id-ID")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
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

function getCountryParticipants(
  country: CountryProjection,
  projection: LandingProjectionData,
): LandingProjectionParticipant[] {
  const countryKey = normalizeCountryName(country.name);

  return projection.participants.filter(
    (participant) => normalizeCountryName(participant.countryName) === countryKey,
  );
}

function getCountrySectors(
  country: CountryProjection,
  projection: LandingProjectionData,
  participants: LandingProjectionParticipant[],
): SectorProjection[] {
  const countryKey = normalizeCountryName(country.name);
  const sectors = new Map<string, { name: string; target: number; achieved: number }>();
  const occupationsBySector = new Map<string, Map<string, number>>();

  projection.sectors.forEach((item) => {
    if (item.year !== undefined && country.year !== null && item.year !== country.year) {
      return;
    }
    if (item.countryName && normalizeCountryName(item.countryName) !== countryKey) {
      return;
    }

    const sectorName = item.sectorName ?? item.name;
    const sectorKey = normalizeSectorName(sectorName);
    const existing = sectors.get(sectorKey);

    sectors.set(sectorKey, {
      name: existing?.name ?? sectorName,
      target: (existing?.target ?? 0) + item.target,
      achieved: (existing?.achieved ?? 0) + item.achieved,
    });
  });

  projection.placementTargets.forEach((item) => {
    if (country.year !== null && item.year !== country.year) {
      return;
    }

    const destinations = Array.from(new Set(item.projectionPlacement
      .split(/[,/]/u)
      .map(normalizeCountryName)
      .filter(Boolean)));
    const destinationIndex = destinations.findIndex(
      (destination) => destination === countryKey,
    );

    if (destinationIndex < 0 || destinations.length === 0) {
      return;
    }

    const baseTarget = Math.floor(item.target / destinations.length);
    const remainingTarget = item.target % destinations.length;
    const targetShare = baseTarget + (destinationIndex < remainingTarget ? 1 : 0);
    const sectorKey = normalizeSectorName(item.sectorName);
    const occupations = occupationsBySector.get(sectorKey) ?? new Map<string, number>();
    occupations.set(
      item.occupationName,
      (occupations.get(item.occupationName) ?? 0) + targetShare,
    );
    occupationsBySector.set(sectorKey, occupations);
  });

  // Pastikan sektor peserta terverifikasi tetap tampil walau belum punya target.
  participants.forEach((participant) => {
    const sectorKey = normalizeSectorName(participant.sectorName);
    if (!sectors.has(sectorKey)) {
      sectors.set(sectorKey, { name: participant.sectorName, target: 0, achieved: 0 });
    }
  });

  return Array.from(sectors, ([sectorKey, sector]) => {
    const occupationRows = Array.from(occupationsBySector.get(sectorKey) ?? new Map())
      .map(([occupationName, target]) => ({ name: occupationName, target }))
      .sort((left, right) => left.name.localeCompare(right.name, "id"));

    return {
      name: sector.name,
      target: sector.target,
      achieved: sector.achieved,
      occupations: occupationRows,
    };
  }).sort((left, right) => left.name.localeCompare(right.name, "id"));
}

export function CountryProjectionCard({ projection }: CountryProjectionCardProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryProjection | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const countries = useMemo(() => {
    const rows = projection.countries.map((item) =>
      getCountryProjection(item.name, projection, item),
    );

    if (projection.year !== null) {
      return rows.sort((left, right) => left.name.localeCompare(right.name, "id"));
    }

    // Pada mode "Semua periode", gabungkan baris per tahun menjadi satu kartu per negara
    // agar jumlah peserta terverifikasi tidak tampil berulang di tiap periode.
    const merged = new Map<string, CountryProjection>();
    rows.forEach((row) => {
      const countryKey = normalizeCountryName(row.name);
      const existing = merged.get(countryKey);

      if (!existing) {
        merged.set(countryKey, { ...row, year: null });
        return;
      }

      merged.set(countryKey, {
        ...existing,
        target: existing.target + row.target,
        achieved: Math.max(existing.achieved, row.achieved),
        projected: existing.projected + row.projected,
      });
    });

    return Array.from(merged.values()).sort((left, right) =>
      left.name.localeCompare(right.name, "id"),
    );
  }, [projection]);
  const selectedParticipants = selectedCountry
    ? getCountryParticipants(selectedCountry, projection)
    : [];
  const sectors = selectedCountry
    ? getCountrySectors(selectedCountry, projection, selectedParticipants)
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
          <CardTitle className="text-lg">Negara target</CardTitle>
          <CardDescription>
            Pilih negara target untuk menelusuri target, capaian, dan daftar peserta terverifikasi.
          </CardDescription>
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-primary" aria-hidden="true" />
              Peserta terverifikasi
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
              Daftar negara target belum tersedia pada periode ini.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {countries.map((country) => {
                const participants = getCountryParticipants(country, projection);
                const achieved = participants.length;
                const target = Math.max(0, country.target);
                const projected = Math.max(0, target - achieved);
                const achievedPercent = target
                  ? Math.min(100, (achieved / target) * 100)
                  : 0;
                const remainingPercent = target
                  ? Math.min(100 - achievedPercent, (projected / target) * 100)
                  : 0;
                const sectorCount = getCountrySectors(country, projection, participants).length;

                return (
                  <button
                    key={`${country.year ?? "all"}-${country.name}`}
                    type="button"
                    onClick={() => {
                      setSelectedCountry(country);
                      setSelectedSector(null);
                    }}
                    className="group rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Lihat peserta terverifikasi, sektor, dan jabatan tujuan ${country.name}${country.year ? ` tahun ${country.year}` : ""}`}
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
                      aria-label={`${numberFormat.format(achieved)} peserta terverifikasi dari ${numberFormat.format(country.target)} target`}
                    >
                      <span className="h-full bg-primary" style={{ width: `${achievedPercent}%` }} />
                      <span
                        className="h-full bg-muted-foreground/30"
                        style={{ width: `${remainingPercent}%` }}
                      />
                    </span>
                    <span className="mt-2 flex justify-between gap-2 text-xs text-muted-foreground">
                      <span>{numberFormat.format(achieved)} peserta terverifikasi</span>
                      <span>{numberFormat.format(projected)} tersisa</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CountryProjectionDetailsDialog
        country={
          selectedCountry
            ? { ...selectedCountry, achieved: selectedParticipants.length }
            : null
        }
        sectors={sectors}
        participants={selectedParticipants}
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
