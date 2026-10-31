import React, { useState, useMemo, useEffect } from "react";
import { Building2, Search, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InstitutionSourceBadge } from "@/components/shared/InstitutionSourceBadge";
import { resolveInstitutionSource } from "@/lib/institution-source";

export interface InstitutionDirectoryItem {
  id: string;
  name: string;
  type: string;
  province: string;
  district: string;
  accreditation: string | null;
  evokasiStatus: string;
  classCount: number | null;
  readyParticipantCount: number | null;
  registrationSource?: 'siskop2mi' | 'disnaker' | 'umum' | string;
  registrationSourceId?: string;
}

interface InstitutionDirectoryProps {
  institutions: InstitutionDirectoryItem[];
  totalCount: number;
  scopeLabel?: string;
  defaultPageSize?: number;
}

const PAGE_SIZE_OPTIONS = [15, 25, 50, 100, 150];

export function InstitutionDirectory({
  institutions,
  totalCount,
  scopeLabel = "dalam lingkup Anda",
  defaultPageSize = 25,
}: InstitutionDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [currentPage, setCurrentPage] = useState(1);

  // Extract unique types for filter dropdown
  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    institutions.forEach((item) => {
      if (item.type) set.add(item.type.trim());
    });
    return Array.from(set).sort();
  }, [institutions]);

  // Filter items based on search, type, and registration source
  const filteredInstitutions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return institutions.filter((item) => {
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.district.toLowerCase().includes(q) ||
        item.province.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        (item.accreditation && item.accreditation.toLowerCase().includes(q));

      const matchType =
        typeFilter === "ALL" ||
        item.type.toLowerCase() === typeFilter.toLowerCase();

      const itemSource = resolveInstitutionSource({
        registrationSource: item.registrationSource,
        id: item.id,
      });
      const matchSource =
        sourceFilter === "ALL" || itemSource === sourceFilter;

      return matchSearch && matchType && matchSource;
    });
  }, [institutions, searchQuery, typeFilter, sourceFilter]);

  // Reset to page 1 on filter/search/pageSize change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, sourceFilter, pageSize]);

  const totalFiltered = filteredInstitutions.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  // Current page sliced items
  const paginatedInstitutions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInstitutions.slice(start, start + pageSize);
  }, [filteredInstitutions, currentPage, pageSize]);

  const startIdx = totalFiltered === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalFiltered);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="text-base font-semibold">Daftar lembaga vokasi</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Cakupan {scopeLabel} ·{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {totalCount.toLocaleString("id-ID")}
              </span>{" "}
              lembaga aktif
              {totalFiltered < totalCount && (
                <span>
                  {" "}
                  (terfilter{" "}
                  <span className="font-semibold text-foreground tabular-nums">
                    {totalFiltered.toLocaleString("id-ID")}
                  </span>
                  )
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Quick controls: Per page & search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative min-w-[200px] flex-1 sm:w-64 sm:flex-initial">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari lembaga / wilayah..."
              className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Type filter */}
          {typeOptions.length > 0 && (
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label="Filter jenis lembaga"
              >
                <option value="ALL">Semua Jenis</option>
                {typeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Source filter */}
          <div className="relative">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="Filter kanal sumber lembaga"
            >
              <option value="ALL">Semua Sumber</option>
              <option value="siskop2mi">SISKOP2MI</option>
              <option value="disnaker">Disnaker</option>
              <option value="umum">Umum / Lembaga</option>
            </select>
          </div>

          {/* Page size selector */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Baris:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="Pilihan jumlah baris per halaman"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} / hal
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {paginatedInstitutions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="py-2.5 pl-6 pr-4 font-medium">
                    No
                  </th>
                  <th scope="col" className="py-2.5 pr-4 font-medium">
                    Nama lembaga
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Wilayah
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Kanal Sumber
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Status e-Vokasi
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Akreditasi
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">
                    Jumlah kelas
                  </th>
                  <th scope="col" className="py-2.5 pl-4 pr-6 text-right font-medium">
                    Peserta siap pelatihan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedInstitutions.map((institution, idx) => (
                  <tr
                    key={institution.id}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <td className="py-3 pl-6 pr-4 text-xs tabular-nums text-muted-foreground">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <th scope="row" className="py-3 pr-4 font-medium text-foreground">
                      <span className="block">{institution.name}</span>
                      <span className="mt-0.5 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                        {institution.type}
                      </span>
                    </th>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {institution.district}, {institution.province}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <InstitutionSourceBadge
                        source={institution.registrationSource}
                        sourceId={institution.registrationSourceId || institution.id}
                        showId={Boolean(institution.registrationSourceId)}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          institution.evokasiStatus === "Terverifikasi"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {institution.evokasiStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">
                      {institution.accreditation || "Belum tersedia"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs tabular-nums text-foreground">
                      {institution.classCount !== null
                        ? institution.classCount.toLocaleString("id-ID")
                        : "Belum tersedia"}
                    </td>
                    <td className="py-3 pl-4 pr-6 text-right text-xs tabular-nums font-semibold text-foreground">
                      {institution.readyParticipantCount !== null
                        ? institution.readyParticipantCount.toLocaleString("id-ID")
                        : "Belum tersedia"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-sm text-muted-foreground">
            <Building2 className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="font-medium">Tidak ada lembaga yang sesuai dengan kriteria pencarian.</p>
            {(searchQuery || typeFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("ALL");
                }}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset filter pencarian
              </button>
            )}
          </div>
        )}

        {/* Pagination bar */}
        {totalFiltered > 0 && (
          <div className="flex flex-col gap-3 border-t border-border px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              Menampilkan{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {startIdx.toLocaleString("id-ID")}
              </span>{" "}
              –{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {endIdx.toLocaleString("id-ID")}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {totalFiltered.toLocaleString("id-ID")}
              </span>{" "}
              lembaga
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Sebelumnya</span>
              </button>

              <div className="flex items-center gap-1 px-2 text-xs text-muted-foreground">
                <span>Halaman</span>
                <span className="font-bold text-foreground tabular-nums">
                  {currentPage}
                </span>
                <span>dari</span>
                <span className="font-bold text-foreground tabular-nums">
                  {totalPages}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
