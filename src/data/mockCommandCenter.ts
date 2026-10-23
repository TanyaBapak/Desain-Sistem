import { StageDetail, AggregateMatchingItem } from '../types';

export const mockStageDetails: StageDetail[] = [
  {
    id: 1,
    title: 'Tahap 1',
    subtitle: 'Pengumpulan Data (Data Ingestion)',
    pic: 'Disnaker Provinsi, BP3MI & Tim Task Force',
    deadline: '15 November 2026',
    status: 'Selesai',
    progressPercent: 100,
    bottleneckNotes: 'Integrasi data Disnaker Kab/Kota berjalan 92%. Perlu sinkronisasi berkala ijazah kelulusan SMK tahun ajaran 2026.',
    keyActions: [
      'Agregasi data pencari kerja lulusan SMK & D3',
      'Pendaftaran kuota kapasitas lembaga vokasi',
      'Penarikan lowongan demand terverifikasi dari SISKOP2MI'
    ]
  },
  {
    id: 2,
    title: 'Tahap 2',
    subtitle: 'Validasi dan Standardisasi',
    pic: 'Pusdatin P2MI & Tim Verifikator Dukcapil',
    deadline: '22 November 2026',
    status: 'Selesai',
    progressPercent: 95,
    bottleneckNotes: 'Deduplikasi data NIK tuntas. Sekitar 5% sertifikat kompetensi bahasa memerlukan konfirmasi ulang ke lembaga penguji.',
    keyActions: [
      'Deduplikasi NIK calon peserta via integrasi Dukcapil',
      'Validasi kelayakan operasional sarana e-Vokasi',
      'Standardisasi taksonomi kejuruan & sertifikasi internasional'
    ]
  },
  {
    id: 3,
    title: 'Tahap 3',
    subtitle: 'Analisis Gap dan Smart Matching',
    pic: 'Task Force Nasional & Smart Matching Engine',
    deadline: '30 November 2026',
    status: 'Sedang Berjalan',
    progressPercent: 78,
    bottleneckNotes: 'Kesenjangan tertinggi pada penguasaan bahasa Jepang (JLPT N4/JFT-Basic) dan bahasa Jerman level B1.',
    keyActions: [
      'Perhitungan Skor Matching (Keterampilan 50%, Bahasa 35%, Pendidikan 15%)',
      'Pemetaan kesenjangan kompetensi individu terhadap syarat employer',
      'Rekomendasi kurikulum Modul B untuk menutup gap keterampilan'
    ]
  },
  {
    id: 4,
    title: 'Tahap 4',
    subtitle: 'Penetapan Program dan Lembaga (SK Alokasi)',
    pic: 'Ditjen P3KLN & Direktorat PKV PMI',
    deadline: '05 Desember 2026',
    status: 'Sedang Berjalan',
    progressPercent: 65,
    bottleneckNotes: 'Pagu anggaran APBN sedang dalam tahap finalisasi telaah Kemenkeu untuk alokasi 12 batch prioritas.',
    keyActions: [
      'Penentuan kuota peserta per wilayah dan sektor prioritas',
      'Penunjukan lembaga vokasi berakreditasi Unggul/A',
      'Penerbitan Surat Keputusan (SK) Penetapan Alokasi Batch & Anggaran'
    ]
  },
  {
    id: 5,
    title: 'Tahap 5',
    subtitle: 'Pelaksanaan Pelatihan dan Monitoring JP',
    pic: 'Balai Besar Vokasi (BBPVP), SMK & Asesor BNSP',
    deadline: '28 Februari 2027',
    status: 'Sedang Berjalan',
    progressPercent: 42,
    bottleneckNotes: 'Pelaksanaan kelas Bahasa Jepang Kaigo berjalan di 4 LPK Jawa Barat. Kehadiran peserta rata-rata 96,4%.',
    keyActions: [
      'Pembukaan kelas pelatihan teknis intensif dan bahasa asing',
      'Monitoring presensi peserta dan pemenuhan target Jam Pelajaran (JP)',
      'Pelaksanaan asesmen uji kompetensi BNSP dan tes sertifikasi negara tujuan'
    ]
  },
  {
    id: 6,
    title: 'Tahap 6',
    subtitle: 'Job Matching dan Penempatan Resmi (SISKOP2MI)',
    pic: 'BP3MI, Atase Ketenagakerjaan & SISKOP2MI',
    deadline: '30 Maret 2027',
    status: 'Menunggu',
    progressPercent: 20,
    bottleneckNotes: 'Menunggu kelulusan sertifikasi SSW CBT Kaigo & visa E-7 welder untuk penjadwalan tiket penerbangan.',
    keyActions: [
      'Wawancara akhir (user interview) dengan employer luar negeri',
      'Penerbitan Certificate of Eligibility (CoE) dan kontrak kerja resmi',
      'Proses visa penempatan PMI resmi melalui sistem rujukan SISKOP2MI'
    ]
  }
];

export const mockAggregateMatching: AggregateMatchingItem[] = [
  {
    id: 'AGG-001',
    country: 'Jepang',
    sector: 'Kesehatan & Caregiver',
    jobTitle: 'Caregiver / Kaigo Worker (SSW)',
    demandQuota: 500,
    verifiedSupply: 700,
    providerCapacity: 400,
    gapSeat: -100, // Defisit 100 kursi pelatihan
    actionPlan: 'Tambah 3 kelas paralel di LPK Jawa Barat & redistribusi 50 kursi ke BBPVP Bandung',
    responsiblePic: 'Direktorat PKV PMI & BP3MI Jawa Barat'
  },
  {
    id: 'AGG-002',
    country: 'Jepang',
    sector: 'Manufaktur & Pengelasan',
    jobTitle: 'Welder / Metal Fabricator (SSW Seizo)',
    demandQuota: 300,
    verifiedSupply: 450,
    providerCapacity: 350,
    gapSeat: 50, // Surplus kapasitas
    actionPlan: 'Kapasitas lembaga memadai. Akselerasi pendaftaran Computer Based Testing (CBT) SSW',
    responsiblePic: 'Ditjen P3KLN & Balai Vokasi'
  },
  {
    id: 'AGG-003',
    country: 'Jerman',
    sector: 'Perhotelan & Pariwisata',
    jobTitle: 'Hotel Specialist (Duales Ausbildung)',
    demandQuota: 180,
    verifiedSupply: 220,
    providerCapacity: 150,
    gapSeat: -30, // Defisit 30 kursi
    actionPlan: 'Kerja sama penambahan kuota kelas intensif Bahasa Jerman B1 di Politeknik Pariwisata Bali',
    responsiblePic: 'Task Force Nasional & Kemendikbud'
  },
  {
    id: 'AGG-004',
    country: 'Korea Selatan',
    sector: 'Perkapalan & Galangan Kapal',
    jobTitle: 'Shipbuilding Welder (Visa Profesional E-7)',
    demandQuota: 350,
    verifiedSupply: 480,
    providerCapacity: 300,
    gapSeat: -50, // Defisit 50 kursi
    actionPlan: 'Buka workshop pengelasan FCAW 6G di BBPVP Bandung dan SMKN 7 Semarang',
    responsiblePic: 'Pusdatin & Asosiasi KOSHIPA'
  }
];

export interface RegionDrillDownData {
  provinsi: string;
  kabupatenList: {
    nama: string;
    sektorList: {
      sektor: string;
      supplyCount: number;
      readyCount: number;
      providerCount: number;
      targetDemand: number;
      targetCountry: string;
      hambatanUtama: string;
      picTindakLanjut: string;
    }[];
  }[];
}

export const mockDrillDownData: RegionDrillDownData[] = [
  {
    provinsi: 'Jawa Barat',
    kabupatenList: [
      {
        nama: 'Kabupaten Bogor',
        sektorList: [
          {
            sektor: 'Kesehatan / Caregiver',
            supplyCount: 145,
            readyCount: 88,
            providerCount: 3,
            targetDemand: 120,
            targetCountry: 'Jepang',
            hambatanUtama: '32 peserta belum menyelesaikan sertifikat JLPT N4; perlu kelas kaiwa intensif 40 JP.',
            picTindakLanjut: 'Disnaker Kab. Bogor & LPK Mitra Kaigo'
          },
          {
            sektor: 'Teknik Pengelasan Logam',
            supplyCount: 95,
            readyCount: 65,
            providerCount: 2,
            targetDemand: 80,
            targetCountry: 'Jepang & Korea',
            hambatanUtama: 'Kekurangan bahan uji plat pengelasan 3G di workshop SMKN 1 Cibinong.',
            picTindakLanjut: 'Direktorat PKV PMI (Bantuan Alpal)'
          }
        ]
      },
      {
        nama: 'Kota Bandung',
        sektorList: [
          {
            sektor: 'Manufaktur & Elektronika',
            supplyCount: 120,
            readyCount: 90,
            providerCount: 4,
            targetDemand: 100,
            targetCountry: 'Taiwan & Jepang',
            hambatanUtama: 'Paspor peserta belum diterbitkan; perlu percepatan layanan kolektif di Imigrasi Bandung.',
            picTindakLanjut: 'BP3MI Jawa Barat & Ditjen Imigrasi'
          }
        ]
      }
    ]
  },
  {
    provinsi: 'Jawa Tengah',
    kabupatenList: [
      {
        nama: 'Kota Semarang',
        sektorList: [
          {
            sektor: 'Mekatronika & Konstruksi',
            supplyCount: 160,
            readyCount: 110,
            providerCount: 3,
            targetDemand: 90,
            targetCountry: 'Jepang & Jerman',
            hambatanUtama: 'Kesiapan dokumen legalisir ijazah untuk kontrak Duales Ausbildung Jerman.',
            picTindakLanjut: 'Disnaker Provinsi Jateng & Goethe Institut'
          }
        ]
      },
      {
        nama: 'Kabupaten Banyumas',
        sektorList: [
          {
            sektor: 'Kesehatan / Caregiver',
            supplyCount: 180,
            readyCount: 135,
            providerCount: 2,
            targetDemand: 150,
            targetCountry: 'Jepang',
            hambatanUtama: 'Tersedia 45 peserta siap uji; menunggu slot kuota CBT Prometric Jakarta.',
            picTindakLanjut: 'Atase Naker Tokyo & Task Force Pusat'
          }
        ]
      }
    ]
  },
  {
    provinsi: 'Jawa Timur',
    kabupatenList: [
      {
        nama: 'Kota Surabaya',
        sektorList: [
          {
            sektor: 'Pengelasan Galangan Kapal',
            supplyCount: 210,
            readyCount: 160,
            providerCount: 4,
            targetDemand: 180,
            targetCountry: 'Korea Selatan',
            hambatanUtama: 'Verifikasi sertifikat BV/DNV International Welder memerlukan waktu 10 hari kerja.',
            picTindakLanjut: 'Biro Kerja Sama Luar Negeri P2MI'
          }
        ]
      }
    ]
  }
];
