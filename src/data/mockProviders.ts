import { VocationalProvider } from '../types';

export const mockProviders: VocationalProvider[] = [
  {
    id: "VOC-JBR-001",
    name: "Balai Besar Pelatihan Vokasi dan Produktivitas (BBPVP) Bandung",
    providerType: "BLK",
    provinsi: "Jawa Barat",
    kabupatenKota: "Kota Bandung",
    evokasiVerificationStatus: "Terverifikasi e-Vokasi",
    accreditation: "Unggul",
    capacityPerBatch: 120,
    certifiedInstructorsCount: 24,
    facilities: [
      "Workshop CNC & Manufaktur Presisi Standar Industri",
      "Lab Pengelasan Multiguna (SMAW, GMAW, GTAW, FCAW)",
      "Smart Language Laboratory Berbasis Komputer",
      "Asrama Peserta Berkapasitas 250 Orang",
      "Pusat Sertifikasi Uji Kompetensi BNSP Terlisensi"
    ],
    supportedSectors: ["Industri Manufaktur", "Pengelasan Logam", "Otomotif & Mekatronika"],
    operationalReadinessScore: 96
  },
  {
    id: "VOC-JTG-002",
    name: "SMK Negeri 7 Semarang (STM Pembangunan)",
    providerType: "SMK",
    provinsi: "Jawa Tengah",
    kabupatenKota: "Kota Semarang",
    evokasiVerificationStatus: "Terverifikasi e-Vokasi",
    accreditation: "A",
    capacityPerBatch: 80,
    certifiedInstructorsCount: 18,
    facilities: [
      "Laboratorium Robotika & Otomasi PLC",
      "Bengkel Fabrikasi & Konstruksi Baja",
      "Teaching Factory Terakreditasi Standar Industri",
      "Lab Komputer CBT Uji Bahasa Asing"
    ],
    supportedSectors: ["Mekatronika", "Konstruksi Gedung", "Teknik Mesin & Otomasi"],
    operationalReadinessScore: 92
  },
  {
    id: "VOC-JTM-003",
    name: "LPK Global Nusantara Surabaya",
    providerType: "LPK",
    provinsi: "Jawa Timur",
    kabupatenKota: "Kota Surabaya",
    evokasiVerificationStatus: "Terverifikasi e-Vokasi",
    accreditation: "Unggul",
    capacityPerBatch: 60,
    certifiedInstructorsCount: 14,
    facilities: [
      "Simulasi Ruang Pasien Standar Panti Jompo Jepang (Kaigo Room)",
      "Peralatan Bed Mobilization & Kursi Roda Elektrik",
      "Dojo Bahasa & Budaya Jepang",
      "Ruang Praktik Simulasi Wawancara Online"
    ],
    supportedSectors: ["Kesehatan & Perawatan Lansia (Caregiver)", "Hospitality"],
    operationalReadinessScore: 89
  },
  {
    id: "VOC-BLI-004",
    name: "Politeknik Pariwisata Bali",
    providerType: "Perguruan Tinggi / Politeknik",
    provinsi: "Bali",
    kabupatenKota: "Kabupaten Badung",
    evokasiVerificationStatus: "Terverifikasi e-Vokasi",
    accreditation: "Unggul",
    capacityPerBatch: 90,
    certifiedInstructorsCount: 22,
    facilities: [
      "Hotel Praktik Bintang 4 (Mock-up Hotel)",
      "Standard Commercial Kitchen & Bakery Lab",
      "Lab Bahasa Multimedia (Jerman & Inggris)",
      "Auditorium Standard Conference Internasional"
    ],
    supportedSectors: ["Perhotelan & Pariwisata", "Tata Boga & Kuliner"],
    operationalReadinessScore: 94
  },
  {
    id: "VOC-SLS-005",
    name: "SMK Negeri 5 Makassar",
    providerType: "SMK",
    provinsi: "Sulawesi Selatan",
    kabupatenKota: "Kota Makassar",
    evokasiVerificationStatus: "Proses Verifikasi",
    accreditation: "B",
    capacityPerBatch: 50,
    certifiedInstructorsCount: 9,
    facilities: [
      "Bengkel Otomotif Roda 4 & Roda 2",
      "Workshop Las Dasar SMAW",
      "Ruang Teori Ber-AC & Proyektor Interaktif"
    ],
    supportedSectors: ["Teknik Otomotif", "Pengelasan Dasar"],
    operationalReadinessScore: 74
  },
  {
    id: "VOC-ACH-006",
    name: "BLK Banda Aceh",
    providerType: "BLK",
    provinsi: "Aceh",
    kabupatenKota: "Kota Banda Aceh",
    evokasiVerificationStatus: "Terverifikasi e-Vokasi",
    accreditation: "Baik Sekali",
    capacityPerBatch: 70,
    certifiedInstructorsCount: 12,
    facilities: [
      "Workshop Mesin Bubut & Perkakas",
      "Lab Desain Grafis & Multimedia",
      "Lab Bahasa Dasar Komprehensif"
    ],
    supportedSectors: ["Perhotelan", "Manufaktur Ringan", "Teknologi Informasi"],
    operationalReadinessScore: 82
  }
];
