import React, { useState, useMemo, useEffect } from "react";
import {
  Wrench,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Loader2,
  Database,
  Building2,
  Globe2,
  FileSpreadsheet,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  Users,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  FileCheck2,
  AlertTriangle,
  ArrowLeftRight,
  Repeat,
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
  isDuplicateInInput: boolean;
  inputOccurrenceCount: number;
  duplicateInputLines: number[];
  isDuplicateInDatabase: boolean;
  databaseDuplicateCount: number;
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

export interface SystemOnlyCandidateResult {
  index: number;
  status: "SYSTEM_ONLY";
  id: string;
  nik: string;
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

export interface DetectedInstitutionSummary {
  id: string;
  name: string;
  matchedFromSpreadsheet: number;
  totalInSystem: number;
  missingFromSpreadsheet: number;
}

export interface DuplicateGroupItem {
  key: string;
  label: string;
  count: number;
  lines: number[];
}

export interface BulkCheckResponse {
  success: boolean;
  totalDatabase: number;
  totalInput: number;
  totalFound: number;
  totalNotFound: number;
  totalSystemOnly: number;
  totalDuplicatesInInput: number;
  totalUniqueDuplicates: number;
  duplicateGroups: DuplicateGroupItem[];
  detectedInstitutions: DetectedInstitutionSummary[];
  results: BulkCheckCandidateResult[];
  systemOnlyCandidates: SystemOnlyCandidateResult[];
}

export interface EmptyInstitutionItem {
  id: string;
  name: string;
  type: string;
  province: string;
  district: string;
  headName: string;
  phone: string;
  email: string;
  hasMou: boolean;
  mouUrl: string | null;
  evokasiStatus: string;
  supportedSectors: string[];
  candidateCount: number;
}

export interface EmptyInstitutionsResponse {
  success: boolean;
  summary: {
    totalInstitutions: number;
    totalWithCandidates: number;
    totalEmpty: number;
    totalCandidatesInSystem: number;
  };
  emptyInstitutions: EmptyInstitutionItem[];
  institutionsList?: { id: string; name: string; type: string; province: string }[];
}

const SAMPLE_INPUT = `3301121712060001
3324140104970001
Muhammad Ubay Al-Ziqraa
M RENO OKTAVIANSYAH
Bima Saputra
3205352411030001
Dwi Putra Candra Dewa,S.H.
Fiqih Arasy
Aryo Adi Nugroho
Fiqih Arasy
Peserta Fiktif Tidak Ada di Sistem
9999999999999999`;

export function DevToolsBulkCheckerPage() {
  // Tab Aktif: 'candidates' (Pemeriksa Nama/NIK & Matching 2 Arah) atau 'empty_institutions' (Lembaga Tanpa Peserta)
  const [activeMainTab, setActiveMainTab] = useState<"candidates" | "empty_institutions">("candidates");

  // State untuk Tab 1 (Pemeriksa Calon PMI & Matching 2 Arah)
  const [rawInput, setRawInput] = useState("");
  const [targetInstitutionId, setTargetInstitutionId] = useState("auto");
  const [isLoading, setIsLoading] = useState(false);
  const [resultData, setResultData] = useState<BulkCheckResponse | null>(null);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "FOUND" | "NOT_FOUND" | "SYSTEM_ONLY" | "DUPLICATES">("ALL");
  const [tableSearchQuery, setTableSearchQuery] = useState("");
  const [hasCopiedNotFound, setHasCopiedNotFound] = useState(false);
  const [hasCopiedSystemOnly, setHasCopiedSystemOnly] = useState(false);
  const [hasCopiedDuplicates, setHasCopiedDuplicates] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // State untuk Tab 2 (Lembaga Tanpa Peserta)
  const [emptyInstData, setEmptyInstData] = useState<EmptyInstitutionsResponse | null>(null);
  const [isLoadingEmptyInst, setIsLoadingEmptyInst] = useState(false);
  const [emptyInstSearch, setEmptyInstSearch] = useState("");
  const [emptyInstTypeFilter, setEmptyInstTypeFilter] = useState("ALL");
  const [emptyInstMouFilter, setEmptyInstMouFilter] = useState("ALL");
  const [emptyInstPage, setEmptyInstPage] = useState(1);
  const [hasCopiedEmptyNames, setHasCopiedEmptyNames] = useState(false);
  const [isExportingEmptyExcel, setIsExportingEmptyExcel] = useState(false);
  const emptyInstPageSize = 30;

  // Load institutions list saat pertama dibuka agar user bisa memilih lembaga spesifik bila diinginkan
  useEffect(() => {
    loadEmptyInstitutions();
  }, []);

  const loadEmptyInstitutions = async () => {
    setIsLoadingEmptyInst(true);
    try {
      const res = await fetch("/business-data/dev-tools/empty-institutions", {
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (!res.ok) {
        throw new Error(`Gagal memuat data lembaga (Status: ${res.status})`);
      }

      const data: EmptyInstitutionsResponse = await res.json();
      setEmptyInstData(data);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat data lembaga.");
    } finally {
      setIsLoadingEmptyInst(false);
    }
  };

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
      toast.warning("Maksimal 2.000 baris per eksekusi. Input dibatasi ke 2.000 baris pertama.");
    }

    setIsLoading(true);
    try {
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
        body: JSON.stringify({
          raw_input: rawInput,
          target_institution_id: targetInstitutionId,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || `Gagal melakukan rekonsiliasi (Status: ${res.status})`);
      }

      const data: BulkCheckResponse = await res.json();
      setResultData(data);
      setCurrentPage(1);
      setActiveFilter("ALL");

      if (data.totalDuplicatesInInput > 0) {
        toast.warning(
          `Terdeteksi ${data.totalDuplicatesInInput} baris duplikat di spreadsheet Anda (${data.totalUniqueDuplicates} nama/NIK berulang)!`,
          { duration: 5000 }
        );
      } else {
        toast.success(
          `Rekonsiliasi selesai: ${data.totalFound} cocok (✅), ${data.totalNotFound} belum ada di sistem (❌), ${data.totalSystemOnly} hanya di sistem (⚠️).`
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat memeriksa data massal.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter gabungan tabel calon & sistem
  type DisplayRow =
    | { type: "SPREADSHEET_ROW"; data: BulkCheckCandidateResult }
    | { type: "SYSTEM_ROW"; data: SystemOnlyCandidateResult };

  const filteredDisplayRows = useMemo<DisplayRow[]>(() => {
    if (!resultData) return [];

    let rows: DisplayRow[] = [];

    if (activeFilter === "ALL") {
      rows = [
        ...resultData.results.map((r) => ({ type: "SPREADSHEET_ROW" as const, data: r })),
        ...resultData.systemOnlyCandidates.map((r) => ({ type: "SYSTEM_ROW" as const, data: r })),
      ];
    } else if (activeFilter === "FOUND") {
      rows = resultData.results
        .filter((r) => r.status === "FOUND")
        .map((r) => ({ type: "SPREADSHEET_ROW" as const, data: r }));
    } else if (activeFilter === "NOT_FOUND") {
      rows = resultData.results
        .filter((r) => r.status === "NOT_FOUND")
        .map((r) => ({ type: "SPREADSHEET_ROW" as const, data: r }));
    } else if (activeFilter === "SYSTEM_ONLY") {
      rows = resultData.systemOnlyCandidates.map((r) => ({
        type: "SYSTEM_ROW" as const,
        data: r,
      }));
    } else if (activeFilter === "DUPLICATES") {
      rows = resultData.results
        .filter((r) => r.isDuplicateInInput || r.isDuplicateInDatabase)
        .map((r) => ({ type: "SPREADSHEET_ROW" as const, data: r }));
    }

    const q = tableSearchQuery.toLowerCase().trim();
    if (q) {
      rows = rows.filter((item) => {
        if (item.type === "SPREADSHEET_ROW") {
          const r = item.data;
          return (
            r.input.toLowerCase().includes(q) ||
            r.fullName.toLowerCase().includes(q) ||
            (r.nik && r.nik.toLowerCase().includes(q)) ||
            (r.institutionName && r.institutionName.toLowerCase().includes(q)) ||
            (r.district && r.district.toLowerCase().includes(q)) ||
            (r.province && r.province.toLowerCase().includes(q)) ||
            (r.major && r.major.toLowerCase().includes(q))
          );
        } else {
          const r = item.data;
          return (
            r.fullName.toLowerCase().includes(q) ||
            r.nik.toLowerCase().includes(q) ||
            (r.institutionName && r.institutionName.toLowerCase().includes(q)) ||
            (r.district && r.district.toLowerCase().includes(q)) ||
            (r.province && r.province.toLowerCase().includes(q)) ||
            (r.major && r.major.toLowerCase().includes(q))
          );
        }
      });
    }

    return rows;
  }, [resultData, activeFilter, tableSearchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredDisplayRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDisplayRows.slice(start, start + pageSize);
  }, [filteredDisplayRows, currentPage, pageSize]);

  // Ekspor hasil rekonsiliasi 2-Arah ke Excel
  const handleExportExcel = async () => {
    if (!resultData) return;

    setIsExportingExcel(true);
    try {
      const XLSX = await import("xlsx");

      const exportRows = [
        ...resultData.results.map((r, i) => ({
          No: i + 1,
          "Kategori Status":
            r.status === "FOUND"
              ? "ADA DI SPREADSHEET & ADA DI SISTEM (COCOK)"
              : "HANYA DI SPREADSHEET (BELUM MASUK SISTEM)",
          "Duplikasi di Input": r.isDuplicateInInput
            ? `DUPLIKAT (${r.inputOccurrenceCount}x: Baris ${r.duplicateInputLines.join(", ")})`
            : "Tunggal (Unik)",
          "Duplikasi di Sistem": r.isDuplicateInDatabase
            ? `Ganda di DB (${r.databaseDuplicateCount} record)`
            : "-",
          "Metode Cocok": r.matchedBy || "-",
          "Input dari Spreadsheet": r.input,
          "NIK di Sistem": r.nik || "-",
          "Nama Lengkap di Sistem": r.fullName || "-",
          "Lembaga Vokasi": r.institutionName || "-",
          Provinsi: r.province || "-",
          "Kabupaten / Kota": r.district || "-",
          Pendidikan: r.educationLevel || "-",
          Jurusan: r.major || "-",
          "Negara Target": r.preferredCountries.join(", ") || "-",
          "Status Kesiapan": r.readinessStatus || "-",
        })),
        ...resultData.systemOnlyCandidates.map((r, i) => ({
          No: resultData.results.length + i + 1,
          "Kategori Status": "HANYA DI SISTEM (TIDAK ADA DI SPREADSHEET)",
          "Duplikasi di Input": "-",
          "Duplikasi di Sistem": "-",
          "Metode Cocok": "Data Asli Sistem",
          "Input dari Spreadsheet": "-",
          "NIK di Sistem": r.nik,
          "Nama Lengkap di Sistem": r.fullName,
          "Lembaga Vokasi": r.institutionName || "-",
          Provinsi: r.province || "-",
          "Kabupaten / Kota": r.district || "-",
          Pendidikan: r.educationLevel || "-",
          Jurusan: r.major || "-",
          "Negara Target": r.preferredCountries.join(", ") || "-",
          "Status Kesiapan": r.readinessStatus || "-",
        })),
      ];

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Rekonsiliasi 2 Arah");

      const todayStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `Rekonsiliasi_2_Arah_PMI_${todayStr}.xlsx`);

      toast.success("Hasil rekonsiliasi 2 arah berhasil diekspor ke file Excel.");
    } catch {
      toast.error("Gagal mengekspor file Excel.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Salin daftar yang belum terdaftar di sistem (❌)
  const handleCopyNotFound = () => {
    if (!resultData) return;
    const notFoundList = resultData.results
      .filter((r) => r.status === "NOT_FOUND")
      .map((r) => r.input)
      .join("\n");

    if (!notFoundList) {
      toast.info("Semua peserta spreadsheet terdaftar di sistem.");
      return;
    }

    navigator.clipboard.writeText(notFoundList);
    setHasCopiedNotFound(true);
    toast.success("Daftar nama yang belum masuk sistem berhasil disalin!");
    setTimeout(() => setHasCopiedNotFound(false), 2500);
  };

  // Salin daftar yang HANYA ada di sistem (⚠️)
  const handleCopySystemOnly = () => {
    if (!resultData || resultData.systemOnlyCandidates.length === 0) {
      toast.info("Tidak ada peserta yang hanya ada di sistem.");
      return;
    }

    const list = resultData.systemOnlyCandidates
      .map((r) => `${r.nik} - ${r.fullName} (${r.institutionName || "Tanpa Lembaga"})`)
      .join("\n");

    navigator.clipboard.writeText(list);
    setHasCopiedSystemOnly(true);
    toast.success("Daftar peserta yang hanya ada di sistem berhasil disalin!");
    setTimeout(() => setHasCopiedSystemOnly(false), 2500);
  };

  // Salin daftar nama duplikat (🔁)
  const handleCopyDuplicates = () => {
    if (!resultData || resultData.duplicateGroups.length === 0) {
      toast.info("Tidak ada nama duplikat di input.");
      return;
    }

    const list = resultData.duplicateGroups
      .map((g) => `${g.label} (Muncul ${g.count}x pada baris: ${g.lines.join(", ")})`)
      .join("\n");

    navigator.clipboard.writeText(list);
    setHasCopiedDuplicates(true);
    toast.success("Daftar nama duplikat berhasil disalin ke clipboard!");
    setTimeout(() => setHasCopiedDuplicates(false), 2500);
  };

  // Filter lembaga kosong
  const filteredEmptyInstitutions = useMemo(() => {
    if (!emptyInstData?.emptyInstitutions) return [];

    let list = emptyInstData.emptyInstitutions;

    if (emptyInstTypeFilter !== "ALL") {
      list = list.filter((inst) =>
        inst.type.toLowerCase().includes(emptyInstTypeFilter.toLowerCase())
      );
    }

    if (emptyInstMouFilter === "MOU_YES") {
      list = list.filter((inst) => inst.hasMou);
    } else if (emptyInstMouFilter === "MOU_NO") {
      list = list.filter((inst) => !inst.hasMou);
    }

    const q = emptyInstSearch.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (inst) =>
          inst.name.toLowerCase().includes(q) ||
          inst.province.toLowerCase().includes(q) ||
          inst.district.toLowerCase().includes(q) ||
          inst.headName.toLowerCase().includes(q) ||
          inst.phone.toLowerCase().includes(q)
      );
    }

    return list;
  }, [emptyInstData, emptyInstTypeFilter, emptyInstMouFilter, emptyInstSearch]);

  const totalEmptyPages = Math.max(1, Math.ceil(filteredEmptyInstitutions.length / emptyInstPageSize));
  const paginatedEmptyInstitutions = useMemo(() => {
    const start = (emptyInstPage - 1) * emptyInstPageSize;
    return filteredEmptyInstitutions.slice(start, start + emptyInstPageSize);
  }, [filteredEmptyInstitutions, emptyInstPage, emptyInstPageSize]);

  // Ekspor lembaga kosong ke Excel
  const handleExportEmptyExcel = async () => {
    if (!emptyInstData || emptyInstData.emptyInstitutions.length === 0) return;

    setIsExportingEmptyExcel(true);
    try {
      const XLSX = await import("xlsx");

      const exportRows = filteredEmptyInstitutions.map((inst, i) => ({
        No: i + 1,
        "Nama Lembaga Vokasi": inst.name,
        "Jenis Lembaga": inst.type,
        Provinsi: inst.province,
        "Kabupaten / Kota": inst.district,
        "Nama Pimpinan / PIC": inst.headName,
        "No. Telepon / WhatsApp": inst.phone,
        Email: inst.email,
        "Status Dokumen MoU": inst.hasMou ? "Sudah Ada Dokumen MoU" : "Belum Ada MoU",
        "Tautan Berkas MoU": inst.mouUrl || "-",
        "Status e-Vokasi": inst.evokasiStatus,
        "Sektor Pelatihan": inst.supportedSectors.join(", ") || "-",
        "Jumlah Peserta di Sistem": inst.candidateCount,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Lembaga Tanpa Peserta");

      const todayStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `Lembaga_Vokasi_Tanpa_Peserta_${todayStr}.xlsx`);

      toast.success("Daftar lembaga tanpa peserta berhasil diekspor ke file Excel.");
    } catch {
      toast.error("Gagal mengekspor file Excel.");
    } finally {
      setIsExportingEmptyExcel(false);
    }
  };

  // Salin nama-nama lembaga kosong
  const handleCopyEmptyNames = () => {
    if (!filteredEmptyInstitutions || filteredEmptyInstitutions.length === 0) return;

    const names = filteredEmptyInstitutions
      .map((inst) => `${inst.name} (${inst.province}) - Telp: ${inst.phone}`)
      .join("\n");

    navigator.clipboard.writeText(names);
    setHasCopiedEmptyNames(true);
    toast.success("Daftar nama lembaga kosong berhasil disalin!");
    setTimeout(() => setHasCopiedEmptyNames(false), 2500);
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
              <span>Dev Tools — Rekonsiliasi & Matching 2 Arah</span>
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Mendeteksi kecocokan timbal-balik, deteksi duplikasi nama/NIK internal spreadsheet, dan pelacakan lembaga vokasi tanpa peserta.
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

      {/* Main Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveMainTab("candidates")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
            activeMainTab === "candidates"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Rekonsiliasi Calon (Spreadsheet ⇄ Sistem)</span>
          {resultData && (
            <span className="ml-1 px-1.5 py-0.2 bg-background/20 rounded-full text-[10px] font-mono">
              {resultData.totalFound} Cocok
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab("empty_institutions")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
            activeMainTab === "empty_institutions"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Lembaga Tanpa Peserta (Spreadsheet / MoU)</span>
          {emptyInstData?.summary && (
            <span className="ml-1 px-1.5 py-0.2 bg-rose-500/20 text-rose-200 rounded-full text-[10px] font-mono font-bold">
              {emptyInstData.summary.totalEmpty} Lembaga
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: REKONSILIASI CALON PMI 2 ARAH (SPREADSHEET ⇄ SISTEM) */}
      {/* ========================================================================= */}
      {activeMainTab === "candidates" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Input Area Card */}
          <Card className="border border-border bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label htmlFor="bulk-candidate-input" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span>Tempel Daftar Nama / NIK dari Spreadsheet / Excel:</span>
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
                    <span>Isi Contoh Sampel (Ada Duplikat)</span>
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
Dwi Putra Candra Dewa,S.H.
Fiqih Arasy
Aryo Adi Nugroho
Fiqih Arasy`}
                className="w-full rounded-xl border border-input bg-background p-3 text-xs sm:text-sm font-mono placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                {/* Opsi Target Lembaga untuk Bandingkan dengan Sistem */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground shrink-0">Bandingkan terhadap:</span>
                  <select
                    value={targetInstitutionId}
                    onChange={(e) => setTargetInstitutionId(e.target.value)}
                    className="h-8 max-w-[280px] rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary truncate"
                  >
                    <option value="auto">Deteksi Otomatis dari Input (Rekomendasi)</option>
                    {emptyInstData?.institutionsList?.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.province})
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="button"
                  onClick={handleBulkCheck}
                  disabled={isLoading || inputLineCount === 0}
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 font-semibold text-xs sm:text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memproses Matching 2 Arah...</span>
                    </>
                  ) : (
                    <>
                      <ArrowLeftRight className="w-4 h-4" />
                      <span>Mulai Rekonsiliasi 2 Arah ({inputLineCount} Baris)</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* PERINGATAN KHUSUS DUPLIKASI DI INPUT SPREADSHEET */}
          {resultData && resultData.totalDuplicatesInInput > 0 && (
            <Card className="border border-purple-500/40 bg-purple-500/10 p-4 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300">
                      <Repeat className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-purple-900 dark:text-purple-200">
                      Terdeteksi {resultData.totalDuplicatesInInput} Baris Duplikat di Spreadsheet Anda!
                    </span>
                    <Badge variant="outline" className="border-purple-500/40 bg-purple-500/20 text-purple-800 dark:text-purple-200 font-mono text-[11px]">
                      {resultData.totalUniqueDuplicates} Nama/NIK Berulang
                    </Badge>
                  </div>
                  <p className="text-xs text-purple-800/90 dark:text-purple-300/90 leading-relaxed">
                    Beberapa peserta tercantum lebih dari satu kali di file spreadsheet/Excel yang Anda tempelkan:
                  </p>

                  {/* List Ringkas Nama-Nama Duplikat */}
                  <div className="pt-1.5 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {resultData.duplicateGroups.map((group, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-background text-foreground border border-purple-500/30 shadow-2xs"
                        title={`Muncul ${group.count} kali pada baris: ${group.lines.join(", ")}`}
                      >
                        <span className="text-purple-700 dark:text-purple-400 font-bold">{group.label}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ({group.count}x: Baris #{group.lines.join(", #")})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActiveFilter("DUPLICATES");
                      setCurrentPage(1);
                    }}
                    className="h-8 text-xs gap-1 border-purple-500/40 text-purple-800 dark:text-purple-300 hover:bg-purple-500/20 font-semibold"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>Lihat Data Duplikat Saja</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopyDuplicates}
                    className="h-8 text-xs gap-1 border-purple-500/40 text-purple-800 dark:text-purple-300 hover:bg-purple-500/20"
                  >
                    {hasCopiedDuplicates ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin Nama Duplikat</span>
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Banner Informasi Lembaga Terdeteksi & Ringkasan Gap 2 Arah */}
          {resultData && resultData.detectedInstitutions.length > 0 && (
            <Card className="border border-indigo-500/30 bg-indigo-500/5 p-4 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    <span>Lembaga Asal Terdeteksi dari Input:</span>
                  </span>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {resultData.detectedInstitutions.map((inst) => (
                      <Badge
                        key={inst.id}
                        variant="outline"
                        className="bg-background text-foreground border-indigo-500/30 text-xs py-1 px-2.5 font-semibold"
                      >
                        {inst.name} ({inst.matchedFromSpreadsheet} dari {inst.totalInSystem} siswa cocok)
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground bg-background/60 p-2.5 rounded-lg border border-border">
                  Sistem otomatis membandingkan seluruh data aktif dari lembaga di atas untuk mendeteksi siapa saja yang tidak ada di spreadsheet.
                </div>
              </div>
            </Card>
          )}

          {/* KPI Kotak Ringkasan Hasil 2 Arah + Duplikasi */}
          {resultData && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 animate-in fade-in duration-300">
              {/* Kotak 1: Total Input Spreadsheet */}
              <Card className="border border-border bg-card p-4">
                <span className="text-xs font-medium text-muted-foreground">1. Total di Spreadsheet</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">
                    {resultData.totalInput.toLocaleString("id-ID")}
                  </span>
                  <span className="text-xs text-muted-foreground">Baris</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Data yang ditempelkan dari Excel</p>
              </Card>

              {/* Kotak 2: Cocok di Keduanya (Spreadsheet + Sistem) */}
              <Card className="border border-emerald-500/30 bg-emerald-500/5 p-4">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. Ada di Keduanya</span>
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {resultData.totalFound.toLocaleString("id-ID")}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    ({resultData.totalInput > 0 ? Math.round((resultData.totalFound / resultData.totalInput) * 100) : 0}%)
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Ada di spreadsheet & sistem</p>
              </Card>

              {/* Kotak 3: Hanya di Spreadsheet (Belum Masuk Sistem) */}
              <Card className="border border-rose-500/30 bg-rose-500/5 p-4">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>3. Hanya di Spreadsheet</span>
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                    {resultData.totalNotFound.toLocaleString("id-ID")}
                  </span>
                  <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                    ({resultData.totalInput > 0 ? Math.round((resultData.totalNotFound / resultData.totalInput) * 100) : 0}%)
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">Belum ada di sistem</p>
              </Card>

              {/* Kotak 4: Hanya di Sistem (Tidak di Spreadsheet) */}
              <Card className="border border-amber-500/30 bg-amber-500/5 p-4">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>4. Hanya di Sistem</span>
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                    {resultData.totalSystemOnly.toLocaleString("id-ID")}
                  </span>
                  <span className="text-xs text-muted-foreground">Peserta</span>
                </div>
                <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300 font-medium">Absen di berkas Excel</p>
              </Card>

              {/* Kotak 5: Duplikasi di Spreadsheet */}
              <Card className={`p-4 border ${resultData.totalDuplicatesInInput > 0 ? "border-purple-500/40 bg-purple-500/10" : "border-border bg-card"}`}>
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                  <Repeat className="w-3.5 h-3.5 text-purple-600" />
                  <span>5. Duplikat di Input</span>
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-purple-700 dark:text-purple-300 tabular-nums">
                    {resultData.totalDuplicatesInInput}
                  </span>
                  <span className="text-xs text-muted-foreground">Baris</span>
                </div>
                <p className="mt-1 text-[11px] text-purple-800 dark:text-purple-300 font-medium">
                  {resultData.totalUniqueDuplicates > 0 ? `${resultData.totalUniqueDuplicates} nama berulang di Excel` : "Tidak ada duplikasi di input"}
                </p>
              </Card>
            </div>
          )}

          {/* Tabel Hasil Rekonsiliasi 2 Arah */}
          {resultData && (
            <Card className="border border-border bg-card shadow-xs animate-in fade-in duration-300">
              <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Filter Tabs 5 Opsi */}
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
                    Semua ({resultData.totalInput + resultData.totalSystemOnly})
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
                    <span>Cocok di Keduanya ({resultData.totalFound})</span>
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
                    <span>Hanya di Spreadsheet ({resultData.totalNotFound})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveFilter("SYSTEM_ONLY");
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      activeFilter === "SYSTEM_ONLY"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                    }`}
                  >
                    <AlertCircle className="w-3 h-3" />
                    <span>Hanya di Sistem ({resultData.totalSystemOnly})</span>
                  </button>

                  {resultData.totalDuplicatesInInput > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFilter("DUPLICATES");
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        activeFilter === "DUPLICATES"
                          ? "bg-purple-600 text-white shadow-xs"
                          : "text-purple-700 dark:text-purple-400 hover:bg-purple-500/10 font-bold"
                      }`}
                    >
                      <Repeat className="w-3 h-3" />
                      <span>Duplikat di Input ({resultData.totalDuplicatesInInput})</span>
                    </button>
                  )}
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

                  {resultData.totalDuplicatesInInput > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyDuplicates}
                      className="h-8 text-xs gap-1.5 border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 font-semibold"
                      title="Salin semua nama yang terduplikasi di spreadsheet"
                    >
                      {hasCopiedDuplicates ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Repeat className="w-3.5 h-3.5" />}
                      <span>Salin Duplikat 🔁</span>
                    </Button>
                  )}

                  {resultData.totalNotFound > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyNotFound}
                      className="h-8 text-xs gap-1.5 border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-500/10"
                      title="Salin semua nama/NIK yang belum terdaftar di sistem"
                    >
                      {hasCopiedNotFound ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Salin ❌</span>
                    </Button>
                  )}

                  {resultData.totalSystemOnly > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopySystemOnly}
                      className="h-8 text-xs gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                      title="Salin peserta yang ada di sistem tapi tidak ada di spreadsheet"
                    >
                      {hasCopiedSystemOnly ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Salin ⚠️</span>
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

              {/* Tabel Konten Rekonsiliasi 2 Arah */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-muted/50 border-b border-border font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2.5 w-12 text-center">#</th>
                      <th className="px-3 py-2.5 w-44 text-center">Status Rekonsiliasi</th>
                      <th className="px-3 py-2.5 w-44">Kata Kunci Input</th>
                      <th className="px-3 py-2.5 w-36 font-mono">NIK di Sistem</th>
                      <th className="px-3 py-2.5 min-w-[200px]">Nama di Sistem</th>
                      <th className="px-3 py-2.5 min-w-[200px]">Lembaga Vokasi</th>
                      <th className="px-3 py-2.5 w-40">Wilayah Domisili</th>
                      <th className="px-3 py-2.5 w-36">Jurusan & Target</th>
                      <th className="px-3 py-2.5 w-28">Kesiapan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-muted-foreground">
                          <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                          <span>Tidak ada data rekonsiliasi yang sesuai dengan filter ini.</span>
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((item, rowIdx) => {
                        const isSpreadsheet = item.type === "SPREADSHEET_ROW";
                        const isFound = isSpreadsheet && item.data.status === "FOUND";
                        const isNotFound = isSpreadsheet && item.data.status === "NOT_FOUND";
                        const isSystemOnly = item.type === "SYSTEM_ROW";

                        const globalIdx = (currentPage - 1) * pageSize + rowIdx + 1;

                        if (isSystemOnly) {
                          const r = item.data;
                          return (
                            <tr
                              key={`sys-${r.id}`}
                              className="hover:bg-amber-500/5 bg-amber-500/[0.03] transition-colors"
                            >
                              <td className="px-3 py-2.5 text-center font-mono text-muted-foreground">
                                {globalIdx}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  <span>Hanya di Sistem</span>
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-muted-foreground italic">
                                [Tidak ada di Excel]
                              </td>
                              <td className="px-3 py-2.5 font-mono">
                                <span className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-bold text-foreground">
                                  {r.nik}
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                <span className="font-semibold text-foreground block">{r.fullName}</span>
                                <span className="text-[10px] text-amber-600 dark:text-amber-400">
                                  Terdaftar di DB lembaga ini
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span className="font-medium text-foreground line-clamp-1" title={r.institutionName || ""}>
                                    {r.institutionName || "Tidak Terikat Lembaga"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-muted-foreground">
                                <span className="line-clamp-1">
                                  {r.district ? `${r.district}, ` : ""}
                                  {r.province || "-"}
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="space-y-0.5">
                                  {r.major && (
                                    <span className="block font-medium text-foreground text-[11px] line-clamp-1">
                                      {r.major}
                                    </span>
                                  )}
                                  {r.preferredCountries.length > 0 && (
                                    <span className="text-[10px] text-muted-foreground block line-clamp-1">
                                      {r.preferredCountries.join(", ")}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2.5">
                                {r.readinessStatus ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-foreground border border-border">
                                    {r.readinessStatus}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        }

                        // SPREADSHEET ROW
                        const r = item.data;
                        return (
                          <tr
                            key={`sp-${r.index}`}
                            className={`transition-colors ${
                              r.isDuplicateInInput
                                ? "bg-purple-500/[0.04] hover:bg-purple-500/10"
                                : isFound
                                ? "hover:bg-emerald-500/5 bg-background"
                                : "hover:bg-rose-500/5 bg-rose-500/[0.02]"
                            }`}
                          >
                            <td className="px-3 py-2.5 text-center font-mono text-muted-foreground">
                              {r.index}
                            </td>
                            <td className="px-3 py-2.5 text-center space-y-1">
                              <div>
                                {isFound ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Cocok (Keduanya Ada)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                                    <XCircle className="w-3 h-3 text-rose-600" />
                                    <span>Hanya di Spreadsheet</span>
                                  </span>
                                )}
                              </div>

                              {/* BADGE DUPLIKAT DI SPREADSHEET */}
                              {r.isDuplicateInInput && (
                                <div>
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-800 dark:text-purple-200 border border-purple-500/40"
                                    title={`Duplikat! Muncul ${r.inputOccurrenceCount} kali pada baris: ${r.duplicateInputLines.join(", ")}`}
                                  >
                                    <Repeat className="w-2.5 h-2.5 text-purple-600" />
                                    <span>Duplikat di Excel (#{r.duplicateInputLines.join(", #")})</span>
                                  </span>
                                </div>
                              )}

                              {/* BADGE DUPLIKAT DI DATABASE */}
                              {r.isDuplicateInDatabase && (
                                <div>
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/40"
                                    title={`Terdapat ${r.databaseDuplicateCount} data kembar di database sistem`}
                                  >
                                    <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                    <span>Ganda di DB ({r.databaseDuplicateCount} Record)</span>
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2.5 font-medium text-foreground">
                              <span className="line-clamp-2" title={r.input}>
                                {r.input}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-mono text-muted-foreground">
                              {r.nik ? (
                                <span className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-bold text-foreground">
                                  {r.nik}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/60">-</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              {isFound ? (
                                <div>
                                  <span className="font-semibold text-foreground block">
                                    {r.fullName}
                                  </span>
                                  {r.matchedBy && (
                                    <span className="text-[10px] text-muted-foreground">
                                      Cocok via {r.matchedBy.replace("_", " ")}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-rose-600 dark:text-rose-400 italic">
                                  Belum ada di database sistem
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              {isFound && r.institutionName ? (
                                <div className="flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span className="font-medium text-foreground line-clamp-1" title={r.institutionName}>
                                    {r.institutionName}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-muted-foreground">
                              {isFound && (r.district || r.province) ? (
                                <span className="line-clamp-1" title={`${r.district || ""}, ${r.province || ""}`}>
                                  {r.district ? `${r.district}, ` : ""}
                                  {r.province || ""}
                                </span>
                              ) : (
                                <span>-</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              {isFound ? (
                                <div className="space-y-0.5">
                                  {r.major && (
                                    <span className="block font-medium text-foreground text-[11px] line-clamp-1">
                                      {r.major}
                                    </span>
                                  )}
                                  {r.preferredCountries.length > 0 && (
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                      <Globe2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span className="line-clamp-1">{r.preferredCountries.join(", ")}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              {isFound && r.readinessStatus ? (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-foreground border border-border">
                                  {r.readinessStatus}
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
                    {Math.min(currentPage * pageSize, filteredDisplayRows.length)} dari {filteredDisplayRows.length} total baris
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
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LEMBAGA TANPA PESERTA (REKONSILIASI MOU / SPREADSHEET) */}
      {/* ========================================================================= */}
      {activeMainTab === "empty_institutions" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header & KPI Summary */}
          {emptyInstData?.summary ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="border border-border bg-card p-4">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Total Lembaga di Sistem</span>
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">
                    {emptyInstData.summary.totalInstitutions}
                  </span>
                  <span className="text-xs text-muted-foreground">Lembaga</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Terdaftar di master lembaga vokasi</p>
              </Card>

              <Card className="border border-emerald-500/30 bg-emerald-500/5 p-4">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Lembaga Berpeserta</span>
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {emptyInstData.summary.totalWithCandidates}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    ({Math.round((emptyInstData.summary.totalWithCandidates / emptyInstData.summary.totalInstitutions) * 100)}%)
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Menyuplai {emptyInstData.summary.totalCandidatesInSystem.toLocaleString("id-ID")} calon PMI
                </p>
              </Card>

              <Card className="border border-rose-500/30 bg-rose-500/5 p-4">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Lembaga Belum Ada Peserta</span>
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                    {emptyInstData.summary.totalEmpty}
                  </span>
                  <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                    ({Math.round((emptyInstData.summary.totalEmpty / emptyInstData.summary.totalInstitutions) * 100)}%)
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">0 calon terdaftar di database</p>
              </Card>

              <Card className="border border-indigo-500/30 bg-indigo-500/5 p-4">
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Status Dokumen MoU</span>
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {emptyInstData.emptyInstitutions.filter((i) => i.hasMou).length}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    dari {emptyInstData.summary.totalEmpty} kosong ada MoU
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Siap ditindaklanjuti untuk input peserta</p>
              </Card>
            </div>
          ) : (
            isLoadingEmptyInst && (
              <div className="p-8 text-center bg-card rounded-xl border border-border">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                <span className="text-xs text-muted-foreground">Memuat daftar lembaga tanpa peserta...</span>
              </div>
            )
          )}

          {/* Tabel Lembaga Kosong */}
          <Card className="border border-border bg-card shadow-xs">
            <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>Daftar Lembaga Vokasi / Sekolah yang Belum Memiliki Peserta</span>
                  {emptyInstData?.summary && (
                    <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-mono text-xs">
                      {filteredEmptyInstitutions.length} Lembaga Ditampilkan
                    </Badge>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Lembaga mitra dari spreadsheet/MoU yang belum mengunggah daftar calon PMI ke dalam sistem.
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadEmptyInstitutions}
                  disabled={isLoadingEmptyInst}
                  className="h-8 text-xs gap-1.5 border-border"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEmptyInst ? "animate-spin" : ""}`} />
                  <span>Segarkan</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyEmptyNames}
                  disabled={filteredEmptyInstitutions.length === 0}
                  className="h-8 text-xs gap-1.5 border-border text-foreground hover:bg-muted"
                >
                  {hasCopiedEmptyNames ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Salin Nama Lembaga</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportEmptyExcel}
                  disabled={isExportingEmptyExcel || filteredEmptyInstitutions.length === 0}
                  className="h-8 text-xs gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold"
                >
                  {isExportingEmptyExcel ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>Ekspor Excel (.xlsx)</span>
                </Button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="p-3 bg-muted/20 border-b border-border flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari nama lembaga, provinsi, kontak PIC..."
                  value={emptyInstSearch}
                  onChange={(e) => {
                    setEmptyInstSearch(e.target.value);
                    setEmptyInstPage(1);
                  }}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Filter Jenis Lembaga */}
              <select
                value={emptyInstTypeFilter}
                onChange={(e) => {
                  setEmptyInstTypeFilter(e.target.value);
                  setEmptyInstPage(1);
                }}
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">Semua Jenis Lembaga</option>
                <option value="SMK">SMK / Sekolah</option>
                <option value="Politeknik">Politeknik / PT</option>
                <option value="LPK">LPK / Swasta</option>
                <option value="BLK">BLK / Balai Pemerintah</option>
              </select>

              {/* Filter MoU */}
              <select
                value={emptyInstMouFilter}
                onChange={(e) => {
                  setEmptyInstMouFilter(e.target.value);
                  setEmptyInstPage(1);
                }}
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">Semua Status Dokumen MoU</option>
                <option value="MOU_YES">Sudah Ada Dokumen MoU</option>
                <option value="MOU_NO">Belum Ada Dokumen MoU</option>
              </select>
            </div>

            {/* Tabel Lembaga Kosong */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/50 border-b border-border font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5 w-12 text-center">#</th>
                    <th className="px-3 py-2.5 min-w-[240px]">Nama Lembaga Vokasi</th>
                    <th className="px-3 py-2.5 w-36">Jenis Lembaga</th>
                    <th className="px-3 py-2.5 w-48">Wilayah</th>
                    <th className="px-3 py-2.5 min-w-[180px]">Pimpinan / PIC</th>
                    <th className="px-3 py-2.5 w-40">Kontak Telepon / WA</th>
                    <th className="px-3 py-2.5 w-32 text-center">Dokumen MoU</th>
                    <th className="px-3 py-2.5 w-24 text-center">Peserta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedEmptyInstitutions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-muted-foreground">
                        <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                        <span>Tidak ada lembaga yang sesuai dengan kriteria pencarian ini.</span>
                      </td>
                    </tr>
                  ) : (
                    paginatedEmptyInstitutions.map((inst, idx) => (
                      <tr key={inst.id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-3 py-2.5 text-center font-mono text-muted-foreground">
                          {(emptyInstPage - 1) * emptyInstPageSize + idx + 1}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-semibold text-foreground block">{inst.name}</span>
                          {inst.supportedSectors.length > 0 && (
                            <span className="text-[10px] text-muted-foreground line-clamp-1">
                              Sektor: {inst.supportedSectors.join(", ")}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[11px] bg-muted font-medium text-foreground border border-border">
                            {inst.type}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="line-clamp-1">
                              {inst.district !== "-" ? `${inst.district}, ` : ""}
                              {inst.province}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-medium text-foreground block line-clamp-1">{inst.headName}</span>
                          {inst.email !== "-" && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="line-clamp-1">{inst.email}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-muted-foreground">
                          {inst.phone !== "-" ? (
                            <div className="flex items-center gap-1 text-foreground">
                              <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{inst.phone}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/60">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {inst.hasMou && inst.mouUrl ? (
                            <a
                              href={inst.mouUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30"
                              title="Buka dokumen MoU di Google Drive"
                            >
                              <span>Ada MoU</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground border border-border">
                              Belum Ada
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                            0 Calon
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginasi Lembaga Kosong */}
            {totalEmptyPages > 1 && (
              <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Menampilkan {(emptyInstPage - 1) * emptyInstPageSize + 1} -{" "}
                  {Math.min(emptyInstPage * emptyInstPageSize, filteredEmptyInstitutions.length)} dari{" "}
                  {filteredEmptyInstitutions.length} lembaga tanpa peserta
                </span>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEmptyInstPage((p) => Math.max(1, p - 1))}
                    disabled={emptyInstPage <= 1}
                    className="h-7 px-2 text-xs"
                  >
                    Sebelumnya
                  </Button>
                  <span className="px-2 font-mono">
                    {emptyInstPage} / {totalEmptyPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEmptyInstPage((p) => Math.min(totalEmptyPages, p + 1))}
                    disabled={emptyInstPage >= totalEmptyPages}
                    className="h-7 px-2 text-xs"
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
