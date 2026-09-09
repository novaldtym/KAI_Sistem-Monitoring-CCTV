# 📑 DOKUMEN HANDOVER PROYEK: DIGITALISASI MONITORING CCTV PT KAI

> **Dokumen Rangkuman Percakapan & Status Proyek untuk Antigravity AI / Developer Next Session**  
> **Tanggal Update**: 3 September 2026  
> **Status Proyek**: Backend (100% Selesai), Frontend (100% Selesai), PDF Generator (100% Presisi Akurat Fisik), Seed Data & Auth (Siap Digunakan).

---

## 🚀 1. Ringkasan Proyek & Tujuan

Proyek ini adalah **Sistem Informasi Digitalisasi Formulir Monitoring CCTV Mingguan PT Kereta Api Indonesia (Persero)** untuk merubah proses pengisian manual berbasis kertas (`FR.SM/IT/015.017/10-2020`) menjadi aplikasi web fullstack berbasis **React.js, Node.js/Express, dan MySQL**.

### Fitur Utama
1. **User Authentication & Role-Based Access Control (RBAC)**:
   - **Petugas IT Support**: Mengisi monitoring CCTV mingguan (M1-M4), menyimpan draft, mengedit data, dan melakukan submit ke atasan.
   - **Assistant Manager IT Support 1**: Me-review laporan masuk, memberikan komentar persetujuan/penolakan, meng-approve/reject laporan, mengunduh PDF formal, serta mengelola Master Data Titik CCTV & Stasiun.
2. **Form Input Interaktif (M1-M4)**:
   - Interaksi toggle 1-klik untuk status **✓ (Berfungsi/Terbackup)** ↔ **✗ (Tidak)** ↔ **- (Kosong)**.
   - Tanggal pelaksanaan per minggu & kolom catatan.
3. **Workflow Approval**:
   - Transisi status: `Draft` ➔ `Submitted` ➔ `Approved` / `Rejected`.
   - Log histori approval tersimpan permanen di database.
4. **Cetak PDF Presisi 100% Identik Formulir Fisik KAI (`digital 1.jpeg`)**:
   - Menggunakan Puppeteer & Handlebars HTML Template.
   - Menggunakan ukuran **A4 Portrait** (bukan landscape).
   - Dilengkapi logo resmi Vektor KAI, badge kuning `TERBATAS`, header metadata dokumen, kolom vertikal `BERFUNGSI` & `TERBACKUP`, kolom vertikal `Stasiun`, bingkai `Catatan`, legenda status, serta blok tanda tangan NIPP.

---

## 🛠️ 2. Tech Stack & Arsitektur

- **Frontend (`/client`)**:
  - React.js 18 + Vite
  - React Router v6 (Protected routes per role)
  - Axios (Client API dengan interceptor JWT token)
  - Vanilla CSS Design System (Theme KAI Dark Mode `#f57c00` orange & `#0d2c6c` blue)
  - React Hot Toast & React Icons
- **Backend (`/server`)**:
  - Node.js 20 + Express.js
  - Sequelize ORM + MySQL Driver
  - JWT Authentication + bcrypt password hashing
  - Puppeteer + Handlebars (Sistem PDF Generator)
- **Database**:
  - Nama Database MySQL: `monitoring_cctv`

---

## 📊 3. Skema Database MySQL (6 Tabel Utama)

1. **`users`**: `id`, `nipp` (unique), `nama`, `email`, `password_hash`, `role` (`petugas` | `assistant_manager`), `jabatan`
2. **`stations`**: `id`, `nama_stasiun`, `business_area` (misal: B060), `kode_stasiun` (misal: LPN), `is_active`
3. **`cctv_points`**: `id`, `station_id` (FK), `nomor_urut`, `nama_titik`, `is_active`
4. **`monitoring_reports`**: `id`, `station_id` (FK), `bulan`, `tahun`, `no_ref`, `tanggal_m1..m4`, `catatan`, `status` (`draft` | `submitted` | `approved` | `rejected`), `created_by` (FK)
5. **`monitoring_details`**: `id`, `report_id` (FK), `cctv_point_id` (FK), `m1..m4_berfungsi` (`V`|`X`|`-`), `m1..m4_terbackup` (`V`|`X`|`-`)
6. **`approval_logs`**: `id`, `report_id` (FK), `approved_by` (FK), `action` (`approved`|`rejected`), `komentar`, `approved_at`

---

## 📁 4. Struktur Folder & File Kunci

```text
d:/MAGANG DOKUMEN/KAI/monitoring-cctv/
├── server/
│   ├── src/
│   │   ├── config/database.js            # Koneksi Sequelize MySQL
│   │   ├── models/                       # 6 Model (User, Station, CCTVPoint, Report, Detail, Log)
│   │   ├── controllers/                  # Logic Controller (Auth, Station, CCTV, Report, Dashboard)
│   │   ├── middleware/                   # JWT Auth & Error Handler
│   │   ├── routes/                       # Express Router API Endpoints
│   │   ├── services/pdfService.js        # Puppeteer PDF Generator Engine (Auto fallback system Chrome/Edge)
│   │   ├── templates/pdf/monitoring-cctv.html  # HTML/CSS Template 100% Presisi Formulir Fisik KAI (Portrait A4)
│   │   ├── seeders/seed.js               # Seeder data Lempuyangan, 20 titik CCTV & Akun demo
│   │   └── app.js                        # Express Server Entry Point
│   ├── .env                              # Environment variables (DB Credentials & JWT Secret)
│   └── package.json
│
└── client/
    ├── src/
    │   ├── context/AuthContext.jsx        # Auth State Management
    │   ├── services/api.js               # Axios Client API Service
    │   ├── components/                   # Layout, Sidebar, StatusToggle (V/X)
    │   ├── pages/                        # LoginPage, DashboardPage, ReportFormPage, ReportListPage, ReportDetailPage, ReviewApprovalPage, CCTVMasterPage, StationMasterPage
    │   ├── App.jsx                       # Router & Protected Route Guards
    │   └── index.css                     # Global Dark Theme Design System
    └── package.json
```

---

## 🔑 5. Akun Login Bawaan (Default Seeded Users)

| Role | NIPP | Password | Nama | Jabatan | Hak Akses Utama |
|------|------|----------|------|---------|------------------|
| **Petugas** | `30566` | `petugas123` | RONI | Petugas IT Support | Input form mingguan, edit draft, submit laporan |
| **Assistant Manager** | `43494` | `manager123` | SUDIRJO | Assistant Manager IT Support 1 | Review laporan, Approve/Reject + komentar, Cetak PDF Resmi, CRUD Master Data |

---

## 💻 6. Panduan Menjalankan Aplikasi di Device Baru

### Step 1: Clone / Copy Folder Proyek
Pastikan seluruh folder `d:\MAGANG DOKUMEN\KAI\monitoring-cctv` sudah di-copy ke device baru.

### Step 2: Persiapan Database MySQL
Pastikan MySQL (XAMPP / Laragon / MySQL Workbench) berjalan. Lalu buat database kosong:
```sql
CREATE DATABASE monitoring_cctv;
```

### Step 3: Install & Jalankan Backend Server
Buka terminal di folder `server`:
```bash
cd "d:\MAGANG DOKUMEN\KAI\monitoring-cctv\server"

# 1. Install dependencies
npm install

# 2. Seed database (Membuat tabel & memasukkan data awal)
npm run seed

# 3. Jalankan server (Backend berjalan di http://localhost:5000)
npm run dev
```

### Step 4: Install & Jalankan Frontend Client
Buka terminal baru di folder `client`:
```bash
cd "d:\MAGANG DOKUMEN\KAI\monitoring-cctv\client"

# 1. Install dependencies
npm install

# 2. Jalankan frontend (Vite React berjalan di http://localhost:5173)
npm run dev
```

---

## 📌 7. Catatan Teknis & Problem-Solving yang Telah Diselesaikan

1. **Error `Nodemon is not recognized`**:
   - Solusi: Menjalankan `npm install` di folder `server` & mengupdate `npm run dev` menggunakan `node --watch src/app.js` bawaan Node v22.
2. **Error `Could not find Chrome` saat PDF Generation**:
   - Solusi: Menambahkan fallback otomatis pada `pdfService.js` untuk mendeteksi lokasi instalasi Google Chrome (`chrome.exe`) atau Microsoft Edge (`msedge.exe`) di sistem Windows (`C:\Program Files\...`).
3. **File PDF Rusak / Unopenable**:
   - Solusi: Membungkus buffer Puppeteer dengan `Buffer.from(pdfBuffer)` di backend agar Express mengirim data binary murni `%PDF-1.4` (bukan JSON stringified numbers) serta mengatur Blob `{ type: 'application/pdf' }` di frontend.
4. **Presisi Layout PDF (Replikasi `@digital 1.jpeg`)**:
   - Solusi: Mengubah ukuran dari Landscape menjadi **A4 Portrait**, membuat header box bergaris lengkap dengan logo vektor KAI & badge `TERBATAS`, membuat sub-table metadata, teks vertikal `BERFUNGSI` & `TERBACKUP`, serta bingkai `Catatan` dan blok tanda tangan NIPP.

---

### 🤖 Pesan Khusus untuk Antigravity AI pada Device Baru:
> *"Jika percakapan dilanjutkan di device baru, silakan baca file `PROJECT_HANDOVER.md` ini terlebih dahulu. Seluruh struktur kode, skema database, seeder data, dan PDF generator sudah 100% berfungsi dan teruji."*
