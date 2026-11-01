# Aturan Database & Migrasi (STRICT / DILARANG KERAS)

## Larangan Migrasi Destruktif
- **DILARANG KERAS menjalankan `php artisan migrate:refresh`, `migrate:fresh`, `migrate:reset`, `db:wipe`, atau perintah destruktif sejenis apapun yang terjadi!**
- Database berisi data riil/operasional (peserta, lembaga, master wilayah, dsb.) yang **TIDAK BOLEH** di-drop, di-reset, atau dihapus ulang.
- Tidak ada pengecualian untuk aturan ini, baik saat debugging, pengujian, maupun perbaikan error migrasi.

## Prosedur Perubahan Skema Database
1. Jangan pernah memodifikasi migration lama yang sudah berjalan di production/staging jika berisiko merusak integritas data.
2. Setiap perubahan skema, kolom baru, penyesuaian indeks, atau perbaikan data **WAJIB** dibuatkan file migrasi baru (additive/non-destruktif).
3. Jalankan migrasi hanya menggunakan `php artisan migrate` (atau `php artisan migrate --force` di deployment).
