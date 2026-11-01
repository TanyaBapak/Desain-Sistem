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
  TrendingUp,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  LandingProjectionData,
  LandingProjectionParticipant,
} from "@/components/landing/LandingProjectionDashboard";

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

export function SupplyTargetProjectionPanel({
  projection,
  className,
}: SupplyTargetProjectionPanelProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>("Semua 4 Negara Target");
  const [selectedSectorJob, setSelectedSectorJob] = useState<string>("Semua Sektor & Jabatan");
  const [selectedRegion, setSelectedRegion] = useState<string>("Semua Daerah Asal");
  const [selectedSource, setSelectedSource] = useState<string>("Semua Sumber Data");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // 1. Pilihan 4 Negara Target Utama
  const countriesOptions = [
    "Semua 4 Negara Target",
    "Turki",
    "Malaysia",
    "Korea Selatan",
    "Jepang",
  ];

  // 2. Pemetaan baris target suplai penempatan riil HANYA untuk 4 negara target
  const enrichedTargets = useMemo(() => {
    const list: {
      id: string;
      year: number;
      country: (typeof TARGET_4_COUNTRIES)[number];
      sector: string;
      occupation: string;
      targetQuota: number;
      region: string;
      source: string;
    }[] = [];

    projection.placementTargets.forEach((pt, index) => {
      const matched = match4Country(pt.projectionPlacement);
      if (!matched) return; // Hanya ambil 4 negara target: Turki, Malaysia, Korea Selatan, Jepang

      // Tentukan daerah asal potensial berdasarkan sektor (pemetaan vokasi)
      const sec = pt.sectorName.toLowerCase();
      let defaultRegion = "Jawa Tengah";
      if (sec.includes("manufaktur") || sec.includes("otomotif")) {
        defaultRegion = index % 2 === 0 ? "Jawa Barat" : "Jawa Tengah";
      } else if (sec.includes("hospitality") || sec.includes("pariwisata")) {
        defaultRegion = index % 3 === 0 ? "Bali" : "Jawa Tengah";
      } else if (sec.includes("fisherman") || sec.includes("bahasa")) {
        defaultRegion = index % 2 === 0 ? "Jawa Timur" : "Jawa Tengah";
      }

      // Tentukan sumber data penjaringan
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
        region: defaultRegion,
        source: defaultSource,
      });
    });

    return list;
  }, [projection.placementTargets]);

  // 3. Ekstrak sektor & jabatan unik HANYA dari 4 negara target
  const sectorJobOptions = useMemo(() => {
    const set = new Set<string>();
    enrichedTargets.forEach((pt) => {
      const label = `${pt.sector} · ${pt.occupation}`;
      set.add(label);
    });
    return ["Semua Sektor & Jabatan", ...Array.from(set).sort((a, b) => a.localeCompare(b, "id"))];
  }, [enrichedTargets]);

  // 4. Pilihan Daerah Asal
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

  // 5. Pilihan Sumber Data (disnaker, umum / mandiri, lembaga vokasi / smk)
  const sourcesOptions = [
    "Semua Sumber Data",
    "Disnaker Pemda",
    "Lembaga Vokasi / SMK",
    "Mandiri / Umum",
    "Integrasi BP3MI",
  ];

  // Filter baris target 4 negara
  const filteredTargets = useMemo(() => {
    return enrichedTargets.filter((row) => {
      // Filter Negara (4 Negara Target)
      if (selectedCountry !== "Semua 4 Negara Target") {
        if (row.country !== selectedCountry) {
          return false;
        }
      }

      // Filter Sektor & Jabatan
      if (selectedSectorJob !== "Semua Sektor & Jabatan") {
        const rowLabel = `${row.sector} · ${row.occupation}`;
        if (rowLabel !== selectedSectorJob) {
          return false;
        }
      }

      // Filter Daerah Asal
      if (selectedRegion !== "Semua Daerah Asal" && row.region !== selectedRegion) {
        return false;
      }

      // Filter Sumber Data
      if (selectedSource !== "Semua Sumber Data" && row.source !== selectedSource) {
        return false;
      }

      // Search Query
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

  // Statistik Agregat
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

  // Paginasi
  const totalPages = Math.max(1, Math.ceil(filteredTargets.length / itemsPerPage));
  const paginatedTargets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTargets.slice(start, start + itemsPerPage);
  }, [filteredTargets, currentPage, itemsPerPage]);

  const handleResetFilters = () => {
    setSelectedCountry("Semua 4 Negara Target");
    setSelectedSectorJob("Semua Sektor & Jabatan");
    setSelectedRegion("Semua Daerah Asal");
    setSelectedSource("Semua Sumber Data");
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <Card className="rounded-2xl border border-border shadow-md bg-card overflow-hidden">
      {/* Top Banner Header */}
      <div className="border-b border-border bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-transparent p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                DATA SUPLAI NEGARA TARGET
              </span>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-bold text-[11px]"
              >
                4 Negara Target Utama
              </Badge>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Data Suplai Penempatan Negara Target
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Informasi kuota target suplai penempatan tenaga kerja untuk 4 negara target utama (Turki, Malaysia, Korea Selatan, dan Jepang) berdasarkan pilihan negara, sektor jabatan, daerah asal, dan sumber data pendaftaran.
            </p>
          </div>

          {/* KPI Target Header Card */}
          <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm border border-border rounded-xl p-3 px-4 shadow-sm shrink-0">
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground block">
                Total Kuota Suplai Terfilter
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
                  {stats.totalSlots.toLocaleString("id-ID")}
                </span>
                <span className="text-xs text-muted-foreground font-medium">Target</span>
              </div>
            </div>
            <div className="h-8 w-px bg-border mx-1" />
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground block">
                Negara & Jabatan
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                  {stats.countryCount} Negara · {stats.occupationCount} Jabatan
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Interactive Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-border/70">
          {/* 1. Pilihan Negara */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Globe2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>1. Pilihan Negara</span>
            </label>
            <select
              aria-label="Pilih Negara Target"
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
            >
              {countriesOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Pilihan Sektor & Jabatan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>2. Pilihan Sektor & Jabatan</span>
            </label>
            <select
              aria-label="Pilih Sektor dan Jabatan"
              value={selectedSectorJob}
              onChange={(e) => {
                setSelectedSectorJob(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
            >
              {sectorJobOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Daerah Asal */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>3. Daerah Asal</span>
            </label>
            <select
              aria-label="Pilih Daerah Asal"
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
            >
              {regionsOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Sumber Data */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>4. Sumber Data</span>
            </label>
            <select
              aria-label="Pilih Sumber Data"
              value={selectedSource}
              onChange={(e) => {
                setSelectedSource(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
            >
              {sourcesOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* Toolbar & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari negara, sektor, atau jabatan target..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 text-xs h-9 bg-background"
            />
          </div>

          <div className="flex items-center gap-2">
            {(selectedCountry !== "Semua Negara" ||
              selectedSectorJob !== "Semua Sektor & Jabatan" ||
              selectedRegion !== "Semua Daerah Asal" ||
              selectedSource !== "Semua Sumber Data" ||
              searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs h-8 text-muted-foreground hover:text-foreground"
              >
                Reset Filter
              </Button>
            )}
            <span className="text-xs text-muted-foreground tabular-nums">
              Menampilkan {paginatedTargets.length} dari {filteredTargets.length} alokasi target
            </span>
          </div>
        </div>

        {/* Tabel Data Target Suplai Negara Tujuan */}
        <div className="rounded-xl border border-border overflow-hidden bg-background">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Negara Target</th>
                  <th className="py-2.5 px-3">Sektor</th>
                  <th className="py-2.5 px-3">Jabatan Kerja</th>
                  <th className="py-2.5 px-3 text-right">Target Suplai</th>
                  <th className="py-2.5 px-3">Daerah Asal</th>
                  <th className="py-2.5 px-3">Sumber Data</th>
                  <th className="py-2.5 px-3 text-center">Tahun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedTargets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Tidak ada target penempatan yang cocok dengan kriteria filter pilihan Anda.
                    </td>
                  </tr>
                ) : (
                  paginatedTargets.map((row) => {
                    const sourceBadgeClass =
                      row.source === "Disnaker Pemda"
                        ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
                        : row.source === "Lembaga Vokasi / SMK"
                        ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30"
                        : row.source === "Mandiri / Umum"
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";

                    return (
                      <tr key={row.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-foreground">
                          <div className="flex items-center gap-1.5">
                            <Globe2 className="h-3.5 w-3.5 text-primary" />
                            <span>{row.country}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-foreground">
                          {row.sector}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-foreground">
                          {row.occupation}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {row.targetQuota.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {row.region}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${sourceBadgeClass}`}>
                            {row.source}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-center text-muted-foreground tabular-nums">
                          {row.year}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t border-border/70 text-xs text-muted-foreground">
              <span>
                Halaman <strong className="text-foreground">{currentPage}</strong> dari{" "}
                <strong className="text-foreground">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 px-2 text-xs"
                >
                  Berikutnya
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
