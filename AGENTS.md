# AGENTS.md — Platform Monitoring Task Force SMK Go Global

> File ini adalah **sumber kebenaran tunggal** untuk proyek ini.
> Berlaku untuk semua AI agent / CLI (Claude Code, Cursor, Copilot, Codex, Gemini CLI, dll.).
> Jika memakai Claude Code, salin atau symlink file ini menjadi `CLAUDE.md`.
> Jika ada konflik antara permintaan prompt dan file ini, **file ini menang**, kecuali pengguna secara eksplisit meminta pengecualian.

---

## 0. ATURAN WAJIB UNTUK AI AGENT

### 0.1 Sebelum menulis kode
1. **Baca file ini sampai selesai** dan baca struktur folder yang ada sebelum mengubah apa pun.
2. **Cek dulu apakah sudah ada** komponen, hook, util, atau tipe yang bisa dipakai ulang. Jangan membuat duplikat.
3. Untuk tugas yang menyentuh lebih dari 3 file, **tulis rencana singkat** (file apa yang diubah dan alasannya), lalu kerjakan.
4. Jika kebutuhan ambigu, **ajukan maksimal 1-3 pertanyaan** lalu lanjut dengan asumsi yang dituliskan eksplisit. Jangan menebak diam-diam untuk hal yang berdampak besar (skema database, hak akses, integrasi).

### 0.2 Saat menulis kode
- Gunakan **TypeScript strict**. Dilarang memakai `any`. Gunakan `unknown` lalu persempit tipenya.
- Gunakan **hanya** stack di Bagian 2. Dilarang menambah library baru tanpa menyebutkan alasannya dan menunggu persetujuan pengguna.
- **Utamakan komponen shadcn/ui.** Jangan membuat ulang Button, Input, Dialog, Table, dan sejenisnya dari nol.
- **Dilarang** hardcode warna (`#hex`, `rgb()`, `bg-blue-500`). Pakai token semantik (Bagian 4.2).
- **Dilarang** mengubah file di `src/components/ui/` secara sembarangan. Jika perlu variasi, bungkus (wrap) komponennya di `src/components/shared/`. Pengecualian: penyesuaian tema yang memang diminta.
- **Dilarang** menaruh data dummy yang tampak seperti data asli (NIK, nama nyata). Gunakan data fiktif jelas (mis. `3300000000000001`, "Peserta Contoh").
- Semua teks antarmuka memakai **Bahasa Indonesia** (Bagian 7). Nama variabel, fungsi, dan komentar kode memakai **Bahasa Inggris**.
- Satu file satu tanggung jawab. Komponen maksimal sekitar **250 baris**; pecah jika lebih.
- Tidak boleh ada `console.log`, kode mati, atau komentar `TODO` tanpa nomor isu.

### 0.3 Setelah menulis kode (Definition of Done)
Sebuah tugas dianggap **selesai** hanya jika semua ini terpenuhi:
- [ ] `pnpm lint` bersih tanpa error
- [ ] `pnpm typecheck` bersih
- [ ] `pnpm test` lolos (jika ada test yang terkait)
- [ ] Ada state **loading**, **empty**, dan **error** pada setiap halaman data
- [ ] Responsif (minimal lebar 360px, 768px, 1280px)
- [ ] Mode terang dan gelap tidak rusak
- [ ] Bisa dipakai dengan keyboard (fokus terlihat, urutan tab masuk akal)
- [ ] Tidak ada data sensitif di log, URL, atau `localStorage`

### 0.4 Format respons agent
- Ringkas: sebutkan **apa yang diubah**, **file yang terpengaruh**, dan **cara mengujinya**.
- Jangan mengulang isi kode panjang di chat jika sudah ditulis ke file.
- Jika tidak bisa menjalankan perintah (lint, test), **katakan jujur**. Jangan mengklaim sudah lolos.
- Jangan melakukan refactor besar yang tidak diminta. Catat sebagai saran saja.

### 0.5 Larangan keras
- Jangan commit atau menulis file `.env`, kunci API, token, atau kredensial.
- Jangan menghapus data atau migrasi destruktif tanpa konfirmasi.
- Jangan menonaktifkan aturan lint/TypeScript demi "supaya jalan".
- Jangan commit artefak hasil build di `backend/public/build/`; ubah file sumber dan buat ulang aset secara lokal dengan `pnpm build` bila diperlukan.
- Jalankan `pnpm install` setelah clone agar hook Git Husky aktif. Hook pre-commit dan pre-push menolak artefak build tersebut.
- Jangan memanggil API pihak ketiga (e-Vokasi, Smart MI, SISKOP2MI, SISKOTKLN) langsung dari browser. Semua lewat backend (Bagian 9).
- Jangan menampilkan NIK, paspor, atau nomor HP penuh kepada peran yang tidak berhak (Bagian 8).

---

## 1. KONTEKS PROYEK

**Tujuan:** platform terkomputerisasi untuk mempercepat dan memonitor penempatan peserta program **SMK Go Global**. Dimonitor oleh Menteri dan pimpinan, dan diperbarui oleh banyak pemangku kepentingan (Disnaker, lembaga vokasi, pengelola demand).

**Sistem harus menginformasikan:**
1. Data calon peserta / pencari kerja siap latih
2. Data program pelatihan (per sektor, jabatan, jam pelajaran)
3. Data lembaga vokasi yang siap menjadi penyelenggara
4. Data demand pekerja luar negeri, yang di-*matching*-kan dengan program pelatihan

**Sumber data pencari kerja:** Disnaker (provinsi/kab/kota) dan lembaga vokasi.
**Cakupan tampilan:** per kabupaten/kota dan per provinsi, dengan filter latar belakang pencari kerja.
**Integrasi:** e-Vokasi, Smart MI, SISKOP2MI, SISKOTKLN (nama sistem perlu dikonfirmasi pemilik proyek sebelum spesifikasi API dikunci).

**Fondasi yang sudah ada:** modul manajemen LPK dan record kegiatan. **Gunakan ulang** sebagai modul *Lembaga Vokasi*, *Program Pelatihan*, dan *Monitoring Pelatihan*. Jangan menulis ulang dari nol.

---

## 2. TECH STACK (TETAP)

| Kebutuhan | Pilihan |
|---|---|
| Framework | **React 18+** dengan **TypeScript** (Vite) |
| Routing | React Router (data router) |
| UI | **shadcn/ui** + Radix UI |
| Styling | **Tailwind CSS** (versi sesuai template shadcn yang dipakai) |
| Ikon | **lucide-react** (satu-satunya set ikon) |
| Form | React Hook Form + **Zod** (`@hookform/resolvers`) |
| Data fetching | **TanStack Query** + klien HTTP tunggal (`src/lib/api.ts`) |
| Tabel | **TanStack Table** lewat komponen `DataTable` shadcn |
| Grafik | Komponen **Chart** shadcn (Recharts) |
| Peta | **react-leaflet** + GeoJSON provinsi/kabupaten |
| State global | Zustand (hanya untuk state UI/sesi; data server tetap di TanStack Query) |
| Tanggal | date-fns (locale `id`) |
| Notifikasi | **Sonner** (toast shadcn) |
| Ekspor | xlsx (Excel) dan jsPDF / endpoint server (PDF) |
| Paket manager | **pnpm** |
| Lint/format | ESLint + Prettier (plugin Tailwind) |
| Test | Vitest + Testing Library; Playwright untuk alur kritis |

> Backend mengikuti stack aplikasi LPK yang sudah ada, ditambah REST API terdokumentasi (OpenAPI). Database yang direkomendasikan: **PostgreSQL**.

---

## 3. STRUKTUR FOLDER

```
src/
├─ app/                      # bootstrap: router, providers, layout root
├─ components/
│  ├─ ui/                    # hasil `shadcn add` (jangan diubah sembarangan)
│  ├─ shared/                # komponen proyek: DataTable, PageHeader, StatCard,
│  │                         # EmptyState, ConfirmDialog, RegionSelect, StatusBadge
│  └─ layout/                # AppSidebar, Topbar, Breadcrumbs, PageContainer
├─ features/                 # satu folder per modul (lihat Bagian 6)
│  ├─ dashboard/
│  ├─ job-seekers/           # pencari kerja
│  ├─ training-programs/
│  ├─ institutions/          # lembaga vokasi
│  ├─ demands/
│  ├─ matching/
│  ├─ placements/
│  ├─ monitoring/
│  ├─ reports/
│  ├─ integrations/
│  └─ admin/                 # user, peran, master data, audit log
│     └─ (tiap fitur berisi: api/, components/, hooks/, schemas/, types/, pages/)
├─ hooks/                    # hook lintas fitur
├─ lib/                      # api.ts, utils.ts, format.ts, constants.ts, rbac.ts
├─ styles/                   # globals.css (token tema)
└─ types/                    # tipe global
```

Aturan impor:
- Alias `@/` untuk `src/`.
- `features/*` **tidak boleh** mengimpor dari `features/lain` secara langsung. Bagian bersama dipindah ke `components/shared` atau `lib`.
- Penamaan file: komponen `PascalCase.tsx`, hook `use-kebab-case.ts`, util `kebab-case.ts`.

---

## 4. ATURAN DESAIN (WAJIB)

### 4.1 Tipografi

| Penggunaan | Font | Catatan |
|---|---|---|
| **UI dan konten (default)** | **Inter** | Pakai via `@fontsource-variable/inter` (self-host, tanpa CDN) |
| **Angka kode / NIK / ID / log** | **JetBrains Mono** | Hanya untuk data teknis; via `@fontsource-variable/jetbrains-mono` |

Aturan:
- **Dilarang** memakai lebih dari 2 font family. **Dilarang** font dekoratif.
- Fallback: `ui-sans-serif, system-ui, sans-serif` dan `ui-monospace, monospace`.
- Angka di tabel, KPI, dan grafik wajib memakai `tabular-nums` agar sejajar.
- Skala ukuran (Tailwind):

| Elemen | Kelas |
|---|---|
| Judul halaman (H1) | `text-2xl font-semibold tracking-tight` |
| Judul seksi (H2) | `text-lg font-semibold` |
| Judul kartu | `text-base font-medium` |
| Isi / tabel | `text-sm` |
| Label form | `text-sm font-medium` |
| Teks bantu / metadata | `text-xs text-muted-foreground` |
| Angka KPI besar | `text-3xl font-bold tabular-nums` |

- Ukuran minimum teks: **12px**. Isi tabel dan form minimum **14px**.
- Line-height ikut default Tailwind. Panjang baris teks bacaan maksimal sekitar 70 karakter.

### 4.2 Warna dan tema
- Gunakan **CSS variables** shadcn (`--background`, `--foreground`, `--primary`, `--muted`, `--destructive`, `--border`, `--ring`, `--chart-1..5`) di `globals.css`.
- Wajib mendukung **mode terang dan gelap** (`class` strategy).
- Hanya pakai kelas semantik: `bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border`, dst.
- **Warna primer:** satu warna institusional (disarankan biru tua/navy). Tentukan sekali di token, jangan di komponen.
- **Warna status** (lewat `StatusBadge`, jangan ad-hoc):

| Makna | Token/warna |
|---|---|
| Sukses / ditempatkan / terpenuhi | hijau |
| Proses / berjalan | biru |
| Menunggu / perlu verifikasi | kuning/amber |
| Ditolak / gagal / error | merah (`destructive`) |
| Draft / nonaktif | abu-abu (`muted`) |

- Warna **tidak boleh jadi satu-satunya penanda**. Sertakan teks atau ikon.
- Kontras teks minimal **WCAG AA (4.5:1)**.

### 4.3 Layout dan spasi
- Skala spasi kelipatan 4px (Tailwind default). Hindari nilai arbitrer `[13px]`.
- Layout aplikasi: **sidebar kiri** (collapsible) + **topbar** + konten. Pakai komponen `Sidebar` shadcn.
- Konten dibungkus `PageContainer` (padding `p-4 md:p-6`, `max-w-screen-2xl`).
- Setiap halaman diawali `PageHeader`: judul, deskripsi singkat, breadcrumb, dan tombol aksi utama di kanan.
- Radius: ikut `--radius` shadcn. Jangan campur radius berbeda di satu halaman.
- Bayangan seminimal mungkin (`shadow-sm` untuk kartu). Utamakan border.
- Kepadatan: dashboard pimpinan **lega** (kartu besar, angka besar). Halaman operator **padat** (tabel `text-sm`, baris rapat).

### 4.4 Komponen shadcn yang diharapkan dipakai
`button`, `input`, `textarea`, `select`, `combobox` (command + popover), `checkbox`, `radio-group`, `switch`, `form`, `label`, `card`, `table`, `badge`, `tabs`, `dialog`, `sheet`, `alert-dialog`, `dropdown-menu`, `popover`, `tooltip`, `command`, `calendar` / `date-picker`, `breadcrumb`, `sidebar`, `skeleton`, `sonner`, `pagination`, `chart`, `progress`, `separator`, `scroll-area`, `avatar`, `alert`, `stepper` (dibuat sendiri dari primitif).

Penambahan komponen: `pnpm dlx shadcn@latest add <nama>`. Jangan menyalin manual dari sumber lain.

### 4.5 Pola interaksi
- **Aksi destruktif** selalu lewat `AlertDialog` dengan teks konsekuensi jelas.
- **Form panjang** (mis. pencari kerja) dibuat **bertahap** (stepper/tab) dengan validasi per langkah dan simpan draf.
- **Dialog** untuk edit singkat; **Sheet** untuk detail/edit sedang; **halaman penuh** untuk form kompleks.
- Setelah simpan: toast sukses (Sonner), tabel di-invalidate, fokus kembali wajar.
- Error validasi tampil **di bawah field** dengan pesan spesifik. Error server tampil di toast dan/atau `Alert`.
- Tombol utama hanya **satu per area**. Tombol submit menampilkan spinner dan `disabled` saat mengirim.
- Tabel data wajib: pencarian, filter, sortir, paginasi **sisi server**, pilih jumlah baris, tampilkan/sembunyikan kolom, ekspor, dan state kosong yang informatif.
- Filter wilayah bertingkat: **Provinsi → Kabupaten/Kota → Kecamatan** lewat `RegionSelect` (satu komponen untuk seluruh aplikasi).
- Simpan filter di **query string URL** supaya bisa dibagikan dan di-refresh.

### 4.6 Dashboard pimpinan
- Baris atas: **StatCard** (Pencari Kerja, Siap Latih, Dalam Pelatihan, Lulus Sertifikasi, Siap Penempatan, Ditempatkan, Demand Terbuka).
- Tengah: **peta sebaran** (provinsi → drill-down kabupaten) dan grafik **Demand vs Supply per jabatan**.
- Bawah: **funnel** (Daftar → Latih → Lulus → Berangkat), top negara tujuan, tabel gap demand tanpa program.
- Semua widget mengikuti filter global (wilayah, sektor, jabatan, negara, periode, jenis lembaga).
- Tampilkan **waktu pembaruan data terakhir**.
- Read-only untuk Menteri/pimpinan, namun semua angka bisa di-*drill-down* ke daftar.

### 4.7 Aksesibilitas
- Semua kontrol interaktif bisa diakses keyboard; fokus terlihat (`ring`).
- Input punya `label` terhubung. Ikon-saja wajib `aria-label`.
- Grafik punya ringkasan teks atau tabel alternatif.
- Hormati `prefers-reduced-motion`.

---

## 5. KONVENSI KODE

- **Komponen:** fungsi + hooks, `export function`, tipe props eksplisit. Tidak ada class component.
- **Server state:** hanya TanStack Query. Query key terpusat per fitur (mis. `jobSeekerKeys.list(filters)`).
- **Validasi:** satu skema Zod per entitas di `schemas/`, dipakai untuk form **dan** parsing respons API.
- **API:** semua pemanggilan lewat `lib/api.ts` (base URL dari env, token, penanganan 401/403, error terstandar). Dilarang `fetch` langsung di komponen.
- **Env:** hanya variabel berawalan `VITE_` yang boleh di klien, dan tidak boleh berisi rahasia.
- **Tipe API:** dihasilkan dari OpenAPI bila tersedia. Jika tidak, definisikan manual di `types/`.
- **Penamaan:** `camelCase` variabel/fungsi, `PascalCase` komponen/tipe, `SCREAMING_SNAKE_CASE` konstanta. Enum status disimpan sebagai konstanta + union type.
- **Git:** Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`). Satu perubahan logis per commit. Branch `feat/<modul>-<deskripsi>`.
- **Performa:** `React.lazy` per rute, tabel besar pakai paginasi server (bukan memuat semua), peta memuat GeoJSON on-demand.
- **Tes minimum:** skema Zod, util format, dan alur kritis (login, tambah pencari kerja, matching).

---

## 6. MODUL, MENU, DAN DATA

### Menu sidebar
`Dashboard` · `Pencari Kerja` · `Program Pelatihan` · `Lembaga Vokasi` · `Demand` · `Matching` · `Penempatan` · `Monitoring` · `Laporan` · `Integrasi` · `Pengaturan`

### 6.1 Pencari Kerja / Calon Peserta
| Kelompok | Field |
|---|---|
| Identitas | `nik`, `fullName`, `gender`, `birthDate`, `phone`, `email`, `photoUrl` |
| Domisili | `provinceId`, `regencyId`, `districtId`, `address` |
| Latar belakang | `lastEducation`, `major`, `schoolName`, `graduationYear` |
| Keahlian | `interestSectorIds`, `interestJobIds`, `workExperiences[]`, `competencyCertificates[]` |
| Bahasa | `languages[]` (`language`, `testName`, `score`, `level`) |
| Status | `calon` → `siap_latih` → `dalam_pelatihan` → `lulus` → `siap_kerja` → `ditempatkan` |
| Sumber | `sourceType` (`disnaker` / `lembaga_vokasi` / `mandiri` / `integrasi`), `sourceInstitutionId` |
| Dokumen | `ktp`, `ijazah`, `paspor`, `cv`, `medical` (status + berkas) |
| Metadata | `verifiedAt`, `verifiedBy`, `createdBy`, `createdAt` |

Fitur: form bertahap, **import Excel massal** (dengan pratinjau dan laporan baris error), **deteksi duplikat via NIK**, verifikasi data oleh admin.

### 6.2 Program Pelatihan
`code`, `name`, `sectorId`, `jobId`, `totalHours` (JP), `theoryHours`, `practiceHours`, `targetCountryId?`, `curriculumRef` (SKKNI / standar negara tujuan), `certificationScheme`, `quota`, `startDate`, `endDate`, `location`, `institutionId`, `cost`, `fundingSource`, `status` (`draft` / `dibuka` / `berjalan` / `selesai`). Relasi: **Program → Batch → PesertaBatch**.

### 6.3 Lembaga Vokasi
| Field | Keterangan |
|---|---|
| Identitas | `npsnOrLicenseNo`, `name`, wilayah, `address`, kontak |
| `ownership` | `pemerintah` / `non_pemerintah` |
| `type` | `perguruan_tinggi` / `balai_pelatihan_kerja` / `balai_vokasi` / `lembaga_pelatihan_kerja` / `lembaga_kursus` / `smk` |
| Izin | nomor, akreditasi, masa berlaku, dokumen |
| Kapasitas | jumlah instruktur, ruang/workshop, kuota per tahun |
| Sektor/jabatan | yang dapat dilatih |
| `readinessStatus` | `siap` / `belum_siap` / `dalam_penilaian` |

### 6.4 Demand (Permintaan Pekerja)
`countryId`, `employerName`, `sectorId`, `jobId`, `quantity`, `deadline`, `jobDescription`, `requirements` (usia, pendidikan, pengalaman, bahasa, sertifikasi, kesehatan), `salaryRange`, `benefits`, `status` (`terbuka` / `sebagian_terpenuhi` / `terpenuhi` / `ditutup`), `source` (KP2MI / mitra / G2G).

### 6.5 Matching (inti sistem)
1. **Demand ↔ Program** (analisis gap: demand ada, program belum ada)
2. **Peserta ↔ Program** (rekomendasi berdasarkan minat, pendidikan, wilayah)
3. **Peserta (lulus) ↔ Demand**

Skor kecocokan berbasis aturan berbobot (jabatan, pendidikan, bahasa, usia, sertifikasi). Bobot disimpan di konfigurasi, **bukan hardcode**. Hasil: `matching(id, jobSeekerId, programId?, demandId?, score, status)`.

### 6.6 Penempatan dan Tracking
Alur: `terdaftar → seleksi → pelatihan → sertifikasi → dokumen (paspor, visa, medical) → keberangkatan → bekerja → monitoring pasca-penempatan`. Data: tanggal berangkat, negara, employer, kontrak, status kerja, status dokumen.

### 6.7 Monitoring, Laporan, Integrasi, Pengaturan
- **Monitoring:** absensi, nilai, uji kompetensi, realisasi vs rencana per batch, dokumentasi (dari modul record kegiatan).
- **Laporan:** per wilayah / sektor-jabatan / lembaga / negara; ekspor Excel/PDF; laporan terjadwal.
- **Integrasi:** status koneksi, log sinkronisasi, mapping field/ID, retry error.
- **Pengaturan:** user, peran, master wilayah, sektor, jabatan, negara, bobot matching, audit log, notifikasi.

### 6.8 Prinsip data
- **Jabatan** adalah kunci penghubung program, demand, dan keahlian peserta. Master sektor/jabatan harus tunggal dan di-*mapping* ke klasifikasi e-Vokasi dan SISKOTKLN.
- Wilayah memakai **kode Kemendagri** (bukan teks bebas).
- Jangan hapus permanen data inti; gunakan **soft delete** + audit log.

---

## 7. LOKALISASI DAN FORMAT

- Bahasa antarmuka: **Indonesia**. Siapkan struktur i18n (mis. `src/lib/i18n/id.ts`) agar teks tidak tersebar di komponen.
- Tanggal tampil: `dd MMM yyyy` (mis. `23 Okt 2026`). Waktu: `HH:mm` zona **WIB** (tampilkan zona bila lintas wilayah).
- Angka: pemisah ribuan titik, desimal koma (`Intl.NumberFormat('id-ID')`). Mata uang: `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })`; mata uang asing sesuai kode ISO.
- Semua formatter ada di `lib/format.ts`. Jangan format manual di komponen.
- Gaya teks: kalimat singkat, kata kerja aktif, hindari singkatan yang tidak umum. Tombol: "Simpan", "Batal", "Tambah Pencari Kerja", bukan "OK"/"Submit".
- Pesan error: jelaskan **apa yang salah** dan **apa yang harus dilakukan**.

---

## 8. PERAN, HAK AKSES, DAN KEAMANAN

| Peran | Akses |
|---|---|
| `super_admin` | Kelola user, master data, konfigurasi |
| `pimpinan` | Dashboard dan laporan read-only, drill-down |
| `admin_taskforce` | Verifikasi data, matching, monitoring penuh |
| `disnaker` | Input/update pencari kerja **di wilayahnya saja** |
| `lembaga_vokasi` | Input peserta, program, realisasi **lembaganya saja** |
| `pengelola_demand` | Input demand |
| `auditor` | Lihat laporan tertentu |

Aturan:
- Pemeriksaan izin dilakukan di **backend (wajib)** dan di UI (untuk menyembunyikan menu/aksi). UI saja tidak cukup.
- Gunakan helper `can(user, action, resource)` di `lib/rbac.ts`. Dilarang `if (role === ...)` tersebar di komponen.
- **Row-level access** per wilayah dan per lembaga.
- **Masking data pribadi:** NIK tampil `3300••••••••0001`, HP tampil sebagian; tampil penuh hanya untuk peran berhak dan dicatat di audit log.
- Token tidak disimpan di `localStorage`; gunakan cookie `HttpOnly` bila memungkinkan.
- Unggah berkas: validasi tipe dan ukuran di klien **dan** server.
- Patuhi **UU PDP**: kumpulkan data seperlunya, catat persetujuan, dan sediakan mekanisme akses/hapus data.
- Sanitasi semua input; jangan memakai `dangerouslySetInnerHTML`.

---

## 9. INTEGRASI EKSTERNAL

| Sistem | Arah | Data utama |
|---|---|---|
| e-Vokasi | dua arah | lembaga, program, peserta pelatihan |
| Smart MI | masuk | data demand / pekerja migran (konfirmasi) |
| SISKOP2MI | dua arah | data penempatan/pekerja migran (konfirmasi) |
| SISKOTKLN | masuk | data tenaga kerja luar negeri (konfirmasi) |

Aturan:
1. Integrasi dibangun di **backend** sebagai adapter terpisah per sistem (`integration/<sistem>`), bukan di React.
2. Sinkronisasi berjalan via **job terjadwal/antrean**, dengan **retry** dan **idempotensi**.
3. Simpan **tabel mapping ID** (ID internal ↔ ID eksternal) dan **SyncLog** (`source`, `entity`, `status`, `startedAt`, `finishedAt`, `errorMessage`).
4. Halaman `Integrasi` menampilkan status, waktu sinkron terakhir, dan error per sistem.
5. **Cek dulu** apakah tiap sistem punya API resmi. Jika tidak, sediakan jalur **import berkas** sebagai cadangan.
6. Jangan mengasumsikan skema API eksternal. Tulis sebagai kontrak di `docs/integrations/<sistem>.md` dan konfirmasi dengan pemilik sistem.

---

## 10. ALUR PROSES UTAMA

```
[Disnaker / Lembaga Vokasi]            [KP2MI / Mitra Demand]
   input data pencari kerja              input permintaan pekerja
            │                                    │
            ▼                                    ▼
   Verifikasi data (admin)             Validasi demand (admin)
            └──────────────┬─────────────────────┘
                           ▼
                 ANALISIS GAP & MATCHING
        (demand ↔ program pelatihan ↔ peserta)
                           │
         ┌─────────────────┴──────────────────┐
   Program tersedia                    Program belum ada
         ▼                                    ▼
 Peserta didaftarkan ke program      Task Force minta lembaga
         ▼                           menyiapkan program baru
  Seleksi → Pelatihan → Uji kompetensi ◄──────┘
         ▼
  Lulus → Matching ke demand → Proses dokumen
         ▼
  Penempatan → Monitoring pasca-penempatan
         ▼
  Dashboard Menteri/Pimpinan (real-time)
```

---

## 11. MODEL DATA (ERD RINGKAS)

```
Wilayah (prov, kab, kec) ──< PencariKerja >── Pendidikan
Lembaga ──< Program ──< Batch ──< PesertaBatch >── PencariKerja
Sektor ──< Jabatan ──< Program
Jabatan ──< Demand >── Negara
Matching   (peserta_id, program_id, demand_id, skor, status)
Penempatan (peserta_id, demand_id, tgl_berangkat, status)
SyncLog    (sumber, entitas, status, waktu)
AuditLog   (user_id, aksi, entitas, entitas_id, waktu)
```

---

## 12. ROADMAP PENGERJAAN

| Fase | Cakupan |
|---|---|
| 1 | Master data (wilayah, sektor, jabatan, negara), user & peran, migrasi modul LPK → Lembaga Vokasi + Program |
| 2 | Pencari Kerja (form + import Excel) dan Demand |
| 3 | Matching dan alur Penempatan |
| 4 | Dashboard pimpinan, peta, Laporan |
| 5 | Integrasi e-Vokasi, Smart MI, SISKOP2MI, SISKOTKLN |

Agent bekerja **per fase dan per modul**. Jangan melompat ke fase berikutnya sebelum pengguna meminta.

---

## 13. TEMPLATE PROMPT UNTUK PENGGUNA

Salin dan sesuaikan saat meminta agent mengerjakan sesuatu:

```
Baca AGENTS.md terlebih dahulu.
Tugas: buat modul <NAMA MODUL> pada fase <N>.
Cakupan: <halaman/fitur yang diminta>.
Aturan: ikuti AGENTS.md (shadcn/ui, token warna, font Inter, Bahasa Indonesia).
Selesai bila: memenuhi Definition of Done (Bagian 0.3).
Tulis rencana singkat dulu, lalu kerjakan, lalu ringkas hasilnya.
```

**Contoh:**
```
Baca AGENTS.md terlebih dahulu.
Tugas: buat halaman daftar Pencari Kerja (fase 2).
Cakupan: DataTable dengan filter Provinsi→Kab/Kota, sektor, status; pencarian nama/NIK;
paginasi server; tombol Tambah dan Import Excel; NIK dimasking.
Gunakan data mock dulu lewat lapisan api, siap diganti endpoint asli.
```

---

## 14. CATATAN TERBUKA (PERLU KONFIRMASI PEMILIK PROYEK)

- [ ] Nama resmi dan spesifikasi API: Smart MI, SISKOP2MI, SISKOTKLN, e-Vokasi
- [ ] Warna primer dan logo institusi
- [ ] Daftar sektor/jabatan resmi dan klasifikasinya
- [ ] Bobot skor matching
- [ ] Kebijakan retensi dan akses data pribadi (UU PDP)
- [ ] Stack backend final dan lingkungan deployment
