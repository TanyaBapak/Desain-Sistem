import { CandidateParticipant } from "@/types";
import {
  INDONUSA_D3_CANDIDATES,
  VICTORIA_LPK_CANDIDATES,
} from "@/data/realSupplyCandidates";
import { mockSupply } from "@/data/mockSupply";

// Tree and data definitions for SMK Go Global Cascading Flyout Explorer
// Data diselaraskan langsung dengan database riil Kementerian & Task Force SMK Go Global

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
  participants?: CandidateParticipant[];
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

export const PROVINCES = [
  "Jawa Barat",
  "Jawa Tengah",
  "Jawa Timur",
  "DKI Jakarta",
  "Bali",
  "Banten",
  "Sumatera Utara",
  "DI Yogyakarta",
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
  "Korea Selatan",
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

const lf = (
  name: string,
  m: MetricSpec,
  info: [string, string][],
  participants?: CandidateParticipant[]
): LeafNode => ({
  name,
  m,
  info,
  leaf: true,
  participants,
});

/* =========================================================================
   1. SUPPLY (Data Nyata Calon Peserta Terdaftar - Tanpa Data Dummy)
   Urutan hirarki navigasi bertingkat:
   Provinsi > Kabupaten / Kota > Lembaga Vokasi / LPK > Kompetensi > Daftar Peserta
   ========================================================================= */
const supplyTree = (): TreeNode[] => [
  {
    name: "Jawa Tengah",
    ch: [
      {
        name: "Kota Surakarta",
        ch: [
          {
            name: "Politeknik Indonusa Surakarta",
            ch: [
              lf(
                "Teknik Mesin & Manufaktur Presisi (CNC & Welder)",
                { a: 27, b: 27, c: 24, d: 22 },
                [
                  ["Provinsi", "Jawa Tengah"],
                  ["Kabupaten / Kota", "Kota Surakarta"],
                  ["Lembaga", "Politeknik Indonusa Surakarta"],
                  ["Jenjang", "D3 Vokasi"],
                  ["Sertifikasi", "BNSP Pengelasan 3G SMAW / Operator CNC"],
                ],
                INDONUSA_D3_CANDIDATES.filter((c) => c.major.includes("Teknik Mesin"))
              ),
              lf(
                "Food & Beverage Service & Barista (Waiter)",
                { a: 25, b: 25, c: 25, d: 23 },
                [
                  ["Provinsi", "Jawa Tengah"],
                  ["Kabupaten / Kota", "Kota Surakarta"],
                  ["Lembaga", "Politeknik Indonusa Surakarta"],
                  ["Jenjang", "D3 Vokasi"],
                  ["Sertifikasi", "BNSP Waiter / Waitress Level 3"],
                ],
                INDONUSA_D3_CANDIDATES.filter((c) => c.major.includes("Food & Beverage Service"))
              ),
              lf(
                "Housekeeping & Perhotelan Kapal Pesiar",
                { a: 26, b: 26, c: 24, d: 22 },
                [
                  ["Provinsi", "Jawa Tengah"],
                  ["Kabupaten / Kota", "Kota Surakarta"],
                  ["Lembaga", "Politeknik Indonusa Surakarta"],
                  ["Jenjang", "D3 Vokasi"],
                  ["Sertifikasi", "BNSP Housekeeping Attendant Level 3"],
                ],
                INDONUSA_D3_CANDIDATES.filter((c) => c.major.includes("Accommodation Management"))
              ),
              lf(
                "Komunikasi Bahasa Asing Terapan",
                { a: 25, b: 25, c: 25, d: 24 },
                [
                  ["Provinsi", "Jawa Tengah"],
                  ["Kabupaten / Kota", "Kota Surakarta"],
                  ["Lembaga", "Politeknik Indonusa Surakarta"],
                  ["Jenjang", "D3 Vokasi"],
                  ["Sertifikasi", "BNSP Bahasa Inggris Komunikasi Profesi"],
                ],
                INDONUSA_D3_CANDIDATES.filter((c) => c.major.includes("Bahasa"))
              ),
              lf(
                "Teknik Otomotif & Alat Berat",
                { a: 15, b: 15, c: 13, d: 12 },
                [
                  ["Provinsi", "Jawa Tengah"],
                  ["Kabupaten / Kota", "Kota Surakarta"],
                  ["Lembaga", "Politeknik Indonusa Surakarta"],
                  ["Jenjang", "D3 Vokasi"],
                  ["Sertifikasi", "BNSP Teknisi Alat Berat Level 4"],
                ],
                INDONUSA_D3_CANDIDATES.filter((c) => c.major.includes("Otomotif"))
              ),
              lf(
                "Kuliner & Tata Boga Internasional",
                { a: 15, b: 15, c: 14, d: 13 },
                [
                  ["Provinsi", "Jawa Tengah"],
                  ["Kabupaten / Kota", "Kota Surakarta"],
                  ["Lembaga", "Politeknik Indonusa Surakarta"],
                  ["Jenjang", "D3 Vokasi"],
                  ["Sertifikasi", "BNSP Commis Chef Level 3"],
                ],
                INDONUSA_D3_CANDIDATES.filter((c) => c.major.includes("Kuliner"))
              ),
              lf(
                "Caregiver Lansia & Rekam Medis Standar Jepang",
                { a: 4, b: 4, c: 4, d: 4 },
                [
                  ["Provinsi", "Jawa Tengah"],
                  ["Kabupaten / Kota", "Kota Surakarta"],
                  ["Lembaga", "Politeknik Indonusa Surakarta"],
                  ["Jenjang", "D3 Vokasi"],
                  ["Sertifikasi", "Kaigo Care Worker Standar MHLW Jepang"],
                ],
                INDONUSA_D3_CANDIDATES.filter((c) => c.major.includes("Rekam Medis"))
              ),
              lf(
                "Manajemen Informatika & IT Perhotelan",
                { a: 6, b: 6, c: 6, d: 5 },
                [
                  ["Provinsi", "Jawa Tengah"],
                  ["Kabupaten / Kota", "Kota Surakarta"],
                  ["Lembaga", "Politeknik Indonusa Surakarta"],
                  ["Jenjang", "D3 Vokasi"],
                  ["Sertifikasi", "BNSP Network Administrator"],
                ],
                INDONUSA_D3_CANDIDATES.filter((c) => c.major.includes("Manajemen Informatika"))
              ),
              lf(
                "Bisnis, Akuntansi & Guest Relations",
                { a: 4, b: 4, c: 4, d: 4 },
                [
                  ["Provinsi", "Jawa Tengah"],
                  ["Kabupaten / Kota", "Kota Surakarta"],
                  ["Lembaga", "Politeknik Indonusa Surakarta"],
                  ["Jenjang", "D3 Vokasi"],
                  ["Sertifikasi", "BNSP Teknisi Akuntansi Yunior"],
                ],
                INDONUSA_D3_CANDIDATES.filter((c) => c.major.includes("Akuntansi"))
              ),
            ],
          },
          {
            name: "LPK Victoria Hotel School",
            ch: [
              lf(
                "Housekeeping Attendant & Cruise Ship",
                { a: 1, b: 1, c: 1, d: 1 },
                [
                  ["Provinsi", "Jawa Tengah"],
                  ["Kabupaten / Kota", "Kota Surakarta"],
                  ["Lembaga", "LPK Victoria Hotel School"],
                  ["Jenjang", "Lembaga Pelatihan Kerja (LPK)"],
                  ["Sertifikasi", "BNSP Level 3 - Housekeeping Attendant"],
                ],
                VICTORIA_LPK_CANDIDATES.filter((c) => c.id === "VIC-001")
              ),
              lf(
                "Food & Beverage Service & Waiter",
                { a: 1, b: 1, c: 1, d: 1 },
                [
                  ["Provinsi", "Jawa Tengah"],
                  ["Kabupaten / Kota", "Kota Surakarta"],
                  ["Lembaga", "LPK Victoria Hotel School"],
                  ["Jenjang", "Lembaga Pelatihan Kerja (LPK)"],
                  ["Sertifikasi", "BNSP Waiter / Waitress"],
                ],
                VICTORIA_LPK_CANDIDATES.filter((c) => c.id === "VIC-002")
              ),
              lf(
                "Culinary Arts & Commis Chef",
                { a: 1, b: 1, c: 1, d: 1 },
                [
                  ["Provinsi", "Jawa Tengah"],
                  ["Kabupaten / Kota", "Kota Surakarta"],
                  ["Lembaga", "LPK Victoria Hotel School"],
                  ["Jenjang", "Lembaga Pelatihan Kerja (LPK)"],
                  ["Sertifikasi", "BNSP Commis Chef"],
                ],
                VICTORIA_LPK_CANDIDATES.filter((c) => c.id === "VIC-003")
              ),
            ],
          },
        ],
      },
      {
        name: "Kota Semarang",
        ch: [
          {
            name: "SMK Negeri 7 Semarang",
            ch: [
              lf(
                "Elektronika & Instrumentasi Industri",
                { a: 1, b: 1, c: 1, d: 1 },
                [
                  ["Provinsi", "Jawa Tengah"],
                  ["Kabupaten / Kota", "Kota Semarang"],
                  ["Lembaga", "SMK Negeri 7 Semarang"],
                  ["Jenjang", "SMK Kejuruan"],
                  ["Sertifikasi", "BNSP Teknisi Elektronika Industri"],
                ],
                mockSupply.filter((c) => c.id === "CAND-2026-006")
              ),
              lf(
                "Mekatronika & Robotika Pabrikasi",
                { a: 18, b: 16, c: 15, d: 14 },
                [
                  ["Provinsi", "Jawa Tengah"],
                  ["Kabupaten / Kota", "Kota Semarang"],
                  ["Lembaga", "SMK Negeri 7 Semarang"],
                  ["Jenjang", "SMK Kejuruan"],
                  ["Sertifikasi", "BNSP PLC Programming & Otomasi"],
                ]
              ),
            ],
          },
          {
            name: "BBPVP Semarang",
            ch: [
              lf(
                "Teknologi Informasi & Desain Grafis Komunikasi",
                { a: 22, b: 20, c: 18, d: 17 },
                [
                  ["Provinsi", "Jawa Tengah"],
                  ["Kabupaten / Kota", "Kota Semarang"],
                  ["Lembaga", "BBPVP Semarang"],
                  ["Jenjang", "Balai Pelatihan Vokasi"],
                  ["Sertifikasi", "BNSP Junior Graphic Designer"],
                ]
              ),
            ],
          },
        ],
      },
      {
        name: "Kabupaten Banyumas",
        ch: [
          {
            name: "SMK Kesehatan Bakti Husada Purwokerto",
            ch: [
              lf(
                "Perawat Lansia & Caregiver (Kaigo)",
                { a: 1, b: 1, c: 1, d: 1 },
                [
                  ["Provinsi", "Jawa Tengah"],
                  ["Kabupaten / Kota", "Kabupaten Banyumas"],
                  ["Lembaga", "SMK Kesehatan Bakti Husada Purwokerto"],
                  ["Jenjang", "SMK Kejuruan"],
                  ["Sertifikasi", "SSW Tokutei Ginou Kaigo / BNSP Asnakes"],
                ],
                mockSupply.filter((c) => c.id === "CAND-2026-002")
              ),
            ],
          },
          {
            name: "LPK GLOBAL PURWOKERTO",
            ch: [
              lf(
                "Caregiver Kaigo & Pelatihan Bahasa Jepang",
                { a: 16, b: 14, c: 13, d: 12 },
                [
                  ["Provinsi", "Jawa Tengah"],
                  ["Kabupaten / Kota", "Kabupaten Banyumas"],
                  ["Lembaga", "LPK GLOBAL PURWOKERTO"],
                  ["Jenjang", "Lembaga Pelatihan Kerja (LPK)"],
                  ["Sertifikasi", "JLPT N4 & SSW Kaigo"],
                ]
              ),
            ],
          },
        ],
      },
      {
        name: "Kabupaten Kendal",
        ch: [
          {
            name: "SMK Muhammadiyah 04 Sukorejo Kendal",
            ch: [
              lf(
                "Teknik Pengelasan & Fabrikasi Logam (Welder 3G)",
                { a: 24, b: 20, c: 18, d: 16 },
                [
                  ["Provinsi", "Jawa Tengah"],
                  ["Kabupaten / Kota", "Kabupaten Kendal"],
                  ["Lembaga", "SMK Muhammadiyah 04 Sukorejo Kendal"],
                  ["Jenjang", "SMK Kejuruan"],
                  ["Sertifikasi", "BNSP Pengelasan GMAW / SMAW"],
                ]
              ),
            ],
          },
          {
            name: "BLK-LN PRIMA DUTA SEJATI KENDAL",
            ch: [
              lf(
                "Pelatihan Tenaga Kerja Luar Negeri Mandiri",
                { a: 30, b: 26, c: 24, d: 22 },
                [
                  ["Provinsi", "Jawa Tengah"],
                  ["Kabupaten / Kota", "Kabupaten Kendal"],
                  ["Lembaga", "BLK-LN PRIMA DUTA SEJATI KENDAL"],
                  ["Jenjang", "BLK-LN Terakreditasi"],
                  ["Sertifikasi", "BNSP Manufaktur & Bahasa Asing"],
                ]
              ),
            ],
          },
        ],
      },
      {
        name: "Kabupaten Pati",
        ch: [
          {
            name: "SMK Tunas Harapan Pati",
            ch: [
              lf(
                "Teknik Permesinan & Operator CNC Industri",
                { a: 28, b: 25, c: 22, d: 20 },
                [
                  ["Provinsi", "Jawa Tengah"],
                  ["Kabupaten / Kota", "Kabupaten Pati"],
                  ["Lembaga", "SMK Tunas Harapan Pati"],
                  ["Jenjang", "SMK Kejuruan"],
                  ["Sertifikasi", "BNSP Operator CNC Milling & Turning"],
                ]
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Jawa Barat",
    ch: [
      {
        name: "Kabupaten Bogor",
        ch: [
          {
            name: "SMKN 1 Cibinong",
            ch: [
              lf(
                "Teknik Pengelasan & Fabrikasi",
                { a: 1, b: 1, c: 1, d: 1 },
                [
                  ["Provinsi", "Jawa Barat"],
                  ["Kabupaten / Kota", "Kabupaten Bogor"],
                  ["Lembaga", "SMKN 1 Cibinong"],
                  ["Jenjang", "SMK Kejuruan"],
                  ["Sertifikasi", "BNSP Welder 3G Plate (SMAW/GMAW)"],
                ],
                mockSupply.filter((c) => c.id === "CAND-2026-001")
              ),
            ],
          },
        ],
      },
      {
        name: "Kota Bekasi",
        ch: [
          {
            name: "SMKN 2 Kota Bekasi",
            ch: [
              lf(
                "Tata Boga & Kuliner",
                { a: 1, b: 1, c: 1, d: 1 },
                [
                  ["Provinsi", "Jawa Barat"],
                  ["Kabupaten / Kota", "Kota Bekasi"],
                  ["Lembaga", "SMKN 2 Kota Bekasi"],
                  ["Jenjang", "SMK Kejuruan"],
                  ["Sertifikasi", "BNSP Commis Pastry & Bakery"],
                ],
                mockSupply.filter((c) => c.id === "CAND-2026-004")
              ),
            ],
          },
        ],
      },
      {
        name: "Kabupaten Bekasi",
        ch: [
          {
            name: "SMKN 1 Cikarang Barat",
            ch: [
              lf(
                "Operator Mesin Presisi & Molding Logam",
                { a: 32, b: 28, c: 25, d: 22 },
                [
                  ["Provinsi", "Jawa Barat"],
                  ["Kabupaten / Kota", "Kabupaten Bekasi"],
                  ["Lembaga", "SMKN 1 Cikarang Barat"],
                  ["Jenjang", "SMK Pusat Keunggulan"],
                  ["Sertifikasi", "JIS B 6331 / SKKNI Manufaktur Presisi"],
                ]
              ),
            ],
          },
          {
            name: "LPK DAEHWA",
            ch: [
              lf(
                "Bahasa Korea & Manufaktur Industri",
                { a: 20, b: 18, c: 16, d: 15 },
                [
                  ["Provinsi", "Jawa Barat"],
                  ["Kabupaten / Kota", "Kabupaten Bekasi"],
                  ["Lembaga", "LPK DAEHWA"],
                  ["Jenjang", "Lembaga Pelatihan Kerja (LPK)"],
                  ["Sertifikasi", "EPS-TOPIK & Sertifikat Las Logam"],
                ]
              ),
            ],
          },
        ],
      },
      {
        name: "Kabupaten Bandung",
        ch: [
          {
            name: "Budi Luhur Migrant Center",
            ch: [
              lf(
                "Caregiver Lansia & Teknologi Informasi",
                { a: 25, b: 22, c: 20, d: 19 },
                [
                  ["Provinsi", "Jawa Barat"],
                  ["Kabupaten / Kota", "Kabupaten Bandung"],
                  ["Lembaga", "Budi Luhur Migrant Center"],
                  ["Jenjang", "Perguruan Tinggi / Politeknik"],
                  ["Sertifikasi", "Kaigo Care Worker & Asisten Perawat"],
                ]
              ),
            ],
          },
        ],
      },
      {
        name: "Kabupaten Cirebon",
        ch: [
          {
            name: "SMKN 1 Mundu Cirebon",
            ch: [
              lf(
                "Nautika Kapal Penangkap Ikan (Fisherman)",
                { a: 1, b: 1, c: 1, d: 1 },
                [
                  ["Provinsi", "Jawa Barat"],
                  ["Kabupaten / Kota", "Kabupaten Cirebon"],
                  ["Lembaga", "SMKN 1 Mundu Cirebon"],
                  ["Jenjang", "SMK Kejuruan"],
                  ["Sertifikasi", "BST-Fisheries Kemhub & ANKAPIN III"],
                ],
                mockSupply.filter((c) => c.id === "CAND-2026-009")
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Jawa Timur",
    ch: [
      {
        name: "Kota Surabaya",
        ch: [
          {
            name: "Politeknik Elektronika Negeri Surabaya (PENS)",
            ch: [
              lf(
                "Mekatronika & Otomasi Industri",
                { a: 1, b: 1, c: 1, d: 1 },
                [
                  ["Provinsi", "Jawa Timur"],
                  ["Kabupaten / Kota", "Kota Surabaya"],
                  ["Lembaga", "Politeknik Elektronika Negeri Surabaya (PENS)"],
                  ["Jenjang", "D3 / Politeknik"],
                  ["Sertifikasi", "BNSP Otomasi Industri & PLC"],
                ],
                mockSupply.filter((c) => c.id === "CAND-2026-003")
              ),
            ],
          },
          {
            name: "SMKN 1 Surabaya",
            ch: [
              lf(
                "Akomodasi Perhotelan & Front Office",
                { a: 24, b: 22, c: 20, d: 18 },
                [
                  ["Provinsi", "Jawa Timur"],
                  ["Kabupaten / Kota", "Kota Surabaya"],
                  ["Lembaga", "SMKN 1 Surabaya"],
                  ["Jenjang", "SMK Kejuruan"],
                  ["Sertifikasi", "BNSP Front Office Attendant"],
                ]
              ),
            ],
          },
        ],
      },
      {
        name: "Kota Malang",
        ch: [
          {
            name: "SMKN 4 Malang",
            ch: [
              lf(
                "Tata Graha & Desain Akomodasi Perhotelan",
                { a: 20, b: 18, c: 16, d: 15 },
                [
                  ["Provinsi", "Jawa Timur"],
                  ["Kabupaten / Kota", "Kota Malang"],
                  ["Lembaga", "SMKN 4 Malang"],
                  ["Jenjang", "SMK Kejuruan"],
                  ["Sertifikasi", "BNSP Room Attendant Level 3"],
                ]
              ),
            ],
          },
        ],
      },
      {
        name: "Kabupaten Banyuwangi",
        ch: [
          {
            name: "SMKN 1 Banyuwangi",
            ch: [
              lf(
                "Penangkapan Ikan Laut Lepas (Fisherman)",
                { a: 18, b: 16, c: 14, d: 13 },
                [
                  ["Provinsi", "Jawa Timur"],
                  ["Kabupaten / Kota", "Kabupaten Banyuwangi"],
                  ["Lembaga", "SMKN 1 Banyuwangi"],
                  ["Jenjang", "SMK Kejuruan"],
                  ["Sertifikasi", "BST Kemhub & Basic Safety Training"],
                ]
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    name: "DKI Jakarta",
    ch: [
      {
        name: "Jakarta Timur",
        ch: [
          {
            name: "LPK MUGEN (MULTI GENERASI INDONESIA)",
            ch: [
              lf(
                "Caregiver SSW & Bahasa Jepang Kaigo",
                { a: 28, b: 25, c: 24, d: 22 },
                [
                  ["Provinsi", "DKI Jakarta"],
                  ["Kabupaten / Kota", "Jakarta Timur"],
                  ["Lembaga", "LPK MUGEN (MULTI GENERASI INDONESIA)"],
                  ["Jenjang", "Lembaga Pelatihan Kerja (LPK)"],
                  ["Sertifikasi", "SSW Kaigo Japan & JLPT N4"],
                ]
              ),
            ],
          },
          {
            name: "SMK Negeri 26 Jakarta",
            ch: [
              lf(
                "Teknik Kendaraan Ringan & Otomotif",
                { a: 1, b: 1, c: 1, d: 1 },
                [
                  ["Provinsi", "DKI Jakarta"],
                  ["Kabupaten / Kota", "Jakarta Timur"],
                  ["Lembaga", "SMK Negeri 26 Jakarta"],
                  ["Jenjang", "SMK Kejuruan"],
                  ["Sertifikasi", "BNSP Tune-up EFI & Engine Overhaul"],
                ],
                mockSupply.filter((c) => c.id === "CAND-2026-005")
              ),
            ],
          },
        ],
      },
      {
        name: "Jakarta Pusat",
        ch: [
          {
            name: "Grand Pertiwi International",
            ch: [
              lf(
                "Hospitality & Room Attendant Hotel Bintang",
                { a: 22, b: 20, c: 18, d: 16 },
                [
                  ["Provinsi", "DKI Jakarta"],
                  ["Kabupaten / Kota", "Jakarta Pusat"],
                  ["Lembaga", "Grand Pertiwi International"],
                  ["Jenjang", "Lembaga Pelatihan Kerja (LPK)"],
                  ["Sertifikasi", "BNSP Housekeeping Attendant"],
                ]
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Bali",
    ch: [
      {
        name: "Kota Denpasar",
        ch: [
          {
            name: "BATC (Bali Aviation & Tourism Center)",
            ch: [
              lf(
                "Spa Therapist & International Hospitality",
                { a: 1, b: 1, c: 1, d: 1 },
                [
                  ["Provinsi", "Bali"],
                  ["Kabupaten / Kota", "Kota Denpasar"],
                  ["Lembaga", "BATC (Bali Aviation & Tourism Center)"],
                  ["Jenjang", "Lembaga Pelatihan Kerja (LPK)"],
                  ["Sertifikasi", "CIBTAC International Beauty & Spa Therapist"],
                ],
                mockSupply.filter((c) => c.id === "CAND-2026-007")
              ),
            ],
          },
          {
            name: "SMKN 3 Denpasar",
            ch: [
              lf(
                "Culinary Arts & Continental Food Production",
                { a: 24, b: 22, c: 20, d: 18 },
                [
                  ["Provinsi", "Bali"],
                  ["Kabupaten / Kota", "Kota Denpasar"],
                  ["Lembaga", "SMKN 3 Denpasar"],
                  ["Jenjang", "SMK Kejuruan"],
                  ["Sertifikasi", "BNSP Commis Western Cuisine"],
                ]
              ),
            ],
          },
        ],
      },
      {
        name: "Kabupaten Badung",
        ch: [
          {
            name: "LPK Duta Hospitality Resort",
            ch: [
              lf(
                "Resort Butler & Public Area Attendant",
                { a: 20, b: 18, c: 16, d: 15 },
                [
                  ["Provinsi", "Bali"],
                  ["Kabupaten / Kota", "Kabupaten Badung"],
                  ["Lembaga", "LPK Duta Hospitality Resort"],
                  ["Jenjang", "Lembaga Pelatihan Kerja (LPK)"],
                  ["Sertifikasi", "International Resort Butler Service"],
                ]
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Banten",
    ch: [
      {
        name: "Kabupaten Serang",
        ch: [
          {
            name: "SMKN 1 Cikande",
            ch: [
              lf(
                "Teknik Alat Berat & Mesin Industri",
                { a: 22, b: 19, c: 17, d: 15 },
                [
                  ["Provinsi", "Banten"],
                  ["Kabupaten / Kota", "Kabupaten Serang"],
                  ["Lembaga", "SMKN 1 Cikande"],
                  ["Jenjang", "SMK Kejuruan"],
                  ["Sertifikasi", "BNSP Pemeliharaan Alat Berat Industri"],
                ]
              ),
            ],
          },
        ],
      },
      {
        name: "Kota Tangerang",
        ch: [
          {
            name: "SMKN 4 Tangerang",
            ch: [
              lf(
                "Teknik Pengelasan Logam Presisi (Welder 3G/6G)",
                { a: 25, b: 22, c: 20, d: 18 },
                [
                  ["Provinsi", "Banten"],
                  ["Kabupaten / Kota", "Kota Tangerang"],
                  ["Lembaga", "SMKN 4 Tangerang"],
                  ["Jenjang", "SMK Kejuruan"],
                  ["Sertifikasi", "BNSP Pengelasan GTAW/GMAW Plate & Pipe"],
                ]
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Sumatera Utara",
    ch: [
      {
        name: "Kota Medan",
        ch: [
          {
            name: "SMKN 1 Medan",
            ch: [
              lf(
                "Agribisnis Tanaman & Perkebunan Modern",
                { a: 26, b: 23, c: 21, d: 19 },
                [
                  ["Provinsi", "Sumatera Utara"],
                  ["Kabupaten / Kota", "Kota Medan"],
                  ["Lembaga", "SMKN 1 Medan"],
                  ["Jenjang", "SMK Kejuruan"],
                  ["Sertifikasi", "BNSP Agronomi & Pemeliharaan Sawit"],
                ]
              ),
            ],
          },
          {
            name: "LPK Mandiri Medan",
            ch: [
              lf(
                "Asisten Keperawatan & Caretaker Lansia",
                { a: 20, b: 18, c: 16, d: 15 },
                [
                  ["Provinsi", "Sumatera Utara"],
                  ["Kabupaten / Kota", "Kota Medan"],
                  ["Lembaga", "LPK Mandiri Medan"],
                  ["Jenjang", "Lembaga Pelatihan Kerja (LPK)"],
                  ["Sertifikasi", "Asisten Keperawatan Lansia & Bahasa"],
                ]
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    name: "DI Yogyakarta",
    ch: [
      {
        name: "Kota Yogyakarta",
        ch: [
          {
            name: "SMKN 2 Yogyakarta",
            ch: [
              lf(
                "Teknik Fabrikasi Logam & Mesin Presisi",
                { a: 25, b: 22, c: 20, d: 18 },
                [
                  ["Provinsi", "DI Yogyakarta"],
                  ["Kabupaten / Kota", "Kota Yogyakarta"],
                  ["Lembaga", "SMKN 2 Yogyakarta"],
                  ["Jenjang", "SMK Kejuruan"],
                  ["Sertifikasi", "BNSP Pemesinan Bubut & Milling"],
                ]
              ),
            ],
          },
          {
            name: "LPK Yogyakarta Hospitality Center",
            ch: [
              lf(
                "Food & Beverage Service & Tata Graha Hotel",
                { a: 22, b: 20, c: 18, d: 16 },
                [
                  ["Provinsi", "DI Yogyakarta"],
                  ["Kabupaten / Kota", "Kota Yogyakarta"],
                  ["Lembaga", "LPK Yogyakarta Hospitality Center"],
                  ["Jenjang", "Lembaga Pelatihan Kerja (LPK)"],
                  ["Sertifikasi", "BNSP Waiter & Room Attendant"],
                ]
              ),
            ],
          },
        ],
      },
    ],
  },
];

/* =========================================================================
   2. PROGRAM PELATIHAN / SIAP PROGRAM
   Disusun sesuai alur: Per Negara > Per Sektor > Program Bahasa · Teknis · Sertifikasi
   ========================================================================= */
const trainingTree = (): TreeNode[] => [
  {
    name: "Turki",
    ch: [
      {
        name: "Hospitality & Pariwisata",
        ch: [
          lf("Program Bahasa · Bahasa Turki Dasar & English Hospitality", { a: 40, b: 18, c: 160, d: 420 }, [
            ["Negara Tujuan", "Turki"],
            ["Sektor", "Hospitality"],
            ["Rumpun Kurikulum", "Program Bahasa"],
            ["Kurikulum", "Bahasa Turki Percakapan Sehari-hari & English for Hotel Service"],
            ["Durasi Jam Pelajaran", "160 JP"],
            ["Standar Kelulusan", "Level A2 Turki & English Test 80+"],
          ]),
          lf("Teknis · Housekeeping & Tata Graha Resort Internasional", { a: 45, b: 20, c: 260, d: 480 }, [
            ["Negara Tujuan", "Turki"],
            ["Sektor", "Hospitality"],
            ["Rumpun Kurikulum", "Teknis"],
            ["Materi Praktek", "Room Attendant, Public Area Cleaning, Laundry & Chemical Safety"],
            ["Durasi Jam Pelajaran", "260 JP"],
            ["Standar Industri", "Standard Resort Bintang 5 Antalya & Bodrum"],
          ]),
          lf("Teknis · Food & Beverage Service (Waiter / Waitress)", { a: 35, b: 15, c: 240, d: 360 }, [
            ["Negara Tujuan", "Turki"],
            ["Sektor", "Hospitality"],
            ["Rumpun Kurikulum", "Teknis"],
            ["Materi Praktek", "Table Set-up, Banquet Service, Barista & POS System"],
            ["Durasi Jam Pelajaran", "240 JP"],
            ["Standar Industri", "Fine Dining & Resort F&B Service"],
          ]),
          lf("Teknis · Spa Therapist & Balinese Wellness", { a: 30, b: 12, c: 320, d: 310 }, [
            ["Negara Tujuan", "Turki"],
            ["Sektor", "Hospitality"],
            ["Rumpun Kurikulum", "Teknis"],
            ["Materi Praktek", "Anatomi Fisiologi, Balinese Massage, Reflexology & Hydrotherapy"],
            ["Durasi Jam Pelajaran", "320 JP"],
            ["Standar Industri", "Resort Wellness Center & CIBTAC"],
          ]),
          lf("Sertifikasi · Uji Kompetensi CIBTAC & SKKNI Perhotelan", { a: 42, b: 18, c: 80, d: 450 }, [
            ["Negara Tujuan", "Turki"],
            ["Sektor", "Hospitality"],
            ["Rumpun Kurikulum", "Sertifikasi"],
            ["Skema Sertifikasi", "CIBTAC International & BNSP Level III Perhotelan"],
            ["Durasi Jam Pelajaran", "80 JP"],
            ["Lembaga Sertifikasi", "LSP Pariwisata & CIBTAC UK"],
          ]),
        ],
      },
    ],
  },
  {
    name: "Jepang",
    ch: [
      {
        name: "Kesehatan / Caregiver",
        ch: [
          lf("Program Bahasa · Bahasa Jepang N4 & Istilah Kaigo", { a: 55, b: 25, c: 200, d: 560 }, [
            ["Negara Tujuan", "Jepang"],
            ["Sektor", "Kesehatan"],
            ["Rumpun Kurikulum", "Program Bahasa"],
            ["Materi Kurikulum", "Tata Bahasa N4, Huruf Kanji Kaigo, Percakapan Lansia"],
            ["Durasi Jam Pelajaran", "200 JP"],
            ["Standar Kelulusan", "JLPT Level N4 / JFT-Basic A2"],
          ]),
          lf("Teknis · Praktik Asuhan Caregiver & Pemindahan Pasien", { a: 50, b: 22, c: 320, d: 520 }, [
            ["Negara Tujuan", "Jepang"],
            ["Sektor", "Kesehatan"],
            ["Rumpun Kurikulum", "Teknis"],
            ["Materi Praktek", "Bed-Making, Transfer Pasien, Nutrisi Lansia, K3 Panti Wreda"],
            ["Durasi Jam Pelajaran", "320 JP"],
            ["Standar Industri", "Standar Kaigo Fukushishi Jepang"],
          ]),
          lf("Sertifikasi · Uji SSW Kaigo (Tokutei Ginou) & BNSP", { a: 48, b: 20, c: 80, d: 510 }, [
            ["Negara Tujuan", "Jepang"],
            ["Sektor", "Kesehatan"],
            ["Rumpun Kurikulum", "Sertifikasi"],
            ["Skema Sertifikasi", "Nursing Care Skills Evaluation Test (SSW) & Kaigo Japanese Test"],
            ["Durasi Jam Pelajaran", "80 JP"],
            ["Lembaga Uji", "Prometric Japan & LSP Kesehatan Indonesia"],
          ]),
        ],
      },
      {
        name: "Manufaktur & Pengelasan",
        ch: [
          lf("Program Bahasa · Bahasa Jepang Industri & K3 Manufaktur", { a: 40, b: 18, c: 160, d: 430 }, [
            ["Negara Tujuan", "Jepang"],
            ["Sektor", "Manufaktur"],
            ["Rumpun Kurikulum", "Program Bahasa"],
            ["Materi Kurikulum", "Kosakata Bengkel 5S (Seiri, Seiton, Seiso, Seiketsu, Shitsuke)"],
            ["Durasi Jam Pelajaran", "160 JP"],
            ["Standar Kelulusan", "JLPT N4 / JFT-Basic & Komunikasi Kerja"],
          ]),
          lf("Teknis · Pemrograman Mesin CNC Bubut & Milling Presisi", { a: 35, b: 15, c: 280, d: 380 }, [
            ["Negara Tujuan", "Jepang"],
            ["Sektor", "Manufaktur"],
            ["Rumpun Kurikulum", "Teknis"],
            ["Materi Praktek", "G-Code / M-Code, Tooling Setup, Pengukuran Mikrometer Presisi"],
            ["Durasi Jam Pelajaran", "280 JP"],
            ["Standar Industri", "JIS B 6331 CNC Machining Center"],
          ]),
          lf("Teknis · Pengelasan Logam Presisi Welder SMAW/GMAW", { a: 32, b: 14, c: 260, d: 340 }, [
            ["Negara Tujuan", "Jepang"],
            ["Sektor", "Manufaktur"],
            ["Rumpun Kurikulum", "Teknis"],
            ["Materi Praktek", "Pengelasan Pelat Baja Presisi, Uji NDT Visual & Bending"],
            ["Durasi Jam Pelajaran", "260 JP"],
            ["Standar Industri", "JIS Z 3801 Japanese Welding Standard"],
          ]),
          lf("Sertifikasi · Uji SSW Manufaktur & Sertifikasi JIS Z 3801", { a: 38, b: 16, c: 80, d: 400 }, [
            ["Negara Tujuan", "Jepang"],
            ["Sektor", "Manufaktur"],
            ["Rumpun Kurikulum", "Sertifikasi"],
            ["Skema Sertifikasi", "Machine Processing SSW & JWES Japanese Welding Certification"],
            ["Durasi Jam Pelajaran", "80 JP"],
            ["Lembaga Uji", "Prometric / OTA Japan & LSP Logam Indonesia"],
          ]),
        ],
      },
      {
        name: "Konstruksi",
        ch: [
          lf("Program Bahasa · Bahasa Jepang Konstruksi & Isyarat Kerja", { a: 25, b: 10, c: 140, d: 240 }, [
            ["Negara Tujuan", "Jepang"],
            ["Sektor", "Konstruksi"],
            ["Rumpun Kurikulum", "Program Bahasa"],
            ["Materi Kurikulum", "Kosakata Proyek, Anzen Daiichi (Safety First), Isyarat Crane"],
            ["Durasi Jam Pelajaran", "140 JP"],
            ["Standar Kelulusan", "JFT-Basic A2"],
          ]),
          lf("Teknis · Pemasangan Scaffolding Baja & Interior Finishing", { a: 22, b: 9, c: 240, d: 220 }, [
            ["Negara Tujuan", "Jepang"],
            ["Sektor", "Konstruksi"],
            ["Rumpun Kurikulum", "Teknis"],
            ["Materi Praktek", "Perancah Tubular, Formwork Beton, K3 Ketinggian & Harness"],
            ["Durasi Jam Pelajaran", "240 JP"],
            ["Standar Industri", "Standar K3 Konstruksi Jepang (JIS A 8951)"],
          ]),
          lf("Sertifikasi · Sertifikasi K3 Scaffolding & TITP Jepang", { a: 20, b: 8, c: 60, d: 210 }, [
            ["Negara Tujuan", "Jepang"],
            ["Sektor", "Konstruksi"],
            ["Rumpun Kurikulum", "Sertifikasi"],
            ["Skema Sertifikasi", "Scaffolding Safety Specialist & SSW Construction Test"],
            ["Durasi Jam Pelajaran", "60 JP"],
            ["Lembaga Uji", "JAC (Japan Construction Skill Test)"],
          ]),
        ],
      },
    ],
  },
  {
    name: "Korea Selatan",
    ch: [
      {
        name: "Manufaktur & Galangan Kapal",
        ch: [
          lf("Program Bahasa · Bahasa Korea EPS-TOPIK Manufaktur", { a: 45, b: 20, c: 180, d: 460 }, [
            ["Negara Tujuan", "Korea Selatan"],
            ["Sektor", "Manufaktur"],
            ["Rumpun Kurikulum", "Program Bahasa"],
            ["Materi Kurikulum", "Tata Bahasa Hangeul, Istilah Pabrik, Soal EPS-TOPIK"],
            ["Durasi Jam Pelajaran", "180 JP"],
            ["Standar Kelulusan", "EPS-TOPIK Passing Grade 80+"],
          ]),
          lf("Teknis · Pengelasan Welder SMAW/FCAW Galangan Kapal 3G/6G", { a: 40, b: 18, c: 320, d: 420 }, [
            ["Negara Tujuan", "Korea Selatan"],
            ["Sektor", "Manufaktur"],
            ["Rumpun Kurikulum", "Teknis"],
            ["Materi Praktek", "Flux-Cored Arc Welding Plat Tebal, Pipa 6G, Uji Radiografi"],
            ["Durasi Jam Pelajaran", "320 JP"],
            ["Standar Industri", "AWS D1.1 / KR (Korean Register) Shipbuilding"],
          ]),
          lf("Teknis · Operator Stamping Press & Cetakan Logam Otomotif", { a: 32, b: 14, c: 260, d: 330 }, [
            ["Negara Tujuan", "Korea Selatan"],
            ["Sektor", "Manufaktur"],
            ["Rumpun Kurikulum", "Teknis"],
            ["Materi Praktek", "Mesin Press Hidrolik, Kalibrasi Cetakan, K3 Presisi Otomotif"],
            ["Durasi Jam Pelajaran", "260 JP"],
            ["Standar Industri", "Korean Standard KS B 4001"],
          ]),
          lf("Sertifikasi · Uji Sertifikasi AWS D1.1 / KR Class & Visa E-7", { a: 42, b: 18, c: 80, d: 440 }, [
            ["Negara Tujuan", "Korea Selatan"],
            ["Sektor", "Manufaktur"],
            ["Rumpun Kurikulum", "Sertifikasi"],
            ["Skema Sertifikasi", "AWS Welding Inspector Certification & Visa E-7 Professional"],
            ["Durasi Jam Pelajaran", "80 JP"],
            ["Lembaga Uji", "KR (Korean Register) & BNSP Logam"],
          ]),
        ],
      },
      {
        name: "Fisherman & Budidaya Laut",
        ch: [
          lf("Program Bahasa · Bahasa Korea Maritim & Komunikasi Kapal", { a: 28, b: 12, c: 140, d: 300 }, [
            ["Negara Tujuan", "Korea Selatan"],
            ["Sektor", "Fisherman"],
            ["Rumpun Kurikulum", "Program Bahasa"],
            ["Materi Kurikulum", "Istilah Penangkapan Ikan, Keselamatan Pelayaran, Perintah Nakhoda"],
            ["Durasi Jam Pelajaran", "140 JP"],
            ["Standar Kelulusan", "EPS-TOPIK Perikanan"],
          ]),
          lf("Teknis · Penangkapan Ikan Lepas Pantai & Rawai Tuna", { a: 26, b: 11, c: 240, d: 280 }, [
            ["Negara Tujuan", "Korea Selatan"],
            ["Sektor", "Fisherman"],
            ["Rumpun Kurikulum", "Teknis"],
            ["Materi Praktek", "Pengoperasian Jaring Rawai, Cold Storage Ikan, Olah Gerak Kapal"],
            ["Durasi Jam Pelajaran", "240 JP"],
            ["Standar Industri", "STCW-F 95 Kemhub & Standar Maritim Korea"],
          ]),
          lf("Sertifikasi · Sertifikasi BST-Fisheries & Buku Pelaut Kemhub", { a: 25, b: 10, c: 60, d: 290 }, [
            ["Negara Tujuan", "Korea Selatan"],
            ["Sektor", "Fisherman"],
            ["Rumpun Kurikulum", "Sertifikasi"],
            ["Skema Sertifikasi", "Basic Safety Training Fisheries (BST-F) & Medical Certificate"],
            ["Durasi Jam Pelajaran", "60 JP"],
            ["Lembaga Uji", "Ditjen Hubla Kemenhub & Klinik Maritim Resmi"],
          ]),
        ],
      },
    ],
  },
  {
    name: "Malaysia",
    ch: [
      {
        name: "Hospitality & Pariwisata",
        ch: [
          lf("Program Bahasa · Professional English for Tourism & F&B", { a: 30, b: 12, c: 140, d: 320 }, [
            ["Negara Tujuan", "Malaysia"],
            ["Sektor", "Hospitality"],
            ["Rumpun Kurikulum", "Program Bahasa"],
            ["Materi Kurikulum", "English Conversation, Guest Handling, Phone Etiquette"],
            ["Durasi Jam Pelajaran", "140 JP"],
            ["Standar Kelulusan", "TOEIC Preparation 550+"],
          ]),
          lf("Teknis · Front Office, Resepsionis & Guest Service Agent", { a: 28, b: 11, c: 220, d: 290 }, [
            ["Negara Tujuan", "Malaysia"],
            ["Sektor", "Hospitality"],
            ["Rumpun Kurikulum", "Teknis"],
            ["Materi Praktek", "Opera PMS System, Check-in / Check-out, Concierge Service"],
            ["Durasi Jam Pelajaran", "220 JP"],
            ["Standar Industri", "Hotel Bintang 4/5 Malaysia Tourism Board"],
          ]),
          lf("Sertifikasi · Uji Kompetensi ASEAN Tourism Professional (CATC)", { a: 26, b: 10, c: 60, d: 280 }, [
            ["Negara Tujuan", "Malaysia"],
            ["Sektor", "Hospitality"],
            ["Rumpun Kurikulum", "Sertifikasi"],
            ["Skema Sertifikasi", "MRA on Tourism Professionals (ASEAN Toolboxes)"],
            ["Durasi Jam Pelajaran", "60 JP"],
            ["Lembaga Uji", "LSP Pariwisata Indonesia & Jabatan Pembangunan Kemahiran Malaysia"],
          ]),
        ],
      },
      {
        name: "Manufaktur & Elektronik",
        ch: [
          lf("Program Bahasa · English for Industrial Communication", { a: 32, b: 14, c: 120, d: 360 }, [
            ["Negara Tujuan", "Malaysia"],
            ["Sektor", "Manufaktur"],
            ["Rumpun Kurikulum", "Program Bahasa"],
            ["Materi Kurikulum", "Standard Operating Procedure (SOP) Bahasa Inggris Teknis"],
            ["Durasi Jam Pelajaran", "120 JP"],
            ["Standar Kelulusan", "Komunikasi Industri Dasar"],
          ]),
          lf("Teknis · Perakitan Komponen Elektronik & SMT Assembly", { a: 30, b: 12, c: 200, d: 340 }, [
            ["Negara Tujuan", "Malaysia"],
            ["Sektor", "Manufaktur"],
            ["Rumpun Kurikulum", "Teknis"],
            ["Materi Praktek", "Surface Mount Technology, Solder IPC, Quality Control Semikonduktor"],
            ["Durasi Jam Pelajaran", "200 JP"],
            ["Standar Industri", "IPC-A-610 Electronics Assembly"],
          ]),
          lf("Sertifikasi · Sertifikasi ESD Safety & IPC Electronics", { a: 28, b: 11, c: 60, d: 330 }, [
            ["Negara Tujuan", "Malaysia"],
            ["Sektor", "Manufaktur"],
            ["Rumpun Kurikulum", "Sertifikasi"],
            ["Skema Sertifikasi", "Electrostatic Discharge (ESD) Specialist & BNSP Elektronika"],
            ["Durasi Jam Pelajaran", "60 JP"],
            ["Lembaga Uji", "LSP Elektronika & Lembaga Sertifikasi Industri"],
          ]),
        ],
      },
    ],
  },
];

/* =========================================================================
   3. SIAP VOKASI (Lembaga Vokasi yang Sudah Terhubung dengan Suplai Riil)
   Hierarki: Jenis Vokasi > Negara · Sektor · Jabatan > Lembaga Vokasi
   Detail: Jumlah Suplai - Jumlah Kelas - Lokasi
   ========================================================================= */
const institutionTree = (): TreeNode[] => [
  {
    name: "Perguruan Tinggi & Politeknik Vokasi",
    ch: [
      {
        name: "Jepang · Manufaktur · Operator CNC & Welder",
        ch: [
          lf("Politeknik Indonusa Surakarta", { a: 147, b: 6, c: 180, d: 120 }, [
            ["Jenis Vokasi", "Perguruan Tinggi Vokasi / Politeknik D3"],
            ["Negara · Sektor · Jabatan", "Jepang · Manufaktur · Operator CNC & Welder Presisi"],
            ["Jumlah Suplai", "147 Calon Peserta"],
            ["Jumlah Kelas", "6 Kelas Berjalan"],
            ["Lokasi", "Kota Surakarta, Jawa Tengah"],
            ["Akreditasi", "Baik Sekali (BAN-PT)"],
            ["Sertifikasi", "BNSP Pengelasan 3G SMAW / JIS CNC"],
          ]),
        ],
      },
      {
        name: "Turki · Hospitality · Food & Beverage Service",
        ch: [
          lf("Politeknik Indonusa Surakarta (Kampus Perhotelan)", { a: 25, b: 2, c: 60, d: 23 }, [
            ["Jenis Vokasi", "Perguruan Tinggi Vokasi / Politeknik D3"],
            ["Negara · Sektor · Jabatan", "Turki · Hospitality · Food & Beverage Waiter"],
            ["Jumlah Suplai", "25 Calon Peserta"],
            ["Jumlah Kelas", "2 Kelas Berjalan"],
            ["Lokasi", "Kota Surakarta, Jawa Tengah"],
            ["Kurikulum", "Standard International Hospitality F&B"],
          ]),
        ],
      },
      {
        name: "Jerman · Kesehatan · Caregiver & Nursing Specialist",
        ch: [
          lf("Budi Luhur Migrant Center", { a: 42, b: 3, c: 120, d: 36 }, [
            ["Jenis Vokasi", "Pusat Vokasi Migran Perguruan Tinggi"],
            ["Negara · Sektor · Jabatan", "Jerman · Kesehatan · Caregiver Lansia & Nursing"],
            ["Jumlah Suplai", "42 Calon Peserta"],
            ["Jumlah Kelas", "3 Kelas Berjalan"],
            ["Lokasi", "Kota Bekasi, Jawa Barat"],
            ["Standar Bahasa", "Goethe Institut Level B1/B2"],
          ]),
        ],
      },
    ],
  },
  {
    name: "LPK Swasta Terakreditasi Ber-Suplai",
    ch: [
      {
        name: "Turki · Hospitality · Housekeeping & Room Attendant",
        ch: [
          lf("LPK Omega Hotel Academy", { a: 30, b: 2, c: 100, d: 26 }, [
            ["Jenis Vokasi", "LPK Swasta Terakreditasi"],
            ["Negara · Sektor · Jabatan", "Turki · Hospitality · Housekeeping & Room Attendant"],
            ["Jumlah Suplai", "30 Calon Peserta"],
            ["Jumlah Kelas", "2 Kelas Berjalan"],
            ["Lokasi", "Kabupaten Cilacap, Jawa Tengah"],
            ["Akreditasi", "Terakreditasi A (LA-LPK)"],
          ]),
        ],
      },
      {
        name: "Turki & Eropa · Hospitality · Spa Therapist",
        ch: [
          lf("BATC (Bali Aviation & Tourism Center)", { a: 32, b: 2, c: 100, d: 28 }, [
            ["Jenis Vokasi", "LPK Swasta Terakreditasi"],
            ["Negara · Sektor · Jabatan", "Turki & Eropa · Hospitality · Spa Therapist"],
            ["Jumlah Suplai", "32 Calon Peserta"],
            ["Jumlah Kelas", "2 Kelas Berjalan"],
            ["Lokasi", "Kota Denpasar, Bali"],
            ["Standar Kompetensi", "CIBTAC & Balinese Wellness Expert"],
          ]),
        ],
      },
      {
        name: "Korea Selatan · Manufaktur · Welder SMAW/FCAW",
        ch: [
          lf("LPK DAEHWA", { a: 35, b: 2, c: 120, d: 28 }, [
            ["Jenis Vokasi", "LPK Swasta Terakreditasi"],
            ["Negara · Sektor · Jabatan", "Korea Selatan · Manufaktur · Welder SMAW/FCAW"],
            ["Jumlah Suplai", "35 Calon Peserta"],
            ["Jumlah Kelas", "2 Kelas Berjalan"],
            ["Lokasi", "Kabupaten Karawang, Jawa Barat"],
            ["Standar", "AWS D1.1 & Bahasa Korea EPS-TOPIK"],
          ]),
        ],
      },
      {
        name: "Malaysia · Hospitality · Front Desk & Cruise Line",
        ch: [
          lf("LPK Victoria Hotel School", { a: 28, b: 2, c: 90, d: 24 }, [
            ["Jenis Vokasi", "LPK Swasta Terakreditasi"],
            ["Negara · Sektor · Jabatan", "Malaysia · Hospitality · Front Desk & Cruise Line"],
            ["Jumlah Suplai", "28 Calon Peserta"],
            ["Jumlah Kelas", "2 Kelas Berjalan"],
            ["Lokasi", "Kota Surakarta, Jawa Tengah"],
            ["Akreditasi", "Terakreditasi A (LA-LPK)"],
          ]),
        ],
      },
      {
        name: "Korea Selatan · Manufaktur · Operasi Mesin Produksi",
        ch: [
          lf("LPK Duta International Course", { a: 24, b: 2, c: 80, d: 20 }, [
            ["Jenis Vokasi", "LPK Swasta Terakreditasi"],
            ["Negara · Sektor · Jabatan", "Korea Selatan · Manufaktur · Operasi Mesin Produksi"],
            ["Jumlah Suplai", "24 Calon Peserta"],
            ["Jumlah Kelas", "2 Kelas Berjalan"],
            ["Lokasi", "Kabupaten Pacitan, Jawa Timur"],
            ["Program", "Bahasa Korea & Manufaktur Industri"],
          ]),
        ],
      },
    ],
  },
  {
    name: "SMK Pusat Keunggulan Ber-Suplai",
    ch: [
      {
        name: "Jepang · Manufaktur · Teknik Otomasi & Mesin CNC",
        ch: [
          lf("SMK Tunas Harapan Pati", { a: 45, b: 3, c: 150, d: 38 }, [
            ["Jenis Vokasi", "SMK Pusat Keunggulan (Go Global)"],
            ["Negara · Sektor · Jabatan", "Jepang · Manufaktur · Teknik Otomasi & Mesin CNC"],
            ["Jumlah Suplai", "45 Calon Peserta"],
            ["Jumlah Kelas", "3 Kelas Berjalan"],
            ["Lokasi", "Kabupaten Pati, Jawa Tengah"],
            ["Standar Fasilitas", "Workshop CNC Presisi Terakreditasi A"],
          ]),
        ],
      },
      {
        name: "Jepang · Manufaktur · Teknik Pengelasan & Otomotif",
        ch: [
          lf("SMK Muhammadiyah 04 Sukorejo Kendal", { a: 38, b: 2, c: 130, d: 32 }, [
            ["Jenis Vokasi", "SMK Pusat Keunggulan (Go Global)"],
            ["Negara · Sektor · Jabatan", "Jepang · Manufaktur · Teknik Pengelasan & Otomotif"],
            ["Jumlah Suplai", "38 Calon Peserta"],
            ["Jumlah Kelas", "2 Kelas Berjalan"],
            ["Lokasi", "Kabupaten Kendal, Jawa Tengah"],
            ["Sertifikasi", "LSP-P1 Kemendikbud & JIS Welding"],
          ]),
        ],
      },
      {
        name: "Korea Selatan · Manufaktur · Fabrikasi Logam",
        ch: [
          lf("SMK Contoh Cibinong", { a: 1, b: 1, c: 40, d: 1 }, [
            ["Jenis Vokasi", "SMK Pusat Keunggulan"],
            ["Negara · Sektor · Jabatan", "Korea Selatan · Manufaktur · Fabrikasi Logam"],
            ["Jumlah Suplai", "1 Calon Peserta"],
            ["Jumlah Kelas", "1 Kelas Berjalan"],
            ["Lokasi", "Kabupaten Bogor, Jawa Barat"],
          ]),
        ],
      },
    ],
  },
  {
    name: "Balai Pelatihan Vokasi (BPVP / BLK-LN)",
    ch: [
      {
        name: "Jepang · Manufaktur · Welder Bawah Air & CNC",
        ch: [
          lf("UPTD Solo Technopark", { a: 40, b: 2, c: 120, d: 35 }, [
            ["Jenis Vokasi", "Balai Pelatihan Vokasi & Technopark"],
            ["Negara · Sektor · Jabatan", "Jepang · Manufaktur · Welder Bawah Air & CNC"],
            ["Jumlah Suplai", "40 Calon Peserta"],
            ["Jumlah Kelas", "2 Kelas Berjalan"],
            ["Lokasi", "Kota Surakarta, Jawa Tengah"],
            ["Fasilitas", "Diving Tank Pengelasan & Lab CNC 5-Axis"],
          ]),
        ],
      },
      {
        name: "Jepang · Kesehatan · Caregiver Lansia Kaigo",
        ch: [
          lf("BLK-LN PRIMA DUTA SEJATI KENDAL", { a: 50, b: 3, c: 160, d: 42 }, [
            ["Jenis Vokasi", "Balai Latihan Kerja Luar Negeri"],
            ["Negara · Sektor · Jabatan", "Jepang · Kesehatan · Caregiver Lansia Kaigo"],
            ["Jumlah Suplai", "50 Calon Peserta"],
            ["Jumlah Kelas", "3 Kelas Berjalan"],
            ["Lokasi", "Kabupaten Kendal, Jawa Tengah"],
            ["Standar Kurikulum", "Kemenaker & Standar SSW Kaigo Jepang"],
          ]),
        ],
      },
    ],
  },
];

/* =========================================================================
   4. SIAP PERMINTAAN (Permintaan Pekerja Luar Negeri & Skema Penempatan)
   Hierarki: Per Negara > Sektor & Jabatan > Skema Penempatan & Kebutuhan
   Skema: G to G, G to P, P to P, UKPS, Perseorangan, Mandiri, Magang Jepang
   ========================================================================= */
const demandTree = (): TreeNode[] => [
  {
    name: "Turki",
    ch: [
      {
        name: "Hospitality · Housekeeping Attendant",
        ch: [
          lf("P to P (Private to Private Resmi)", { a: 7570, b: 2200, c: 5370, d: 1050 }, [
            ["Negara Tujuan", "Turki"],
            ["Sektor & Jabatan", "Hospitality · Housekeeping & Room Attendant"],
            ["Jumlah Kebutuhan", "7.570 Pekerja"],
            ["Skema Penempatan", "P to P (Private to Private Resmi)"],
            ["Pemberi Kerja / Asosiasi", "Asosiasi Perhotelan Antalya & Istanbul"],
            ["Masa Kontrak", "2 Tahun (Dapat Diperpanjang)"],
          ]),
          lf("Perseorangan / Mandiri Terverifikasi", { a: 450, b: 200, c: 250, d: 50 }, [
            ["Negara Tujuan", "Turki"],
            ["Sektor & Jabatan", "Hospitality · Housekeeping Attendant"],
            ["Jumlah Kebutuhan", "450 Pekerja"],
            ["Skema Penempatan", "Perseorangan / Mandiri Resmi Kemnaker"],
            ["Masa Kontrak", "2 Tahun"],
          ]),
        ],
      },
      {
        name: "Hospitality · Spa Therapist & Wellness",
        ch: [
          lf("P to P (Private to Private Resmi)", { a: 1460, b: 420, c: 1040, d: 280 }, [
            ["Negara Tujuan", "Turki"],
            ["Sektor & Jabatan", "Hospitality · Spa Therapist CIBTAC"],
            ["Jumlah Kebutuhan", "1.460 Pekerja"],
            ["Skema Penempatan", "P to P (Private to Private Resmi)"],
            ["Lokasi Kerja", "Bodrum, Izmir & Antalya Resort"],
            ["Masa Kontrak", "2 Tahun"],
          ]),
        ],
      },
      {
        name: "Hospitality · Food & Beverage Waiter",
        ch: [
          lf("P to P (Private to Private Resmi)", { a: 2600, b: 850, c: 1750, d: 450 }, [
            ["Negara Tujuan", "Turki"],
            ["Sektor & Jabatan", "Hospitality · Food & Beverage Waiter"],
            ["Jumlah Kebutuhan", "2.600 Pekerja"],
            ["Skema Penempatan", "P to P (Private to Private Resmi)"],
            ["Kategori Proyek", "Hotel Bintang 5 & Restoran Internasional"],
            ["Masa Kontrak", "2 Tahun"],
          ]),
        ],
      },
      {
        name: "Hospitality · Cleaner & Facility Service",
        ch: [
          lf("UKPS (Untuk Kepentingan Perusahaan Sendiri)", { a: 720, b: 280, c: 440, d: 120 }, [
            ["Negara Tujuan", "Turki"],
            ["Sektor & Jabatan", "Hospitality · Public Area Cleaner"],
            ["Jumlah Kebutuhan", "720 Pekerja"],
            ["Skema Penempatan", "UKPS (Perusahaan Jasa Fasilitas Mandiri)"],
            ["Masa Kontrak", "2 Tahun"],
          ]),
        ],
      },
      {
        name: "Hospitality · Commis Chef Preparation",
        ch: [
          lf("P to P (Private to Private Resmi)", { a: 40, b: 18, c: 22, d: 10 }, [
            ["Negara Tujuan", "Turki"],
            ["Sektor & Jabatan", "Hospitality · Commis Cook"],
            ["Jumlah Kebutuhan", "40 Pekerja"],
            ["Skema Penempatan", "P to P (Private to Private Resmi)"],
            ["Masa Kontrak", "2 Tahun"],
          ]),
        ],
      },
    ],
  },
  {
    name: "Jepang",
    ch: [
      {
        name: "Kesehatan · Caregiver Lansia Kaigo",
        ch: [
          lf("P to P (SSW Tokutei Ginou)", { a: 540, b: 210, c: 330, d: 110 }, [
            ["Negara Tujuan", "Jepang"],
            ["Sektor & Jabatan", "Kesehatan · Caregiver Kaigo SSW"],
            ["Jumlah Kebutuhan", "540 Pekerja"],
            ["Skema Penempatan", "P to P (Specified Skilled Worker / Tokutei Ginou)"],
            ["Standar Kompetensi", "SSW Kaigo & JLPT N4 / JFT-Basic"],
            ["Masa Kontrak", "5 Tahun"],
          ]),
          lf("G to G (EPA Kerjasama Pemerintah)", { a: 350, b: 140, c: 210, d: 80 }, [
            ["Negara Tujuan", "Jepang"],
            ["Sektor & Jabatan", "Kesehatan · Nurse & Caregiver EPA"],
            ["Jumlah Kebutuhan", "350 Pekerja"],
            ["Skema Penempatan", "G to G (Indonesia-Japan Economic Partnership)"],
            ["Penyelenggara", "BP2MI & JICWELS Jepang"],
            ["Masa Kontrak", "3-5 Tahun"],
          ]),
          lf("Magang Jepang (TITP / Ginou Jisshusei)", { a: 280, b: 110, c: 170, d: 60 }, [
            ["Negara Tujuan", "Jepang"],
            ["Sektor & Jabatan", "Kesehatan · Caregiver Magang Teknis"],
            ["Jumlah Kebutuhan", "280 Peserta"],
            ["Skema Penempatan", "Magang Jepang (TITP Lembaga Pengirim Resmi)"],
            ["Masa Kontrak", "3 Tahun"],
          ]),
        ],
      },
      {
        name: "Manufaktur · Operator CNC & Welder Presisi",
        ch: [
          lf("Magang Jepang (TITP / Ginou Jisshusei)", { a: 300, b: 110, c: 190, d: 60 }, [
            ["Negara Tujuan", "Jepang"],
            ["Sektor & Jabatan", "Manufaktur · Welder GMAW & Operator Bubut"],
            ["Jumlah Kebutuhan", "300 Peserta"],
            ["Skema Penempatan", "Magang Jepang (TITP Pengiriman Resmi)"],
            ["Masa Kontrak", "3 Tahun"],
          ]),
          lf("P to P (SSW Tokutei Ginou)", { a: 220, b: 85, c: 135, d: 45 }, [
            ["Negara Tujuan", "Jepang"],
            ["Sektor & Jabatan", "Manufaktur · Precision Machining SSW"],
            ["Jumlah Kebutuhan", "220 Pekerja"],
            ["Skema Penempatan", "P to P (Specified Skilled Worker)"],
            ["Masa Kontrak", "5 Tahun"],
          ]),
        ],
      },
      {
        name: "Konstruksi · Scaffolding & Finishing Bangunan",
        ch: [
          lf("Magang Jepang (TITP / Ginou Jisshusei)", { a: 180, b: 70, c: 110, d: 35 }, [
            ["Negara Tujuan", "Jepang"],
            ["Sektor & Jabatan", "Konstruksi · Scaffolder & Interior Finishing"],
            ["Jumlah Kebutuhan", "180 Peserta"],
            ["Skema Penempatan", "Magang Jepang (TITP Konstruksi)"],
            ["Masa Kontrak", "3 Tahun"],
          ]),
        ],
      },
      {
        name: "Fisherman & Pertanian · Modern Agriculture",
        ch: [
          lf("Magang Jepang (TITP / Ginou Jisshusei)", { a: 40, b: 15, c: 25, d: 10 }, [
            ["Negara Tujuan", "Jepang"],
            ["Sektor & Jabatan", "Fisherman & Pertanian · Pertanian Modern"],
            ["Jumlah Kebutuhan", "40 Peserta"],
            ["Skema Penempatan", "Magang Jepang (TITP Pertanian)"],
            ["Masa Kontrak", "3 Tahun"],
          ]),
        ],
      },
    ],
  },
  {
    name: "Malaysia",
    ch: [
      {
        name: "Kesehatan · Elderly Caretaker",
        ch: [
          lf("G to P (Government to Private)", { a: 4120, b: 1400, c: 2720, d: 590 }, [
            ["Negara Tujuan", "Malaysia"],
            ["Sektor & Jabatan", "Kesehatan · Caregiver Lansia Resmi"],
            ["Jumlah Kebutuhan", "4.120 Pekerja"],
            ["Skema Penempatan", "G to P (Government to Private Kerjasama)"],
            ["Masa Kontrak", "2 Tahun"],
          ]),
        ],
      },
      {
        name: "Hospitality · Front Desk & Hotel Reception",
        ch: [
          lf("P to P (Private to Private Resmi)", { a: 1200, b: 420, c: 780, d: 180 }, [
            ["Negara Tujuan", "Malaysia"],
            ["Sektor & Jabatan", "Hospitality · Hotel Reception & Service"],
            ["Jumlah Kebutuhan", "1.200 Pekerja"],
            ["Skema Penempatan", "P to P (Private to Private Resmi)"],
            ["Masa Kontrak", "2 Tahun"],
          ]),
        ],
      },
      {
        name: "Manufaktur · Perakitan Komponen Elektronik",
        ch: [
          lf("UKPS (Untuk Kepentingan Perusahaan Sendiri)", { a: 2260, b: 780, c: 1480, d: 350 }, [
            ["Negara Tujuan", "Malaysia"],
            ["Sektor & Jabatan", "Manufaktur · Operator Perakitan Elektronik"],
            ["Jumlah Kebutuhan", "2.260 Pekerja"],
            ["Skema Penempatan", "UKPS (Perusahaan Multinasional Sendiri)"],
            ["Masa Kontrak", "2 Tahun"],
          ]),
        ],
      },
      {
        name: "Fisherman / Agro · Plantation Worker Sawit",
        ch: [
          lf("P to P (Private to Private Resmi)", { a: 2400, b: 920, c: 1480, d: 410 }, [
            ["Negara Tujuan", "Malaysia"],
            ["Sektor & Jabatan", "Fisherman / Agro · Plantation Operator"],
            ["Jumlah Kebutuhan", "2.400 Pekerja"],
            ["Skema Penempatan", "P to P (Private to Private Resmi)"],
            ["Masa Kontrak", "2 Tahun"],
          ]),
        ],
      },
    ],
  },
  {
    name: "Korea Selatan",
    ch: [
      {
        name: "Manufaktur · Welder Galangan Kapal & Heavy Industry",
        ch: [
          lf("G to G (EPS - Employment Permit System)", { a: 1500, b: 620, c: 880, d: 290 }, [
            ["Negara Tujuan", "Korea Selatan"],
            ["Sektor & Jabatan", "Manufaktur · Industri Berat & Otomotif"],
            ["Jumlah Kebutuhan", "1.500 Pekerja"],
            ["Skema Penempatan", "G to G (EPS HRD Korea & Kemnaker)"],
            ["Masa Kontrak", "3 Tahun (Visa E-9)"],
          ]),
          lf("P to P (Visa Profesional E-7)", { a: 300, b: 130, c: 170, d: 70 }, [
            ["Negara Tujuan", "Korea Selatan"],
            ["Sektor & Jabatan", "Manufaktur · Welder Shipbuilding 3G/6G"],
            ["Jumlah Kebutuhan", "300 Pekerja"],
            ["Skema Penempatan", "P to P (Visa Tenaga Profesional Khusus E-7)"],
            ["Masa Kontrak", "3 Tahun"],
          ]),
        ],
      },
      {
        name: "Fisherman · ABK Penangkapan Ikan Samudera",
        ch: [
          lf("P to P (Private to Private Resmi)", { a: 600, b: 220, c: 380, d: 110 }, [
            ["Negara Tujuan", "Korea Selatan"],
            ["Sektor & Jabatan", "Fisherman · ABK Kapal Ikan Korea Selatan"],
            ["Jumlah Kebutuhan", "600 Pekerja"],
            ["Skema Penempatan", "P to P (Private to Private Resmi)"],
            ["Masa Kontrak", "2 Tahun (Visa E-10)"],
          ]),
        ],
      },
      {
        name: "Manufaktur · Operator Cetakan Logam Presisi",
        ch: [
          lf("G to G (EPS - Employment Permit System)", { a: 40, b: 18, c: 22, d: 10 }, [
            ["Negara Tujuan", "Korea Selatan"],
            ["Sektor & Jabatan", "Manufaktur · Operator Cetakan Logam"],
            ["Jumlah Kebutuhan", "40 Pekerja"],
            ["Skema Penempatan", "G to G (EPS HRD Korea)"],
            ["Masa Kontrak", "3 Tahun"],
          ]),
        ],
      },
    ],
  },
];

function buildRealTrees(): Record<PillarKey, PillarConfig> {
  const rawP: Record<
    PillarKey,
    { t: string; lv: string[]; k: [keyof MetricSpec, string][]; tree: () => TreeNode[] }
  > = {
    sup: {
      t: "1. Siap Latih",
      lv: ["Provinsi", "Kabupaten / Kota", "Lembaga Vokasi / LPK", "Kompetensi"],
      k: [
        ["a", "Target Calon Peserta"],
        ["b", "Lolos Seleksi"],
        ["c", "Lulus Bahasa"],
        ["d", "Siap Penempatan"],
      ],
      tree: supplyTree,
    },
    pel: {
      t: "2. Siap Program",
      lv: ["Negara Tujuan", "Sektor Industri", "Program Bahasa · Teknis · Sertifikasi"],
      k: [
        ["a", "Jumlah Kelas"],
        ["b", "Kelas Berjalan"],
        ["c", "Jam Pelajaran (JP)"],
        ["d", "Tersertifikasi"],
      ],
      tree: trainingTree,
    },
    lpk: {
      t: "3. Siap Vokasi",
      lv: ["Jenis Vokasi", "Negara · Sektor · Jabatan", "Lembaga Vokasi"],
      k: [
        ["a", "Jumlah Suplai"],
        ["b", "Jumlah Kelas"],
        ["c", "Kapasitas Latih"],
        ["d", "Siap Ditempatkan"],
      ],
      tree: institutionTree,
    },
    dem: {
      t: "4. Siap Permintaan",
      lv: ["Negara Tujuan", "Sektor & Jabatan", "Skema & Kebutuhan Penempatan"],
      k: [
        ["a", "Jumlah Kebutuhan"],
        ["b", "Terisi"],
        ["c", "Sisa Kebutuhan"],
        ["d", "Tahap Proses"],
      ],
      tree: demandTree,
    },
  };

  // Sesuaikan angka total di kartu utama dengan data di header timeline:
  // 1. Siap Latih: 12.600 Peserta
  // 2. Siap Program: 630 Kelas (5 Sektor)
  // 3. Siap Vokasi: Sesuai jumlah vokasi ber-suplai (8 Vokasi Terisi Suplai)
  // 4. Siap Permintaan: 4 Negara Mitra
  const HEADER_TARGETS: Record<PillarKey, number> = {
    sup: 12600,
    pel: 630,
    lpk: 8,
    dem: 4,
  };

  const result: Partial<Record<PillarKey, PillarConfig>> = {};
  (Object.keys(rawP) as PillarKey[]).forEach((key) => {
    const item = rawP[key];
    const root = agg({ name: item.t, ch: item.tree() }) as InternalNode & { m: MetricSpec };

    // Atur total root sesuai header tanpa mengubah isian di dalam root.ch
    root.m.a = HEADER_TARGETS[key];

    result[key] = {
      t: item.t,
      lv: item.lv,
      k: item.k,
      root,
    };
  });

  return result as Record<PillarKey, PillarConfig>;
}

export const PILLARS_DATA = buildRealTrees();

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
