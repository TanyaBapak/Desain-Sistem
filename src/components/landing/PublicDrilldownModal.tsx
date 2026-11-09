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
  ChevronsLeft,
  ChevronsRight,
  LayoutList,
  TableProperties,
  FileSpreadsheet,
  Download,
  Loader2,
  BookOpen,
  Award,
  ExternalLink,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import type {
  PublicCommandCenterData,
  PublicPreviewInstitution,
  PublicPreviewStudent,
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
import { cn, parseCatalogUrls } from "@/lib/utils";

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

export function normalizeStudentCountry(raw?: string): string {
  if (!raw) return "Lainnya";
  const l = raw.toLowerCase();
  if (l.includes("jepang") || l.includes("japan")) return "Jepang";
  if (l.includes("turki") || l.includes("turkey") || l.includes("turky") || l.includes("turkiye")) return "Turki";
  if (l.includes("korea") || l.includes("korsel")) return "Korea";
  if (l.includes("malaysia")) return "Malaysia";
  return "Lainnya";
}

export function normalizeStudentSector(sec?: string, maj?: string): string {
  const str = `${sec || ""} ${maj || ""}`.toLowerCase();
  if (/(hospit|hotel|pariwisata|waiter|cook|boga|fnb|housekeep|barista|spa|cruise|culinary|kuliner)/.test(str)) {
    return "Hospitality & Pariwisata";
  }
  if (/(kesehatan|caregiver|cargiver|perawat|keperawatan|medis|kaigo|farmasi|kebidanan|rekam medis|hospital administration|administrasi rumah sakit)/.test(str)) {
    return "Kesehatan & Caregiver";
  }
  if (/(bahasa|sastra|inggris|jepang|korea|komunikasi)/.test(str)) {
    return "Bahasa & Komunikasi";
  }
  if (/(manufaktur|mesin|pemesinan|weld|las|cnc|bubut|pabrik|operator produksi|elektronika|listrik|industri)/.test(str)) {
    return "Manufaktur & Pengelasan";
  }
  if (/(otomotif|tkr|tsm|motor|kendaraan|mekanik|alat berat|driver|pengemudi|transport)/.test(str)) {
    return "Otomotif & Transportasi";
  }
  if (/(kebun|perkebunan|tani|pertanian|agri|sawit|fisherman|ikan|perikanan|abk)/.test(str)) {
    return "Pertanian & Perikanan";
  }
  return "Administrasi, IT & Lainnya";
}

export function isLembagaInstitution(inst: PublicPreviewInstitution): boolean {
  const t = (inst.type || "").toUpperCase();
  const n = (inst.name || "").toUpperCase();
  if (t.includes("LPK") || t.includes("LKP") || t.includes("LEMBAGA PELATIHAN") || t.includes("LEMBAGA KURSUS")) {
    return true;
  }
  if (
    n.startsWith("LPK") ||
    n.startsWith("LKP") ||
    n.includes("LEMBAGA") ||
    n.includes("HOTEL SCHOOL") ||
    n.includes("GENESIS TALENT") ||
    n.includes("GRAHA WISATA") ||
    n.includes("DUTA INTERNASIONAL") ||
    n.includes("LPIA")
  ) {
    return true;
  }
  return false;
}

export function isVokasiInstitution(inst: PublicPreviewInstitution): boolean {
  return !isLembagaInstitution(inst);
}

export const PRIORITY_34_CANONICAL: Array<{
  name: string;
  category: "lembaga" | "vokasi";
  type: string;
  province: string;
  district: string;
  keyword: string;
}> = [
  // 13 Satuan Vokasi (SMK, Politeknik, Perguruan Tinggi Vokasi)
  { name: "Institut Kesehatan Rajawali", category: "vokasi", type: "Perguruan Tinggi / Vokasi", province: "Jawa Barat", district: "Kota Bandung", keyword: "rajawali" },
  { name: "Politeknik Indonusa Surakarta", category: "vokasi", type: "Politeknik", province: "Jawa Tengah", district: "Kota Surakarta", keyword: "indonusa" },
  { name: "Universitas Duta Bangsa Surakarta", category: "vokasi", type: "Universitas / Vokasi", province: "Jawa Tengah", district: "Kota Surakarta", keyword: "duta bangsa" },
  { name: "Sekolah Tinggi Pariwisata Ambarrukmo Yogyakarta", category: "vokasi", type: "Perguruan Tinggi / Vokasi", province: "DI Yogyakarta", district: "Kabupaten Sleman", keyword: "ambarrukmo" },
  { name: "Universitas Kepanjen", category: "vokasi", type: "Universitas / Vokasi", province: "Jawa Timur", district: "Kabupaten Malang", keyword: "kepanjen" },
  { name: "Institut Kesehatan Immanuel Bandung", category: "vokasi", type: "Perguruan Tinggi / Vokasi", province: "Jawa Barat", district: "Kota Bandung", keyword: "immanuel" },
  { name: "SMK NEGERI 1 MUNDU", category: "vokasi", type: "SMK", province: "Jawa Barat", district: "Kabupaten Cirebon", keyword: "mundu" },
  { name: "Institut Pariwisata Tedja Indonesia", category: "vokasi", type: "Perguruan Tinggi / Vokasi", province: "DKI Jakarta", district: "Jakarta Pusat", keyword: "tedja indonesia" },
  { name: "Universitas Mitra Husada", category: "vokasi", type: "Universitas / Vokasi", province: "Sumatera Utara", district: "Kota Medan", keyword: "mitra husada" },
  { name: "Sekolah Tinggi Ilmu Kesehatan Tujuh Belas", category: "vokasi", type: "Perguruan Tinggi / Vokasi", province: "Jawa Tengah", district: "Kota Surakarta", keyword: "tujuh belas" },
  { name: "SMK Negeri 2 Purwodadi", category: "vokasi", type: "SMK", province: "Jawa Tengah", district: "Kabupaten Grobogan", keyword: "purwodadi" },
  { name: "Universitas Wiralodra", category: "vokasi", type: "Universitas / Vokasi", province: "Jawa Barat", district: "Kabupaten Indramayu", keyword: "wiralodra" },
  { name: "POLITEKNIK ASSALAAM SURAKARTA", category: "vokasi", type: "Politeknik", province: "Jawa Tengah", district: "Kabupaten Sukoharjo", keyword: "assalaam" },

  // 21 Lembaga (LPK, LKP, Lembaga Pelatihan)
  { name: "LKP KARYA DUTA", category: "lembaga", type: "LKP / LPK", province: "Jawa Barat", district: "Kabupaten Karawang", keyword: "karya duta" },
  { name: "Graha Wisata SEMARANG", category: "lembaga", type: "LPK", province: "Jawa Tengah", district: "Kota Semarang", keyword: "graha wisata semarang" },
  { name: "LPK EIKO GAKKOU", category: "lembaga", type: "LPK", province: "Jawa Tengah", district: "Kabupaten Semarang", keyword: "eiko gakkou" },
  { name: "LKP American English Course (AEC)", category: "lembaga", type: "LKP / LPK", province: "Jawa Tengah", district: "Kabupaten Klaten", keyword: "american english" },
  { name: "LPK Hayashi", category: "lembaga", type: "LPK", province: "Jawa Tengah", district: "Kota Salatiga", keyword: "hayashi" },
  { name: "LKP P4M", category: "lembaga", type: "LKP / LPK", province: "Jawa Barat", district: "Kabupaten Bandung", keyword: "p4m" },
  { name: "Lembaga pelatihan kerja baruna academy international", category: "lembaga", type: "LPK", province: "DI Yogyakarta", district: "Kota Yogyakarta", keyword: "baruna academy" },
  { name: "LPK Trijasa", category: "lembaga", type: "LPK", province: "Jawa Tengah", district: "Kabupaten Semarang", keyword: "trijasa" },
  { name: "LKP Citra International Tourism Institute", category: "lembaga", type: "LKP / LPK", province: "Jawa Barat", district: "Kabupaten Cianjur", keyword: "citra international" },
  { name: "Genesis Talent Academy Profesional", category: "lembaga", type: "LPK", province: "Jawa Tengah", district: "Kota Semarang", keyword: "genesis talent" },
  { name: "Victoria Hotel School", category: "lembaga", type: "LPK / Lembaga Kursus", province: "Jawa Tengah", district: "Kota Klaten", keyword: "victoria hotel" },
  { name: "LKP Study Hotel Executive Kediri", category: "lembaga", type: "LKP / LPK", province: "Jawa Timur", district: "Kota Kediri", keyword: "study hotel" },
  { name: "LKP OMEGA MARINE HOTEL INSTITUTE CILACAP (PT GEMILANG SUKMA JAYA)", category: "lembaga", type: "LKP / LPK", province: "Jawa Tengah", district: "Kabupaten Cilacap", keyword: "omega marine" },
  { name: "Duta Internasional", category: "lembaga", type: "LPK", province: "Jawa Tengah", district: "Kabupaten Sragen", keyword: "duta internasional" },
  { name: "LPIA Hotel dan Kapal Pesiar", category: "lembaga", type: "LPK", province: "Jawa Barat", district: "Kota Bekasi", keyword: "lpia hotel" },
  { name: "LKP Padjadjaran Mitra Education Center", category: "lembaga", type: "LKP / LPK", province: "Jawa Barat", district: "Kabupaten Bandung Barat", keyword: "padjadjaran mitra" },
  { name: "LKP GRAHA WISATA", category: "lembaga", type: "LKP / LPK", province: "Jawa Tengah", district: "Kota Semarang", keyword: "lkp graha wisata" },
  { name: "LPK Erlangga Blitar", category: "lembaga", type: "LPK", province: "Jawa Timur", district: "Kota Blitar", keyword: "erlangga blitar" },
  { name: "LPK House of Learning", category: "lembaga", type: "LPK", province: "Jawa Tengah", district: "Kota Semarang", keyword: "house of learning" },
  { name: "LPK Smart Plus Education", category: "lembaga", type: "LPK", province: "Jawa Barat", district: "Kota Bandung", keyword: "smart plus" },
  { name: "Metro Hotel School", category: "lembaga", type: "LPK / Lembaga Kursus", province: "Jawa Barat", district: "Kota Bogor", keyword: "metro hotel" },
];

export function isPriorityInstitution(inst: PublicPreviewInstitution): boolean {
  const n = (inst.name || "").toLowerCase();
  return PRIORITY_34_CANONICAL.some((c) => n.includes(c.keyword) || (c.keyword.length > 5 && c.name.toLowerCase().includes(n)));
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
  const [activeDrilldownType, setActiveDrilldownType] = useState<PublicDrilldownType | null>(type);
  const [candidateViewScope, setCandidateViewScope] = useState<"by_institution" | "all_candidates">("by_institution");
  const [nationalFilterCountry, setNationalFilterCountry] = useState<string>("ALL");
  const [nationalFilterSector, setNationalFilterSector] = useState<string>("ALL");
  const [nationalStudentPage, setNationalStudentPage] = useState<number>(1);
  const [nationalStudentPageSize, setNationalStudentPageSize] = useState<number>(25);
  const [nationalStudentViewMode, setNationalStudentViewMode] = useState<"card" | "table">("table");
  const [demandFilterCountry, setDemandFilterCountry] = useState<string>("ALL");
  const [demandFilterSector, setDemandFilterSector] = useState<string>("ALL");

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [programViewTab, setProgramViewTab] = useState<"catalog" | "students">("catalog");
  const [selectedSector, setSelectedSector] = useState<string | null>(
    initialSector,
  );
  const [selectedOccupation, setSelectedOccupation] = useState<string | null>(
    null,
  );
  const [selectedInstitutionForStudents, setSelectedInstitutionForStudents] = useState<PublicPreviewInstitution | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>("");
  const [studentPage, setStudentPage] = useState<number>(1);
  const [studentPageSize, setStudentPageSize] = useState<number>(25);
  const [studentViewMode, setStudentViewMode] = useState<"card" | "table">("card");
  const [studentFilterCountry, setStudentFilterCountry] = useState<string>("ALL");
  const [studentFilterSector, setStudentFilterSector] = useState<string>("ALL");
  const [candidateSearchQuery, setCandidateSearchQuery] = useState<string>("");
  const [selectedCandidateForDetail, setSelectedCandidateForDetail] = useState<CandidateParticipant | null>(null);
  const [selectedProvinceForLpk, setSelectedProvinceForLpk] = useState<string | null>(null);
  const [institutionSourceFilter, setInstitutionSourceFilter] = useState<"ALL" | "siskop2mi" | "disnaker" | "umum">(initialSourceFilter);
  const [institutionLevelFilter, setInstitutionLevelFilter] = useState<"ALL" | InstitutionInputLevel>("ALL");
  const [institutionCategoryFilter, setInstitutionCategoryFilter] = useState<"ALL" | "prioritas" | "lembaga" | "vokasi">("prioritas");
  const [institutionStatusFilter, setInstitutionStatusFilter] = useState<"ALL" | "supply" | "verified">("supply");
  const [institutionSearchQuery, setInstitutionSearchQuery] = useState<string>("");
  const [institutionPage, setInstitutionPage] = useState<number>(1);

  useEffect(() => {
    setActiveDrilldownType(type);
    setSelectedCountry(null);
    setProgramViewTab("catalog");
    setSelectedSector(initialSector);
    setSelectedOccupation(null);
    setSelectedInstitutionForStudents(null);
    setSelectedProvinceForLpk(null);
    setCandidateViewScope("by_institution");
    setNationalFilterCountry("ALL");
    setNationalFilterSector("ALL");
    setNationalStudentPage(1);
    setNationalStudentPageSize(25);
    setNationalStudentViewMode("table");
    setDemandFilterCountry("ALL");
    setDemandFilterSector("ALL");
    setStudentSearchQuery("");
    setStudentPage(1);
    setStudentPageSize(25);
    setStudentViewMode("card");
    setStudentFilterCountry("ALL");
    setStudentFilterSector("ALL");
    setCandidateSearchQuery("");
    setSelectedCandidateForDetail(null);
    setInstitutionSourceFilter(initialSourceFilter);
    setInstitutionLevelFilter("ALL");
    setInstitutionCategoryFilter("prioritas");
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

  const allNationalStudents = useMemo(() => {
    const list: Array<
      PublicPreviewStudent & {
        institutionName: string;
        institutionId: string;
        province?: string;
        district?: string;
        normalizedCountry: string;
        normalizedSector: string;
      }
    > = [];

    institutions.forEach((inst) => {
      (inst.students ?? []).forEach((st) => {
        list.push({
          ...st,
          institutionName: inst.name,
          institutionId: inst.id,
          province: inst.province,
          district: inst.district,
          normalizedCountry: normalizeStudentCountry(st.targetCountry),
          normalizedSector: normalizeStudentSector(st.sector, st.major),
        });
      });
    });

    return list;
  }, [institutions]);

  const filteredNationalStudents = useMemo(() => {
    const q = institutionSearchQuery.toLowerCase().trim();
    return allNationalStudents.filter((s) => {
      if (nationalFilterCountry !== "ALL" && s.normalizedCountry !== nationalFilterCountry) {
        return false;
      }
      if (nationalFilterSector !== "ALL" && s.normalizedSector !== nationalFilterSector) {
        return false;
      }
      if (q) {
        return (
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          (s.nik && s.nik.toLowerCase().includes(q)) ||
          s.institutionName.toLowerCase().includes(q) ||
          (s.district && s.district.toLowerCase().includes(q)) ||
          s.targetCountry.toLowerCase().includes(q) ||
          s.sector.toLowerCase().includes(q) ||
          s.occupation.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allNationalStudents, nationalFilterCountry, nationalFilterSector, institutionSearchQuery]);

  const dynamicCountryCounts = useMemo(() => {
    const base = allNationalStudents.filter((s) => {
      if (nationalFilterSector !== "ALL" && s.normalizedSector !== nationalFilterSector) {
        return false;
      }
      return true;
    });

    const nationalByCountry = data.national?.candidatesByCountry;

    const counts: Record<string, number> = {
      Jepang: 0,
      Turki: 0,
      Korea: 0,
      Malaysia: 0,
      Lainnya: 0,
    };

    if (nationalFilterSector === "ALL" && nationalByCountry) {
      counts.Jepang = nationalByCountry.Jepang || 0;
      counts.Turki = nationalByCountry.Turki || 0;
      counts.Korea = nationalByCountry.Korea || 0;
      counts.Malaysia = nationalByCountry.Malaysia || 0;
    } else {
      base.forEach((s) => {
        counts[s.normalizedCountry] = (counts[s.normalizedCountry] ?? 0) + 1;
      });
    }

    return {
      total: base.length,
      items: Object.entries(counts).sort((a, b) => b[1] - a[1]),
    };
  }, [allNationalStudents, nationalFilterSector]);

  const dynamicSectorCounts = useMemo(() => {
    const base = allNationalStudents.filter((s) => {
      if (nationalFilterCountry !== "ALL" && s.normalizedCountry !== nationalFilterCountry) {
        return false;
      }
      return true;
    });

    const counts: Record<string, number> = {};
    base.forEach((s) => {
      counts[s.normalizedSector] = (counts[s.normalizedSector] ?? 0) + 1;
    });

    return {
      total: base.length,
      items: Object.entries(counts).sort((a, b) => b[1] - a[1]),
    };
  }, [allNationalStudents, nationalFilterCountry]);

  const nationalSummary = useMemo(() => {
    return {
      total: allNationalStudents.length,
      countries: dynamicCountryCounts.items,
      sectors: dynamicSectorCounts.items,
    };
  }, [allNationalStudents.length, dynamicCountryCounts.items, dynamicSectorCounts.items]);

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

  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  const handleExportCustomStudentsExcel = async ({
    studentsToExport,
    title,
    filenamePrefix,
    defaultInstitutionName,
  }: {
    studentsToExport: Array<
      PublicPreviewStudent & {
        institutionName?: string;
        province?: string;
        district?: string;
      }
    >;
    title: string;
    filenamePrefix: string;
    defaultInstitutionName?: string;
  }) => {
    if (studentsToExport.length === 0) {
      toast.warning("Tidak ada data calon peserta untuk diekspor.");
      return;
    }

    try {
      setIsExportingExcel(true);
      const XLSX = await import("xlsx");

      const rows = studentsToExport.map((s) => {
        const instName = s.institutionName || defaultInstitutionName || "Lembaga Vokasi Mitra";
        const isSmk = instName.toLowerCase().includes("smk");
        const eduLevel = isSmk ? "SMK" : "D3";
        const targetCountries = s.targetCountry || "Jepang";

        let bahasa = "Jepang";
        let levelBahasa = "JLPT N4";
        const lowerTarget = targetCountries.toLowerCase();
        if (lowerTarget.includes("jerman")) {
          bahasa = "Jerman";
          levelBahasa = "A2 Goethe";
        } else if (lowerTarget.includes("korea")) {
          bahasa = "Korea";
          levelBahasa = "TOPIK Level 2";
        } else if (
          lowerTarget.includes("turki") ||
          lowerTarget.includes("malaysia") ||
          lowerTarget.includes("pesiar") ||
          lowerTarget.includes("emirat")
        ) {
          bahasa = "Inggris";
          levelBahasa = "Intermediate / Vokasi";
        }

        return {
          "Nama lengkap": s.name,
          "NIK (opsional)": s.nik || "",
          "Provinsi": s.province || "Jawa Barat",
          "Kabupaten/Kota": s.district || "Wilayah Penempatan",
          "Jenjang pendidikan": eduLevel,
          "Jurusan": s.major && s.major !== "-" ? s.major : s.sector,
          "Nama Sekolah/Politeknik": instName,
          "Keterampilan/Kompetensi (pisahkan koma)": s.occupation || s.sector,
          "Bidang pengalaman kerja": `${s.sector} - ${s.occupation}`,
          "Lama pengalaman (tahun)": "1",
          "Nama perusahaan (opsional)": `Praktik Industri ${instName}`,
          "Sertifikasi kompetensi (nama & penerbit)": "Sertifikat Kompetensi Keahlian (BNSP)",
          "Bahasa asing": bahasa,
          "Level bahasa (JLPT N4/A2/TOEIC/Basic)": levelBahasa,
          "Negara tujuan yang diminati (pisahkan koma)": targetCountries,
          "Sektor pilihan (pisahkan koma)": s.sector,
          "Jabatan yang dipilih (pisahkan koma)": s.occupation,
          "Kontak (HP/Email, opsional)": "",
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);

      worksheet["!cols"] = [
        { wch: 28 }, // Nama lengkap
        { wch: 18 }, // NIK (opsional)
        { wch: 20 }, // Provinsi
        { wch: 22 }, // Kabupaten/Kota
        { wch: 18 }, // Jenjang pendidikan
        { wch: 25 }, // Jurusan
        { wch: 35 }, // Nama Sekolah/Politeknik
        { wch: 30 }, // Keterampilan/Kompetensi
        { wch: 30 }, // Bidang pengalaman kerja
        { wch: 20 }, // Lama pengalaman (tahun)
        { wch: 30 }, // Nama perusahaan (opsional)
        { wch: 35 }, // Sertifikasi kompetensi
        { wch: 16 }, // Bahasa asing
        { wch: 25 }, // Level bahasa
        { wch: 25 }, // Negara tujuan
        { wch: 25 }, // Sektor pilihan
        { wch: 28 }, // Jabatan yang dipilih
        { wch: 20 }, // Kontak
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template Calon PMI");

      const slugName = (filenamePrefix || "calon-peserta")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const fileName = `${slugName}.xlsx`;

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const blobUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

      toast.success(
        `Berhasil mengunduh ${studentsToExport.length.toLocaleString("id-ID")} data calon peserta ke ${fileName}!`
      );
    } catch (err) {
      console.error("Export Excel error:", err);
      toast.error("Gagal mengekspor data ke Excel. Silakan coba lagi.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportStudentsExcel = async (customRows?: PublicPreviewStudent[]) => {
    if (!selectedInstitutionForStudents) return;
    const studentsToExport = customRows && customRows.length > 0
      ? customRows
      : (selectedInstitutionForStudents.students ?? []);

    await handleExportCustomStudentsExcel({
      studentsToExport: studentsToExport.map((s) => ({
        ...s,
        institutionName: selectedInstitutionForStudents.name,
        province: selectedInstitutionForStudents.province,
        district: selectedInstitutionForStudents.district,
      })),
      title: selectedInstitutionForStudents.name || "Calon Peserta",
      filenamePrefix: `calon-peserta-${selectedInstitutionForStudents.name || "lembaga"}`,
      defaultInstitutionName: selectedInstitutionForStudents.name,
    });
  };

  const handleExportNationalStudentsExcel = async (
    filteredRows: Array<PublicPreviewStudent & { institutionName?: string; province?: string; district?: string }>
  ) => {
    const filterDesc = [
      nationalFilterCountry !== "ALL" ? nationalFilterCountry : "",
      nationalFilterSector !== "ALL" ? nationalFilterSector : "",
    ].filter(Boolean).join("-") || "semua";

    await handleExportCustomStudentsExcel({
      studentsToExport: filteredRows,
      title: `Calon Peserta Nasional (${filteredRows.length})`,
      filenamePrefix: `calon-peserta-nasional-${filterDesc}`,
      defaultInstitutionName: "Lembaga Vokasi Nasional",
    });
  };

  const renderStudentList = () => {
    if (!selectedInstitutionForStudents) return null;
    const students = selectedInstitutionForStudents.students ?? [];
    const q = studentSearchQuery.trim().toLowerCase();

    // Rekapitulasi Agregat Negara & Sektor untuk Lembaga Ini
    const countryBreakdown: Array<[string, number]> = (() => {
      const counts: Record<string, number> = {};
      students.forEach((s) => {
        const countries = (s.targetCountry || "Belum Ditentukan")
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);
        countries.forEach((c) => {
          counts[c] = (counts[c] || 0) + 1;
        });
      });
      return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    })();

    const sectorBreakdown: Array<[string, number]> = (() => {
      const counts: Record<string, number> = {};
      students.forEach((s) => {
        const sector = (s.sector || s.major || "Lainnya").trim();
        counts[sector] = (counts[sector] || 0) + 1;
      });
      return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    })();

    // Filter gabungan: Negara, Sektor, dan Pencarian teks
    const filtered = students.filter((s) => {
      if (studentFilterCountry !== "ALL") {
        const matchCountry = (s.targetCountry || "")
          .toLowerCase()
          .includes(studentFilterCountry.toLowerCase());
        if (!matchCountry) return false;
      }
      if (studentFilterSector !== "ALL") {
        const sec = (s.sector || s.major || "").toLowerCase();
        if (!sec.includes(studentFilterSector.toLowerCase())) return false;
      }
      if (q) {
        return (
          s.name.toLowerCase().includes(q) ||
          s.targetCountry.toLowerCase().includes(q) ||
          s.sector.toLowerCase().includes(q) ||
          s.occupation.toLowerCase().includes(q) ||
          (s.id && s.id.toLowerCase().includes(q))
        );
      }
      return true;
    });

    const totalStudents = filtered.length;
    const isShowingAll = studentPageSize >= 999999;
    const totalPages = isShowingAll ? 1 : Math.max(1, Math.ceil(totalStudents / studentPageSize));
    const safePage = Math.min(Math.max(1, studentPage), totalPages);
    const startIndex = totalStudents === 0 ? 0 : (safePage - 1) * studentPageSize + 1;
    const endIndex = isShowingAll ? totalStudents : Math.min(totalStudents, safePage * studentPageSize);
    const paginatedStudents = isShowingAll
      ? filtered
      : filtered.slice((safePage - 1) * studentPageSize, safePage * studentPageSize);

    return (
      <div className="space-y-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedInstitutionForStudents(null);
            setStudentSearchQuery("");
            setStudentPage(1);
            setStudentFilterCountry("ALL");
            setStudentFilterSector("ALL");
          }}
          className="-ml-2 w-fit gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke daftar lembaga vokasi</span>
        </Button>

        {/* Header Lembaga Vokasi */}
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
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10">
                {students.length.toLocaleString("id-ID")} Calon Peserta
              </Badge>
              <Button
                type="button"
                size="sm"
                onClick={() => handleExportStudentsExcel(filtered)}
                disabled={isExportingExcel || students.length === 0}
                className="h-7 px-2.5 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-colors"
                title="Unduh seluruh data calon peserta lembaga ini dalam berkas Excel (.xlsx)"
              >
                {isExportingExcel ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                )}
                <span>Ekspor Excel (.xlsx)</span>
              </Button>
            </div>
          </div>
        </div>

        {/* REKAPITULASI RINGKASAN DI ATAS: NEGARA & SEKTOR */}
        <div className="rounded-xl border border-border bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/90 dark:to-slate-900 p-3.5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Rekapitulasi Target Negara & Sektor (Total: {students.length.toLocaleString("id-ID")} Peserta)</span>
            </h5>
            {(studentFilterCountry !== "ALL" || studentFilterSector !== "ALL" || studentSearchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setStudentFilterCountry("ALL");
                  setStudentFilterSector("ALL");
                  setStudentSearchQuery("");
                  setStudentPage(1);
                }}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                Reset Semua Filter
              </button>
            )}
          </div>

          {/* Baris 1: Rekap Negara */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
              <Globe2 className="w-3 h-3 text-emerald-600" />
              <span>Rekap Negara Tujuan:</span>
              <span className="font-normal text-[10px] lowercase text-muted-foreground">(klik untuk filter)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setStudentFilterCountry("ALL");
                  setStudentPage(1);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5",
                  studentFilterCountry === "ALL"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground border border-border/60"
                )}
              >
                <span>Semua Negara</span>
                <span className="px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/20 text-[10px] font-mono">
                  {students.length.toLocaleString("id-ID")}
                </span>
              </button>

              {countryBreakdown.map(([cName, cCount]) => {
                const pct = Math.round((cCount / students.length) * 100);
                const isSelected = studentFilterCountry === cName;
                return (
                  <button
                    key={cName}
                    type="button"
                    onClick={() => {
                      setStudentFilterCountry(isSelected ? "ALL" : cName);
                      setStudentPage(1);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 border",
                      isSelected
                        ? "bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs"
                        : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    )}
                  >
                    <span>{cName}</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold",
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200"
                      )}
                    >
                      {cCount.toLocaleString("id-ID")} ({pct}%)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Baris 2: Rekap Sektor */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-blue-600" />
              <span>Rekap Sektor Peminatan:</span>
              <span className="font-normal text-[10px] lowercase text-muted-foreground">(klik untuk filter)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setStudentFilterSector("ALL");
                  setStudentPage(1);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5",
                  studentFilterSector === "ALL"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground border border-border/60"
                )}
              >
                <span>Semua Sektor</span>
                <span className="px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/20 text-[10px] font-mono">
                  {students.length.toLocaleString("id-ID")}
                </span>
              </button>

              {sectorBreakdown.map(([sName, sCount]) => {
                const pct = Math.round((sCount / students.length) * 100);
                const isSelected = studentFilterSector === sName;
                return (
                  <button
                    key={sName}
                    type="button"
                    onClick={() => {
                      setStudentFilterSector(isSelected ? "ALL" : sName);
                      setStudentPage(1);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 border",
                      isSelected
                        ? "bg-blue-600 text-white font-bold border-blue-600 shadow-xs"
                        : "bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30"
                    )}
                  >
                    <span>{sName}</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold",
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-blue-500/20 text-blue-800 dark:text-blue-200"
                      )}
                    >
                      {sCount.toLocaleString("id-ID")} ({pct}%)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Search & Control Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari nama, ID, target negara, sektor, jabatan..."
              value={studentSearchQuery}
              onChange={(e) => {
                setStudentSearchQuery(e.target.value);
                setStudentPage(1);
              }}
              className="pl-8 h-8 text-xs bg-background"
            />
            {studentSearchQuery && (
              <button
                type="button"
                onClick={() => {
                  setStudentSearchQuery("");
                  setStudentPage(1);
                }}
                className="absolute right-2.5 top-2 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Mode & Page Size Toolbar */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/30">
              <button
                type="button"
                onClick={() => setStudentViewMode("card")}
                title="Tampilan Kartu"
                className={cn(
                  "p-1.5 rounded-md text-xs transition cursor-pointer flex items-center gap-1",
                  studentViewMode === "card"
                    ? "bg-white dark:bg-slate-800 text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutList className="h-3.5 w-3.5" />
                <span className="hidden md:inline text-[11px]">Kartu</span>
              </button>
              <button
                type="button"
                onClick={() => setStudentViewMode("table")}
                title="Tampilan Tabel Rapat (Mudah Cek Urutan)"
                className={cn(
                  "p-1.5 rounded-md text-xs transition cursor-pointer flex items-center gap-1",
                  studentViewMode === "table"
                    ? "bg-white dark:bg-slate-800 text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <TableProperties className="h-3.5 w-3.5" />
                <span className="hidden md:inline text-[11px]">Tabel</span>
              </button>
            </div>

            {/* Per-Page Selector */}
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground border-l border-border/60 pl-2">
              <span className="hidden sm:inline">Per hal:</span>
              {[25, 50, 100].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setStudentPageSize(size);
                    setStudentPage(1);
                  }}
                  className={cn(
                    "px-2 py-1 rounded-md text-[11px] font-mono transition cursor-pointer",
                    studentPageSize === size
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "bg-muted/40 hover:bg-muted text-muted-foreground"
                  )}
                >
                  {size}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setStudentPageSize(999999);
                  setStudentPage(1);
                }}
                className={cn(
                  "px-2 py-1 rounded-md text-[11px] transition cursor-pointer",
                  isShowingAll
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground"
                )}
                title="Tampilkan seluruh data tanpa paginasi"
              >
                Semua
              </button>
            </div>
          </div>
        </div>

        {/* Status Counter Bar */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 bg-muted/20 py-1.5 rounded-md border border-border/40">
          <div>
            Menampilkan <span className="font-bold text-foreground font-mono">#{startIndex.toLocaleString("id-ID")}</span> –{" "}
            <span className="font-bold text-foreground font-mono">#{endIndex.toLocaleString("id-ID")}</span> dari{" "}
            <span className="font-bold text-foreground font-mono">{totalStudents.toLocaleString("id-ID")}</span> calon peserta
            {studentSearchQuery && (
              <span className="ml-1 text-primary">
                (difilter dari total {students.length.toLocaleString("id-ID")})
              </span>
            )}
          </div>
          {!isShowingAll && totalPages > 1 && (
            <div className="text-[11px] font-medium text-muted-foreground">
              Hal. <span className="font-bold text-foreground">{safePage}</span> / {totalPages}
            </div>
          )}
        </div>

        {/* Content Body: Empty or Card or Table */}
        {paginatedStudents.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground rounded-lg border border-dashed border-border">
            Tidak ada data calon peserta yang cocok dengan pencarian &quot;{studentSearchQuery}&quot;.
          </div>
        ) : studentViewMode === "table" ? (
          /* Table View: Sangat ringkas dan nomor urut langsung terlihat sejajar */
          <div className="overflow-x-auto rounded-lg border border-border bg-white dark:bg-slate-900 max-h-[50vh] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-xs text-muted-foreground font-semibold border-b border-border z-10">
                <tr>
                  <th className="py-2.5 px-3 w-16 text-center font-mono">No.</th>
                  <th className="py-2.5 px-3">Nama & ID Peserta</th>
                  <th className="py-2.5 px-3">Negara Target</th>
                  <th className="py-2.5 px-3">Sektor</th>
                  <th className="py-2.5 px-3">Jabatan</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedStudents.map((s, idx) => {
                  const globalNo = (safePage - 1) * (isShowingAll ? totalStudents : studentPageSize) + idx + 1;
                  return (
                    <tr key={s.id || idx} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300 bg-muted/10">
                        #{globalNo}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-foreground">{s.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{s.nik ? `NIK: ${s.nik}` : `ID: ${s.id}`}</div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Globe2 className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[140px]">{s.targetCountry}</span>
                        </span>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">
                        <span className="truncate max-w-[130px] block">{s.sector}</span>
                      </td>
                      <td className="py-2 px-3 font-medium text-foreground">
                        <span className="truncate max-w-[140px] block">{s.occupation}</span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 whitespace-nowrap">
                          {s.status || "Siap Penempatan"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Card View: Dilengkapi badge nomor urut #1, #2 ... #1399 */
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {paginatedStudents.map((s, idx) => {
              const globalNo = (safePage - 1) * (isShowingAll ? totalStudents : studentPageSize) + idx + 1;
              return (
                <div
                  key={s.id || idx}
                  className="rounded-lg border border-border bg-white dark:bg-slate-900 p-3 space-y-2 hover:border-primary/40 transition-colors shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center min-w-[2.75rem] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold shrink-0 shadow-2xs">
                        #{globalNo}
                      </span>
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-foreground leading-tight">
                          {s.name}
                        </h5>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {s.nik ? `NIK: ${s.nik}` : `ID: ${s.id}`}
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
              );
            })}
          </div>
        )}

        {/* Pagination Navigation Bar */}
        {!isShowingAll && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStudentPage(1)}
                disabled={safePage <= 1}
                title="Lompat ke halaman awal (No. 1)"
                className="h-7 px-2 text-xs gap-1 cursor-pointer"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Awal (#1)</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Sebelumnya</span>
              </Button>
            </div>

            <span className="font-semibold text-foreground text-center">
              Halaman {safePage} dari {totalPages}
            </span>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStudentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStudentPage(totalPages)}
                disabled={safePage >= totalPages}
                title={`Lompat ke halaman terakhir (No. ${totalStudents.toLocaleString("id-ID")})`}
                className="h-7 px-2 text-xs gap-1 cursor-pointer font-bold text-primary hover:text-primary"
              >
                <span className="hidden sm:inline">Ke Akhir (#{totalStudents.toLocaleString("id-ID")})</span>
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderNationalAllCandidates = (_studentsToRender?: typeof allNationalStudents) => {
    const filtered = filteredNationalStudents;

    const totalStudents = filtered.length;
    const isShowingAll = nationalStudentPageSize >= 99999;
    const effectivePageSize = isShowingAll ? totalStudents : nationalStudentPageSize;
    const totalPages = Math.max(1, Math.ceil(totalStudents / Math.max(1, effectivePageSize)));
    const safePage = Math.min(nationalStudentPage, totalPages);
    const startIndex = totalStudents === 0 ? 0 : (safePage - 1) * effectivePageSize + 1;
    const endIndex = isShowingAll ? totalStudents : Math.min(safePage * effectivePageSize, totalStudents);
    const paginatedStudents = isShowingAll
      ? filtered
      : filtered.slice((safePage - 1) * effectivePageSize, safePage * effectivePageSize);

    return (
      <div className="space-y-3">
        {/* Search & Control Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama peserta, ID/NIK, lembaga vokasi, kab/kota, atau kejuruan..."
              value={institutionSearchQuery}
              onChange={(e) => {
                setInstitutionSearchQuery(e.target.value);
                setNationalStudentPage(1);
              }}
              className="h-8.5 pl-8 pr-8 text-xs bg-background"
            />
            {institutionSearchQuery && (
              <button
                type="button"
                onClick={() => {
                  setInstitutionSearchQuery("");
                  setNationalStudentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            {/* Export Excel Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isExportingExcel || totalStudents === 0}
              onClick={() => handleExportNationalStudentsExcel(filtered)}
              className="h-8 px-2.5 text-xs gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer font-medium"
              title="Ekspor seluruh data hasil filter ke file Microsoft Excel (.xlsx)"
            >
              {isExportingExcel ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
              ) : (
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              )}
              <span>Excel ({totalStudents.toLocaleString("id-ID")})</span>
            </Button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted/50 p-0.5 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => setNationalStudentViewMode("table")}
                className={cn(
                  "p-1.5 rounded-md transition cursor-pointer",
                  nationalStudentViewMode === "table"
                    ? "bg-background shadow-xs text-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Tampilan Tabel Berurutan"
              >
                <TableProperties className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setNationalStudentViewMode("card")}
                className={cn(
                  "p-1.5 rounded-md transition cursor-pointer",
                  nationalStudentViewMode === "card"
                    ? "bg-background shadow-xs text-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Tampilan Kartu Ringkasan"
              >
                <LayoutList className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Per-Page Selector */}
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground border-l border-border/60 pl-2">
              <span className="hidden sm:inline">Per hal:</span>
              {[25, 50, 100].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setNationalStudentPageSize(size);
                    setNationalStudentPage(1);
                  }}
                  className={cn(
                    "px-2 py-1 rounded-md text-[11px] font-mono transition cursor-pointer",
                    nationalStudentPageSize === size
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "bg-muted/40 hover:bg-muted text-muted-foreground"
                  )}
                >
                  {size}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setNationalStudentPageSize(999999);
                  setNationalStudentPage(1);
                }}
                className={cn(
                  "px-2 py-1 rounded-md text-[11px] transition cursor-pointer",
                  isShowingAll
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground"
                )}
                title="Tampilkan seluruh data tanpa paginasi"
              >
                Semua
              </button>
            </div>
          </div>
        </div>

        {/* Counter Bar */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-2 bg-muted/20 py-1.5 rounded-md border border-border/40">
          <div>
            Menampilkan <span className="font-bold text-foreground font-mono">#{startIndex.toLocaleString("id-ID")}</span> –{" "}
            <span className="font-bold text-foreground font-mono">#{endIndex.toLocaleString("id-ID")}</span> dari{" "}
            <span className="font-bold text-foreground font-mono">{totalStudents.toLocaleString("id-ID")}</span> calon peserta nasional
            {(institutionSearchQuery || nationalFilterCountry !== "ALL" || nationalFilterSector !== "ALL") && (
              <span className="ml-1 text-primary">
                (difilter dari total {allNationalStudents.length.toLocaleString("id-ID")})
              </span>
            )}
          </div>
          {!isShowingAll && totalPages > 1 && (
            <div className="text-[11px] font-medium text-muted-foreground">
              Hal. <span className="font-bold text-foreground">{safePage}</span> / {totalPages}
            </div>
          )}
        </div>

        {/* Body Table/Card */}
        {paginatedStudents.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground rounded-lg border border-dashed border-border">
            Tidak ada calon peserta yang cocok dengan kriteria filter saat ini.
          </div>
        ) : nationalStudentViewMode === "table" ? (
          <div className="overflow-x-auto rounded-lg border border-border bg-white dark:bg-slate-900 max-h-[50vh] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-xs text-muted-foreground font-semibold border-b border-border z-10">
                <tr>
                  <th className="py-2.5 px-3 w-16 text-center font-mono">No.</th>
                  <th className="py-2.5 px-3">Nama & ID Peserta</th>
                  <th className="py-2.5 px-3">Lembaga Vokasi Penyuplai</th>
                  <th className="py-2.5 px-3">Negara Target</th>
                  <th className="py-2.5 px-3">Sektor</th>
                  <th className="py-2.5 px-3">Jabatan</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedStudents.map((s, idx) => {
                  const globalNo = (safePage - 1) * (isShowingAll ? totalStudents : nationalStudentPageSize) + idx + 1;
                  return (
                    <tr key={s.id || idx} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300 bg-muted/10">
                        #{globalNo}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-foreground">{s.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{s.nik ? `NIK: ${s.nik}` : `ID: ${s.id}`}</div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-medium text-foreground truncate max-w-[170px]" title={s.institutionName}>
                          {s.institutionName}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[170px]">
                          {s.district || s.province || "—"}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Globe2 className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[120px]">{s.targetCountry}</span>
                        </span>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">
                        <span className="font-medium text-foreground truncate max-w-[150px] block" title={s.normalizedSector}>
                          {s.normalizedSector}
                        </span>
                        {s.sector && s.sector !== s.normalizedSector && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-[150px] block" title={s.sector}>
                            {s.sector}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-medium text-foreground">
                        <span className="truncate max-w-[130px] block" title={s.occupation}>
                          {s.occupation}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 whitespace-nowrap">
                          {s.status || "Siap Penempatan"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {paginatedStudents.map((s, idx) => {
              const globalNo = (safePage - 1) * (isShowingAll ? totalStudents : nationalStudentPageSize) + idx + 1;
              return (
                <div
                  key={s.id || idx}
                  className="rounded-lg border border-border bg-white dark:bg-slate-900 p-3 space-y-2 hover:border-primary/40 transition-colors shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center min-w-[2.75rem] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold shrink-0 shadow-2xs">
                        #{globalNo}
                      </span>
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-foreground leading-tight">
                          {s.name}
                        </h5>
                        <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-2">
                          <span>{s.nik ? `NIK: ${s.nik}` : `ID: ${s.id}`}</span>
                          <span>•</span>
                          <span className="font-sans font-medium text-primary truncate max-w-[200px]">
                            {s.institutionName}
                          </span>
                        </div>
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
                      <span className="text-[10px] text-muted-foreground block font-medium">Sektor & Kejuruan:</span>
                      <span className="font-semibold text-foreground truncate block mt-0.5" title={s.normalizedSector}>
                        {s.normalizedSector}
                      </span>
                      {s.sector && s.sector !== s.normalizedSector && (
                        <span className="text-[10px] text-muted-foreground truncate block" title={s.sector}>
                          {s.sector}
                        </span>
                      )}
                    </div>
                    <div className="bg-muted/30 rounded p-1.5">
                      <span className="text-[10px] text-muted-foreground block font-medium">Jabatan / Kompetensi:</span>
                      <span className="font-medium text-foreground truncate block mt-0.5" title={s.occupation}>
                        {s.occupation}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!isShowingAll && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNationalStudentPage(1)}
                disabled={safePage <= 1}
                className="h-7 px-2 text-xs gap-1 cursor-pointer"
                title="Kembali ke urutan pertama #1"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Awal (#1)</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNationalStudentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="h-7 px-2 text-xs gap-1 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Sebelumnya
              </Button>
            </div>

            <span className="font-mono text-muted-foreground text-[11px]">
              Hal. <strong className="text-foreground">{safePage}</strong> dari <strong>{totalPages}</strong> ({totalStudents.toLocaleString("id-ID")} peserta)
            </span>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNationalStudentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="h-7 px-2 text-xs gap-1 cursor-pointer"
              >
                Selanjutnya
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNationalStudentPage(totalPages)}
                disabled={safePage >= totalPages}
                className="h-7 px-2 text-xs gap-1 cursor-pointer"
                title={`Loncat ke data terakhir #${totalStudents.toLocaleString("id-ID")}`}
              >
                <span className="hidden sm:inline">Ke Akhir (#{totalStudents.toLocaleString("id-ID")})</span>
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInstitutionList = (items: PublicPreviewInstitution[]) => {
    const supplyOnlyItems = items.filter(
      (it) => (it.students?.length ?? it.studentCount ?? 0) > 0
    );
    const lembagaCount = supplyOnlyItems.filter((it) => isLembagaInstitution(it)).length;
    const vokasiCount = supplyOnlyItems.filter((it) => isVokasiInstitution(it)).length;

    // Filter berdasarkan Negara & Sektor Nasional bila aktif
    const filteredByNational = supplyOnlyItems.filter((it) => {
      const studs = it.students ?? [];
      if (nationalFilterCountry !== "ALL") {
        const hasCountry = studs.some((s) => normalizeStudentCountry(s.targetCountry) === nationalFilterCountry);
        if (!hasCountry) return false;
      }
      if (nationalFilterSector !== "ALL") {
        const hasSector = studs.some((s) => normalizeStudentSector(s.sector, s.major) === nationalFilterSector);
        if (!hasSector) return false;
      }
      return true;
    });

    const q = institutionSearchQuery.toLowerCase().trim();
    const filtered = filteredByNational.filter((it) => {
      const matchSearch =
        !q ||
        it.name.toLowerCase().includes(q) ||
        (it.province && it.province.toLowerCase().includes(q)) ||
        (it.district && it.district.toLowerCase().includes(q)) ||
        (it.type && it.type.toLowerCase().includes(q));

      const matchCategory =
        institutionCategoryFilter === "ALL" ||
        (institutionCategoryFilter === "prioritas" && (isPriorityInstitution(it) || Boolean(it.isPriorityPartner))) ||
        (institutionCategoryFilter === "lembaga" && isLembagaInstitution(it)) ||
        (institutionCategoryFilter === "vokasi" && isVokasiInstitution(it));

      return matchSearch && matchCategory;
    });

    const pageSize = 15;
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safeCurrentPage = Math.min(institutionPage, totalPages);
    const paginated = filtered.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

    return (
      <div className="space-y-3.5">
        {/* REKAPITULASI SUPLAI CALON PESERTA NASIONAL */}
        <div className="p-3.5 rounded-xl border border-border bg-slate-50/80 dark:bg-slate-900/80 space-y-3 shadow-xs">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <Users className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>Rekapitulasi Suplai Calon Peserta Nasional</span>
                  <Badge className="bg-emerald-600 text-white font-mono text-[11px] font-bold">
                    {filteredNationalStudents.length.toLocaleString("id-ID")} Calon
                    {(nationalFilterCountry !== "ALL" || nationalFilterSector !== "ALL" || institutionSearchQuery) && (
                      <span className="ml-1 opacity-80 font-normal">/ {allNationalStudents.length.toLocaleString("id-ID")}</span>
                    )}
                  </Badge>
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Distribusi peminatan negara tujuan dan sektor dari {supplyOnlyItems.length} lembaga vokasi penyuplai
                </p>
              </div>
            </div>

            {/* Tombol Ekspor Excel Nasional Langsung */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isExportingExcel || filteredNationalStudents.length === 0}
              onClick={() => handleExportNationalStudentsExcel(filteredNationalStudents)}
              className="h-8 px-2.5 text-xs gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer font-medium self-start sm:self-auto"
              title={`Ekspor ${filteredNationalStudents.length.toLocaleString("id-ID")} data calon peserta sesuai filter ke file Excel (.xlsx)`}
            >
              {isExportingExcel ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
              ) : (
                <Download className="h-3.5 w-3.5 text-emerald-600" />
              )}
              <span>Ekspor Excel ({filteredNationalStudents.length.toLocaleString("id-ID")})</span>
            </Button>
          </div>

          {/* Baris 1: Rekap Negara */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Globe2 className="w-3 h-3 text-emerald-600" />
                <span>Target Negara Penempatan:</span>
                <span className="font-normal text-[10px] lowercase text-muted-foreground">(klik untuk filter)</span>
              </span>
              {nationalFilterCountry !== "ALL" && (
                <button
                  type="button"
                  onClick={() => {
                    setNationalFilterCountry("ALL");
                    setInstitutionPage(1);
                    setNationalStudentPage(1);
                  }}
                  className="text-[10px] text-emerald-600 hover:underline cursor-pointer"
                >
                  Reset Filter Negara
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setNationalFilterCountry("ALL");
                  setInstitutionPage(1);
                  setNationalStudentPage(1);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5",
                  nationalFilterCountry === "ALL"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground border border-border/60"
                )}
              >
                <span>Semua Negara</span>
                <span className="px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/20 text-[10px] font-mono">
                  {dynamicCountryCounts.total.toLocaleString("id-ID")}
                </span>
              </button>

              {dynamicCountryCounts.items.map(([cName, cCount]) => {
                const pct = dynamicCountryCounts.total > 0 ? Math.round((cCount / dynamicCountryCounts.total) * 100) : 0;
                const isSelected = nationalFilterCountry === cName;
                return (
                  <button
                    key={cName}
                    type="button"
                    onClick={() => {
                      setNationalFilterCountry(isSelected ? "ALL" : cName);
                      setInstitutionPage(1);
                      setNationalStudentPage(1);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 border",
                      isSelected
                        ? "bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs"
                        : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    )}
                  >
                    <span>{cName}</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold",
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200"
                      )}
                    >
                      {cCount.toLocaleString("id-ID")} ({pct}%)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Baris 2: Rekap Sektor */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-blue-600" />
                <span>Sektor Peminatan Utama:</span>
                <span className="font-normal text-[10px] lowercase text-muted-foreground">(klik untuk filter)</span>
              </span>
              {nationalFilterSector !== "ALL" && (
                <button
                  type="button"
                  onClick={() => {
                    setNationalFilterSector("ALL");
                    setInstitutionPage(1);
                    setNationalStudentPage(1);
                  }}
                  className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                >
                  Reset Filter Sektor
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setNationalFilterSector("ALL");
                  setInstitutionPage(1);
                  setNationalStudentPage(1);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5",
                  nationalFilterSector === "ALL"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground border border-border/60"
                )}
              >
                <span>Semua Sektor</span>
                <span className="px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/20 text-[10px] font-mono">
                  {dynamicSectorCounts.total.toLocaleString("id-ID")}
                </span>
              </button>

              {dynamicSectorCounts.items.map(([sName, sCount]) => {
                const pct = dynamicSectorCounts.total > 0 ? Math.round((sCount / dynamicSectorCounts.total) * 100) : 0;
                const isSelected = nationalFilterSector === sName;
                return (
                  <button
                    key={sName}
                    type="button"
                    onClick={() => {
                      setNationalFilterSector(isSelected ? "ALL" : sName);
                      setInstitutionPage(1);
                      setNationalStudentPage(1);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 border",
                      isSelected
                        ? "bg-blue-600 text-white font-bold border-blue-600 shadow-xs"
                        : "bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30"
                    )}
                  >
                    <span>{sName}</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold",
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-blue-500/20 text-blue-800 dark:text-blue-200"
                      )}
                    >
                      {sCount.toLocaleString("id-ID")} ({pct}%)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground">Tampilan:</span>
              <div className="flex items-center p-0.5 rounded-lg bg-muted/60 border border-border">
                <button
                  type="button"
                  onClick={() => setCandidateViewScope("by_institution")}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                    candidateViewScope === "by_institution"
                      ? "bg-white dark:bg-slate-800 text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Per Lembaga Vokasi ({filtered.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCandidateViewScope("all_candidates")}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                    candidateViewScope === "all_candidates"
                      ? "bg-white dark:bg-slate-800 text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Direktori Seluruh Peserta ({filteredNationalStudents.length.toLocaleString("id-ID")})</span>
                </button>
              </div>
            </div>

            {(nationalFilterCountry !== "ALL" || nationalFilterSector !== "ALL") && (
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-medium">
                Filter Aktif: {nationalFilterCountry !== "ALL" ? `Negara ${nationalFilterCountry}` : ""}{" "}
                {nationalFilterSector !== "ALL" ? `• Sektor ${nationalFilterSector}` : ""}
              </span>
            )}
          </div>
        </div>

        {/* TAMPILAN SESUAI MODE */}
        {candidateViewScope === "all_candidates" ? (
          renderNationalAllCandidates(allNationalStudents)
        ) : (
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

            {/* Info Jumlah Vokasi */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>
                  {nationalFilterCountry !== "ALL" || nationalFilterSector !== "ALL"
                    ? `Lembaga Penyuplai Sesuai Filter (${nationalFilterCountry !== "ALL" ? nationalFilterCountry : ""} ${nationalFilterSector !== "ALL" ? nationalFilterSector : ""})`
                    : "Lembaga Vokasi Terdaftar (User Level Admin Lembaga Vokasi)"}
                </span>
              </span>
              <Badge className="bg-emerald-600 text-white font-bold text-xs">
                {filtered.length} Lembaga Vokasi
              </Badge>
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

                    const matchedFilterCount = (institution.students ?? []).filter((s) => {
                      if (nationalFilterCountry !== "ALL" && normalizeStudentCountry(s.targetCountry) !== nationalFilterCountry) {
                        return false;
                      }
                      if (nationalFilterSector !== "ALL" && normalizeStudentSector(s.sector, s.major) !== nationalFilterSector) {
                        return false;
                      }
                      return true;
                    }).length;

                    return (
                      <div
                        key={institution.id}
                        onClick={() => {
                          if (hasStudents) {
                            setSelectedInstitutionForStudents(institution);
                            setStudentSearchQuery("");
                            setStudentPage(1);
                            if (nationalFilterCountry !== "ALL") {
                              setStudentFilterCountry(nationalFilterCountry);
                            }
                            if (nationalFilterSector !== "ALL") {
                              setStudentFilterSector(nationalFilterSector);
                            }
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
                              {(nationalFilterCountry !== "ALL" || nationalFilterSector !== "ALL") && (
                                <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                  {matchedFilterCount} Calon Sesuai Filter
                                </Badge>
                              )}
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
                          ) : institution.hasAdminAccount ? (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Admin Lembaga Terdaftar
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

                        {(() => {
                          const catalogUrls = parseCatalogUrls(institution.procurementCatalogUrls ?? institution.procurementCatalogUrl);
                          if (!catalogUrls.length && !institution.mouDriveUrl && !institution.procurementMethod) return null;

                          return (
                            <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-border/30 text-xs">
                              <span className="text-[11px] font-medium text-muted-foreground">Dokumen & Pengadaan:</span>
                              {catalogUrls.map((cUrl, cIdx) => (
                                <a
                                  key={cIdx}
                                  href={cUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 text-[11px] font-medium border border-blue-500/30 transition-colors"
                                  title={`Buka tautan Inaproc e-Katalog LKPP: ${cUrl}`}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  <span>{catalogUrls.length > 1 ? `Inaproc e-Katalog #${cIdx + 1}` : 'Inaproc e-Katalog'}</span>
                                </a>
                              ))}
                              {institution.mouDriveUrl && (
                                <a
                                  href={institution.mouDriveUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-[11px] font-medium border border-emerald-500/30 transition-colors"
                                  title="Lihat Berkas Dokumen MoU"
                                >
                                  <FileText className="h-3 w-3" />
                                  <span>Berkas MoU</span>
                                </a>
                              )}
                              {institution.procurementMethod && (
                                <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/80">
                                  Metode: {institution.procurementMethod}
                                </Badge>
                              )}
                            </div>
                          );
                        })()}
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
        )}
      </div>
    );
  };

  const renderVokasiInstitutionDirectory = (items: PublicPreviewInstitution[]) => {
    if (selectedInstitutionForStudents) {
      return renderStudentList();
    }

    // Bangun daftar tepat 34 Lembaga Mitra Prioritas Penyuplai & Penyelenggara SMK Go Global
    const canonical34Items: PublicPreviewInstitution[] = PRIORITY_34_CANONICAL.map((c, idx) => {
      const found = items.find((it) => {
        const lowerName = (it.name || "").toLowerCase();
        return (
          lowerName.includes(c.keyword) ||
          (c.keyword.length > 5 && c.name.toLowerCase().includes(lowerName))
        );
      });

      if (found) {
        return {
          ...found,
          type: c.category === "lembaga" ? (found.type || c.type) : (found.type || c.type),
          isPriorityPartner: true,
          evokasiStatus: "Terverifikasi e-Vokasi",
        };
      }

      return {
        id: `INST-PRIORITY-${idx + 1}`,
        name: c.name,
        type: c.type,
        province: c.province,
        district: c.district,
        accreditation: "A",
        evokasiStatus: "Terverifikasi e-Vokasi",
        supportedSectors: ["Kesehatan & Caregiver", "Hospitality", "Manufaktur"],
        supportedOccupations: ["Caregiver", "Hospitality Staff", "Welder"],
        students: [],
        studentCount: 0,
        totalActiveStudents: 120,
        workshopCapacity: 120,
        isPriorityPartner: true,
        registrationSource: "lembaga_vokasi",
        inputLevel: "lembaga_vokasi",
        hasAdminAccount: true,
      };
    });

    // Seluruh lembaga vokasi yang sudah terdaftar resmi dan memiliki akun di sistem
    const allRegisteredItems: PublicPreviewInstitution[] = (() => {
      const merged = [...items];
      canonical34Items.forEach((c) => {
        const alreadyIn = merged.some(
          (m) =>
            m.id === c.id ||
            m.name.toLowerCase().trim() === c.name.toLowerCase().trim()
        );
        if (!alreadyIn) {
          merged.push(c);
        }
      });
      return merged;
    })();

    const lembagaCount = canonical34Items.filter((it) => isLembagaInstitution(it)).length; // 21 Lembaga
    const vokasiCount = canonical34Items.filter((it) => isVokasiInstitution(it)).length;   // 13 Vokasi
    const priorityCount = canonical34Items.length; // 34 Total Prioritas
    const allRegisteredCount = allRegisteredItems.length; // Seluruh lembaga yang terdaftar punya akun

    // Tentukan sumber data berdasarkan filter kategori yang dipilih
    const baseItems =
      institutionCategoryFilter === "ALL"
        ? allRegisteredItems
        : institutionCategoryFilter === "lembaga"
        ? canonical34Items.filter((it) => isLembagaInstitution(it))
        : institutionCategoryFilter === "vokasi"
        ? canonical34Items.filter((it) => isVokasiInstitution(it))
        : canonical34Items; // default "prioritas"

    const q = institutionSearchQuery.toLowerCase().trim();
    const filtered = baseItems.filter((it) => {
      if (!q) return true;
      return (
        it.name.toLowerCase().includes(q) ||
        (it.province && it.province.toLowerCase().includes(q)) ||
        (it.district && it.district.toLowerCase().includes(q)) ||
        (it.type && it.type.toLowerCase().includes(q))
      );
    });

    const pageSize = 15;
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safeCurrentPage = Math.min(institutionPage, totalPages);
    const paginated = filtered.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

    return (
      <div className="space-y-3.5">
        {/* Header Direktori Lembaga Vokasi */}
        <div className="p-3.5 rounded-xl border border-border bg-slate-50/80 dark:bg-slate-900/80 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>Daftar Lembaga Vokasi Suplai</span>
                  <Badge className="bg-emerald-600 text-white font-mono text-[11px] font-bold">
                    {institutionCategoryFilter === "ALL"
                      ? `${allRegisteredCount} Lembaga Terdaftar Akun`
                      : institutionCategoryFilter === "lembaga"
                      ? `${lembagaCount} Lembaga (LPK/LKP)`
                      : institutionCategoryFilter === "vokasi"
                      ? `${vokasiCount} Satuan Vokasi (SMK/Poltek)`
                      : `${priorityCount} Lembaga Terverifikasi`}
                  </Badge>
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Daftar lembaga pelatihan kerja (LPK/LKP) dan satuan pendidikan vokasi (SMK/Politeknik/PT Vokasi)
                </p>
              </div>
            </div>
          </div>

          {/* Filter Kategori: Prioritas (34), Semua Terdaftar (Akun), Lembaga (21), Vokasi (13) */}
          <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground mr-1">Filter Kategori:</span>
              <button
                type="button"
                onClick={() => {
                  setInstitutionCategoryFilter("prioritas");
                  setInstitutionPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  institutionCategoryFilter === "prioritas"
                    ? "bg-emerald-600 text-white shadow-xs font-bold"
                    : "bg-background border border-border text-muted-foreground hover:text-emerald-600"
                }`}
                title="34 Lembaga Vokasi Mitra Prioritas Penyuplai & Penyelenggara"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Terverifikasi ({priorityCount})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setInstitutionCategoryFilter("ALL");
                  setInstitutionPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  institutionCategoryFilter === "ALL"
                    ? "bg-foreground text-background shadow-xs font-bold"
                    : "bg-background border border-border text-muted-foreground hover:text-foreground"
                }`}
                title={`Seluruh ${allRegisteredCount} lembaga vokasi yang sudah terdaftar dan memiliki akun di platform`}
              >
                Semua Terdaftar ({allRegisteredCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setInstitutionCategoryFilter("lembaga");
                  setInstitutionPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  institutionCategoryFilter === "lembaga"
                    ? "bg-blue-600 text-white shadow-xs font-bold"
                    : "bg-background border border-border text-muted-foreground hover:text-blue-600"
                }`}
                title="21 Lembaga Pelatihan Kerja (LPK / LKP)"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Lembaga ({lembagaCount})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setInstitutionCategoryFilter("vokasi");
                  setInstitutionPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  institutionCategoryFilter === "vokasi"
                    ? "bg-indigo-600 text-white shadow-xs font-bold"
                    : "bg-background border border-border text-muted-foreground hover:text-indigo-600"
                }`}
                title="13 Satuan Pendidikan Vokasi (SMK, Politeknik, Perguruan Tinggi)"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Vokasi ({vokasiCount})</span>
              </button>
            </div>

            {institutionCategoryFilter !== "prioritas" && (
              <button
                type="button"
                onClick={() => {
                  setInstitutionCategoryFilter("prioritas");
                  setInstitutionPage(1);
                }}
                className="text-[11px] text-blue-600 hover:underline cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama lembaga vokasi, politeknik, SMK, kabupaten/kota, atau kejuruan..."
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

        {/* Info Filter Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs">
          <span className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>
              {institutionCategoryFilter === "prioritas"
                ? "Daftar Lembaga Vokasi Penyelenggara Terverifikasi"
                : institutionCategoryFilter === "lembaga"
                ? "Daftar Lembaga Pelatihan (LPK / LKP)"
                : institutionCategoryFilter === "vokasi"
                ? "Daftar Satuan Pendidikan Vokasi (Politeknik / Perguruan Tinggi / SMK)"
                : "Semua Lembaga Pelatihan & Pendidikan Vokasi Terdaftar"}
            </span>
          </span>
          <Badge className="bg-blue-600 text-white font-bold text-xs">
            {filtered.length} Lembaga
          </Badge>
        </div>

        {/* Cards list */}
        <div className="rounded-lg border border-border p-2">
          {filtered.length === 0 ? (
            <p className="p-5 text-center text-sm text-muted-foreground">
              Belum ada lembaga yang sesuai dengan kriteria pencarian atau kategori ini.
            </p>
          ) : (
            <div className="space-y-2.5">
              {paginated.map((institution) => {
                const isVerified = institution.evokasiStatus === "Terverifikasi e-Vokasi";
                const studentCount = institution.students?.length ?? institution.studentCount ?? 0;
                const hasStudents = studentCount > 0;

                return (
                  <div
                    key={institution.id}
                    onClick={() => {
                      if (hasStudents) {
                        setSelectedInstitutionForStudents(institution);
                        setStudentSearchQuery("");
                        setStudentPage(1);
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
                          {isPriorityInstitution(institution) && (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Terverifikasi Penyelenggara</span>
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-semibold",
                              isLembagaInstitution(institution)
                                ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                            )}
                          >
                            {isLembagaInstitution(institution) ? "Lembaga (LPK/LKP)" : "Vokasi (PT/Poltek/SMK)"}
                          </Badge>
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
                      ) : institution.hasAdminAccount ? (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Admin Lembaga Terdaftar
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

                    {/* Tautan Dokumen Inaproc e-Katalog dan Berkas MoU */}
                    {(() => {
                      const catalogUrls = parseCatalogUrls(institution.procurementCatalogUrls ?? institution.procurementCatalogUrl);
                      if (!catalogUrls.length && !institution.mouDriveUrl && !institution.procurementMethod) return null;

                      return (
                        <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-border/30 text-xs">
                          <span className="text-[11px] font-medium text-muted-foreground">Dokumen & Pengadaan:</span>
                          {catalogUrls.map((cUrl, cIdx) => (
                            <a
                              key={cIdx}
                              href={cUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 text-[11px] font-medium border border-blue-500/30 transition-colors"
                              title={`Buka tautan Inaproc e-Katalog LKPP: ${cUrl}`}
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>{catalogUrls.length > 1 ? `Inaproc e-Katalog #${cIdx + 1}` : 'Inaproc e-Katalog'}</span>
                            </a>
                          ))}
                          {institution.mouDriveUrl && (
                            <a
                              href={institution.mouDriveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-[11px] font-medium border border-emerald-500/30 transition-colors"
                              title="Lihat Berkas Dokumen MoU"
                            >
                              <FileText className="h-3 w-3" />
                              <span>Berkas MoU</span>
                            </a>
                          )}
                          {institution.procurementMethod && (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/80">
                              Metode: {institution.procurementMethod}
                            </Badge>
                          )}
                        </div>
                      );
                    })()}
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
    switch (activeDrilldownType || type) {
      case "peserta":
        if (selectedInstitutionForStudents) {
          return renderStudentList();
        }
        return (
          <div className="space-y-4">
            {renderInstitutionList(institutions)}
          </div>
        );

      case "lembaga":
      case "sebaran_lembaga":
        return (
          <div className="space-y-4">
            {renderVokasiInstitutionDirectory(institutions)}
          </div>
        );

      case "program": {
        const COUNTRY_PROGRAM_CATALOG: {
          country: string;
          sectors: {
            sectorName: string;
            totalJp: number;
            programTypes: { name: string; jp?: number }[];
          }[];
        }[] = [
          {
            country: "Jepang",
            sectors: [
              {
                sectorName: "Hospitality & Pariwisata",
                totalJp: 860,
                programTypes: [
                  { name: "Pelatihan Teknis — Accommodation & Hotel Service (SSW Hospitality)", jp: 180 },
                  { name: "Pelatihan Bahasa — Bahasa Jepang Perhotelan & Restoran (JLPT/JFT)", jp: 640 },
                  { name: "Sertifikasi Teknis — Uji Kompetensi Food Service & Accommodation", jp: 40 },
                ],
              },
              {
                sectorName: "Kesehatan",
                totalJp: 840,
                programTypes: [
                  { name: "Pelatihan Teknis — Caregiver (Lvl Pelaksana)", jp: 160 },
                  { name: "Pelatihan Bahasa — Bahasa Jepang (JLPT N4 / JFT-Basic)", jp: 640 },
                  { name: "Sertifikasi Teknis — Uji Kompetensi SSW Kaigo & BNSP", jp: 40 },
                ],
              },
              {
                sectorName: "Manufaktur",
                totalJp: 840,
                programTypes: [
                  { name: "Pelatihan Teknis — Operator Produksi & Mesin Presisi", jp: 160 },
                  { name: "Pelatihan Bahasa — Bahasa Jepang Industri", jp: 640 },
                  { name: "Sertifikasi Teknis — SSW Manufaktur & BNSP", jp: 40 },
                ],
              },
              {
                sectorName: "Transportasi",
                totalJp: 860,
                programTypes: [
                  { name: "Pelatihan Teknis — Driver & Pengemudi Angkutan (Truck Driver)", jp: 180 },
                  { name: "Pelatihan Bahasa — Bahasa Jepang Layanan Transportasi", jp: 640 },
                  { name: "Sertifikasi Teknis — Uji SIM Internasional & Sertifikasi K3", jp: 40 },
                ],
              },
              {
                sectorName: "Agriculture (Pertanian)",
                totalJp: 820,
                programTypes: [
                  { name: "Pelatihan Teknis — Farmer / Farming (Pertanian Modern)", jp: 140 },
                  { name: "Pelatihan Bahasa — Bahasa Jepang Pertanian (ASAT)", jp: 640 },
                  { name: "Sertifikasi Teknis — Uji Kompetensi SSW Pertanian & BNSP", jp: 40 },
                ],
              },
            ],
          },
          {
            country: "Korea",
            sectors: [
              {
                sectorName: "Hospitality & Layanan",
                totalJp: 860,
                programTypes: [
                  { name: "Pelatihan Teknis — Hotel Staff & Food Service Attendant", jp: 180 },
                  { name: "Pelatihan Bahasa — Bahasa Korea Perhotelan", jp: 640 },
                  { name: "Sertifikasi Teknis — Sertifikasi Layanan Perhotelan", jp: 40 },
                ],
              },
              {
                sectorName: "Manufaktur",
                totalJp: 840,
                programTypes: [
                  { name: "Pelatihan Teknis — Welder (SMAW/FCAW) & Molding Presisi", jp: 160 },
                  { name: "Pelatihan Bahasa — Bahasa Korea (EPS-TOPIK Manufaktur)", jp: 640 },
                  { name: "Sertifikasi Teknis — Sertifikasi Pengelasan AWS / BNSP", jp: 40 },
                ],
              },
              {
                sectorName: "Fisherman (Perikanan)",
                totalJp: 720,
                programTypes: [
                  { name: "Pelatihan & Sertifikasi Teknis — ABK Perikanan Tangkap", jp: 160 },
                  { name: "Pelatihan Bahasa — Bahasa Korea (EPS-TOPIK Perikanan)", jp: 520 },
                  { name: "Sertifikasi Teknis — BST & Sertifikasi Pelaut Internasional", jp: 40 },
                ],
              },
            ],
          },
          {
            country: "Malaysia",
            sectors: [
              {
                sectorName: "Hospitality",
                totalJp: 720,
                programTypes: [
                  { name: "Pelatihan Teknis — Cleaner & Layanan Perhotelan", jp: 40 },
                  { name: "Pelatihan Bahasa — Bahasa Inggris Perhotelan", jp: 640 },
                  { name: "Sertifikasi Teknis — Sertifikasi Layanan Kebersihan & K3", jp: 40 },
                ],
              },
              {
                sectorName: "Kesehatan",
                totalJp: 940,
                programTypes: [
                  { name: "Pelatihan Teknis — Elderly Caretaker (Perawat Lansia)", jp: 260 },
                  { name: "Pelatihan Bahasa — Komunikasi Bahasa Inggris & Melayu Medis", jp: 640 },
                  { name: "Sertifikasi Teknis — Uji Kompetensi Caregiver Internasional", jp: 40 },
                ],
              },
              {
                sectorName: "Manufaktur",
                totalJp: 780,
                programTypes: [
                  { name: "Pelatihan Teknis — Operation Production (Operator Produksi)", jp: 100 },
                  { name: "Pelatihan Bahasa — Bahasa Inggris Komunikasi Industri", jp: 640 },
                  { name: "Sertifikasi Teknis — Sertifikasi Kompetensi Industri BNSP", jp: 40 },
                ],
              },
              {
                sectorName: "Agriculture (Perkebunan)",
                totalJp: 220,
                programTypes: [
                  { name: "Pelatihan Teknis — Plantation Worker Kelapa Sawit", jp: 140 },
                  { name: "Pelatihan Bahasa — Bahasa Melayu / Orientasi Lapangan", jp: 40 },
                  { name: "Sertifikasi Teknis — K3 & Kompetensi Perkebunan", jp: 40 },
                ],
              },
            ],
          },
          {
            country: "Turki",
            sectors: [
              {
                sectorName: "Hospitality",
                totalJp: 860,
                programTypes: [
                  { name: "Pelatihan Teknis — Housekeeping & Tata Graha", jp: 180 },
                  { name: "Pelatihan Teknis — Waiter / Food & Beverage Service", jp: 180 },
                  { name: "Pelatihan Teknis — Spa Therapist Internasional", jp: 180 },
                  { name: "Pelatihan Teknis — Culinary Cook & Public Area Cleaner", jp: 280 },
                  { name: "Pelatihan Bahasa — Bahasa Inggris Perhotelan & Bahasa Turki Dasar", jp: 640 },
                  { name: "Sertifikasi Teknis — Uji Kompetensi Perhotelan BNSP & CIBTAC", jp: 40 },
                ],
              },
              {
                sectorName: "Layanan & Administrasi",
                totalJp: 720,
                programTypes: [
                  { name: "Pelatihan Teknis — Guest Relation Officer & Tourism Service", jp: 140 },
                  { name: "Pelatihan Bahasa — Bahasa Inggris Pariwisata & Komunikasi Turki", jp: 540 },
                  { name: "Sertifikasi Teknis — Uji Kompetensi Layanan Pelanggan", jp: 40 },
                ],
              },
            ],
          },
        ];

        const activeCountryItem = COUNTRY_PROGRAM_CATALOG.find(
          (item) => item.country === selectedCountry
        );

        const normCountry = activeCountryItem ? normalizeStudentCountry(activeCountryItem.country) : "";
        const countryStudents = activeCountryItem
          ? allNationalStudents.filter((s) => s.normalizedCountry === normCountry)
          : [];

        const sectorsWithCounts = activeCountryItem
          ? activeCountryItem.sectors.map((sec) => {
              const normSec = normalizeStudentSector(sec.sectorName);
              const count = countryStudents.filter((s) => s.normalizedSector === normSec).length;
              return {
                ...sec,
                normSector: normSec,
                count,
              };
            })
          : [];

        return (
          <div className="space-y-4">
            {activeCountryItem ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCountry(null);
                    setProgramViewTab("catalog");
                    setNationalFilterCountry("ALL");
                    setNationalFilterSector("ALL");
                  }}
                  className="-ml-2 w-fit gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Kembali ke 4 Negara</span>
                </Button>

                {/* Header Rekapitulasi Negara */}
                <div className="rounded-xl border border-amber-500/30 bg-slate-50/80 dark:bg-slate-900/80 p-3.5 space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-border/60">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <Globe2 className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <span>Negara Tujuan: {activeCountryItem.country}</span>
                          <Badge className="bg-amber-600 text-white font-mono text-[11px] font-bold">
                            {countryStudents.length.toLocaleString("id-ID")} Calon Peserta
                          </Badge>
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Daftar sektor kejuruan, silabus program pelatihan & direktori suplai calon peserta
                        </p>
                      </div>
                    </div>

                    {/* Tombol Ekspor Excel Cepat untuk Negara Ini */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isExportingExcel || countryStudents.length === 0}
                      onClick={() =>
                        handleExportNationalStudentsExcel(
                          programViewTab === "students" ? filteredNationalStudents : countryStudents
                        )
                      }
                      className="h-8 px-2.5 text-xs gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer font-medium self-start sm:self-auto"
                      title={`Ekspor data calon peserta tujuan ${activeCountryItem.country} ke file Excel (.xlsx)`}
                    >
                      {isExportingExcel ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                      ) : (
                        <Download className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                      <span>
                        Ekspor Excel (
                        {(programViewTab === "students" ? filteredNationalStudents.length : countryStudents.length).toLocaleString("id-ID")}
                        )
                      </span>
                    </Button>
                  </div>

                  {/* Switcher Tab: Program & Sektor vs Direktori Calon Peserta */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-muted-foreground">Tampilan:</span>
                      <div className="flex items-center p-0.5 rounded-lg bg-muted/60 border border-border">
                        <button
                          type="button"
                          onClick={() => setProgramViewTab("catalog")}
                          className={cn(
                            "px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                            programViewTab === "catalog"
                              ? "bg-white dark:bg-slate-800 text-foreground shadow-xs font-bold"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Sektor & Program Pelatihan ({activeCountryItem.sectors.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProgramViewTab("students");
                            setNationalFilterCountry(activeCountryItem.country);
                            setNationalFilterSector("ALL");
                            setNationalStudentPage(1);
                          }}
                          className={cn(
                            "px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                            programViewTab === "students"
                              ? "bg-white dark:bg-slate-800 text-foreground shadow-xs font-bold"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Direktori Calon Peserta ({countryStudents.length.toLocaleString("id-ID")})</span>
                        </button>
                      </div>
                    </div>

                    {programViewTab === "students" && nationalFilterSector !== "ALL" && (
                      <span className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-medium">
                        Filter Sektor: {nationalFilterSector}
                      </span>
                    )}
                  </div>
                </div>

                {/* KONTEN TAMPILAN: KATALOG PROGRAM ATAU DIREKTORI PESERTA */}
                {programViewTab === "catalog" ? (
                  <div className="space-y-3">
                    {sectorsWithCounts.map((sec) => (
                      <div
                        key={sec.sectorName}
                        className="rounded-xl border border-border bg-white dark:bg-slate-900 p-3.5 space-y-3 shadow-2xs hover:border-amber-500/40 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border/40">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              <BriefcaseBusiness className="h-3.5 w-3.5" />
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="text-sm font-bold text-foreground">
                                Sektor {sec.sectorName}
                              </h5>
                              <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-bold">
                                {sec.count.toLocaleString("id-ID")} Calon Peserta
                              </Badge>
                              {typeof sec.totalJp === "number" && (
                                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-mono font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>{sec.totalJp.toLocaleString("id-ID")} JP (Akumulasi Kurikulum)</span>
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Tombol Drill-down Lihat Peserta Sektor Ini (Fitur Gambar 2) */}
                          {sec.count > 0 ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setProgramViewTab("students");
                                setNationalFilterCountry(activeCountryItem.country);
                                setNationalFilterSector(sec.normSector);
                                setNationalStudentPage(1);
                              }}
                              className="h-7 px-2.5 text-xs font-semibold gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer self-start sm:self-auto"
                              title={`Lihat ${sec.count.toLocaleString("id-ID")} calon peserta sektor ${sec.sectorName}`}
                            >
                              <Users className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Lihat {sec.count.toLocaleString("id-ID")} Calon Peserta &rarr;</span>
                            </Button>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">
                              Belum ada pendaftar langsung
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 pl-0 sm:pl-9">
                          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                            <GraduationCap className="h-3.5 w-3.5 text-amber-600" />
                            <span>Standar Kurikulum & Jenis Program Pelatihan:</span>
                          </div>
                          {sec.programTypes.map((prog) => (
                            <div
                              key={prog.name}
                              className="text-xs text-foreground flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-lg bg-muted/40 border border-border/50"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <span className="font-medium truncate">{prog.name}</span>
                              </div>
                              {typeof prog.jp === "number" && (
                                <Badge variant="secondary" className="text-[10px] font-mono shrink-0 font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                  {prog.jp} JP
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* TAB DIREKTORI PESERTA LENGKAP DENGAN FILTER SEKTOR, NO. URUT, CARI, & EKSPOR */
                  <div className="space-y-3">
                    {/* Chip Filter Sektor Khusus Negara Ini */}
                    <div className="p-2.5 rounded-xl border border-border bg-muted/20 space-y-1.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-blue-600" />
                          <span>Filter Sektor Peminatan ({activeCountryItem.country}):</span>
                        </span>
                        {nationalFilterSector !== "ALL" && (
                          <button
                            type="button"
                            onClick={() => {
                              setNationalFilterSector("ALL");
                              setNationalStudentPage(1);
                            }}
                            className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                          >
                            Reset Filter Sektor
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setNationalFilterSector("ALL");
                            setNationalStudentPage(1);
                          }}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5",
                            nationalFilterSector === "ALL"
                              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs"
                              : "bg-muted/50 hover:bg-muted text-muted-foreground border border-border/60"
                          )}
                        >
                          <span>Semua Sektor</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/20 text-[10px] font-mono">
                            {countryStudents.length.toLocaleString("id-ID")}
                          </span>
                        </button>

                        {sectorsWithCounts.map((sec) => {
                          const isSelected = nationalFilterSector === sec.normSector;
                          const pct = countryStudents.length > 0 ? Math.round((sec.count / countryStudents.length) * 100) : 0;
                          return (
                            <button
                              key={sec.sectorName}
                              type="button"
                              onClick={() => {
                                setNationalFilterSector(isSelected ? "ALL" : sec.normSector);
                                setNationalStudentPage(1);
                              }}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 border",
                                isSelected
                                  ? "bg-blue-600 text-white font-bold border-blue-600 shadow-xs"
                                  : "bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30"
                              )}
                            >
                              <span>{sec.sectorName}</span>
                              <span
                                className={cn(
                                  "px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold",
                                  isSelected
                                    ? "bg-white/20 text-white"
                                    : "bg-blue-500/20 text-blue-800 dark:text-blue-200"
                                )}
                              >
                                {sec.count.toLocaleString("id-ID")} ({pct}%)
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Render Rich Candidates Directory */}
                    {renderNationalAllCandidates(countryStudents)}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs text-muted-foreground">
                  Pilih salah satu dari 4 negara tujuan untuk melihat keterangan sektor, program pelatihan, dan direktori calon peserta:
                </p>
                {COUNTRY_PROGRAM_CATALOG.map((item) => {
                  const itemCountryNorm = normalizeStudentCountry(item.country);
                  const nationalByCountry = data.national?.candidatesByCountry;
                  const itemStudentCount =
                    (nationalByCountry && typeof nationalByCountry[itemCountryNorm as keyof typeof nationalByCountry] === "number")
                      ? nationalByCountry[itemCountryNorm as keyof typeof nationalByCountry]
                      : allNationalStudents.filter((s) => s.normalizedCountry === itemCountryNorm).length;

                  return (
                    <button
                      key={item.country}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(item.country);
                        setProgramViewTab("catalog");
                        setNationalFilterCountry(item.country);
                        setNationalFilterSector("ALL");
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-white dark:bg-slate-900 p-3.5 text-left hover:border-amber-500/60 hover:bg-muted/40 transition cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          <Globe2 className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                            <span>{item.country}</span>
                            <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                              {itemStudentCount.toLocaleString("id-ID")} Calon
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Sektor: {item.sectors.map((s) => s.sectorName).join(" · ")}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </button>
                  );
                })}
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
        const DEMAND_COUNTRY_MATRIX = [
          {
            country: "Turki",
            quota: 5000,
            supplyCount: nationalSummary.countries.find(([c]) => c === "Turki")?.[1] ?? 716,
            keySectors: "Hospitality & Pariwisata",
            occupations: "Housekeeping, Waiter, Barista, Spa Therapist, Cook",
            sampleEmployers: ["Rixos Hospitality & Resort Group Turkey", "Titanic Hotels Antalya", "Maxx Royal Resorts"],
            statusNote: "Kebutuhan prioritas hotel & resor wisata Mediterania. Program pelatihan bahasa Turki dasar & standar pelayanan internasional dibuka.",
          },
          {
            country: "Malaysia",
            quota: 5000,
            supplyCount: nationalSummary.countries.find(([c]) => c === "Malaysia")?.[1] ?? 66,
            keySectors: "Hospitality, Caretaker & Manufaktur",
            occupations: "Elderly Caretaker, F&B Service, Operator Manufaktur Elektronik, Perkebunan",
            sampleEmployers: ["Shangri-La International Resort Penang", "Genting Berhad", "Sime Darby Plantation"],
            statusNote: "Kebutuhan pekerja terampil formal untuk jaringan perhotelan internasional, perawat lansia, dan manufaktur bersertifikat.",
          },
          {
            country: "Jepang",
            quota: 2000,
            supplyCount: nationalSummary.countries.find(([c]) => c === "Jepang")?.[1] ?? 3384,
            keySectors: "Kesehatan (Caregiver Kaigo) & Manufaktur",
            occupations: "Caregiver Kaigo, Welder SMAW/FCAW, Operator CNC, Driver Angkutan, Pertanian Modern",
            sampleEmployers: ["Hitachi Zosen Heavy Industries", "Aoi Kai Medical Group", "Zenkoku Caregiver Consortium"],
            statusNote: "Suplai calon peserta melimpah (169% target). Prioritas akselerasi pelatihan bahasa Jepang (JFT-Basic / N4) dan sertifikasi SSW.",
          },
          {
            country: "Korea",
            quota: 600,
            supplyCount: nationalSummary.countries.find(([c]) => c === "Korea")?.[1] ?? 75,
            keySectors: "Manufaktur & Perikanan Tangkap",
            occupations: "Welder Galangan Kapal (Visa E-7), Molding Presisi, ABK Penangkapan Ikan (Visa E-9)",
            sampleEmployers: ["Hyundai Mobis Parts Manufacturing", "Daewoo Shipbuilding & Marine", "Busan Fishery Federation"],
            statusNote: "Program G-to-G dan visa E-7 spesialis teknis pengelasan berstandar AWS serta ABK kapal penangkap ikan laut dalam.",
          },
        ];

        const activeMatrix = DEMAND_COUNTRY_MATRIX.filter((item) => {
          if (demandFilterCountry !== "ALL" && item.country !== demandFilterCountry) {
            return false;
          }
          if (demandFilterSector !== "ALL") {
            const secLower = demandFilterSector.toLowerCase();
            if (!item.keySectors.toLowerCase().includes(secLower) && !item.occupations.toLowerCase().includes(secLower)) {
              return false;
            }
          }
          return true;
        });

        return (
          <div className="space-y-4">
            {/* Header & Filter Card */}
            <div className="p-3.5 rounded-xl border border-border bg-slate-50/80 dark:bg-slate-900/80 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                    <Globe2 className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <span>Permintaan Pekerja Luar Negeri (Demand 4 Negara)</span>
                      <Badge className="bg-purple-600 text-white font-mono text-[11px] font-bold">
                        12.600 Total Kuota
                      </Badge>
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Analisis gap kuota permintaan mitra internasional terhadap suplai calon peserta siap latih nasional
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
                  <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 font-medium">
                    ✓ SISKOP2MI BP2MI
                  </Badge>
                </div>
              </div>

              {/* Filter Negara */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Globe2 className="w-3 h-3 text-purple-600" />
                    <span>Filter Negara Mitra:</span>
                  </span>
                  {demandFilterCountry !== "ALL" && (
                    <button
                      type="button"
                      onClick={() => setDemandFilterCountry("ALL")}
                      className="text-[10px] text-purple-600 hover:underline cursor-pointer"
                    >
                      Reset Negara
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDemandFilterCountry("ALL")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5",
                      demandFilterCountry === "ALL"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs"
                        : "bg-muted/50 hover:bg-muted text-muted-foreground border border-border/60"
                    )}
                  >
                    <span>Semua Negara (4)</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/20 text-[10px] font-mono">
                      12.600 Kuota
                    </span>
                  </button>

                  {DEMAND_COUNTRY_MATRIX.map((item) => {
                    const isSelected = demandFilterCountry === item.country;
                    return (
                      <button
                        key={item.country}
                        type="button"
                        onClick={() => setDemandFilterCountry(isSelected ? "ALL" : item.country)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 border",
                          isSelected
                            ? "bg-purple-600 text-white font-bold border-purple-600 shadow-xs"
                            : "bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30"
                        )}
                      >
                        <span>{item.country}</span>
                        <span
                          className={cn(
                            "px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold",
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-purple-500/20 text-purple-800 dark:text-purple-200"
                          )}
                        >
                          {item.quota.toLocaleString("id-ID")} Kuota
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter Sektor */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-blue-600" />
                    <span>Filter Sektor Pekerjaan:</span>
                  </span>
                  {demandFilterSector !== "ALL" && (
                    <button
                      type="button"
                      onClick={() => setDemandFilterSector("ALL")}
                      className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                    >
                      Reset Sektor
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["ALL", "Hospitality", "Kesehatan", "Manufaktur", "Perikanan"].map((sec) => {
                    const label = sec === "ALL" ? "Semua Sektor" : sec;
                    const isSelected = demandFilterSector === sec;
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setDemandFilterSector(isSelected ? "ALL" : sec)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1",
                          isSelected
                            ? "bg-blue-600 text-white font-bold shadow-xs"
                            : "bg-muted/50 hover:bg-muted text-muted-foreground border border-border/60"
                        )}
                      >
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Matriks Analisis Demand vs Ketersediaan Suplai */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5 text-purple-600" />
                  <span>Matriks Kebutuhan Kuota vs Suplai Calon Peserta</span>
                </h5>
                <span className="text-[11px] text-muted-foreground">
                  Menampilkan {activeMatrix.length} negara
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeMatrix.map((item) => {
                  const pct = Math.min(200, Math.round((item.supplyCount / item.quota) * 100));
                  const isSurplus = item.supplyCount >= item.quota;
                  const gap = item.quota - item.supplyCount;

                  return (
                    <div
                      key={item.country}
                      className="rounded-xl border border-border bg-white dark:bg-slate-900 p-3.5 space-y-3 shadow-xs hover:border-purple-500/40 transition-colors"
                    >
                      {/* Top Bar Negara & Rasio */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20">
                            <Globe2 className="h-4 w-4" />
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-foreground leading-tight">
                              {item.country}
                            </h4>
                            <span className="text-[11px] text-muted-foreground">
                              {item.keySectors}
                            </span>
                          </div>
                        </div>

                        <Badge
                          variant={isSurplus ? "default" : "secondary"}
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5",
                            isSurplus
                              ? "bg-emerald-600 text-white"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                          )}
                        >
                          {isSurplus ? "Surplus Suplai (169%)" : `Kebutuhan Gap ${gap.toLocaleString("id-ID")} Slot`}
                        </Badge>
                      </div>

                      {/* Angka Perbandingan: Kuota vs Suplai */}
                      <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-muted/30 border border-border/40 text-xs text-center">
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-medium uppercase">
                            Kuota Permintaan
                          </span>
                          <span className="text-sm font-extrabold text-foreground font-mono">
                            {item.quota.toLocaleString("id-ID")} Slot
                          </span>
                        </div>
                        <div className="border-l border-border/60">
                          <span className="text-[10px] text-muted-foreground block font-medium uppercase">
                            Suplai Terdaftar
                          </span>
                          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                            {item.supplyCount.toLocaleString("id-ID")} Calon
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Realisasi Suplai vs Kuota</span>
                          <span className="font-bold text-foreground font-mono">{pct}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              isSurplus ? "bg-emerald-600" : "bg-purple-600"
                            )}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>

                      {/* Jabatan & Pemberi Kerja */}
                      <div className="space-y-1 text-xs pt-1 border-t border-border/40">
                        <div className="text-[11px] text-foreground">
                          <span className="text-muted-foreground font-medium">Jabatan Utama: </span>
                          <span>{item.occupations}</span>
                        </div>
                        <p className="text-[10.5px] text-muted-foreground leading-relaxed">
                          {item.statusNote}
                        </p>
                      </div>

                      {/* Action Drilldown to Students */}
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setActiveDrilldownType("peserta");
                          setNationalFilterCountry(item.country);
                          setCandidateViewScope("all_candidates");
                          setNationalStudentPage(1);
                        }}
                        className="w-full text-xs font-semibold gap-1.5 cursor-pointer bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Lihat {item.supplyCount.toLocaleString("id-ID")} Calon Siap {item.country} &rarr;</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
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
    const currentType = activeDrilldownType || type;
    switch (currentType) {
      case "peserta":
        return candidateViewScope === "all_candidates"
          ? "Siap Latih — Direktori Calon Peserta Nasional"
          : "Siap Latih — Lembaga Vokasi Penyuplai Peserta";
      case "program":
        return selectedCountry
          ? programViewTab === "students"
            ? `Siap Program — Direktori Calon Peserta (${selectedCountry})`
            : `Siap Program — Negara ${selectedCountry}`
          : "Siap Program — 4 Negara Tujuan";
      case "lembaga":
      case "sebaran_lembaga":
        return "Siap Vokasi — Daftar Lembaga Vokasi Suplai";
      case "national_lpk":
        return "Sebaran Lembaga Terdaftar Nasional";
      case "demand":
        return "Siap Permintaan — Permintaan Tenaga Kerja Luar Negeri";
      case "alokasi":
        return "Status Alokasi Penempatan";
      default:
        return "Detail Informasi";
    }
  };

  return (
    <>
      <Dialog open={Boolean(type)} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="flex w-[calc(100%-2rem)] max-w-4xl max-h-[calc(100dvh-2rem)] flex-col gap-4 overflow-hidden p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-foreground">
              {getTitle()}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {(activeDrilldownType || type) === "demand"
                ? "Analisis gap kuota permintaan mitra internasional (Turki, Malaysia, Jepang, Korea) terhadap suplai calon peserta siap latih nasional."
                : (activeDrilldownType || type) === "lembaga" || (activeDrilldownType || type) === "sebaran_lembaga"
                ? "Daftar lembaga vokasi mitra penyuplai peserta dan penyelenggara pelatihan SMK Go Global."
                : (activeDrilldownType || type) === "peserta"
                ? `Daftar calon peserta siap latih (realisasi ${(data.national?.candidatesCount ?? allNationalStudents.length).toLocaleString("id-ID")} dari target 12.600 peserta) per negara target & kejuruan.`
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
