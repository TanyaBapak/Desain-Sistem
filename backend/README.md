# Backend Laravel + Inertia

Laravel 12 menjalankan rute aplikasi dan mengirim halaman React melalui Inertia.
Komponen mockup tetap berada di `../src`. Autentikasi menggunakan session Laravel;
data bisnis pada halaman masih berupa mockup frontend.

## Prasyarat

- PHP 8.2+ dengan ekstensi PDO MySQL
- Composer
- Node.js 20+ dan pnpm
- MySQL/MariaDB

## Menjalankan lokal

Dari root proyek, pasang dependency frontend yang dipakai komponen di `src/`:

```sh
pnpm install
```

Lalu siapkan Laravel dari folder `backend/`:

```sh
cd backend
composer install
cp .env.example .env
php artisan key:generate
pnpm install
```

Atur kredensial MySQL pada `backend/.env`.
Atur juga `DEMO_ADMIN_PASSWORD` dengan kata sandi lokal minimal 12 karakter.
Jangan memakai kata sandi produksi atau menyimpannya di source control.

Buat database pengembangan kosong di MySQL/MariaDB:

```sql
CREATE DATABASE smk_goglobal_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Jalankan migration dan fixture pengembangan:

```sh
php artisan migrate --seed
```

Migration membuat skema aplikasi dari awal. Seeder dapat dijalankan ulang dan
memuat referensi wilayah, sektor, negara, peran/izin, serta contoh bisnis yang
jelas fiktif. Fixture akun `admin-demo` (`admin-demo@smkgoglobal.local`) hanya
dibuat pada environment `local`/`testing`; kata sandinya berasal dari
`DEMO_ADMIN_PASSWORD`. Seeder menolak berjalan di environment lain.

Jangan mengimpor `../database/smk_goglobal.sql` secara langsung: file tersebut
berisi perintah destruktif dan contoh data pribadi. Migration Laravel tidak
menjalankan atau menyalin perintah SQL itu; identitas peserta dalam fixture
diganti dengan data fiktif.

Lalu jalankan dua terminal:

```sh
php artisan serve
```

```sh
pnpm dev
```

Buka `http://localhost:8000`. Navigasi modul dilayani oleh rute Laravel dan
diperbarui secara client-side oleh Inertia.

Untuk memeriksa frontend produksi, jalankan `pnpm build` dari `backend/`.
Tes backend: `php artisan test`.

## Autentikasi

- Form login menerima username, email, atau NIP dan memvalidasi kredensial di
  backend. Rute `/app/*` memerlukan autentikasi; akses modul diperiksa dari
  peran yang tersimpan di database.
- Login meregenerasi session, logout menginvalidasi session dan token CSRF,
  serta endpoint login dibatasi 5 percobaan per menit.
- Akun dengan `mfa_enabled` tidak dapat masuk sampai alur MFA resmi
  diintegrasikan. Jangan menandai akun produksi sebagai MFA aktif sebelum
  integrasi tersebut tersedia.
- Kredensial sesi tidak disimpan di `localStorage`. Gunakan HTTPS dan konfigurasi
  cookie/session yang aman sebelum deployment.
- Data modul frontend selain identitas autentikasi tetap data mockup; CRUD dan
  integrasi API belum dibangun oleh setup ini.

Gunakan database pengembangan kosong untuk setup pertama. Jangan menjalankan
migrasi terhadap database lama yang skemanya belum ditinjau dan dicadangkan.
