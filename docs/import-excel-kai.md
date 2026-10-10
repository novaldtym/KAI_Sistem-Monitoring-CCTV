# Impor pendataan CCTV KAI — tahap 1

Login sebagai Assistant Manager, buka **Master Stasiun** atau **Master CCTV**, lalu pilih **Impor Excel KAI**. Pilih file `.xlsx`/`.xls` dan klik **Buat Pratinjau**. Jika tidak ada kesalahan, klik **Simpan Hasil Impor**.

Impor membaca sheet **Form Pendataan CCTV**, mencari header pada 30 baris pertama, dan hanya mengambil baris dengan wilayah **Daop 6 Yogyakarta** serta Nama Lokasi yang diawali **Stasiun**. Sheet petunjuk, lokasi depo/kantor/lokomotif, dan wilayah lain tidak diimpor. Batas unggahan 10 MB.

| Kolom sumber | Data aplikasi |
| --- | --- |
| Wilayah (Kantor Pusat/Daop/Divre) | Wilayah stasiun |
| Nama Lokasi | Nama stasiun dan hubungan kelompok CCTV ke stasiun |
| Kode Stasiun (opsional) | Singkatan stasiun, misalnya YK atau LPN |
| Detail Penempatan/Objek Pantau | Nama titik/kelompok pemeriksaan |
| Unit Pemilik/Pengelola | Unit pengelola kelompok |
| Kategori CCTV | Kategori kelompok |
| Jenis CCTV | IP Camera, Analog Camera, atau Standalone Camera |
| Merek CCTV | Merek |
| Fungsi AI | Fungsi AI |
| Jumlah Kamera | Bilangan bulat positif; dijumlahkan untuk total kamera stasiun |
| Keterangan | Keterangan kelompok |

Satu baris sumber tetap menjadi satu kelompok pemeriksaan, termasuk ketika Jumlah Kamera lebih dari satu. Master Stasiun menampilkan jumlah kelompok dan jumlah kamera secara terpisah. Kolom No. sumber tidak dipakai sebagai nomor urut aplikasi karena penomoran sumber mencakup lokasi di luar cakupan. Nomor urut baru melanjutkan nomor terbesar di stasiun, termasuk kelompok nonaktif.

File asli tidak menyediakan Business Area maupun kode stasiun. Pada salinan yang diperbarui tanggal 9 Oktober 2026, kolom **Kode Stasiun** ditambahkan untuk 36 stasiun Daop 6 berdasarkan [referensi kode stasiun](kode-stasiun-daop6.md). Kolom ini opsional sehingga file lama tetap dapat diimpor. Kode dari Excel mengisi stasiun baru atau kode master yang masih kosong; kode master yang sudah ada dipertahankan. Kode yang berbeda antarbaris untuk stasiun yang sama, bertentangan dengan master, atau digunakan stasiun lain menghalangi impor. Kode dinormalisasi menjadi huruf kapital, maksimal 10 huruf/angka tanpa spasi.

Business Area tidak dipakai pada formulir, tabel master, dan impor; kolom database lama menerima NULL tanpa nilai bawaan B060. Stasiun lama dicocokkan melalui nama tanpa awalan Stasiun, kapitalisasi, spasi, atau tanda baca. Nama dan jadwal stasiun lama dipertahankan. Bila kolom Kode Stasiun tidak tersedia atau kosong, kode stasiun baru tetap kosong untuk dilengkapi di Master Stasiun. Nama yang cocok dengan beberapa stasiun, stasiun nonaktif, atau wilayah yang berbeda menghalangi impor.

Untuk database lama, cadangkan database lalu jalankan `server/migrations/20261009-remove-business-area.sql` agar nilai B060 pada stasiun Daop 6 dikosongkan. Migrasi ini sudah diterapkan pada database lokal tanggal 9 Oktober 2026.

Pratinjau menampilkan satu tabel berisi 5 baris pertama data yang akan diimpor, meliputi stasiun, kode stasiun, penempatan, unit, kategori, jenis CCTV, merek, fungsi AI, dan jumlah kamera. Ringkasan stasiun dan peringatan baris berulang tidak ditampilkan. Bila ada kesalahan yang menghalangi impor, pesan dan nomor baris Excel tetap muncul untuk diperbaiki. Tombol Simpan Hasil Impor menyimpan seluruh data yang valid dalam cakupan, bukan hanya 5 baris contoh. File contoh September 2026 memuat 36 stasiun, 443 kelompok, dan 463 kamera dalam cakupan ini.

Impor ulang menggunakan identitas wilayah, stasiun, unit, kategori, penempatan, dan urutan kemunculan kelompok yang identik. Jumlah kamera, jenis, merek, fungsi AI, dan keterangan dapat diperbarui tanpa menambah kelompok baru. Beberapa baris dengan identitas yang sama tetap menjadi kelompok terpisah, mengikuti urutan dalam file. Perubahan nama stasiun/unit/kategori/penempatan membentuk identitas baru; kelompok lama tidak otomatis dihapus.

Kelompok manual, kelompok di luar file terbaru, dan laporan lama tetap disimpan. Kelompok yang sudah dinonaktifkan tidak otomatis diaktifkan kembali. Karena itu, total inventaris aplikasi dapat lebih besar daripada total pada file ketika masih ada data dummy/manual. Tinjau kelompok tersebut di Master CCTV jika ingin menonaktifkannya.

Semua penyimpanan impor stasiun dan CCTV menggunakan satu transaksi. Jika salah satu penyimpanan gagal, seluruh impor dibatalkan. Backend memeriksa ulang file dan data master saat penyimpanan; jika berubah sejak pratinjau, pengguna harus membuat pratinjau ulang.

Kolom baru ditambahkan oleh sinkronisasi model pada startup backend yang sudah digunakan aplikasi. Jangan menjalankan seeder untuk memperbarui struktur database: seeder masih memakai `force: true` dan dapat menghapus data.
