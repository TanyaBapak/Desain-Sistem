# Panduan Konfigurasi & Instruksi AI Agent
**Proyek:** Frontend MVP Platform SMK Go Global (Kementerian P2MI)

File ini ditujukan khusus bagi **AI Coding Agent** (seperti Cursor, Claude Code, Windsurf, atau Copilot) sebagai acuan instruksi utama (*Context & System Rules*) untuk mengembangkan aplikasi antarmuka MVP SMK Go Global secara konsisten dan tanpa backend.

---

## 1. Peran & Lingkup Kerja AI Agent

* **Peran:** Senior Frontend Engineer & UI/UX Implementer.
* **Tujuan Utama:** Membangun aplikasi web Frontend MVP yang interaktif, responsif, dan kaya fitur visual untuk menyimulasikan 4 Modul Intelijen (Modul A, B, C, D) serta 4 Tahapan Sistem SMK Go Global.
* **Batasan Utama (Strict Constraint):** **TIDAK ADA BACKEND ATAU DATABASE LIVE**. Seluruh data diolah secara interaktif di sisi klien (*Client-Side Mocking*) menggunakan *TypeScript state*, *Zustand*, atau *React Context* dengan dataset sampel JSON.

---

## 2. Tech Stack & Library MVP

* **Framework:** Next.js 14+ (App Router) ATAU React 18 + Vite (TypeScript).
* **Styling:** Tailwind CSS v3+.
* **Icons:** `lucide-react`.
* **State Management:** `zustand` (rekomendasi untuk state global sederhana) atau React Context API.
* **Component Utilities:** `clsx`, `tailwind-merge`.
* **Table / UI Enhancements:** `@tanstack/react-table` (opsional untuk tabel data Modul A/D) atau Tailwind HTML Native Tables.

---

## 3. Arsitektur Folder Proyek

AI Agent wajib mengikuti struktur folder berikut:

```
smk-goglobal-mvp/
├── src/
│   ├── app/                      # App Router Pages (Next.js)
│   │   ├── layout.tsx            # Root Layout dengan HeaderNav & Footer
│   │   ├── page.tsx              # Landing Page / Portal Hub Overview
│   │   ├── supply/               # Page Modul A: Supply Intelligence
│   │   ├── training/             # Page Modul B: Training Program Intelligence
│   │   ├── providers/            # Page Modul C: Vocational Provider Readiness
│   │   ├── demand/               # Page Modul D: Global Demand Intelligence
│   │   └── matching/             # Page Tahap 3 & 4: Matching Engine & Allocation
│   ├── components/
│   │   ├── layout/               # HeaderNav, Footer, Sidebar, StepperNav
│   │   ├── ui/                   # Button, Card, Badge, Modal, Tabs, Input, Select
│   │   ├── modul-a/              # SupplyTable, ParticipantFilter, CandidateDetailModal
│   │   ├── modul-b/              # ProgramCard, ProgramFilter, CurriculumModal
│   │   ├── modul-c/              # ProviderCard, EvokasiBadge, FacilityList
│   │   ├── modul-d/              # DemandCard, RequirementBadge, JobModal
│   │   └── matching/             # MatchingMatrix, GapAnalysisCard, AllocationPanel
│   ├── data/                     # Mock Datasets (Pure TypeScript Objects)
│   │   ├── mockSupply.ts         # Data calon peserta (Modul A)
│   │   ├── mockPrograms.ts       # Data program pelatihan (Modul B)
│   │   ├── mockProviders.ts      # Data lembaga vokasi (Modul C)
│   │   └── mockDemand.ts         # Data demand luar negeri (Modul D)
│   ├── store/
│   │   └── useAppStore.ts        # Global Client Store (Zustand)
│   └── types/
│       └── index.ts              # Interface & Type Definitions
├── AGENT_INSTRUCTIONS.md         # File ini
├── ui_ux_spec.md                 # Spesifikasi UI/UX
└── technical_spec.md             # Spesifikasi Arsitektur Data Frontend
```

---

## 4. Aturan Penulisan Kode & Konvensi AI Agent

1. **Client Components:**
   * Tambahkan deklarasi `'use client';` di bagian paling atas komponen interaktif.
2. **Tanpa External API Fetching:**
   * Jangan gunakan `fetch()` ke URL server eksternal atau backend yang tidak ada.
   * Gunakan fungsi *mock store* dari `@/store/useAppStore` atau `@/data/mockData` untuk manipulasi data (Create, Read, Filter, Search, Allocate).
3. **Desain Responsif & Estetik:**
   * Pastikan layout menggunakan grid responsif Tailwind (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`).
   * Gunakan skema warna profesional Kementerian P2MI (`slate-900` untuk Navy, `blue-600` untuk Primary, `red-600` untuk Accent Identity).
4. **Interaktivitas Tahapan Sistem (System Stage Workflow):**
   * Sediakan navigasi interaktif untuk menyimulasikan pergerakan data dari **Tahap 1 (Pengumpulan)** -> **Tahap 2 (Validasi)** -> **Tahap 3 (Matching)** -> **Tahap 4 (Penetapan & Alokasi)**.

---

## 5. Langkah-Langkah Eksekusi AI Agent (Step-by-Step Task Checklist)

Saat diinstruksikan oleh pengguna, AI Agent harus menyelesaikan tugas secara berurutan:

* [ ] **Langkah 1:** Inisialisasi file tipe data `@/types/index.ts` berdasarkan `technical_spec.md`.
* [ ] **Langkah 2:** Buat file mock data `@/data/mock*.ts` yang mencakup sampel data realistic Indonesia (SMK, Disnaker, Pelatihan, Demand Jepang/Jerman/Korea/Taiwan).
* [ ] **Langkah 3:** Implementasikan `useAppStore.ts` untuk mengelola filter, pencarian, dan status seleksi/alokasi secara *client-side*.
* [ ] **Langkah 4:** Bangun komponen tata letak utama (`HeaderNav`, `SystemStageStepper`, `Footer`).
* [ ] **Langkah 5:** Implementasikan antarmuka Modul A, B, C, D sesuai `ui_ux_spec.md`.
* [ ] **Langkah 6:** Bangun halaman **Matching & Alokasi Program (Tahap 3 & 4)** yang menghitung *matching score* dan menyimulasikan penetapan kuota peserta dan lembaga vokasi.
