# 📹 Digitalisasi Monitoring CCTV — PT Kereta Api Indonesia (Persero)

Aplikasi Web fullstack untuk digitalisasi formulir pemeriksaan dan monitoring operasional & backup titik CCTV stasiun KAI secara mingguan (M1–M5 sesuai kalender), dilengkapi workflow approval Assistant Manager dan cetak PDF formulir monitoring.

---

## 🛠️ Tech Stack

- **Frontend**: React.js 18 (Vite), React Router v6, Axios, Vanilla CSS Design System, React Hot Toast, React Icons
- **Backend**: Node.js 20, Express.js, Sequelize ORM, MySQL 8.0, JWT Authentication, Puppeteer, Handlebars
- **Database**: MySQL (`monitoring_cctv`)

---

## 📁 Struktur Folder Project

```text
monitoring-cctv/
├── server/                   # Node.js + Express Backend API
│   ├── src/
│   │   ├── config/           # Koneksi database MySQL (Sequelize)
│   │   ├── controllers/      # Logic Controller (Auth, Station, CCTV, Report, Dashboard)
│   │   ├── middleware/       # JWT Auth & Error Handler
│   │   ├── models/           # Model database dan counter nomor referensi bulanan
│   │   ├── routes/           # REST API Endpoint Routes
│   │   ├── seeders/          # Data awal (Users, Station Lempuyangan, 20 Titik CCTV)
│   │   ├── services/         # Puppeteer PDF Generator Service
│   │   ├── templates/pdf/    # HTML & CSS Template Presisi PDF KAI
│   │   └── app.js            # Express server entry point
│   ├── .env                  # DB Credentials & JWT Secret
│   └── package.json
│
└── client/                   # React.js Frontend SPA
    ├── src/
    │   ├── components/       # Layout, Sidebar, StatusToggle (V/X)
    │   ├── context/          # Auth Context
    │   ├── pages/            # Login, Dashboard, Form Input, List, Detail, Review, Master Data
    │   ├── services/         # Axios API Client
    │   ├── App.jsx           # Routing & Protected Routes
    │   └── index.css         # Clean KAI Corporate Light Theme (Design Tokens & Color Palette)
    └── package.json
```

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Persiapan Database MySQL

Pastikan MySQL (XAMPP / MySQL Server / Laragon) sudah berjalan di komputer Anda.

Buat database baru di MySQL:
```sql
CREATE DATABASE monitoring_cctv;
```

---

### 2. Konfigurasi Backend Server

Buka terminal di folder `server`:
```bash
cd "d:\MAGANG DOKUMEN\KAI\monitoring-cctv\server"
```

Edit file `.env` jika password MySQL Anda tidak kosong:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=monitoring_cctv
DB_USER=root
DB_PASSWORD=
JWT_SECRET=kai-cctv-monitoring-secret-key-2026
```

Jalankan perintah **Seed Database** (membuat tabel otomatis & mengisi data awal stasiun Lempuyangan, 20 titik CCTV, serta akun pengguna):
```bash
npm run seed
```

Jalankan Backend Server:
```bash
npm run dev
# Server berjalan di http://localhost:5000
```

---

### 3. Konfigurasi & Jalankan Frontend Client

Buka terminal baru di folder `client`:
```bash
cd "d:\MAGANG DOKUMEN\KAI\monitoring-cctv\client"
```

Jalankan Dev Server React:
```bash
npm run dev
# Frontend berjalan di http://localhost:5173
```

---

## 🔑 Akun Login Bawaan (Default Users)

Sistem sudah dilengkapi 2 akun untuk pengujian role:

| Role | NIPP | Password | Nama | Jabatan | Hak Akses |
|------|------|----------|------|---------|-----------|
| **Petugas** | `12345` | `12345` | PETUGAS 1 | Petugas IT Support | Input data mingguan, simpan draft, edit, submit laporan |
| **Assistant Manager** | `99999` | `12345` | MANAGER 1 | Asst. Manager IT Support 1 | Review laporan, Approve/Reject + komentar, Cetak PDF, CRUD Master Data CCTV & Stasiun |

---

## 📋 Fitur Utama Aplikasi

1. **Dashboard Analytics**: Ringkasan jumlah draft, pending review, approved, rejected, serta peta kelengkapan pemeriksaan stasiun Daop 6 per bulan dan minggu.
2. **Input Monitoring Mingguan (M1–M5 sesuai kalender)**:
   - Klik toggle interaktif: **✓ (Berfungsi/Terbackup)** ↔ **✗ (Tidak)** ↔ **- (Kosong)**
   - M1 dimulai pada Senin pertama bulan laporan; setiap minggu berjalan Senin–Minggu, termasuk jika berakhir pada bulan berikutnya.
   - Pengisian hanya pada minggu berjalan menurut waktu server WIB. Simpan Draft untuk melanjutkan minggu berikutnya.
   - No. Ref otomatis saat draft pertama disimpan, berurutan untuk semua stasiun dalam bulan/tahun laporan dan mulai lagi dari 01 pada periode berikutnya.
3. **Approval Workflow**:
   - Status transition: `Draft` → `Submitted` → `Approved` / `Rejected`
   - Log riwayat approval lengkap dengan catatan komentar penolakan.
4. **Cetak PDF Formulir Monitoring**:
   - Menggunakan Puppeteer (Chromium Engine) merender HTML Handlebars template.
   - Memuat header logo KAI, metadata No Ref/Nomor/Versi, tabel empat atau lima minggu sesuai kalender, catatan, serta blok tanda tangan NIPP Asst. Manager & Petugas.
5. **Master Data Management**: CRUD Stasiun dan Titik CCTV per stasiun.

File pendataan CCTV September 2026 dengan kolom Kode Stasiun tersedia di [folder data](<data/Form_Pendataan_CCTV_KAI_Enhanced_Daop 6_092026-rev1.xlsx>). Gunakan sheet **Form Pendataan CCTV** melalui menu **Impor Excel KAI**.

---

## 👥 Tim Pengembang (Development Team)

Proyek ini dirancang dan dikembangkan secara kolaboratif oleh tim beranggotakan 5 orang:

| Nama Anggota | Peran Utama | Fokus Area & Tanggung Jawab Teknis |
| :--- | :--- | :--- |
| **Nouval** | **Project Leader & Fullstack Lead** | Arsitektur sistem menyeluruh, arsitektur keamanan & autentikasi JWT, middleware RBAC, koordinasi tim pengembang & repositori GitHub. |
| **Bagas** | **Frontend Developer & UI/UX Specialist** | Antarmuka pengguna SPA React 18 (Vite), Clean KAI Corporate Light Theme, komponen interaktif StatusToggle matriks M1-M4, & routing dinamis. |
| **Galih** | **Backend Developer & REST API Engineer** | Backend RESTful API Express.js, business controllers (Reports, Dashboard Analytics, Stations, CCTV), error handling terpusat, & validasi data. |
| **Putra** | **Database Administrator (DBA) & Data Modeler** | Perancangan ERD relasional MySQL 8.0, konfigurasi ORM Sequelize, composite unique constraints (`uq_report_period`), & skrip database seeder. |
| **Ali** | **Reporting Engine Specialist & QA / Docs** | Engine Puppeteer PDF Generator (A4 Landscape presisi form fisik KAI), fallback browser Chromium Windows, QA testing, & dokumentasi PRD / Handover. |

