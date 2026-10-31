export type InstitutionRegistrationSource = "siskop2mi" | "disnaker" | "umum";

export type InstitutionInputLevel =
  | "kabupaten_kota"
  | "provinsi"
  | "lembaga_vokasi"
  | "nasional";

export interface LevelMeta {
  key: InstitutionInputLevel;
  label: string;
  shortLabel: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  desc: string;
}

export const INSTITUTION_LEVELS: Record<InstitutionInputLevel, LevelMeta> = {
  kabupaten_kota: {
    key: "kabupaten_kota",
    label: "Disnaker Kabupaten / Kota",
    shortLabel: "Kab/Kota",
    badgeBg: "bg-amber-500/10 dark:bg-amber-500/20",
    badgeBorder: "border-amber-500/30",
    badgeText: "text-amber-700 dark:text-amber-400",
    desc: "Tingkat Disnaker Kabupaten / Kota",
  },
  provinsi: {
    key: "provinsi",
    label: "Disnaker Provinsi",
    shortLabel: "Provinsi",
    badgeBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    badgeBorder: "border-indigo-500/30",
    badgeText: "text-indigo-700 dark:text-indigo-400",
    desc: "Tingkat Disnaker Provinsi",
  },
  lembaga_vokasi: {
    key: "lembaga_vokasi",
    label: "Lembaga Vokasi",
    shortLabel: "Lembaga Vokasi",
    badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    badgeBorder: "border-emerald-500/30",
    badgeText: "text-emerald-700 dark:text-emerald-400",
    desc: "Satuan Pendidikan / Lembaga Vokasi Mandiri (SMK / LPK / Politeknik)",
  },
  nasional: {
    key: "nasional",
    label: "Nasional",
    shortLabel: "Nasional",
    badgeBg: "bg-blue-500/10 dark:bg-blue-500/20",
    badgeBorder: "border-blue-500/30",
    badgeText: "text-blue-700 dark:text-blue-400",
    desc: "Sistem Pusat SISKOP2MI / BP2MI",
  },
};

export interface SourceMeta {
  key: InstitutionRegistrationSource;
  label: string;
  shortLabel: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  desc: string;
  defaultLevel: InstitutionInputLevel;
  availableLevels: InstitutionInputLevel[];
}

export const INSTITUTION_SOURCES: Record<InstitutionRegistrationSource, SourceMeta> = {
  siskop2mi: {
    key: "siskop2mi",
    label: "SISKOP2MI",
    shortLabel: "SISKOP2MI",
    badgeBg: "bg-blue-500/10 dark:bg-blue-500/20",
    badgeBorder: "border-blue-500/30",
    badgeText: "text-blue-700 dark:text-blue-400",
    desc: "Integrasi sistem penempatan BP2MI / SISKOP2MI",
    defaultLevel: "nasional",
    availableLevels: ["nasional"],
  },
  disnaker: {
    key: "disnaker",
    label: "Disnaker",
    shortLabel: "Disnaker",
    badgeBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    badgeBorder: "border-indigo-500/30",
    badgeText: "text-indigo-700 dark:text-indigo-400",
    desc: "Input / rekomendasi Disnaker Daerah",
    defaultLevel: "kabupaten_kota",
    availableLevels: ["kabupaten_kota", "provinsi"],
  },
  umum: {
    key: "umum",
    label: "Umum / Lembaga Vokasi",
    shortLabel: "Umum / Mandiri",
    badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    badgeBorder: "border-emerald-500/30",
    badgeText: "text-emerald-700 dark:text-emerald-400",
    desc: "Pendaftaran mandiri Lembaga Vokasi / SMK",
    defaultLevel: "lembaga_vokasi",
    availableLevels: ["lembaga_vokasi"],
  },
};

export function resolveInstitutionSource(inst: {
  id?: string;
  source?: string;
  registrationSource?: string;
}): InstitutionRegistrationSource {
  if (
    inst.registrationSource === "siskop2mi" ||
    inst.registrationSource === "disnaker" ||
    inst.registrationSource === "umum"
  ) {
    return inst.registrationSource;
  }
  // Deterministic fallback based on ID hash
  const idStr = inst.id || "KP2MI-001";
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  const mod = Math.abs(hash) % 3;
  if (mod === 0) return "siskop2mi";
  if (mod === 1) return "disnaker";
  return "umum";
}

export function resolveInstitutionInputLevel(inst: {
  id?: string;
  source?: string;
  registrationSource?: string;
  inputLevel?: string;
}): InstitutionInputLevel {
  if (
    inst.inputLevel === "kabupaten_kota" ||
    inst.inputLevel === "provinsi" ||
    inst.inputLevel === "lembaga_vokasi" ||
    inst.inputLevel === "nasional"
  ) {
    return inst.inputLevel;
  }
  const source = resolveInstitutionSource(inst);
  if (source === "umum") return "lembaga_vokasi";
  if (source === "siskop2mi") return "nasional";

  // Disnaker: assign between kabupaten_kota and provinsi deterministically
  const idStr = inst.id || "KP2MI-001";
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 3 === 0 ? "provinsi" : "kabupaten_kota";
}
