---
description: Audit penggunaan data dummy vs data real database
---

Lakukan audit READ-ONLY (jangan ubah kode) pada seluruh project:

1. **Peta data**: daftar semua halaman/komponen/endpoint yang menampilkan atau
   mengembalikan data bisnis, lalu tentukan sumbernya (database / hardcoded /
   random / API eksternal / tidak jelas).
2. **Scan pola dummy**: cari kata kunci dummy, mock, fake, faker, sample, lorem,
   placeholder, Math.random, array/objek literal besar, JSON statis, serta
   data di file seed yang ikut ter-import ke kode produksi.
3. **Verifikasi koneksi DB**: temukan konfigurasi koneksi, ORM/query yang
   dipakai, dan pastikan tiap endpoint benar-benar memanggil query
   (bukan sekadar mengembalikan konstanta).
4. **Cek alur transaksi**: untuk proses create/update/delete (mis. order,
   pembayaran, stok), pastikan ada INSERT/UPDATE nyata, penggunaan transaksi DB
   (BEGIN/COMMIT/ROLLBACK) bila perlu, dan penanganan error.
5. **Cek fallback berbahaya**: cari `catch` atau `||` yang diam-diam
   mengembalikan data contoh.
6. **Cek dependency**: faker/mock library yang masuk dependency produksi.

Keluarkan laporan tabel:
| File:Baris | Temuan | Jenis (dummy/hardcoded/random/fallback) | Tingkat risiko | Saran perbaikan |

Tutup dengan ringkasan: persentase fitur yang memakai data real vs tidak,
dan daftar prioritas perbaikan. Tandai dengan jelas apa yang TIDAK bisa
diverifikasi dari kode saja (mis. isi database sebenarnya).
