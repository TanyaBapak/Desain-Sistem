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

## Impor data wilayah nasional

Seeder `ReferenceDataSeeder` hanya menyediakan sebagian kecil wilayah untuk
pengembangan. Untuk memuat data nasional, siapkan JSON dari sumber resmi yang
telah diverifikasi lalu jalankan perintah Artisan di server. Perintah ini
menormalisasi kode kabupaten/kota seperti `32.01` menjadi `3201`, melakukan
upsert dalam transaksi, dan tidak menghapus wilayah yang sudah ada.

Format file:

```json
{
  "provinces": [
    { "id": "32", "name": "Jawa Barat" }
  ],
  "districts": [
    {
      "id": "32.01",
      "province_id": "32",
      "name": "Kabupaten Bogor",
      "type": "Kabupaten"
    },
    {
      "id": "32.71",
      "province_id": "32",
      "name": "Kota Bogor",
      "type": "Kota"
    }
  ]
}
```

Setiap kabupaten/kota harus memiliki kode, nama, serta tipe `Kabupaten` atau
`Kota`. Kode provinsi dua digit; kode kabupaten/kota empat digit, dengan titik
opsional pada file masukan. Kolom `province_id` pada kabupaten/kota opsional
karena dapat diturunkan dari dua digit pertama kode wilayah.

### Membuat file dari API publik

Jika `jq` tersedia di server, API publik Wilayah.id dapat dipakai untuk
mengunduh daftar provinsi dan kabupaten/kota lalu membentuk file impor:

```sh
cd /home/server/web/p2mi.sippmi.com/private/Desain-Sistem/backend
command -v jq
set -eu
tmpdir=$(mktemp -d)
curl --fail --silent --show-error --location https://wilayah.id/api/provinces.json \
  --output "$tmpdir/provinces.json"
for province_id in $(jq -r '.data[].code' "$tmpdir/provinces.json"); do
  curl --fail --silent --show-error --location \
    "https://wilayah.id/api/regencies/${province_id}.json" \
    --output "$tmpdir/regencies-${province_id}.json"
done
mkdir -p storage/app/reference
jq -s '{
  provinces: (.[0].data | map({id: .code, name: .name})),
  districts: (.[1:] | map(.data[]) | map({
    id: .code,
    province_id: (.code | split(".")[0]),
    name: .name,
    type: (if (.name | startswith("Kota ")) then "Kota" else "Kabupaten" end)
  }))
}' "$tmpdir/provinces.json" "$tmpdir"/regencies-*.json \
  > storage/app/reference/wilayah.json
```

`Wilayah.id` adalah API publik pihak ketiga, bukan endpoint resmi Kemendagri.
Periksa tanggal pembaruan pada metadata respons dan cocokkan hasilnya dengan
referensi resmi Kemendagri sebelum digunakan sebagai master data produksi.
Jika `jq` belum terpasang, minta administrator server memasangnya atau unggah
file JSON dengan format di atas dari komputer lokal. Jangan mengunduh/menimpa
data produksi tanpa meninjau file terlebih dahulu.

Validasi file lalu impor dari direktori `backend/`:

```sh
php artisan regions:import storage/app/reference/wilayah.json --dry-run
php artisan regions:import storage/app/reference/wilayah.json
```

Jalankan perintah kedua hanya jika dry-run berhasil. File sementara unduhan
berada pada direktori sementara server; file hasil yang akan dipakai importer
berada di `backend/storage/app/reference/wilayah.json`.

## Impor data lembaga vokasi

File `data_vokasi.csv` berisi beberapa baris untuk satu lembaga, karena setiap
baris dapat mewakili sektor dan jabatan yang ditawarkan. Setelah menjalankan
migrasi, validasi file dari direktori `backend/`:

```sh
php artisan institutions:import-vokasi ../data_vokasi.csv --dry-run
```

Jika validasi berhasil, jalankan perintah tanpa `--dry-run` untuk mengimpor:

```sh
php artisan institutions:import-vokasi ../data_vokasi.csv
```

### Impor ke produksi

Lakukan impor pada server produksi setelah merilis versi aplikasi yang memuat
perintah ini. Sebelum mengubah database, buat dan verifikasi backup database
melalui prosedur operasional server. Pastikan `backend/.env` menunjuk ke
database produksi yang benar, lalu terapkan migration yang tertunda:

```sh
cd /path/aplikasi/backend
php artisan migrate:status
php artisan migrate --force
```

Unggah CSV ke server melalui jalur privat yang disetujui, bukan ke Git atau
direktori publik. Simpan misalnya sebagai
`backend/storage/app/import/data_vokasi.csv`, kemudian jalankan dry-run dan
tinjau outputnya:

```sh
mkdir -p storage/app/import
php artisan institutions:import-vokasi storage/app/import/data_vokasi.csv --dry-run
```

Jika file dan database yang dituju sudah dipastikan benar, jalankan impor:

```sh
php artisan institutions:import-vokasi storage/app/import/data_vokasi.csv
```

Perintah ini melakukan upsert untuk sumber `data_vokasi_csv`; ia tidak menghapus
lembaga lain. Pengulangan impor memperbarui data lembaga dari CSV yang sama,
termasuk status verifikasi serta metadata sektor/jabatan. Tinjau dampaknya
terhadap perubahan manual pada lembaga sumber tersebut sebelum menjalankan.
Satu nilai kapasitas yang melebihi rentang kolom akan dilaporkan dan disimpan
sebagai tidak diketahui.

Impor mengelompokkan baris berdasarkan `institutionId`; jika kolom itu kosong,
perintah memakai `id_lembaga_vokasi` dengan awalan `legacy-`. Impor dapat
dijalankan ulang: lembaga dari sumber `data_vokasi_csv` diperbarui berdasarkan
identitas tersebut dan data lain tidak dihapus. Wilayah hanya dihubungkan ke
master provinsi/kabupaten yang cocok; nama wilayah sumber tetap disimpan bila
master wilayah nasional belum tersedia. Status verifikasi dimulai sebagai
belum terverifikasi. Kapasitas di luar rentang kolom ditampilkan sebagai
peringatan dan disimpan sebagai tidak diketahui, bukan dipotong atau ditebak.

Sektor disimpan sebagai sektor yang didukung lembaga. Setiap pasangan unik
sektor-jabatan disimpan sebagai metadata penawaran sumber; bila satu pasangan
muncul beberapa kali dengan status validasi berbeda, seluruh variasi statusnya
tetap disimpan pada penawaran yang sama. Data ini tidak
membuat program pelatihan aktif karena CSV tidak menyediakan jadwal, durasi,
kuota, atau target negara.

Kolom `Jenis lembaga` dipetakan ke kategori internal yang tersedia: `BLKLN`
menjadi `LPK`, `Balai` menjadi `BLK`, `SMA` menjadi `SMK`, dan `LSP` menjadi
`LPK`. Jenis sumber asli tetap disimpan pada metadata lembaga.

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
