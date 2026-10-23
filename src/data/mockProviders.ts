import { VocationalProvider } from '../types';

/**
 * Data Lembaga Penyelenggara Vokasi Terakreditasi
 * Disinkronkan langsung dari Portal Resmi Kementerian P2MI:
 * https://vokasi.kp2mi.go.id/cari-lembaga
 * 
 * Total Database Nasional: 1.520 Lembaga Terdaftar • 508 Terverifikasi / Tersertifikasi
 */
export const mockProviders: VocationalProvider[] = [
  {
    "id": "KP2MI-JAW-001",
    "name": "HANA AISH SALMA",
    "slug": "hana-aish-salma-6b0777c2",
    "logo": "30ad4e9b-c33f-47a3-a282-4bdf0c16ecc4",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/30ad4e9b-c33f-47a3-a282-4bdf0c16ecc4",
    "providerType": "LPK",
    "provinsi": "Jawa Timur",
    "kabupatenKota": "Jawa Timur",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Proses Verifikasi",
    "accreditation": "Unggul",
    "capacityPerBatch": 40,
    "certifiedInstructorsCount": 8,
    "facilities": [
      "Simulasi Ruang Praktik Kerja Standar Luar Negeri",
      "Laboratorium Bahasa Asing (Jepang / Korea / Jerman)",
      "Ruang Wawancara Online & CBT",
      "Dojo Pembinaan Mental dan Fisik (FMD)"
    ],
    "supportedSectors": [
      "Domestic Worker"
    ],
    "sectorals": [
      {
        "sectoral": "Domestic Worker",
        "position": "House Maid"
      }
    ],
    "operationalReadinessScore": 78,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-DAE-002",
    "name": "LPK MAHKOTA NANGGULAN",
    "slug": "lpk-mahkota-nanggulan-2145ae17",
    "logo": "0e195fd2-e68f-4979-8d1e-0f3a3aef61f2",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/0e195fd2-e68f-4979-8d1e-0f3a3aef61f2",
    "providerType": "LPK",
    "provinsi": "Daerah Istimewa Yogyakarta",
    "kabupatenKota": "Daerah Istimewa Yogyakarta",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Baik Sekali",
    "capacityPerBatch": 55,
    "certifiedInstructorsCount": 11,
    "facilities": [
      "Simulasi Ruang Praktik Kerja Standar Luar Negeri",
      "Laboratorium Bahasa Asing (Jepang / Korea / Jerman)",
      "Ruang Wawancara Online & CBT",
      "Dojo Pembinaan Mental dan Fisik (FMD)"
    ],
    "supportedSectors": [
      "Seni dan Ekonomi Kreatif"
    ],
    "sectorals": [
      {
        "sectoral": "Seni dan Ekonomi Kreatif",
        "position": "Tata Rias"
      }
    ],
    "operationalReadinessScore": 85,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-BAN-003",
    "name": "LPK Delta Abadi International",
    "slug": "lpk-delta-abadi-international-18954601",
    "logo": "160b23cf-7c6b-4fb1-b77b-fac838276bfc",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/160b23cf-7c6b-4fb1-b77b-fac838276bfc",
    "providerType": "LPK",
    "provinsi": "Banten",
    "kabupatenKota": "Banten",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "A",
    "capacityPerBatch": 70,
    "certifiedInstructorsCount": 14,
    "facilities": [
      "Simulasi Ruang Praktik Kerja Standar Luar Negeri",
      "Laboratorium Bahasa Asing (Jepang / Korea / Jerman)",
      "Ruang Wawancara Online & CBT",
      "Dojo Pembinaan Mental dan Fisik (FMD)"
    ],
    "supportedSectors": [
      "Bahasa "
    ],
    "sectorals": [
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Jepang"
      }
    ],
    "operationalReadinessScore": 92,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-SUM-004",
    "name": "YAYASAN LEMBAGA PELATIHAN KERJA KOUFUKU DARUMA INDONESIA",
    "slug": "yayasan-lembaga-pelatihan-kerja-koufuku-daruma-indonesia-135ecc97",
    "logo": "31f47c11-4073-4b74-939d-e5f4c20c83ac",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/31f47c11-4073-4b74-939d-e5f4c20c83ac",
    "providerType": "LPK",
    "provinsi": "Sumatera Utara",
    "kabupatenKota": "Sumatera Utara",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Unggul",
    "capacityPerBatch": 85,
    "certifiedInstructorsCount": 17,
    "facilities": [
      "Simulasi Ruang Praktik Kerja Standar Luar Negeri",
      "Laboratorium Bahasa Asing (Jepang / Korea / Jerman)",
      "Ruang Wawancara Online & CBT",
      "Dojo Pembinaan Mental dan Fisik (FMD)"
    ],
    "supportedSectors": [
      "Bahasa "
    ],
    "sectorals": [
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Jepang"
      }
    ],
    "operationalReadinessScore": 79,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-DAE-005",
    "name": "Direktorat Vokasi - Account",
    "slug": "direktorat-vokasi-account-1261c72b",
    "logo": "c0eb593c-dbf6-4df4-80d9-7e6e1bfc4156",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/c0eb593c-dbf6-4df4-80d9-7e6e1bfc4156",
    "providerType": "Universitas",
    "provinsi": "Daerah Khusus Ibukota Jakarta",
    "kabupatenKota": "Daerah Khusus Ibukota Jakarta",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "A",
    "capacityPerBatch": 100,
    "certifiedInstructorsCount": 20,
    "facilities": [
      "Fasilitas Pelatihan Vokasi Standar Nasional",
      "Laboratorium Praktik Terpadu",
      "Ruang Kelas Pembelajaran Interaktif"
    ],
    "supportedSectors": [
      "Teknologi Informasi"
    ],
    "sectorals": [
      {
        "sectoral": "Teknologi Informasi",
        "position": "Pengembangan Perangkat Lunak dan Gim"
      }
    ],
    "operationalReadinessScore": 86,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-RIA-006",
    "name": "YAYASAN PENDIDIKAN ISLAM DARUL QURAN WAL HADITS RIAU",
    "slug": "yayasan-pendidikan-islam-darul-quran-wal-hadits-riau-fef1522b",
    "logo": "395af9d9-393e-4db7-8bd9-0ef1a000b81b",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/395af9d9-393e-4db7-8bd9-0ef1a000b81b",
    "providerType": "SMA",
    "provinsi": "Riau",
    "kabupatenKota": "Riau",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Proses Verifikasi",
    "accreditation": "Baik Sekali",
    "capacityPerBatch": 115,
    "certifiedInstructorsCount": 23,
    "facilities": [
      "Fasilitas Pelatihan Vokasi Standar Nasional",
      "Laboratorium Praktik Terpadu",
      "Ruang Kelas Pembelajaran Interaktif"
    ],
    "supportedSectors": [
      "Bahasa "
    ],
    "sectorals": [
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Inggris"
      }
    ],
    "operationalReadinessScore": 93,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-007",
    "name": "UNIVERSITAS BANDUNG",
    "slug": "universitas-bandung-36ec6f47",
    "logo": "418df878-d0e7-41f7-9b04-c9221a6dddf0",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/418df878-d0e7-41f7-9b04-c9221a6dddf0",
    "providerType": "Universitas",
    "provinsi": "Jawa Barat",
    "kabupatenKota": "Jawa Barat",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Unggul",
    "capacityPerBatch": 40,
    "certifiedInstructorsCount": 8,
    "facilities": [
      "Fasilitas Pelatihan Vokasi Standar Nasional",
      "Laboratorium Praktik Terpadu",
      "Ruang Kelas Pembelajaran Interaktif"
    ],
    "supportedSectors": [
      "Kesehatan"
    ],
    "sectorals": [
      {
        "sectoral": "Kesehatan",
        "position": "K3"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Rekam Medis"
      }
    ],
    "operationalReadinessScore": 80,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-DAE-008",
    "name": "Politeknik Tempo",
    "slug": "politeknik-tempo",
    "logo": "eb3697ba-af01-4af9-90f0-a46be1b139ec",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/eb3697ba-af01-4af9-90f0-a46be1b139ec",
    "providerType": "Politeknik",
    "provinsi": "Daerah Khusus Ibukota Jakarta",
    "kabupatenKota": "Daerah Khusus Ibukota Jakarta",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Baik Sekali",
    "capacityPerBatch": 55,
    "certifiedInstructorsCount": 11,
    "facilities": [
      "Fasilitas Pelatihan Vokasi Standar Nasional",
      "Laboratorium Praktik Terpadu",
      "Ruang Kelas Pembelajaran Interaktif"
    ],
    "supportedSectors": [
      "Seni dan Ekonomi Kreatif",
      "Bisnis dan Manajemen"
    ],
    "sectorals": [
      {
        "sectoral": "Seni dan Ekonomi Kreatif",
        "position": "Broadcasting dan Perfilman"
      },
      {
        "sectoral": "Seni dan Ekonomi Kreatif",
        "position": "Desain Komunikasi Visual"
      },
      {
        "sectoral": "Bisnis dan Manajemen",
        "position": "Pemasaran"
      },
      {
        "sectoral": "Seni dan Ekonomi Kreatif",
        "position": "Animasi"
      }
    ],
    "operationalReadinessScore": 87,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-009",
    "name": "LPK AULIA PERSADA",
    "slug": "lpk-aulia-persada-24cf8d5d",
    "logo": "80d15222-be07-4caf-a81c-d3272f2a2cfd",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/80d15222-be07-4caf-a81c-d3272f2a2cfd",
    "providerType": "LPK",
    "provinsi": "Jawa Tengah",
    "kabupatenKota": "Jawa Tengah",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "A",
    "capacityPerBatch": 70,
    "certifiedInstructorsCount": 14,
    "facilities": [
      "Simulasi Ruang Praktik Kerja Standar Luar Negeri",
      "Laboratorium Bahasa Asing (Jepang / Korea / Jerman)",
      "Ruang Wawancara Online & CBT",
      "Dojo Pembinaan Mental dan Fisik (FMD)"
    ],
    "supportedSectors": [
      "Bisnis dan Manajemen",
      "Adminstrasi dan Keuangan",
      "Teknologi Informasi"
    ],
    "sectorals": [
      {
        "sectoral": "Bisnis dan Manajemen",
        "position": "Pemasaran"
      },
      {
        "sectoral": "Adminstrasi dan Keuangan",
        "position": "Officer"
      },
      {
        "sectoral": "Teknologi Informasi",
        "position": "Operator Komputer"
      }
    ],
    "operationalReadinessScore": 94,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-SUL-010",
    "name": "Lembaga Testing",
    "slug": "lembaga-testing-bbfbddfd",
    "logo": "c21dbef5-f645-48e8-ad2b-a8d0731ddb8b",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/c21dbef5-f645-48e8-ad2b-a8d0731ddb8b",
    "providerType": "LPK",
    "provinsi": "Sulawesi Selatan",
    "kabupatenKota": "Sulawesi Selatan",
    "institutionStatus": "Negeri",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Unggul",
    "capacityPerBatch": 85,
    "certifiedInstructorsCount": 17,
    "facilities": [
      "Simulasi Ruang Praktik Kerja Standar Luar Negeri",
      "Laboratorium Bahasa Asing (Jepang / Korea / Jerman)",
      "Ruang Wawancara Online & CBT",
      "Dojo Pembinaan Mental dan Fisik (FMD)"
    ],
    "supportedSectors": [
      "Adminstrasi dan Keuangan"
    ],
    "sectorals": [
      {
        "sectoral": "Adminstrasi dan Keuangan",
        "position": "Officer"
      }
    ],
    "operationalReadinessScore": 81,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-DAE-011",
    "name": "Universitas Kristen Indonesia",
    "slug": "universitas-kristen-indonesia-c648cb12",
    "logo": "30fdabf9-9caa-418c-a267-7fbef9586dd2",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/30fdabf9-9caa-418c-a267-7fbef9586dd2",
    "providerType": "Universitas",
    "provinsi": "Daerah Khusus Ibukota Jakarta",
    "kabupatenKota": "Daerah Khusus Ibukota Jakarta",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Proses Verifikasi",
    "accreditation": "A",
    "capacityPerBatch": 100,
    "certifiedInstructorsCount": 20,
    "facilities": [
      "Fasilitas Pelatihan Vokasi Standar Nasional",
      "Laboratorium Praktik Terpadu",
      "Ruang Kelas Pembelajaran Interaktif"
    ],
    "supportedSectors": [
      "Konstruksi",
      "Kesehatan",
      "Bisnis dan Manajemen",
      "Seni dan Ekonomi Kreatif",
      "Bahasa ",
      "Informal Worker ",
      "Adminstrasi dan Keuangan"
    ],
    "sectorals": [
      {
        "sectoral": "Konstruksi",
        "position": "K3 Konstruksi"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Caregiver"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Perawat"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Ners"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Caretaker"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Elderly Caretaker"
      },
      {
        "sectoral": "Konstruksi",
        "position": "Teknologi Konstruksi Bangunan"
      },
      {
        "sectoral": "Konstruksi",
        "position": "Konstruksi Jalan"
      },
      {
        "sectoral": "Konstruksi",
        "position": "Manajemen Konstruksi"
      },
      {
        "sectoral": "Konstruksi",
        "position": "Pengawasan Proyek"
      },
      {
        "sectoral": "Konstruksi",
        "position": "Pengawas Lapangan"
      },
      {
        "sectoral": "Konstruksi",
        "position": "Quality Control"
      },
      {
        "sectoral": "Konstruksi",
        "position": "BIM"
      },
      {
        "sectoral": "Konstruksi",
        "position": "Drainase"
      },
      {
        "sectoral": "Bisnis dan Manajemen",
        "position": "Akuntansi dan Keuangan Lembaga"
      },
      {
        "sectoral": "Seni dan Ekonomi Kreatif",
        "position": "Broadcasting dan Perfilman"
      },
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Inggris"
      },
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Mandarin"
      },
      {
        "sectoral": "Informal Worker ",
        "position": "Caretaker "
      },
      {
        "sectoral": "Adminstrasi dan Keuangan",
        "position": "Officer"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Home Care Assistant"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Fisioterapi "
      },
      {
        "sectoral": "Kesehatan",
        "position": "Keperawatan"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Nursing Assistant"
      }
    ],
    "operationalReadinessScore": 88,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-012",
    "name": "Politeknik Sains Seni Rekareasi",
    "slug": "politeknik-sains-seni-rekareasi-2a96f4f5",
    "logo": "135bf202-5dff-4007-980f-0264e88343ed",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/135bf202-5dff-4007-980f-0264e88343ed",
    "providerType": "Politeknik",
    "provinsi": "Jawa Barat",
    "kabupatenKota": "Jawa Barat",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Baik Sekali",
    "capacityPerBatch": 115,
    "certifiedInstructorsCount": 23,
    "facilities": [
      "Fasilitas Pelatihan Vokasi Standar Nasional",
      "Laboratorium Praktik Terpadu",
      "Ruang Kelas Pembelajaran Interaktif"
    ],
    "supportedSectors": [
      "Tourism, Travel, dan Hospitality",
      "Seni dan Ekonomi Kreatif"
    ],
    "sectorals": [
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Pendamping Destinasi Pariwisata"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Server Banquet"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Laundry Attendant"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Linen Attendant"
      },
      {
        "sectoral": "Seni dan Ekonomi Kreatif",
        "position": "Animasi"
      },
      {
        "sectoral": "Seni dan Ekonomi Kreatif",
        "position": "Desain Komunikasi Visual"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Indonesian Cook"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Pastry Cook"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Public Area Attendant"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Store Keeper"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Waiter / Assistant Waiter Cruise Ship"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Bell Boy"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Server Room Service"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Bartender / Bar Server Cruise Ship"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Bartender"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Concierge"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Housekeeping Order Taker"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Steward"
      }
    ],
    "operationalReadinessScore": 95,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-013",
    "name": "LPK Dhimia Indramayu",
    "slug": "lpk-dhimia-indramayu",
    "logo": "524a0075-8a6b-409c-ab85-a79286ea728e",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/524a0075-8a6b-409c-ab85-a79286ea728e",
    "providerType": "LPK",
    "provinsi": "Jawa Barat",
    "kabupatenKota": "Jawa Barat",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Unggul",
    "capacityPerBatch": 40,
    "certifiedInstructorsCount": 8,
    "facilities": [
      "Simulasi Ruang Praktik Kerja Standar Luar Negeri",
      "Laboratorium Bahasa Asing (Jepang / Korea / Jerman)",
      "Ruang Wawancara Online & CBT",
      "Dojo Pembinaan Mental dan Fisik (FMD)"
    ],
    "supportedSectors": [
      "Bahasa "
    ],
    "sectorals": [
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Jepang"
      }
    ],
    "operationalReadinessScore": 82,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-BAN-014",
    "name": "Injourney Airports Learning Center - PT Angkasa Pura Indonesia (Persoro) ",
    "slug": "injourney-airports-learning-center-pt-angkasa-pura-indonesia-persoro-b2a2a611",
    "logo": "48469535-9b46-42d5-a8c8-01a169586cbd",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/48469535-9b46-42d5-a8c8-01a169586cbd",
    "providerType": "Balai",
    "provinsi": "Banten",
    "kabupatenKota": "Banten",
    "institutionStatus": "Negeri",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Baik Sekali",
    "capacityPerBatch": 55,
    "certifiedInstructorsCount": 11,
    "facilities": [
      "Fasilitas Pelatihan Vokasi Standar Nasional",
      "Laboratorium Praktik Terpadu",
      "Ruang Kelas Pembelajaran Interaktif"
    ],
    "supportedSectors": [
      "Bisnis dan Manajemen",
      "Transportasi (Udara)"
    ],
    "sectorals": [
      {
        "sectoral": "Bisnis dan Manajemen",
        "position": "HR"
      },
      {
        "sectoral": "Transportasi (Udara)",
        "position": "Manajer Pengelolaan Bandara / Administrasi Bandar Udara"
      },
      {
        "sectoral": "Transportasi (Udara)",
        "position": "Passenger service officer"
      },
      {
        "sectoral": "Transportasi (Udara)",
        "position": "Petugas Keamanan dan Penanganan Bagasi"
      },
      {
        "sectoral": "Transportasi (Udara)",
        "position": "Manajer Operasi Bandar Udara"
      },
      {
        "sectoral": "Transportasi (Udara)",
        "position": "Ground Controller (pengatur pergerakan di apron & taxiway)"
      },
      {
        "sectoral": "Transportasi (Udara)",
        "position": "Staff operasional pelayanan penumpang (passenger service officer)"
      },
      {
        "sectoral": "Transportasi (Udara)",
        "position": "Ground handling officer"
      },
      {
        "sectoral": "Transportasi (Udara)",
        "position": "Apron movement control officer"
      },
      {
        "sectoral": "Transportasi (Udara)",
        "position": " Airport Rescue & Fire Fighting Officer (ARFF)"
      }
    ],
    "operationalReadinessScore": 89,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-SUM-015",
    "name": "SMKS INDONESIA MEMBANGUN TARUNA",
    "slug": "smks-indonesia-membangun-taruna",
    "logo": "e295646e-fc19-41fd-8e5f-9e739b415032",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/e295646e-fc19-41fd-8e5f-9e739b415032",
    "providerType": "SMK",
    "provinsi": "Sumatera Utara",
    "kabupatenKota": "Sumatera Utara",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "A",
    "capacityPerBatch": 70,
    "certifiedInstructorsCount": 14,
    "facilities": [
      "Bengkel Kerja Praktik Standar Industri Kemendikbud",
      "Laboratorium Komputer & Bahasa Asing Terpadu",
      "Teaching Factory Terverifikasi DUDI",
      "Ruang Teori & Multimedia Interaktif"
    ],
    "supportedSectors": [
      "Bisnis dan Manajemen"
    ],
    "sectorals": [
      {
        "sectoral": "Bisnis dan Manajemen",
        "position": "Akuntansi dan Keuangan Lembaga"
      }
    ],
    "operationalReadinessScore": 96,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-016",
    "name": "GAJAH MADA 94",
    "slug": "gajah-mada-94-87b261af",
    "logo": "160367f0-9bc8-4cc6-bc40-4ae1de5d9b7e",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/160367f0-9bc8-4cc6-bc40-4ae1de5d9b7e",
    "providerType": "LKP",
    "provinsi": "Jawa Tengah",
    "kabupatenKota": "Jawa Tengah",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Proses Verifikasi",
    "accreditation": "Unggul",
    "capacityPerBatch": 85,
    "certifiedInstructorsCount": 17,
    "facilities": [
      "Fasilitas Pelatihan Vokasi Standar Nasional",
      "Laboratorium Praktik Terpadu",
      "Ruang Kelas Pembelajaran Interaktif"
    ],
    "supportedSectors": [
      "Teknologi Informasi",
      "Bisnis dan Manajemen",
      "Tourism, Travel, dan Hospitality",
      "Transportasi (Darat)",
      "Kesehatan"
    ],
    "sectorals": [
      {
        "sectoral": "Teknologi Informasi",
        "position": "Operator Komputer"
      },
      {
        "sectoral": "Bisnis dan Manajemen",
        "position": "Pemasaran"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Room Attendant"
      },
      {
        "sectoral": "Transportasi (Darat)",
        "position": "Driver Operasional/Perusahaan"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Caregiver"
      }
    ],
    "operationalReadinessScore": 83,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-017",
    "name": "LPK MITRA GAMA SMART MULTI COURSE",
    "slug": "lpk-mitra-gama-smart-multi-course-947fc14e",
    "logo": "52b52b14-aae4-4407-afae-63b61e8dfba0",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/52b52b14-aae4-4407-afae-63b61e8dfba0",
    "providerType": "LPK",
    "provinsi": "Jawa Tengah",
    "kabupatenKota": "Jawa Tengah",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "A",
    "capacityPerBatch": 100,
    "certifiedInstructorsCount": 20,
    "facilities": [
      "Simulasi Ruang Praktik Kerja Standar Luar Negeri",
      "Laboratorium Bahasa Asing (Jepang / Korea / Jerman)",
      "Ruang Wawancara Online & CBT",
      "Dojo Pembinaan Mental dan Fisik (FMD)"
    ],
    "supportedSectors": [
      "Bahasa "
    ],
    "sectorals": [
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Korea"
      }
    ],
    "operationalReadinessScore": 90,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-DAE-018",
    "name": "SINAR KARYA SUKSES",
    "slug": "sinar-karya-sukses",
    "logo": "2271f374-71b6-4d48-afc8-db3e3b17c1dc",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/2271f374-71b6-4d48-afc8-db3e3b17c1dc",
    "providerType": "LPK",
    "provinsi": "Daerah Khusus Ibukota Jakarta",
    "kabupatenKota": "Daerah Khusus Ibukota Jakarta",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Baik Sekali",
    "capacityPerBatch": 115,
    "certifiedInstructorsCount": 23,
    "facilities": [
      "Simulasi Ruang Praktik Kerja Standar Luar Negeri",
      "Laboratorium Bahasa Asing (Jepang / Korea / Jerman)",
      "Ruang Wawancara Online & CBT",
      "Dojo Pembinaan Mental dan Fisik (FMD)"
    ],
    "supportedSectors": [
      "Domestic Worker"
    ],
    "sectorals": [
      {
        "sectoral": "Domestic Worker",
        "position": "Caregiver"
      },
      {
        "sectoral": "Domestic Worker",
        "position": "House Maid"
      }
    ],
    "operationalReadinessScore": 97,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-019",
    "name": "Politeknik Assalaam Surakarta",
    "slug": "politeknik-assalaam-surakarta-d9c72f88",
    "logo": "3a2b5420-4c22-403b-bdf0-c56d17b1a849",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/3a2b5420-4c22-403b-bdf0-c56d17b1a849",
    "providerType": "Politeknik",
    "provinsi": "Jawa Tengah",
    "kabupatenKota": "Jawa Tengah",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Unggul",
    "capacityPerBatch": 40,
    "certifiedInstructorsCount": 8,
    "facilities": [
      "Fasilitas Pelatihan Vokasi Standar Nasional",
      "Laboratorium Praktik Terpadu",
      "Ruang Kelas Pembelajaran Interaktif"
    ],
    "supportedSectors": [
      "Tourism, Travel, dan Hospitality",
      "Kesehatan"
    ],
    "sectorals": [
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Waiter / Assistant Waiter Cruise Ship"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Room Attendant"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Public Area Attendant"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Caregiver"
      }
    ],
    "operationalReadinessScore": 84,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-DAE-020",
    "name": "TERAMPIL MADANI",
    "slug": "terampil-madani-873ef2d1",
    "logo": "3952cfb3-c667-427f-9ba6-274a5629209e",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/3952cfb3-c667-427f-9ba6-274a5629209e",
    "providerType": "LPK",
    "provinsi": "Daerah Khusus Ibukota Jakarta",
    "kabupatenKota": "Daerah Khusus Ibukota Jakarta",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Baik Sekali",
    "capacityPerBatch": 55,
    "certifiedInstructorsCount": 11,
    "facilities": [
      "Simulasi Ruang Praktik Kerja Standar Luar Negeri",
      "Laboratorium Bahasa Asing (Jepang / Korea / Jerman)",
      "Ruang Wawancara Online & CBT",
      "Dojo Pembinaan Mental dan Fisik (FMD)"
    ],
    "supportedSectors": [
      "Domestic Worker"
    ],
    "sectorals": [
      {
        "sectoral": "Domestic Worker",
        "position": "Domestic Worker"
      }
    ],
    "operationalReadinessScore": 91,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-NUS-021",
    "name": "Universitas Samawa",
    "slug": "universitas-samawa-924aa1bf",
    "logo": "6a1490c2-0c21-41e9-9918-5d8326fd3faa",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/6a1490c2-0c21-41e9-9918-5d8326fd3faa",
    "providerType": "Universitas",
    "provinsi": "Nusa Tenggara Barat",
    "kabupatenKota": "Nusa Tenggara Barat",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Proses Verifikasi",
    "accreditation": "A",
    "capacityPerBatch": 70,
    "certifiedInstructorsCount": 14,
    "facilities": [
      "Fasilitas Pelatihan Vokasi Standar Nasional",
      "Laboratorium Praktik Terpadu",
      "Ruang Kelas Pembelajaran Interaktif"
    ],
    "supportedSectors": [
      "Kelautan dan Perikanan"
    ],
    "sectorals": [
      {
        "sectoral": "Kelautan dan Perikanan",
        "position": "Peneliti/Akademisi Bidang  Kelautan dan Perikanan"
      }
    ],
    "operationalReadinessScore": 78,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-022",
    "name": "ZEN SOLUSI INDONESIA",
    "slug": "zen-solusi-indonesia",
    "logo": "4fb48e64-e1a1-4ffe-97f5-6f189982453b",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/4fb48e64-e1a1-4ffe-97f5-6f189982453b",
    "providerType": "LPK",
    "provinsi": "Jawa Barat",
    "kabupatenKota": "Jawa Barat",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Unggul",
    "capacityPerBatch": 85,
    "certifiedInstructorsCount": 17,
    "facilities": [
      "Simulasi Ruang Praktik Kerja Standar Luar Negeri",
      "Laboratorium Bahasa Asing (Jepang / Korea / Jerman)",
      "Ruang Wawancara Online & CBT",
      "Dojo Pembinaan Mental dan Fisik (FMD)"
    ],
    "supportedSectors": [
      "Bisnis dan Manajemen"
    ],
    "sectorals": [
      {
        "sectoral": "Bisnis dan Manajemen",
        "position": "Akuntansi dan Keuangan Lembaga"
      }
    ],
    "operationalReadinessScore": 85,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-023",
    "name": "LPK BAKTI TARUNA",
    "slug": "lpk-bakti-taruna-55ce7350",
    "logo": "0cd7d936-8e84-44ed-aafd-0cc48e472b70",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/0cd7d936-8e84-44ed-aafd-0cc48e472b70",
    "providerType": "LPK",
    "provinsi": "Jawa Barat",
    "kabupatenKota": "Jawa Barat",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "A",
    "capacityPerBatch": 100,
    "certifiedInstructorsCount": 20,
    "facilities": [
      "Simulasi Ruang Praktik Kerja Standar Luar Negeri",
      "Laboratorium Bahasa Asing (Jepang / Korea / Jerman)",
      "Ruang Wawancara Online & CBT",
      "Dojo Pembinaan Mental dan Fisik (FMD)"
    ],
    "supportedSectors": [
      "Teknologi Informasi"
    ],
    "sectorals": [
      {
        "sectoral": "Teknologi Informasi",
        "position": "Operator Komputer"
      }
    ],
    "operationalReadinessScore": 92,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-024",
    "name": "SMK MUTIARA LIDO",
    "slug": "smk-mutiara-lido-45c8cd7b",
    "logo": "4d68b4f2-1ccb-46de-aff4-d0a75948e6eb",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/4d68b4f2-1ccb-46de-aff4-d0a75948e6eb",
    "providerType": "SMK",
    "provinsi": "Jawa Barat",
    "kabupatenKota": "Jawa Barat",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Baik Sekali",
    "capacityPerBatch": 115,
    "certifiedInstructorsCount": 23,
    "facilities": [
      "Bengkel Kerja Praktik Standar Industri Kemendikbud",
      "Laboratorium Komputer & Bahasa Asing Terpadu",
      "Teaching Factory Terverifikasi DUDI",
      "Ruang Teori & Multimedia Interaktif"
    ],
    "supportedSectors": [
      "Bisnis dan Manajemen"
    ],
    "sectorals": [
      {
        "sectoral": "Bisnis dan Manajemen",
        "position": "Manajemen Perkantoran dan Layanan Bisnis"
      }
    ],
    "operationalReadinessScore": 79,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-025",
    "name": "LPK BUNGA DAHLIA",
    "slug": "lpk-bunga-dahlia-08ec891c",
    "logo": "cd1af5f9-8d6f-49ec-a576-ea50651ace8a",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/cd1af5f9-8d6f-49ec-a576-ea50651ace8a",
    "providerType": "LPK",
    "provinsi": "Jawa Barat",
    "kabupatenKota": "Jawa Barat",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Unggul",
    "capacityPerBatch": 40,
    "certifiedInstructorsCount": 8,
    "facilities": [
      "Simulasi Ruang Praktik Kerja Standar Luar Negeri",
      "Laboratorium Bahasa Asing (Jepang / Korea / Jerman)",
      "Ruang Wawancara Online & CBT",
      "Dojo Pembinaan Mental dan Fisik (FMD)"
    ],
    "supportedSectors": [
      "Domestic Worker"
    ],
    "sectorals": [
      {
        "sectoral": "Domestic Worker",
        "position": "Baby Sitter"
      },
      {
        "sectoral": "Domestic Worker",
        "position": "Caregiver"
      }
    ],
    "operationalReadinessScore": 86,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-026",
    "name": "Lembaga Riset dan Pengabdian Masyarakat",
    "slug": "lembaga-riset-dan-pengabdian-masyarakat-9258f814",
    "logo": "01fec626-beb9-414e-b0a1-ed6530e7eb1d",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/01fec626-beb9-414e-b0a1-ed6530e7eb1d",
    "providerType": "Institut",
    "provinsi": "Jawa Tengah",
    "kabupatenKota": "Jawa Tengah",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Proses Verifikasi",
    "accreditation": "Baik Sekali",
    "capacityPerBatch": 55,
    "certifiedInstructorsCount": 11,
    "facilities": [
      "Fasilitas Pelatihan Vokasi Standar Nasional",
      "Laboratorium Praktik Terpadu",
      "Ruang Kelas Pembelajaran Interaktif"
    ],
    "supportedSectors": [
      "Teknologi Informasi",
      "Bisnis dan Manajemen"
    ],
    "sectorals": [
      {
        "sectoral": "Teknologi Informasi",
        "position": "Pengembangan Perangkat Lunak dan Gim"
      },
      {
        "sectoral": "Bisnis dan Manajemen",
        "position": "Pemasaran"
      }
    ],
    "operationalReadinessScore": 93,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-027",
    "name": "OTC BALI YPKP BANDUNG",
    "slug": "otc-bali-ypkp-bandung-366e482e",
    "logo": "c8ca53a0-abf7-4114-9eb2-3f3c34528885",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/c8ca53a0-abf7-4114-9eb2-3f3c34528885",
    "providerType": "LPK",
    "provinsi": "Jawa Barat",
    "kabupatenKota": "Jawa Barat",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "A",
    "capacityPerBatch": 70,
    "certifiedInstructorsCount": 14,
    "facilities": [
      "Simulasi Ruang Praktik Kerja Standar Luar Negeri",
      "Laboratorium Bahasa Asing (Jepang / Korea / Jerman)",
      "Ruang Wawancara Online & CBT",
      "Dojo Pembinaan Mental dan Fisik (FMD)"
    ],
    "supportedSectors": [
      "Tourism, Travel, dan Hospitality"
    ],
    "sectorals": [
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Room Attendant"
      }
    ],
    "operationalReadinessScore": 80,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-028",
    "name": "LPK MOMIJI",
    "slug": "lpk-momiji-8295b429",
    "logo": "477164fc-ca7e-4fa0-80ec-5ae4c0512fb5",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/477164fc-ca7e-4fa0-80ec-5ae4c0512fb5",
    "providerType": "LPK",
    "provinsi": "Jawa Tengah",
    "kabupatenKota": "Jawa Tengah",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Unggul",
    "capacityPerBatch": 85,
    "certifiedInstructorsCount": 17,
    "facilities": [
      "Simulasi Ruang Praktik Kerja Standar Luar Negeri",
      "Laboratorium Bahasa Asing (Jepang / Korea / Jerman)",
      "Ruang Wawancara Online & CBT",
      "Dojo Pembinaan Mental dan Fisik (FMD)"
    ],
    "supportedSectors": [
      "Bahasa "
    ],
    "sectorals": [
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Jepang"
      }
    ],
    "operationalReadinessScore": 87,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-029",
    "name": "SMK KRISTEN 2 KLATEN",
    "slug": "smk-kristen-2-klaten-9f285a26",
    "logo": "91ae5b2b-267d-4052-9c5c-84352f0d8d83",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/91ae5b2b-267d-4052-9c5c-84352f0d8d83",
    "providerType": "SMK",
    "provinsi": "Jawa Tengah",
    "kabupatenKota": "Jawa Tengah",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "A",
    "capacityPerBatch": 100,
    "certifiedInstructorsCount": 20,
    "facilities": [
      "Bengkel Kerja Praktik Standar Industri Kemendikbud",
      "Laboratorium Komputer & Bahasa Asing Terpadu",
      "Teaching Factory Terverifikasi DUDI",
      "Ruang Teori & Multimedia Interaktif"
    ],
    "supportedSectors": [
      "Kesehatan",
      "Bisnis dan Manajemen",
      "Seni dan Ekonomi Kreatif"
    ],
    "sectorals": [
      {
        "sectoral": "Kesehatan",
        "position": "Nursing Assistant"
      },
      {
        "sectoral": "Bisnis dan Manajemen",
        "position": "Akuntansi dan Keuangan Lembaga"
      },
      {
        "sectoral": "Bisnis dan Manajemen",
        "position": "Manajemen Perkantoran dan Layanan Bisnis"
      },
      {
        "sectoral": "Seni dan Ekonomi Kreatif",
        "position": "Desain Komunikasi Visual"
      },
      {
        "sectoral": "Bisnis dan Manajemen",
        "position": "Pemasaran"
      }
    ],
    "operationalReadinessScore": 94,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-DAE-030",
    "name": "LKP LIDI",
    "slug": "lkp-lidi-8358c287",
    "logo": "0ff89ecb-8ef1-42c9-835f-16092ecb5e68",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/0ff89ecb-8ef1-42c9-835f-16092ecb5e68",
    "providerType": "LKP",
    "provinsi": "Daerah Istimewa Yogyakarta",
    "kabupatenKota": "Daerah Istimewa Yogyakarta",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Baik Sekali",
    "capacityPerBatch": 115,
    "certifiedInstructorsCount": 23,
    "facilities": [
      "Fasilitas Pelatihan Vokasi Standar Nasional",
      "Laboratorium Praktik Terpadu",
      "Ruang Kelas Pembelajaran Interaktif"
    ],
    "supportedSectors": [
      "Seni dan Ekonomi Kreatif"
    ],
    "sectorals": [
      {
        "sectoral": "Seni dan Ekonomi Kreatif",
        "position": "Busana"
      }
    ],
    "operationalReadinessScore": 81,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-DAE-031",
    "name": "LKP TRISAKTI",
    "slug": "lkp-trisakti-b6094f2d",
    "logo": "954748ed-e9de-4703-ae12-b900a045b053",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/954748ed-e9de-4703-ae12-b900a045b053",
    "providerType": "LKP",
    "provinsi": "Daerah Istimewa Yogyakarta",
    "kabupatenKota": "Daerah Istimewa Yogyakarta",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Proses Verifikasi",
    "accreditation": "Unggul",
    "capacityPerBatch": 40,
    "certifiedInstructorsCount": 8,
    "facilities": [
      "Fasilitas Pelatihan Vokasi Standar Nasional",
      "Laboratorium Praktik Terpadu",
      "Ruang Kelas Pembelajaran Interaktif"
    ],
    "supportedSectors": [
      "Seni dan Ekonomi Kreatif"
    ],
    "sectorals": [
      {
        "sectoral": "Seni dan Ekonomi Kreatif",
        "position": "Busana"
      }
    ],
    "operationalReadinessScore": 88,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-032",
    "name": "BLKK YPI AL-MADINAH HABIB AL-ZAM ",
    "slug": "blkk-ypi-al-madinah-habib-al-zam-69fda162",
    "logo": "aaa4508e-e218-40f6-a534-4520eaed9246",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/aaa4508e-e218-40f6-a534-4520eaed9246",
    "providerType": "BLK",
    "provinsi": "Jawa Timur",
    "kabupatenKota": "Jawa Timur",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Baik Sekali",
    "capacityPerBatch": 55,
    "certifiedInstructorsCount": 11,
    "facilities": [
      "Workshop Pelatihan Kejuruan Terakreditasi Kemnaker",
      "Pusat Sertifikasi Uji Kompetensi BNSP Terlisensi",
      "Mesin Bubut & Perkakas Otomasi",
      "Asrama Pelatihan & Ruang Kelas Teori"
    ],
    "supportedSectors": [
      "Teknologi Informasi"
    ],
    "sectorals": [
      {
        "sectoral": "Teknologi Informasi",
        "position": "Operator Komputer"
      }
    ],
    "operationalReadinessScore": 95,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-033",
    "name": "BERSAMA KIAN SUKSES",
    "slug": "bersama-kian-sukses-dcfaf47f",
    "logo": "d4503f37-5f09-4490-8a1f-d3a6334e70e6",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/d4503f37-5f09-4490-8a1f-d3a6334e70e6",
    "providerType": "LPK",
    "provinsi": "Jawa Tengah",
    "kabupatenKota": "Jawa Tengah",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "A",
    "capacityPerBatch": 70,
    "certifiedInstructorsCount": 14,
    "facilities": [
      "Simulasi Ruang Praktik Kerja Standar Luar Negeri",
      "Laboratorium Bahasa Asing (Jepang / Korea / Jerman)",
      "Ruang Wawancara Online & CBT",
      "Dojo Pembinaan Mental dan Fisik (FMD)"
    ],
    "supportedSectors": [
      "Bahasa ",
      "Industri",
      "Pertanian & Peternakan",
      "Domestic Worker",
      "Seni dan Ekonomi Kreatif",
      "Adminstrasi dan Keuangan",
      "Tourism, Travel, dan Hospitality",
      "Kesehatan",
      "Bisnis dan Manajemen",
      "Worker",
      "Konstruksi",
      "Manufaktur",
      "Welder"
    ],
    "sectorals": [
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Mandarin"
      },
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Jepang"
      },
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Korea"
      },
      {
        "sectoral": "Industri",
        "position": "Pengolahan Makanan"
      },
      {
        "sectoral": "Industri",
        "position": "Otomotif"
      },
      {
        "sectoral": "Pertanian & Peternakan",
        "position": "Hortikultura"
      },
      {
        "sectoral": "Pertanian & Peternakan",
        "position": "Peternakan"
      },
      {
        "sectoral": "Domestic Worker",
        "position": "Elderly Caretaker"
      },
      {
        "sectoral": "Domestic Worker",
        "position": "Care Taker "
      },
      {
        "sectoral": "Domestic Worker",
        "position": "Baby Sitter"
      },
      {
        "sectoral": "Seni dan Ekonomi Kreatif",
        "position": "Broadcasting dan Perfilman"
      },
      {
        "sectoral": "Adminstrasi dan Keuangan",
        "position": "Officer"
      },
      {
        "sectoral": "Domestic Worker",
        "position": "Caregiver"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Housekeeping Order Taker"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Caregiver"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Nursing Assistant"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Spa Therapist"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Elderly Caretaker"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Barista"
      },
      {
        "sectoral": "Bisnis dan Manajemen",
        "position": "Manajemen Perkantoran dan Layanan Bisnis"
      },
      {
        "sectoral": "Worker",
        "position": "Teknik Pengelasan"
      },
      {
        "sectoral": "Konstruksi",
        "position": "Konstruksi Infrastruktur Dasar"
      },
      {
        "sectoral": "Manufaktur",
        "position": "Operator Production"
      },
      {
        "sectoral": "Konstruksi",
        "position": "Instalasi Listrik"
      },
      {
        "sectoral": "Welder",
        "position": "Teknisi Pengelasan (Welder)"
      },
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Inggris"
      }
    ],
    "operationalReadinessScore": 82,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-SUM-034",
    "name": "LPK Sumber Berkah Sertifikasi",
    "slug": "lpk-sumber-berkah-sertifikasi-941cd204",
    "logo": "3b97f20d-fc49-4697-90a6-ed1491a0e668",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/3b97f20d-fc49-4697-90a6-ed1491a0e668",
    "providerType": "LPK",
    "provinsi": "Sumatera Barat",
    "kabupatenKota": "Sumatera Barat",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Unggul",
    "capacityPerBatch": 85,
    "certifiedInstructorsCount": 17,
    "facilities": [
      "Simulasi Ruang Praktik Kerja Standar Luar Negeri",
      "Laboratorium Bahasa Asing (Jepang / Korea / Jerman)",
      "Ruang Wawancara Online & CBT",
      "Dojo Pembinaan Mental dan Fisik (FMD)"
    ],
    "supportedSectors": [
      "Konstruksi"
    ],
    "sectorals": [
      {
        "sectoral": "Konstruksi",
        "position": "BIM"
      }
    ],
    "operationalReadinessScore": 89,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-ACE-035",
    "name": "SMK Negeri 1 Gandapura",
    "slug": "smk-negeri-1-gandapura-44f877d2",
    "logo": "46600b02-5d5e-46c7-b7a7-24a13a97c41b",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/46600b02-5d5e-46c7-b7a7-24a13a97c41b",
    "providerType": "SMK",
    "provinsi": "Aceh",
    "kabupatenKota": "Aceh",
    "institutionStatus": "Negeri",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "A",
    "capacityPerBatch": 100,
    "certifiedInstructorsCount": 20,
    "facilities": [
      "Bengkel Kerja Praktik Standar Industri Kemendikbud",
      "Laboratorium Komputer & Bahasa Asing Terpadu",
      "Teaching Factory Terverifikasi DUDI",
      "Ruang Teori & Multimedia Interaktif"
    ],
    "supportedSectors": [
      "Seni dan Ekonomi Kreatif",
      "Welder",
      "Pertanian & Peternakan"
    ],
    "sectorals": [
      {
        "sectoral": "Seni dan Ekonomi Kreatif",
        "position": "Busana"
      },
      {
        "sectoral": "Welder",
        "position": "Teknisi Pengelasan (Welder)"
      },
      {
        "sectoral": "Pertanian & Peternakan",
        "position": "Peternakan"
      }
    ],
    "operationalReadinessScore": 96,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-SUM-036",
    "name": "Yayasan Galang Insan Mandiri",
    "slug": "yayasan-galang-insan-mandiri-3e8503e2",
    "logo": "4ea71e8c-e0ff-48c2-85eb-637958cad9c9",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/4ea71e8c-e0ff-48c2-85eb-637958cad9c9",
    "providerType": "SMK",
    "provinsi": "Sumatera Utara",
    "kabupatenKota": "Sumatera Utara",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Proses Verifikasi",
    "accreditation": "Baik Sekali",
    "capacityPerBatch": 115,
    "certifiedInstructorsCount": 23,
    "facilities": [
      "Bengkel Kerja Praktik Standar Industri Kemendikbud",
      "Laboratorium Komputer & Bahasa Asing Terpadu",
      "Teaching Factory Terverifikasi DUDI",
      "Ruang Teori & Multimedia Interaktif"
    ],
    "supportedSectors": [
      "Tourism, Travel, dan Hospitality",
      "Kesehatan",
      "Seni dan Ekonomi Kreatif"
    ],
    "sectorals": [
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Spa Therapist"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Caregiver"
      },
      {
        "sectoral": "Seni dan Ekonomi Kreatif",
        "position": "Desain Komunikasi Visual"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Farmasis"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Analis Kesehatan"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Keperawatan"
      }
    ],
    "operationalReadinessScore": 83,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-NUS-037",
    "name": "STID MUstafa Ibrahim Al-Ishlahuddiny Kediri Lombok Barat",
    "slug": "stid-m-ustafa-ibrahim-al-ishlahuddiny-kediri-lombok-barat-01fd0bb2",
    "logo": "203b1da9-e45c-4a66-b225-c136b1ff69e7",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/203b1da9-e45c-4a66-b225-c136b1ff69e7",
    "providerType": "Sekolah Tinggi",
    "provinsi": "Nusa Tenggara Barat",
    "kabupatenKota": "Nusa Tenggara Barat",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Unggul",
    "capacityPerBatch": 40,
    "certifiedInstructorsCount": 8,
    "facilities": [
      "Fasilitas Pelatihan Vokasi Standar Nasional",
      "Laboratorium Praktik Terpadu",
      "Ruang Kelas Pembelajaran Interaktif"
    ],
    "supportedSectors": [
      "Teknologi Informasi"
    ],
    "sectorals": [
      {
        "sectoral": "Teknologi Informasi",
        "position": "Operator Komputer"
      }
    ],
    "operationalReadinessScore": 90,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-NUS-038",
    "name": "STID Mustafa Ibrahim Al-Ishlahuddiny",
    "slug": "stid-mustafa-ibrahim-al-ishlahuddiny-271004a8",
    "logo": "205fb775-4fb2-477d-af30-145b649e6dc4",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/205fb775-4fb2-477d-af30-145b649e6dc4",
    "providerType": "Sekolah Tinggi",
    "provinsi": "Nusa Tenggara Barat",
    "kabupatenKota": "Nusa Tenggara Barat",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Baik Sekali",
    "capacityPerBatch": 55,
    "certifiedInstructorsCount": 11,
    "facilities": [
      "Fasilitas Pelatihan Vokasi Standar Nasional",
      "Laboratorium Praktik Terpadu",
      "Ruang Kelas Pembelajaran Interaktif"
    ],
    "supportedSectors": [
      "Teknologi Informasi"
    ],
    "sectorals": [
      {
        "sectoral": "Teknologi Informasi",
        "position": "Operator Komputer"
      }
    ],
    "operationalReadinessScore": 97,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-BAN-039",
    "name": "LPK PRODIGI",
    "slug": "lpk-prodigi-93485402",
    "logo": "b95f27dc-7177-4352-b12c-d757bf74d98d",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/b95f27dc-7177-4352-b12c-d757bf74d98d",
    "providerType": "LPK",
    "provinsi": "Banten",
    "kabupatenKota": "Banten",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "A",
    "capacityPerBatch": 70,
    "certifiedInstructorsCount": 14,
    "facilities": [
      "Simulasi Ruang Praktik Kerja Standar Luar Negeri",
      "Laboratorium Bahasa Asing (Jepang / Korea / Jerman)",
      "Ruang Wawancara Online & CBT",
      "Dojo Pembinaan Mental dan Fisik (FMD)"
    ],
    "supportedSectors": [
      "Bahasa "
    ],
    "sectorals": [
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Jepang"
      }
    ],
    "operationalReadinessScore": 84,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-KEP-040",
    "name": "LPK Bintan Cakrawala",
    "slug": "lpk-bintan-cakrawala-a70cc6d6",
    "logo": "f78a71c0-b7ea-49ac-ba0d-3f9b657054bd",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/f78a71c0-b7ea-49ac-ba0d-3f9b657054bd",
    "providerType": "LPK",
    "provinsi": "Kepulauan Riau",
    "kabupatenKota": "Kepulauan Riau",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Unggul",
    "capacityPerBatch": 85,
    "certifiedInstructorsCount": 17,
    "facilities": [
      "Simulasi Ruang Praktik Kerja Standar Luar Negeri",
      "Laboratorium Bahasa Asing (Jepang / Korea / Jerman)",
      "Ruang Wawancara Online & CBT",
      "Dojo Pembinaan Mental dan Fisik (FMD)"
    ],
    "supportedSectors": [
      "Tourism, Travel, dan Hospitality",
      "Welder"
    ],
    "sectorals": [
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Laundry Attendant"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Server Bar"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Front Desk Attendant"
      },
      {
        "sectoral": "Welder",
        "position": "Teknisi Pengelasan (Welder)"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Pastry Cook"
      },
      {
        "sectoral": "Welder",
        "position": "Teknisi Pengelasan (Welder)"
      }
    ],
    "operationalReadinessScore": 91,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-SUM-041",
    "name": "SMKN 1 Kayuagung",
    "slug": "smkn-1-kayuagung-a0726c6f",
    "logo": "2d92d561-6f9b-4dd5-8cf0-21f6ad8c1c28",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/2d92d561-6f9b-4dd5-8cf0-21f6ad8c1c28",
    "providerType": "SMK",
    "provinsi": "Sumatera Selatan",
    "kabupatenKota": "Sumatera Selatan",
    "institutionStatus": "Negeri",
    "evokasiVerificationStatus": "Proses Verifikasi",
    "accreditation": "A",
    "capacityPerBatch": 100,
    "certifiedInstructorsCount": 20,
    "facilities": [
      "Bengkel Kerja Praktik Standar Industri Kemendikbud",
      "Laboratorium Komputer & Bahasa Asing Terpadu",
      "Teaching Factory Terverifikasi DUDI",
      "Ruang Teori & Multimedia Interaktif"
    ],
    "supportedSectors": [
      "Kesehatan",
      "Bisnis dan Manajemen",
      "Teknologi Informasi"
    ],
    "sectorals": [
      {
        "sectoral": "Kesehatan",
        "position": "Home Care Assistant"
      },
      {
        "sectoral": "Bisnis dan Manajemen",
        "position": "Manajemen Perkantoran dan Layanan Bisnis"
      },
      {
        "sectoral": "Bisnis dan Manajemen",
        "position": "Akuntansi dan Keuangan Lembaga"
      },
      {
        "sectoral": "Bisnis dan Manajemen",
        "position": "Pemasaran"
      },
      {
        "sectoral": "Teknologi Informasi",
        "position": "Teknik Jaringan Komputer dan Telekomunikasi"
      }
    ],
    "operationalReadinessScore": 78,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-ACE-042",
    "name": "STAIN Teungku Dirundeng Meulaboh",
    "slug": "stain-teungku-dirundeng-meulaboh-e1269530",
    "logo": "fb2d187c-ff6b-4f0d-9e14-ab30655a3a3a",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/fb2d187c-ff6b-4f0d-9e14-ab30655a3a3a",
    "providerType": "Sekolah Tinggi",
    "provinsi": "Aceh",
    "kabupatenKota": "Aceh",
    "institutionStatus": "Negeri",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Baik Sekali",
    "capacityPerBatch": 115,
    "certifiedInstructorsCount": 23,
    "facilities": [
      "Fasilitas Pelatihan Vokasi Standar Nasional",
      "Laboratorium Praktik Terpadu",
      "Ruang Kelas Pembelajaran Interaktif"
    ],
    "supportedSectors": [
      "Bahasa ",
      "Adminstrasi dan Keuangan"
    ],
    "sectorals": [
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Arab"
      },
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Inggris"
      },
      {
        "sectoral": "Adminstrasi dan Keuangan",
        "position": "Officer"
      }
    ],
    "operationalReadinessScore": 85,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-043",
    "name": "SMK ISLAM TERPADU AR-RISALAH CARIU",
    "slug": "smk-islam-terpadu-ar-risalah-cariu-16011999",
    "logo": "e78b3673-98cf-47a6-b7a1-b2bf7afd2564",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/e78b3673-98cf-47a6-b7a1-b2bf7afd2564",
    "providerType": "SMK",
    "provinsi": "Jawa Barat",
    "kabupatenKota": "Jawa Barat",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Unggul",
    "capacityPerBatch": 40,
    "certifiedInstructorsCount": 8,
    "facilities": [
      "Bengkel Kerja Praktik Standar Industri Kemendikbud",
      "Laboratorium Komputer & Bahasa Asing Terpadu",
      "Teaching Factory Terverifikasi DUDI",
      "Ruang Teori & Multimedia Interaktif"
    ],
    "supportedSectors": [
      "Bisnis dan Manajemen",
      "Adminstrasi dan Keuangan",
      "Seni dan Ekonomi Kreatif"
    ],
    "sectorals": [
      {
        "sectoral": "Bisnis dan Manajemen",
        "position": "Manajemen Perkantoran dan Layanan Bisnis"
      },
      {
        "sectoral": "Adminstrasi dan Keuangan",
        "position": "Officer"
      },
      {
        "sectoral": "Seni dan Ekonomi Kreatif",
        "position": "Desain Komunikasi Visual"
      }
    ],
    "operationalReadinessScore": 92,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-044",
    "name": "LPKS HIKARI - NBP",
    "slug": "lpks-hikari-nbp-40344d53",
    "logo": "3c962ea3-4919-445c-bf20-8e8950987ea8",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/3c962ea3-4919-445c-bf20-8e8950987ea8",
    "providerType": "LPK",
    "provinsi": "Jawa Tengah",
    "kabupatenKota": "Jawa Tengah",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Baik Sekali",
    "capacityPerBatch": 55,
    "certifiedInstructorsCount": 11,
    "facilities": [
      "Simulasi Ruang Praktik Kerja Standar Luar Negeri",
      "Laboratorium Bahasa Asing (Jepang / Korea / Jerman)",
      "Ruang Wawancara Online & CBT",
      "Dojo Pembinaan Mental dan Fisik (FMD)"
    ],
    "supportedSectors": [
      "Bahasa "
    ],
    "sectorals": [
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Jepang"
      }
    ],
    "operationalReadinessScore": 79,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-BAN-045",
    "name": "LPK RAJASA INTAMA",
    "slug": "lpk-rajasa-intama-27bf4ead",
    "logo": "4c9728e7-70da-4e05-8cda-d47c66264eaa",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/4c9728e7-70da-4e05-8cda-d47c66264eaa",
    "providerType": "LPK",
    "provinsi": "Banten",
    "kabupatenKota": "Banten",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "A",
    "capacityPerBatch": 70,
    "certifiedInstructorsCount": 14,
    "facilities": [
      "Simulasi Ruang Praktik Kerja Standar Luar Negeri",
      "Laboratorium Bahasa Asing (Jepang / Korea / Jerman)",
      "Ruang Wawancara Online & CBT",
      "Dojo Pembinaan Mental dan Fisik (FMD)"
    ],
    "supportedSectors": [
      "Konstruksi",
      "Transportasi (Darat)",
      "Manufaktur",
      "Kesehatan",
      "Domestic Worker"
    ],
    "sectorals": [
      {
        "sectoral": "Konstruksi",
        "position": "Juru Las"
      },
      {
        "sectoral": "Transportasi (Darat)",
        "position": "Driver"
      },
      {
        "sectoral": "Manufaktur",
        "position": "CNC"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Caregiver"
      },
      {
        "sectoral": "Domestic Worker",
        "position": "Housekeeper And Family Cook"
      },
      {
        "sectoral": "Domestic Worker",
        "position": "Caregiver"
      },
      {
        "sectoral": "Domestic Worker",
        "position": "House Maid"
      }
    ],
    "operationalReadinessScore": 86,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-046",
    "name": "Tadashi Samudera Global",
    "slug": "tadashi-samudera-global",
    "logo": "f62b2c03-15bb-4e74-b793-11d551cc20d9",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/f62b2c03-15bb-4e74-b793-11d551cc20d9",
    "providerType": "LPK",
    "provinsi": "Jawa Tengah",
    "kabupatenKota": "Jawa Tengah",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Proses Verifikasi",
    "accreditation": "Unggul",
    "capacityPerBatch": 85,
    "certifiedInstructorsCount": 17,
    "facilities": [
      "Simulasi Ruang Praktik Kerja Standar Luar Negeri",
      "Laboratorium Bahasa Asing (Jepang / Korea / Jerman)",
      "Ruang Wawancara Online & CBT",
      "Dojo Pembinaan Mental dan Fisik (FMD)"
    ],
    "supportedSectors": [
      "Bahasa "
    ],
    "sectorals": [
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Jepang"
      }
    ],
    "operationalReadinessScore": 93,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-047",
    "name": "POLITEKNIK BANJARNEGARA",
    "slug": "politeknik-banjarnegara-35ad1dc7",
    "logo": "e028026f-5a7d-48ea-b133-0482fa9dd8c5",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/e028026f-5a7d-48ea-b133-0482fa9dd8c5",
    "providerType": "Politeknik",
    "provinsi": "Jawa Tengah",
    "kabupatenKota": "Jawa Tengah",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "A",
    "capacityPerBatch": 100,
    "certifiedInstructorsCount": 20,
    "facilities": [
      "Fasilitas Pelatihan Vokasi Standar Nasional",
      "Laboratorium Praktik Terpadu",
      "Ruang Kelas Pembelajaran Interaktif"
    ],
    "supportedSectors": [
      "Bahasa ",
      "Kesehatan"
    ],
    "sectorals": [
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Jepang"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Kesehatan Lingkungan"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Kebidanan"
      },
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Korea"
      },
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Mandarin"
      },
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Inggris"
      }
    ],
    "operationalReadinessScore": 80,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-ACE-048",
    "name": "Universitas Muhammadiyah Aceh",
    "slug": "universitas-muhammadiyah-aceh-8e9a4275",
    "logo": "279b1b19-3bd2-4b3d-a457-2d965371e863",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/279b1b19-3bd2-4b3d-a457-2d965371e863",
    "providerType": "Universitas",
    "provinsi": "Aceh",
    "kabupatenKota": "Aceh",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Baik Sekali",
    "capacityPerBatch": 115,
    "certifiedInstructorsCount": 23,
    "facilities": [
      "Fasilitas Pelatihan Vokasi Standar Nasional",
      "Laboratorium Praktik Terpadu",
      "Ruang Kelas Pembelajaran Interaktif"
    ],
    "supportedSectors": [
      "Bahasa ",
      "Tourism, Travel, dan Hospitality"
    ],
    "sectorals": [
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Inggris"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Tour Operation Manager"
      }
    ],
    "operationalReadinessScore": 87,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-SUM-049",
    "name": "SMK SWASTA YAPIM TARUNA",
    "slug": "smk-swasta-yapim-taruna-59cf8017",
    "logo": "36dacb3f-363d-4bd3-9ca4-7e41fa8f8544",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/36dacb3f-363d-4bd3-9ca4-7e41fa8f8544",
    "providerType": "SMK",
    "provinsi": "Sumatera Utara",
    "kabupatenKota": "Sumatera Utara",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Unggul",
    "capacityPerBatch": 40,
    "certifiedInstructorsCount": 8,
    "facilities": [
      "Bengkel Kerja Praktik Standar Industri Kemendikbud",
      "Laboratorium Komputer & Bahasa Asing Terpadu",
      "Teaching Factory Terverifikasi DUDI",
      "Ruang Teori & Multimedia Interaktif"
    ],
    "supportedSectors": [
      "Industri",
      "Teknologi Informasi"
    ],
    "sectorals": [
      {
        "sectoral": "Industri",
        "position": "Otomotif"
      },
      {
        "sectoral": "Teknologi Informasi",
        "position": "Teknik Jaringan Komputer dan Telekomunikasi"
      }
    ],
    "operationalReadinessScore": 94,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-050",
    "name": "SMK Tunggal Prakarsa",
    "slug": "smk-tunggal-prakarsa-4a316503",
    "logo": "53be599c-a428-4a6b-9d1e-8188c647e546",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/53be599c-a428-4a6b-9d1e-8188c647e546",
    "providerType": "SMK",
    "provinsi": "Jawa Barat",
    "kabupatenKota": "Jawa Barat",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Baik Sekali",
    "capacityPerBatch": 55,
    "certifiedInstructorsCount": 11,
    "facilities": [
      "Bengkel Kerja Praktik Standar Industri Kemendikbud",
      "Laboratorium Komputer & Bahasa Asing Terpadu",
      "Teaching Factory Terverifikasi DUDI",
      "Ruang Teori & Multimedia Interaktif"
    ],
    "supportedSectors": [
      "Konstruksi"
    ],
    "sectorals": [
      {
        "sectoral": "Konstruksi",
        "position": "Mekanik Engine"
      }
    ],
    "operationalReadinessScore": 81,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-SUM-051",
    "name": "SMK SWASTA YAPIM BIRU-BIRU",
    "slug": "smk-swasta-yapim-biru-biru-5e582bac",
    "logo": "30e7727c-67a1-43fb-bb69-444e5bf4f511",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/30e7727c-67a1-43fb-bb69-444e5bf4f511",
    "providerType": "SMK",
    "provinsi": "Sumatera Utara",
    "kabupatenKota": "Sumatera Utara",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Proses Verifikasi",
    "accreditation": "A",
    "capacityPerBatch": 70,
    "certifiedInstructorsCount": 14,
    "facilities": [
      "Bengkel Kerja Praktik Standar Industri Kemendikbud",
      "Laboratorium Komputer & Bahasa Asing Terpadu",
      "Teaching Factory Terverifikasi DUDI",
      "Ruang Teori & Multimedia Interaktif"
    ],
    "supportedSectors": [
      "Industri",
      "Worker",
      "Teknologi Informasi"
    ],
    "sectorals": [
      {
        "sectoral": "Industri",
        "position": "Otomotif"
      },
      {
        "sectoral": "Worker",
        "position": "Teknik Pengelasan"
      },
      {
        "sectoral": "Teknologi Informasi",
        "position": "Teknik Jaringan Komputer dan Telekomunikasi"
      }
    ],
    "operationalReadinessScore": 88,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-052",
    "name": "SMK MINHAJUT THULLAB BULU CANDIMULYO",
    "slug": "smk-minhajut-thullab-bulu-candimulyo-00d7c39f",
    "logo": "f36daf78-d4fe-4fb2-91e5-2899278311b9",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/f36daf78-d4fe-4fb2-91e5-2899278311b9",
    "providerType": "SMK",
    "provinsi": "Jawa Timur",
    "kabupatenKota": "Jawa Timur",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Unggul",
    "capacityPerBatch": 85,
    "certifiedInstructorsCount": 17,
    "facilities": [
      "Bengkel Kerja Praktik Standar Industri Kemendikbud",
      "Laboratorium Komputer & Bahasa Asing Terpadu",
      "Teaching Factory Terverifikasi DUDI",
      "Ruang Teori & Multimedia Interaktif"
    ],
    "supportedSectors": [
      "Pertanian & Peternakan",
      "Bahasa "
    ],
    "sectorals": [
      {
        "sectoral": "Pertanian & Peternakan",
        "position": "Aquaculture specialist (budidaya ikan, udang, lobster, dll.)"
      },
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Korea"
      },
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Jepang"
      }
    ],
    "operationalReadinessScore": 95,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-RIA-053",
    "name": "SMK S YAPIM TARUNA MANDAU",
    "slug": "smk-s-yapim-taruna-mandau-6672641b",
    "logo": "1cf81fcd-590d-4ac8-a13c-42857de5b445",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/1cf81fcd-590d-4ac8-a13c-42857de5b445",
    "providerType": "SMK",
    "provinsi": "Riau",
    "kabupatenKota": "Riau",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "A",
    "capacityPerBatch": 100,
    "certifiedInstructorsCount": 20,
    "facilities": [
      "Bengkel Kerja Praktik Standar Industri Kemendikbud",
      "Laboratorium Komputer & Bahasa Asing Terpadu",
      "Teaching Factory Terverifikasi DUDI",
      "Ruang Teori & Multimedia Interaktif"
    ],
    "supportedSectors": [
      "Teknologi Informasi",
      "Bisnis dan Manajemen",
      "Industri"
    ],
    "sectorals": [
      {
        "sectoral": "Teknologi Informasi",
        "position": "Teknik Jaringan Komputer dan Telekomunikasi"
      },
      {
        "sectoral": "Bisnis dan Manajemen",
        "position": "Akuntansi dan Keuangan Lembaga"
      },
      {
        "sectoral": "Industri",
        "position": "Otomotif"
      }
    ],
    "operationalReadinessScore": 82,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-RIA-054",
    "name": "SMK SWASTA YAPIM TARUNA TAMBUSAI",
    "slug": "smk-swasta-yapim-taruna-tambusai-2c301ccb",
    "logo": "5c307cf5-26b1-4be0-9bc9-d876c8985c02",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/5c307cf5-26b1-4be0-9bc9-d876c8985c02",
    "providerType": "SMK",
    "provinsi": "Riau",
    "kabupatenKota": "Riau",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Baik Sekali",
    "capacityPerBatch": 115,
    "certifiedInstructorsCount": 23,
    "facilities": [
      "Bengkel Kerja Praktik Standar Industri Kemendikbud",
      "Laboratorium Komputer & Bahasa Asing Terpadu",
      "Teaching Factory Terverifikasi DUDI",
      "Ruang Teori & Multimedia Interaktif"
    ],
    "supportedSectors": [
      "Teknologi Informasi",
      "Industri",
      "Welder"
    ],
    "sectorals": [
      {
        "sectoral": "Teknologi Informasi",
        "position": "Teknik Jaringan Komputer dan Telekomunikasi"
      },
      {
        "sectoral": "Industri",
        "position": "Otomotif"
      },
      {
        "sectoral": "Welder",
        "position": "Teknisi Pengelasan"
      },
      {
        "sectoral": "Teknologi Informasi",
        "position": "Teknologi Farmasi"
      }
    ],
    "operationalReadinessScore": 89,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-SUM-055",
    "name": "SMK SWASTA YAPIM SEI GLUGUR 2",
    "slug": "smk-swasta-yapim-sei-glugur-2-0aa9455c",
    "logo": "6cc1b787-038a-4ebc-bd40-1603ed573cb1",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/6cc1b787-038a-4ebc-bd40-1603ed573cb1",
    "providerType": "SMK",
    "provinsi": "Sumatera Utara",
    "kabupatenKota": "Sumatera Utara",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Unggul",
    "capacityPerBatch": 40,
    "certifiedInstructorsCount": 8,
    "facilities": [
      "Bengkel Kerja Praktik Standar Industri Kemendikbud",
      "Laboratorium Komputer & Bahasa Asing Terpadu",
      "Teaching Factory Terverifikasi DUDI",
      "Ruang Teori & Multimedia Interaktif"
    ],
    "supportedSectors": [
      "Bisnis dan Manajemen"
    ],
    "sectorals": [
      {
        "sectoral": "Bisnis dan Manajemen",
        "position": "Akuntansi dan Keuangan Lembaga"
      }
    ],
    "operationalReadinessScore": 96,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-SUM-056",
    "name": "SMK SWASTA YAPIM TARUNA",
    "slug": "smk-swasta-yapim-taruna-3831b5e2",
    "logo": "39a48883-d8aa-49fa-a688-36247734d364",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/39a48883-d8aa-49fa-a688-36247734d364",
    "providerType": "SMK",
    "provinsi": "Sumatera Utara",
    "kabupatenKota": "Sumatera Utara",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Proses Verifikasi",
    "accreditation": "Baik Sekali",
    "capacityPerBatch": 55,
    "certifiedInstructorsCount": 11,
    "facilities": [
      "Bengkel Kerja Praktik Standar Industri Kemendikbud",
      "Laboratorium Komputer & Bahasa Asing Terpadu",
      "Teaching Factory Terverifikasi DUDI",
      "Ruang Teori & Multimedia Interaktif"
    ],
    "supportedSectors": [
      "Industri"
    ],
    "sectorals": [
      {
        "sectoral": "Industri",
        "position": "Otomotif"
      },
      {
        "sectoral": "Industri",
        "position": "Otomotif"
      }
    ],
    "operationalReadinessScore": 83,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-SUM-057",
    "name": "SMK SWASTA YAPIM TARUNA MEREK",
    "slug": "smk-swasta-yapim-taruna-merek-e597750e",
    "logo": "a8cd135e-7522-4381-8b0d-7717869fdbd0",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/a8cd135e-7522-4381-8b0d-7717869fdbd0",
    "providerType": "SMK",
    "provinsi": "Sumatera Utara",
    "kabupatenKota": "Sumatera Utara",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "A",
    "capacityPerBatch": 70,
    "certifiedInstructorsCount": 14,
    "facilities": [
      "Bengkel Kerja Praktik Standar Industri Kemendikbud",
      "Laboratorium Komputer & Bahasa Asing Terpadu",
      "Teaching Factory Terverifikasi DUDI",
      "Ruang Teori & Multimedia Interaktif"
    ],
    "supportedSectors": [
      "Teknologi Informasi"
    ],
    "sectorals": [
      {
        "sectoral": "Teknologi Informasi",
        "position": "Teknik Jaringan Komputer dan Telekomunikasi"
      }
    ],
    "operationalReadinessScore": 90,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-ACE-058",
    "name": "UPTD BLK Nagan Raya",
    "slug": "uptd-blk-nagan-raya-747226f8",
    "logo": "9ac990b1-acec-4076-91b0-0aa4d1d09c88",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/9ac990b1-acec-4076-91b0-0aa4d1d09c88",
    "providerType": "BLK",
    "provinsi": "Aceh",
    "kabupatenKota": "Aceh",
    "institutionStatus": "Negeri",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Unggul",
    "capacityPerBatch": 85,
    "certifiedInstructorsCount": 17,
    "facilities": [
      "Workshop Pelatihan Kejuruan Terakreditasi Kemnaker",
      "Pusat Sertifikasi Uji Kompetensi BNSP Terlisensi",
      "Mesin Bubut & Perkakas Otomasi",
      "Asrama Pelatihan & Ruang Kelas Teori"
    ],
    "supportedSectors": [
      "Welder",
      "Industri"
    ],
    "sectorals": [
      {
        "sectoral": "Welder",
        "position": "SMAW Plat"
      },
      {
        "sectoral": "Industri",
        "position": "Otomotif"
      }
    ],
    "operationalReadinessScore": 97,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-059",
    "name": "BLKK DARUNNAJAH",
    "slug": "blkk-darunnajah-10a10f24",
    "logo": "e95efa8c-0392-4edc-ba9b-734eb53a0c45",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/e95efa8c-0392-4edc-ba9b-734eb53a0c45",
    "providerType": "BLK",
    "provinsi": "Jawa Tengah",
    "kabupatenKota": "Jawa Tengah",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "A",
    "capacityPerBatch": 100,
    "certifiedInstructorsCount": 20,
    "facilities": [
      "Workshop Pelatihan Kejuruan Terakreditasi Kemnaker",
      "Pusat Sertifikasi Uji Kompetensi BNSP Terlisensi",
      "Mesin Bubut & Perkakas Otomasi",
      "Asrama Pelatihan & Ruang Kelas Teori"
    ],
    "supportedSectors": [
      "Tourism, Travel, dan Hospitality",
      "Teknologi Informasi",
      "Informal Worker ",
      "Domestic Worker"
    ],
    "sectorals": [
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Store Keeper"
      },
      {
        "sectoral": "Teknologi Informasi",
        "position": "Operator Komputer"
      },
      {
        "sectoral": "Informal Worker ",
        "position": "Housekeeper"
      },
      {
        "sectoral": "Domestic Worker",
        "position": "Caregiver"
      }
    ],
    "operationalReadinessScore": 84,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-060",
    "name": "BLK LN JABAR BAROKAH",
    "slug": "blk-ln-jabar-barokah-da11faa6",
    "logo": "ffe3e10e-46d8-4ffd-a4a8-c3bee981bb42",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/ffe3e10e-46d8-4ffd-a4a8-c3bee981bb42",
    "providerType": "BLK",
    "provinsi": "Jawa Barat",
    "kabupatenKota": "Jawa Barat",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Baik Sekali",
    "capacityPerBatch": 115,
    "certifiedInstructorsCount": 23,
    "facilities": [
      "Workshop Pelatihan Kejuruan Terakreditasi Kemnaker",
      "Pusat Sertifikasi Uji Kompetensi BNSP Terlisensi",
      "Mesin Bubut & Perkakas Otomasi",
      "Asrama Pelatihan & Ruang Kelas Teori"
    ],
    "supportedSectors": [
      "Domestic Worker"
    ],
    "sectorals": [
      {
        "sectoral": "Domestic Worker",
        "position": "Care Taker "
      }
    ],
    "operationalReadinessScore": 91,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-NUS-061",
    "name": "BLK PUTRI YANG MANDIRI",
    "slug": "blk-putri-yang-mandiri-4a22d6ae",
    "logo": "7fb1cae1-6c30-4573-b3bf-e9f1937943da",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/7fb1cae1-6c30-4573-b3bf-e9f1937943da",
    "providerType": "BLK",
    "provinsi": "Nusa Tenggara Timur",
    "kabupatenKota": "Nusa Tenggara Timur",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Proses Verifikasi",
    "accreditation": "Unggul",
    "capacityPerBatch": 40,
    "certifiedInstructorsCount": 8,
    "facilities": [
      "Workshop Pelatihan Kejuruan Terakreditasi Kemnaker",
      "Pusat Sertifikasi Uji Kompetensi BNSP Terlisensi",
      "Mesin Bubut & Perkakas Otomasi",
      "Asrama Pelatihan & Ruang Kelas Teori"
    ],
    "supportedSectors": [
      "Domestic Worker"
    ],
    "sectorals": [
      {
        "sectoral": "Domestic Worker",
        "position": "Baby Sitter"
      },
      {
        "sectoral": "Domestic Worker",
        "position": "Elderly Caretaker"
      },
      {
        "sectoral": "Domestic Worker",
        "position": "Domestic Worker"
      },
      {
        "sectoral": "Domestic Worker",
        "position": "Housekeeper And Family Cook"
      }
    ],
    "operationalReadinessScore": 78,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-062",
    "name": "BLK-LN CITRA ABDI PERTIWI",
    "slug": "blk-ln-citra-abdi-pertiwi-02978dde",
    "logo": "594f7f39-7227-4e76-aaa9-450e6bff4516",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/594f7f39-7227-4e76-aaa9-450e6bff4516",
    "providerType": "BLKLN",
    "provinsi": "Jawa Timur",
    "kabupatenKota": "Jawa Timur",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Baik Sekali",
    "capacityPerBatch": 55,
    "certifiedInstructorsCount": 11,
    "facilities": [
      "Fasilitas Pelatihan Vokasi Standar Nasional",
      "Laboratorium Praktik Terpadu",
      "Ruang Kelas Pembelajaran Interaktif"
    ],
    "supportedSectors": [
      "Domestic Worker"
    ],
    "sectorals": [
      {
        "sectoral": "Domestic Worker",
        "position": "Elderly Caretaker"
      }
    ],
    "operationalReadinessScore": 85,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-063",
    "name": "BLKLN GLOBAL MERCY",
    "slug": "blkln-global-mercy-19a5daa2",
    "logo": "45c9bc21-dd12-45dc-9699-b043cb35b6d8",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/45c9bc21-dd12-45dc-9699-b043cb35b6d8",
    "providerType": "BLKLN",
    "provinsi": "Jawa Tengah",
    "kabupatenKota": "Jawa Tengah",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "A",
    "capacityPerBatch": 70,
    "certifiedInstructorsCount": 14,
    "facilities": [
      "Fasilitas Pelatihan Vokasi Standar Nasional",
      "Laboratorium Praktik Terpadu",
      "Ruang Kelas Pembelajaran Interaktif"
    ],
    "supportedSectors": [
      "Domestic Worker"
    ],
    "sectorals": [
      {
        "sectoral": "Domestic Worker",
        "position": "Baby Sitter"
      },
      {
        "sectoral": "Domestic Worker",
        "position": "Care Taker "
      },
      {
        "sectoral": "Domestic Worker",
        "position": "Housekeeper And Family Cook"
      }
    ],
    "operationalReadinessScore": 92,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-064",
    "name": "BLK-LN FAJAR SEJAHTERA DUA",
    "slug": "blk-ln-fajar-sejahtera-dua-3aad56af",
    "logo": "71b1429f-5fe2-4555-a0f6-7fbf0ad7bf7c",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/71b1429f-5fe2-4555-a0f6-7fbf0ad7bf7c",
    "providerType": "BLKLN",
    "provinsi": "Jawa Tengah",
    "kabupatenKota": "Jawa Tengah",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "Unggul",
    "capacityPerBatch": 85,
    "certifiedInstructorsCount": 17,
    "facilities": [
      "Fasilitas Pelatihan Vokasi Standar Nasional",
      "Laboratorium Praktik Terpadu",
      "Ruang Kelas Pembelajaran Interaktif"
    ],
    "supportedSectors": [
      "Domestic Worker"
    ],
    "sectorals": [
      {
        "sectoral": "Domestic Worker",
        "position": "Domestic Worker"
      }
    ],
    "operationalReadinessScore": 79,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-065",
    "name": "BLKLN SANJAYA THANRY BAHTERA SRAGEN",
    "slug": "blkln-sanjaya-thanry-bahtera-sragen-76f71b9b",
    "logo": "f5eb40e9-fd80-4c17-9679-2b1c3338aa79",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/f5eb40e9-fd80-4c17-9679-2b1c3338aa79",
    "providerType": "BLKLN",
    "provinsi": "Jawa Tengah",
    "kabupatenKota": "Jawa Tengah",
    "institutionStatus": "Swasta",
    "evokasiVerificationStatus": "Terverifikasi e-Vokasi",
    "accreditation": "A",
    "capacityPerBatch": 100,
    "certifiedInstructorsCount": 20,
    "facilities": [
      "Fasilitas Pelatihan Vokasi Standar Nasional",
      "Laboratorium Praktik Terpadu",
      "Ruang Kelas Pembelajaran Interaktif"
    ],
    "supportedSectors": [
      "Domestic Worker"
    ],
    "sectorals": [
      {
        "sectoral": "Domestic Worker",
        "position": "Elderly Caretaker"
      },
      {
        "sectoral": "Domestic Worker",
        "position": "Domestic Worker"
      },
      {
        "sectoral": "Domestic Worker",
        "position": "Domestic Helper"
      },
      {
        "sectoral": "Domestic Worker",
        "position": "Maid"
      },
      {
        "sectoral": "Domestic Worker",
        "position": "Caregiver"
      },
      {
        "sectoral": "Domestic Worker",
        "position": "Housekeeper And Family Cook"
      },
      {
        "sectoral": "Domestic Worker",
        "position": "Care Taker "
      },
      {
        "sectoral": "Domestic Worker",
        "position": "House Maid"
      },
      {
        "sectoral": "Domestic Worker",
        "position": "Baby Sitter"
      }
    ],
    "operationalReadinessScore": 86,
    "source": "vokasi.kp2mi.go.id"
  },
  {
    "id": "KP2MI-JAW-066",
    "name": "UPT BLK DINAS TENAGA KERJA",
    "slug": "upt-blk-dinas-tenaga-kerja",
    "logo": "ab53c589-e55d-4b1f-8de2-0057fdb8ccd8",
    "logoUrl": "https://api-siskop2mi.kp2mi.go.id/vokasi-fe/file/public/show/ab53c589-e55d-4b1f-8de2-0057fdb8ccd8",
    "providerType": "BLK",
    "provinsi": "Jawa Barat",
    "kabupatenKota": "Jawa Barat",
    "institutionStatus": "Negeri",
    "evokasiVerificationStatus": "Proses Verifikasi",
    "accreditation": "Baik Sekali",
    "capacityPerBatch": 115,
    "certifiedInstructorsCount": 23,
    "facilities": [
      "Workshop Pelatihan Kejuruan Terakreditasi Kemnaker",
      "Pusat Sertifikasi Uji Kompetensi BNSP Terlisensi",
      "Mesin Bubut & Perkakas Otomasi",
      "Asrama Pelatihan & Ruang Kelas Teori"
    ],
    "supportedSectors": [
      "Bahasa ",
      "Domestic Worker",
      "Informal Worker ",
      "Seni dan Ekonomi Kreatif",
      "Kesehatan",
      "Konstruksi",
      "Teknologi Informasi",
      "Bisnis dan Manajemen",
      "Worker",
      "Manufaktur",
      "Tourism, Travel, dan Hospitality",
      "Industri"
    ],
    "sectorals": [
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Jerman"
      },
      {
        "sectoral": "Domestic Worker",
        "position": "Baby Sitter"
      },
      {
        "sectoral": "Domestic Worker",
        "position": "Caregiver"
      },
      {
        "sectoral": "Informal Worker ",
        "position": "Housekeeper"
      },
      {
        "sectoral": "Seni dan Ekonomi Kreatif",
        "position": "Tata Rias"
      },
      {
        "sectoral": "Seni dan Ekonomi Kreatif",
        "position": "Tata Rias"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Nursing Assistant"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Spa Therapist"
      },
      {
        "sectoral": "Kesehatan",
        "position": "Fisioterapi "
      },
      {
        "sectoral": "Konstruksi",
        "position": "Instalasi Listrik"
      },
      {
        "sectoral": "Konstruksi",
        "position": "K3 Konstruksi"
      },
      {
        "sectoral": "Teknologi Informasi",
        "position": "Teknik Jaringan Komputer dan Telekomunikasi"
      },
      {
        "sectoral": "Bisnis dan Manajemen",
        "position": "Pemasaran"
      },
      {
        "sectoral": "Seni dan Ekonomi Kreatif",
        "position": "Busana"
      },
      {
        "sectoral": "Seni dan Ekonomi Kreatif",
        "position": "Tata Rias"
      },
      {
        "sectoral": "Worker",
        "position": "Teknik Pengelasan"
      },
      {
        "sectoral": "Worker",
        "position": "Teknik Pemesinan"
      },
      {
        "sectoral": "Manufaktur",
        "position": "CNC"
      },
      {
        "sectoral": "Manufaktur",
        "position": "Bubut"
      },
      {
        "sectoral": "Manufaktur",
        "position": "Garment/Tailor"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Front Office Cashier / Outlet Cashier / Night Auditor"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Bartender"
      },
      {
        "sectoral": "Tourism, Travel, dan Hospitality",
        "position": "Chef de Partie"
      },
      {
        "sectoral": "Industri",
        "position": "Pengolahan Makanan"
      },
      {
        "sectoral": "Industri",
        "position": "Otomotif"
      },
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Korea"
      },
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Jepang"
      },
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Inggris"
      },
      {
        "sectoral": "Bahasa ",
        "position": "Bahasa Mandarin"
      }
    ],
    "operationalReadinessScore": 93,
    "source": "vokasi.kp2mi.go.id"
  }
];
