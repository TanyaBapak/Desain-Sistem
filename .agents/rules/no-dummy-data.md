# Rule: Wajib Data Real dari Database

## Prinsip utama
Semua data yang ditampilkan, dihitung, atau dikembalikan oleh aplikasi
HARUS berasal dari database melalui query/transaksi nyata.
Data dummy hanya boleh ada di folder test/seed yang eksplisit.

## DILARANG di kode produksi (src/, app/, lib/, api/, components/, dll.)
- Array/objek hardcoded yang meniru data bisnis (user, produk, transaksi, laporan)
- Nilai random sebagai pengganti data (Math.random, faker, random.randint, uuid palsu)
- Fallback diam-diam ke data contoh saat query gagal atau hasil kosong
- Library faker/mock/lorem di dependency produksi
- Kata kunci mencurigakan: dummy, mock, sample, fake, placeholder, lorem,
  "John Doe", "test@example.com", TODO: replace with real data
- Angka statistik/grafik/total yang ditulis manual, bukan hasil agregasi query
- Endpoint yang mengembalikan response statis tanpa menyentuh database

## DIPERBOLEHKAN hanya di
- tests/, __tests__/, *.test.*, *.spec.*, e2e/
- seeds/ atau fixtures/ (dan harus tidak dijalankan di production)
- Storybook/dokumentasi yang jelas diberi label

## Perilaku agent
1. Jika diminta membuat fitur yang butuh data, WAJIB tulis query/ORM ke database
   (tabel/kolom sesuai skema yang ada). Jangan membuat data contoh agar UI "terlihat jalan".
2. Jika skema/tabel belum ada atau data belum tersedia, JANGAN mengarang data.
   Berhenti dan tanyakan: skema, koneksi, atau migrasi apa yang dibutuhkan.
3. Jika query gagal atau kosong, tampilkan error state / empty state yang jujur,
   bukan data pengganti.
4. Setiap perubahan yang menampilkan data harus menyebutkan sumbernya:
   file, fungsi, query/tabel yang dipakai.
5. Jika menemukan data dummy di kode produksi, laporkan dulu, jangan diam-diam
   dibiarkan atau ditimpa tanpa konfirmasi.
6. Jangan menyatakan "sudah terhubung ke database" tanpa bukti
   (kode query + lokasi konfigurasi koneksi).

## Format laporan di akhir tugas
- Sumber data: [tabel/query/endpoint]
- Data dummy ditemukan/ditambahkan: Ya/Tidak (jika ya, lokasi dan alasan)
- Hal yang belum bisa diverifikasi: [daftar]
