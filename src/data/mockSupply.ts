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
    sourceType: "SMK / Pendidikan Vokasi",
    major: "Teknik Otomotif & Mesin",
    skills: ["CNC Turning", "Milling Operation", "Precision Measuring Tools", "Automotive Troubleshooting"],
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
    sourceType: "Disnaker Pemda",
    major: "Asisten Keperawatan",
    skills: ["Bed Mobilization", "Dementia Patient Protocol", "Rehabilitation Support", "Nutrition Feeding"],
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
