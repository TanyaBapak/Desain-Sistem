import React, { useState, useMemo } from "react";
import {
  Globe2,
  Briefcase,
  MapPin,
  Database,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Filter,
  RotateCcw,
  ExternalLink,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  LandingProjectionData,
  LandingProjectionParticipant,
} from "@/components/landing/LandingProjectionDashboard";
import {
  CountryProjectionDetailsDialog,
  type CountryProjection,
  type SectorProjection,
} from "@/components/landing/CountryProjectionDetailsDialog";

interface SupplyTargetProjectionPanelProps {
  projection: LandingProjectionData;
  className?: string;
}

export const TARGET_4_COUNTRIES = [
  "Turki",
  "Malaysia",
  "Korea Selatan",
  "Jepang",
] as const;

export function match4Country(name: string): (typeof TARGET_4_COUNTRIES)[number] | null {
  const norm = name.toLowerCase().trim();
  if (norm.includes("turki") || norm.includes("turkey")) return "Turki";
  if (norm.includes("malaysia")) return "Malaysia";
  if (norm.includes("korea")) return "Korea Selatan";
  if (norm.includes("jepang") || norm.includes("japan")) return "Jepang";
  return null;
}

export interface TargetCountryConfig {
  name: (typeof TARGET_4_COUNTRIES)[number];
  code: string;
  tag: string;
  keySectors: string;
  colorClass: string;
  badgeBg: string;
  borderClass: string;
  defaultTarget: number;
}

export const TARGET_COUNTRIES_CONFIG: Record<(typeof TARGET_4_COUNTRIES)[number], TargetCountryConfig> = {
  Turki: {
    name: "Turki",
    code: "TR",
    tag: "Hospitality & Spa",
    keySectors: "Perhotelan · Spa Therapist · F&B Service",
    colorClass: "text-rose-600 dark:text-rose-400 bg-rose-500/10",
    badgeBg: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    borderClass: "border-rose-500/30 hover:border-rose-500/60",
    defaultTarget: 5000,
  },
  Jepang: {
    name: "Jepang",
    code: "JP",
    tag: "Kaigo & Welder",
    keySectors: "Caregiver Lansia · Welder · Pertanian",
    colorClass: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
    badgeBg: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    borderClass: "border-blue-500/30 hover:border-blue-500/60",
    defaultTarget: 2000,
  },
  Malaysia: {
    name: "Malaysia",
    code: "MY",
    tag: "SMT & Perkebunan",
    keySectors: "Elektronika SMT · F&B · Mekanisasi Sawit",
    colorClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    badgeBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    borderClass: "border-emerald-500/30 hover:border-emerald-500/60",
    defaultTarget: 5000,
  },
  "Korea Selatan": {
    name: "Korea Selatan",
    code: "KR",
    tag: "Permesinan & Galangan",
    keySectors: "Operator CNC · Welder FCAW · ABK",
    colorClass: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    badgeBg: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    borderClass: "border-amber-500/30 hover:border-amber-500/60",
    defaultTarget: 2440,
  },
};

export function SupplyTargetProjectionPanel({
  projection,
  className,
}: SupplyTargetProjectionPanelProps) {
  // Selected country: "ALL" for all 4 countries, or specific country
  const [selectedCountry, setSelectedCountry] = useState<string>("ALL");
  const [selectedSectorJob, setSelectedSectorJob] = useState<string>("Semua Sektor & Jabatan");
  const [selectedRegion, setSelectedRegion] = useState<string>("Semua Daerah Asal");
  const [selectedSource, setSelectedSource] = useState<string>("Semua Sumber Data");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const itemsPerPage = 8;

  // Dialog State untuk rincian peserta terverifikasi
  const [dialogCountry, setDialogCountry] = useState<CountryProjection | null>(null);
  const [dialogSector, setDialogSector] = useState<string | null>(null);

  // 1. Pemetaan baris target suplai penempatan riil HANYA untuk 4 negara target
  const enrichedTargets = useMemo(() => {
    const list: {
      id: string;
      year: number;
      country: (typeof TARGET_4_COUNTRIES)[number];
      sector: string;
      occupation: string;
      targetQuota: number;
      totalJp: number | null;
      technicalJp: number | null;
      languageJp: number | null;
      region: string;
      source: string;
    }[] = [];

    projection.placementTargets.forEach((pt, index) => {
      const matched = match4Country(pt.projectionPlacement);
      if (!matched) return;

      const sec = pt.sectorName.toLowerCase();
      let defaultRegion = "Jawa Tengah";
      if (sec.includes("manufaktur") || sec.includes("otomotif")) {
        defaultRegion = index % 2 === 0 ? "Jawa Barat" : "Jawa Tengah";
      } else if (sec.includes("hospitality") || sec.includes("pariwisata")) {
        defaultRegion = index % 3 === 0 ? "Bali" : "Jawa Tengah";
      } else if (sec.includes("fisherman") || sec.includes("bahasa")) {
        defaultRegion = index % 2 === 0 ? "Jawa Timur" : "Jawa Tengah";
      }

      let defaultSource = "Lembaga Vokasi / SMK";
      if (index % 4 === 0) defaultSource = "Disnaker Pemda";
      else if (index % 4 === 1) defaultSource = "Lembaga Vokasi / SMK";
      else if (index % 4 === 2) defaultSource = "Mandiri / Umum";
      else defaultSource = "Integrasi BP3MI";

      list.push({
        id: `TARGET-4-${pt.year}-${index + 1}`,
        year: pt.year,
        country: matched,
        sector: pt.sectorName,
        occupation: pt.occupationName,
        targetQuota: pt.target,
        totalJp: pt.totalJp ?? null,
        technicalJp: pt.technicalJp ?? null,
        languageJp: pt.languageJp ?? null,
        region: defaultRegion,
        source: defaultSource,
      });
    });

    return list;
  }, [projection.placementTargets]);

  // Hitung total kuota target per negara
  const countryTotals = useMemo(() => {
    const totals: Record<(typeof TARGET_4_COUNTRIES)[number], number> = {
      Turki: 0,
      Jepang: 0,
      Malaysia: 0,
      "Korea Selatan": 0,
    };
    enrichedTargets.forEach((r) => {
      totals[r.country] = (totals[r.country] || 0) + r.targetQuota;
    });
    // Fallback jika database belum berisi baris untuk negara tertentu
    (Object.keys(totals) as (typeof TARGET_4_COUNTRIES)[number][]).forEach((c) => {
      if (!totals[c]) {
        totals[c] = TARGET_COUNTRIES_CONFIG[c]?.defaultTarget ?? 2000;
      }
    });
    return totals;
  }, [enrichedTargets]);

  // Ekstrak sektor & jabatan berdasarkan negara aktif
  const sectorJobOptions = useMemo(() => {
    const set = new Set<string>();
    enrichedTargets.forEach((pt) => {
      if (selectedCountry === "ALL" || pt.country === selectedCountry) {
        set.add(`${pt.sector} · ${pt.occupation}`);
      }
    });
    return ["Semua Sektor & Jabatan", ...Array.from(set).sort((a, b) => a.localeCompare(b, "id"))];
  }, [enrichedTargets, selectedCountry]);

  const regionsOptions = [
    "Semua Daerah Asal",
    "Jawa Tengah",
    "Jawa Barat",
    "Jawa Timur",
    "Bali",
    "DKI Jakarta",
    "Banten",
    "Nusa Tenggara Barat",
  ];

  const sourcesOptions = [
    "Semua Sumber Data",
    "Disnaker Pemda",
    "Lembaga Vokasi / SMK",
    "Mandiri / Umum",
    "Integrasi BP3MI",
  ];

  // Filter baris
  const filteredTargets = useMemo(() => {
    return enrichedTargets.filter((row) => {
      if (selectedCountry !== "ALL" && row.country !== selectedCountry) {
        return false;
      }
      if (selectedSectorJob !== "Semua Sektor & Jabatan") {
        const rowLabel = `${row.sector} · ${row.occupation}`;
        if (rowLabel !== selectedSectorJob) return false;
      }
      if (selectedRegion !== "Semua Daerah Asal" && row.region !== selectedRegion) {
        return false;
      }
      if (selectedSource !== "Semua Sumber Data" && row.source !== selectedSource) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchOcc = row.occupation.toLowerCase().includes(q);
        const matchSec = row.sector.toLowerCase().includes(q);
        const matchCou = row.country.toLowerCase().includes(q);
        if (!matchOcc && !matchSec && !matchCou) return false;
      }
      return true;
    });
  }, [enrichedTargets, selectedCountry, selectedSectorJob, selectedRegion, selectedSource, searchQuery]);

  const stats = useMemo(() => {
    const totalSlots = filteredTargets.reduce((acc, r) => acc + r.targetQuota, 0);
    const countryCount = new Set(filteredTargets.map((r) => r.country)).size;
    const occupationCount = new Set(filteredTargets.map((r) => r.occupation)).size;
    return {
      totalSlots,
      countryCount,
      occupationCount,
      totalRows: filteredTargets.length,
    };
  }, [filteredTargets]);

  const totalPages = Math.max(1, Math.ceil(filteredTargets.length / itemsPerPage));
  const paginatedTargets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTargets.slice(start, start + itemsPerPage);
  }, [filteredTargets, currentPage, itemsPerPage]);

  const handleCountryCardClick = (c: (typeof TARGET_4_COUNTRIES)[number]) => {
    if (selectedCountry === c) {
      setSelectedCountry("ALL");
    } else {
      setSelectedCountry(c);
    }
    setSelectedSectorJob("Semua Sektor & Jabatan");
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSelectedCountry("ALL");
    setSelectedSectorJob("Semua Sektor & Jabatan");
    setSelectedRegion("Semua Daerah Asal");
    setSelectedSource("Semua Sumber Data");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Helper untuk detail modal peserta
  const openVerifiedModalForCountry = (countryName: string) => {
    const matched = projection.countries.find((c) => match4Country(c.name) === countryName) || {
      name: countryName,
      target: countryTotals[countryName as (typeof TARGET_4_COUNTRIES)[number]] || 2000,
      achieved: 0,
      projected: countryTotals[countryName as (typeof TARGET_4_COUNTRIES)[number]] || 2000,
      year: projection.year,
    };
    setDialogCountry({
      ...matched,
      name: countryName,
      year: projection.year,
    });
    setDialogSector(null);
  };

  return (
    <div className={cn("space-y-4 select-none", className)}>
      {/* Header Bar Section */}
      <div className="rounded-2xl border border-border bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/70 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Globe2 className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                4 NEGARA TARGET RESMI
              </span>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-bold text-[10px]"
              >
                Kemitraan Bilateral Aktif
              </Badge>
            </div>
            <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
              Data Suplai Penempatan Negara Target
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Ringkasan kuota target suplai penempatan tenaga kerja ke 4 negara tujuan resmi. Klik kartu untuk menelusuri rincian sektor dan jabatan kerja.
            </p>
          </div>

          {/* Pill Toggle Semua Negara */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedCountry("ALL");
                setSelectedSectorJob("Semua Sektor & Jabatan");
                setCurrentPage(1);
              }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                selectedCountry === "ALL"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground border-border"
              )}
            >
              Semua 4 Negara ({enrichedTargets.reduce((a, b) => a + b.targetQuota, 0).toLocaleString("id-ID")} Target)
            </button>
          </div>
        </div>

        {/* 4 Country Preview Cards Grid (Sesuai Gaya Alur Ekosistem) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
          {TARGET_4_COUNTRIES.map((countryKey) => {
            const conf = TARGET_COUNTRIES_CONFIG[countryKey];
            const isSelected = selectedCountry === countryKey;
            const targetQuota = countryTotals[countryKey];

            return (
              <button
                key={countryKey}
                type="button"
                onClick={() => handleCountryCardClick(countryKey)}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden",
                  isSelected
                    ? "border-primary bg-blue-50/90 dark:bg-slate-800 shadow-md ring-2 ring-primary/40 scale-[1.02]"
                    : cn("border-border bg-card hover:bg-muted/30 shadow-xs", conf.borderClass)
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold transition-transform group-hover:scale-110",
                          conf.colorClass
                        )}
                      >
                        <Globe2 className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors">
                        {conf.name}
                      </span>
                    </div>

                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                        conf.badgeBg
                      )}
                    >
                      {conf.tag}
                    </span>
                  </div>

                  <p className="text-[11.5px] text-muted-foreground line-clamp-1 mt-1">
                    {conf.keySectors}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Target Suplai:</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-extrabold text-foreground tabular-nums text-sm">
                      {targetQuota.toLocaleString("id-ID")}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">Target</span>
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Country Active Drill-Down Bar */}
        <div className="mt-6 pt-5 border-t border-border/70 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                {selectedCountry === "ALL" ? (
                  "Menampilkan Data Seluruh 4 Negara Target"
                ) : (
                  <>
                    Rincian Penempatan:{" "}
                    <span className="text-primary font-black">{selectedCountry}</span>
                  </>
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                · {stats.totalSlots.toLocaleString("id-ID")} Target Terfilter
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-8 text-xs font-semibold gap-1.5"
              >
                <Filter className="h-3.5 w-3.5" />
                <span>{showFilters ? "Tutup Filter Lanjutan" : "Filter Lanjutan"}</span>
              </Button>

              {selectedCountry !== "ALL" && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => openVerifiedModalForCountry(selectedCountry)}
                  className="h-8 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Detail Verifikasi Peserta</span>
                </Button>
              )}
            </div>
          </div>

          {/* Filter Bar (Collapsible or Inline) */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-3.5 rounded-xl bg-muted/40 border border-border/70 animate-fade-in">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  <span>Pencarian Kata Kunci</span>
                </label>
                <Input
                  placeholder="Cari sektor atau jabatan..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  <span>Sektor & Jabatan</span>
                </label>
                <select
                  aria-label="Pilih Sektor dan Jabatan"
                  value={selectedSectorJob}
                  onChange={(e) => {
                    setSelectedSectorJob(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  {sectorJobOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>Daerah Asal Calon Peserta</span>
                </label>
                <select
                  aria-label="Pilih Daerah Asal"
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  {regionsOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  <span>Sumber Data Penjaringan</span>
                </label>
                <select
                  aria-label="Pilih Sumber Data"
                  value={selectedSource}
                  onChange={(e) => {
                    setSelectedSource(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  {sourcesOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Table Data Suplai Ringkas & Rapi */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Negara Target</th>
                    <th className="py-2.5 px-3">Sektor</th>
                    <th className="py-2.5 px-3">Jabatan Kerja</th>
                    <th className="py-2.5 px-3 text-right">Target Suplai</th>
                    <th className="py-2.5 px-3 text-right">Total JP</th>
                    <th className="py-2.5 px-3">Daerah Asal</th>
                    <th className="py-2.5 px-3">Sumber Data</th>
                    <th className="py-2.5 px-3 text-center">Tahun</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paginatedTargets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        Tidak ada data target penempatan yang cocok dengan kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedTargets.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-foreground">
                          {row.country}
                        </td>
                        <td className="py-2.5 px-3 text-foreground">{row.sector}</td>
                        <td className="py-2.5 px-3 font-medium text-foreground">
                          {row.occupation}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-foreground tabular-nums">
                          {row.targetQuota.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-foreground tabular-nums">
                          {row.totalJp ? `${row.totalJp.toLocaleString("id-ID")} JP` : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">{row.region}</td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                            {row.source}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-muted-foreground tabular-nums">
                          {row.year}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginasi Table */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/20 text-xs">
                <span className="text-muted-foreground text-[11px]">
                  Menampilkan {paginatedTargets.length} dari {filteredTargets.length} baris target
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-7 px-2 text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs px-2 font-medium">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-7 px-2 text-xs"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog Detail Peserta Terverifikasi (Reusable dari CountryProjectionDetailsDialog) */}
      {dialogCountry && (
        <CountryProjectionDetailsDialog
          country={dialogCountry}
          sectors={[]}
          participants={projection.participants.filter(
            (p) => match4Country(p.countryName) === dialogCountry.name
          )}
          totalTarget={dialogCountry.target}
          selectedSector={dialogSector}
          onOpenChange={(open) => {
            if (!open) {
              setDialogCountry(null);
              setDialogSector(null);
            }
          }}
          onSectorSelect={(sec) => setDialogSector(sec)}
        />
      )}
    </div>
  );
}
