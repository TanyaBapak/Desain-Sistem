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
  "Hospitality",
  "Kesehatan",
  "Manufaktur",
  "Konstruksi",
  "Fisherman",
];

export const COUNTRIES = [
  "Turki",
  "Jepang",
  "Malaysia",
  "Korea",
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

function scaleLeafMetrics(node: TreeNode, factor: number) {
  if (node.m) {
    node.m.a = Math.max(1, Math.round(node.m.a * factor));
    node.m.b = Math.round(node.m.b * factor);
    node.m.c = Math.round(node.m.c * factor);
    node.m.d = Math.round(node.m.d * factor);
  }
  if ("ch" in node && node.ch) {
    node.ch.forEach((c) => scaleLeafMetrics(c, factor));
  }
}

function buildTrees(): Record<PillarKey, PillarConfig> {
  // Reset seed for deterministic tree generation
  seed = 11;

  const rawP: Record<PillarKey, { t: string; lv: string[]; k: [keyof MetricSpec, string][]; tree: () => TreeNode[] }> = {
    sup: {
      t: "Supply (Calon Peserta)",
      lv: ["Provinsi", "Latar belakang", "Kompetensi"],
      k: [
        ["a", "Calon Peserta"],
        ["b", "Lolos Seleksi"],
        ["c", "Lulus Bahasa"],
        ["d", "Siap Penempatan"],
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
      t: "Pelatihan (Program)",
      lv: ["Provinsi", "Sektor", "Kelas"],
      k: [
        ["a", "Jumlah Kelas"],
        ["b", "Kelas Berjalan"],
        ["c", "Kelas Selesai"],
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
        ["a", "Jumlah Vokasi"],
        ["b", "Terakreditasi"],
        ["c", "Kapasitas Latih"],
        ["d", "Tersalurkan"],
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
      t: "Demand (Permintaan)",
      lv: ["Negara", "Sektor", "Pemberi kerja"],
      k: [
        ["a", "Kuota Permintaan"],
        ["b", "Terisi"],
        ["c", "Sisa Kuota"],
        ["d", "Tahap Seleksi"],
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

  // Calibrate each pillar to match hero header figures:
  // Supply: 12.600 peserta target
  // Pelatihan: 630 kelas
  // Vokasi: 2.382 lembaga vokasi
  // Demand: 1.850 kuota permintaan di 4 negara mitra
  const targets: Record<PillarKey, number> = {
    sup: 12600,
    pel: 630,
    lpk: 2382,
    dem: 1850,
  };

  const result: Partial<Record<PillarKey, PillarConfig>> = {};
  (Object.keys(rawP) as PillarKey[]).forEach((key) => {
    const item = rawP[key];
    const rawRoot = agg({ name: item.t, ch: item.tree() }) as InternalNode & { m: MetricSpec };
    const factor = targets[key] / (rawRoot.m.a || 1);
    scaleLeafMetrics(rawRoot, factor);
    const root = agg(rawRoot) as InternalNode & { m: MetricSpec };
    root.m.a = targets[key];

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

  const demandMap = sumBySector(PILLARS_DATA.dem, "a");
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
