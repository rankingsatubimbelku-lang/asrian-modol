# PRODUCT REQUIREMENT DOCUMENT (PRD)
# Sistem Informasi Tabungan, Kredit dan Arisan Keluarga

**Versi:** 1.0.0  
**Tanggal:** 30 Mei 2026  
**Status:** Draft — Siap untuk Development  
**Penulis:** Tim Product & Engineering  

---

## DAFTAR ISI

1. [Executive Summary](#1-executive-summary)
2. [Business Requirement](#2-business-requirement)
3. [Functional Requirement](#3-functional-requirement)
4. [Non-Functional Requirement](#4-non-functional-requirement)
5. [User Stories](#5-user-stories)
6. [Use Case Diagram](#6-use-case-diagram)
7. [Activity Diagram](#7-activity-diagram)
8. [ERD Diagram](#8-erd-diagram)
9. [Database Design](#9-database-design)
10. [Prisma Schema Design](#10-prisma-schema-design)
11. [API Specification](#11-api-specification)
12. [UI/UX Flow](#12-uiux-flow)
13. [Dashboard Design](#13-dashboard-design)
14. [Deployment Guide](#14-deployment-guide)
15. [Security Design](#15-security-design)
16. [Testing Strategy](#16-testing-strategy)
17. [Folder Structure Next.js Enterprise Scale](#17-folder-structure-nextjs-enterprise-scale)
18. [Roadmap Pengembangan](#18-roadmap-pengembangan)
19. [Estimasi Timeline Development](#19-estimasi-timeline-development)
20. [Risk Analysis](#20-risk-analysis)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Latar Belakang

Pengelolaan keuangan kelompok arisan keluarga selama ini dilakukan secara manual menggunakan buku catatan atau spreadsheet sederhana yang rawan kesalahan pencatatan, sulit diaudit, dan tidak transparan bagi seluruh anggota. Kebutuhan akan sistem yang terpusat, aman, dan mudah diakses menjadi urgensi yang nyata.

### 1.2 Deskripsi Produk

**Sistem Informasi Tabungan, Kredit dan Arisan Keluarga** adalah aplikasi web berbasis *cloud* yang dirancang untuk mengelola seluruh aktivitas keuangan kelompok arisan secara digital. Sistem ini mencakup:

- Manajemen anggota kelompok
- Pengelolaan arisan dengan undian otomatis
- Manajemen tabungan dengan perhitungan bunga otomatis
- Manajemen kredit/pinjaman dengan sistem angsuran
- Penjadwalan kegiatan kelompok
- Pelaporan keuangan yang komprehensif dan transparan

### 1.3 Target Pengguna

- Kelompok arisan keluarga besar
- Koperasi simpan pinjam skala kecil-menengah
- Paguyuban dan komunitas yang mengelola dana bersama

### 1.4 Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v3, Shadcn UI |
| Form & Validasi | React Hook Form, Zod |
| Backend | Next.js Server Actions, Route Handler API |
| ORM | Prisma ORM |
| Database | PostgreSQL (NeonDB — Serverless) |
| Auth | NextAuth.js / Auth.js v5 |
| Deployment | Vercel |
| Runtime | Node.js v22, NPM latest |

### 1.5 Tujuan Strategis

- Meningkatkan transparansi pengelolaan keuangan kelompok
- Meminimalkan kesalahan pencatatan manual
- Memberikan akses real-time kepada seluruh anggota
- Mempermudah audit dan pelaporan keuangan

---

## 2. BUSINESS REQUIREMENT

### 2.1 Business Goals

| ID | Goal | KPI |
|---|---|---|
| BG-01 | Digitalisasi pencatatan arisan | 100% transaksi tercatat digital |
| BG-02 | Transparansi keuangan kepada anggota | Anggota dapat melihat saldo & histori sendiri |
| BG-03 | Efisiensi administrasi | Waktu administrasi berkurang 80% |
| BG-04 | Audit trail lengkap | Seluruh perubahan data tercatat |
| BG-05 | Akses multi-platform | Dapat diakses via desktop & mobile |

### 2.2 Business Rules

**BR-01 — Keanggotaan:**
- Setiap anggota memiliki Nomor Anggota unik yang di-generate otomatis
- Anggota nonaktif tidak dapat mengikuti periode arisan baru
- Riwayat transaksi anggota nonaktif tetap tersimpan dan dapat diaudit

**BR-02 — Arisan:**
- Undian dilakukan satu kali per bulan
- Anggota yang sudah memenangkan undian tidak dapat mengikuti undian berikutnya dalam periode yang sama
- Hanya anggota aktif yang dapat mengikuti undian
- Iuran arisan wajib dibayar sesuai periode yang telah ditetapkan

**BR-03 — Tabungan:**
- Bunga tabungan dihitung secara periodik berdasarkan setting admin
- Penarikan tabungan tidak boleh melebihi saldo yang tersedia
- Setiap transaksi memiliki nomor transaksi unik

**BR-04 — Kredit:**
- Kredit harus melalui proses approval admin sebelum dicairkan
- Anggota nonaktif tidak dapat mengajukan kredit baru
- Denda keterlambatan dihitung otomatis berdasarkan konfigurasi sistem
- Anggota yang masih memiliki kredit aktif dapat dibatasi untuk mengajukan kredit baru (konfigurasi admin)

**BR-05 — Keamanan:**
- Super Admin disimpan di environment variable, tidak di database
- Setiap perubahan data dicatat dalam audit trail
- Session otomatis expire setelah periode tidak aktif

### 2.3 Stakeholders

| Stakeholder | Role | Kepentingan |
|---|---|---|
| Super Admin | Pengelola sistem | Kontrol penuh & keamanan sistem |
| Admin | Pengurus arisan | Efisiensi operasional |
| Anggota | Peserta arisan | Transparansi & kemudahan akses |

---

## 3. FUNCTIONAL REQUIREMENT

### 3.1 Modul Autentikasi

| ID | Fitur | Deskripsi |
|---|---|---|
| FR-AUTH-01 | Login | Login menggunakan email & password |
| FR-AUTH-02 | Logout | Logout dan invalidasi session |
| FR-AUTH-03 | Session Management | Auto-expire session, refresh token |
| FR-AUTH-04 | Super Admin Login | Login khusus dari ENV variable |
| FR-AUTH-05 | RBAC | Role-Based Access Control: Super Admin, Admin, Anggota |

### 3.2 Modul Manajemen Anggota

| ID | Fitur | Deskripsi | Role |
|---|---|---|---|
| FR-MBR-01 | Tambah anggota | Input data lengkap anggota baru | Admin, Super Admin |
| FR-MBR-02 | Edit anggota | Ubah data anggota | Admin, Super Admin |
| FR-MBR-03 | Nonaktifkan anggota | Ubah status anggota menjadi nonaktif | Admin, Super Admin |
| FR-MBR-04 | Aktifkan kembali | Reaktivasi anggota nonaktif | Admin, Super Admin |
| FR-MBR-05 | Lihat daftar anggota | Tampilkan semua anggota dengan filter | Semua Role |
| FR-MBR-06 | Lihat profil sendiri | Anggota hanya bisa lihat profil sendiri | Anggota |
| FR-MBR-07 | Upload foto | Upload foto profil anggota | Admin, Super Admin |
| FR-MBR-08 | Auto-generate nomor anggota | Format: `MBR-YYYYMM-XXXX` | Sistem |
| FR-MBR-09 | Promosi ke Admin | Super Admin dapat mempromosikan anggota menjadi Admin | Super Admin |

### 3.3 Modul Arisan

| ID | Fitur | Deskripsi | Role |
|---|---|---|---|
| FR-ARS-01 | Setup periode arisan | Buat periode baru dengan konfigurasi lengkap | Admin, Super Admin |
| FR-ARS-02 | Edit periode | Ubah konfigurasi periode (hanya jika belum aktif) | Admin, Super Admin |
| FR-ARS-03 | Input pembayaran iuran | Catat pembayaran iuran anggota | Admin, Super Admin |
| FR-ARS-04 | Pengundian otomatis | Random draw dengan validasi aturan bisnis | Admin, Super Admin |
| FR-ARS-05 | Histori pembayaran | Riwayat iuran per anggota | Semua Role |
| FR-ARS-06 | Laporan pemenang | Daftar pemenang dan yang belum menang | Semua Role |
| FR-ARS-07 | Status lunas/menunggak | Indikator status pembayaran iuran | Semua Role |
| FR-ARS-08 | Tutup periode | Menutup periode yang telah selesai | Super Admin |

### 3.4 Modul Tabungan

| ID | Fitur | Deskripsi | Role |
|---|---|---|---|
| FR-SAV-01 | Setting bunga tabungan | Atur persentase & periode bunga | Admin, Super Admin |
| FR-SAV-02 | Input setoran | Catat setoran tabungan anggota | Admin, Super Admin |
| FR-SAV-03 | Input penarikan | Catat penarikan tabungan | Admin, Super Admin |
| FR-SAV-04 | Hitung bunga otomatis | Kalkulasi bunga sesuai periode setting | Sistem |
| FR-SAV-05 | Lihat saldo sendiri | Anggota lihat saldo tabungannya | Anggota |
| FR-SAV-06 | Mutasi rekening | Histori seluruh transaksi tabungan | Semua Role |
| FR-SAV-07 | Rekap seluruh anggota | Laporan tabungan semua anggota | Admin, Super Admin |
| FR-SAV-08 | Nomor transaksi unik | Auto-generate format `SAV-YYYYMMDD-XXXX` | Sistem |

### 3.5 Modul Kredit

| ID | Fitur | Deskripsi | Role |
|---|---|---|---|
| FR-LN-01 | Setting bunga kredit | Atur persentase & metode bunga (flat/efektif) | Admin, Super Admin |
| FR-LN-02 | Pengajuan kredit | Input pengajuan kredit baru | Admin (atas nama anggota) |
| FR-LN-03 | Approval kredit | Approve/tolak pengajuan kredit | Admin, Super Admin |
| FR-LN-04 | Generate jadwal angsuran | Kalkulasi otomatis jadwal bayar | Sistem |
| FR-LN-05 | Input pembayaran angsuran | Catat pembayaran angsuran | Admin, Super Admin |
| FR-LN-06 | Hitung denda | Kalkulasi denda keterlambatan otomatis | Sistem |
| FR-LN-07 | Lihat kredit sendiri | Anggota lihat status kredit & angsurannya | Anggota |
| FR-LN-08 | Laporan kredit | Kredit aktif, lunas, tunggakan | Admin, Super Admin |
| FR-LN-09 | Pelunasan awal | Proses pelunasan sebelum jatuh tempo | Admin, Super Admin |

### 3.6 Modul Jadwal Kegiatan

| ID | Fitur | Deskripsi | Role |
|---|---|---|---|
| FR-EVT-01 | Tambah kegiatan | Input jadwal kegiatan kelompok | Admin, Super Admin |
| FR-EVT-02 | Edit kegiatan | Ubah detail kegiatan | Admin, Super Admin |
| FR-EVT-03 | Hapus kegiatan | Hapus kegiatan yang dibatalkan | Admin, Super Admin |
| FR-EVT-04 | Lihat jadwal | Tampilkan kalender/daftar kegiatan | Semua Role |
| FR-EVT-05 | Notifikasi kegiatan | Reminder H-1 kegiatan | Sistem |

### 3.7 Modul Laporan

| ID | Fitur | Deskripsi | Role |
|---|---|---|---|
| FR-RPT-01 | Laporan arisan | Rekap iuran, pemenang, dana terkumpul | Semua Role |
| FR-RPT-02 | Laporan tabungan | Saldo, mutasi, rekap seluruh anggota | Admin, Super Admin |
| FR-RPT-03 | Laporan kredit | Kredit aktif/lunas/tunggakan | Admin, Super Admin |
| FR-RPT-04 | Export PDF | Export semua laporan ke PDF | Admin, Super Admin |
| FR-RPT-05 | Export Excel | Export semua laporan ke Excel | Admin, Super Admin |

### 3.8 Modul Audit Trail

| ID | Fitur | Deskripsi |
|---|---|---|
| FR-AUD-01 | Log aktivitas | Catat seluruh CRUD operation |
| FR-AUD-02 | Simpan data lama & baru | Before/after setiap perubahan |
| FR-AUD-03 | Tampilkan log | Filter log berdasarkan user, waktu, modul |
| FR-AUD-04 | Export log | Export activity log ke CSV |

---

## 4. NON-FUNCTIONAL REQUIREMENT

### 4.1 Performance

| ID | Requirement | Target |
|---|---|---|
| NFR-PERF-01 | Response time halaman | < 2 detik (First Contentful Paint) |
| NFR-PERF-02 | API response time | < 500ms untuk operasi standar |
| NFR-PERF-03 | Concurrent users | Support minimal 50 concurrent users |
| NFR-PERF-04 | Database query | Optimized dengan indexing yang tepat |

### 4.2 Security

| ID | Requirement |
|---|---|
| NFR-SEC-01 | HTTPS wajib di seluruh endpoint |
| NFR-SEC-02 | Password di-hash menggunakan bcrypt (salt rounds ≥ 12) |
| NFR-SEC-03 | JWT token dengan expiry time konfigurabel |
| NFR-SEC-04 | CSRF protection pada semua form |
| NFR-SEC-05 | Rate limiting pada endpoint autentikasi |
| NFR-SEC-06 | Input sanitization & validation di server side |
| NFR-SEC-07 | SQL injection prevention via Prisma ORM |
| NFR-SEC-08 | Environment variable untuk data sensitif |
| NFR-SEC-09 | Super Admin credential tidak tersimpan di database |

### 4.3 Usability

| ID | Requirement |
|---|---|
| NFR-UX-01 | Responsive design: mobile (320px), tablet (768px), desktop (1280px) |
| NFR-UX-02 | Dark mode support |
| NFR-UX-03 | Loading state & skeleton screen pada setiap fetch data |
| NFR-UX-04 | Error handling yang informatif (toast notification) |
| NFR-UX-05 | Konfirmasi dialog untuk operasi destruktif |
| NFR-UX-06 | Breadcrumb navigasi yang jelas |

### 4.4 Reliability

| ID | Requirement |
|---|---|
| NFR-REL-01 | Uptime target 99.5% (Vercel SLA) |
| NFR-REL-02 | Database backup otomatis harian (NeonDB) |
| NFR-REL-03 | Graceful error handling tanpa crash aplikasi |
| NFR-REL-04 | Database connection pooling untuk serverless |

### 4.5 Scalability

| ID | Requirement |
|---|---|
| NFR-SCA-01 | Stateless architecture (serverless-ready) |
| NFR-SCA-02 | Database connection pooling (PgBouncer via Neon) |
| NFR-SCA-03 | SSR + ISR untuk performa optimal |

---

## 5. USER STORIES

### 5.1 Super Admin

```
US-SA-01: Sebagai Super Admin, saya ingin login dengan kredensial dari ENV variable
           agar keamanan akun tertinggi terjaga tanpa tersimpan di database.

US-SA-02: Sebagai Super Admin, saya ingin mempromosikan anggota menjadi Admin
           agar beban administrasi dapat didistribusikan.

US-SA-03: Sebagai Super Admin, saya ingin mengatur parameter bunga tabungan dan kredit
           agar dapat menyesuaikan dengan kebijakan kelompok.

US-SA-04: Sebagai Super Admin, saya ingin melihat activity log seluruh pengguna
           agar dapat mengaudit setiap aktivitas dalam sistem.

US-SA-05: Sebagai Super Admin, saya ingin menutup dan mengarsipkan periode arisan
           agar data historis tetap tersimpan dengan baik.
```

### 5.2 Admin

```
US-ADM-01: Sebagai Admin, saya ingin menambahkan anggota baru dengan data lengkap
            agar keanggotaan tercatat secara resmi dalam sistem.

US-ADM-02: Sebagai Admin, saya ingin mencatat pembayaran iuran arisan anggota
            agar status lunas/menunggak selalu terupdate secara real-time.

US-ADM-03: Sebagai Admin, saya ingin melakukan pengundian arisan secara otomatis
            agar proses undian adil dan tidak bisa dimanipulasi.

US-ADM-04: Sebagai Admin, saya ingin meng-approve atau menolak pengajuan kredit
            agar hanya kredit yang layak yang disetujui.

US-ADM-05: Sebagai Admin, saya ingin mencatat pembayaran angsuran kredit
            agar sisa hutang anggota selalu akurat.

US-ADM-06: Sebagai Admin, saya ingin mengekspor laporan ke PDF dan Excel
            agar dapat dibagikan dalam pertemuan kelompok.

US-ADM-07: Sebagai Admin, saya ingin menambahkan jadwal kegiatan
            agar seluruh anggota mengetahui agenda kelompok.
```

### 5.3 Anggota

```
US-MBR-01: Sebagai Anggota, saya ingin melihat saldo tabungan saya secara real-time
            agar saya dapat merencanakan keuangan pribadi.

US-MBR-02: Sebagai Anggota, saya ingin melihat riwayat setoran dan penarikan tabungan
            agar saya dapat memverifikasi setiap transaksi.

US-MBR-03: Sebagai Anggota, saya ingin melihat status arisan saya (sudah/belum menang)
            agar saya tahu giliran yang masih tersisa.

US-MBR-04: Sebagai Anggota, saya ingin melihat jadwal angsuran kredit saya
            agar tidak terlewat pembayaran dan terkena denda.

US-MBR-05: Sebagai Anggota, saya ingin melihat jadwal kegiatan kelompok
            agar saya dapat mempersiapkan diri untuk hadir.

US-MBR-06: Sebagai Anggota, saya ingin melihat daftar anggota yang sudah dan belum
            menang arisan agar proses undian terasa transparan.
```

---

## 6. USE CASE DIAGRAM

```
+------------------------------------------------------------------+
|              SISTEM ARISAN KELUARGA                              |
|                                                                  |
|  [Super Admin] -----> (Manage System Settings)                   |
|       |               (Manage User Roles)                        |
|       |               (View All Reports)                         |
|       |               (View Activity Logs)                       |
|       |               (Close Arisan Period)                      |
|       |                                                          |
|       +-----> (All Admin Use Cases)                              |
|                                                                  |
|  [Admin] -----------> (Manage Members)                           |
|       |               (Setup Arisan Period)                      |
|       |               (Record Iuran Payment)                     |
|       |               (Run Arisan Draw)                          |
|       |               (Manage Savings Transactions)              |
|       |               (Approve/Reject Loans)                     |
|       |               (Record Installment Payment)               |
|       |               (Manage Events)                            |
|       |               (Export Reports)                           |
|       |                                                          |
|  [Anggota] ---------> (View Own Profile)                         |
|                        (View Own Savings Balance)                |
|                        (View Own Savings History)                |
|                        (View Own Loan Status)                    |
|                        (View Arisan Status)                      |
|                        (View Winner List)                        |
|                        (View Events Schedule)                    |
+------------------------------------------------------------------+
```

---

## 7. ACTIVITY DIAGRAM

### 7.1 Alur Pengundian Arisan

```
[Admin memilih menu Undian]
        |
        v
[Sistem memeriksa periode arisan aktif]
        |
   [Aktif?] --No--> [Tampilkan error: Tidak ada periode aktif]
        |
       Yes
        |
        v
[Sistem mengambil daftar anggota aktif yang belum menang]
        |
   [Ada kandidat?] --No--> [Tampilkan pesan: Semua anggota sudah menang]
        |
       Yes
        |
        v
[Admin memilih jumlah pemenang]
        |
        v
[Sistem menjalankan random draw]
        |
        v
[Sistem menyimpan hasil undian ke database]
        |
        v
[Sistem menandai pemenang: "sudah menang" di periode ini]
        |
        v
[Tampilkan hasil undian kepada Admin]
        |
        v
[Admin konfirmasi hasil]
        |
        v
[Selesai]
```

### 7.2 Alur Pengajuan dan Approval Kredit

```
[Admin input pengajuan kredit atas nama anggota]
        |
        v
[Sistem validasi: anggota aktif? kredit existing?]
        |
   [Valid?] --No--> [Tampilkan error validasi]
        |
       Yes
        |
        v
[Sistem simpan pengajuan dengan status: DRAFT]
        |
        v
[Admin submit untuk persetujuan → status: MENUNGGU_PERSETUJUAN]
        |
        v
[Admin/Super Admin review pengajuan]
        |
   [Keputusan?]
        |
   +----+----+
   |         |
  TOLAK    SETUJU
   |         |
   v         v
[Status:  [Status: DISETUJUI]
 DITOLAK]      |
               v
        [Sistem generate jadwal angsuran]
               |
               v
        [Dana dicairkan — Admin catat]
               |
               v
        [Anggota mulai bayar angsuran]
               |
               v
        [Saat semua angsuran lunas → status: LUNAS]
```

### 7.3 Alur Setoran Tabungan

```
[Admin input setoran tabungan]
        |
        v
[Sistem validasi data (nominal > 0, anggota aktif)]
        |
        v
[Sistem generate nomor transaksi unik]
        |
        v
[Sistem simpan transaksi]
        |
        v
[Sistem update saldo tabungan anggota]
        |
        v
[Sistem catat ke activity log]
        |
        v
[Tampilkan konfirmasi transaksi berhasil]
```

---

## 8. ERD DIAGRAM

```
users (1) ─────────────── (1) members
  |                              |
  |                     (many)   |   (many)
  |              arisan_members ─┘   savings
  |                    |              |
  |              (many)|              | (many)
  |          arisan_periods      savings_transactions
  |                    |              |
  |              arisan_draws    savings_interest
  |                    |
  |              arisan_winners
  |                    |
  |              arisan_payments
  |
members ─────────────── loans (many)
  |                        |
  |                  loan_installments (many)
  |
members ─────── events (via PIC)

activity_logs ── users (many-to-1)

savings_interest_settings (standalone, global)
loan_interest_settings (standalone, global)
roles (standalone, linked to users)
```

---

## 9. DATABASE DESIGN

### 9.1 Tabel: `users`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | Primary key |
| email | VARCHAR(255) UNIQUE | Email login |
| password | VARCHAR(255) | Hashed password (bcrypt) |
| role | ENUM | SUPER_ADMIN, ADMIN, ANGGOTA |
| is_active | BOOLEAN | Status aktif akun |
| created_at | TIMESTAMP | Waktu dibuat |
| updated_at | TIMESTAMP | Waktu diupdate |

### 9.2 Tabel: `members`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | Primary key |
| user_id | UUID (FK → users) | Relasi ke user |
| nomor_anggota | VARCHAR(20) UNIQUE | Auto-gen: MBR-YYYYMM-XXXX |
| nama_lengkap | VARCHAR(255) | Nama lengkap |
| nik | VARCHAR(16) UNIQUE | Nomor KTP |
| tempat_lahir | VARCHAR(100) | Tempat lahir |
| tanggal_lahir | DATE | Tanggal lahir |
| alamat | TEXT | Alamat lengkap |
| nomor_hp | VARCHAR(20) | Nomor handphone |
| tanggal_bergabung | DATE | Tanggal bergabung |
| status | ENUM | AKTIF, NONAKTIF |
| foto_url | VARCHAR(500) | URL foto profil |
| created_at | TIMESTAMP | Waktu dibuat |
| updated_at | TIMESTAMP | Waktu diupdate |

### 9.3 Tabel: `arisan_periods`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | Primary key |
| nama_periode | VARCHAR(100) | Nama periode arisan |
| tanggal_mulai | DATE | Tanggal mulai |
| tanggal_selesai | DATE | Tanggal selesai |
| besar_iuran | DECIMAL(15,2) | Nominal iuran/bulan |
| max_pemenang_per_bulan | INTEGER | Maksimal pemenang |
| status | ENUM | DRAFT, AKTIF, SELESAI |
| created_by | UUID (FK → users) | Dibuat oleh |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### 9.4 Tabel: `arisan_members`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | Primary key |
| period_id | UUID (FK → arisan_periods) | Relasi periode |
| member_id | UUID (FK → members) | Relasi anggota |
| sudah_menang | BOOLEAN | Status menang |
| tanggal_menang | DATE | Tanggal menang (nullable) |
| created_at | TIMESTAMP | |

### 9.5 Tabel: `arisan_payments`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | Primary key |
| period_id | UUID (FK → arisan_periods) | Relasi periode |
| member_id | UUID (FK → members) | Relasi anggota |
| bulan | VARCHAR(7) | Format: YYYY-MM |
| nominal | DECIMAL(15,2) | Nominal pembayaran |
| tanggal_bayar | DATE | Tanggal pembayaran |
| status | ENUM | LUNAS, MENUNGGAK |
| created_by | UUID (FK → users) | |
| created_at | TIMESTAMP | |

### 9.6 Tabel: `arisan_draws`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | Primary key |
| period_id | UUID (FK → arisan_periods) | Relasi periode |
| bulan_undian | VARCHAR(7) | Bulan undian |
| tanggal_undian | DATE | Tanggal pelaksanaan |
| jumlah_pemenang | INTEGER | Jumlah pemenang |
| created_by | UUID (FK → users) | |
| created_at | TIMESTAMP | |

### 9.7 Tabel: `arisan_winners`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | Primary key |
| draw_id | UUID (FK → arisan_draws) | Relasi undian |
| member_id | UUID (FK → members) | Pemenang |
| nominal_hak | DECIMAL(15,2) | Nominal arisan yang diterima |
| created_at | TIMESTAMP | |

### 9.8 Tabel: `savings_interest_settings`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | Primary key |
| persentase | DECIMAL(5,2) | % bunga per tahun |
| periode | ENUM | BULANAN, TAHUNAN |
| berlaku_mulai | DATE | Tanggal mulai berlaku |
| is_active | BOOLEAN | Setting aktif |
| created_by | UUID (FK → users) | |
| created_at | TIMESTAMP | |

### 9.9 Tabel: `savings`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | Primary key |
| member_id | UUID (FK → members) | Relasi anggota |
| saldo | DECIMAL(15,2) DEFAULT 0 | Saldo tabungan |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### 9.10 Tabel: `savings_transactions`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | Primary key |
| nomor_transaksi | VARCHAR(30) UNIQUE | Auto-gen: SAV-YYYYMMDD-XXXX |
| saving_id | UUID (FK → savings) | Relasi rekening tabungan |
| member_id | UUID (FK → members) | Relasi anggota |
| jenis | ENUM | SETORAN, PENARIKAN, BUNGA |
| nominal | DECIMAL(15,2) | Nominal transaksi |
| keterangan | TEXT | Keterangan |
| tanggal | DATE | Tanggal transaksi |
| created_by | UUID (FK → users) | |
| created_at | TIMESTAMP | |

### 9.11 Tabel: `savings_interest`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | Primary key |
| saving_id | UUID (FK → savings) | Relasi rekening |
| setting_id | UUID (FK → savings_interest_settings) | Setting yang dipakai |
| nominal_bunga | DECIMAL(15,2) | Nominal bunga |
| periode | VARCHAR(7) | YYYY-MM |
| created_at | TIMESTAMP | |

### 9.12 Tabel: `loan_interest_settings`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | Primary key |
| persentase | DECIMAL(5,2) | % bunga |
| metode | ENUM | FLAT, EFEKTIF |
| berlaku_mulai | DATE | Tanggal berlaku |
| is_active | BOOLEAN | |
| denda_per_hari | DECIMAL(5,2) | % denda per hari keterlambatan |
| created_by | UUID (FK → users) | |
| created_at | TIMESTAMP | |

### 9.13 Tabel: `loans`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | Primary key |
| nomor_pengajuan | VARCHAR(30) UNIQUE | Auto-gen: LN-YYYYMMDD-XXXX |
| member_id | UUID (FK → members) | Relasi anggota |
| nominal_pinjaman | DECIMAL(15,2) | Nominal pinjaman |
| tenor | INTEGER | Tenor dalam bulan |
| tujuan_pinjaman | TEXT | Tujuan pinjaman |
| interest_setting_id | UUID (FK → loan_interest_settings) | Setting bunga |
| status | ENUM | DRAFT, MENUNGGU_PERSETUJUAN, DISETUJUI, DITOLAK, LUNAS |
| tanggal_pengajuan | DATE | |
| tanggal_disetujui | DATE | Nullable |
| tanggal_lunas | DATE | Nullable |
| catatan_approval | TEXT | Nullable |
| approved_by | UUID (FK → users) | Nullable |
| created_by | UUID (FK → users) | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### 9.14 Tabel: `loan_installments`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | Primary key |
| loan_id | UUID (FK → loans) | Relasi kredit |
| ke | INTEGER | Angsuran ke-N |
| tanggal_jatuh_tempo | DATE | Tanggal jatuh tempo |
| tanggal_bayar | DATE | Tanggal realisasi bayar |
| nominal_pokok | DECIMAL(15,2) | Cicilan pokok |
| nominal_bunga | DECIMAL(15,2) | Cicilan bunga |
| denda | DECIMAL(15,2) DEFAULT 0 | Denda keterlambatan |
| status | ENUM | BELUM_BAYAR, LUNAS, TERLAMBAT |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### 9.15 Tabel: `events`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | Primary key |
| nama_kegiatan | VARCHAR(255) | Nama kegiatan |
| tanggal | DATE | Tanggal pelaksanaan |
| lokasi | VARCHAR(500) | Lokasi kegiatan |
| deskripsi | TEXT | Deskripsi kegiatan |
| pic | VARCHAR(255) | Person In Charge |
| created_by | UUID (FK → users) | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### 9.16 Tabel: `activity_logs`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | Primary key |
| user_id | UUID (FK → users) | User yang melakukan aksi |
| module | VARCHAR(50) | Modul: members, savings, loans, dst |
| action | VARCHAR(50) | CREATE, UPDATE, DELETE, LOGIN, dst |
| entity_id | UUID | ID record yang diubah |
| data_lama | JSONB | Data sebelum perubahan |
| data_baru | JSONB | Data sesudah perubahan |
| ip_address | VARCHAR(45) | IP address user |
| user_agent | TEXT | Browser/device info |
| created_at | TIMESTAMP | |

---

## 10. PRISMA SCHEMA DESIGN

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ==================== ENUMS ====================

enum Role {
  SUPER_ADMIN
  ADMIN
  ANGGOTA
}

enum MemberStatus {
  AKTIF
  NONAKTIF
}

enum ArisanPeriodStatus {
  DRAFT
  AKTIF
  SELESAI
}

enum PaymentStatus {
  LUNAS
  MENUNGGAK
}

enum SavingTransactionType {
  SETORAN
  PENARIKAN
  BUNGA
}

enum InterestPeriode {
  BULANAN
  TAHUNAN
}

enum LoanInterestMethod {
  FLAT
  EFEKTIF
}

enum LoanStatus {
  DRAFT
  MENUNGGU_PERSETUJUAN
  DISETUJUI
  DITOLAK
  LUNAS
}

enum InstallmentStatus {
  BELUM_BAYAR
  LUNAS
  TERLAMBAT
}

// ==================== MODELS ====================

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      Role     @default(ANGGOTA)
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  member             Member?
  createdArisans     ArisanPeriod[]
  createdPayments    ArisanPayment[]
  createdDraws       ArisanDraw[]
  createdSavingTrx   SavingsTransaction[]
  createdLoans       Loan[]               @relation("LoanCreatedBy")
  approvedLoans      Loan[]               @relation("LoanApprovedBy")
  savingSettings     SavingsInterestSetting[]
  loanSettings       LoanInterestSetting[]
  events             Event[]
  activityLogs       ActivityLog[]

  @@map("users")
}

model Member {
  id               String       @id @default(uuid())
  userId           String       @unique @map("user_id")
  nomorAnggota     String       @unique @map("nomor_anggota")
  namaLengkap      String       @map("nama_lengkap")
  nik              String       @unique
  tempatLahir      String       @map("tempat_lahir")
  tanggalLahir     DateTime     @map("tanggal_lahir") @db.Date
  alamat           String
  nomorHp          String       @map("nomor_hp")
  tanggalBergabung DateTime     @map("tanggal_bergabung") @db.Date
  status           MemberStatus @default(AKTIF)
  fotoUrl          String?      @map("foto_url")
  createdAt        DateTime     @default(now()) @map("created_at")
  updatedAt        DateTime     @updatedAt @map("updated_at")

  user             User               @relation(fields: [userId], references: [id])
  arisanMembers    ArisanMember[]
  arisanPayments   ArisanPayment[]
  arisanWinners    ArisanWinner[]
  saving           Saving?
  loans            Loan[]

  @@map("members")
}

model ArisanPeriod {
  id                    String             @id @default(uuid())
  namaPeriode           String             @map("nama_periode")
  tanggalMulai          DateTime           @map("tanggal_mulai") @db.Date
  tanggalSelesai        DateTime           @map("tanggal_selesai") @db.Date
  besarIuran            Decimal            @map("besar_iuran") @db.Decimal(15, 2)
  maxPemenangPerBulan   Int                @map("max_pemenang_per_bulan")
  status                ArisanPeriodStatus @default(DRAFT)
  createdBy             String             @map("created_by")
  createdAt             DateTime           @default(now()) @map("created_at")
  updatedAt             DateTime           @updatedAt @map("updated_at")

  creator        User            @relation(fields: [createdBy], references: [id])
  arisanMembers  ArisanMember[]
  arisanPayments ArisanPayment[]
  arisanDraws    ArisanDraw[]

  @@map("arisan_periods")
}

model ArisanMember {
  id            String       @id @default(uuid())
  periodId      String       @map("period_id")
  memberId      String       @map("member_id")
  sudahMenang   Boolean      @default(false) @map("sudah_menang")
  tanggalMenang DateTime?    @map("tanggal_menang") @db.Date
  createdAt     DateTime     @default(now()) @map("created_at")

  period ArisanPeriod @relation(fields: [periodId], references: [id])
  member Member       @relation(fields: [memberId], references: [id])

  @@unique([periodId, memberId])
  @@map("arisan_members")
}

model ArisanPayment {
  id          String        @id @default(uuid())
  periodId    String        @map("period_id")
  memberId    String        @map("member_id")
  bulan       String        // Format: YYYY-MM
  nominal     Decimal       @db.Decimal(15, 2)
  tanggalBayar DateTime     @map("tanggal_bayar") @db.Date
  status      PaymentStatus @default(LUNAS)
  createdBy   String        @map("created_by")
  createdAt   DateTime      @default(now()) @map("created_at")

  period  ArisanPeriod @relation(fields: [periodId], references: [id])
  member  Member       @relation(fields: [memberId], references: [id])
  creator User         @relation(fields: [createdBy], references: [id])

  @@map("arisan_payments")
}

model ArisanDraw {
  id              String   @id @default(uuid())
  periodId        String   @map("period_id")
  bulanUndian     String   @map("bulan_undian") // Format: YYYY-MM
  tanggalUndian   DateTime @map("tanggal_undian") @db.Date
  jumlahPemenang  Int      @map("jumlah_pemenang")
  createdBy       String   @map("created_by")
  createdAt       DateTime @default(now()) @map("created_at")

  period   ArisanPeriod   @relation(fields: [periodId], references: [id])
  creator  User           @relation(fields: [createdBy], references: [id])
  winners  ArisanWinner[]

  @@map("arisan_draws")
}

model ArisanWinner {
  id          String   @id @default(uuid())
  drawId      String   @map("draw_id")
  memberId    String   @map("member_id")
  nominalHak  Decimal  @map("nominal_hak") @db.Decimal(15, 2)
  createdAt   DateTime @default(now()) @map("created_at")

  draw   ArisanDraw @relation(fields: [drawId], references: [id])
  member Member     @relation(fields: [memberId], references: [id])

  @@map("arisan_winners")
}

model SavingsInterestSetting {
  id           String          @id @default(uuid())
  persentase   Decimal         @db.Decimal(5, 2)
  periode      InterestPeriode @default(TAHUNAN)
  berlakuMulai DateTime        @map("berlaku_mulai") @db.Date
  isActive     Boolean         @default(true) @map("is_active")
  createdBy    String          @map("created_by")
  createdAt    DateTime        @default(now()) @map("created_at")

  creator        User            @relation(fields: [createdBy], references: [id])
  savingsInterest SavingsInterest[]

  @@map("savings_interest_settings")
}

model Saving {
  id        String   @id @default(uuid())
  memberId  String   @unique @map("member_id")
  saldo     Decimal  @default(0) @db.Decimal(15, 2)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  member       Member               @relation(fields: [memberId], references: [id])
  transactions SavingsTransaction[]
  interests    SavingsInterest[]

  @@map("savings")
}

model SavingsTransaction {
  id              String                @id @default(uuid())
  nomorTransaksi  String                @unique @map("nomor_transaksi")
  savingId        String                @map("saving_id")
  memberId        String                @map("member_id")
  jenis           SavingTransactionType
  nominal         Decimal               @db.Decimal(15, 2)
  keterangan      String?
  tanggal         DateTime              @db.Date
  createdBy       String                @map("created_by")
  createdAt       DateTime              @default(now()) @map("created_at")

  saving  Saving @relation(fields: [savingId], references: [id])
  creator User   @relation(fields: [createdBy], references: [id])

  @@map("savings_transactions")
}

model SavingsInterest {
  id           String   @id @default(uuid())
  savingId     String   @map("saving_id")
  settingId    String   @map("setting_id")
  nominalBunga Decimal  @map("nominal_bunga") @db.Decimal(15, 2)
  periode      String   // Format: YYYY-MM
  createdAt    DateTime @default(now()) @map("created_at")

  saving  Saving                 @relation(fields: [savingId], references: [id])
  setting SavingsInterestSetting @relation(fields: [settingId], references: [id])

  @@map("savings_interest")
}

model LoanInterestSetting {
  id           String             @id @default(uuid())
  persentase   Decimal            @db.Decimal(5, 2)
  metode       LoanInterestMethod @default(FLAT)
  berlakuMulai DateTime           @map("berlaku_mulai") @db.Date
  isActive     Boolean            @default(true) @map("is_active")
  dendaPerHari Decimal            @map("denda_per_hari") @db.Decimal(5, 2)
  createdBy    String             @map("created_by")
  createdAt    DateTime           @default(now()) @map("created_at")

  creator User   @relation(fields: [createdBy], references: [id])
  loans   Loan[]

  @@map("loan_interest_settings")
}

model Loan {
  id                  String     @id @default(uuid())
  nomorPengajuan      String     @unique @map("nomor_pengajuan")
  memberId            String     @map("member_id")
  nominalPinjaman     Decimal    @map("nominal_pinjaman") @db.Decimal(15, 2)
  tenor               Int
  tujuanPinjaman      String     @map("tujuan_pinjaman")
  interestSettingId   String     @map("interest_setting_id")
  status              LoanStatus @default(DRAFT)
  tanggalPengajuan    DateTime   @map("tanggal_pengajuan") @db.Date
  tanggalDisetujui    DateTime?  @map("tanggal_disetujui") @db.Date
  tanggalLunas        DateTime?  @map("tanggal_lunas") @db.Date
  catatanApproval     String?    @map("catatan_approval")
  approvedBy          String?    @map("approved_by")
  createdBy           String     @map("created_by")
  createdAt           DateTime   @default(now()) @map("created_at")
  updatedAt           DateTime   @updatedAt @map("updated_at")

  member          Member              @relation(fields: [memberId], references: [id])
  interestSetting LoanInterestSetting @relation(fields: [interestSettingId], references: [id])
  approver        User?               @relation("LoanApprovedBy", fields: [approvedBy], references: [id])
  creator         User                @relation("LoanCreatedBy", fields: [createdBy], references: [id])
  installments    LoanInstallment[]

  @@map("loans")
}

model LoanInstallment {
  id                String            @id @default(uuid())
  loanId            String            @map("loan_id")
  ke                Int
  tanggalJatuhTempo DateTime          @map("tanggal_jatuh_tempo") @db.Date
  tanggalBayar      DateTime?         @map("tanggal_bayar") @db.Date
  nominalPokok      Decimal           @map("nominal_pokok") @db.Decimal(15, 2)
  nominalBunga      Decimal           @map("nominal_bunga") @db.Decimal(15, 2)
  denda             Decimal           @default(0) @db.Decimal(15, 2)
  status            InstallmentStatus @default(BELUM_BAYAR)
  createdAt         DateTime          @default(now()) @map("created_at")
  updatedAt         DateTime          @updatedAt @map("updated_at")

  loan Loan @relation(fields: [loanId], references: [id])

  @@map("loan_installments")
}

model Event {
  id           String   @id @default(uuid())
  namaKegiatan String   @map("nama_kegiatan")
  tanggal      DateTime @db.Date
  lokasi       String
  deskripsi    String?
  pic          String
  createdBy    String   @map("created_by")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  creator User @relation(fields: [createdBy], references: [id])

  @@map("events")
}

model ActivityLog {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  module    String
  action    String
  entityId  String?  @map("entity_id")
  dataLama  Json?    @map("data_lama")
  dataBaru  Json?    @map("data_baru")
  ipAddress String?  @map("ip_address")
  userAgent String?  @map("user_agent")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@map("activity_logs")
}
```

---

## 11. API SPECIFICATION

### 11.1 Konvensi API

```
Base URL      : /api/v1
Format        : JSON
Auth Header   : Cookie (NextAuth session) atau Bearer JWT
Error Format  : { "success": false, "message": "...", "errors": {} }
Success Format: { "success": true, "data": {}, "meta": {} }
```

### 11.2 Auth Endpoints

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| POST | `/api/auth/signin` | Login | Public |
| POST | `/api/auth/signout` | Logout | Authenticated |
| GET | `/api/auth/session` | Get session | Authenticated |

### 11.3 Members Endpoints

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/api/v1/members` | List semua anggota | Admin, Super Admin |
| POST | `/api/v1/members` | Tambah anggota baru | Admin, Super Admin |
| GET | `/api/v1/members/:id` | Detail anggota | Admin, Super Admin |
| PUT | `/api/v1/members/:id` | Edit anggota | Admin, Super Admin |
| PATCH | `/api/v1/members/:id/status` | Toggle status aktif | Admin, Super Admin |
| GET | `/api/v1/members/me` | Profil sendiri | Anggota |
| POST | `/api/v1/members/:id/promote` | Promosi ke Admin | Super Admin |

### 11.4 Arisan Endpoints

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/api/v1/arisan/periods` | List periode | All |
| POST | `/api/v1/arisan/periods` | Buat periode baru | Admin+ |
| PUT | `/api/v1/arisan/periods/:id` | Edit periode | Admin+ |
| POST | `/api/v1/arisan/periods/:id/activate` | Aktifkan periode | Admin+ |
| POST | `/api/v1/arisan/payments` | Input pembayaran iuran | Admin+ |
| GET | `/api/v1/arisan/payments/:periodId` | List pembayaran | All |
| POST | `/api/v1/arisan/draws` | Lakukan undian | Admin+ |
| GET | `/api/v1/arisan/winners` | List pemenang | All |
| GET | `/api/v1/arisan/status/:memberId` | Status arisan anggota | All |

### 11.5 Savings Endpoints

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/api/v1/savings` | List semua tabungan | Admin+ |
| GET | `/api/v1/savings/me` | Tabungan sendiri | Anggota |
| GET | `/api/v1/savings/:memberId` | Tabungan anggota tertentu | Admin+ |
| POST | `/api/v1/savings/transactions` | Input transaksi | Admin+ |
| GET | `/api/v1/savings/transactions/:memberId` | Histori transaksi | Admin+ / Anggota (own) |
| POST | `/api/v1/savings/interest/calculate` | Hitung bunga | Admin+ |
| GET | `/api/v1/savings/settings` | List setting bunga | Admin+ |
| POST | `/api/v1/savings/settings` | Buat setting baru | Admin+ |

### 11.6 Loans Endpoints

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/api/v1/loans` | List semua kredit | Admin+ |
| POST | `/api/v1/loans` | Pengajuan kredit | Admin+ |
| GET | `/api/v1/loans/me` | Kredit sendiri | Anggota |
| GET | `/api/v1/loans/:id` | Detail kredit | Admin+ / Anggota (own) |
| PATCH | `/api/v1/loans/:id/approve` | Approve kredit | Admin+ |
| PATCH | `/api/v1/loans/:id/reject` | Tolak kredit | Admin+ |
| POST | `/api/v1/loans/installments/pay` | Bayar angsuran | Admin+ |
| GET | `/api/v1/loans/settings` | List setting bunga kredit | Admin+ |
| POST | `/api/v1/loans/settings` | Buat setting baru | Admin+ |

### 11.7 Events Endpoints

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/api/v1/events` | List kegiatan | All |
| POST | `/api/v1/events` | Tambah kegiatan | Admin+ |
| PUT | `/api/v1/events/:id` | Edit kegiatan | Admin+ |
| DELETE | `/api/v1/events/:id` | Hapus kegiatan | Admin+ |

### 11.8 Reports & Logs Endpoints

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/api/v1/reports/arisan` | Laporan arisan | All |
| GET | `/api/v1/reports/savings` | Laporan tabungan | Admin+ |
| GET | `/api/v1/reports/loans` | Laporan kredit | Admin+ |
| GET | `/api/v1/reports/export/pdf` | Export PDF | Admin+ |
| GET | `/api/v1/reports/export/excel` | Export Excel | Admin+ |
| GET | `/api/v1/logs` | Activity logs | Super Admin |

---

## 12. UI/UX FLOW

### 12.1 Alur Login

```
Landing Page (/) 
    → Login Page (/login) 
        → [Super Admin] → Dashboard SA (/dashboard)
        → [Admin] → Dashboard Admin (/dashboard)
        → [Anggota] → Dashboard Anggota (/dashboard)
```

### 12.2 Navigasi Sidebar — Admin

```
📊 Dashboard
👥 Anggota
   ├── Daftar Anggota
   └── Tambah Anggota
🎱 Arisan
   ├── Periode Arisan
   ├── Input Iuran
   ├── Pengundian
   └── Laporan Arisan
💰 Tabungan
   ├── Daftar Tabungan
   ├── Input Transaksi
   ├── Hitung Bunga
   └── Laporan Tabungan
🏦 Kredit
   ├── Daftar Kredit
   ├── Pengajuan Baru
   ├── Approval
   ├── Input Angsuran
   └── Laporan Kredit
📅 Jadwal Kegiatan
⚙️ Pengaturan
   ├── Bunga Tabungan
   └── Bunga Kredit
```

### 12.3 Navigasi Sidebar — Anggota

```
📊 Dashboard Saya
💰 Tabungan Saya
   ├── Saldo
   └── Riwayat Transaksi
🏦 Kredit Saya
   ├── Status Kredit
   └── Jadwal Angsuran
🎱 Arisan
   ├── Status Arisan Saya
   └── Daftar Pemenang
📅 Jadwal Kegiatan
```

### 12.4 Komponen UI Utama

- **DataTable** — Tabel responsif dengan sort, filter, pagination (Shadcn + TanStack Table)
- **Modal Dialog** — Untuk form create/edit (Shadcn Dialog)
- **Toast Notification** — Feedback aksi berhasil/gagal (Shadcn Sonner)
- **Confirmation Dialog** — Konfirmasi aksi destruktif
- **Badge Status** — Indikator status berwarna
- **Stats Card** — Widget angka untuk dashboard
- **Date Picker** — Pemilih tanggal yang intuitif
- **Loading Skeleton** — Placeholder saat fetch data

---

## 13. DASHBOARD DESIGN

### 13.1 Dashboard Super Admin

```
+------+------+------+------+
| 👥   | 💰   | 🏦   | ⚠️   |
| Total| Total| Total| Kredit|
|Anggota|Tabungan|Kredit|Macet|
| 48   | 85jt | 120jt| 3   |
+------+------+------+------+
| 🎱 Arisan  | 📅 Jadwal  |
| Berjalan   | Terdekat   |
| 2026-01    | 15 Jun 2026|
+------------+------------+
[Tabel Aktivitas Terkini]
[Grafik Arus Kas Bulanan]
```

### 13.2 Dashboard Admin

```
+------+------+------+------+
| 👥   | 💰   | 🏦   | 🎱   |
| Total| Total| Kredit| Arisan|
|Anggota|Tabungan|Aktif|Bulan Ini|
| 48   | 85jt | 15   | 2 org|
+------+------+------+------+
[Tabel Pembayaran Iuran Terbaru]
[Tabel Angsuran Jatuh Tempo Hari Ini]
```

### 13.3 Dashboard Anggota

```
+------+------+------+------+
| 💰   | 🏦   | 🎱   | 📅   |
| Saldo| Sisa | Status| Jadwal|
|Tabungan|Kredit|Arisan|Terdekat|
| 5.2jt| 3.4jt| Belum | 15Jun|
|      |      | Menang|      |
+------+------+------+------+
[Riwayat Transaksi Terbaru]
[Jadwal Angsuran Mendatang]
```

---

## 14. DEPLOYMENT GUIDE

### 14.1 Environment Variables

Buat file `.env.local` untuk development dan set di Vercel Dashboard untuk production:

```bash
# Database — NeonDB (Connection Pooling untuk serverless)
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/arisan?sslmode=require&pgbouncer=true&connect_timeout=10"

# Database — Direct Connection (untuk Prisma Migrate)
DIRECT_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/arisan?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="generate-dengan-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-domain.vercel.app"

# Super Admin (TIDAK tersimpan di database)
SUPER_ADMIN_EMAIL="superadmin@gmail.com"
SUPER_ADMIN_PASSWORD="password"

# App Config
NEXT_PUBLIC_APP_NAME="Sistem Arisan Keluarga"
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"

# Upload (jika pakai Vercel Blob atau Cloudinary)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

### 14.2 NeonDB Setup

1. Buat akun di [neon.tech](https://neon.tech)
2. Buat project baru
3. Buat database `arisan`
4. Aktifkan **Connection Pooling (PgBouncer)** pada project settings
5. Copy `Connection string` (pooled) → gunakan sebagai `DATABASE_URL`
6. Copy `Direct connection` → gunakan sebagai `DIRECT_URL`

> ⚠️ **PENTING:** `DATABASE_URL` harus menggunakan pooled connection string dari NeonDB. `DIRECT_URL` digunakan khusus untuk `prisma migrate` dan `prisma db push`.

### 14.3 Konfigurasi `package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

### 14.4 Prisma Client — Singleton Pattern (WAJIB di Serverless)

Buat file `src/lib/prisma.ts`:

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

> ✅ Pattern ini mencegah `Too many connections` di serverless environment.

### 14.5 Vercel Build Configuration

Di `vercel.json` (opsional, sebagian besar sudah di-handle otomatis):

```json
{
  "buildCommand": "prisma generate && next build",
  "framework": "nextjs"
}
```

Di **Vercel Dashboard → Project Settings → Build & Deployment**:
- Build Command: `prisma generate && npm run build`
- Install Command: `npm install`
- Output Directory: `.next`

### 14.6 Prisma Migration Workflow

```bash
# Development — buat migration baru
npx prisma migrate dev --name nama_migration

# Production — jalankan migration (dari CI atau manual di Vercel)
npx prisma migrate deploy

# Seed data awal
npx tsx prisma/seed.ts

# Reset database (development only)
npx prisma migrate reset
```

> ✅ Jalankan `prisma migrate deploy` sebagai bagian dari deployment script, BUKAN `prisma migrate dev`.

### 14.7 Solusi Error Umum

| Error | Penyebab | Solusi |
|---|---|---|
| `Prisma Client Initialization Error` | `prisma generate` tidak dijalankan | Tambahkan `postinstall: prisma generate` di package.json |
| `Prisma Client is unable to run in browser` | Import Prisma di client component | Pastikan semua query Prisma hanya di Server Actions atau Route Handlers |
| `Too many connections` | Tidak ada connection pooling | Gunakan pooled URL dari NeonDB & singleton pattern |
| `Failed to load Prisma Client` | Binary tidak ter-generate | Jalankan `prisma generate` sebelum build |
| `Build failed during Vercel deployment` | ENV variable tidak di-set | Set semua ENV di Vercel Dashboard sebelum deploy |
| `P1001: Can't reach database server` | URL salah atau koneksi timeout | Periksa DATABASE_URL, gunakan `?connect_timeout=10` |

### 14.8 Checklist Deployment Production

```
[ ] Set semua environment variables di Vercel Dashboard
[ ] DATABASE_URL menggunakan pooled connection (pgbouncer=true)
[ ] DIRECT_URL menggunakan direct connection
[ ] NEXTAUTH_SECRET diisi dengan random string (openssl rand -base64 32)
[ ] NEXTAUTH_URL diisi dengan domain production
[ ] Jalankan: npx prisma migrate deploy
[ ] Verifikasi build berhasil di Vercel
[ ] Test login Super Admin
[ ] Test seluruh flow CRUD
```

---

## 15. SECURITY DESIGN

### 15.1 Authentication Flow

```
User → Login Form
    → Server Action: validate credentials
    → [Super Admin] → cek ENV variable (tidak query DB)
    → [Admin/Anggota] → query DB, verify bcrypt hash
    → NextAuth.js create session (JWT)
    → Set HttpOnly cookie
    → Redirect ke dashboard
```

### 15.2 Authorization — Middleware

```typescript
// middleware.ts
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Redirect ke login jika belum auth
  if (!session && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Proteksi route berdasarkan role
  if (pathname.startsWith('/admin') && session?.user.role === 'ANGGOTA') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
```

### 15.3 Server-Side Role Checking

Setiap Server Action dan Route Handler harus memvalidasi role:

```typescript
// Helper: src/lib/auth-helpers.ts
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export async function requireAdmin() {
  const session = await auth()
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/dashboard')
  }
  return session
}

export async function requireSuperAdmin() {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }
  return session
}
```

### 15.4 Input Validation — Zod Schema Example

```typescript
// src/lib/validations/member.ts
import { z } from 'zod'

export const createMemberSchema = z.object({
  namaLengkap: z.string().min(3, 'Nama minimal 3 karakter').max(255),
  nik: z.string().length(16, 'NIK harus 16 digit').regex(/^\d+$/, 'NIK hanya angka'),
  email: z.string().email('Format email tidak valid'),
  nomorHp: z.string().min(10).max(15).regex(/^(\+62|08)\d+$/),
  tanggalLahir: z.string().pipe(z.coerce.date()),
  alamat: z.string().min(10, 'Alamat terlalu pendek'),
})
```

### 15.5 Audit Trail Implementation

```typescript
// src/lib/audit.ts
import { prisma } from './prisma'
import { headers } from 'next/headers'

export async function logActivity({
  userId, module, action, entityId, dataLama, dataBaru
}: AuditParams) {
  const headersList = await headers()
  await prisma.activityLog.create({
    data: {
      userId,
      module,
      action,
      entityId,
      dataLama,
      dataBaru,
      ipAddress: headersList.get('x-forwarded-for') ?? 'unknown',
      userAgent: headersList.get('user-agent') ?? 'unknown',
    }
  })
}
```

---

## 16. TESTING STRATEGY

### 16.1 Unit Testing

- **Framework:** Vitest + React Testing Library
- **Coverage Target:** Minimal 70% coverage
- **Prioritas:** Fungsi kalkulasi (bunga, angsuran, denda), validasi Zod schema

```bash
# Contoh test: kalkulasi angsuran kredit
describe('calculateInstallments', () => {
  it('should calculate flat rate correctly', () => {
    const result = calculateInstallments({
      principal: 10_000_000,
      interestRate: 12, // % per tahun
      tenor: 12,
      method: 'FLAT'
    })
    expect(result[0].nominalPokok).toBe(833_333)
    expect(result[0].nominalBunga).toBe(100_000)
  })
})
```

### 16.2 Integration Testing

- **Framework:** Vitest + Prisma Test Client (test database)
- **Prioritas:** Server Actions CRUD operations, API Route Handlers

### 16.3 E2E Testing

- **Framework:** Playwright
- **Prioritas:** Alur login, input transaksi, proses pengundian arisan

### 16.4 Test Coverage Matrix

| Modul | Unit | Integration | E2E |
|---|---|---|---|
| Auth | ✅ | ✅ | ✅ |
| Members | ✅ | ✅ | ✅ |
| Arisan | ✅ | ✅ | ✅ |
| Tabungan | ✅ | ✅ | ⬜ |
| Kredit | ✅ | ✅ | ⬜ |
| Events | ⬜ | ✅ | ⬜ |
| Reports | ⬜ | ✅ | ⬜ |

---

## 17. FOLDER STRUCTURE NEXT.JS ENTERPRISE SCALE

```
sistem-arisan/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx           # Sidebar, navbar layout
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── anggota/
│   │   │   │   ├── page.tsx         # List anggota
│   │   │   │   ├── tambah/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── arisan/
│   │   │   │   ├── periode/
│   │   │   │   ├── iuran/
│   │   │   │   ├── undian/
│   │   │   │   └── laporan/
│   │   │   ├── tabungan/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── transaksi/
│   │   │   │   └── laporan/
│   │   │   ├── kredit/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── pengajuan/
│   │   │   │   ├── approval/
│   │   │   │   ├── angsuran/
│   │   │   │   └── laporan/
│   │   │   ├── kegiatan/
│   │   │   │   └── page.tsx
│   │   │   ├── laporan/
│   │   │   │   └── page.tsx
│   │   │   └── pengaturan/
│   │   │       ├── bunga-tabungan/
│   │   │       └── bunga-kredit/
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts
│   │       └── v1/
│   │           ├── members/
│   │           │   └── route.ts
│   │           ├── arisan/
│   │           │   ├── periods/
│   │           │   ├── payments/
│   │           │   └── draws/
│   │           ├── savings/
│   │           │   ├── route.ts
│   │           │   └── transactions/
│   │           ├── loans/
│   │           │   ├── route.ts
│   │           │   └── installments/
│   │           ├── events/
│   │           └── reports/
│   │
│   ├── actions/                    # Server Actions
│   │   ├── member.actions.ts
│   │   ├── arisan.actions.ts
│   │   ├── saving.actions.ts
│   │   ├── loan.actions.ts
│   │   └── event.actions.ts
│   │
│   ├── components/
│   │   ├── ui/                     # Shadcn UI components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   ├── shared/
│   │   │   ├── DataTable.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── ExportButtons.tsx
│   │   ├── dashboard/
│   │   │   └── StatsCard.tsx
│   │   ├── members/
│   │   │   ├── MemberForm.tsx
│   │   │   └── MemberTable.tsx
│   │   ├── arisan/
│   │   │   ├── PeriodForm.tsx
│   │   │   ├── PaymentForm.tsx
│   │   │   └── DrawResult.tsx
│   │   ├── savings/
│   │   │   ├── TransactionForm.tsx
│   │   │   └── SavingsTable.tsx
│   │   └── loans/
│   │       ├── LoanForm.tsx
│   │       ├── InstallmentTable.tsx
│   │       └── ApprovalCard.tsx
│   │
│   ├── lib/
│   │   ├── prisma.ts               # Prisma singleton
│   │   ├── auth.ts                 # NextAuth config
│   │   ├── auth-helpers.ts         # requireAdmin, requireSuperAdmin
│   │   ├── audit.ts                # logActivity helper
│   │   ├── utils.ts                # cn(), formatCurrency(), formatDate()
│   │   ├── constants.ts            # App-wide constants
│   │   └── calculations/
│   │       ├── interest.ts         # Kalkulasi bunga
│   │       ├── installment.ts      # Generate jadwal angsuran
│   │       └── penalty.ts          # Kalkulasi denda
│   │
│   ├── validations/
│   │   ├── member.schema.ts
│   │   ├── arisan.schema.ts
│   │   ├── saving.schema.ts
│   │   └── loan.schema.ts
│   │
│   ├── types/
│   │   ├── index.ts                # Global types
│   │   ├── auth.types.ts
│   │   └── api.types.ts
│   │
│   └── hooks/
│       ├── useDebounce.ts
│       └── useLocalStorage.ts
│
├── public/
│   └── images/
│
├── .env.local                      # Local environment vars
├── .env.example                    # Template ENV
├── .gitignore
├── auth.ts                         # NextAuth main config
├── middleware.ts                   # Route protection middleware
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 18. ROADMAP PENGEMBANGAN

### Phase 1 — Foundation (Sprint 1-2)
- Setup project Next.js 15 + TypeScript + Tailwind + Shadcn
- Konfigurasi Prisma + NeonDB
- Implementasi NextAuth.js (login, session, RBAC)
- Modul Manajemen Anggota (CRUD lengkap)
- Dashboard dasar (3 role)

### Phase 2 — Core Features (Sprint 3-4)
- Modul Arisan (setup periode, input iuran, pengundian)
- Modul Tabungan (transaksi, kalkulasi bunga)
- Audit Trail

### Phase 3 — Advanced Features (Sprint 5-6)
- Modul Kredit (pengajuan, approval, angsuran, denda)
- Modul Jadwal Kegiatan
- Laporan lengkap

### Phase 4 — Polish & Export (Sprint 7)
- Export PDF dan Excel
- Dark mode
- UI/UX improvements
- Performance optimization

### Phase 5 — Testing & Deployment (Sprint 8)
- Unit & integration testing
- E2E testing
- Production deployment ke Vercel
- UAT (User Acceptance Testing)

---

## 19. ESTIMASI TIMELINE DEVELOPMENT

| Sprint | Durasi | Deliverable |
|---|---|---|
| Sprint 1 | 1 minggu | Project setup, Auth, DB schema |
| Sprint 2 | 1 minggu | Modul Anggota, Dashboard |
| Sprint 3 | 1 minggu | Modul Arisan |
| Sprint 4 | 1 minggu | Modul Tabungan |
| Sprint 5 | 1 minggu | Modul Kredit (pengajuan + approval) |
| Sprint 6 | 1 minggu | Modul Kredit (angsuran + denda) + Kegiatan |
| Sprint 7 | 1 minggu | Laporan, Export PDF/Excel |
| Sprint 8 | 1 minggu | Testing, Bug fix, Production Deployment |
| **Total** | **8 minggu** | **Aplikasi Production-Ready** |

> 💡 Estimasi untuk 1 developer fullstack. Dengan 2 developer, dapat dipercepat menjadi 4-5 minggu.

---

## 20. RISK ANALYSIS

| ID | Risiko | Probabilitas | Dampak | Mitigasi |
|---|---|---|---|---|
| R-01 | Serverless cold start lambat | Sedang | Sedang | Gunakan ISR, optimize query, Neon connection pooling |
| R-02 | Database connection limit terlampaui | Rendah | Tinggi | Singleton Prisma + PgBouncer dari NeonDB |
| R-03 | Data keuangan tidak akurat | Rendah | Sangat Tinggi | Unit test ketat pada fungsi kalkulasi, audit trail |
| R-04 | Keamanan data anggota bocor | Rendah | Sangat Tinggi | RBAC ketat, HTTPS, HttpOnly cookie, input sanitization |
| R-05 | Prisma error saat deploy Vercel | Sedang | Tinggi | `postinstall: prisma generate`, DIRECT_URL terpisah |
| R-06 | Scope creep melebihi timeline | Sedang | Sedang | Batasi fitur per sprint, daily standup, backlog grooming |
| R-07 | Ketergantungan pada NeonDB free tier | Sedang | Sedang | Monitor usage, siapkan upgrade plan jika skala besar |
| R-08 | Resistensi adopsi pengguna | Sedang | Sedang | UX sederhana, pelatihan singkat, dokumentasi pengguna |

---

## LAMPIRAN

### A. Contoh Format Nomor Otomatis

| Jenis | Format | Contoh |
|---|---|---|
| Nomor Anggota | `MBR-YYYYMM-XXXX` | `MBR-202601-0001` |
| Transaksi Tabungan | `SAV-YYYYMMDD-XXXX` | `SAV-20260115-0042` |
| Nomor Kredit | `LN-YYYYMMDD-XXXX` | `LN-20260301-0007` |

### B. Kalkulasi Bunga Kredit

**Metode Flat:**
```
Total Bunga   = Pokok × Bunga% × Tenor (bulan) / 12
Cicilan/bulan = (Pokok + Total Bunga) / Tenor
```

**Metode Efektif:**
```
Bunga bulan-N = Sisa Pokok × Bunga% / 12
Cicilan/bulan = Tetap (dihitung annuitas)
Pokok bulan-N = Cicilan Tetap − Bunga bulan-N
```

### C. Kalkulasi Denda

```
Denda = Nominal Angsuran × Denda%/hari × Jumlah Hari Terlambat
```

### D. Perintah Setup Development

```bash
# 1. Clone repository
git clone https://github.com/your-org/sistem-arisan.git
cd sistem-arisan

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local
# Edit .env.local sesuai konfigurasi

# 4. Generate Prisma Client
npx prisma generate

# 5. Jalankan migrasi database
npx prisma migrate dev --name init

# 6. Seed data awal (opsional)
npx tsx prisma/seed.ts

# 7. Jalankan development server
npm run dev
```

---

*Dokumen ini dibuat sebagai panduan lengkap untuk tim developer dalam membangun Sistem Informasi Tabungan, Kredit dan Arisan Keluarga. Versi dokumen ini dapat diperbarui sesuai kebutuhan selama proses development berlangsung.*

**Versi:** 1.0.0 | **Tanggal:** 30 Mei 2026