import React, { useState, useMemo } from "react";
import {
  Wrench,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Download,
  Trash2,
  Sparkles,
  Loader2,
  Database,
  Building2,
  Globe2,
  FileSpreadsheet,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export interface BulkCheckCandidateResult {
  index: number;
  input: string;
  status: "FOUND" | "NOT_FOUND";
  matchedBy: "NIK" | "NAMA_PERSIS" | "NAMA_PARSIAL" | null;
  id: string | null;
  nik: string | null;
  fullName: string;
  institutionId: string | null;
  institutionName: string | null;
  province: string | null;
  district: string | null;
  educationLevel: string | null;
  major: string | null;
  gender: string | null;
  readinessStatus: string | null;
  verificationStatus: string | null;
  preferredCountries: string[];
}

export interface BulkCheckResponse {
  success: boolean;
  totalDatabase: number;
  totalInput: number;
  totalFound: number;
  totalNotFound: number;
  results: BulkCheckCandidateResult[];
}

const SAMPLE_INPUT = `3301121712060001
3324140104970001
Muhammad Ubay Al-Ziqraa
M RENO OKTAVIANSYAH
Bima Saputra
3205352411030001
Peserta Fiktif Tidak Ada di Sistem
9999999999999999`;

export function DevToolsBulkCheckerPage() {
  const [rawInput, setRawInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resultData, setResultData] = useState<BulkCheckResponse | null>(null);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "FOUND" | "NOT_FOUND">("ALL");
  const [tableSearchQuery, setTableSearchQuery] = useState("");
  const [hasCopiedNotFound, setHasCopiedNotFound] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Hitung jumlah baris input saat ini
  const inputLineCount = useMemo(() => {
    if (!rawInput.trim()) return 0;
    return rawInput.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0).length;
  }, [rawInput]);

  const handleBulkCheck = async () => {
    const lines = rawInput
      .split(/\r\n|\r|\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      toast.warning("Masukkan setidaknya 1 baris Nama atau NIK untuk diperiksa.");
      return;
    }

    if (lines.length > 2000) {
      toast.warning("Maksimal 2.000 baris per eksekusi. Input akan dibatasi ke 2.000 baris pertama.");
    }

    setIsLoading(true);
    try {
      // Ambil CSRF token dari cookie jika ada
      const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="))
        ?.split("=")[1];

      const res = await fetch("/business-data/dev-tools/bulk-check-candidates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          ...(csrfToken ? { "X-XSRF-TOKEN": decodeURIComponent(csrfToken) } : {}),
        },
        body: JSON.stringify({ raw_input: rawInput }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || `Gagal melakukan pemeriksaan (Status: ${res.status})`);
      }

      const data: BulkCheckResponse = await res.json();
      setResultData(data);
      setCurrentPage(1);
      setActiveFilter("ALL");

      toast.success(
        `Pemeriksaan selesai: ${data.totalFound} ditemukan (✅), ${data.totalNotFound} tidak ditemukan (❌).`
      );
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat memeriksa data massal.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter hasil tabel
  const filteredResults = useMemo(() => {
    if (!resultData?.results) return [];

    let list = resultData.results;

    if (activeFilter === "FOUND") {
      list = list.filter((r) => r.status === "FOUND");
    } else if (activeFilter === "NOT_FOUND") {
      list = list.filter((r) => r.status === "NOT_FOUND");
    }

    const q = tableSearchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (r) =>
          r.input.toLowerCase().includes(q) ||
          r.fullName.toLowerCase().includes(q) ||
          (r.nik && r.nik.toLowerCase().includes(q)) ||
          (r.institutionName && r.institutionName.toLowerCase().includes(q)) ||
          (r.district && r.district.toLowerCase().includes(q)) ||
          (r.province && r.province.toLowerCase().includes(q)) ||
          (r.major && r.major.toLowerCase().includes(q))
      );
    }

    return list;
  }, [resultData, activeFilter, tableSearchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / pageSize));
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredResults.slice(start, start + pageSize);
  }, [filteredResults, currentPage, pageSize]);

  // Ekspor hasil pemeriksaan ke Excel (.xlsx)
  const handleExportExcel = async () => {
    if (!resultData || resultData.results.length === 0) return;

    setIsExportingExcel(true);
    try {
      const XLSX = await import("xlsx");

      const exportRows = resultData.results.map((r, i) => ({
        No: i + 1,
        Status: r.status === "FOUND" ? "DITEMUKAN (TERDAFTAR)" : "TIDAK DITEMUKAN",
        "Metode Pencocokan": r.matchedBy || "-",
        "Kata Kunci Input": r.input,
        "NIK Terdaftar": r.nik || "-",
        "Nama Lengkap di Sistem": r.fullName || "-",
        "Lembaga Vokasi / Asal": r.institutionName || "-",
        Provinsi: r.province || "-",
        "Kabupaten / Kota": r.district || "-",
        Pendidikan: r.educationLevel || "-",
        Jurusan: r.major || "-",
        "Negara Target": r.preferredCountries.join(", ") || "-",
        "Status Kesiapan": r.readinessStatus || "-",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Hasil Rekonsiliasi Massal");

      const todayStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `Hasil_Pemeriksaan_Massal_PMI_${todayStr}.xlsx`);

      toast.success("Hasil pemeriksaan berhasil diekspor ke file Excel.");
    } catch {
      toast.error("Gagal mengekspor file Excel.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Salin daftar yang belum terdaftar (❌) ke clipboard
  const handleCopyNotFound = () => {
    if (!resultData) return;
    const notFoundList = resultData.results
      .filter((r) => r.status === "NOT_FOUND")
      .map((r) => r.input)
      .join("\n");

    if (!notFoundList) {
      toast.info("Semua peserta terdaftar (tidak ada yang berstatus ❌).");
      return;
    }

    navigator.clipboard.writeText(notFoundList);
    setHasCopiedNotFound(true);
    toast.success("Daftar calon yang belum terdaftar berhasil disalin ke clipboard!");
    setTimeout(() => setHasCopiedNotFound(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman Dev Tools */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
              <Wrench className="h-4 w-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Dev Tools — Pemeriksa Calon PMI Massal</span>
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Alat bantu rekonsiliasi cepat untuk mendeteksi status pendaftaran, asal lembaga vokasi, dan validitas NIK secara massal dari Excel atau catatan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs gap-1 py-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Eksklusif Super Admin</span>
          </Badge>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 text-xs py-1">
            Internal Workspace
          </Badge>
        </div>
      </div>

      {/* Input Area Card */}
      <Card className="border border-border bg-card shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label htmlFor="bulk-candidate-input" className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>Tempel Daftar Nama / NIK Massal:</span>
              <Badge variant="secondary" className="text-xs font-mono">
                {inputLineCount} Baris Terdeteksi
              </Badge>
            </label>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRawInput(SAMPLE_INPUT)}
                className="h-7 text-xs gap-1 border-border text-muted-foreground hover:text-foreground"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Isi Contoh Sampel</span>
              </Button>
              {rawInput && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRawInput("");
                    setResultData(null);
                  }}
                  className="h-7 text-xs gap-1 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Bersihkan</span>
                </Button>
              )}
            </div>
          </div>

          <textarea
            id="bulk-candidate-input"
            rows={8}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder={`Tempel daftar NIK atau Nama calon PMI di sini (satu baris per calon, bisa copy-paste langsung dari kolom Excel)...
Contoh:
3301121712060001
Muhammad Ubay Al-Ziqraa
Bima Saputra
3205352411030001`}
            className="w-full rounded-xl border border-input bg-background p-3 text-xs sm:text-sm font-mono placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-muted-foreground">
              Tip: Mendukung NIK 16-digit, nama lengkap, atau gabungan NIK & nama dari Excel. Maksimal 2.000 baris per eksekusi.
            </span>

            <Button
              type="button"
              onClick={handleBulkCheck}
              disabled={isLoading || inputLineCount === 0}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 font-semibold text-xs sm:text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memeriksa ke Database...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Periksa Massal ({inputLineCount} Baris)</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Ringkasan Hasil */}
      {resultData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in duration-300">
          <Card className="border border-border bg-card p-4">
            <span className="text-xs font-medium text-muted-foreground">Total Diperiksa</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">
                {resultData.totalInput.toLocaleString("id-ID")}
              </span>
              <span className="text-xs text-muted-foreground">Orang</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Dari berkas input yang ditempel</p>
          </Card>

          <Card className="border border-emerald-500/30 bg-emerald-500/5 p-4">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ditemukan di Sistem</span>
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {resultData.totalFound.toLocaleString("id-ID")}
              </span>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                ({resultData.totalInput > 0 ? Math.round((resultData.totalFound / resultData.totalInput) * 100) : 0}%)
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Sudah terdaftar & memiliki data lengkap</p>
          </Card>

          <Card className="border border-rose-500/30 bg-rose-500/5 p-4">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Belum Terdaftar</span>
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                {resultData.totalNotFound.toLocaleString("id-ID")}
              </span>
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                ({resultData.totalInput > 0 ? Math.round((resultData.totalNotFound / resultData.totalInput) * 100) : 0}%)
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Belum masuk di database sistem</p>
          </Card>

          <Card className="border border-border bg-card p-4">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>Total Basis Data Sistem</span>
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">
                {resultData.totalDatabase.toLocaleString("id-ID")}
              </span>
              <span className="text-xs text-muted-foreground">Peserta Riil</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Seluruh calon PMI terdaftar aktif</p>
          </Card>
        </div>
      )}

      {/* Tabel Hasil Pemeriksaan */}
      {resultData && (
        <Card className="border border-border bg-card shadow-xs animate-in fade-in duration-300">
          <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-muted/50 border border-border">
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("ALL");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeFilter === "ALL"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Semua Hasil ({resultData.totalInput})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("FOUND");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === "FOUND"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Ditemukan ({resultData.totalFound})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("NOT_FOUND");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === "NOT_FOUND"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-rose-700 dark:text-rose-400 hover:bg-rose-500/10"
                }`}
              >
                <XCircle className="w-3 h-3" />
                <span>Belum Terdaftar ({resultData.totalNotFound})</span>
              </button>
            </div>

            {/* Search & Export Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari dalam hasil..."
                  value={tableSearchQuery}
                  onChange={(e) => {
                    setTableSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {resultData.totalNotFound > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyNotFound}
                  className="h-8 text-xs gap-1.5 border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-500/10"
                  title="Salin semua nama/NIK yang belum terdaftar untuk ditindaklanjuti"
                >
                  {hasCopiedNotFound ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Salin Data ❌</span>
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={isExportingExcel}
                className="h-8 text-xs gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold"
              >
                {isExportingExcel ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>Ekspor Excel (.xlsx)</span>
              </Button>
            </div>
          </div>

          {/* Tabel Konten */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-muted/50 border-b border-border font-semibold text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5 w-12 text-center">#</th>
                  <th className="px-3 py-2.5 w-32 text-center">Status</th>
                  <th className="px-3 py-2.5 w-44">Kata Kunci Input</th>
                  <th className="px-3 py-2.5 w-44 font-mono">NIK Terdaftar</th>
                  <th className="px-3 py-2.5 min-w-[180px]">Nama di Sistem</th>
                  <th className="px-3 py-2.5 min-w-[200px]">Lembaga Vokasi Asal</th>
                  <th className="px-3 py-2.5 w-44">Wilayah Domisili</th>
                  <th className="px-3 py-2.5 w-44">Sektor & Negara Target</th>
                  <th className="px-3 py-2.5 w-32">Kesiapan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedResults.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-muted-foreground">
                      <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      <span>Tidak ada data hasil pemeriksaan yang sesuai dengan filter ini.</span>
                    </td>
                  </tr>
                ) : (
                  paginatedResults.map((row) => {
                    const isFound = row.status === "FOUND";

                    return (
                      <tr
                        key={row.index}
                        className={`transition-colors ${
                          isFound
                            ? "hover:bg-emerald-500/5 bg-background"
                            : "hover:bg-rose-500/5 bg-rose-500/[0.02]"
                        }`}
                      >
                        <td className="px-3 py-2.5 text-center font-mono text-muted-foreground">
                          {row.index}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {isFound ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Ditemukan</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Belum Terdaftar</span>
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-foreground">
                          <span className="line-clamp-2" title={row.input}>
                            {row.input}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-muted-foreground">
                          {row.nik ? (
                            <span className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-bold text-foreground">
                              {row.nik}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {isFound ? (
                            <div>
                              <span className="font-semibold text-foreground block">
                                {row.fullName}
                              </span>
                              {row.matchedBy && (
                                <span className="text-[10px] text-muted-foreground">
                                  Cocok via {row.matchedBy.replace("_", " ")}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400 italic">
                              Tidak ada di database
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {isFound && row.institutionName ? (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="font-medium text-foreground line-clamp-1" title={row.institutionName}>
                                {row.institutionName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {isFound && (row.district || row.province) ? (
                            <span className="line-clamp-1" title={`${row.district || ""}, ${row.province || ""}`}>
                              {row.district ? `${row.district}, ` : ""}
                              {row.province || ""}
                            </span>
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {isFound ? (
                            <div className="space-y-0.5">
                              {row.major && (
                                <span className="block font-medium text-foreground text-[11px] line-clamp-1">
                                  {row.major}
                                </span>
                              )}
                              {row.preferredCountries.length > 0 && (
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Globe2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span className="line-clamp-1">{row.preferredCountries.join(", ")}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {isFound && row.readinessStatus ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-foreground border border-border">
                              {row.readinessStatus}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Navigasi Paginasi */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Menampilkan baris {(currentPage - 1) * pageSize + 1} -{" "}
                {Math.min(currentPage * pageSize, filteredResults.length)} dari {filteredResults.length} hasil
              </span>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="h-7 px-2 text-xs"
                >
                  Sebelumnya
                </Button>
                <span className="px-2 font-mono">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="h-7 px-2 text-xs"
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

