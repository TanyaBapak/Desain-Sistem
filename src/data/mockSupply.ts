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
    nik: "1111054302******",
    fullName: "Cut Intan Permatasari",
    gender: "P",
    provinsi: "Aceh",
    kabupatenKota: "Kabupaten Bireuen",
    educationLevel: "SMK",
    institutionName: "SMKN 1 Gandapura",
    major: "Perhotelan & Pariwisata",
    skills: ["Front Office Operation", "Housekeeping", "Customer Service", "Food & Beverage Service"],
    languageProficiency: [
      { language: "Jerman", level: "A2" },
      { language: "Inggris", level: "Intermediate" }
    ],
    preferredCountry: ["Jerman"],
    preferredJobRole: ["Hotel Specialist (Ausbildung)", "Restaurant Specialist"],
    readinessStatus: "Ready for Placement",
    verificationStatus: "Verified"
  },
  {
    id: "CAND-2026-005",
    nik: "7371101905******",
    fullName: "Muhammad Rizky Ramadhan",
    gender: "L",
    provinsi: "Sulawesi Selatan",
    kabupatenKota: "Kota Makassar",
    educationLevel: "SMK",
    institutionName: "SMK Negeri 5 Makassar",
    major: "Teknik Otomotif & Mesin",
    skills: ["Engine Overhaul", "Chassis Maintenance", "Brake System", "TIG Welding"],
    languageProficiency: [
      { language: "Korea", level: "Basic" }
    ],
    preferredCountry: ["Korea"],
    preferredJobRole: ["Shipbuilding Welder", "Automotive Assembly"],
    readinessStatus: "Needs Upskilling",
    verificationStatus: "Verified"
  },
  {
    id: "CAND-2026-006",
    nik: "5103045607******",
    fullName: "Ni Made Ayu Lestari",
    gender: "P",
    provinsi: "Bali",
    kabupatenKota: "Kabupaten Badung",
    educationLevel: "D3",
    institutionName: "Politeknik Pariwisata Bali",
    major: "Manajemen Perhotelan",
    skills: ["Guest Relationship", "Hospitality Management", "Culinary Operations", "Safety Standard (K3)"],
    languageProficiency: [
      { language: "Jerman", level: "A1" },
      { language: "Inggris", level: "TOEIC 780" }
    ],
    preferredCountry: ["Jerman"],
    preferredJobRole: ["Hotel Specialist (Ausbildung)"],
    readinessStatus: "Needs Upskilling",
    verificationStatus: "Verified"
  },
  {
    id: "CAND-2026-007",
    nik: "3174092101******",
    fullName: "Rendra Kurniawan",
    gender: "L",
    provinsi: "DKI Jakarta",
    kabupatenKota: "Jakarta Selatan",
    educationLevel: "SMK",
    institutionName: "SMKN 26 Jakarta",
    major: "Teknik Ketenagalistrikan & Manufaktur",
    skills: ["Wiring Installation", "SMT Operation", "Quality Inspection", "Safety Standard (K3)"],
    languageProficiency: [
      { language: "Mandarin", level: "Basic" },
      { language: "Inggris", level: "Basic" }
    ],
    preferredCountry: ["Taiwan", "Jepang"],
    preferredJobRole: ["Electronics Manufacturing Technician", "Machine Operator"],
    readinessStatus: "Needs Upskilling",
    verificationStatus: "Pending Verification"
  },
  {
    id: "CAND-2026-008",
    nik: "3273016509******",
    fullName: "Dewi Anggraini",
    gender: "P",
    provinsi: "Jawa Barat",
    kabupatenKota: "Kota Bandung",
    educationLevel: "S1",
    institutionName: "Universitas Padjadjaran",
    major: "Ilmu Keperawatan (Ners)",
    skills: ["Elderly Care", "Medical Records", "Medication Administration", "Vital Sign Check", "Hygiene Assistance"],
    languageProficiency: [
      { language: "Jerman", level: "B1" },
      { language: "Inggris", level: "TOEIC 700" }
    ],
    preferredCountry: ["Jerman"],
    preferredJobRole: ["Registered Nurse (Ausbildung Anerkennung)"],
    readinessStatus: "Ready for Placement",
    verificationStatus: "Verified"
  },
  {
    id: "CAND-2026-009",
    nik: "3374022806******",
    fullName: "Hendra Wijaya",
    gender: "L",
    provinsi: "Jawa Tengah",
    kabupatenKota: "Kota Semarang",
    educationLevel: "SMK",
    institutionName: "SMK Negeri 7 Semarang (STM Pembangunan)",
    major: "Konstruksi Gedung & Sanitasi",
    skills: ["Formwork Installation", "Concrete Works", "Safety Standard (K3)", "Scaffolding Inspection"],
    languageProficiency: [
      { language: "Jepang", level: "JLPT N5" }
    ],
    preferredCountry: ["Jepang"],
    preferredJobRole: ["Construction Worker", "Scaffolder"],
    readinessStatus: "Needs Upskilling",
    verificationStatus: "Verified"
  },
  {
    id: "CAND-2026-010",
    nik: "3515081104******",
    fullName: "Dimas Aditya Pratama",
    gender: "L",
    provinsi: "Jawa Timur",
    kabupatenKota: "Kabupaten Sidoarjo",
    educationLevel: "SMK",
    institutionName: "SMK Negeri 1 Sidoarjo",
    major: "Teknik Pengelasan & Fabrikasi Logam",
    skills: ["GMAW", "GTAW / TIG", "SMAW 3G/4G", "WPS Adherence"],
    languageProficiency: [
      { language: "Korea", level: "EPS-TOPIK Level 2" }
    ],
    preferredCountry: ["Korea"],
    preferredJobRole: ["Welder", "Shipbuilding Welder"],
    readinessStatus: "Ready for Placement",
    verificationStatus: "Verified"
  },
  {
    id: "CAND-2026-011",
    nik: "6472014408******",
    fullName: "Rika Ayu Wandira",
    gender: "P",
    provinsi: "Kalimantan Timur",
    kabupatenKota: "Kota Samarinda",
    educationLevel: "SMK",
    institutionName: "SMK Medika Samarinda",
    major: "Asisten Keperawatan",
    skills: ["Elderly Care", "Vital Sign Check", "Hygiene Assistance"],
    languageProficiency: [
      { language: "Jepang", level: "Basic" }
    ],
    preferredCountry: ["Jepang"],
    preferredJobRole: ["Caregiver / Kaigo"],
    readinessStatus: "Needs Reskilling",
    verificationStatus: "Pending Verification"
  },
  {
    id: "CAND-2026-012",
    nik: "1271011503******",
    fullName: "Bambang Trihatmodjo",
    gender: "L",
    provinsi: "Sumatera Utara",
    kabupatenKota: "Kota Medan",
    educationLevel: "SMK",
    institutionName: "SMK Negeri 2 Medan",
    major: "Teknik Komputer & Jaringan",
    skills: ["Network Cabling", "Hardware Troubleshooting", "Operating Systems"],
    languageProficiency: [
      { language: "Inggris", level: "Intermediate" }
    ],
    preferredCountry: ["Taiwan", "Jepang"],
    preferredJobRole: ["Electronics Manufacturing Technician"],
    readinessStatus: "Needs Reskilling",
    verificationStatus: "Unverified"
  }
];
