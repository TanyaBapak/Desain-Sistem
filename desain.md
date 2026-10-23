# Platform SMK Go Global — Kementerian Pelindungan Pekerja Migran Indonesia (P2MI)

Dokumentasi Desain Sistem, Arsitektur Frontend MVP, dan Panduan Implementasi.

---

## 1. Ringkasan Eksekutif & Struktur Portal Publik
Platform **SMK Go Global** mengadopsi standar portal web resmi pemerintahan Republik Indonesia (seperti portal kementerian **kemendagri.go.id**):
1. **Landing Page Resmi (Public Government Portal):**
   - **Top Utility Bar:** Tanggal resmi hari ini, hotline Call Center 24 jam, tautan SP4N LAPOR, SISKOP2MI, dan e-Vokasi.
   - **Header Identitas Nasional:** Lambang resmi P2MI / RI, navigasi profil kementerian, dan tombol **"Pilih Role Pengguna"**.
   - **Running Announcement Ticker:** Pengumuman seleksi batch luar negeri & update regulasi.
   - **Hero Showcase & Statistik Nasional:** Banner program prioritas penempatan 50.000 lulusan vokasi dan counter real-time.
   - **Portal Akses Multi-Peran:** Pemilihan role pengguna untuk masuk ke dashboard internal dengan hak akses spesifik.
   - **Layanan Unggulan 4 Modul Intelijen & Alur 4 Tahapan.**
   - **Siaran Pers & Berita Terkini:** Rilis resmi kementerian seputar rekrutmen SSW Jepang, Ausbildung Jerman, E-7 Korea.
   - **Footer Kenegaraan:** Alamat kantor kementerian, saluran pengaduan, dan tautan e-Government.

2. **Pembagian Peran Pengguna (Multi-Role User):**
   - **Admin Kementerian (P2MI Pusat / Superadmin):** Akses penuh ke seluruh 4 Modul Intelijen, Matching Engine Nasional, dan otorisasi penerbitan SK Alokasi Pagu Anggaran.
   - **Lembaga Vokasi (Kepala SMK / BLK / LPK):** Akses Modul C (kesiapan sarana bengkel lab & verifikasi e-Vokasi), Modul B (program pelatihan yang diampu), dan pengajuan usulan peserta didik ke Modul A.
   - **Calon Pekerja Migran (Alumni SMK / Pencari Kerja):** Akses portofolio profil diri di Modul A, pengecekan status verifikasi NIK, eksplorasi lowongan kerja luar negeri di Modul D, dan rekomendasi pelatihan.
   - **Dinas Tenaga Kerja Daerah (Disnaker Provinsi/Kabupaten):** Pemantauan pasokan talenta daerah di Modul A, validasi rekomendasi domisili daerah, dan rekapitulasi kuota wilayah.
   - **Mitra Kerja Luar Negeri (Employer Asing):** Akses Modul D (buka kuota lowongan kerja baru, pantau kuota terisi) dan review profil kandidat siap kerja.

---

## 2. Struktur 4 Modul Intelijen

| Modul | Nama Modul | Deskripsi & Fitur Utama |
|---|---|---|
| **Modul A** | **Supply Intelligence** | Bank data calon pekerja migran lulusan vokasi, status kesiapan (*Ready*, *Needs Upskilling*, *Needs Reskilling*), verifikasi Dukcapil, portofolio keahlian, dan kemahiran bahasa asing. |
| **Modul B** | **Training Program Intelligence** | Katalog kurikulum pelatihan terstandar (*Teknis Terpadu*, *Upskilling*, *Reskilling*, *Bahasa Asing*) dengan durasi Jam Pelajaran (JP), estimasi biaya/peserta, dan target sertifikasi internasional (SSW Tokutei Ginou, BNSP, Ausbildung B1, E-7). |
| **Modul C** | **Vocational Provider Readiness** | Direktori kesiapan lembaga vokasi (SMK, BLK, LPK, Politeknik) terverifikasi e-Vokasi, kapasitas kelas, instruktur tersertifikasi, dan kelayakan sarana bengkel/lab. |
| **Modul D** | **Global Demand Intelligence** | Pemetaan kebutuhan tenaga kerja luar negeri resmi dari employer (Jepang, Jerman, Korea Selatan, Taiwan) dengan kuota, rentang gaji pokok, dan kualifikasi minimum. |

---

## 3. Alur Kerja 4 Tahapan Sistem (Pipeline Penempatan)

1. **Tahap 1 — Pengumpulan Data (Ingestion):** Agregasi data dari Modul A, B, C, dan D ke dalam state terpusat.
2. **Tahap 2 — Validasi & Standardisasi:** Simulasi validasi NIK Dukcapil, filtering calon siap kerja, dan filtering lembaga terverifikasi e-Vokasi.
3. **Tahap 3 — Analisis Gap & Matching Engine:** 
   $$\text{Skor Matching} = (\text{Skor Keterampilan} \times 0.50) + (\text{Standar Bahasa} \times 0.35) + (\text{Pendidikan Vokasi} \times 0.15)$$
   Menghasilkan analisis gap keterampilan dan rekomendasi program pelatihan Modul B yang relevan.
4. **Tahap 4 — Penetapan Program & Alokasi Lembaga:** Simulasi penerbitan Surat Keputusan (SK) Alokasi Batch, penetapan kuota peserta, penetapan lembaga vokasi penyelenggara, jadwal pelaksanaan, dan kalkulasi pagu anggaran:
   $$\text{Total Anggaran} = \text{Jumlah Peserta Terpilih} \times \text{Biaya per Peserta (Modul B)}$$

---

## 4. Cara Menjalankan Aplikasi

Aplikasi berjalan pada server lokal Vite:

```bash
# Menjalankan Dev Server
npm run dev

# Membangun Paket Produksi
npm run build
```

Buka peramban di: `http://localhost:3000` atau port yang ditampilkan oleh Vite.
