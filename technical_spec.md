# Spesifikasi Arsitektur Teknis & Model Data Frontend MVP
**Platform SMK Go Global — Kementerian Pelindungan Pekerja Migran Indonesia (P2MI)**

Dokumen ini memuat spesifikasi arsitektur data *client-side*, model antarmuka TypeScript, serta logika algoritma *matching* dan alokasi sistem untuk pengembangan **Frontend MVP** tanpa backend.

---

## 1. Arsitektur Data Frontend & Client State Store

Sistem MVP mengandalkan state terpusat (*Global Client Store*) menggunakan Zustand (`useAppStore.ts`). Seluruh manipulasi data (penyaringan, kalkulasi skor matching, simulasi verifikasi, dan alokasi program) dilakukan secara *in-memory*.

### Diagram Alur Data Frontend MVP

```
[ Mock Data JSON (A, B, C, D) ]
              │
              ▼
    [ Global Zustand Store ] ───► [ Client-Side Matching Engine ]
              │                                │
              ▼                                ▼
[ UI Views (Modul A, B, C, D) ]    [ Tahap 3 & 4 Simulation Views ]
```

---

## 2. Definisi Tipe Data & Interface (TypeScript Schemas)

Semua tipe data didefinisikan secara ketat dalam `@/types/index.ts`:

```typescript
// ==========================================
// MODUL A: SUPPLY INTELLIGENCE
// ==========================================
export type ReadinessStatus = 'Ready for Placement' | 'Needs Upskilling' | 'Needs Reskilling';
export type VerificationStatus = 'Verified' | 'Pending Verification' | 'Unverified';

export interface CandidateParticipant {
  id: string; // e.g. "CAND-2026-001"
  nik: string; // Masked e.g. "3201************"
  fullName: string;
  gender: 'L' | 'P';
  provinsi: string;
  kabupatenKota: string;
  educationLevel: 'SMK' | 'D3' | 'S1' | 'Lainnya';
  institutionName: string; // e.g. "SMKN 1 Gandapura"
  major: string; // e.g. "Teknik Pengelasan", "Kesehatan/Caregiver"
  skills: string[]; // e.g. ["Arc Welding", "GMAW", "Safety Standard"]
  languageProficiency: {
    language: 'Jepang' | 'Jerman' | 'Inggris' | 'Mandarin' | 'Korea';
    level: string; // e.g. "JLPT N4", "A2", "TOEIC 600", "Basic"
  }[];
  preferredCountry: string[]; // e.g. ["Jepang", "Jerman"]
  preferredJobRole: string[]; // e.g. ["Welder", "Caregiver"]
  readinessStatus: ReadinessStatus;
  verificationStatus: VerificationStatus;
}

// ==========================================
// MODUL B: TRAINING PROGRAM INTELLIGENCE
// ==========================================
export type ProgramType = 'Upskilling' | 'Reskilling' | 'Pelatihan Bahasa' | 'Teknis Terpadu';

export interface TrainingProgram {
  id: string; // e.g. "PROG-JPN-01"
  title: string;
  programType: ProgramType;
  targetSector: string; // e.g. "Kesehatan", "Industri Manufaktur"
  targetJobRole: string; // e.g. "Caregiver / Kaigo", "Welder"
  targetCountry: string;
  durationJP: number; // Jam Pelajaran, e.g. 320
  certificationTarget: string; // e.g. "Sertifikasi BNSP + SSW Tokutei Ginou"
  estimatedCostPerParticipant: number; // IDR
  quota: number;
  enrolledCount: number;
  scheduleStart: string; // ISO Date String
  scheduleEnd: string;
  curriculumOutline: string[];
}

// ==========================================
// MODUL C: VOCATIONAL PROVIDER READINESS
// ==========================================
export type ProviderType = 'SMK' | 'BLK' | 'LPK' | 'LKP' | 'Perguruan Tinggi / Politeknik';

export interface VocationalProvider {
  id: string; // e.g. "VOC-JBR-002"
  name: string;
  providerType: ProviderType;
  provinsi: string;
  kabupatenKota: string;
  evokasiVerificationStatus: 'Terverifikasi e-Vokasi' | 'Proses Verifikasi' | 'Belum Terverifikasi';
  accreditation: 'A' | 'B' | 'Unggul' | 'Baik Sekali';
  capacityPerBatch: number;
  certifiedInstructorsCount: number;
  facilities: string[]; // e.g. ["Bengkel Las Standard ISO", "Lab Bahasa Komputer"]
  supportedSectors: string[];
  operationalReadinessScore: number; // 0 - 100
}

// ==========================================
// MODUL D: GLOBAL DEMAND INTELLIGENCE
// ==========================================
export interface GlobalDemand {
  id: string; // e.g. "DEM-JPN-2026-08"
  jobTitle: string;
  employerName: string;
  country: string;
  sector: string;
  requiredQuota: number;
  filledQuota: number;
  minEducation: string;
  requiredSkills: string[];
  requiredLanguageLevel: string; // e.g. "JLPT N4 or N3"
  requiredCertifications: string[];
  deadlineDate: string;
  workTermMonths: number;
  salaryRangeString: string; // e.g. "JPY 180,000 - 220,000 / bulan"
}

// ==========================================
// MATCHING & ALLOCATION MODELS (TAHAP 3 & 4)
// ==========================================
export interface MatchingResult {
  candidateId: string;
  demandId: string;
  matchScore: number; // Percentage 0 - 100%
  skillsMatchPercentage: number;
  languageMatch: boolean;
  skillGaps: string[];
  languageGapDescription: string;
  recommendedProgramId?: string;
}

export interface ProgramAllocationDecision {
  allocationId: string;
  demandId: string;
  selectedProgramId: string;
  selectedProviderId: string;
  allocatedCandidateIds: string[];
  totalBudgetRequired: number;
  batchScheduleStart: string;
  batchScheduleEnd: string;
  approvalStatus: 'Draft' | 'Approved' | 'Finalized';
}
```

---

## 3. Logika & Algoritma Client-Side 4 Tahapan Sistem

### 3.1 Tahap 1 — Simulator Pengumpulan Data (Data Ingestion)
* **Logika:** Menggabungkan dataset dari `mockSupply.ts`, `mockPrograms.ts`, `mockProviders.ts`, dan `mockDemand.ts` ke dalam Zustand State.
* **Fungsi Helper:**
  ```typescript
  import { create } from 'zustand';
  import { mockSupply, mockPrograms, mockProviders, mockDemand } from '@/data/mockData';

  export const useAppStore = create<AppState>((set, get) => ({
    candidates: mockSupply,
    programs: mockPrograms,
    providers: mockProviders,
    demands: mockDemand,
    // Action untuk mereset/memuat ulang data
    resetToDefaultData: () => set({
      candidates: mockSupply,
      programs: mockPrograms,
      providers: mockProviders,
      demands: mockDemand
    }),
  }));
  ```

### 3.2 Tahap 2 — Validasi & Standardisasi
* **Logika Filter Deduplikasi & Standardisasi:**
  * Menyaring kandidat hanya yang berstatus `verificationStatus === 'Verified'`.
  * Menyaring lembaga vokasi yang terverifikasi di e-Vokasi (`evokasiVerificationStatus === 'Terverifikasi e-Vokasi'`).

### 3.3 Tahap 3 — Formulasi Algoritma Matching (Gap Analysis)
Setiap kandidat dihitung kesesuaiannya (*Matching Score*) terhadap suatu *Global Demand*:

$$\text{Match Score} = (\text{Skill Weight} \times 0.50) + (\text{Language Weight} \times 0.35) + (\text{Education Weight} \times 0.15)$$

* **Formulasi Klien:**
  ```typescript
  export function calculateMatchingScore(candidate: CandidateParticipant, demand: GlobalDemand): MatchingResult {
    // 1. Skill Match Calculation
    const matchedSkills = candidate.skills.filter(s => demand.requiredSkills.includes(s));
    const skillScore = demand.requiredSkills.length > 0 
      ? (matchedSkills.length / demand.requiredSkills.length) * 100 
      : 100;
    const skillGaps = demand.requiredSkills.filter(s => !candidate.skills.includes(s));

    // 2. Language Match Calculation
    const candidateLang = candidate.languageProficiency.find(l => l.language.toLowerCase() === demand.country.toLowerCase() || demand.requiredLanguageLevel.includes(l.language));
    const languageMatch = candidateLang ? true : false;
    const languageScore = languageMatch ? 100 : 40; // Base score jika belum mencapai level

    // 3. Overall Weighted Score
    const totalScore = Math.round((skillScore * 0.50) + (languageScore * 0.35) + (100 * 0.15));

    return {
      candidateId: candidate.id,
      demandId: demand.id,
      matchScore: totalScore,
      skillsMatchPercentage: Math.round(skillScore),
      languageMatch,
      skillGaps,
      languageGapDescription: languageMatch ? 'Memenuhi Standar' : `Membutuhkan peningkatan ke ${demand.requiredLanguageLevel}`,
    };
  }
  ```

### 3.4 Tahap 4 — Simulasi Penetapan Program & Lembaga
* **Logika:**
  1. User memilih *Demand* target (Modul D).
  2. User memilih daftar *Candidate* ber-score tinggi (Modul A).
  3. User menetapkan *Program Pelatihan* yang sesuai (Modul B).
  4. User memilih *Lembaga Vokasi* penyelenggara berdasarkan kapasitas & kesiapan operasional (Modul C).
  5. Sistem menghitung total kebutuhan anggaran:
     $$\text{Total Budget} = \text{Jumlah Peserta} \times \text{Cost per Participant (Modul B)}$$
  6. Hasil penetapan disimpan ke dalam state array `allocations` untuk ditampilkan di dashboard penetapan.
