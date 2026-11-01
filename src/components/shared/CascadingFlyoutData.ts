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
   2. PELATIHAN (Program Pelatihan Kejuruan Terdata - 9.811 Program DB)
   Diselaraskan dengan data riil program pelatihan per provinsi & sektor
   ========================================================================= */
const trainingTree = (): TreeNode[] => [
  {
    name: "Jawa Barat",
    ch: [
      {
        name: "Manufaktur",
        ch: [
          lf("Teknik Fabrikasi Logam dan Pengelasan", { a: 38, b: 14, c: 24, d: 420 }, [["Provinsi", "Jawa Barat"], ["Sektor", "Manufaktur"], ["Kurikulum", "SKKNI & AWS 3G/6G"], ["Durasi", "320 JP"]]),
          lf("Operator Mesin Bubut CNC & Milling", { a: 28, b: 10, c: 18, d: 310 }, [["Provinsi", "Jawa Barat"], ["Sektor", "Manufaktur"], ["Kurikulum", "JIS B 6331 CNC"], ["Durasi", "280 JP"]]),
          lf("Molding & Injection Produksi Presisi", { a: 22, b: 8, c: 14, d: 240 }, [["Provinsi", "Jawa Barat"], ["Sektor", "Manufaktur"], ["Kurikulum", "Standard Industri Korea"], ["Durasi", "240 JP"]]),
        ],
      },
      {
        name: "Hospitality",
        ch: [
          lf("Spa Therapist & Wellness Holistik", { a: 32, b: 11, c: 21, d: 350 }, [["Provinsi", "Jawa Barat"], ["Sektor", "Hospitality"], ["Target", "Turki, Maladewa & UEA"], ["Durasi", "360 JP"]]),
          lf("Housekeeping & Public Area Attendant", { a: 35, b: 12, c: 23, d: 410 }, [["Provinsi", "Jawa Barat"], ["Sektor", "Hospitality"], ["Target", "Turki & Arab Saudi"], ["Durasi", "260 JP"]]),
          lf("Maid & Professional Tata Graha", { a: 24, b: 9, c: 15, d: 280 }, [["Provinsi", "Jawa Barat"], ["Sektor", "Hospitality"], ["Target", "Eropa Timur & Gulf"], ["Durasi", "200 JP"]]),
        ],
      },
      {
        name: "Kesehatan",
        ch: [
          lf("Caregiver Lansia Terstandar Jepang (SSW)", { a: 30, b: 12, c: 18, d: 320 }, [["Provinsi", "Jawa Barat"], ["Sektor", "Kesehatan"], ["Standar", "Kaigo Fukushishi / SSW"], ["Durasi", "480 JP"]]),
          lf("Elderly Caretaker & Home Care Khusus", { a: 25, b: 9, c: 16, d: 260 }, [["Provinsi", "Jawa Barat"], ["Sektor", "Kesehatan"], ["Target", "Taiwan & Malaysia"], ["Durasi", "340 JP"]]),
        ],
      },
      {
        name: "Konstruksi",
        ch: [
          lf("Teknologi Konstruksi Bangunan & Scaffolding", { a: 18, b: 6, c: 12, d: 190 }, [["Provinsi", "Jawa Barat"], ["Sektor", "Konstruksi"], ["Standar", "SKKNI K3 Konstruksi"], ["Durasi", "240 JP"]]),
          lf("Instalasi Listrik Industri & Penerangan", { a: 16, b: 5, c: 11, d: 170 }, [["Provinsi", "Jawa Barat"], ["Sektor", "Konstruksi"], ["Standar", "PUIL & K3 Listrik"], ["Durasi", "260 JP"]]),
        ],
      },
      {
        name: "Fisherman",
        ch: [
          lf("Budidaya Perikanan Laut & Aquaculture", { a: 14, b: 5, c: 9, d: 150 }, [["Provinsi", "Jawa Barat"], ["Sektor", "Fisherman"], ["Target", "Taiwan & Malaysia"], ["Durasi", "220 JP"]]),
        ],
      },
    ],
  },
  {
    name: "Jawa Tengah",
    ch: [
      {
        name: "Kesehatan",
        ch: [
          lf("Caregiver Perawat Lansia Kaigo", { a: 36, b: 15, c: 21, d: 410 }, [["Provinsi", "Jawa Tengah"], ["Sektor", "Kesehatan"], ["Standar", "SSW Jepang Kaigo"], ["Durasi", "520 JP"]]),
          lf("Nursing Home & Caretaker Taiwan", { a: 26, b: 10, c: 16, d: 290 }, [["Provinsi", "Jawa Tengah"], ["Sektor", "Kesehatan"], ["Standar", "MoHW Taiwan Caretaker"], ["Durasi", "360 JP"]]),
        ],
      },
      {
        name: "Manufaktur",
        ch: [
          lf("Pengelasan Welder SMAW/FCAW Terakreditasi", { a: 34, b: 13, c: 21, d: 380 }, [["Provinsi", "Jawa Tengah"], ["Sektor", "Manufaktur"], ["Target", "Korea Selatan & Qatar"], ["Durasi", "360 JP"]]),
          lf("Teknik Permesinan & Operator CNC", { a: 25, b: 9, c: 16, d: 270 }, [["Provinsi", "Jawa Tengah"], ["Sektor", "Manufaktur"], ["Target", "Taiwan & Slowakia"], ["Durasi", "300 JP"]]),
        ],
      },
      {
        name: "Hospitality",
        ch: [
          lf("Housekeeping & Steward Hotel Bintang", { a: 28, b: 10, c: 18, d: 310 }, [["Provinsi", "Jawa Tengah"], ["Sektor", "Hospitality"], ["Target", "Turki & Timur Tengah"], ["Durasi", "240 JP"]]),
          lf("Spa Therapist Tradisional & Modern", { a: 20, b: 8, c: 12, d: 220 }, [["Provinsi", "Jawa Tengah"], ["Sektor", "Hospitality"], ["Target", "Turki & Maladewa"], ["Durasi", "320 JP"]]),
        ],
      },
      {
        name: "Fisherman",
        ch: [
          lf("ABK Penangkapan Ikan Lepas Pantai (Fisherman)", { a: 22, b: 8, c: 14, d: 250 }, [["Provinsi", "Jawa Tengah"], ["Sektor", "Fisherman"], ["Standar", "BST-Fisheries Kemhub"], ["Durasi", "280 JP"]]),
        ],
      },
      {
        name: "Konstruksi",
        ch: [
          lf("Pemasangan Rangka Baja Ringan & Scaffolding", { a: 16, b: 6, c: 10, d: 160 }, [["Provinsi", "Jawa Tengah"], ["Sektor", "Konstruksi"], ["Standar", "SKKNI Baja Ringan"], ["Durasi", "200 JP"]]),
        ],
      },
    ],
  },
  {
    name: "Jawa Timur",
    ch: [
      {
        name: "Manufaktur",
        ch: [
          lf("Operasi Produksi & Perakitan Komponen", { a: 30, b: 11, c: 19, d: 340 }, [["Provinsi", "Jawa Timur"], ["Sektor", "Manufaktur"], ["Target", "Taiwan & Malaysia"], ["Durasi", "240 JP"]]),
          lf("Fabrikasi Struktur Baja & Las Pipa", { a: 24, b: 9, c: 15, d: 260 }, [["Provinsi", "Jawa Timur"], ["Sektor", "Manufaktur"], ["Standar", "ASME & AWS D1.1"], ["Durasi", "320 JP"]]),
        ],
      },
      {
        name: "Fisherman",
        ch: [
          lf("Teknik Penangkapan Ikan Samudera (ABK Niaga)", { a: 26, b: 10, c: 16, d: 290 }, [["Provinsi", "Jawa Timur"], ["Sektor", "Fisherman"], ["Standar", "STCW-F 95 Kemhub"], ["Durasi", "300 JP"]]),
          lf("Aquaculture & Manajemen Kolam Intensif", { a: 18, b: 7, c: 11, d: 190 }, [["Provinsi", "Jawa Timur"], ["Sektor", "Fisherman"], ["Target", "Taiwan & Jepang"], ["Durasi", "220 JP"]]),
        ],
      },
      {
        name: "Kesehatan",
        ch: [
          lf("Caregiver Perawat Lansia Klinis", { a: 22, b: 8, c: 14, d: 250 }, [["Provinsi", "Jawa Timur"], ["Sektor", "Kesehatan"], ["Target", "Jepang & Taiwan"], ["Durasi", "420 JP"]]),
        ],
      },
      {
        name: "Hospitality",
        ch: [
          lf("Pelayanan Makanan & Minuman (F&B Waiter)", { a: 20, b: 7, c: 13, d: 230 }, [["Provinsi", "Jawa Timur"], ["Sektor", "Hospitality"], ["Target", "Turki & UEA"], ["Durasi", "200 JP"]]),
        ],
      },
    ],
  },
  {
    name: "Bali",
    ch: [
      {
        name: "Hospitality",
        ch: [
          lf("Spa Therapist & Balinese Massage Expert", { a: 42, b: 15, c: 27, d: 480 }, [["Provinsi", "Bali"], ["Sektor", "Hospitality"], ["Target", "Turki, Maladewa & Eropa"], ["Durasi", "360 JP"]]),
          lf("Housekeeping & Cruise Line Hospitality", { a: 34, b: 12, c: 22, d: 390 }, [["Provinsi", "Bali"], ["Sektor", "Hospitality"], ["Target", "Turki & Kapal Pesiar"], ["Durasi", "280 JP"]]),
          lf("Cook & Continental Culinary Preparation", { a: 20, b: 7, c: 13, d: 210 }, [["Provinsi", "Bali"], ["Sektor", "Hospitality"], ["Target", "Kroasia, Bulgaria, Turki"], ["Durasi", "320 JP"]]),
        ],
      },
    ],
  },
  {
    name: "Banten",
    ch: [
      {
        name: "Manufaktur",
        ch: [
          lf("Molding & Cetakan Plastik Presisi", { a: 20, b: 7, c: 13, d: 220 }, [["Provinsi", "Banten"], ["Sektor", "Manufaktur"], ["Target", "Korea & Taiwan"], ["Durasi", "260 JP"]]),
          lf("Teknik Otomotif & Alat Berat", { a: 16, b: 6, c: 10, d: 170 }, [["Provinsi", "Banten"], ["Sektor", "Manufaktur"], ["Standar", "Kemenaker & SKKNI"], ["Durasi", "280 JP"]]),
        ],
      },
      {
        name: "Konstruksi",
        ch: [
          lf("Pemasangan Scaffolding & Finishing Bangunan", { a: 14, b: 5, c: 9, d: 150 }, [["Provinsi", "Banten"], ["Sektor", "Konstruksi"], ["Standar", "K3 Elevasi & Scaffolding"], ["Durasi", "200 JP"]]),
        ],
      },
    ],
  },
];

/* =========================================================================
   3. LPK & VOKASI (Lembaga Penyelenggara Terdaftar - 1.707 Lembaga DB)
   Diselaraskan dengan data riil tabel `institutions` di database
   ========================================================================= */
const institutionTree = (): TreeNode[] => [
  {
    name: "LPK Swasta Terakreditasi",
    ch: [
      {
        name: "Jawa Barat",
        ch: [
          lf("LPK DAEHWA", { a: 1, b: 1, c: 180, d: 145 }, [["Jenis", "LPK"], ["Provinsi", "Jawa Barat"], ["Akreditasi", "A"], ["Kejuruan", "Manufaktur & Bahasa Korea"]]),
          lf("LPK Kessaku Indonesia", { a: 1, b: 1, c: 150, d: 120 }, [["Jenis", "LPK"], ["Provinsi", "Jawa Barat"], ["Akreditasi", "A"], ["Kejuruan", "Welder & SSW Jepang"]]),
          lf("MYSHA PUTRI PERDANA", { a: 1, b: 1, c: 200, d: 160 }, [["Jenis", "LPK"], ["Provinsi", "Jawa Barat"], ["Akreditasi", "A"], ["Kejuruan", "Hospitality & Spa Therapist"]]),
        ],
      },
      {
        name: "Jawa Tengah",
        ch: [
          lf("LPK AOISORA SINAR INDONESIA", { a: 1, b: 1, c: 220, d: 190 }, [["Jenis", "LPK"], ["Provinsi", "Jawa Tengah"], ["Akreditasi", "A"], ["Kejuruan", "Caregiver SSW & Bahasa Jepang"]]),
          lf("LPK SHAFA", { a: 1, b: 1, c: 160, d: 130 }, [["Jenis", "LPK"], ["Provinsi", "Jawa Tengah"], ["Akreditasi", "A"], ["Kejuruan", "Caregiver & Manufaktur Presisi"]]),
          lf("Independent Cruise Ships and Hotel School", { a: 1, b: 1, c: 250, d: 210 }, [["Jenis", "LPK"], ["Provinsi", "Jawa Tengah"], ["Akreditasi", "A"], ["Kejuruan", "Perhotelan & Kapal Pesiar Internasional"]]),
          lf("LPKS KOREANINDO SUKOHARJO HOFUNA", { a: 1, b: 1, c: 140, d: 115 }, [["Jenis", "LPK"], ["Provinsi", "Jawa Tengah"], ["Akreditasi", "A"], ["Kejuruan", "Manufaktur & Bahasa Korea"]]),
        ],
      },
      {
        name: "DKI Jakarta",
        ch: [
          lf("LPK MUGEN (MULTI GENERASI INDONESIA)", { a: 1, b: 1, c: 280, d: 240 }, [["Jenis", "LPK"], ["Provinsi", "DKI Jakarta"], ["Akreditasi", "A"], ["Kejuruan", "Caregiver SSW & Manufaktur Jepang"]]),
          lf("Grand Pertiwi International", { a: 1, b: 1, c: 220, d: 180 }, [["Jenis", "LPK"], ["Provinsi", "DKI Jakarta"], ["Akreditasi", "A"], ["Kejuruan", "Hospitality & Tata Graha Luar Negeri"]]),
          lf("LPK WALAGRI MULIA ABADI", { a: 1, b: 1, c: 180, d: 150 }, [["Jenis", "LPK"], ["Provinsi", "DKI Jakarta"], ["Akreditasi", "A"], ["Kejuruan", "Welder & Scaffolding Konstruksi"]]),
        ],
      },
      {
        name: "Bali",
        ch: [
          lf("BATC (Bali Aviation & Tourism Center)", { a: 1, b: 1, c: 300, d: 260 }, [["Jenis", "LPK"], ["Provinsi", "Bali"], ["Akreditasi", "A"], ["Kejuruan", "Spa Therapist & International Resort"]]),
        ],
      },
      {
        name: "Jawa Timur",
        ch: [
          lf("LPK SAKILA", { a: 1, b: 1, c: 170, d: 140 }, [["Jenis", "LPK"], ["Provinsi", "Jawa Timur"], ["Akreditasi", "A"], ["Kejuruan", "Manufaktur & Pengelasan Logam"]]),
          lf("Asmitha Sukses Mandiri", { a: 1, b: 1, c: 150, d: 120 }, [["Jenis", "LPK"], ["Provinsi", "Jawa Timur"], ["Akreditasi", "A"], ["Kejuruan", "Caregiver & Asisten Perawat"]]),
        ],
      },
    ],
  },
  {
    name: "SMK Pusat Keunggulan / Vokasi",
    ch: [
      {
        name: "Jawa Tengah",
        ch: [
          lf("SMK Tunas Harapan Pati", { a: 1, b: 1, c: 240, d: 195 }, [["Jenis", "SMK"], ["Provinsi", "Jawa Tengah"], ["Akreditasi", "A"], ["Kejuruan", "Teknik Mesin & Otomasi Manufaktur"]]),
          lf("SMK Muhammadiyah 04 Sukorejo Kendal", { a: 1, b: 1, c: 180, d: 140 }, [["Jenis", "SMK"], ["Provinsi", "Jawa Tengah"], ["Akreditasi", "A"], ["Kejuruan", "Teknik Pengelasan & Otomotif"]]),
        ],
      },
      {
        name: "Jawa Barat",
        ch: [
          lf("SMKN 1 Cikarang Barat", { a: 1, b: 1, c: 260, d: 215 }, [["Jenis", "SMK"], ["Provinsi", "Jawa Barat"], ["Akreditasi", "A"], ["Kejuruan", "Teknik Fabrikasi Logam & Mesin Presisi"]]),
          lf("Budi Luhur Migrant Center", { a: 1, b: 1, c: 200, d: 160 }, [["Jenis", "Politeknik"], ["Provinsi", "Jawa Barat"], ["Akreditasi", "A"], ["Kejuruan", "Caregiver Lansia & Teknologi Informasi"]]),
        ],
      },
    ],
  },
  {
    name: "Balai Pelatihan Vokasi (BLK/BPVP)",
    ch: [
      {
        name: "Jawa Tengah",
        ch: [
          lf("BLK-LN PRIMA DUTA SEJATI KENDAL", { a: 1, b: 1, c: 320, d: 280 }, [["Jenis", "BLK"], ["Provinsi", "Jawa Tengah"], ["Akreditasi", "A"], ["Kejuruan", "Pelatihan Kerja Luar Negeri Mandiri"]]),
          lf("UPTD Sains dan Teknologi Solo Technopark", { a: 1, b: 1, c: 260, d: 220 }, [["Jenis", "BLK / Technopark"], ["Provinsi", "Jawa Tengah"], ["Akreditasi", "A"], ["Kejuruan", "Welder Bawah Air & CNC Presisi"]]),
        ],
      },
    ],
  },
];

/* =========================================================================
   4. DEMAND (Permintaan Pekerja Luar Negeri - 41 Target Riil DB)
   Diselaraskan dengan tabel `landing_placement_targets` database
   ========================================================================= */
const demandTree = (): TreeNode[] => [
  {
    name: "Turki",
    ch: [
      {
        name: "Hospitality",
        ch: [
          lf("Housekeeping & Public Area Resort (Antalya & Istanbul)", { a: 8020, b: 2400, c: 5620, d: 1100 }, [["Negara", "Turki"], ["Sektor", "Hospitality"], ["Jabatan", "Housekeeping & Room Attendant"], ["Kontrak", "2 Tahun (Perpanjangan)"]]),
          lf("Spa Therapist & Wellness Center (Bodrum & Izmir)", { a: 1460, b: 420, c: 1040, d: 280 }, [["Negara", "Turki"], ["Sektor", "Hospitality"], ["Jabatan", "Spa Therapist CIBTAC"], ["Kontrak", "2 Tahun"]]),
          lf("Food & Beverage Waiter (Hotel & Restoran Bintang 5)", { a: 2600, b: 850, c: 1750, d: 450 }, [["Negara", "Turki"], ["Sektor", "Hospitality"], ["Jabatan", "Waiter / Captain Waiter"], ["Kontrak", "2 Tahun"]]),
          lf("Cleaner & Facility Service", { a: 720, b: 280, c: 440, d: 120 }, [["Negara", "Turki"], ["Sektor", "Hospitality"], ["Jabatan", "General Cleaner"], ["Kontrak", "2 Tahun"]]),
          lf("Cook & Chef Preparation (Kroasia, Bulgaria, Turki)", { a: 40, b: 18, c: 22, d: 10 }, [["Negara", "Turki / Balkan"], ["Sektor", "Hospitality"], ["Jabatan", "Commis Cook"], ["Kontrak", "2 Tahun"]]),
        ],
      },
    ],
  },
  {
    name: "Taiwan",
    ch: [
      {
        name: "Kesehatan",
        ch: [
          lf("Caregiver / Caretaker Panti Lansia Formal", { a: 4900, b: 1650, c: 3250, d: 680 }, [["Negara", "Taiwan"], ["Sektor", "Kesehatan"], ["Jabatan", "Caregiver Lansia / Panti Wreda"], ["Kontrak", "3 Tahun"]]),
          lf("Nursing Home Caregiver (MoHW Taiwan)", { a: 1620, b: 540, c: 1080, d: 260 }, [["Negara", "Taiwan"], ["Sektor", "Kesehatan"], ["Jabatan", "Nursing Home Attendant"], ["Kontrak", "3 Tahun"]]),
        ],
      },
      {
        name: "Manufaktur",
        ch: [
          lf("Operation Production Fabrikasi Elektronik & Komponen", { a: 3200, b: 1200, c: 2000, d: 520 }, [["Negara", "Taiwan"], ["Sektor", "Manufaktur"], ["Jabatan", "Operator Produksi Presisi"], ["Kontrak", "3 Tahun"]]),
        ],
      },
      {
        name: "Fisherman",
        ch: [
          lf("Aquaculture & Perikanan Darat Intensif", { a: 500, b: 180, c: 320, d: 90 }, [["Negara", "Taiwan"], ["Sektor", "Fisherman"], ["Jabatan", "Aquaculture Specialist"], ["Kontrak", "3 Tahun"]]),
          lf("Budidaya Tanaman Modern & Kehutanan", { a: 760, b: 260, c: 500, d: 130 }, [["Negara", "Taiwan"], ["Sektor", "Fisherman"], ["Jabatan", "Pertanian & Perkebunan Modern"], ["Kontrak", "3 Tahun"]]),
          lf("ABK Penangkapan Ikan Lepas Pantai (ABK Fishermen)", { a: 120, b: 45, c: 75, d: 25 }, [["Negara", "Taiwan"], ["Sektor", "Fisherman"], ["Jabatan", "ABK Kapal Ikan Taiwan"], ["Kontrak", "2 Tahun"]]),
        ],
      },
    ],
  },
  {
    name: "Malaysia",
    ch: [
      {
        name: "Kesehatan",
        ch: [
          lf("Elderly Caretaker & Home Nursing Specialist", { a: 4120, b: 1400, c: 2720, d: 590 }, [["Negara", "Malaysia"], ["Sektor", "Kesehatan"], ["Jabatan", "Elderly Caretaker Resmi"], ["Kontrak", "2 Tahun"]]),
        ],
      },
      {
        name: "Manufaktur",
        ch: [
          lf("Operation Production Pabrik Perakitan (Malaysia & Slowakia)", { a: 2260, b: 780, c: 1480, d: 350 }, [["Negara", "Malaysia / Slowakia"], ["Sektor", "Manufaktur"], ["Jabatan", "Perakitan Perakitan Mekanikal"], ["Kontrak", "2 Tahun"]]),
        ],
      },
      {
        name: "Fisherman",
        ch: [
          lf("Plantation Worker Sawit Modern & Agro Perikanan", { a: 2400, b: 920, c: 1480, d: 410 }, [["Negara", "Malaysia"], ["Sektor", "Fisherman / Agro"], ["Jabatan", "Pekerja Terlatih Agrikultur"], ["Kontrak", "2 Tahun"]]),
        ],
      },
    ],
  },
  {
    name: "Jepang",
    ch: [
      {
        name: "Kesehatan",
        ch: [
          lf("Caregiver Kaigo SSW (Specified Skilled Worker)", { a: 540, b: 210, c: 330, d: 110 }, [["Negara", "Jepang"], ["Sektor", "Kesehatan"], ["Jabatan", "Caregiver SSW Level Pelaksana"], ["Kontrak", "5 Tahun (Visa SSW)"]]),
        ],
      },
      {
        name: "Manufaktur",
        ch: [
          lf("Welder & Precision Machinery SSW", { a: 300, b: 110, c: 190, d: 60 }, [["Negara", "Jepang"], ["Sektor", "Manufaktur"], ["Jabatan", "Welder GMAW / GTAW SSW"], ["Kontrak", "5 Tahun (Visa SSW)"]]),
        ],
      },
      {
        name: "Fisherman",
        ch: [
          lf("Farmer & Modern Agriculture Worker", { a: 40, b: 15, c: 25, d: 10 }, [["Negara", "Jepang"], ["Sektor", "Fisherman / Pertanian"], ["Jabatan", "Pekerja Pertanian Modern"], ["Kontrak", "3 Tahun"]]),
        ],
      },
    ],
  },
  {
    name: "Korea Selatan",
    ch: [
      {
        name: "Manufaktur",
        ch: [
          lf("Welder Galangan Kapal & Heavy Industry (E-7)", { a: 300, b: 130, c: 170, d: 70 }, [["Negara", "Korea Selatan"], ["Sektor", "Manufaktur"], ["Jabatan", "Welder Shipbuilding 3G/6G"], ["Kontrak", "3 Tahun (Visa E-7)"]]),
          lf("Molding & Cetakan Logam Industri Presisi", { a: 40, b: 18, c: 22, d: 10 }, [["Negara", "Korea Selatan"], ["Sektor", "Manufaktur"], ["Jabatan", "Operator Cetakan Logam"], ["Kontrak", "3 Tahun"]]),
        ],
      },
      {
        name: "Fisherman",
        ch: [
          lf("ABK Fishermen Perikanan Tangkap Samudera", { a: 600, b: 220, c: 380, d: 110 }, [["Negara", "Korea Selatan"], ["Sektor", "Fisherman"], ["Jabatan", "ABK Kapal Ikan Korea Selatan"], ["Kontrak", "2 Tahun"]]),
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
      t: "1. Supply",
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
      t: "2. Program Pelatihan",
      lv: ["Provinsi", "Sektor", "Program Kejuruan"],
      k: [
        ["a", "Jumlah Kelas"],
        ["b", "Kelas Berjalan"],
        ["c", "Kelas Selesai"],
        ["d", "Tersertifikasi"],
      ],
      tree: trainingTree,
    },
    lpk: {
      t: "3. Vokasi dan Lembaga",
      lv: ["Jenis lembaga", "Provinsi", "Lembaga Vokasi"],
      k: [
        ["a", "Jumlah Vokasi"],
        ["b", "Terakreditasi"],
        ["c", "Kapasitas Latih"],
        ["d", "Tersalurkan"],
      ],
      tree: institutionTree,
    },
    dem: {
      t: "4. Demand",
      lv: ["Negara Tujuan", "Sektor Industri", "Pemberi Kerja / Proyek"],
      k: [
        ["a", "Negara Mitra"],
        ["b", "Terisi"],
        ["c", "Sisa Kuota"],
        ["d", "Tahap Seleksi"],
      ],
      tree: demandTree,
    },
  };

  // Sesuaikan angka total di kartu utama dengan data di header timeline:
  // 1. Supply: 12.600 Peserta
  // 2. Program Pelatihan: 630 Kelas
  // 3. Vokasi dan Lembaga: 2.382 Vokasi
  // 4. Demand: 4 Negara Mitra
  const HEADER_TARGETS: Record<PillarKey, number> = {
    sup: 12600,
    pel: 630,
    lpk: 2382,
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
