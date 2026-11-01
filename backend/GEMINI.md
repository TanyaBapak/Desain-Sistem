# Aturan Utama Backend & Database

## Larangan Keras: DILARANG MIGRATE REFRESH / FRESH / RESET
- **DILARANG KERAS menjalankan `php artisan migrate:refresh`, `migrate:fresh`, `migrate:reset`, `db:wipe`, atau perintah destruktif sejenis apapun yang terjadi.**
- Database berisi data riil/operasional yang **TIDAK BOLEH** di-drop, di-reset, atau dihapus ulang.
- Jika ada penyesuaian skema database, **SELALU** buat migration baru yang bersifat non-destruktif (`php artisan migrate`).
- Aturan lengkap proyek mengacu pada `../AGENTS.md`.
