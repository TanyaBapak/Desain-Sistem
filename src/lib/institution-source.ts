export type InstitutionRegistrationSource = "siskop2mi" | "disnaker" | "umum";

export interface SourceMeta {
  key: InstitutionRegistrationSource;
  label: string;
  shortLabel: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  desc: string;
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
  },
  disnaker: {
    key: "disnaker",
    label: "Disnaker",
    shortLabel: "Disnaker",
    badgeBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    badgeBorder: "border-indigo-500/30",
    badgeText: "text-indigo-700 dark:text-indigo-400",
    desc: "Input / rekomendasi Disnaker Daerah",
  },
  umum: {
    key: "umum",
    label: "Umum / Lembaga Vokasi",
    shortLabel: "Umum / Mandiri",
    badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    badgeBorder: "border-emerald-500/30",
    badgeText: "text-emerald-700 dark:text-emerald-400",
    desc: "Pendaftaran mandiri Lembaga Vokasi / SMK",
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
