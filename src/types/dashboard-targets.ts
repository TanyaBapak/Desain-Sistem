export const DASHBOARD_TARGETS = [
  { key: "registeredJobSeekers", label: "Pencari kerja terdaftar" },
  { key: "readyForPlacement", label: "Siap penempatan" },
  { key: "activeTrainingPrograms", label: "Program pelatihan aktif" },
  { key: "activeVocationalInstitutions", label: "Lembaga vokasi aktif" },
  { key: "nationalRegisteredLpk", label: "LPK terdaftar nasional" },
  { key: "validatedDemands", label: "Permintaan tervalidasi" },
] as const;

export type DashboardTargetKey = typeof DASHBOARD_TARGETS[number]["key"];
export type DashboardTargets = Record<DashboardTargetKey, number | null>;
