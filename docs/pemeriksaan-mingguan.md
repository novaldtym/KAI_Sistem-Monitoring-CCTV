# Pemeriksaan mingguan CCTV

Satu baris laporan mewakili satu kelompok penempatan/objek pantau dari master CCTV. Jumlah kamera dalam kelompok tidak menambah baris pemeriksaan. Setiap minggu memiliki dua status: Berfungsi dan Terbackup. Keduanya harus V atau X agar kelompok dihitung sudah diperiksa; tanda `-` berarti belum diperiksa.

## Kalender

M1 dimulai pada **Senin pertama yang jatuh di bulan laporan**. Satu minggu berlangsung Senin–Minggu selama tujuh hari, dan masuk ke bulan tempat tanggal Seninnya berada. Minggu terakhir dapat berakhir pada bulan atau tahun berikutnya.

Contoh Oktober 2026:

| Minggu | Rentang |
| --- | --- |
| M1 | 5–11 Oktober |
| M2 | 12–18 Oktober |
| M3 | 19–25 Oktober |
| M4 | 26 Oktober–1 November |

Tanggal 1–4 Oktober masuk minggu terakhir September. Pada 1 November, minggu berjalan masih M4 Oktober; M1 November baru dimulai pada Senin, 2 November. Formulir baru dan peta otomatis memilih periode yang memuat Senin minggu berjalan, termasuk saat pergantian tahun. Kalender dan validasi tanggal memakai waktu server Asia/Jakarta.

Jumlah minggu bulanan sama dengan jumlah Senin dalam bulan tersebut: empat atau lima. Tahun 2026 memiliki 52 minggu, dengan lima minggu pada Maret, Juni, Agustus, dan November. Pada tahun yang memiliki 53 hari Senin, jumlah minggu adalah 53 dan ada lima bulan dengan lima minggu. Ini pembagian berdasarkan bulan tanggal Senin, bukan penomoran minggu ISO. Tahun kabisat tidak otomatis membuat Februari memiliki lima minggu.

Semua stasiun menggunakan aturan yang sama; pengaturan lama `hari_mulai_m1` tidak digunakan untuk laporan baru.

Hanya minggu berjalan menurut waktu server Asia/Jakarta yang boleh diubah, pada laporan draft atau rejected milik petugas. Minggu yang lewat atau belum dimulai terkunci. API menolak perubahan minggu terkunci, perubahan periode/stasiun laporan, kelompok yang bukan anggota laporan, dan manipulasi tanggal pemeriksaan. Status minggu lama yang dikirim kembali tanpa perubahan tetap diterima.

Tanggal `checked_at_mN` dicatat server ketika status minggu tersebut berubah. Tanggal ini menunjukkan perubahan terakhir yang disimpan untuk minggu tersebut, bukan bukti bahwa seluruh kelompok sudah diperiksa. Kelengkapan dihitung dari kedua status setiap kelompok.

## Alur petugas

1. Buka Input Monitoring, pilih stasiun dan periode.
2. Isi Berfungsi/Terbackup pada minggu berjalan; klik bergantian untuk memilih V, X, atau kosong.
3. Gunakan Simpan Draft untuk melanjutkan pada minggu berikutnya. Untuk banyak kelompok, pindah halaman setelah mengisi; isian halaman lain tetap disertakan saat menyimpan.
4. Submit untuk Review mengunci seluruh laporan bulanan sesuai alur persetujuan yang sudah ada. Jangan submit jika masih akan mengisi minggu berikutnya. Laporan rejected hanya dapat diperbaiki pada minggu berjalan.

Saat membuat laporan, seluruh kelompok aktif stasiun disimpan sebagai anggota laporan. Formulir edit memakai anggota yang sudah tersimpan, sehingga penambahan atau penonaktifan master tidak mengubah daftar kelompok laporan lama. Nama dan jumlah kamera masih merujuk master; ini bukan arsip lengkap atribut master pada tanggal pembuatan.

## PDF dan data lama

Halaman detail dan PDF memakai kalender yang sama dengan formulir, termasuk rentang lintas bulan/tahun dan M5 jika bulan memiliki lima hari Senin. PDF memuat maksimal 20 kelompok per bagian halaman dengan nomor halaman berlanjut.

Kolom `monitoring_reports.calendar_scheme` membedakan `monday` untuk laporan baru dan `fixed_dates` untuk laporan yang sudah tersimpan sebelum perubahan ini. Nilai default kolom adalah `fixed_dates` agar penambahan kolom tidak memindahkan hasil pemeriksaan lama ke tanggal berbeda. Pembuatan laporan melalui API menetapkan `monday`; formulir edit, validasi API, halaman detail, dan PDF mengikuti kalender yang tersimpan pada laporan. Peta menggunakan kalender Senin dan hanya menghitung status dari laporan lama jika rentang tanggalnya sama, agar tidak menampilkan pemeriksaan pada minggu yang keliru.

Konversi laporan lama perlu memeriksa tanggal pemeriksaan yang sebenarnya; jangan hanya mengganti nama M1/M2 atau menghapus hasilnya. `checked_at_mN` hanya menyimpan tanggal perubahan terakhir untuk seluruh minggu, sehingga tidak cukup untuk konversi otomatis semua laporan.

Kolom tambahan: `monitoring_reports.calendar_scheme`, `monitoring_reports.tanggal_m5`, `monitoring_reports.checked_at_m5`, `monitoring_details.m5_berfungsi`, dan `monitoring_details.m5_terbackup`. Startup aplikasi saat ini menyinkronkan model dengan `alter: true`; cadangkan database sebelum menjalankan versi ini pada instalasi lain. Jangan menjalankan seeder untuk pembaruan ini.

Peta kelengkapan pemeriksaan tersedia pada Dashboard; lihat [peta pemeriksaan](peta-pemeriksaan.md). Perubahan alur approval belum termasuk tahap ini.

## Nomor referensi otomatis

Nomor referensi diberikan server saat laporan pertama kali berhasil disimpan sebagai draft, dengan format `01/10/2026`, `02/10/2026`, dan seterusnya. Urutan berlaku bersama untuk seluruh stasiun dan petugas dalam periode bulan/tahun laporan, berdasarkan urutan penyimpanan yang berhasil. Membuka formulir belum mengambil nomor. Menyimpan ulang, mengedit, atau mengirim laporan untuk review tidak mengganti nomor.

Setiap bulan/tahun memiliki urutannya sendiri: laporan pertama November 2026 mendapat `01/11/2026`. Periode yang digunakan adalah bulan/tahun pada laporan, bukan tanggal klik simpan; menyimpan kembali laporan Oktober pada awal November tetap memakai nomor Oktober. Setelah `99`, urutan berlanjut `100`, tanpa memotong angka.

Tabel `report_reference_counters` menyimpan nomor terakhir setiap periode. Alokasi nomor, pembuatan laporan, dan penyimpanan detail berada dalam transaksi yang sama. Penguncian baris periode mencegah dua penyimpanan bersamaan memakai nomor yang sama; kegagalan penyimpanan membatalkan alokasi. Nomor yang sudah berhasil dipakai tidak digunakan kembali jika laporan dihapus.

Startup menyiapkan counter dan mengisi nomor laporan lama yang masih kosong, berurutan menurut waktu pembuatan dan ID, tanpa mengubah tanggal/status/hasil pemeriksaannya. Referensi lama yang sudah terisi dipertahankan; urutan baru melanjutkan angka tertinggi yang sudah ada. Kolom No. Ref pada formulir hanya menampilkan nilai dari server, dan API menolak perubahan referensi laporan yang sudah tersimpan. Cadangkan database sebelum pembaruan pada instalasi lain; seeder tidak diperlukan.
