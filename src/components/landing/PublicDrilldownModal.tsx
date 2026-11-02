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
  const [institutionStatusFilter, setInstitutionStatusFilter] = useState<"ALL" | "supply" | "verified">("ALL");
  const [institutionSearchQuery, setInstitutionSearchQuery] = useState<string>("");
  const [institutionPage, setInstitutionPage] = useState<number>(1);

  useEffect(() => {
    setSelectedSector(initialSector);
    setSelectedOccupation(null);
    setSelectedInstitutionForStudents(null);
    setSelectedProvinceForLpk(null);
    setStudentSearchQuery("");
    setCandidateSearchQuery("");
    setSelectedCandidateForDetail(null);
    setInstitutionSourceFilter(initialSourceFilter);
    setInstitutionLevelFilter("ALL");
    setInstitutionStatusFilter(type === "peserta" ? "supply" : "ALL");
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
    const supplyCount = items.filter(
      (it) => (it.students?.length ?? it.studentCount ?? 0) > 0
    ).length;
    const verifiedCount = items.filter(
      (it) => it.evokasiStatus === "Terverifikasi e-Vokasi"
    ).length;
    const siskop2miCount = items.filter(
      (it) => resolveInstitutionSource({ registrationSource: it.registrationSource, id: it.id }) === "siskop2mi"
    ).length;
    const disnakerCount = items.filter(
      (it) => resolveInstitutionSource({ registrationSource: it.registrationSource, id: it.id }) === "disnaker"
    ).length;
    const umumCount = items.filter(
      (it) => resolveInstitutionSource({ registrationSource: it.registrationSource, id: it.id }) === "umum"
    ).length;

    const q = institutionSearchQuery.toLowerCase().trim();
    const filtered = items.filter((it) => {
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

      const matchStatus =
        institutionStatusFilter === "ALL" ||
        (institutionStatusFilter === "supply" && (it.students?.length ?? it.studentCount ?? 0) > 0) ||
        (institutionStatusFilter === "verified" && it.evokasiStatus === "Terverifikasi e-Vokasi");

      return matchSearch && matchSource && matchLevel && matchStatus;
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

        {/* Status Kesiapan Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60 text-xs">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1">Status Kesiapan:</span>
          <button
            type="button"
            onClick={() => {
              setInstitutionStatusFilter("ALL");
              setInstitutionPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              institutionStatusFilter === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-background border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Semua Direktori ({items.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setInstitutionStatusFilter("supply");
              setInstitutionPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              institutionStatusFilter === "supply"
                ? "bg-emerald-600 text-white shadow-xs font-bold"
                : "bg-background border border-border text-muted-foreground hover:text-emerald-600"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Ber-Suplai Peserta ({supplyCount})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setInstitutionStatusFilter("verified");
              setInstitutionPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              institutionStatusFilter === "verified"
                ? "bg-blue-600 text-white shadow-xs font-bold"
                : "bg-background border border-border text-muted-foreground hover:text-blue-600"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Terverifikasi e-Vokasi ({verifiedCount})</span>
          </button>
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
              Semua Sumber ({items.length})
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

      case "program":
        return (
          <div className="space-y-4">
            {selectedSector && selectedOccupation ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedOccupation(null);
                    setCandidateSearchQuery("");
                  }}
                  className="-ml-2 w-fit gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Kembali ke daftar jabatan ({selectedSector})
                </Button>

                {/* Search Box */}
                {matchingCandidates.length > 2 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      value={candidateSearchQuery}
                      onChange={(e) => setCandidateSearchQuery(e.target.value)}
                      placeholder="Cari nama peserta, NIK, atau lembaga vokasi..."
                      className="pl-8 text-xs h-9 bg-background"
                    />
                  </div>
                )}

                {/* Candidate Cards List */}
                {filteredCandidates.length > 0 ? (
                  <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                    {filteredCandidates.map((c) => (
                      <div
                        key={c.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedCandidateForDetail(c)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedCandidateForDetail(c);
                          }
                        }}
                        className="p-3 rounded-xl border border-border bg-white dark:bg-slate-900/90 hover:border-primary/50 hover:bg-primary/5 transition cursor-pointer flex flex-col gap-2 shadow-2xs group"
                      >
                        {/* Header: Name, NIK, Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs shrink-0">
                              {c.fullName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                {c.fullName}
                              </div>
                              <div className="text-[10.5px] font-mono text-muted-foreground tabular-nums">
                                NIK: {c.nik}
                              </div>
                            </div>
                          </div>

                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0 font-semibold shrink-0",
                              c.readinessStatus === "Ready for Placement"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
                            )}
                          >
                            {c.readinessStatus === "Ready for Placement" ? "Siap Kerja" : "Pelatihan"}
                          </Badge>
                        </div>

                        {/* Lembaga Vokasi Asal - Mencolok */}
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/80 dark:bg-slate-800/80 border border-blue-200/60 dark:border-blue-900/40 text-xs">
                          <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-foreground">
                              {c.institutionName || c.sourceType || "Lembaga Vokasi Terdaftar"}
                            </span>
                            <span className="text-muted-foreground ml-1.5 text-[11px]">
                              ({c.kabupatenKota}, {c.provinsi})
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-900 shrink-0 font-medium">
                            {c.educationLevel}
                          </Badge>
                        </div>

                        {/* Major, Target Country, Link */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40 text-[11.5px]">
                          <span className="text-muted-foreground truncate max-w-[280px]">
                            {c.major}
                          </span>
                          <div className="flex items-center gap-2.5">
                            <span className="text-muted-foreground">
                              Tujuan: <b className="text-foreground">{c.preferredCountry.join(", ")}</b>
                            </span>
                            <span className="text-[11px] font-bold text-primary group-hover:underline flex items-center">
                              Lihat Profil ›
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                    Tidak ditemukan data peserta untuk jabatan {selectedOccupation}.
                  </div>
                )}
              </>
            ) : selectedSector ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSector(null)}
                  className="-ml-2 w-fit"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                  Kembali ke daftar sektor
                </Button>
                {(sectorOccupations[selectedSector] ?? []).length > 0 ? (
                  <div className="space-y-2">
                    {(sectorOccupations[selectedSector] ?? []).map((occupation) => (
                      <button
                        key={occupation}
                        type="button"
                        onClick={() => setSelectedOccupation(occupation)}
                        className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Briefcase className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1 break-words text-sm font-semibold">
                          {occupation}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                    Belum ada jabatan yang terdaftar pada sektor ini.
                  </p>
                )}
              </>
            ) : (
              <>
                {sectors.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                    Belum ada sektor yang terdaftar pada target negara.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sectors.map((sector) => (
                      <button
                        key={sector}
                        type="button"
                        onClick={() => setSelectedSector(sector)}
                        className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1 break-words text-sm font-semibold">
                          {sector}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        );

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

      case "demand":
        // Konten popup demand disembunyikan sesuai permintaan
        return null;

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
        return "Direktori Lembaga Vokasi Mitra";
      case "program":
        if (selectedSector && selectedOccupation) {
          return `Peserta Siap Latih — ${selectedOccupation}`;
        }
        return selectedSector
          ? `Jabatan — ${selectedSector}`
          : "Sektor Pelatihan Target Negara";
      case "lembaga":
      case "sebaran_lembaga":
        return "Direktori Lembaga Vokasi Mitra";
      case "national_lpk":
        return "Sebaran Lembaga Terdaftar Nasional";
      case "demand":
        return "Permintaan Kerja Luar Negeri";
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
              Data statistik Command Center Task Force SMK Go Global
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
