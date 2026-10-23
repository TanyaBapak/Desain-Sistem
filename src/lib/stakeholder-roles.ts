export const STAKEHOLDER_ROLES = [
  {
    id: "pimpinan",
    name: "Menteri / Wamen",
    responsibility:
      "Monitoring capaian dan keputusan strategis",
    scope: "Nasional (38 Provinsi)",
    group: "Kebijakan Strategis",
    color: "bg-blue-500",
  },
  {
    id: "taskforce",
    name: "Ditjen P3KLN / Task Force",
    responsibility:
      "Pengendalian target, analisis kebutuhan, dan koordinasi",
    scope: "Nasional Terpadu",
    group: "Koordinasi Program",
    color: "bg-indigo-500",
  },
  {
    id: "direktorat",
    name: "Direktorat PKV PMI",
    responsibility:
      "Pemetaan lembaga, kesiapan program dan kapasitas vokasi",
    scope: "Nasional / Bidang Vokasi",
    group: "Pembinaan Vokasi",
    color: "bg-violet-500",
  },
  {
    id: "direktorat-terkait",
    name: "Direktorat Terkait",
    responsibility:
      "Validasi demand, koordinasi kerja sama dan penempatan sesuai kewenangan",
    scope: "Bidang Tertentu",
    group: "Koordinasi Kerja Sama",
    color: "bg-emerald-500",
  },
  {
    id: "pusdatin",
    name: "Pusdatin",
    responsibility:
      "Arsitektur, integrasi, keamanan dan kualitas data",
    scope: "Nasional",
    group: "Tata Kelola Data",
    color: "bg-slate-500",
  },
  {
    id: "bp3mi",
    name: "BP3MI",
    responsibility:
      "Validasi wilayah, verifikasi dan koordinasi pelaksanaan",
    scope: "Wilayah BP3MI",
    group: "Pelindungan PMI",
    color: "bg-cyan-500",
  },
  {
    id: "disnaker",
    name: "Disnaker Prov/Kab/Kota",
    responsibility:
      "Input serta pemutakhiran data pencari kerja",
    scope: "Provinsi / Kabupaten / Kota",
    group: "Tenaga Kerja Daerah",
    color: "bg-amber-500",
  },
  {
    id: "vokasi",
    name: "Lembaga Vokasi (LPK)",
    responsibility:
      "Input kapasitas, program, peserta dan progres pelatihan",
    scope: "Lembaga / Institusi Vokasi",
    group: "Penyelenggara Pelatihan",
    color: "bg-rose-500",
  },
] as const;

export type StakeholderRoleId = (typeof STAKEHOLDER_ROLES)[number]["id"];

export function getStakeholderRole(id: string) {
  return STAKEHOLDER_ROLES.find((r) => r.id === id);
}
