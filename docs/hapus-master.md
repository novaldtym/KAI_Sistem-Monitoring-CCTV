# Penghapusan master stasiun dan titik CCTV

Tombol hapus pada Master Stasiun dan Master CCTV menghapus baris secara permanen dari MySQL. Penghapusan stasiun sekaligus menghapus seluruh titik CCTV milik stasiun tersebut, termasuk titik yang nonaktif. Seluruh operasi menggunakan satu transaksi.

Stasiun tidak dapat dihapus jika memiliki laporan atau ada titik CCTV-nya yang digunakan dalam detail laporan. Titik CCTV tidak dapat dihapus jika sudah digunakan dalam detail laporan. API mengembalikan HTTP 409 dengan penjelasan, dan data tetap utuh. Hubungan database dari laporan ke stasiun serta detail laporan ke titik CCTV menggunakan `ON DELETE RESTRICT` sebagai perlindungan tambahan.

Model disinkronkan saat backend dimulai menggunakan mekanisme startup yang sudah ada. Cadangkan database sebelum memperbarui backend. Perbaikan ini tidak menjalankan seeder atau membersihkan data nonaktif secara otomatis.

Data impor yang dihapus permanen dapat dibuat kembali jika Excel yang sama diimpor ulang, karena baris sumbernya masih tersedia dalam file.
