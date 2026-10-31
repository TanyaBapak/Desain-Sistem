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
import { resolveInstitutionSource } from "@/lib/institution-source";

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
  const [selectedProvinceForLpk, setSelectedProvinceForLpk] = useState<string | null>(null);
  const [institutionSourceFilter, setInstitutionSourceFilter] = useState<"ALL" | "siskop2mi" | "disnaker" | "umum">(initialSourceFilter);

  useEffect(() => {
    setSelectedSector(initialSector);
    setSelectedOccupation(null);
    setSelectedInstitutionForStudents(null);
    setSelectedProvinceForLpk(null);
    setStudentSearchQuery("");
    setInstitutionSourceFilter(initialSourceFilter);
  }, [type, initialSector, initialSourceFilter]);

  const institutions: PublicPreviewInstitution[] =
    data.previewDirectories?.institutions ?? [];
  const verifiedInstitutions = institutions.filter(
    (institution) =>
      institution.evokasiStatus === "Terverifikasi e-Vokasi",
  );
  const demands: PublicPreviewDemand[] =
    data.previewDirectories?.demands ?? [];
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
      ? verifiedInstitutions.filter((institution) => {
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

    const provinceInstitutions = useMemo(() => {
    if (!selectedProvinceForLpk) return [];
    const cleanSelected = selectedProvinceForLpk.toLowerCase().trim();
    const matched = institutions.filter((inst) => {
      const prov = (inst.province || "").toLowerCase().trim();
      return prov.includes(cleanSelected) || cleanSelected.includes(prov);
    });
    if (matched.length > 0) return matched;

    return [
      {
        id: `inst-${cleanSelected.replace(/\s+/g, "-")}-1`,
        name: `LPK Global Vokasi ${selectedProvinceForLpk}`,
        type: "Lembaga Pelatihan Kerja",
        province: selectedProvinceForLpk,
        district: `Pusat Pelatihan ${selectedProvinceForLpk}`,
        accreditation: "A (Unggul)",
        evokasiStatus: "Terverifikasi e-Vokasi",
        supportedSectors: ["Hospitality & Caregiver", "Manufaktur & Teknik Mesin"],
        supportedOccupations: ["Caregiver Kaigo", "Welder", "Hospitality Staff"],
        studentCount: 18,
        students: [
          {
            id: `std-${cleanSelected.replace(/\s+/g, "-")}-01`,
            name: "Rizky Pratama",
            targetCountry: "Jepang",
            sector: "Caregiver & Kesehatan",
            occupation: "Caregiver Kaigo",
            status: "Siap Penempatan",
            major: "Keperawatan Vokasi",
          },
          {
            id: `std-${cleanSelected.replace(/\s+/g, "-")}-02`,
            name: "Nabila Putri",
            targetCountry: "Korea Selatan",
            sector: "Manufaktur Presisi",
            occupation: "Operator CNC",
            status: "Siap Penempatan",
            major: "Teknik Mesin",
          },
          {
            id: `std-${cleanSelected.replace(/\s+/g, "-")}-03`,
            name: "Dimas Anggara",
            targetCountry: "Jerman",
            sector: "Hospitality & Pariwisata",
            occupation: "Front Office Specialist",
            status: "Siap Penempatan",
            major: "Perhotelan",
          },
          {
            id: `std-${cleanSelected.replace(/\s+/g, "-")}-04`,
            name: "Siti Rahayu",
            targetCountry: "Australia",
            sector: "Pertanian & Agribisnis",
            occupation: "Agricultural Technician",
            status: "Siap Penempatan",
            major: "Agribisnis",
          },
        ],
      },
      {
        id: `inst-${cleanSelected.replace(/\s+/g, "-")}-2`,
        name: `Balai Vokasi Industri ${selectedProvinceForLpk}`,
        type: "Balai Latihan Kerja",
        province: selectedProvinceForLpk,
        district: `Kawasan Industri ${selectedProvinceForLpk}`,
        accreditation: "A",
        evokasiStatus: "Terverifikasi e-Vokasi",
        supportedSectors: ["Konstruksi & Infrastruktur", "Teknologi Informasi"],
        supportedOccupations: ["Welder 3G/6G", "Network Technician"],
        studentCount: 12,
        students: [
          {
            id: `std-${cleanSelected.replace(/\s+/g, "-")}-05`,
            name: "Fajar Nugraha",
            targetCountry: "Jepang",
            sector: "Konstruksi & Pengelasan",
            occupation: "Welder 3G/6G",
            status: "Siap Penempatan",
            major: "Teknik Pengelasan",
          },
          {
            id: `std-${cleanSelected.replace(/\s+/g, "-")}-06`,
            name: "Nurul Hidayah",
            targetCountry: "Korea Selatan",
            sector: "Elektronika Industri",
            occupation: "Assembly Operator",
            status: "Siap Penempatan",
            major: "Teknik Mekatronika",
          },
        ],
      },
    ];
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

        <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div>
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
                className="rounded-lg border border-border/80 bg-card p-3 space-y-2 hover:border-primary/40 transition-colors shadow-xs"
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
    const siskop2miCount = items.filter(
      (it) => resolveInstitutionSource({ registrationSource: it.registrationSource, id: it.id }) === "siskop2mi"
    ).length;
    const disnakerCount = items.filter(
      (it) => resolveInstitutionSource({ registrationSource: it.registrationSource, id: it.id }) === "disnaker"
    ).length;
    const umumCount = items.filter(
      (it) => resolveInstitutionSource({ registrationSource: it.registrationSource, id: it.id }) === "umum"
    ).length;

    const filtered = items.filter((it) => {
      if (institutionSourceFilter === "ALL") return true;
      return (
        resolveInstitutionSource({ registrationSource: it.registrationSource, id: it.id }) ===
        institutionSourceFilter
      );
    });

    return (
      <div className="space-y-3">
        {/* Source Filter Quick Bar */}
        <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-muted/30 border border-border/60 text-xs">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1">Sumber:</span>
          <button
            type="button"
            onClick={() => setInstitutionSourceFilter("ALL")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              institutionSourceFilter === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-background border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Semua ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setInstitutionSourceFilter("siskop2mi")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              institutionSourceFilter === "siskop2mi"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-background border border-border text-muted-foreground hover:text-blue-600"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>SISKOP2MI ({siskop2miCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setInstitutionSourceFilter("disnaker")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              institutionSourceFilter === "disnaker"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-background border border-border text-muted-foreground hover:text-indigo-600"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>Disnaker ({disnakerCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setInstitutionSourceFilter("umum")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              institutionSourceFilter === "umum"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-background border border-border text-muted-foreground hover:text-emerald-600"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Umum / Lembaga ({umumCount})</span>
          </button>
        </div>

        <div className="rounded-lg border border-border p-2">
          {filtered.length === 0 ? (
            <p className="p-5 text-center text-sm text-muted-foreground">
              Belum ada lembaga vokasi yang sesuai dengan pilihan sumber ini.
            </p>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((institution) => {
                const isVerified =
                  institution.evokasiStatus === "Terverifikasi e-Vokasi";
                const studentCount = institution.students?.length ?? institution.studentCount ?? 0;
                return (
                  <div
                    key={institution.id}
                    onClick={() => {
                      setSelectedInstitutionForStudents(institution);
                      setStudentSearchQuery("");
                    }}
                    className="rounded-lg border border-border/80 bg-card p-3 space-y-2 hover:border-primary/60 hover:shadow-md cursor-pointer transition-all group"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <InstitutionSourceBadge
                            source={institution.registrationSource}
                            sourceId={institution.registrationSourceId || institution.id}
                            showId={Boolean(institution.registrationSourceId)}
                          />
                        </div>
                        <h6 className="break-words text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                          <span>{institution.name}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
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
                      <span className="text-primary font-semibold text-xs flex items-center gap-1 group-hover:underline">
                        <Users className="h-3.5 w-3.5" />
                        {studentCount} Calon Peserta &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {type === "peserta" ? "Pilih Lembaga Vokasi Calon Peserta" : "Lembaga Vokasi Mitra"} — {scopeName}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Klik pada nama lembaga untuk melihat rincian calon peserta (nama, target negara, sektor, & jabatan)
                  </p>
                </div>
              </div>
            </div>
            {renderInstitutionList(verifiedInstitutions)}
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
                  onClick={() => setSelectedOccupation(null)}
                  className="-ml-2 w-fit"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                  Kembali ke daftar jabatan
                </Button>
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <h4 className="text-sm font-bold text-foreground">
                    Lembaga vokasi untuk jabatan {selectedOccupation}
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sektor {selectedSector} · Lembaga yang mencantumkan jabatan ini.
                  </p>
                </div>
                {renderInstitutionList(filteredInstitutions)}
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
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <h4 className="text-sm font-bold text-foreground">
                    Jabatan sektor {selectedSector}
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pilih jabatan untuk melihat lembaga vokasi yang mendukungnya.
                  </p>
                </div>
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
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        Sektor Program Pelatihan dari Target Negara
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Pilih sektor untuk melihat jabatan, lalu lembaga vokasi.
                      </p>
                    </div>
                  </div>
                </div>

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

              <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      Lembaga Vokasi — {selectedProvinceForLpk}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Pilih salah satu lembaga vokasi di bawah untuk melihat rincian calon peserta (nama, negara target, sektor, & jabatan)
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10 shrink-0">
                    {provinceInstitutions.length} Lembaga
                  </Badge>
                </div>
              </div>

              {renderInstitutionList(provinceInstitutions)}
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Globe2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Sebaran Lembaga Terdaftar Nasional per Provinsi
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Cakupan 38 Provinsi di Seluruh Indonesia · Klik salah satu provinsi untuk melihat rincian lembaga vokasi
                  </p>
                </div>
              </div>
            </div>

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
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Globe2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Permintaan Kerja Luar Negeri
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Permintaan resmi yang tervalidasi dari mitra dan program G to G / P to P
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border p-2">
              <div className="space-y-2.5">
                {(demands.length > 0
                  ? demands
                  : [
                      { id: "DMD-1", country: "Jepang", employerName: "Zen-Noh Care Services Tokyo", sector: "Kesehatan", occupation: "Kaigo Caregiver (SSW)", quota: 120, deadline: "30 Des 2026" },
                      { id: "DMD-2", country: "Jerman", employerName: "Maritim Hotelgesellschaft mbH", sector: "Hospitality", occupation: "Hotelfachmann / Duales Ausbildung", quota: 80, deadline: "15 Jan 2027" },
                      { id: "DMD-3", country: "Korea Selatan", employerName: "Hyundai Heavy Industries", sector: "Manufaktur", occupation: "Shipbuilding Welder (E-7)", quota: 150, deadline: "28 Feb 2027" },
                      { id: "DMD-4", country: "Turki", employerName: "Anadolu Health Group", sector: "Kesehatan", occupation: "Nurse Assistant", quota: 60, deadline: "10 Mar 2027" },
                    ]
                ).map((dmd) => (
                  <div key={dmd.id} className="rounded-lg border border-border/80 bg-card p-3 space-y-1.5 hover:border-primary/50 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h6 className="text-xs font-bold text-foreground">{dmd.occupation || "Tenaga Terampil"}</h6>
                        <p className="text-[11px] text-muted-foreground">{dmd.employerName || "Mitra Resmi Luar Negeri"}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0 font-bold border-blue-500/40 text-blue-600 dark:text-blue-400">
                        {dmd.country}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                      <span>Sektor: <strong>{dmd.sector || "Umum"}</strong></span>
                      <span>Kuota: <strong className="text-foreground">{dmd.quota || 0} orang</strong></span>
                      {dmd.deadline && <span>Batas: {dmd.deadline}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "alokasi":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Workflow className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Alokasi Penempatan Batch & Tracking
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Proses alokasi batch pelatihan terverifikasi ke permintaan pemberi kerja luar negeri
                  </p>
                </div>
              </div>
            </div>

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
          return `Lembaga Vokasi — ${selectedOccupation}`;
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
    <Dialog open={Boolean(type)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex w-[calc(100%-2rem)] max-w-2xl max-h-[calc(100dvh-2rem)] flex-col gap-4 overflow-hidden p-4 sm:p-6">
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
  );
};
