# Spesifikasi UI/UX & Design System — Frontend MVP SMK Go Global
**Kementerian Pelindungan Pekerja Migran Indonesia (P2MI)**

Dokumen ini merupakan panduan spesifikasi antarmuka pengguna (UI/UX) dan sistem desain (*design system*) untuk pembuatan **Frontend MVP** platform SMK Go Global. Pengabdian spesifikasi ini sepenuhnya berfokus pada pengalaman pengguna (*client-side interface*), tata letak (*layout*), serta interaktivitas tanpa ketergantungan pada API backend.

---

## 1. Design Tokens & Visual Guidelines

### 1.1 Palet Warna Utama (Color Palette)
Gunakan kombinasi warna resmi Kementerian P2MI yang memberikan kesan profesional, tepercaya, dan modern:

* **Primary Navy (P2MI Blue):** `#0F172A` (Slate 900) / `#1E3A8A` (Blue 900)
* **Secondary Brand Blue:** `#2563EB` (Blue 600) / `#3B82F6` (Blue 500)
* **Accent Red (KP2MI Identity):** `#DC2626` (Red 600) / `#EF4444` (Red 500)
* **Status Success (Tersertifikasi / Valid):** `#059669` (Emerald 600)
* **Status Warning (Perlu Upskilling / Gap):** `#D97706` (Amber 600)
* **Status Neutral / Background:** `#F8FAFC` (Slate 50) / `#F1F5F9` (Slate 100)
* **Text Main / Muted:** `#0F172A` (Text Primary) / `#64748B` (Text Muted)

### 1.2 Tipografi & Spacing
* **Font Family:** `Inter`, `Plus Jakarta Sans`, atau `sans-serif`.
* **Scale:**
  * `Heading 1`: 30px / 36px (Bold - Title Modul & Dashboard)
  * `Heading 2`: 24px / 32px (SemiBold - Sub-modul & Section)
  * `Heading 3`: 18px / 24px (Medium - Card Titles & Filter Group)
  * `Body Text`: 14px / 20px (Regular/Medium)
  * `Caption / Badge`: 12px / 16px (Medium/SemiBold)

---

## 2. Struktur Navigasi & Komponen Global MVP

### 2.1 Top Navigation Bar (`HeaderNav`)
* **Logo & Brand:** Logo Kementerian P2MI + Badge "SMK Go Global MVP".
* **Quick Navigation Tabs:**
  1. `Modul A: Supply Intelligence`
  2. `Modul B: Program Pelatihan`
  3. `Modul C: Kesiapan Lembaga Vokasi`
  4. `Modul D: Demand Luar Negeri`
  5. `Matching & Simulasi Penetapan (Tahap 1-4)`
* **Quick Links External:** Shortcut indikatif ke *Portal E-Vokasi* dan *SISKOP2MI*.

### 2.2 Indicators Stepper (`SystemStageStepper`)
Komponen visual untuk menampilkan posisi alur kerja 4 Tahapan Sistem SMK Go Global:
* **Tahap 1:** Pengumpulan Data (Supply, Demand, Vokasi)
* **Tahap 2:** Validasi & Standardisasi
* **Tahap 3:** Analisis Gap & Matching
* **Tahap 4:** Penetapan Program & Alokasi Lembaga

---

## 3. Spesifikasi UI per Modul (Dashboard Layouts)

### 3.1 Modul A — Supply Intelligence (Bank Calon Peserta)
**Tujuan Antarmuka:** Menampilkan agregasi data calon pekerja migran vokasi.

* **Layout Panel Filter (Sidebar / Top Bar):**
  * Multi-select Filter: *Provinsi, Kabupaten/Kota, Tingkat Pendidikan (SMK/D3/S1), Jurusan, Bahasa (Jepang/Jerman/Inggris/Mandarin), Status Kesiapan Pelatihan, Status Verifikasi*.
* **Main Data Table / Grid View:**
  * Kolom: Nama Candidate ID, Domisili, Jurusan/Pendidikan, Skor Bahasa, Keterampilan Utama, Minat Negara/Jabatan, Status Kesiapan (*Ready / Need Upskilling*), Status Verifikasi (*Verified / Pending*).
  * Quick Action: *Detail Profil Candidate*, *Simulasi Add to Matching Pool*.

### 3.2 Modul B — Training Program Intelligence
**Tujuan Antarmuka:** Katalog dan manajemen program pelatihan kompetensi & bahasa.

* **Kategori Tab Pelatihan:**
  * `All Programs`, `Upskilling`, `Reskilling`, `Pelatihan Bahasa`, `Pelatihan Teknis Terpadu`.
* **Card Program Component (`ProgramCard`):**
  * Header: Judul Program, Badge Sektor/Jabatan, Negara Tujuan Target.
  * Body: Durasi Jam Pelajaran (JP), Standar Sertifikasi, Estimasi Biaya per Peserta, Kuota Kelas & Slot Tersedia.
  * Footer: Tombol *Lihat Detail Kurikulum* & *Pilih untuk Alokasi Tahap 4*.

### 3.3 Modul C — Vocational Provider Readiness
**Tujuan Antarmuka:** Direktori dan penilaian kelayakan lembaga vokasi terverifikasi.

* **Layout Integrasi e-Vokasi:**
  * Filter Jenis Lembaga: *SMK, BLK, LPK, LKP, Perguruan Tinggi/Politeknik*.
* **Grid Card Lembaga (`ProviderCard`):**
  * Header: Nama Lembaga, Lokasi (Provinsi/Kabupaten), Badge Akreditasi & Status Verifikasi e-Vokasi.
  * Metric Chips: Kapasitas Kelas, Jumlah Instruktur Tersertifikasi, Kelengkapan Fasilitas Lab/Bengkel.
  * Sektor Spesialisasi: Badge *Healthcare/Caregiver, Welder, Tourism, IT, Construction*.

### 3.4 Modul D — Global Demand Intelligence
**Tujuan Antarmuka:** Pemetaan lowongan kerja luar negeri & persyaratannya.

* **Demand Metric Cards (Header Summary):**
  * Total Kebutuhan PMI, Negara Tujuan Terbanyak, Sektor Prioritas, Deadline Rekrutmen Terdekat.
* **Job Demand List & Modal Detail:**
  * Informasi Card: Jabatan/Role, Employer, Negara Tujuan, Jumlah Kuota, Minimum Level Bahasa (misal: JLPT N4 / SSW Tokutei Ginou), Sertifikasi Wajib, Batas Waktu.
  * Action: *Jalankan Engine Matching dengan Modul A*.

---

## 4. Komponen UI React + Tailwind CSS (Sample Prototypes)

### 4.1 Stepper Tahapan Sistem (`SystemStageStepper.tsx`)
```tsx
import React from 'react';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';

interface StepperProps {
  currentStage: number; // 1, 2, 3, or 4
  onSelectStage: (stage: number) => void;
}

const stages = [
  { id: 1, title: 'Tahap 1', subtitle: 'Pengumpulan Data' },
  { id: 2, title: 'Tahap 2', subtitle: 'Validasi & Standardisasi' },
  { id: 3, title: 'Tahap 3', subtitle: 'Analisis Gap & Matching' },
  { id: 4, title: 'Tahap 4', subtitle: 'Penetapan Program' },
];

export const SystemStageStepper: React.FC<StepperProps> = ({ currentStage, onSelectStage }) => {
  return (
    <div className="w-full bg-slate-900 text-white p-4 rounded-xl shadow-md mb-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        {stages.map((stg, idx) => {
          const isActive = currentStage === stg.id;
          const isCompleted = currentStage > stg.id;
          return (
            <React.Fragment key={stg.id}>
              <div
                onClick={() => onSelectStage(stg.id)}
                className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-all ${
                  isActive ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                ) : isActive ? (
                  <Circle className="w-6 h-6 text-blue-300 fill-blue-300" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-600" />
                )}
                <div>
                  <p className="text-xs uppercase tracking-wider">{stg.title}</p>
                  <p className="text-sm font-semibold">{stg.subtitle}</p>
                </div>
              </div>
              {idx < stages.length - 1 && (
                <ArrowRight className="hidden md:block w-5 h-5 text-slate-600" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
```

### 4.2 Matching Gap Card (`MatchingGapCard.tsx`)
```tsx
import React from 'react';
import { Award, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface GapProps {
  candidateName: string;
  targetJob: string;
  country: string;
  matchScore: number; // e.g. 85%
  skillGap: string[];
  languageGap: string;
  recommendedProgram: string;
}

export const MatchingGapCard: React.FC<GapProps> = ({
  candidateName,
  targetJob,
  country,
  matchScore,
  skillGap,
  languageGap,
  recommendedProgram,
}) => {
  return (
    <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-lg text-slate-900">{candidateName}</h4>
          <p className="text-sm text-slate-500">Target: <span className="font-medium text-slate-700">{targetJob} ({country})</span></p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          matchScore >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
        }`}>
          {matchScore}% Match
        </div>
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-3 text-sm">
        <div className="flex items-center gap-2 text-slate-700">
          <Award className="w-4 h-4 text-blue-600" />
          <span>Analisis Bahasa: <strong className="text-amber-600">{languageGap}</strong></span>
        </div>
        <div className="flex items-start gap-2 text-slate-700">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
          <div>
            <span>Gap Keterampilan:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {skillGap.map((sk, i) => (
                <span key={i} className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded">
                  {sk}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-2 rounded-lg mt-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold">Rekomendasi Modul B: {recommendedProgram}</span>
        </div>
      </div>
    </div>
  );
};
```
