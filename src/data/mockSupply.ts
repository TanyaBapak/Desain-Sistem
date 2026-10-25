import { CandidateParticipant } from '../types';

export const mockSupply: CandidateParticipant[] = [
  {
    id: "CAND-2026-001",
    nik: "3201082504******",
    fullName: "Ahmad Fauzi Pratama",
    gender: "L",
    provinsi: "Jawa Barat",
    kabupatenKota: "Kabupaten Bogor",
    educationLevel: "SMK",
    institutionName: "SMKN 1 Cibinong",
    sourceType: "Disnaker Pemda",
    major: "Teknik Pengelasan",
    skills: ["Arc Welding", "GMAW", "Safety Standard (K3)", "Blue Print Reading"],
    workExperiences: [
      {
        sector: "Manufaktur & Pengelasan",
        role: "Welder Junior & Praktik Industri",
        durationYears: 1.5,
        companyName: "PT Komatsu Undercarriage Indonesia",
        description: "Melakukan pengelasan struktur baja alat berat dengan standar ISO 9606-1."
      }
    ],
    certifications: [
      {
        name: "Sertifikasi Welder 3G Plate (SMAW/GMAW)",
        issuer: "BNSP / LSP Las Indonesia",
        issueYear: 2025,
        validUntil: "2028-10-15"
      }
    ],
    preferredSectors: ["Manufaktur & Konstruksi"],
    languageProficiency: [
      { language: "Jepang", level: "JLPT N4" },
      { language: "Inggris", level: "Basic" }
    ],
    preferredCountry: ["Jepang", "Korea"],
    preferredJobRole: ["Welder", "Metal Fabricator"],
    readinessStatus: "Ready for Placement",
    verificationStatus: "Verified"
  },
  {
    id: "CAND-2026-002",
    nik: "3302196008******",
    fullName: "Siti Nurhaliza Rahayu",
    gender: "P",
    provinsi: "Jawa Tengah",
    kabupatenKota: "Kabupaten Banyumas",
    educationLevel: "SMK",
    institutionName: "SMK Kesehatan Bakti Husada Purwokerto",
    sourceType: "SMK / Pendidikan Vokasi",
    major: "Keperawatan / Caregiver",
    skills: ["Elderly Care", "Vital Sign Check", "Hygiene Assistance", "Patient Mobilization", "Basic First Aid"],
    workExperiences: [
      {
        sector: "Kesehatan & Caregiver",
        role: "Asisten Perawat Lansia (Magang OJT)",
        durationYears: 1.0,
        companyName: "Panti Sosial Tresna Werdha Banyumas",
        description: "Pendampingan mobilitas harian lansia, pemantauan tanda vital, dan rehabilitasi fisik ringan."
      }
    ],
    certifications: [
      {
        name: "SSW Tokutei Ginou 1 - Caregiver (Kaigo)",
        issuer: "Prometric Japan / MHLW",
        issueYear: 2025,
        validUntil: "2030-05-20"
      },
      {
        name: "Sertifikat Asisten Tenaga Kesehatan",
        issuer: "BNSP / LSP Asnakes",
        issueYear: 2024,
        validUntil: "2027-08-10"
      }
    ],
    preferredSectors: ["Kesehatan & Caregiver"],
    languageProficiency: [
      { language: "Jepang", level: "JLPT N4" }
    ],
    preferredCountry: ["Jepang"],
    preferredJobRole: ["Caregiver / Kaigo"],
    readinessStatus: "Ready for Placement",
    verificationStatus: "Verified"
  },
  {
    id: "CAND-2026-003",
    nik: "3578011203******",
    fullName: "Budi Santoso",
    gender: "L",
    provinsi: "Jawa Timur",
    kabupatenKota: "Kota Surabaya",
    educationLevel: "D3",
    institutionName: "Politeknik Elektronika Negeri Surabaya (PENS)",
    sourceType: "Lembaga Vokasi",
    major: "Mekatronika & Otomasi Industri",
    skills: ["PLC Programming", "Hydraulics & Pneumatics", "Industrial Automation", "Electrical Maintenance"],
    workExperiences: [
      {
        sector: "Otomasi & Elektronika",
        role: "Maintenance Technician Magang",
        durationYears: 2.0,
        companyName: "PT Panasonic Industrial Devices Batam",
        description: "Pemeliharaan preventif lini perakitan otomatis dan troubleshooting PLC Siemens."
      }
    ],
    certifications: [
      {
        name: "Sertifikasi Pemrograman PLC Tingkat Madya",
        issuer: "BNSP / LSP Mekatronika",
        issueYear: 2024,
        validUntil: "2027-11-30"
      }
    ],
    preferredSectors: ["Manufaktur & Otomasi"],
    languageProficiency: [
      { language: "Jepang", level: "Basic" },
      { language: "Inggris", level: "TOEIC 650" }
    ],
    preferredCountry: ["Jepang", "Jerman"],
    preferredJobRole: ["Mechatronics Technician", "Machine Operator"],
    readinessStatus: "Needs Upskilling",
    verificationStatus: "Verified"
  },
  {
    id: "CAND-2026-004",
    nik: "3275034509******",
    fullName: "Dewi Lestari",
    gender: "P",
    provinsi: "Jawa Barat",
    kabupatenKota: "Kota Bekasi",
    educationLevel: "SMK",
    institutionName: "SMKN 2 Kota Bekasi",
    sourceType: "Disnaker Pemda",
    major: "Tata Boga & Kuliner",
    skills: ["Food Sanitation HACCP", "Western Cuisine", "Bakery Preparation", "Commercial Kitchen Safety"],
    workExperiences: [
      {
        sector: "Hospitality & Kuliner",
        role: "Commis Cook Magang",
        durationYears: 0.8,
        companyName: "Hotel Horison Ultima Bekasi",
        description: "Membantu persiapan mise en place dapur banquet dan pengawasan higienitas HACCP."
      }
    ],
    certifications: [
      {
        name: "Sertifikasi Higiene Sanitasi Makanan (HACCP)",
        issuer: "LSP Pariwisata & Kemenkes RI",
        issueYear: 2025,
        validUntil: "2028-02-14"
      }
    ],
    preferredSectors: ["Hospitality & Pariwisata"],
    languageProficiency: [
      { language: "Inggris", level: "Intermediate" },
      { language: "Jerman", level: "Basic" }
    ],
    preferredCountry: ["Jerman", "Inggris"],
    preferredJobRole: ["Cook Assistant", "Food Preparation"],
    readinessStatus: "Needs Upskilling",
    verificationStatus: "Pending Verification"
  },
  {
    id: "CAND-2026-005",
    nik: "3174052307******",
    fullName: "Rizky Ramadhan",
    gender: "L",
    provinsi: "DKI Jakarta",
    kabupatenKota: "Jakarta Selatan",
    educationLevel: "SMK",
    institutionName: "SMK Negeri 26 Jakarta",
    sourceType: "Gardata / SIPPMI",
    major: "Teknik Otomotif & Mesin",
    skills: ["CNC Turning", "Milling Operation", "Precision Measuring Tools", "Automotive Troubleshooting"],
    workExperiences: [
      {
        sector: "Manufaktur & Permesinan",
        role: "Operator Bubut & Milling CNC",
        durationYears: 1.2,
        companyName: "Bengkel Presisi Gardata Diklat CPMI",
        description: "Pengoperasian mesin perkakas presisi untuk komponen otomotif sesuai standar JIS Jepang."
      }
    ],
    certifications: [
      {
        name: "SSW Tokutei Ginou - Machine Parts & Tooling",
        issuer: "Javada Japan",
        issueYear: 2025,
        validUntil: "2030-01-10"
      }
    ],
    preferredSectors: ["Manufaktur & Permesinan"],
    languageProficiency: [
      { language: "Jepang", level: "JLPT N5" },
      { language: "Inggris", level: "Basic" }
    ],
    preferredCountry: ["Jepang"],
    preferredJobRole: ["CNC Operator", "Machinist"],
    readinessStatus: "Needs Upskilling",
    verificationStatus: "Verified"
  },
  {
    id: "CAND-2026-006",
    nik: "3374026511******",
    fullName: "Rina Wulandari",
    gender: "P",
    provinsi: "Jawa Tengah",
    kabupatenKota: "Kota Semarang",
    educationLevel: "SMK",
    institutionName: "SMK Negeri 7 Semarang",
    sourceType: "SMK / Pendidikan Vokasi",
    major: "Elektronika Industri",
    skills: ["Soldering & Desoldering", "PCB Layout Inspection", "Quality Control Electronics", "ESD Safety"],
    workExperiences: [
      {
        sector: "Elektronika & Semikonduktor",
        role: "Operator QC Perakitan PCB (PKL)",
        durationYears: 0.5,
        companyName: "PT Hartono Istana Teknologi (Polytron)",
        description: "Inspeksi visual komponen SMT dan uji kontinuitas rangkaian audio-video."
      }
    ],
    certifications: [
      {
        name: "Sertifikasi Teknisi Audio-Video & SMT",
        issuer: "BNSP / LSP Elektronika",
        issueYear: 2024,
        validUntil: "2027-04-12"
      }
    ],
    preferredSectors: ["Elektronika & Semikonduktor"],
    languageProficiency: [
      { language: "Jepang", level: "Basic" },
      { language: "Korea", level: "Basic" }
    ],
    preferredCountry: ["Korea", "Jepang"],
    preferredJobRole: ["Electronics Assembler", "Quality Inspector"],
    readinessStatus: "Needs Reskilling",
    verificationStatus: "Pending Verification"
  },
  {
    id: "CAND-2026-007",
    nik: "5103011905******",
    fullName: "I Wayan Suastika",
    gender: "L",
    provinsi: "Bali",
    kabupatenKota: "Kabupaten Badung",
    educationLevel: "D3",
    institutionName: "Politeknik Pariwisata Bali",
    sourceType: "Lembaga Vokasi",
    major: "Perhotelan & Pariwisata",
    skills: ["Housekeeping Management", "Front Desk Operation", "Customer Hospitality", "Opera PMS System"],
    workExperiences: [
      {
        sector: "Hospitality & Perhotelan",
        role: "Guest Service Agent Senior",
        durationYears: 2.5,
        companyName: "The Westin Resort Nusa Dua Bali",
        description: "Menangani check-in/out tamu internasional VIP, reservasi sistem Opera, dan penanganan keluhan tamu."
      }
    ],
    certifications: [
      {
        name: "Sertifikasi Front Office Supervisor",
        issuer: "BNSP / LSP Pariwisata Bali",
        issueYear: 2024,
        validUntil: "2027-09-18"
      },
      {
        name: "Goethe-Zertifikat A2 Deutsch",
        issuer: "Goethe-Institut Indonesien",
        issueYear: 2025,
        validUntil: "2030-12-31"
      }
    ],
    preferredSectors: ["Hospitality & Pariwisata"],
    languageProficiency: [
      { language: "Inggris", level: "Fluent" },
      { language: "Jerman", level: "A2" }
    ],
    preferredCountry: ["Jerman", "Jepang"],
    preferredJobRole: ["Hotel Front Desk", "Guest Service Agent"],
    readinessStatus: "Ready for Placement",
    verificationStatus: "Verified"
  },
  {
    id: "CAND-2026-008",
    nik: "7371100912******",
    fullName: "Muh. Ilham Syahputra",
    gender: "L",
    provinsi: "Sulawesi Selatan",
    kabupatenKota: "Kota Makassar",
    educationLevel: "SMK",
    institutionName: "SMK Negeri 5 Makassar",
    sourceType: "Disnaker Pemda",
    major: "Teknik Konstruksi Bangunan",
    skills: ["Scaffolding Assembly", "Reinforced Concrete Work", "Architectural Blueprint", "High Altitude Safety"],
    workExperiences: [
      {
        sector: "Konstruksi & Bangunan",
        role: "Tukang Besi & Perancah (Magang)",
        durationYears: 0.6,
        companyName: "PT Wijaya Karya (Proyek Bendungan Sulsel)",
        description: "Pemasangan perancah scaffolding bersertifikat K3 dan perakitan besi tulangan beton."
      }
    ],
    certifications: [],
    preferredSectors: ["Konstruksi Sipil & Bangunan"],
    languageProficiency: [
      { language: "Jepang", level: "Basic" },
      { language: "Korea", level: "Basic" }
    ],
    preferredCountry: ["Korea", "Jepang"],
    preferredJobRole: ["Construction Worker", "Scaffolder"],
    readinessStatus: "Needs Reskilling",
    verificationStatus: "Unverified"
  },
  {
    id: "CAND-2026-009",
    nik: "3204122108******",
    fullName: "Fitri Handayani",
    gender: "P",
    provinsi: "Jawa Barat",
    kabupatenKota: "Kabupaten Bandung",
    educationLevel: "SMK",
    institutionName: "SMK Kesehatan Bhakti Kencana Bandung",
    sourceType: "Gardata / SIPPMI",
    major: "Asisten Keperawatan",
    skills: ["Bed Mobilization", "Dementia Patient Protocol", "Rehabilitation Support", "Nutrition Feeding"],
    workExperiences: [
      {
        sector: "Kesehatan & Caregiver",
        role: "Perawat Pendamping Home Care",
        durationYears: 1.8,
        companyName: "Klinik Pratama & Diklat Caregiver Gardata",
        description: "Perawatan pasien pasca stroke, pemantauan asupan gizi parenteral, dan senam rehabilitasi lansia."
      }
    ],
    certifications: [
      {
        name: "SSW Tokutei Ginou Kaigo / Caregiver",
        issuer: "Prometric Japan",
        issueYear: 2025,
        validUntil: "2030-03-15"
      },
      {
        name: "Japanese Language NAT-TEST 4Q (Setara N4)",
        issuer: "Senmon Kyouiku Publishing",
        issueYear: 2025,
        validUntil: "2029-06-30"
      }
    ],
    preferredSectors: ["Kesehatan & Caregiver"],
    languageProficiency: [
      { language: "Jepang", level: "JLPT N4" }
    ],
    preferredCountry: ["Jepang"],
    preferredJobRole: ["Caregiver / Kaigo"],
    readinessStatus: "Ready for Placement",
    verificationStatus: "Verified"
  },
  {
    id: "CAND-2026-010",
    nik: "3515081404******",
    fullName: "Dimas Arya Wijaya",
    gender: "L",
    provinsi: "Jawa Timur",
    kabupatenKota: "Kabupaten Sidoarjo",
    educationLevel: "SMK",
    institutionName: "SMKN 1 Sidoarjo",
    sourceType: "SMK / Pendidikan Vokasi",
    major: "Teknik Pengelasan",
    skills: ["SMAW 3G Position", "GTAW Tube Welding", "NDT Visual Inspection", "Oxy-Fuel Cutting"],
    workExperiences: [
      {
        sector: "Manufaktur & Pengelasan",
        role: "Welder Fitter",
        durationYears: 1.0,
        companyName: "PT PAL Indonesia (Persero)",
        description: "Pengelasan pelat lambung kapal niaga dengan elektroda E7018 dan pemotongan oksi-asetilin."
      }
    ],
    certifications: [
      {
        name: "Sertifikasi Juru Las 3G SMAW Plat",
        issuer: "BNSP / BKI (Biro Klasifikasi Indonesia)",
        issueYear: 2024,
        validUntil: "2027-05-19"
      }
    ],
    preferredSectors: ["Manufaktur & Perkapalan"],
    languageProficiency: [
      { language: "Jepang", level: "Basic" },
      { language: "Inggris", level: "Basic" }
    ],
    preferredCountry: ["Jepang", "Korea"],
    preferredJobRole: ["Welder", "Pipe Welder"],
    readinessStatus: "Needs Upskilling",
    verificationStatus: "Verified"
  },
  {
    id: "CAND-2026-011",
    nik: "1171010309******",
    fullName: "Cut Meutia Zahra",
    gender: "P",
    provinsi: "Aceh",
    kabupatenKota: "Kota Banda Aceh",
    educationLevel: "SMK",
    institutionName: "SMK Negeri 1 Banda Aceh",
    sourceType: "Lembaga Vokasi",
    major: "Tata Busana & Tekstil",
    skills: ["Industrial Sewing Machine", "Garment Pattern Making", "Fabric Quality Inspection"],
    workExperiences: [
      {
        sector: "Garmen & Tekstil",
        role: "Operator Jahit Garmen Ekspor",
        durationYears: 0.7,
        companyName: "CV Serambi Mode Banda Aceh",
        description: "Penjahitan seragam standar industri konveksi dengan mesin jahit kecepatan tinggi (high-speed)."
      }
    ],
    certifications: [
      {
        name: "Sertifikasi Operator Mesin Jahit Industri (Garment)",
        issuer: "BNSP / LSP Garmen Tekstil",
        issueYear: 2025,
        validUntil: "2028-01-20"
      }
    ],
    preferredSectors: ["Garmen & Manufaktur Tekstil"],
    languageProficiency: [
      { language: "Inggris", level: "Intermediate" }
    ],
    preferredCountry: ["Korea", "Jepang"],
    preferredJobRole: ["Garment Operator", "Textile Technician"],
    readinessStatus: "Needs Reskilling",
    verificationStatus: "Pending Verification"
  },
  {
    id: "CAND-2026-012",
    nik: "3201083011******",
    fullName: "Hendra Gunawan",
    gender: "L",
    provinsi: "Jawa Barat",
    kabupatenKota: "Kabupaten Bogor",
    educationLevel: "SMK",
    institutionName: "SMK Bina Mandiri Bogor",
    sourceType: "Disnaker Pemda",
    major: "Teknik Mekatronika",
    skills: ["PLC Siemens S7-1200", "Sensors & Actuators", "Pneumatic Circuit", "Wiring Diagram"],
    workExperiences: [
      {
        sector: "Otomasi & Manufaktur",
        role: "Teknisi Kontrol & Wiring Panel",
        durationYears: 1.1,
        companyName: "PT Indo Kordsa Tbk Citeureup",
        description: "Pemasangan wiring kabinet kontrol industri, integrasi sensor optik, dan pengujian pneumatik."
      }
    ],
    certifications: [
      {
        name: "Sertifikasi K3 Listrik & Otomasi Industri",
        issuer: "BNSP / LSP K3 Nasional",
        issueYear: 2025,
        validUntil: "2028-09-02"
      }
    ],
    preferredSectors: ["Manufaktur & Otomasi"],
    languageProficiency: [
      { language: "Jepang", level: "Basic" },
      { language: "Inggris", level: "Intermediate" }
    ],
    preferredCountry: ["Jepang", "Jerman"],
    preferredJobRole: ["Mechatronics Technician", "Maintenance Tech"],
    readinessStatus: "Needs Upskilling",
    verificationStatus: "Verified"
  }
];
