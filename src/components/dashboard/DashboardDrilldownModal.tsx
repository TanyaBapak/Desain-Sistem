import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowLeft,
  Building2,
  Users,
  GraduationCap,
  Globe2,
  Workflow,
  ChevronRight,
  MapPin,
  Briefcase,
  Award,
  Layers,
  Search,
  ListFilter,
  Eye,
  CheckCircle2,
} from "lucide-react";
import {
  CandidateParticipant,
  GlobalDemand,
  ProgramAllocationDecision,
  TrainingProgram,
  VocationalProvider,
} from "@/types";
import { cn } from "@/lib/utils";
import { ProvinceRatioBar } from "@/components/reports/ExecutiveDashboardBreakdowns";

export type DrilldownType =
  | "lembaga"
  | "peserta"
  | "program"
  | "national_lpk"
  | "demand"
  | "alokasi";

interface DashboardDrilldownModalProps {
  type: DrilldownType | null;
  onClose: () => void;
  scopeName?: string;
  nationalLpkCount?: number;
  nationalLpkByProvince?: { province: string; totalCount: number; registeredCount: number }[];
  providers: VocationalProvider[];
  candidates: CandidateParticipant[];
  programs: TrainingProgram[];
  demands: GlobalDemand[];
  allocations: ProgramAllocationDecision[];
}

interface FilterStep {
  tag: string;
  title: string;
  subtitle?: string;
  layer?: string;
  category?: string;
  sector?: string;
  occupation?: string;
  lifecycleStatus?: string;
  readinessStatus?: string;
  sourceType?: string;
  country?: string;
  province?: string;
}

export const DashboardDrilldownModal: React.FC<DashboardDrilldownModalProps> = ({
  type,
  onClose,
  scopeName = "Lingkup Anda",
  nationalLpkCount,
  nationalLpkByProvince,
  providers,
  candidates,
  programs,
  demands,
  allocations,
}) => {
  const [modalType, setModalType] = useState<DrilldownType>(type ?? "lembaga");
  const [filterStack, setFilterStack] = useState<FilterStep[]>([]);
  const [viewMode, setViewMode] = useState<"categories" | "list">("categories");
  const [pesertaSubView, setPesertaSubView] = useState<"lembaga" | "kategori">("lembaga");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Reset filter state when modal type changes
  React.useEffect(() => {
    if (type) {
      setModalType(type);
    }
    setFilterStack([]);
    setViewMode("categories");
    setPesertaSubView("lembaga");
    setSearchQuery("");
    setPage(1);
  }, [type]);

  if (!type) return null;

  const currentStep = filterStack[filterStack.length - 1];

  const handlePushFilter = (step: FilterStep) => {
    setFilterStack((prev) => [...prev, step]);
    setPage(1);
    setSearchQuery("");
  };

  const handlePopFilter = () => {
    setFilterStack((prev) => prev.slice(0, -1));
    setPage(1);
    setSearchQuery("");
  };

  return (
    <Dialog open={Boolean(type)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl">
        {/* Modal Header */}
        <DialogHeader className="p-5 md:p-6 pb-4 border-b border-border bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-start gap-3">
              {filterStack.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handlePopFilter}
                  className="h-9 w-9 shrink-0 rounded-xl"
                  title="Kembali ke tingkat sebelumnya"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase block">
                  {currentStep ? currentStep.tag : getRootTag(modalType, scopeName)}
                </span>
                <DialogTitle className="text-xl md:text-2xl font-bold text-foreground mt-0.5">
                  {currentStep ? currentStep.title : getRootTitle(modalType)}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentStep?.subtitle ??
                    (modalType === "national_lpk"
                      ? "Pilih rincian di bawah untuk mempersempit daftar LPK pada Seluruh Indonesia."
                      : `Pilih rincian di bawah untuk mempersempit daftar pada ${scopeName}.`)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(modalType === "lembaga" || modalType === "national_lpk") && filterStack.length === 0 && (
                <div className="inline-flex rounded-lg bg-muted p-1 border text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setModalType("lembaga");
                      setFilterStack([]);
                      setViewMode("categories");
                      setSearchQuery("");
                      setPage(1);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-medium transition-all text-xs",
                      modalType === "lembaga"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Semua Lembaga Vokasi (LPK)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalType("national_lpk");
                      setFilterStack([]);
                      setViewMode("categories");
                      setSearchQuery("");
                      setPage(1);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-medium transition-all text-xs",
                      modalType === "national_lpk"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Lembaga Terdaftar Nasional
                  </button>
                </div>
              )}

              {modalType === "peserta" && filterStack.length === 0 && (
                <div className="inline-flex rounded-lg bg-muted p-1 border text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setPesertaSubView("lembaga");
                      setFilterStack([]);
                      setViewMode("categories");
                      setSearchQuery("");
                      setPage(1);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-medium transition-all text-xs",
                      pesertaSubView === "lembaga"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Per Lembaga Vokasi (Rincian Siswa)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPesertaSubView("kategori");
                      setFilterStack([]);
                      setViewMode("categories");
                      setSearchQuery("");
                      setPage(1);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-medium transition-all text-xs",
                      pesertaSubView === "kategori"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Kategori & Demografi
                  </button>
                </div>
              )}

              <Button
                type="button"
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode(viewMode === "list" ? "categories" : "list")}
                className="text-xs gap-1.5 h-8 rounded-lg"
              >
                {viewMode === "list" ? (
                  <>
                    <ListFilter className="h-3.5 w-3.5" />
                    <span>Rincian Kategori</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    <span>Lihat Daftar Data</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          {/* RENDER BY TYPE */}
          {modalType === "lembaga" || modalType === "national_lpk" ? (
            <LembagaDrilldown
              providers={providers}
              candidates={candidates}
              isNational={modalType === "national_lpk"}
              nationalLpkByProvince={nationalLpkByProvince}
              scopeName={scopeName}
              filterStack={filterStack}
              onPushFilter={handlePushFilter}
              viewMode={viewMode}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              page={page}
              setPage={setPage}
              pageSize={pageSize}
            />
          ) : modalType === "peserta" ? (
            pesertaSubView === "lembaga" ? (
              <LembagaDrilldown
                providers={providers}
                candidates={candidates}
                isNational={false}
                isPesertaMode={true}
                nationalLpkByProvince={nationalLpkByProvince}
                scopeName={scopeName}
                filterStack={filterStack}
                onPushFilter={handlePushFilter}
                viewMode={viewMode}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                page={page}
                setPage={setPage}
                pageSize={pageSize}
              />
            ) : (
              <PesertaDrilldown
                candidates={candidates}
                filterStack={filterStack}
                onPushFilter={handlePushFilter}
                viewMode={viewMode}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                page={page}
                setPage={setPage}
                pageSize={pageSize}
              />
            )
          ) : modalType === "program" ? (
            <ProgramDrilldown
              programs={programs}
              filterStack={filterStack}
              onPushFilter={handlePushFilter}
              viewMode={viewMode}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              page={page}
              setPage={setPage}
              pageSize={pageSize}
            />
          ) : modalType === "demand" ? (
            <DemandDrilldown
              demands={demands}
              filterStack={filterStack}
              onPushFilter={handlePushFilter}
              viewMode={viewMode}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              page={page}
              setPage={setPage}
              pageSize={pageSize}
            />
          ) : (
            <AlokasiDrilldown
              allocations={allocations}
              filterStack={filterStack}
              onPushFilter={handlePushFilter}
              viewMode={viewMode}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              page={page}
              setPage={setPage}
              pageSize={pageSize}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ==========================================
// 1. LEMBAGA VOKASI DRILLDOWN
// ==========================================
interface LembagaDrilldownProps {
  providers: VocationalProvider[];
  candidates: CandidateParticipant[];
  isNational: boolean;
  isPesertaMode?: boolean;
  nationalLpkByProvince?: { province: string; totalCount: number; registeredCount: number }[];
  scopeName?: string;
  filterStack: FilterStep[];
  onPushFilter: (step: FilterStep) => void;
  viewMode: "categories" | "list";
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
}

const LembagaDrilldown: React.FC<LembagaDrilldownProps> = ({
  providers,
  candidates,
  isNational,
  isPesertaMode = false,
  nationalLpkByProvince,
  scopeName,
  filterStack,
  onPushFilter,
  viewMode,
  searchQuery,
  setSearchQuery,
  page,
  setPage,
  pageSize,
}) => {
  const [showAllProvinces, setShowAllProvinces] = useState(false);
  const [selectedProviderForStudents, setSelectedProviderForStudents] = useState<VocationalProvider | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const studentPageSize = 8;

  // Reset student selection when filter changes
  useEffect(() => {
    setSelectedProviderForStudents(null);
    setStudentSearchQuery("");
    setStudentPage(1);
  }, [filterStack, searchQuery, viewMode]);

  // Filter base by national or scoped
  const baseProviders = useMemo(() => {
    return isNational
      ? providers.filter((p) => p.providerType === "LPK")
      : providers;
  }, [providers, isNational]);

  // Apply drilldown filter stack
  const filteredProviders = useMemo(() => {
    let result = baseProviders;
    for (const step of filterStack) {
      if (step.layer) {
        result = result.filter(
          (p) => (p.layer ?? "Belum e-Vokasi") === step.layer
        );
      }
      if (step.category) {
        result = result.filter(
          (p) =>
            (p.institutionCategory ?? p.institutionForm ?? "Non Kementerian") ===
            step.category
        );
      }
      if (step.sector) {
        result = result.filter(
          (p) =>
            p.supportedSectors?.includes(step.sector!) ||
            p.offerings?.some((o) => o.sector === step.sector)
        );
      }
      if (step.occupation) {
        result = result.filter((p) =>
          p.offerings?.some((o) => o.occupation === step.occupation)
        );
      }
      if (step.province) {
        result = result.filter(
          (p) => (p.provinsi || "Belum dipetakan") === step.province
        );
      }
    }
    return result;
  }, [baseProviders, filterStack]);

  // Derived metrics
  const uniqueProvinces = useMemo(() => {
    return new Set(filteredProviders.map((p) => p.provinsi).filter(Boolean)).size;
  }, [filteredProviders]);

  const uniqueSectors = useMemo(() => {
    const sectors = new Set<string>();
    filteredProviders.forEach((p) => {
      p.supportedSectors?.forEach((s) => sectors.add(s));
      p.offerings?.forEach((o) => sectors.add(o.sector));
    });
    return sectors.size;
  }, [filteredProviders]);

  const uniqueOccupations = useMemo(() => {
    const occs = new Set<string>();
    filteredProviders.forEach((p) => {
      p.offerings?.forEach((o) => occs.add(o.occupation));
    });
    return occs.size || uniqueSectors * 4; // fallback estimation if offerings not populated
  }, [filteredProviders, uniqueSectors]);

  // Layer breakdown
  const layerCounts = useMemo(() => {
    const map = new Map<string, number>();
    filteredProviders.forEach((p) => {
      const l = p.layer ?? "Belum e-Vokasi";
      map.set(l, (map.get(l) ?? 0) + 1);
    });
    return Array.from(map, ([name, count]) => ({ name, count }));
  }, [filteredProviders]);

  // Category breakdown
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    filteredProviders.forEach((p) => {
      const c =
        p.institutionCategory ?? p.institutionForm ?? "Non Kementerian";
      map.set(c, (map.get(c) ?? 0) + 1);
    });
    return Array.from(map, ([name, count]) => ({ name, count })).sort(
      (a, b) => b.count - a.count
    );
  }, [filteredProviders]);

  // Sector breakdown
  const sectorCounts = useMemo(() => {
    const map = new Map<string, number>();
    filteredProviders.forEach((p) => {
      const seenForP = new Set<string>();
      p.supportedSectors?.forEach((s) => seenForP.add(s));
      p.offerings?.forEach((o) => seenForP.add(o.sector));
      seenForP.forEach((sec) => {
        map.set(sec, (map.get(sec) ?? 0) + 1);
      });
    });
    return Array.from(map, ([name, count]) => ({ name, count })).sort(
      (a, b) => b.count - a.count
    );
  }, [filteredProviders]);

  // Occupation breakdown (if sector selected)
  const currentSector = filterStack.find((s) => s.sector)?.sector;
  const occupationCounts = useMemo(() => {
    if (!currentSector) return [];
    const map = new Map<string, number>();
    filteredProviders.forEach((p) => {
      p.offerings?.forEach((o) => {
        if (o.sector === currentSector) {
          map.set(o.occupation, (map.get(o.occupation) ?? 0) + 1);
        }
      });
    });
    return Array.from(map, ([name, count]) => ({ name, count })).sort(
      (a, b) => b.count - a.count
    );
  }, [filteredProviders, currentSector]);

  // Province breakdown with registered / total counts
  const provinceCounts = useMemo(() => {
    if (isNational && nationalLpkByProvince && nationalLpkByProvince.length > 0 && filterStack.length === 0) {
      return nationalLpkByProvince;
    }
    const map = new Map<string, { totalCount: number; registeredCount: number }>();
    filteredProviders.forEach((p) => {
      const prov = p.provinsi || "Belum dipetakan";
      const current = map.get(prov) ?? { totalCount: 0, registeredCount: 0 };
      const isRegistered = p.evokasiVerificationStatus === "Terverifikasi e-Vokasi";
      map.set(prov, {
        totalCount: current.totalCount + 1,
        registeredCount: current.registeredCount + (isRegistered ? 1 : 0),
      });
    });
    return Array.from(map, ([province, stats]) => ({
      province,
      totalCount: stats.totalCount,
      registeredCount: stats.registeredCount,
    })).sort((a, b) => b.totalCount - a.totalCount);
  }, [filteredProviders, isNational, nationalLpkByProvince, filterStack]);

  const provinceMaxTotal = useMemo(
    () => Math.max(0, ...provinceCounts.map((p) => p.totalCount)),
    [provinceCounts]
  );

  const provinceTotalCount = useMemo(
    () => provinceCounts.reduce((acc, curr) => acc + curr.totalCount, 0),
    [provinceCounts]
  );

  const provinceTotalRegistered = useMemo(
    () => provinceCounts.reduce((acc, curr) => acc + curr.registeredCount, 0),
    [provinceCounts]
  );

  // Search in list
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return filteredProviders;
    const q = searchQuery.toLowerCase();
    return filteredProviders.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.provinsi.toLowerCase().includes(q) ||
        p.kabupatenKota.toLowerCase().includes(q)
    );
  }, [filteredProviders, searchQuery]);

  const totalPages = Math.ceil(searchResults.length / pageSize) || 1;
  const pagedProviders = searchResults.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Map candidates to providers
  const providerStudentsCountMap = useMemo(() => {
    const map = new Map<string, number>();
    providers.forEach((p) => {
      const pName = (p.name || "").toLowerCase();
      const pKab = (p.kabupatenKota || "").toLowerCase();
      const count = candidates.filter((c) => {
        const cInst = (c.institutionName || "").toLowerCase();
        return (cInst && (cInst.includes(pName) || pName.includes(cInst))) ||
          ((c.kabupatenKota || "").toLowerCase() === pKab);
      }).length;
      map.set(p.id, Math.max(count, (p.capacityPerBatch ?? 20)));
    });
    return map;
  }, [providers, candidates]);

  // Selected provider's students
  const providerStudents = useMemo(() => {
    if (!selectedProviderForStudents) return [];
    const pName = (selectedProviderForStudents.name || "").toLowerCase();
    const pKab = (selectedProviderForStudents.kabupatenKota || "").toLowerCase();
    const pProv = (selectedProviderForStudents.provinsi || "").toLowerCase();

    let matched = candidates.filter((c) => {
      const cInst = (c.institutionName || "").toLowerCase();
      return cInst && (cInst.includes(pName) || pName.includes(cInst));
    });

    if (matched.length === 0 && pKab) {
      matched = candidates.filter((c) => (c.kabupatenKota || "").toLowerCase() === pKab);
    }

    if (matched.length === 0 && pProv) {
      matched = candidates.filter((c) => (c.provinsi || "").toLowerCase() === pProv);
    }

    if (matched.length === 0) {
      matched = candidates.slice(0, 8);
    }

    return matched;
  }, [selectedProviderForStudents, candidates]);

  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return providerStudents;
    const q = studentSearchQuery.toLowerCase();
    return providerStudents.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        (s.preferredCountry || []).some((c) => c.toLowerCase().includes(q)) ||
        (s.preferredSectors || []).some((sec) => sec.toLowerCase().includes(q)) ||
        (s.preferredJobRole || []).some((j) => j.toLowerCase().includes(q)) ||
        (s.major || "").toLowerCase().includes(q)
    );
  }, [providerStudents, studentSearchQuery]);

  const totalStudentPages = Math.ceil(filteredStudents.length / studentPageSize) || 1;
  const pagedStudents = filteredStudents.slice(
    (studentPage - 1) * studentPageSize,
    studentPage * studentPageSize
  );

  // If a provider is selected for student drilldown, show student list
  if (selectedProviderForStudents) {
    return (
      <div className="space-y-4">
        {/* Banner Lembaga Terpilih */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
          <div className="flex items-start gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedProviderForStudents(null);
                setStudentSearchQuery("");
                setStudentPage(1);
              }}
              className="h-8 gap-1.5 text-xs rounded-lg shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Lembaga Vokasi</span>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-foreground">
                  {selectedProviderForStudents.name}
                </h4>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {selectedProviderForStudents.providerType}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedProviderForStudents.kabupatenKota}, {selectedProviderForStudents.provinsi} • Akreditasi:{" "}
                <span className="font-semibold text-foreground">
                  {selectedProviderForStudents.accreditation || "A"}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-1">
              <Users className="h-3.5 w-3.5 mr-1" />
              {providerStudents.length} Calon Peserta Terdata
            </Badge>
          </div>
        </div>

        {/* Pencarian Calon Peserta */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama siswa, target negara, sektor, atau jabatan..."
            value={studentSearchQuery}
            onChange={(e) => {
              setStudentSearchQuery(e.target.value);
              setStudentPage(1);
            }}
            className="pl-9 h-9 text-xs bg-background"
          />
        </div>

        {/* Daftar Siswa */}
        <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-card">
          {pagedStudents.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Tidak ada calon peserta yang cocok dengan kriteria pencarian.
            </div>
          ) : (
            pagedStudents.map((student, idx) => {
              const country = student.preferredCountry?.length ? student.preferredCountry.join(", ") : "Jepang";
              const sector = student.preferredSectors?.length ? student.preferredSectors.join(", ") : (student.major || "Caregiver & Hospitality");
              const occupation = student.preferredJobRole?.length ? student.preferredJobRole.join(", ") : "Caregiver / Kaigo";

              return (
                <div key={student.id ?? idx} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground">
                          {student.fullName}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                          {student.gender === "L" ? "Laki-laki" : "Perempuan"}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {student.educationLevel} {student.major ? `• ${student.major}` : ""}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                        <div className="rounded-md border border-border/60 bg-muted/20 px-2.5 py-1.5">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                            Negara Target
                          </span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                            <Globe2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">{country}</span>
                          </span>
                        </div>
                        <div className="rounded-md border border-border/60 bg-muted/20 px-2.5 py-1.5">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                            Sektor
                          </span>
                          <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                            <Briefcase className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className="truncate">{sector}</span>
                          </span>
                        </div>
                        <div className="rounded-md border border-border/60 bg-muted/20 px-2.5 py-1.5">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                            Jabatan
                          </span>
                          <span className="font-semibold text-primary flex items-center gap-1 mt-0.5">
                            <GraduationCap className="h-3 w-3 shrink-0" />
                            <span className="truncate">{occupation}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <Badge
                        variant={student.readinessStatus === "Ready for Placement" ? "default" : "outline"}
                        className={
                          student.readinessStatus === "Ready for Placement"
                            ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs"
                            : "text-xs"
                        }
                      >
                        {student.readinessStatus === "Ready for Placement"
                          ? "Siap Penempatan"
                          : student.readinessStatus === "Needs Upskilling"
                          ? "Perlu Upskilling"
                          : "Dalam Pelatihan"}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Siswa */}
        <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
          <span>
            <strong>{filteredStudents.length.toLocaleString("id-ID")}</strong> calon peserta terdaftar
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStudentPage(Math.max(1, studentPage - 1))}
              disabled={studentPage <= 1}
              className="h-7 text-xs px-2.5"
            >
              Sebelumnya
            </Button>
            <span className="tabular-nums">
              {studentPage} / {totalStudentPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStudentPage(Math.min(totalStudentPages, studentPage + 1))}
              disabled={studentPage >= totalStudentPages}
              className="h-7 text-xs px-2.5"
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isPesertaMode && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">
              Pilih Lembaga Vokasi Calon Peserta
            </h4>
            <p className="text-xs text-muted-foreground">
              Klik pada salah satu lembaga vokasi di bawah untuk melihat rincian calon peserta lengkap (nama siswa, negara target, sektor, dan jabatan).
            </p>
          </div>
        </div>
      )}

      {/* 4 Mini Stat Boxes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStatBox
          icon={Building2}
          label={isNational ? "Total LPK" : "Lembaga"}
          value={isNational && filterStack.length === 0 ? (provinceTotalCount || filteredProviders.length) : filteredProviders.length}
        />
        <MiniStatBox
          icon={MapPin}
          label="Provinsi"
          value={isNational && filterStack.length === 0 ? (provinceCounts.length || uniqueProvinces) : uniqueProvinces}
        />
        <MiniStatBox
          icon={CheckCircle2}
          label="Terverifikasi"
          value={provinceTotalRegistered}
        />
        <MiniStatBox
          icon={Briefcase}
          label="Sektor"
          value={uniqueSectors}
        />
      </div>

      {viewMode === "categories" ? (
        <div className="space-y-6">
          {/* Sebaran Wilayah / Provinsi Section (Tampil Utama) */}
          {!filterStack.some((s) => s.province) && provinceCounts.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>
                      {isNational
                        ? "Sebaran lembaga terdaftar per provinsi"
                        : "Sebaran lembaga vokasi per provinsi"}
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isNational
                      ? `${provinceTotalRegistered.toLocaleString("id-ID")} terdaftar dari ${provinceTotalCount.toLocaleString("id-ID")} lembaga di seluruh Indonesia (Pilih provinsi untuk menyaring)`
                      : `${provinceTotalRegistered.toLocaleString("id-ID")} terdaftar dari ${provinceTotalCount.toLocaleString("id-ID")} lembaga di ${scopeName || "lingkup Anda"} (Pilih provinsi untuk menyaring)`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 tabular-nums">
                    {Math.round((provinceTotalRegistered / (provinceTotalCount || 1)) * 100)}% Terverifikasi
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {(showAllProvinces ? provinceCounts : provinceCounts.slice(0, 8)).map((item) => (
                  <button
                    key={item.province}
                    type="button"
                    onClick={() =>
                      onPushFilter({
                        tag: "PROVINSI",
                        title: item.province,
                        subtitle: `${item.registeredCount} terdaftar dari ${item.totalCount} ${isNational ? "LPK" : "lembaga"} di ${item.province}.`,
                        province: item.province,
                      })
                    }
                    className="p-3 rounded-lg border border-border/70 bg-muted/20 hover:bg-muted/50 hover:border-primary/50 transition-all text-left group"
                  >
                    <ProvinceRatioBar
                      label={item.province}
                      registered={item.registeredCount}
                      total={item.totalCount}
                      maxTotal={provinceMaxTotal}
                      unitLabel={isNational ? "LPK" : "lembaga"}
                    />
                  </button>
                ))}
              </div>

              {provinceCounts.length > 8 && (
                <div className="pt-2 flex justify-center border-t border-border/50">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllProvinces(!showAllProvinces)}
                    className="text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    {showAllProvinces
                      ? "Tampilkan Lebih Sedikit (8 Wilayah)"
                      : `Tampilkan Semua (${provinceCounts.length} Provinsi)`}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Layer Section */}
          {!filterStack.some((s) => s.layer) && (
            <div>
              <h3 className="text-xs font-bold text-foreground mb-2.5">
                Rincian per layer e-Vokasi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {layerCounts.map((item) => (
                  <DrilldownCard
                    key={item.name}
                    title={item.name}
                    subtitle={`${item.count.toLocaleString("id-ID")} lembaga`}
                    onClick={() =>
                      onPushFilter({
                        tag: "LAYER E-VOKASI",
                        title: item.name,
                        subtitle: `${item.count} lembaga. Pilih rincian di bawah untuk mempersempit daftar.`,
                        layer: item.name,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Category Section */}
          {!filterStack.some((s) => s.category) && categoryCounts.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-foreground mb-2.5">
                Pilihan kategori lembaga
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {categoryCounts.map((item) => (
                  <DrilldownCard
                    key={item.name}
                    title={item.name}
                    subtitle={`${item.count.toLocaleString("id-ID")} lembaga`}
                    onClick={() =>
                      onPushFilter({
                        tag: "KATEGORI LEMBAGA",
                        title: item.name,
                        subtitle: `${item.count} lembaga. Pilih rincian di bawah untuk mempersempit daftar.`,
                        category: item.name,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sector Section */}
          {!filterStack.some((s) => s.sector) && sectorCounts.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-foreground mb-2.5">
                Rincian sektor
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {sectorCounts.slice(0, 10).map((item) => (
                  <DrilldownCard
                    key={item.name}
                    title={item.name}
                    subtitle={`${item.count.toLocaleString("id-ID")} lembaga`}
                    onClick={() =>
                      onPushFilter({
                        tag: "SEKTOR",
                        title: item.name,
                        subtitle: `${item.count} lembaga. Pilih rincian di bawah untuk mempersempit daftar.`,
                        sector: item.name,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Occupation Section (if sector chosen) */}
          {currentSector && occupationCounts.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-foreground mb-2.5">
                Jabatan di sektor {currentSector}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {occupationCounts.map((item) => (
                  <DrilldownCard
                    key={item.name}
                    title={item.name}
                    subtitle={`${item.count.toLocaleString("id-ID")} lembaga`}
                    onClick={() =>
                      onPushFilter({
                        tag: "JABATAN",
                        title: item.name,
                        subtitle: `${item.count} lembaga menawarkan jabatan ini.`,
                        occupation: item.name,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama lembaga atau kabupaten/kota..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-card">
            {pagedProviders.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Tidak ada lembaga yang sesuai dengan kriteria filter saat ini.
              </div>
            ) : (
              pagedProviders.map((provider) => {
                const count = providerStudentsCountMap.get(provider.id) ?? 20;
                return (
                  <div
                    key={provider.id}
                    onClick={() => {
                      setSelectedProviderForStudents(provider);
                      setStudentSearchQuery("");
                      setStudentPage(1);
                    }}
                    className="p-4 hover:bg-muted/40 transition-colors cursor-pointer group"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedProviderForStudents(provider);
                        setStudentSearchQuery("");
                        setStudentPage(1);
                      }
                    }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                            <span>{provider.name}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {provider.providerType}
                          </Badge>
                          {provider.layer && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {provider.layer}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {provider.kabupatenKota}, {provider.provinsi} • Akreditasi:{" "}
                          <span className="font-medium text-foreground">
                            {provider.accreditation || "Belum"}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3 justify-between md:justify-end shrink-0">
                        <span className="text-xs text-muted-foreground">
                          Kapasitas: {provider.capacityPerBatch ?? "—"} peserta
                        </span>
                        <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:underline">
                          <Users className="h-3.5 w-3.5" />
                          {count} Calon Peserta &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
        <span>
          <strong>{filteredProviders.length.toLocaleString("id-ID")}</strong> lembaga
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="h-7 text-xs px-2.5"
          >
            Sebelumnya
          </Button>
          <span className="tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="h-7 text-xs px-2.5"
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. CALON PESERTA DRILLDOWN
// ==========================================
interface PesertaDrilldownProps {
  candidates: CandidateParticipant[];
  filterStack: FilterStep[];
  onPushFilter: (step: FilterStep) => void;
  viewMode: "categories" | "list";
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
}

const PesertaDrilldown: React.FC<PesertaDrilldownProps> = ({
  candidates,
  filterStack,
  onPushFilter,
  viewMode,
  searchQuery,
  setSearchQuery,
  page,
  setPage,
  pageSize,
}) => {
  const filteredCandidates = useMemo(() => {
    let result = candidates;
    for (const step of filterStack) {
      if (step.lifecycleStatus) {
        result = result.filter(
          (c) => (c.lifecycleStatus ?? "DRAFT") === step.lifecycleStatus
        );
      }
      if (step.readinessStatus) {
        result = result.filter(
          (c) => c.readinessStatus === step.readinessStatus
        );
      }
      if (step.sourceType) {
        result = result.filter(
          (c) => (c.sourceType ?? "Disnaker Pemda") === step.sourceType
        );
      }
      if (step.country) {
        result = result.filter((c) =>
          c.preferredCountry?.includes(step.country!)
        );
      }
      if (step.sector) {
        result = result.filter(
          (c) =>
            c.preferredSectors?.includes(step.sector!) ||
            c.major?.toLowerCase().includes(step.sector!.toLowerCase())
        );
      }
    }
    return result;
  }, [candidates, filterStack]);

  const uniqueDistricts = useMemo(() => {
    return new Set(
      filteredCandidates.map((c) => c.kabupatenKota).filter(Boolean)
    ).size;
  }, [filteredCandidates]);

  const uniqueSectors = useMemo(() => {
    const set = new Set<string>();
    filteredCandidates.forEach((c) => {
      c.preferredSectors?.forEach((s) => set.add(s));
      if (c.major) set.add(c.major);
    });
    return set.size;
  }, [filteredCandidates]);

  const uniqueRoles = useMemo(() => {
    const set = new Set<string>();
    filteredCandidates.forEach((c) => {
      c.preferredJobRole?.forEach((r) => set.add(r));
    });
    return set.size || uniqueSectors * 2;
  }, [filteredCandidates, uniqueSectors]);

  // Breakdowns
  const lifecycleCounts = useMemo(() => {
    const map = new Map<string, number>();
    const labels: Record<string, string> = {
      DRAFT: "Draf",
      SUBMITTED: "Diajukan",
      IN_REVIEW: "Dalam pemeriksaan",
      APPROVED: "Disetujui",
      REJECTED: "Ditolak",
    };
    filteredCandidates.forEach((c) => {
      const status = c.lifecycleStatus ?? "DRAFT";
      map.set(status, (map.get(status) ?? 0) + 1);
    });
    return Array.from(map, ([code, count]) => ({
      code,
      name: labels[code] ?? code,
      count,
    }));
  }, [filteredCandidates]);

  const readinessCounts = useMemo(() => {
    const map = new Map<string, number>();
    filteredCandidates.forEach((c) => {
      map.set(c.readinessStatus, (map.get(c.readinessStatus) ?? 0) + 1);
    });
    return Array.from(map, ([name, count]) => ({ name, count }));
  }, [filteredCandidates]);

  const sourceCounts = useMemo(() => {
    const map = new Map<string, number>();
    filteredCandidates.forEach((c) => {
      const src = c.sourceType ?? "Disnaker Pemda";
      map.set(src, (map.get(src) ?? 0) + 1);
    });
    return Array.from(map, ([name, count]) => ({ name, count }));
  }, [filteredCandidates]);

  const countryCounts = useMemo(() => {
    const map = new Map<string, number>();
    filteredCandidates.forEach((c) => {
      c.preferredCountry?.forEach((country) => {
        map.set(country, (map.get(country) ?? 0) + 1);
      });
    });
    return Array.from(map, ([name, count]) => ({ name, count })).sort(
      (a, b) => b.count - a.count
    );
  }, [filteredCandidates]);

  // Search in list
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return filteredCandidates;
    const q = searchQuery.toLowerCase();
    return filteredCandidates.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.nik.toLowerCase().includes(q) ||
        c.kabupatenKota.toLowerCase().includes(q) ||
        c.major.toLowerCase().includes(q)
    );
  }, [filteredCandidates, searchQuery]);

  const totalPages = Math.ceil(searchResults.length / pageSize) || 1;
  const pagedCandidates = searchResults.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStatBox
          icon={Users}
          label="Peserta"
          value={filteredCandidates.length}
        />
        <MiniStatBox
          icon={MapPin}
          label="Kab/Kota"
          value={uniqueDistricts}
        />
        <MiniStatBox
          icon={Briefcase}
          label="Sektor Minat"
          value={uniqueSectors}
        />
        <MiniStatBox
          icon={Award}
          label="Jabatan Minat"
          value={uniqueRoles}
        />
      </div>

      {viewMode === "categories" ? (
        <div className="space-y-6">
          {/* Status Lifecycle */}
          {!filterStack.some((s) => s.lifecycleStatus) && (
            <div>
              <h3 className="text-xs font-bold text-foreground mb-2.5">
                Status data calon peserta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {lifecycleCounts.map((item) => (
                  <DrilldownCard
                    key={item.code}
                    title={item.name}
                    subtitle={`${item.count.toLocaleString("id-ID")} peserta`}
                    onClick={() =>
                      onPushFilter({
                        tag: "STATUS DATA",
                        title: item.name,
                        subtitle: `${item.count} peserta pada status ini.`,
                        lifecycleStatus: item.code,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Kesiapan Peserta */}
          {!filterStack.some((s) => s.readinessStatus) && (
            <div>
              <h3 className="text-xs font-bold text-foreground mb-2.5">
                Status kesiapan peserta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {readinessCounts.map((item) => (
                  <DrilldownCard
                    key={item.name}
                    title={item.name}
                    subtitle={`${item.count.toLocaleString("id-ID")} peserta`}
                    onClick={() =>
                      onPushFilter({
                        tag: "STATUS KESIAPAN",
                        title: item.name,
                        subtitle: `${item.count} peserta pada kesiapan ini.`,
                        readinessStatus: item.name,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sumber Data */}
          {!filterStack.some((s) => s.sourceType) && (
            <div>
              <h3 className="text-xs font-bold text-foreground mb-2.5">
                Sumber pendaftaran peserta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {sourceCounts.map((item) => (
                  <DrilldownCard
                    key={item.name}
                    title={item.name}
                    subtitle={`${item.count.toLocaleString("id-ID")} peserta`}
                    onClick={() =>
                      onPushFilter({
                        tag: "SUMBER DATA",
                        title: item.name,
                        subtitle: `${item.count} peserta dari sumber ini.`,
                        sourceType: item.name,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pilihan Negara Tujuan */}
          {!filterStack.some((s) => s.country) && countryCounts.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-foreground mb-2.5">
                Minat negara penempatan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {countryCounts.map((item) => (
                  <DrilldownCard
                    key={item.name}
                    title={item.name}
                    subtitle={`${item.count.toLocaleString("id-ID")} peserta`}
                    onClick={() =>
                      onPushFilter({
                        tag: "NEGARA TUJUAN",
                        title: item.name,
                        subtitle: `${item.count} peserta berminat ke ${item.name}.`,
                        country: item.name,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, NIK, atau kejuruan peserta..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-card">
            {pagedCandidates.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Tidak ada data peserta yang cocok dengan filter ini.
              </div>
            ) : (
              pagedCandidates.map((candidate) => (
                <div key={candidate.id} className="p-4 hover:bg-muted/40 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {candidate.fullName}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          ({candidate.nik})
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {candidate.educationLevel}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {candidate.kabupatenKota}, {candidate.provinsi} • Jurusan:{" "}
                        <span className="font-medium text-foreground">
                          {candidate.major}
                        </span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <Badge
                        variant={
                          candidate.readinessStatus === "Ready for Placement"
                            ? "default"
                            : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {candidate.readinessStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
        <span>
          <strong>{filteredCandidates.length.toLocaleString("id-ID")}</strong> peserta
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="h-7 text-xs px-2.5"
          >
            Sebelumnya
          </Button>
          <span className="tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="h-7 text-xs px-2.5"
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. PROGRAM PELATIHAN DRILLDOWN
// ==========================================
interface ProgramDrilldownProps {
  programs: TrainingProgram[];
  filterStack: FilterStep[];
  onPushFilter: (step: FilterStep) => void;
  viewMode: "categories" | "list";
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
}

const ProgramDrilldown: React.FC<ProgramDrilldownProps> = ({
  programs,
  filterStack,
  onPushFilter,
  viewMode,
  searchQuery,
  setSearchQuery,
  page,
  setPage,
  pageSize,
}) => {
  const filteredPrograms = useMemo(() => {
    let result = programs;
    for (const step of filterStack) {
      if (step.sector) {
        result = result.filter((p) => p.targetSector === step.sector);
      }
      if (step.occupation) {
        result = result.filter((p) => p.targetJobRole === step.occupation);
      }
      if (step.country) {
        result = result.filter((p) => p.targetCountry === step.country);
      }
    }
    return result;
  }, [programs, filterStack]);

  const uniqueInstitutions = useMemo(() => {
    return new Set(filteredPrograms.map((p) => p.institutionName).filter(Boolean))
      .size;
  }, [filteredPrograms]);

  const uniqueSectors = useMemo(() => {
    return new Set(filteredPrograms.map((p) => p.targetSector).filter(Boolean))
      .size;
  }, [filteredPrograms]);

  const uniqueJobs = useMemo(() => {
    return new Set(filteredPrograms.map((p) => p.targetJobRole).filter(Boolean))
      .size;
  }, [filteredPrograms]);

  const sectorCounts = useMemo(() => {
    const map = new Map<string, number>();
    filteredPrograms.forEach((p) => {
      const s = p.targetSector || "Umum";
      map.set(s, (map.get(s) ?? 0) + 1);
    });
    return Array.from(map, ([name, count]) => ({ name, count })).sort(
      (a, b) => b.count - a.count
    );
  }, [filteredPrograms]);

  const countryCounts = useMemo(() => {
    const map = new Map<string, number>();
    filteredPrograms.forEach((p) => {
      const c = p.targetCountry || "Belum ditentukan";
      map.set(c, (map.get(c) ?? 0) + 1);
    });
    return Array.from(map, ([name, count]) => ({ name, count })).sort(
      (a, b) => b.count - a.count
    );
  }, [filteredPrograms]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return filteredPrograms;
    const q = searchQuery.toLowerCase();
    return filteredPrograms.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.targetSector.toLowerCase().includes(q) ||
        p.targetJobRole.toLowerCase().includes(q) ||
        (p.institutionName ?? "").toLowerCase().includes(q)
    );
  }, [filteredPrograms, searchQuery]);

  const totalPages = Math.ceil(searchResults.length / pageSize) || 1;
  const pagedPrograms = searchResults.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStatBox
          icon={GraduationCap}
          label="Program"
          value={filteredPrograms.length}
        />
        <MiniStatBox
          icon={Building2}
          label="Lembaga"
          value={uniqueInstitutions}
        />
        <MiniStatBox
          icon={Briefcase}
          label="Sektor"
          value={uniqueSectors}
        />
        <MiniStatBox
          icon={Award}
          label="Jabatan"
          value={uniqueJobs}
        />
      </div>

      {viewMode === "categories" ? (
        <div className="space-y-6">
          {!filterStack.some((s) => s.sector) && sectorCounts.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-foreground mb-2.5">
                Rincian sektor program pelatihan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {sectorCounts.slice(0, 10).map((item) => (
                  <DrilldownCard
                    key={item.name}
                    title={item.name}
                    subtitle={`${item.count.toLocaleString("id-ID")} program`}
                    onClick={() =>
                      onPushFilter({
                        tag: "SEKTOR PELATIHAN",
                        title: item.name,
                        subtitle: `${item.count} program pelatihan di sektor ini.`,
                        sector: item.name,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {!filterStack.some((s) => s.country) && countryCounts.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-foreground mb-2.5">
                Target negara tujuan pelatihan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {countryCounts.map((item) => (
                  <DrilldownCard
                    key={item.name}
                    title={item.name}
                    subtitle={`${item.count.toLocaleString("id-ID")} program`}
                    onClick={() =>
                      onPushFilter({
                        tag: "NEGARA TUJUAN",
                        title: item.name,
                        subtitle: `${item.count} program mengarah ke negara ini.`,
                        country: item.name,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari program, lembaga, atau kejuruan..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-card">
            {pagedPrograms.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Tidak ada program pelatihan yang sesuai dengan kriteria.
              </div>
            ) : (
              pagedPrograms.map((prog) => (
                <div key={prog.id} className="p-4 hover:bg-muted/40 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-sm text-foreground">
                        {prog.title}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {prog.institutionName ?? "Lembaga Vokasi"} • Sektor:{" "}
                        <span className="text-foreground">{prog.targetSector}</span> (
                        {prog.targetJobRole})
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold tabular-nums text-primary">
                        {prog.durationJP} JP
                      </span>
                      <span className="text-xs text-muted-foreground block">
                        Kuota: {prog.quota}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
        <span>
          <strong>{filteredPrograms.length.toLocaleString("id-ID")}</strong> program
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="h-7 text-xs px-2.5"
          >
            Sebelumnya
          </Button>
          <span className="tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="h-7 text-xs px-2.5"
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. DEMAND DRILLDOWN
// ==========================================
interface DemandDrilldownProps {
  demands: GlobalDemand[];
  filterStack: FilterStep[];
  onPushFilter: (step: FilterStep) => void;
  viewMode: "categories" | "list";
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
}

const DemandDrilldown: React.FC<DemandDrilldownProps> = ({
  demands,
  filterStack,
  onPushFilter,
  viewMode,
  searchQuery,
  setSearchQuery,
  page,
  setPage,
  pageSize,
}) => {
  const filteredDemands = useMemo(() => {
    let result = demands;
    for (const step of filterStack) {
      if (step.country) {
        result = result.filter((d) => d.country === step.country);
      }
      if (step.sector) {
        result = result.filter((d) => d.sector === step.sector);
      }
    }
    return result;
  }, [demands, filterStack]);

  const uniqueCountries = useMemo(() => {
    return new Set(filteredDemands.map((d) => d.country).filter(Boolean)).size;
  }, [filteredDemands]);

  const totalQuota = useMemo(() => {
    return filteredDemands.reduce((sum, d) => sum + d.requiredQuota, 0);
  }, [filteredDemands]);

  const countryCounts = useMemo(() => {
    const map = new Map<string, { count: number; quota: number }>();
    filteredDemands.forEach((d) => {
      const c = d.country || "Belum ditentukan";
      const curr = map.get(c) ?? { count: 0, quota: 0 };
      map.set(c, { count: curr.count + 1, quota: curr.quota + d.requiredQuota });
    });
    return Array.from(map, ([name, data]) => ({ name, ...data }));
  }, [filteredDemands]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return filteredDemands;
    const q = searchQuery.toLowerCase();
    return filteredDemands.filter(
      (d) =>
        d.jobTitle.toLowerCase().includes(q) ||
        d.country.toLowerCase().includes(q) ||
        d.employerName.toLowerCase().includes(q)
    );
  }, [filteredDemands, searchQuery]);

  const totalPages = Math.ceil(searchResults.length / pageSize) || 1;
  const pagedDemands = searchResults.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStatBox
          icon={Globe2}
          label="Lowongan Demand"
          value={filteredDemands.length}
        />
        <MiniStatBox
          icon={MapPin}
          label="Negara Tujuan"
          value={uniqueCountries}
        />
        <MiniStatBox
          icon={Users}
          label="Total Kuota Pekerja"
          value={totalQuota}
        />
        <MiniStatBox
          icon={CheckCircle2}
          label="Terpenuhi"
          value={filteredDemands.reduce((sum, d) => sum + d.filledQuota, 0)}
        />
      </div>

      {countryCounts.length > 0 ? (
        <div>
          <h3 className="text-xs font-bold text-foreground mb-2.5">
            Rincian demand per negara
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {countryCounts.map((item) => (
              <DrilldownCard
                key={item.name}
                title={item.name}
                subtitle={`${item.count} lowongan • Kuota: ${item.quota.toLocaleString("id-ID")} orang`}
                onClick={() =>
                  onPushFilter({
                    tag: "NEGARA TUJUAN",
                    title: item.name,
                    subtitle: `${item.count} permintaan kerja ke ${item.name}.`,
                    country: item.name,
                  })
                }
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
          Belum ada lowongan demand luar negeri yang tervalidasi pada lingkup ini.
        </div>
      )}
    </div>
  );
};

// ==========================================
// 5. ALOKASI DRILLDOWN
// ==========================================
interface AlokasiDrilldownProps {
  allocations: ProgramAllocationDecision[];
  filterStack: FilterStep[];
  onPushFilter: (step: FilterStep) => void;
  viewMode: "categories" | "list";
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
}

const AlokasiDrilldown: React.FC<AlokasiDrilldownProps> = ({
  allocations,
  filterStack,
  onPushFilter,
  viewMode,
  searchQuery,
  setSearchQuery,
  page,
  setPage,
  pageSize,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStatBox
          icon={Workflow}
          label="Batch Dialokasi"
          value={allocations.length}
        />
        <MiniStatBox
          icon={Users}
          label="Peserta Terpilih"
          value={allocations.reduce((sum, a) => sum + (a.allocatedCandidateIds?.length ?? 0), 0)}
        />
        <MiniStatBox
          icon={Building2}
          label="Lembaga Mitra"
          value={new Set(allocations.map((a) => a.selectedProviderId).filter(Boolean)).size}
        />
        <MiniStatBox
          icon={CheckCircle2}
          label="Batch Selesai"
          value={allocations.filter((a) => a.approvalStatus === "Finalized").length}
        />
      </div>

      <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
        {allocations.length === 0
          ? "Belum ada penetapan alokasi batch penempatan pada lingkup ini."
          : `${allocations.length} batch alokasi telah terdaftar.`}
      </div>
    </div>
  );
};

// ==========================================
// SHARED MINI-COMPONENTS
// ==========================================
function MiniStatBox({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="p-3.5 rounded-xl border border-border bg-card/60 flex flex-col justify-between">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-xl md:text-2xl font-bold tabular-nums text-foreground">
        {value.toLocaleString("id-ID")}
      </div>
    </div>
  );
}

function DrilldownCard({
  title,
  subtitle,
  badge,
  onClick,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:border-primary/60 hover:bg-muted/40 transition-all text-left group w-full"
    >
      <div className="flex-1 pr-2">
        <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors block">
          {title}
        </span>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 tabular-nums">
            {badge}
          </span>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}

function getRootTag(type: DrilldownType, scopeName: string): string {
  switch (type) {
    case "lembaga":
      return `RINGKASAN PENDATAAN • ${scopeName.toUpperCase()}`;
    case "national_lpk":
      return "RINGKASAN NASIONAL • SELURUH INDONESIA";
    case "peserta":
      return `RINGKASAN CALON PESERTA • ${scopeName.toUpperCase()}`;
    case "program":
      return `KATALOG PROGRAM PELATIHAN • ${scopeName.toUpperCase()}`;
    case "demand":
      return `DEMAND LUAR NEGERI • ${scopeName.toUpperCase()}`;
    case "alokasi":
      return `ALOKASI PENEMPATAN • ${scopeName.toUpperCase()}`;
  }
}

function getRootTitle(type: DrilldownType): string {
  switch (type) {
    case "lembaga":
      return "Semua Lembaga Vokasi (LPK)";
    case "national_lpk":
      return "Lembaga Terdaftar Nasional";
    case "peserta":
      return "Semua Calon Peserta";
    case "program":
      return "Semua Program Pelatihan";
    case "demand":
      return "Lowongan Demand Luar Negeri";
    case "alokasi":
      return "Alokasi Batch Penempatan";
  }
}
