# Peta pemeriksaan stasiun

Dashboard mengganti daftar “Stasiun Belum Mengisi Bulan Ini” dengan skema jalur dan lingkaran stasiun. Susunan mengikuti slide pertama PETA KENDALI. Peta tidak memakai skala jarak. Semua stasiun aktif dengan wilayah `Daop 6 Yogyakarta` ditampilkan; stasiun dengan kode di luar susunan diagram muncul di bawah peta.

## Warna dan periode

- Hijau: Berfungsi dan Terbackup pada seluruh kelompok sudah terisi V atau X.
- Merah: laporan belum dibuat, isian belum lengkap, atau pemeriksaan minggu sebelumnya terlewat.
- Lingkaran kosong: stasiun belum memiliki kelompok CCTV. Kondisi ini tidak dianggap pemeriksaan selesai.

Status X tetap berarti sudah diperiksa. Warna peta menunjukkan kelengkapan pemeriksaan, bukan kondisi kamera atau status persetujuan laporan. Laporan draft yang lengkap dapat berwarna hijau.

Pilihan Bulanan menghitung seluruh minggu yang sudah dimulai pada periode tersebut, termasuk minggu berjalan. Minggu yang belum dimulai tidak membuat stasiun merah dan tombol minggunya belum dapat dipilih. M1 dimulai pada Senin pertama bulan tersebut; minggu berlangsung penuh Senin–Minggu, termasuk jika berakhir di bulan berikutnya. Periode awal peta mengikuti bulan tanggal Senin minggu berjalan, sehingga pada 1 November 2026 masih menampilkan Oktober. Kalender menggunakan waktu Asia/Jakarta dan aturan pada [pemeriksaan mingguan](pemeriksaan-mingguan.md).

Jika laporan sudah ada, jumlah kelompok mengikuti anggota laporan yang tersimpan. Perubahan master setelah pembuatan laporan tidak mengubah daftar kelompok pemeriksaan bulan itu. Tanpa laporan, jumlah kelompok mengikuti master CCTV aktif stasiun.

## Pemakaian

1. Buka Dashboard dan pilih bulan. Tampilan awal mengikuti bulan berjalan menurut server.
2. Pilih Bulanan atau M1–M5 untuk melihat kelengkapan pada rentang tersebut.
3. Arahkan kursor ke kode stasiun untuk melihat nama dan kelengkapannya. Klik stasiun, atau pilih dengan Tab lalu Enter, untuk membuka rincian jumlah kelompok setiap minggu dalam pop-up di tengah layar. Tutup dengan tombol Tutup, tanda silang, Escape, atau klik di luar pop-up.
4. Setelah menyimpan pemeriksaan, kembali ke Dashboard atau klik Perbarui.

Petugas dan assistant manager melihat ringkasan seluruh Daop 6. Tombol Buka laporan hanya muncul jika pengguna memiliki hak membaca laporan itu. API hanya mengirim ringkasan jumlah kelompok; isi detail dan catatan laporan pengguna lain tidak disertakan. Pemeriksaan ini tidak mengubah aturan kepemilikan endpoint laporan.

Endpoint: `GET /api/dashboard/inspection`, dengan parameter opsional `bulan` dan `tahun`. Autentikasi tetap wajib. Fitur tidak membutuhkan migrasi atau menjalankan seeder.
