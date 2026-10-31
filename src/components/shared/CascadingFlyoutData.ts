// Tree and data definitions for SMK Go Global Cascading Flyout Explorer

export interface MetricSpec {
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface LeafNode {
  name: string;
  m: MetricSpec;
  info: [string, string][];
  leaf: true;
}

export interface InternalNode {
  name: string;
  ch: TreeNode[];
  m?: MetricSpec;
  leaf?: false;
}

export type TreeNode = LeafNode | InternalNode;

export interface PillarConfig {
  t: string;
  lv: string[];
  k: [keyof MetricSpec, string][];
  root: InternalNode & { m: MetricSpec };
}

export type PillarKey = "sup" | "pel" | "lpk" | "dem";

// Deterministic Pseudo-Random Generator
let seed = 11;
const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
const ri = (a: number, b: number) => Math.floor(a + rnd() * (b - a + 1));
const pick = <T,>(arr: T[]): T => arr[ri(0, arr.length - 1)];

export const PROVINCES = [
  "Jawa Barat",
  "Jawa Tengah",
  "Jawa Timur",
  "DI Yogyakarta",
  "Banten",
  "Lampung",
  "NTB",
  "Sumatera Utara",
];

export const SECTORS = [
  "Caregiver",
  "Perawat",
  "Manufaktur",
  "Welder",
  "Hospitality",
  "Agrikultur",
  "Konstruksi",
  "Transportasi",
];

export const COUNTRIES = [
  "Jepang",
  "Jerman",
  "Korea Selatan",
  "Turki",
  "Arab Saudi",
  "Taiwan",
];

export const formatNum = (n: number) => Math.round(n).toLocaleString("id-ID");

function agg(n: TreeNode): TreeNode {
  if ("ch" in n && n.ch && n.ch.length > 0) {
    n.ch.forEach(agg);
    const m: MetricSpec = { a: 0, b: 0, c: 0, d: 0 };
    const firstChildM = n.ch[0].m ?? { a: 0, b: 0, c: 0, d: 0 };
    (Object.keys(firstChildM) as (keyof MetricSpec)[]).forEach((k) => {
      m[k] = n.ch.reduce((s, c) => s + (c.m ? c.m[k] : 0), 0);
    });
    n.m = m;
  }
  return n;
}

const lf = (name: string, m: MetricSpec, info: [string, string][]): LeafNode => ({
  name,
  m,
  info,
  leaf: true,
});

const sub = <T, R>(a: T[], fn: (item: T) => R): R[] =>
  a.filter(() => rnd() > 0.25).map(fn);

function buildTrees(): Record<PillarKey, PillarConfig> {
  // Reset seed for deterministic tree generation
  seed = 11;

  const rawP: Record<PillarKey, { t: string; lv: string[]; k: [keyof MetricSpec, string][]; tree: () => TreeNode[] }> = {
    sup: {
      t: "Supply",
      lv: ["Provinsi", "Latar belakang", "Kompetensi"],
      k: [
        ["a", "Terdaftar"],
        ["b", "Lolos"],
        ["c", "Lulus bahasa"],
        ["d", "Siap berangkat"],
      ],
      tree: () =>
        PROVINCES.map((p) => ({
          name: p,
          ch: ["SMK", "D3", "S1/S2", "Umum"].map((b) => ({
            name: b,
            ch: sub(SECTORS, (s) => {
              const a = ri(30, 90);
              const bb = a * (0.6 + rnd() * 0.3);
              const c = bb * (0.6 + rnd() * 0.3);
              const d = c * (0.5 + rnd() * 0.4);
              return lf(s, { a, b: bb, c, d }, [
                ["Provinsi", p],
                ["Latar belakang", b],
              ]);
            }),
          })),
        })),
    },
    pel: {
      t: "Pelatihan",
      lv: ["Provinsi", "Sektor", "Kelas"],
      k: [
        ["a", "Peserta"],
        ["b", "Berjalan"],
        ["c", "Selesai"],
        ["d", "Tersertifikasi"],
      ],
      tree: () =>
        PROVINCES.map((p) => ({
          name: p,
          ch: sub(SECTORS, (s) => ({
            name: s,
            ch: Array.from({ length: ri(1, 3) }, (_, i) => {
              const a = ri(20, 40);
              const c = a * (0.7 + rnd() * 0.3);
              const b = a - c;
              const d = c * (0.6 + rnd() * 0.35);
              return lf(s + " Kelas " + "ABC"[i], { a, b, c, d }, [
                ["Provinsi", p],
                ["Sektor", s],
                ["Mode", pick(["Boarding", "Non-boarding"])],
              ]);
            }),
          })),
        })),
    },
    lpk: {
      t: "LPK & Vokasi",
      lv: ["Jenis lembaga", "Provinsi", "Lembaga"],
      k: [
        ["a", "Kapasitas"],
        ["b", "Terisi"],
        ["c", "Lulus"],
        ["d", "Ditempatkan"],
      ],
      tree: () =>
        ["LPK", "SMK", "BLK / Polivokasi"].map((j) => ({
          name: j,
          ch: sub(PROVINCES, (p) => ({
            name: p,
            ch: Array.from({ length: ri(1, 3) }, (_, i) => {
              const a = ri(60, 200);
              const b = a * (0.5 + rnd() * 0.45);
              const c = b * (0.7 + rnd() * 0.25);
              const d = c * (0.3 + rnd() * 0.5);
              return lf(
                `${j === "SMK" ? "SMKN" : j === "LPK" ? "LPK" : "BLK"} ${pick(["Maju", "Karya", "Nusantara", "Mandiri", "Bangsa"])} ${i + 1}`,
                { a, b, c, d },
                [
                  ["Jenis", j],
                  ["Provinsi", p],
                  ["Akreditasi", pick(["A", "A", "B", "C"])],
                  ["Bidang utama", pick(SECTORS)],
                ]
              );
            }),
          })),
        })),
    },
    dem: {
      t: "Demand",
      lv: ["Negara", "Sektor", "Pemberi kerja"],
      k: [
        ["a", "Kuota"],
        ["b", "Terisi"],
        ["c", "Sisa kuota"],
        ["d", "Interview"],
      ],
      tree: () =>
        COUNTRIES.map((g) => ({
          name: g,
          ch: sub(SECTORS, (s) => ({
            name: s,
            ch: Array.from({ length: ri(1, 3) }, () => {
              const a = ri(20, 120);
              const b = a * (0.1 + rnd() * 0.5);
              const d = (a - b) * rnd() * 0.6;
              return lf(
                `${pick(["Sakura", "Nord", "Hanil", "Anadolu", "Gulf", "Formosa"])} ${pick(["Care", "Works", "Group", "Corp"])}`,
                { a, b, c: a - b, d },
                [
                  ["Negara", g],
                  ["Sektor", s],
                  ["Kontrak", pick(["2 tahun", "3 tahun", "5 tahun"])],
                ]
              );
            }),
          })),
        })),
    },
  };

  const result: Partial<Record<PillarKey, PillarConfig>> = {};
  (Object.keys(rawP) as PillarKey[]).forEach((key) => {
    const item = rawP[key];
    const root = agg({ name: item.t, ch: item.tree() }) as InternalNode & { m: MetricSpec };
    result[key] = {
      t: item.t,
      lv: item.lv,
      k: item.k,
      root,
    };
  });

  return result as Record<PillarKey, PillarConfig>;
}

export const PILLARS_DATA = buildTrees();

export interface SectorGapRow {
  sector: string;
  demand: number;
  certified: number;
  gap: number;
}

export function calculateSectorGaps(): SectorGapRow[] {
  const sumBySector = (p: PillarConfig, key: keyof MetricSpec) => {
    const obj: Record<string, number> = {};
    p.root.ch.forEach((c) => {
      if ("ch" in c && c.ch) {
        c.ch.forEach((s) => {
          if (s.m) {
            obj[s.name] = (obj[s.name] || 0) + s.m[key];
          }
        });
      }
    });
    return obj;
  };

  const demandMap = sumBySector(PILLARS_DATA.dem, "c");
  const certifiedMap = sumBySector(PILLARS_DATA.pel, "d");

  return SECTORS.map((s) => {
    const d = demandMap[s] || 0;
    const c = certifiedMap[s] || 0;
    return {
      sector: s,
      demand: Math.round(d),
      certified: Math.round(c),
      gap: Math.round(d - c),
    };
  }).sort((a, b) => b.gap - a.gap);
}
