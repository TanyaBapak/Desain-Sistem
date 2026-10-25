# Integrasi Gardata / SIPPMI

## Arah dan cakupan

Integrasi ini menarik kandidat dan ringkasan riwayat kelas dari Gardata ke backend SMK Go Global. API hanya dipanggil dari Laravel; data tidak diambil langsung dari browser.

## Endpoint yang ditemukan di aplikasi sumber

Base URL produksi yang diuji: `https://gardata.sippmi.com`.

| Endpoint | Tujuan |
|---|---|
| `GET /api/v1/placement/candidates?page=1&per_page=50` | Daftar kandidat berpaginasi dan ringkasan riwayat kelas |
| `GET /api/v1/placement/summary` | Statistik agregat; tidak dipakai untuk import |
| `GET /api/v1/placement/candidates/{idOrNik}` | Detail kandidat dan rincian kompetensi; belum dipanggil oleh sinkronisasi |
| `GET /api/v1/placement/classes` | Daftar kelas; belum dipakai karena relasi lembaga/program internal belum memiliki pemetaan |

Daftar route dan controller sumber berada di proyek SIPPMI. Respons daftar kandidat menggunakan `data` dan `meta` (`current_page`, `total_pages`); isi kandidat mencakup `id`, NIK, biodata, status kesiapan, serta `classes_history`.

## Autentikasi dan prasyarat keamanan

- Laravel mengirim API key melalui header `X-API-KEY`; key tidak boleh ditempatkan di query string, browser, log, atau chat.
- Atur `GARDATA_BASE_URL` dan `GARDATA_API_KEY` hanya di environment server SMK Go Global, lalu jalankan `php artisan config:cache`.
- Endpoint Gardata yang diuji tanpa kredensial mengembalikan `401`. Sinkronisasi produksi belum dijalankan.
- Konfigurasi sumber SIPPMI saat ini memiliki fallback API key statis dan middleware juga menerima key via query serta sesi login. Pemilik SIPPMI perlu menghapus fallback, membuat/merotasi key khusus read-only, dan mengonfirmasi apakah mekanisme sesi/query masih dipakai klien lain sebelum diubah.
- Gunakan akun integrasi read-only yang khusus untuk SMK Go Global. Jangan menggunakan kredensial administrator.

Contoh variabel untuk environment produksi (isi key langsung di secret manager/deployment environment, bukan di repository):

```dotenv
GARDATA_BASE_URL=https://gardata.sippmi.com
GARDATA_API_KEY=
GARDATA_SYNC_PAGE_SIZE=50
GARDATA_SYNC_MAX_PAGES=1000

# Endpoint opsional untuk sinkronisasi dari portal pusat sippmi.com
SIPPMI_BASE_URL=https://sippmi.com
SIPPMI_API_KEY=
```

Jangan menimpa `QUEUE_CONNECTION` produksi yang sudah menggunakan Redis atau queue terkelola. Jika menggunakan antrean database, atur `QUEUE_CONNECTION=database`, pastikan migrasi tabel queue tersedia, dan jalankan worker secara persisten.

## Pemetaan yang diterapkan

- Kandidat: ID eksternal, NIK, nama, gender, wilayah, asal sekolah, jurusan, negara tujuan, bidang keahlian, dan status kesiapan.
- Riwayat kelas: ID batch, kode/nama kelas, sektor, program, periode, JP target/realisasi, persentase, status, dan jumlah laporan terverifikasi.
- Kandidat hanya diimpor bila API menandai perjanjian telah diverifikasi dan `agreed_terms` bernilai `true`.
- Data diberi sumber `Gardata`, status verifikasi lokal `Pending Verification`, dan siklus `SUBMITTED`; sinkronisasi tidak otomatis mengesahkan kandidat.
- NIK/identitas peserta yang sudah digunakan record lokal lain tidak ditimpa. Pemetaan wilayah hanya menerima kecocokan nama tunggal dengan referensi internal; nama wilayah yang tidak ditemukan atau ambigu dilewati.
- Field yang tidak diperlukan untuk daftar pencari kerja—misalnya data keluarga, kontak darurat, nomor telepon, alamat rinci, URL dokumen, token verifikasi—tidak disimpan.
- ID eksternal disimpan untuk upsert idempoten. Riwayat kelas berada di `external_training_records`, tidak membuat program atau lembaga internal fiktif.

## Operasional dan Sinkronisasi Otomatis

1. **Jadwal Otomatis (Scheduler):**
   - Job berjalan otomatis setiap **15 menit** (`everyFifteenMinutes()`) pada zona WIB tanpa tumpang tindih (`withoutOverlapping()`).
   - Server menjalankan cron Laravel: `* * * * * cd /home/server/web/p2mi.sippmi.com/private/Desain-Sistem/backend && php artisan schedule:run >> /dev/null 2>&1`.

2. **Webhook Real-Time (Setiap Ada Pembaruan di Gardata):**
   - Endpoint: `POST /integrations/gardata/webhook` (bebas CSRF).
   - Header otorisasi: `X-API-KEY: <GARDATA_API_KEY>` atau `X-GARDATA-WEBHOOK-SECRET: <SECRET>`.
   - Begitu sistem Gardata mengirim HTTP POST ke endpoint ini saat terjadi perubahan data, sinkronisasi langsung dipicu secara instan.

3. **Perintah CLI Artisan:**
   - Jalankan langsung kapan saja: `php artisan gardata:sync`
   - Opsi antrean: `php artisan gardata:sync --queue`

4. **Sinkronisasi Manual UI:**
   - Tombol "Sinkronisasi Gardata" di modul Pencari Kerja (`/app/modul-a`) bagi `super_admin` dan `task_force`.
   - Riwayat dan status tercatat di tabel `integration_sync_logs` serta panel Laporan Eksekutif (`/app/reports`).

## Hal yang perlu dikonfirmasi pemilik SIPPMI

1. Key API read-only baru dan rotasi key fallback saat ini.
2. Persetujuan pertukaran data yang eksplisit untuk integrasi ini, termasuk cakupan wilayah dan field yang boleh dibagikan. Flag perjanjian yang tersedia sekarang belum secara eksplisit menyebut transfer lintas sistem.
3. Kode Kemendagri atau mapping kabupaten/kota yang otoritatif; saat ini pencocokan nama ambigu akan dilewati.
4. Apakah detail modul/kompetensi dari endpoint detail perlu diimpor pada fase berikutnya.
5. Pemetaan ID kelas, program, sektor/jabatan, dan lembaga jika riwayat Gardata perlu masuk ke tabel program internal, bukan tabel riwayat eksternal.
6. Batas paginasi/rate limit dan kebijakan retensi/penghapusan data yang berlaku.
