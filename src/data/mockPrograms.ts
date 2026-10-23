import { TrainingProgram } from '../types';

export const mockPrograms: TrainingProgram[] = [
  {
    id: "PROG-JPN-01",
    title: "Pelatihan Terpadu SSW Kaigo / Caregiver Jepang",
    programType: "Teknis Terpadu",
    targetSector: "Kesehatan & Perawatan Lansia",
    targetJobRole: "Caregiver / Kaigo",
    targetCountry: "Jepang",
    durationJP: 360,
    certificationTarget: "Sertifikasi SSW Tokutei Ginou Kaigo + JLPT N4",
    estimatedCostPerParticipant: 14500000,
    quota: 40,
    enrolledCount: 28,
    scheduleStart: "2026-11-10",
    scheduleEnd: "2027-02-15",
    curriculumOutline: [
      "Bahasa Jepang Medis & Keperawatan (N4/JFT-Basic)",
      "Standard Etika & Kebudayaan Kerja Rumah Sakit/Panti Jepang",
      "Keterampilan Praktik Mobilisasi & Bed-making Standard Kaigo",
      "Pencegahan Infeksi, Higienitas, & Pemantauan Tanda Vital",
      "Simulasi Ujian Computer Based Testing (CBT) SSW Kaigo"
    ]
  },
  {
    id: "PROG-JPN-02",
    title: "Upskilling Welder 3G/4G & Bahasa Jepang Manufaktur",
    programType: "Upskilling",
    targetSector: "Industri Manufaktur & Fabrikasi",
    targetJobRole: "Welder",
    targetCountry: "Jepang",
    durationJP: 300,
    certificationTarget: "Sertifikasi BNSP 3G/4G GMAW + SSW Tokutei Ginou Seizo",
    estimatedCostPerParticipant: 16800000,
    quota: 30,
    enrolledCount: 22,
    scheduleStart: "2026-11-15",
    scheduleEnd: "2027-01-30",
    curriculumOutline: [
      "Teknik Pengelasan Lanjut GMAW & GTAW Plat/Pipa",
      "Pembacaan Gambar Teknik (Blue Print) Standard JIS",
      "Keselamatan & Kesehatan Kerja Manufaktur Jepang (5S & K3)",
      "Bahasa Jepang Teknis Industri Logam (Vocabulary JIS)",
      "Persiapan Tes Keterampilan Praktik Tokutei Ginou"
    ]
  },
  {
    id: "PROG-GER-01",
    title: "Persiapan Duales Ausbildung Hotelfachmann/frau Jerman",
    programType: "Teknis Terpadu",
    targetSector: "Perhotelan & Pariwisata",
    targetJobRole: "Hotel Specialist (Ausbildung)",
    targetCountry: "Jerman",
    durationJP: 400,
    certificationTarget: "Goethe-Zertifikat B1 Deutsch + DIHK Vorbereitung",
    estimatedCostPerParticipant: 18500000,
    quota: 25,
    enrolledCount: 19,
    scheduleStart: "2026-12-01",
    scheduleEnd: "2027-04-15",
    curriculumOutline: [
      "Intensif Bahasa Jerman Perhotelan dari Level A2 ke B1",
      "Etika & Budaya Pelayanan Standard Hotel Bintang Jerman",
      "Front Office System & Housekeeping Excellence Standard DIN",
      "Food & Beverage Service and Table Etiquette",
      "Simulasi Wawancara Kontrak Kerja Ausbildung & Dokumen Visa"
    ]
  },
  {
    id: "PROG-KOR-01",
    title: "Akselerasi Pengelasan Galangan Kapal E-7 Korea Selatan",
    programType: "Upskilling",
    targetSector: "Industri Perkapalan & Galangan",
    targetJobRole: "Shipbuilding Welder",
    targetCountry: "Korea",
    durationJP: 320,
    certificationTarget: "Sertifikat International Welder ISO 9606-1 + EPS-TOPIK",
    estimatedCostPerParticipant: 17200000,
    quota: 35,
    enrolledCount: 20,
    scheduleStart: "2026-11-20",
    scheduleEnd: "2027-02-28",
    curriculumOutline: [
      "Pengelasan Posisi 3G/4G/6G FCAW & GMAW Heavy Duty",
      "Standarisasi Galangan Kapal Korea (Hyundai/Samsung Heavy Std)",
      "Bahasa Korea Dasar & Kosakata Galangan Kapal",
      "K3 Konstruksi Berat Maritim & Ergonomi Kerja",
      "Simulasi Tes Pengelasan Visa E-7 oleh Asosiasi KOSHIPA"
    ]
  },
  {
    id: "PROG-TWN-01",
    title: "Pelatihan Operator Manufaktur Elektronika Taiwan (SMT)",
    programType: "Reskilling",
    targetSector: "Elektronika & Semikonduktor",
    targetJobRole: "Electronics Manufacturing Technician",
    targetCountry: "Taiwan",
    durationJP: 240,
    certificationTarget: "Sertifikasi Kompetensi Operator SMT + TOCFL A2 Mandarin",
    estimatedCostPerParticipant: 12000000,
    quota: 50,
    enrolledCount: 15,
    scheduleStart: "2026-12-10",
    scheduleEnd: "2027-02-10",
    curriculumOutline: [
      "Pengoperasian Mesin Surface Mount Technology (SMT)",
      "Inspeksi Kualitas Optik (AOI) dan Soldering Standar IPC-A-610",
      "Bahasa Mandarin Praktis untuk Manufaktur Pabrik",
      "Prosedur Cleanroom & Keselamatan Kerja Listrik Statis (ESD)",
      "Regulasi Ketenagakerjaan dan Adaptasi Budaya Taiwan"
    ]
  },
  {
    id: "PROG-LANG-01",
    title: "Intensif Bahasa Jepang Bisnis & Manufaktur (N5 ke N4)",
    programType: "Pelatihan Bahasa",
    targetSector: "Lintas Sektor",
    targetJobRole: "Umum / All Roles",
    targetCountry: "Jepang",
    durationJP: 200,
    certificationTarget: "Sertifikat Kelulusan JLPT N4 / JFT-Basic A2",
    estimatedCostPerParticipant: 6500000,
    quota: 60,
    enrolledCount: 45,
    scheduleStart: "2026-11-05",
    scheduleEnd: "2027-01-15",
    curriculumOutline: [
      "Tata Bahasa Dasar Bab 1 - 25 Minna no Nihongo",
      "Penguasaan 300 Huruf Kanji & 1.500 Kosakata Harian",
      "Kemampuan Mendengarkan (Choukai) & Percakapan Praktis (Kaiwa)",
      "Latihan Try-Out Komputer Ujian JFT-Basic A2"
    ]
  }
];
