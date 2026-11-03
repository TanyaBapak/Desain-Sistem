import React, { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  GraduationCap,
  Building2,
  Globe2,
  Workflow,
  CheckCircle2,
  Clock,
  Briefcase,
  BriefcaseBusiness,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type {
  PublicCommandCenterData,
  PublicPreviewInstitution,
  PublicPreviewDemand,
  TrainingSectorCatalogItem,
} from "@/types";
import { InstitutionSourceBadge } from "@/components/shared/InstitutionSourceBadge";
import {
  resolveInstitutionSource,
  resolveInstitutionInputLevel,
  InstitutionInputLevel,
} from "@/lib/institution-source";
import { ALL_REGISTERED_CANDIDATES } from "@/data/realSupplyCandidates";
import type { CandidateParticipant } from "@/types";
import { CandidateDetailModal } from "@/components/modul-a/CandidateDetailModal";
import { cn } from "@/lib/utils";

export type PublicDrilldownType =
  | "peserta"
  | "program"
  | "lembaga"
  | "national_lpk"
  | "demand"
  | "alokasi"
  | "sebaran_lembaga";

interface PublicDrilldownModalProps {
  type: PublicDrilldownType | null;
  onClose: () => void;
  scopeName: string;
  data: PublicCommandCenterData;
  initialSector?: string | null;
  initialSourceFilter?: "ALL" | "siskop2mi" | "disnaker" | "umum";
  sectorOccupations: Record<string, string[]>;
  trainingSectors: TrainingSectorCatalogItem[];
}

function normalizeCatalogValue(value: string): string {
  return value.trim().toLocaleLowerCase("id-ID");
}

export const PublicDrilldownModal: React.FC<PublicDrilldownModalProps> = ({
  type,
  onClose,
  scopeName,
  data,
  initialSector = null,
  initialSourceFilter = "ALL",
  sectorOccupations,
  trainingSectors,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(
    initialSector,
  );
  const [selectedOccupation, setSelectedOccupation] = useState<string | null>(
    null,
  );
  const [selectedInstitutionForStudents, setSelectedInstitutionForStudents] = useState<PublicPreviewInstitution | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>("");
  const [candidateSearchQuery, setCandidateSearchQuery] = useState<string>("");
  const [selectedCandidateForDetail, setSelectedCandidateForDetail] = useState<CandidateParticipant | null>(null);
  const [selectedProvinceForLpk, setSelectedProvinceForLpk] = useState<string | null>(null);
  const [institutionSourceFilter, setInstitutionSourceFilter] = useState<"ALL" | "siskop2mi" | "disnaker" | "umum">(initialSourceFilter);
  const [institutionLevelFilter, setInstitutionLevelFilter] = useState<"ALL" | InstitutionInputLevel>("ALL");
  const [institutionStatusFilter, setInstitutionStatusFilter] = useState<"ALL" | "supply" | "verified">("supply");
  const [institutionSearchQuery, setInstitutionSearchQuery] = useState<string>("");
  const [institutionPage, setInstitutionPage] = useState<number>(1);

  useEffect(() => {
    setSelectedCountry(null);
    setSelectedSector(initialSector);
    setSelectedOccupation(null);
    setSelectedInstitutionForStudents(null);
    setSelectedProvinceForLpk(null);
    setStudentSearchQuery("");
    setCandidateSearchQuery("");
    setSelectedCandidateForDetail(null);
    setInstitutionSourceFilter(initialSourceFilter);
    setInstitutionLevelFilter("ALL");
    setInstitutionStatusFilter("supply");
    setInstitutionSearchQuery("");
    setInstitutionPage(1);
  }, [type, initialSector, initialSourceFilter]);

  const institutions: PublicPreviewInstitution[] = useMemo(() => {
    return (data.previewDirectories?.institutions ?? []).map((inst) => ({
      ...inst,
      registrationSource: resolveInstitutionSource(inst),
      inputLevel: resolveInstitutionInputLevel(inst),
    }));
  }, [data.previewDirectories?.institutions]);

  const verifiedInstitutions = useMemo(
    () => institutions.filter((institution) => institution.evokasiStatus === "Terverifikasi e-Vokasi"),
    [institutions],
  );

  const demands: PublicPreviewDemand[] = useMemo(() => {
    return data.previewDirectories?.demands ?? [];
  }, [data.previewDirectories?.demands]);
  const nationalLpkList = data.nationalLpkByProvince ?? [];
  const institutionsList = data.institutionsByProvince ?? [];
  const sectors = trainingSectors.map((sector) => sector.name);
  const selectedSectorData = trainingSectors.find((sector) => sector.name === selectedSector);
  const selectedSectorAliases = [
    selectedSectorData?.name ?? "",
    ...(selectedSectorData?.aliases ?? []),
  ].map(normalizeCatalogValue);
  const selectedOccupationData = selectedSectorData?.occupations?.find((occupation) =>
    [occupation.title, ...(occupation.aliases ?? [])]
      .some((value) => normalizeCatalogValue(value) === normalizeCatalogValue(selectedOccupation ?? "")),
  );
  const selectedOccupationAliases = [
    selectedOccupation ?? "",
    ...(selectedOccupationData ? [selectedOccupationData.title, ...(selectedOccupationData.aliases ?? [])] : []),
  ].map(normalizeCatalogValue);
  const filteredInstitutions =
    selectedSector && selectedOccupation
      ? institutions.filter((institution) => {
          const supportsSelectedSector =
            !institution.supportedSectors?.length ||
            institution.supportedSectors.some((supportedSector) => {
              const normalizedSupportedSector = supportedSector
                .trim()
                .toLocaleLowerCase("id-ID");
              return selectedSectorAliases.includes(normalizedSupportedSector);
            });
          const supportsSelectedOccupation =
            institution.supportedOccupations && institution.supportedOccupations.length > 0
              ? institution.supportedOccupations.some(
                  (occupation) => selectedOccupationAliases.includes(normalizeCatalogValue(occupation)),
                )
              : true;

          return supportsSelectedSector && supportsSelectedOccupation;
        })
      : [];

  const matchingCandidates = useMemo(() => {
    if (!selectedOccupation) return [];
    const occLower = selectedOccupation.toLowerCase().trim();
    const secLower = (selectedSector || "").toLowerCase().trim();

    return ALL_REGISTERED_CANDIDATES.filter((c) => {
      // 1. Direct matches
      if (
        c.preferredJobRole?.some(
          (role) =>
            role.toLowerCase().includes(occLower) ||
            occLower.includes(role.toLowerCase())
        )
      ) {
        return true;
      }
      if (c.major?.toLowerCase().includes(occLower)) {
        return true;
      }
      if (c.skills?.some((sk) => sk.toLowerCase().includes(occLower))) {
        return true;
      }

      // 2. Keyword & semantic mapping for occupations
      if (occLower.includes("waiter") || occLower.includes("barista")) {
        return (
          c.major?.toLowerCase().includes("beverage") ||
          c.major?.toLowerCase().includes("waiter") ||
          c.major?.toLowerCase().includes("barista") ||
          c.preferredJobRole?.some(
            (r) =>
              r.toLowerCase().includes("waiter") ||
              r.toLowerCase().includes("barista") ||
              r.toLowerCase().includes("beverage")
          )
        );
      }
      if (occLower.includes("housekeeping") || occLower.includes("cleaner")) {
        return (
          c.major?.toLowerCase().includes("accommodation") ||
          c.major?.toLowerCase().includes("housekeeping") ||
          c.preferredJobRole?.some(
            (r) =>
              r.toLowerCase().includes("housekeeping") ||
              r.toLowerCase().includes("steward") ||
              r.toLowerCase().includes("accommodation")
          )
        );
      }
      if (occLower.includes("cook")) {
        return (
          c.major?.toLowerCase().includes("kuliner") ||
          c.major?.toLowerCase().includes("culinary") ||
          c.preferredJobRole?.some(
            (r) =>
              r.toLowerCase().includes("cook") ||
              r.toLowerCase().includes("chef") ||
              r.toLowerCase().includes("culinary")
          )
        );
      }
      if (occLower.includes("spa") || occLower.includes("therapist")) {
        return (
          c.major?.toLowerCase().includes("spa") ||
          c.major?.toLowerCase().includes("pariwisata") ||
          c.preferredSectors?.some((s) => s.toLowerCase().includes("hospitality"))
        );
      }
      if (occLower.includes("weld") || occLower.includes("las") || occLower.includes("fabrikasi")) {
        return (
          c.major?.toLowerCase().includes("mesin") ||
          c.major?.toLowerCase().includes("las") ||
          c.major?.toLowerCase().includes("weld") ||
          c.preferredJobRole?.some((r) => r.toLowerCase().includes("weld"))
        );
      }
      if (occLower.includes("caregiver") || occLower.includes("perawat") || occLower.includes("kaigo")) {
        return (
          c.major?.toLowerCase().includes("keperawatan") ||
          c.major?.toLowerCase().includes("caregiver") ||
          c.preferredJobRole?.some(
            (r) =>
              r.toLowerCase().includes("caregiver") ||
              r.toLowerCase().includes("kaigo")
          )
        );
      }
      if (occLower.includes("cnc") || occLower.includes("bubut") || occLower.includes("mesin") || occLower.includes("operator")) {
        return (
          c.major?.toLowerCase().includes("mesin") ||
          c.major?.toLowerCase().includes("manufaktur") ||
          c.preferredJobRole?.some(
            (r) =>
              r.toLowerCase().includes("cnc") ||
              r.toLowerCase().includes("operator") ||
              r.toLowerCase().includes("mesin")
          )
        );
      }
      if (occLower.includes("otomotif") || occLower.includes("alat berat") || occLower.includes("mekanik")) {
        return (
          c.major?.toLowerCase().includes("otomotif") ||
          c.preferredJobRole?.some(
            (r) =>
              r.toLowerCase().includes("otomotif") ||
              r.toLowerCase().includes("mekanik")
          )
        );
      }
      if (occLower.includes("it") || occLower.includes("software") || occLower.includes("programmer") || occLower.includes("informatika")) {
        return (
          c.major?.toLowerCase().includes("informatika") ||
          c.major?.toLowerCase().includes("software") ||
          c.major?.toLowerCase().includes("it")
        );
      }
      if (occLower.includes("bahasa") || occLower.includes("komunikasi")) {
        return (
          c.major?.toLowerCase().includes("bahasa") ||
          c.major?.toLowerCase().includes("komunikasi")
        );
      }
      if (occLower.includes("bisnis") || occLower.includes("logistik")) {
        return (
          c.major?.toLowerCase().includes("bisnis") ||
          c.major?.toLowerCase().includes("logistik")
        );
      }

      // 3. Fallback: match by sector
      if (secLower && c.preferredSectors?.some((s) => s.toLowerCase().includes(secLower))) {
        return true;
      }

      return false;
    });
  }, [selectedOccupation, selectedSector]);

  const filteredCandidates = useMemo(() => {
    const q = candidateSearchQuery.trim().toLowerCase();
    if (!q) return matchingCandidates;
    return matchingCandidates.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.nik.toLowerCase().includes(q) ||
        (c.institutionName && c.institutionName.toLowerCase().includes(q)) ||
        (c.major && c.major.toLowerCase().includes(q)) ||
        (c.kabupatenKota && c.kabupatenKota.toLowerCase().includes(q))
    );
  }, [matchingCandidates, candidateSearchQuery]);

  const provinceInstitutions = useMemo(() => {
    if (!selectedProvinceForLpk) return [];
    const cleanSelected = selectedProvinceForLpk.toLowerCase().trim();
    return institutions.filter((inst) => {
      const prov = (inst.province || "").toLowerCase().trim();
      return prov.includes(cleanSelected) || cleanSelected.includes(prov);
    });
  }, [selectedProvinceForLpk, institutions]);

  const renderStudentList = () => {
    if (!selectedInstitutionForStudents) return null;
    const students = selectedInstitutionForStudents.students ?? [];
    const q = studentSearchQuery.trim().toLowerCase();
    const filtered = q
      ? students.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.targetCountry.toLowerCase().includes(q) ||
            s.sector.toLowerCase().includes(q) ||
            s.occupation.toLowerCase().includes(q)
        )
      : students;

    return (
      <div className="space-y-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedInstitutionForStudents(null);
            setStudentSearchQuery("");
          }}
          className="-ml-2 w-fit gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke daftar lembaga vokasi</span>
        </Button>

        <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <InstitutionSourceBadge
                  source={selectedInstitutionForStudents.registrationSource}
                  sourceId={selectedInstitutionForStudents.registrationSourceId || selectedInstitutionForStudents.id}
                  level={selectedInstitutionForStudents.inputLevel}
                  showLevel
                  showId={Boolean(selectedInstitutionForStudents.registrationSourceId)}
                />
              </div>
              <h4 className="text-sm font-bold text-foreground">
                {selectedInstitutionForStudents.name}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedInstitutionForStudents.district ? `${selectedInstitutionForStudents.district}, ` : ""}
                {selectedInstitutionForStudents.province || scopeName} • {selectedInstitutionForStudents.type}
              </p>
            </div>
            <Badge variant="outline" className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10 shrink-0">
              {students.length} Calon Peserta
            </Badge>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari nama siswa, target negara, sektor, atau jabatan..."
            value={studentSearchQuery}
            onChange={(e) => setStudentSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>

        {/* Student Cards */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground rounded-lg border border-dashed border-border">
              Tidak ada data calon peserta yang cocok dengan pencarian.
            </div>
          ) : (
            filtered.map((s, idx) => (
              <div
                key={s.id || idx}
                className="rounded-lg border border-border bg-white dark:bg-slate-900 p-3 space-y-2 hover:border-primary/40 transition-colors shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-foreground leading-tight">
                        {s.name}
                      </h5>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ID: {s.id}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5 shrink-0">
                    {s.status || "Siap Penempatan"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1.5 border-t border-border/40 text-xs">
                  <div className="bg-muted/30 rounded p-1.5">
                    <span className="text-[10px] text-muted-foreground block font-medium">Tujuan Negara Target:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                      <Globe2 className="h-3 w-3 shrink-0" />
                      <span className="truncate">{s.targetCountry}</span>
                    </span>
                  </div>
                  <div className="bg-muted/30 rounded p-1.5">
                    <span className="text-[10px] text-muted-foreground block font-medium">Sektor:</span>
                    <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                      <Briefcase className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="truncate">{s.sector}</span>
                    </span>
                  </div>
                  <div className="bg-muted/30 rounded p-1.5">
                    <span className="text-[10px] text-muted-foreground block font-medium">Jabatan:</span>
                    <span className="font-semibold text-primary flex items-center gap-1 mt-0.5">
                      <GraduationCap className="h-3 w-3 shrink-0" />
                      <span className="truncate">{s.occupation}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderInstitutionList = (items: PublicPreviewInstitution[]) => {
    const supplyOnlyItems = items.filter(
      (it) => (it.students?.length ?? it.studentCount ?? 0) > 0
    );
    const siskop2miCount = supplyOnlyItems.filter(
      (it) => resolveInstitutionSource({ registrationSource: it.registrationSource, id: it.id }) === "siskop2mi"
    ).length;
    const disnakerCount = supplyOnlyItems.filter(
      (it) => resolveInstitutionSource({ registrationSource: it.registrationSource, id: it.id }) === "disnaker"
    ).length;
    const umumCount = supplyOnlyItems.filter(
      (it) => resolveInstitutionSource({ registrationSource: it.registrationSource, id: it.id }) === "umum"
    ).length;

    const q = institutionSearchQuery.toLowerCase().trim();
    const filtered = supplyOnlyItems.filter((it) => {
      const matchSearch =
        !q ||
        it.name.toLowerCase().includes(q) ||
        (it.province && it.province.toLowerCase().includes(q)) ||
        (it.district && it.district.toLowerCase().includes(q)) ||
        (it.type && it.type.toLowerCase().includes(q));

      const matchSource =
        institutionSourceFilter === "ALL" ||
        resolveInstitutionSource({ registrationSource: it.registrationSource, id: it.id }) ===
          institutionSourceFilter;

      const matchLevel =
        institutionLevelFilter === "ALL" ||
        resolveInstitutionInputLevel({
          id: it.id,
          registrationSource: it.registrationSource,
          inputLevel: it.inputLevel,
        }) === institutionLevelFilter;

      return matchSearch && matchSource && matchLevel;
    });

    const pageSize = 15;
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safeCurrentPage = Math.min(institutionPage, totalPages);
    const paginated = filtered.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

    return (
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama lembaga vokasi, kabupaten/kota, atau kejuruan..."
            value={institutionSearchQuery}
            onChange={(e) => {
              setInstitutionSearchQuery(e.target.value);
              setInstitutionPage(1);
            }}
            className="h-8.5 pl-8 pr-8 text-xs bg-background"
          />
          {institutionSearchQuery && (
            <button
              type="button"
              onClick={() => {
                setInstitutionSearchQuery("");
                setInstitutionPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        {/* Info Jumlah Vokasi yang Ada Suplai Terdata */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
          <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Vokasi dengan Suplai Siap Latih Terdata</span>
          </span>
          <Badge className="bg-emerald-600 text-white font-bold text-xs">
            {supplyOnlyItems.length} Vokasi
          </Badge>
        </div>

        {/* Source & Level Filter Quick Bar */}
        <div className="space-y-2 p-2.5 rounded-xl bg-muted/30 border border-border/60 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground mr-1">Sumber:</span>
            <button
              type="button"
              onClick={() => {
                setInstitutionSourceFilter("ALL");
                setInstitutionLevelFilter("ALL");
                setInstitutionPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                institutionSourceFilter === "ALL"
                  ? "bg-foreground text-background shadow-xs"
                  : "bg-background border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Semua Sumber ({supplyOnlyItems.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setInstitutionSourceFilter("siskop2mi");
                setInstitutionLevelFilter("ALL");
                setInstitutionPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                institutionSourceFilter === "siskop2mi"
                  ? "bg-blue-600 text-white shadow-xs font-bold"
                  : "bg-background border border-border text-muted-foreground hover:text-blue-600"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>SISKOP2MI ({siskop2miCount})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInstitutionSourceFilter("disnaker");
                setInstitutionLevelFilter("ALL");
                setInstitutionPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                institutionSourceFilter === "disnaker"
                  ? "bg-indigo-600 text-white shadow-xs font-bold"
                  : "bg-background border border-border text-muted-foreground hover:text-indigo-600"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Disnaker ({disnakerCount})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInstitutionSourceFilter("umum");
                setInstitutionLevelFilter("ALL");
                setInstitutionPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                institutionSourceFilter === "umum"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "bg-background border border-border text-muted-foreground hover:text-emerald-600"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Umum / Lembaga ({umumCount})</span>
            </button>
          </div>

          {/* Level Filter Sub-bar */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-border/40">
            <span className="text-[10.5px] font-semibold text-muted-foreground mr-1">Level:</span>
            <button
              type="button"
              onClick={() => {
                setInstitutionLevelFilter("ALL");
                setInstitutionPage(1);
              }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer ${
                institutionLevelFilter === "ALL"
                  ? "bg-foreground text-background font-semibold"
                  : "bg-background/80 border border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              Semua Level
            </button>
            {(institutionSourceFilter === "ALL" || institutionSourceFilter === "disnaker") && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setInstitutionLevelFilter("kabupaten_kota");
                    setInstitutionPage(1);
                  }}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    institutionLevelFilter === "kabupaten_kota"
                      ? "bg-amber-600 text-white font-semibold shadow-xs"
                      : "bg-background/80 border border-border/60 text-muted-foreground hover:text-amber-600"
                  }`}
                >
                  Disnaker Kab/Kota
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInstitutionLevelFilter("provinsi");
                    setInstitutionPage(1);
                  }}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    institutionLevelFilter === "provinsi"
                      ? "bg-indigo-600 text-white font-semibold shadow-xs"
                      : "bg-background/80 border border-border/60 text-muted-foreground hover:text-indigo-600"
                  }`}
                >
                  Disnaker Provinsi
                </button>
              </>
            )}
            {(institutionSourceFilter === "ALL" || institutionSourceFilter === "umum") && (
              <button
                type="button"
                onClick={() => {
                  setInstitutionLevelFilter("lembaga_vokasi");
                  setInstitutionPage(1);
                }}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer ${
                  institutionLevelFilter === "lembaga_vokasi"
                    ? "bg-emerald-600 text-white font-semibold shadow-xs"
                    : "bg-background/80 border border-border/60 text-muted-foreground hover:text-emerald-600"
                }`}
              >
                Lembaga Vokasi (Mandiri)
              </button>
            )}
            {(institutionSourceFilter === "ALL" || institutionSourceFilter === "siskop2mi") && (
              <button
                type="button"
                onClick={() => {
                  setInstitutionLevelFilter("nasional");
                  setInstitutionPage(1);
                }}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer ${
                  institutionLevelFilter === "nasional"
                    ? "bg-blue-600 text-white font-semibold shadow-xs"
                    : "bg-background/80 border border-border/60 text-muted-foreground hover:text-blue-600"
                }`}
              >
                Nasional (SISKOP2MI)
              </button>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border p-2">
          {filtered.length === 0 ? (
            <p className="p-5 text-center text-sm text-muted-foreground">
              Belum ada lembaga vokasi yang sesuai dengan pilihan pencarian atau filter ini.
            </p>
          ) : (
            <div className="space-y-2.5">
              {paginated.map((institution) => {
                const isVerified =
                  institution.evokasiStatus === "Terverifikasi e-Vokasi";
                const studentCount = institution.students?.length ?? institution.studentCount ?? 0;
                const hasStudents = studentCount > 0;
                return (
                  <div
                    key={institution.id}
                    onClick={() => {
                      if (hasStudents) {
                        setSelectedInstitutionForStudents(institution);
                        setStudentSearchQuery("");
                      }
                    }}
                    className={cn(
                      "rounded-lg border border-border bg-white dark:bg-slate-900 p-3 space-y-2 transition-all",
                      hasStudents
                        ? "hover:border-primary/60 hover:shadow-md cursor-pointer group"
                        : "border-border/70"
                    )}
                  >
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <InstitutionSourceBadge
                            source={institution.registrationSource}
                            sourceId={institution.registrationSourceId || institution.id}
                            level={institution.inputLevel}
                            showLevel
                            showId={Boolean(institution.registrationSourceId)}
                          />
                        </div>
                        <h6 className="break-words text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                          <span>{institution.name}</span>
                          {hasStudents && (
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                          )}
                        </h6>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {institution.district ? `${institution.district}, ` : ""}
                          {institution.province || scopeName}
                        </p>
                      </div>
                      <Badge
                        variant={isVerified ? "default" : "outline"}
                        className={
                          isVerified
                            ? "max-w-[45%] shrink-0 whitespace-normal break-words bg-emerald-600/10 text-right text-xs text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                            : "max-w-[45%] shrink-0 whitespace-normal break-words text-right text-xs"
                        }
                      >
                        {institution.evokasiStatus || "Terdaftar"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border/40 pt-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span>
                          Jenis: <strong>{institution.type}</strong>
                        </span>
                        {institution.accreditation && (
                          <span>
                            Akreditasi: <strong>{institution.accreditation}</strong>
                          </span>
                        )}
                      </div>
                      {hasStudents ? (
                        <span className="text-primary font-semibold text-xs flex items-center gap-1 group-hover:underline cursor-pointer">
                          <Users className="h-3.5 w-3.5" />
                          {studentCount} Calon Peserta &rarr;
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 opacity-60" />
                          {institution.workshopCapacity
                            ? `Kapasitas: ${institution.workshopCapacity} / Batch`
                            : "Terdaftar Siap Diklat"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Bar */}
        {filtered.length > pageSize && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground px-1 pt-1 border-t border-border/40">
            <span>
              Menampilkan {((safeCurrentPage - 1) * pageSize) + 1} -{" "}
              {Math.min(filtered.length, safeCurrentPage * pageSize)} dari {filtered.length} lembaga
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInstitutionPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
                className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Sebelumnya
              </Button>
              <span className="px-2 font-medium text-foreground">
                Halaman {safeCurrentPage} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInstitutionPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
              >
                Selanjutnya
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (type) {
      case "peserta":
      case "lembaga":
      case "sebaran_lembaga":
        if (selectedInstitutionForStudents) {
          return renderStudentList();
        }
        return (
          <div className="space-y-4">
            {renderInstitutionList(institutions)}
          </div>
        );

      case "program": {
        const COUNTRY_PROGRAM_CATALOG: {
          country: string;
          sectors: {
            sectorName: string;
            programTypes: string[];
          }[];
        }[] = [
          {
            country: "Jepang",
            sectors: [
              {
                sectorName: "Kesehatan",
                programTypes: [
                  "Pelatihan Teknis — Caregiver (Lvl Pelaksana)",
                  "Pelatihan Bahasa — Bahasa Jepang (JLPT N4 / JFT-Basic)",
                  "Sertifikasi Teknis — Uji Kompetensi SSW Kaigo & BNSP",
                ],
              },
              {
                sectorName: "Manufaktur",
                programTypes: [
                  "Pelatihan Teknis — Operator Produksi & Mesin Presisi",
                  "Pelatihan Bahasa — Bahasa Jepang Industri",
                  "Sertifikasi Teknis — SSW Manufaktur & BNSP",
                ],
              },
              {
                sectorName: "Transportasi",
                programTypes: [
                  "Pelatihan Teknis — Driver & Pengemudi Angkutan (Truck Driver)",
                  "Pelatihan Bahasa — Bahasa Jepang Layanan Transportasi",
                ],
              },
              {
                sectorName: "Agriculture (Pertanian)",
                programTypes: [
                  "Pelatihan Teknis — Farmer / Farming (Pertanian Modern)",
                  "Pelatihan Bahasa — Bahasa Jepang Pertanian (ASAT)",
                ],
              },
            ],
          },
          {
            country: "Korea Selatan",
            sectors: [
              {
                sectorName: "Manufaktur",
                programTypes: [
                  "Pelatihan Teknis — Welder (SMAW/FCAW) & Molding Presisi",
                  "Pelatihan Bahasa — Bahasa Korea (EPS-TOPIK Manufaktur)",
                  "Sertifikasi Teknis — Sertifikasi Pengelasan AWS / BNSP",
                ],
              },
              {
                sectorName: "Fisherman (Perikanan)",
                programTypes: [
                  "Pelatihan & Sertifikasi Teknis — ABK Perikanan Tangkap",
                  "Pelatihan Bahasa — Bahasa Korea (EPS-TOPIK Perikanan)",
                ],
              },
            ],
          },
          {
            country: "Malaysia",
            sectors: [
              {
                sectorName: "Kesehatan",
                programTypes: [
                  "Pelatihan Teknis — Elderly Caretaker (Perawat Lansia)",
                  "Pelatihan Bahasa — Komunikasi Bahasa Inggris & Melayu Medis",
                ],
              },
              {
                sectorName: "Manufaktur",
                programTypes: [
                  "Pelatihan Teknis — Operation Production (Operator Produksi)",
                  "Sertifikasi Teknis — Sertifikasi Kompetensi Industri BNSP",
                ],
              },
              {
                sectorName: "Hospitality",
                programTypes: [
                  "Pelatihan Teknis — Cleaner & Layanan Perhotelan",
                  "Pelatihan Bahasa — Bahasa Inggris Perhotelan",
                ],
              },
              {
                sectorName: "Agriculture (Perkebunan)",
                programTypes: [
                  "Pelatihan Teknis — Plantation Worker Kelapa Sawit",
                  "Sertifikasi Teknis — K3 & Kompetensi Perkebunan",
                ],
              },
            ],
          },
          {
            country: "Turki",
            sectors: [
              {
                sectorName: "Hospitality",
                programTypes: [
                  "Pelatihan Teknis — Housekeeping & Tata Graha",
                  "Pelatihan Teknis — Waiter / Food & Beverage Service",
                  "Pelatihan Teknis — Spa Therapist Internasional",
                  "Pelatihan Teknis — Culinary Cook & Public Area Cleaner",
                  "Pelatihan Bahasa — Bahasa Inggris Perhotelan & Bahasa Turki Dasar",
                  "Sertifikasi Teknis — Uji Kompetensi Perhotelan BNSP & CIBTAC",
                ],
              },
            ],
          },
        ];

        const activeCountryItem = COUNTRY_PROGRAM_CATALOG.find(
          (item) => item.country === selectedCountry
        );

        return (
          <div className="space-y-4">
            {activeCountryItem ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCountry(null)}
                  className="-ml-2 w-fit gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Kembali ke 4 Negara</span>
                </Button>

                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      <Globe2 className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        Negara Tujuan: {activeCountryItem.country}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Daftar Sektor & Jenis Program Pelatihan
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold">
                    {activeCountryItem.sectors.length} Sektor
                  </Badge>
                </div>

                <div className="space-y-3">
                  {activeCountryItem.sectors.map((sec) => (
                    <div
                      key={sec.sectorName}
                      className="rounded-xl border border-border bg-white dark:bg-slate-900 p-3.5 space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <BriefcaseBusiness className="h-3.5 w-3.5" />
                        </span>
                        <h5 className="text-sm font-bold text-foreground">
                          Sektor {sec.sectorName}
                        </h5>
                      </div>
                      <ul className="space-y-1.5 pl-9">
                        {sec.programTypes.map((prog) => (
                          <li
                            key={prog}
                            className="text-xs text-foreground flex items-center gap-2 py-1 px-2.5 rounded-lg bg-muted/40 border border-border/50"
                          >
                            <GraduationCap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="font-medium">{prog}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs text-muted-foreground">
                  Pilih salah satu dari 4 negara tujuan untuk melihat keterangan sektor dan jenis program pelatihannya:
                </p>
                {COUNTRY_PROGRAM_CATALOG.map((item) => (
                  <button
                    key={item.country}
                    type="button"
                    onClick={() => setSelectedCountry(item.country)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-white dark:bg-slate-900 p-3.5 text-left hover:border-primary/60 hover:bg-muted/40 transition cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <Globe2 className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {item.country}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Sektor: {item.sectors.map((s) => s.sectorName).join(" · ")}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }

      case "national_lpk":
        if (selectedInstitutionForStudents) {
          return renderStudentList();
        }
        if (selectedProvinceForLpk) {
          return (
            <div className="space-y-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedProvinceForLpk(null);
                  setSelectedInstitutionForStudents(null);
                }}
                className="-ml-2 w-fit gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Kembali ke sebaran provinsi</span>
              </Button>

              {renderInstitutionList(provinceInstitutions)}
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-border">
              <div className="p-2 divide-y divide-border/60">
                {(nationalLpkList.length > 0
                  ? nationalLpkList
                  : institutionsList.length > 0
                  ? institutionsList
                  : [
                      { province: "Jawa Tengah", totalCount: 965, registeredCount: 8 },
                      { province: "Jawa Barat", totalCount: 620, registeredCount: 6 },
                      { province: "Jawa Timur", totalCount: 410, registeredCount: 4 },
                      { province: "DKI Jakarta", totalCount: 180, registeredCount: 3 },
                      { province: "Bali", totalCount: 95, registeredCount: 2 },
                      { province: "Sumatera Utara", totalCount: 88, registeredCount: 1 },
                    ]
                ).map((row, idx) => {
                  const pct = Math.round((row.registeredCount / (row.totalCount || 1)) * 100);
                  return (
                    <div
                      key={row.province}
                      onClick={() => setSelectedProvinceForLpk(row.province)}
                      className="p-2.5 rounded-lg hover:bg-muted/70 transition-all cursor-pointer group space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-muted-foreground w-5 tabular-nums">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                            <span>{row.province}</span>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                        <div className="flex items-center gap-2 tabular-nums">
                          <span className="text-muted-foreground text-[11px]">
                            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{row.registeredCount}</strong> / {row.totalCount}
                          </span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted">
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted ml-7">
                        <div
                          className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all"
                          style={{ width: `${Math.max(pct, 3)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case "demand": {
        const DEMAND_COUNTRY_SUMMARY = [
          {
            country: "Jepang",
            sectors: ["Kesehatan (Caregiver Kaigo)", "Manufaktur (Operator CNC & Welder)", "Transportasi", "Agriculture (Pertanian)"],
          },
          {
            country: "Korea Selatan",
            sectors: ["Manufaktur (Welder & Molding)", "Fisherman / Perikanan (ABK Kapal)"],
          },
          {
            country: "Malaysia",
            sectors: ["Kesehatan (Elderly Caretaker)", "Hospitality", "Manufaktur (Operator Produksi)", "Agriculture (Plantation Sawit)"],
          },
          {
            country: "Turki",
            sectors: ["Hospitality (Housekeeping, Waiter, Spa Therapist, Cook, Cleaner)"],
          },
        ];

        return (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Permintaan pekerja luar negeri berasal dari 4 negara tujuan berikut:
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              {DEMAND_COUNTRY_SUMMARY.map((item) => (
                <div
                  key={item.country}
                  className="rounded-xl border border-border bg-white dark:bg-slate-900 p-3.5 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                      <Globe2 className="h-4 w-4" />
                    </span>
                    <h4 className="text-sm font-bold text-foreground">
                      {item.country}
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pl-10">
                    {item.sectors.map((sec) => (
                      <Badge key={sec} variant="secondary" className="text-[11px] font-medium">
                        {sec}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "alokasi":
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-4 bg-card space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-border">
                <span className="font-semibold text-foreground">Tahapan Alokasi Aktif</span>
                <Badge variant="secondary" className="text-[10px]">
                  Batch I & II 2027
                </Badge>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Tahap 1 & 2: Agregasi data calon peserta & verifikasi Dukcapil tuntas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Tahap 3: Analisis kesenjangan dan pencocokan kuota lembaga dengan permintaan.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Tahap 4 & 5: Pelaksanaan kelas bahasa intensif dan sertifikasi kompetensi.</span>
                </li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    if (selectedInstitutionForStudents) {
      return `Rincian Calon Peserta — ${selectedInstitutionForStudents.name}`;
    }
    if (selectedProvinceForLpk) {
      return `Lembaga Vokasi — ${selectedProvinceForLpk}`;
    }
    switch (type) {
      case "peserta":
        return "Siap Latih — Vokasi Suplai Peserta";
      case "program":
        return selectedCountry
          ? `Siap Program — Negara ${selectedCountry}`
          : "Siap Program — 4 Negara Tujuan";
      case "lembaga":
      case "sebaran_lembaga":
        return "Siap Vokasi — Daftar Lembaga Vokasi Suplai";
      case "national_lpk":
        return "Sebaran Lembaga Terdaftar Nasional";
      case "demand":
        return "Siap Permintaan — 4 Negara Tujuan";
      case "alokasi":
        return "Status Alokasi Penempatan";
      default:
        return "Detail Informasi";
    }
  };

  return (
    <>
      <Dialog open={Boolean(type)} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="flex w-[calc(100%-2rem)] max-w-2xl max-h-[calc(100dvh-2rem)] flex-col gap-4 overflow-hidden p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-foreground">
              {getTitle()}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {type === "lembaga" || type === "sebaran_lembaga"
                ? "Daftar 30 lembaga vokasi penyuplai peserta siap latih terdata dari database (total 4.315 calon peserta)."
                : type === "peserta"
                ? "Daftar lembaga vokasi dan rincian calon peserta siap latih (total 4.315 peserta dari 30 lembaga)."
                : "Data statistik Command Center Task Force SMK Go Global"}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain pr-1">
            {renderContent()}
          </div>

          <div className="flex shrink-0 justify-end border-t border-border pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Candidate Profile Detail Modal di luar Dialog utama agar selalu berada di layer terdepan */}
      {selectedCandidateForDetail && (
        <CandidateDetailModal
          candidate={selectedCandidateForDetail}
          isOpen={Boolean(selectedCandidateForDetail)}
          onClose={() => setSelectedCandidateForDetail(null)}
        />
      )}
    </>
  );
};
