# 📹 Digitalisasi Monitoring CCTV — PT Kereta Api Indonesia (Persero)

Aplikasi Web fullstack untuk digitalisasi formulir pemeriksaan dan monitoring operasional & backup titik CCTV stasiun KAI secara mingguan (M1-M4), dilengkapi workflow approval Assistant Manager dan fitur **Cetak PDF Presisi 100% Identik Formulir Fisik KAI**.

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
│   │   ├── models/           # 6 Model Database MySQL
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

| Role | NIPP | Password | Jabatan | Hak Akses |
|------|------|----------|---------|-----------|
| **Petugas** | `30566` | `petugas123` | Petugas IT Support | Input data mingguan, simpan draft, edit, submit laporan |
| **Assistant Manager** | `43494` | `manager123` | Asst. Manager IT Support 1 | Review laporan, Approve/Reject + komentar, Cetak PDF, CRUD Master Data CCTV & Stasiun |

---

## 📋 Fitur Utama Aplikasi

1. **Dashboard Analytics**: Ringkasan jumlah draft, pending review, approved, rejected, serta peringatan stasiun yang belum mengisi bulan berjalan.
2. **Input Monitoring Mingguan (M1-M4)**:
   - Klik toggle interaktif: **✓ (Berfungsi/Terbackup)** ↔ **✗ (Tidak)** ↔ **- (Kosong)**
   - Date picker tanggal pelaksanaan per minggu
   - Auto-save draft
3. **Approval Workflow**:
   - Status transition: `Draft` → `Submitted` → `Approved` / `Rejected`
   - Log riwayat approval lengkap dengan catatan komentar penolakan.
4. **Cetak PDF Presisi 100% Identik Formulir Fisik KAI**:
   - Menggunakan Puppeteer (Chromium Engine) merender HTML Handlebars template.
   - Mengikuti tata letak asli: Header logo KAI, metadata No Ref/Nomor/Versi, tabel M1-M4, catatan, serta blok tanda tangan NIPP Asst. Manager & Petugas.
5. **Master Data Management**: CRUD Stasiun, Business Area, dan Titik CCTV per stasiun.
