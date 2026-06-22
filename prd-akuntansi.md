# PRODUCT REQUIREMENT DOCUMENT (PRD)
# Modul Akuntansi Sederhana — Sistem Arisan Keluarga

**Versi:** 1.0.0
**Tanggal:** 22 Juni 2026
**Status:** Draft — Siap untuk Development
**Dokumen Induk:** `setup_install.md` (Sistem Informasi Tabungan, Kredit dan Arisan Keluarga)

---

## DAFTAR ISI

1. [Executive Summary](#1-executive-summary)
2. [Lingkup (Scope)](#2-lingkup-scope)
3. [Konsep Akuntansi yang Dipakai](#3-konsep-akuntansi-yang-dipakai)
4. [Chart of Accounts (Daftar Akun)](#4-chart-of-accounts-daftar-akun)
5. [Mapping Transaksi Sistem → Jurnal Otomatis](#5-mapping-transaksi-sistem--jurnal-otomatis)
6. [Business Rules](#6-business-rules)
7. [Database Design](#7-database-design)
8. [Prisma Schema Design](#8-prisma-schema-design)
9. [Server Actions / API](#9-server-actions--api)
10. [Laporan Laba Rugi](#10-laporan-laba-rugi)
11. [Laporan Neraca](#11-laporan-neraca)
12. [UI/UX Flow & Folder Structure](#12-uiux-flow--folder-structure)
13. [Security & Audit](#13-security--audit)
14. [Roadmap Implementasi](#14-roadmap-implementasi)
15. [Risk Analysis](#15-risk-analysis)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Latar Belakang

Sistem Arisan Keluarga saat ini sudah mencatat transaksi operasional (tabungan, kredit, arisan, kas umum) tetapi **belum memiliki pembukuan akuntansi formal**. Setiap modul menyimpan datanya sendiri-sendiri (saldo tabungan, sisa pokok kredit, dll) tanpa ada **jurnal berpasangan (double-entry)** yang bisa menghasilkan **Laporan Laba Rugi** dan **Neraca** yang saling seimbang.

### 1.2 Deskripsi Modul

Modul Akuntansi ini adalah **lapisan pencatatan jurnal otomatis** yang "mendengarkan" transaksi yang sudah terjadi di modul Tabungan dan Kredit (dan opsional Transaksi Umum), lalu menghasilkan **jurnal debit-kredit** secara otomatis — pengguna tidak perlu menginput jurnal manual untuk transaksi rutin.

### 1.3 Tujuan

- Setiap transaksi tabungan & kredit yang **sudah diposting/lunas** otomatis menghasilkan jurnal yang seimbang (total debit = total kredit)
- Admin/Bendahara bisa melihat **Buku Besar** per akun
- Sistem bisa generate **Laporan Laba Rugi** (pendapatan bunga, denda, dikurangi beban) per periode
- Sistem bisa generate **Neraca** (Aset = Kewajiban + Modal) per tanggal tertentu
- Jurnal yang sudah diposting **tidak bisa dihapus** (hanya bisa dibuat jurnal koreksi/reversal) — konsisten dengan prinsip `isPosted` yang sudah dipakai di modul Tabungan

### 1.4 Non-Tujuan (Out of Scope v1.0)

- Tidak membangun sistem akuntansi multi-cabang/multi-mata uang
- Tidak ada sub-ledger pajak (PPh, PPN)
- Tidak ada rekonsiliasi bank otomatis (import mutasi bank)
- Jurnal untuk modul **Arisan** belum termasuk di v1.0 (bisa menyusul di v1.1 — lihat [Roadmap](#14-roadmap-implementasi))

---

## 2. LINGKUP (SCOPE)

| Modul Sumber | Status | Pemicu Jurnal Otomatis |
|---|---|---|
| **Tabungan** | ✅ In scope | Setoran, Penarikan, Bunga (saat `isPosted = true`) |
| **Kredit** | ✅ In scope | Pencairan saat approval, Pembayaran angsuran bulanan (pokok+bunga+denda) |
| **Transaksi Umum** | ✅ In scope | Pemasukan & Pengeluaran (sudah ada modul `/transaksi`) |
| **Arisan** | ⏳ v1.1 | Iuran masuk, dana arisan keluar ke pemenang |
| Laporan Laba Rugi | ✅ In scope | Generated dari jurnal akun Pendapatan & Beban |
| Laporan Neraca | ✅ In scope | Generated dari saldo akun Aset/Kewajiban/Modal per tanggal |

---

## 3. KONSEP AKUNTANSI YANG DIPAKAI

Modul ini memakai **akuntansi berpasangan (double-entry bookkeeping)** dengan prinsip sederhana:

```
Setiap transaksi keuangan dicatat di MINIMAL 2 akun:
  - Satu akun di-DEBIT
  - Satu akun di-KREDIT
  - Total Debit HARUS SAMA DENGAN Total Kredit (balance)
```

**5 jenis akun (tipe akun):**

| Tipe | Saldo Normal | Contoh |
|---|---|---|
| **ASET** | Debit | Kas, Bank, Piutang Kredit |
| **KEWAJIBAN** | Kredit | Tabungan Anggota (uang anggota yang "dipinjam" koperasi) |
| **MODAL** | Kredit | Modal/SHU Ditahan |
| **PENDAPATAN** | Kredit | Pendapatan Bunga Kredit, Pendapatan Denda |
| **BEBAN** | Debit | Beban Bunga Tabungan, Beban Operasional |

**Persamaan dasar yang harus selalu seimbang:**
```
ASET = KEWAJIBAN + MODAL + (PENDAPATAN − BEBAN)
```

> 💡 **Catatan untuk tim non-akuntan:** Saldo tabungan anggota itu sebenarnya **utang koperasi ke anggota** (Kewajiban), bukan milik koperasi. Sebaliknya, kredit yang dipinjamkan ke anggota adalah **Piutang** (Aset) koperasi.

---

## 4. CHART OF ACCOUNTS (DAFTAR AKUN)

Daftar akun minimal yang dibutuhkan v1.0 — bisa ditambah lewat halaman **Pengaturan → Daftar Akun**.

| Kode | Nama Akun | Tipe | Sumber Otomatis |
|---|---|---|---|
| 1001 | Kas | ASET | Semua transaksi |
| 1101 | Piutang Kredit Anggota | ASET | Modul Kredit |
| 2001 | Tabungan Anggota | KEWAJIBAN | Modul Tabungan |
| 3001 | Modal / SHU Ditahan | MODAL | Saldo awal & tutup buku |
| 4001 | Pendapatan Bunga Kredit | PENDAPATAN | Modul Kredit (saat angsuran lunas) |
| 4002 | Pendapatan Denda Kredit | PENDAPATAN | Modul Kredit (saat ada denda) |
| 4003 | Pendapatan Lain-lain | PENDAPATAN | Transaksi Umum (Pemasukan) |
| 5001 | Beban Bunga Tabungan | BEBAN | Modul Tabungan (saat bunga dibagikan) |
| 5002 | Beban Operasional | BEBAN | Transaksi Umum (Pengeluaran) |

---

## 5. MAPPING TRANSAKSI SISTEM → JURNAL OTOMATIS

Ini bagian **paling penting** — setiap event yang SUDAH ADA di codebase akan memicu pembuatan jurnal. Tidak ada UI baru untuk input jurnal manual transaksi rutin.

### 5.1 Tabungan — `inputTransaksiTabungan()` (saat `isPosted = true` via posting)

| Jenis | Debit | Kredit |
|---|---|---|
| **SETORAN** | 1001 Kas | 2001 Tabungan Anggota |
| **PENARIKAN** | 2001 Tabungan Anggota | 1001 Kas |
| **BUNGA** | 5001 Beban Bunga Tabungan | 2001 Tabungan Anggota |

> Jurnal dibuat **bukan saat transaksi dicatat**, tapi saat di-**posting** (`postingTabungan` / `postingSemuaTabungan`) — konsisten dengan alur yang sudah ada di mana data baru "valid" setelah diposting.

### 5.2 Kredit — `approveLoan()` (pencairan)

| Event | Debit | Kredit |
|---|---|---|
| Approval kredit (pencairan) | 1101 Piutang Kredit Anggota | 1001 Kas |

### 5.3 Kredit — `catatPembayaranBulanan()` / `pelunasanAwal()`

Satu pembayaran dipecah otomatis (logika `pecahPembayaranBulanan` sudah ada) menjadi 1 baris jurnal majemuk:

| Komponen | Debit | Kredit |
|---|---|---|
| Total nominal bayar | 1001 Kas | — |
| Bagian pokok | — | 1101 Piutang Kredit Anggota |
| Bagian bunga | — | 4001 Pendapatan Bunga Kredit |
| Bagian denda (jika ada) | — | 4002 Pendapatan Denda Kredit |

### 5.4 Transaksi Umum — `createTransaksi()`

| Jenis | Debit | Kredit |
|---|---|---|
| **PEMASUKAN** | 1001 Kas | 4003 Pendapatan Lain-lain |
| **PENGELUARAN** | 5002 Beban Operasional | 1001 Kas |

> Kategori (`kategori` field yang sudah ada) bisa dipetakan ke akun beban/pendapatan yang lebih spesifik di v1.1 lewat tabel mapping kategori→akun.

---

## 6. BUSINESS RULES

| ID | Rule |
|---|---|
| BR-AKT-01 | Setiap jurnal **wajib balance** (total debit = total kredit) — divalidasi sebelum simpan |
| BR-AKT-02 | Jurnal dibuat **otomatis** oleh sistem saat event sumber terjadi (lihat §5) — tidak ada input manual untuk transaksi rutin |
| BR-AKT-03 | Jurnal yang sudah dibuat **tidak bisa diedit/dihapus** — jika ada kesalahan, dibuat **jurnal pembalik (reversal)** |
| BR-AKT-04 | Satu transaksi sumber (`sourceModule` + `sourceId`) hanya boleh punya **satu jurnal aktif** — mencegah duplikasi jika user klik dobel |
| BR-AKT-05 | Laporan Neraca & Laba Rugi dihitung **on-the-fly** dari jurnal (bukan cache statis) agar selalu akurat |
| BR-AKT-06 | Hanya **SUPER_ADMIN** yang bisa lihat Buku Besar mentah & Neraca; ADMIN bisa lihat Laba Rugi ringkas |
| BR-AKT-07 | Setiap kali halaman Neraca dibuka, sistem **wajib** menjalankan audit selisih (§9.4 & §11.1) — jika ditemukan selisih, tampilkan sumbernya (jurnal tidak balance / akun salah klasifikasi) langsung di UI, bukan hanya nominal selisih |

---

## 7. DATABASE DESIGN

### 7.1 Tabel: `accounts` (Chart of Accounts)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | |
| kode | VARCHAR(10) UNIQUE | cth: "1001" |
| nama | VARCHAR(100) | cth: "Kas" |
| tipe | ENUM | ASET, KEWAJIBAN, MODAL, PENDAPATAN, BEBAN |
| isActive | BOOLEAN | |
| createdAt | TIMESTAMP | |

### 7.2 Tabel: `journal_entries` (Header Jurnal)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | |
| nomorJurnal | VARCHAR(30) UNIQUE | Auto-gen: `JRN-YYYYMMDD-XXXX` |
| tanggal | DATE | Tanggal transaksi (bukan tanggal input) |
| deskripsi | TEXT | cth: "Setoran tabungan — Wayan Sujana" |
| sourceModule | VARCHAR(30) | "TABUNGAN", "KREDIT", "TRANSAKSI_UMUM" |
| sourceId | UUID | ID record sumber (SavingsTransaction.id, dll) |
| isReversal | BOOLEAN DEFAULT false | true jika ini jurnal pembalik |
| reversalOfId | UUID NULL | menunjuk ke jurnal asli yang dibalik |
| createdBy | UUID (FK → users) | |
| createdAt | TIMESTAMP | |

`@@unique([sourceModule, sourceId, isReversal])` — mencegah duplikasi (BR-AKT-04).

### 7.3 Tabel: `journal_entry_lines` (Detail Debit/Kredit)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | |
| journalEntryId | UUID (FK → journal_entries) | |
| accountId | UUID (FK → accounts) | |
| debit | DECIMAL(15,2) DEFAULT 0 | |
| kredit | DECIMAL(15,2) DEFAULT 0 | |

> Satu baris hanya boleh berisi `debit` ATAU `kredit` (salah satu = 0). Validasi di level aplikasi.

---

## 8. PRISMA SCHEMA DESIGN

```prisma
enum AccountType {
  ASET
  KEWAJIBAN
  MODAL
  PENDAPATAN
  BEBAN
}

model Account {
  id        String      @id @default(uuid())
  kode      String      @unique
  nama      String
  tipe      AccountType
  isActive  Boolean     @default(true) @map("is_active")
  createdAt DateTime    @default(now()) @map("created_at")

  lines JournalEntryLine[]

  @@map("accounts")
}

model JournalEntry {
  id            String   @id @default(uuid())
  nomorJurnal   String   @unique @map("nomor_jurnal")
  tanggal       DateTime @db.Date
  deskripsi     String
  sourceModule  String   @map("source_module")
  sourceId      String   @map("source_id")
  isReversal    Boolean  @default(false) @map("is_reversal")
  reversalOfId  String?  @map("reversal_of_id")
  createdBy     String   @map("created_by")
  createdAt     DateTime @default(now()) @map("created_at")

  creator      User                @relation(fields: [createdBy], references: [id])
  reversalOf   JournalEntry?       @relation("Reversal", fields: [reversalOfId], references: [id])
  reversedBy   JournalEntry[]      @relation("Reversal")
  lines        JournalEntryLine[]

  @@unique([sourceModule, sourceId, isReversal])
  @@map("journal_entries")
}

model JournalEntryLine {
  id             String   @id @default(uuid())
  journalEntryId String   @map("journal_entry_id")
  accountId      String   @map("account_id")
  debit          Decimal  @default(0) @db.Decimal(15, 2)
  kredit         Decimal  @default(0) @db.Decimal(15, 2)

  journalEntry JournalEntry @relation(fields: [journalEntryId], references: [id])
  account      Account      @relation(fields: [accountId], references: [id])

  @@map("journal_entry_lines")
}
```

Tambahan relasi di `User`:
```prisma
journalEntries JournalEntry[]
```

---

## 9. SERVER ACTIONS / API

### 9.1 Helper inti — `src/lib/jurnal.ts`

```typescript
interface JurnalLine { kodeAkun: string; debit?: number; kredit?: number }

async function buatJurnal({
  tanggal, deskripsi, sourceModule, sourceId, lines, userId,
}: {
  tanggal: Date
  deskripsi: string
  sourceModule: string
  sourceId: string
  lines: JurnalLine[]
  userId: string
}) {
  const totalDebit = lines.reduce((a, l) => a + (l.debit ?? 0), 0)
  const totalKredit = lines.reduce((a, l) => a + (l.kredit ?? 0), 0)
  if (totalDebit !== totalKredit) throw new Error("Jurnal tidak balance")

  // skip jika sudah pernah dibuat untuk source ini (BR-AKT-04)
  const existing = await prisma.journalEntry.findUnique({
    where: { sourceModule_sourceId_isReversal: { sourceModule, sourceId, isReversal: false } },
  })
  if (existing) return existing

  // ... create JournalEntry + JournalEntryLine[] dalam transaction
}
```

### 9.2 Titik integrasi (hook ke action yang SUDAH ADA)

| File yang sudah ada | Tambahkan panggilan |
|---|---|
| `src/actions/saving.actions.ts` → `postingTabungan()` | `buatJurnal(...)` per transaksi yang diposting |
| `src/actions/loan.actions.ts` → `approveLoan()` | `buatJurnal(...)` untuk pencairan |
| `src/actions/loan.actions.ts` → `catatPembayaranBulanan()` | `buatJurnal(...)` dengan 3-4 baris (kas/pokok/bunga/denda) |
| `src/actions/transaksi.actions.ts` → `createTransaksi()` | `buatJurnal(...)` 2 baris |

### 9.3 Endpoint laporan

| Action | Fungsi |
|---|---|
| `getLabaRugi(periode: { dari: Date; sampai: Date })` | Sum kredit−debit per akun PENDAPATAN & BEBAN dalam rentang tanggal |
| `getNeraca(perTanggal: Date)` | Sum saldo akun ASET/KEWAJIBAN/MODAL hingga tanggal tersebut |
| `getBukuBesar(accountId, periode)` | List semua `JournalEntryLine` untuk satu akun, dengan saldo berjalan |
| `buatJurnalPembalik(journalEntryId)` | Buat jurnal reversal (debit↔kredit dibalik) untuk koreksi |

### 9.4 Endpoint audit selisih — `getAuditSelisihNeraca()`

Dipanggil otomatis setiap kali halaman Neraca dibuka. Mengembalikan akar masalah, **bukan cuma angka selisih**:

```typescript
interface AuditSelisihResult {
  totalSelisih: number
  jurnalTidakBalance: {
    journalEntryId: string
    nomorJurnal: string
    tanggal: Date
    deskripsi: string
    totalDebit: number
    totalKredit: number
    selisih: number
  }[]
  akunMencurigakan: {
    accountId: string
    kode: string
    nama: string
    tipe: AccountType
    saldoSeharusnya: "DEBIT" | "KREDIT"   // sesuai tipe akun
    saldoAktual: "DEBIT" | "KREDIT"        // hasil hitung riil
    nominal: number
  }[]
}
```

**Logika deteksi (2 lapis, dijalankan berurutan):**

```typescript
async function getAuditSelisihNeraca(perTanggal: Date): Promise<AuditSelisihResult> {
  // LAPIS 1 — Cari jurnal yang lolos validasi tapi sebenarnya tidak balance
  // (mis. hasil migrasi manual / raw SQL / bug masa lalu sebelum buatJurnal() ada)
  const jurnalTidakBalance = await prisma.$queryRaw`
    SELECT je.id, je."nomor_jurnal", je.tanggal, je.deskripsi,
           SUM(jel.debit) as total_debit, SUM(jel.kredit) as total_kredit
    FROM journal_entries je
    JOIN journal_entry_lines jel ON jel."journal_entry_id" = je.id
    WHERE je.tanggal <= ${perTanggal}
    GROUP BY je.id
    HAVING SUM(jel.debit) <> SUM(jel.kredit)
  `

  // LAPIS 2 — Jika Lapis 1 kosong (semua jurnal individual balance) tapi Neraca
  // TETAP tidak balance, akar masalahnya pasti di klasifikasi tipe akun yang salah.
  // Cari akun dengan "saldo tidak normal" (red flag, bukan otomatis salah, tapi
  // patut dicurigai lebih dulu):
  //   - Akun ASET/BEBAN tapi saldo bersih KREDIT (seharusnya DEBIT)
  //   - Akun KEWAJIBAN/MODAL/PENDAPATAN tapi saldo bersih DEBIT (seharusnya KREDIT)
  const akunMencurigakan = await hitungSaldoSemuaAkun(perTanggal)
    .filter(a => isSaldoTidakNormal(a))

  return { totalSelisih, jurnalTidakBalance, akunMencurigakan }
}
```

> 💡 **Insight kunci:** Karena setiap `buatJurnal()` SUDAH memvalidasi balance saat dibuat (BR-AKT-01), Neraca yang tidak seimbang **tidak mungkin** terjadi dari pemakaian normal sistem. Penyebabnya hanya 2: (a) ada baris jurnal yang masuk lewat jalur lain (migrasi/raw SQL/bug lama), atau (b) `tipe` akun di Chart of Accounts diubah/salah setelah transaksi berjalan di akun itu. Algoritma di atas membedakan kedua kemungkinan ini secara eksplisit, bukan cuma menampilkan "selisih Rp X".

---

## 10. LAPORAN LABA RUGI

```
LAPORAN LABA RUGI
Periode: 1 Juni 2026 — 30 Juni 2026

PENDAPATAN
  Pendapatan Bunga Kredit          Rp 1.200.000
  Pendapatan Denda Kredit          Rp    50.000
  Pendapatan Lain-lain             Rp   200.000
  ─────────────────────────────────────────────
  Total Pendapatan                Rp 1.450.000

BEBAN
  Beban Bunga Tabungan             Rp   300.000
  Beban Operasional                Rp   150.000
  ─────────────────────────────────────────────
  Total Beban                     Rp   450.000

LABA BERSIH                       Rp 1.000.000
```

**Kalkulasi:** `Laba = Σ(kredit − debit) akun PENDAPATAN − Σ(debit − kredit) akun BEBAN`, difilter `tanggal BETWEEN dari AND sampai`.

---

## 11. LAPORAN NERACA

```
NERACA
Per tanggal: 30 Juni 2026

ASET                                  KEWAJIBAN & MODAL
Kas                  Rp 5.000.000     Tabungan Anggota      Rp 8.000.000
Piutang Kredit       Rp 6.300.000     ─────────────────────────────────
─────────────────────────────────     Modal/SHU Ditahan     Rp 2.300.000
                                       Laba Berjalan         Rp 1.000.000
                                       ─────────────────────────────────
Total Aset           Rp 11.300.000    Total Kewajiban+Modal Rp 11.300.000
```

**Validasi wajib:** `Total Aset HARUS SAMA DENGAN Total Kewajiban + Modal` — jika tidak sama, ada bug di salah satu mapping jurnal (§5) yang harus diperbaiki sebelum laporan dianggap valid.

**Kalkulasi saldo per akun (`perTanggal`):**
- ASET & BEBAN: `saldo = Σdebit − Σkredit`
- KEWAJIBAN, MODAL, PENDAPATAN: `saldo = Σkredit − Σdebit`

### 11.1 Jika Neraca Tidak Balance — Pelacakan Otomatis ke Sumber Selisih

Halaman Neraca **selalu** menjalankan `getAuditSelisihNeraca()` (§9.4) di belakang layar. Jika `totalSelisih !== 0`, tampilan berubah dari laporan biasa menjadi **mode diagnostik** — admin tidak perlu menebak-nebak, sistem langsung menunjuk akar masalahnya:

```
⚠️  NERACA TIDAK BALANCE — Selisih Rp 42.000

Total Aset (Rp 11.342.000) ≠ Total Kewajiban + Modal (Rp 11.300.000)

┌─ Kemungkinan Penyebab #1: Jurnal Tidak Balance (1 ditemukan) ──────┐
│                                                                     │
│  JRN-20260615-0031 · 15 Jun 2026                                   │
│  "Pembayaran angsuran — I Wayan Karma"                             │
│  Debit: Rp 300.000   Kredit: Rp 258.000   Selisih: Rp 42.000      │
│                                          [ Lihat & Perbaiki → ]    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─ Kemungkinan Penyebab #2: Akun dengan Saldo Tidak Normal ──────────┐
│                                                                     │
│  (Kosong jika Penyebab #1 ditemukan — biasanya hanya satu          │
│   penyebab yang aktif dalam satu waktu)                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Alur perbaikan ("Lihat & Perbaiki" pada jurnal bermasalah):**

1. Klik baris jurnal → diarahkan ke `/akuntansi/buku-besar?journalId=JRN-20260615-0031` (bukan sekadar lihat, tapi sudah ter-highlight baris yang timpang)
2. Halaman menampilkan detail baris debit/kredit jurnal tersebut beserta **akun COA** yang terlibat (kode + nama akun), supaya admin tahu pasti akun mana yang harus dikoreksi
3. Admin tidak mengedit jurnal lama (BR-AKT-03) — sistem otomatis menyiapkan **draft jurnal koreksi** dengan baris yang hilang sudah terisi sebagian (selisihnya), admin hanya perlu konfirmasi akun tujuan yang benar
4. Setelah koreksi disimpan → halaman Neraca otomatis re-fetch, banner peringatan hilang jika selisih sudah 0

**Alur perbaikan (akun dengan saldo tidak normal — Penyebab #2):**

1. Klik kode akun → diarahkan ke `/akuntansi/buku-besar?accountId=...` untuk melihat seluruh riwayat mutasi akun tersebut
2. Admin & developer memeriksa apakah `tipe` akun di Chart of Accounts (`/akuntansi/akun`) sesuai dengan transaksi yang sudah tercatat — jika akun salah diklasifikasikan, kode akun **TIDAK diubah** tipenya secara langsung (karena akan mengubah retroaktif perhitungan historis), melainkan dibuatkan akun baru dengan tipe benar + jurnal pemindahan saldo

> **Catatan desain:** Banner diagnostik ini **tidak menggantikan** laporan Neraca normal — ia hanya muncul kondisional saat `totalSelisih !== 0`. Pada kondisi normal (mayoritas waktu, jika §5 diimplementasikan benar), halaman Neraca tampil bersih seperti contoh di atas tanpa banner apa pun.

---

## 12. UI/UX FLOW & FOLDER STRUCTURE

### 12.1 Navigasi Sidebar Baru

```
💰 Akuntansi  (SUPER_ADMIN, ADMIN)
   ├── Buku Besar         /akuntansi/buku-besar
   ├── Laba Rugi          /akuntansi/laba-rugi
   ├── Neraca             /akuntansi/neraca        (banner audit selisih otomatis, lihat §11.1)
   └── Daftar Akun        /akuntansi/akun           (SUPER_ADMIN only)
```

### 12.2 Folder Structure (mengikuti konvensi project yang sudah ada)

```
src/
├── lib/
│   └── jurnal.ts                          # buatJurnal(), buatJurnalPembalik()
├── actions/
│   └── akuntansi.actions.ts                # getLabaRugi, getNeraca, getBukuBesar
├── validations/
│   └── akuntansi.schema.ts
└── app/(dashboard)/akuntansi/
    ├── buku-besar/page.tsx                 # pilih akun → tampil mutasi
    ├── laba-rugi/page.tsx                  # filter periode + export PDF/Excel
    ├── neraca/page.tsx                     # filter tanggal + export PDF/Excel
    └── akun/page.tsx                       # CRUD Chart of Accounts
```

> Pola export PDF/Excel **reuse** komponen `ExportButtons` yang sudah ada di `src/components/shared/ExportButtons.tsx` — sama seperti `/kredit/laporan-bunga`.

---

## 13. SECURITY & AUDIT

| Aturan | Penerapan |
|---|---|
| Jurnal hanya dibuat oleh sistem (server-side), tidak ada form input manual untuk transaksi rutin | Mencegah manipulasi pembukuan |
| Setiap `buatJurnal()` dicatat ke `activity_logs` yang sudah ada (`logActivity`) | Konsisten dengan audit trail modul lain |
| Hapus jurnal **tidak diizinkan** di level database action (tidak ada `deleteJournalEntry`) | Hanya `buatJurnalPembalik()` yang tersedia |
| Akses Neraca & Buku Besar dibatasi `requireSuperAdmin()` | Data sensitif keuangan |

---

## 14. ROADMAP IMPLEMENTASI

| Fase | Lingkup | Estimasi |
|---|---|---|
| **v1.0 — Fondasi** | Schema (Account, JournalEntry, JournalEntryLine) + migrasi + seed Chart of Accounts default | 2-3 hari |
| **v1.0 — Auto-Jurnal Tabungan** | Hook ke `postingTabungan()` / `postingSemuaTabungan()` | 1-2 hari |
| **v1.0 — Auto-Jurnal Kredit** | Hook ke `approveLoan()` + `catatPembayaranBulanan()` + `pelunasanAwal()` | 2 hari |
| **v1.0 — Auto-Jurnal Transaksi Umum** | Hook ke `createTransaksi()` | 0.5 hari |
| **v1.0 — Laporan** | Laba Rugi + Neraca + Buku Besar + export | 2-3 hari |
| **v1.0 — Backfill** | Script migrasi jurnal untuk data yang SUDAH ADA sebelum modul ini aktif (transaksi lama tanpa jurnal) | 1 hari |
| **v1.1** | Jurnal Arisan (iuran masuk, dana keluar ke pemenang) | TBD |
| **v1.1** | Mapping kategori `GeneralTransaction` → akun spesifik (bukan satu akun generik) | TBD |
| **v1.2** | Jurnal penyesuaian manual (untuk kasus non-rutin) dengan approval 2-langkah | TBD |

---

## 15. RISK ANALYSIS

| ID | Risiko | Probabilitas | Dampak | Mitigasi |
|---|---|---|---|---|
| R-AKT-01 | Neraca tidak balance akibat bug mapping jurnal | Sedang | Tinggi | Unit test wajib untuk setiap fungsi `buatJurnal()`; validasi balance di level DB constraint/check |
| R-AKT-02 | Data transaksi LAMA (sebelum modul ini aktif) tidak punya jurnal → Neraca awal tidak akurat | Tinggi | Tinggi | Script backfill wajib dijalankan sebelum go-live; saldo awal dicatat sebagai jurnal "Saldo Awal" per akun |
| R-AKT-03 | Performa lambat saat hitung Neraca jika data jurnal sudah besar | Rendah | Sedang | Index pada `(accountId, tanggal)`; pertimbangkan materialized view jika data > 100rb baris |
| R-AKT-04 | Duplikasi jurnal jika action dipanggil 2x (race condition) | Sedang | Tinggi | Unique constraint `(sourceModule, sourceId, isReversal)` di DB level (sudah didesain di §7.2) |
| R-AKT-05 | User awam bingung dengan terminologi akuntansi | Tinggi | Rendah | Tooltip/penjelasan di UI (seperti catatan di `/kredit/laporan-bunga`) |

---

## LAMPIRAN

### A. Contoh Format Nomor Otomatis

| Jenis | Format | Contoh |
|---|---|---|
| Nomor Jurnal | `JRN-YYYYMMDD-XXXX` | `JRN-20260622-0042` |

### B. Contoh Lengkap Alur Satu Transaksi (End-to-End)

**Skenario:** Wayan bayar angsuran kredit Rp 300.000 (FLAT 12%/thn, sisa pokok Rp 4.200.000)

1. Admin buka modal "Bayar Angsuran" di `/kredit/[id]` → input Rp 300.000
2. `catatPembayaranBulanan()` jalan → `pecahPembayaranBulanan()` hitung: bunga Rp 42.000, pokok Rp 258.000
3. **Trigger baru:** `buatJurnal()` dipanggil dengan:

   | Akun | Debit | Kredit |
   |---|---|---|
   | 1001 Kas | 300.000 | |
   | 1101 Piutang Kredit Anggota | | 258.000 |
   | 4001 Pendapatan Bunga Kredit | | 42.000 |

4. `JournalEntry` baru tersimpan dengan `sourceModule="KREDIT"`, `sourceId=<installmentId>`
5. Laporan Laba Rugi bulan ini otomatis bertambah Rp 42.000 pendapatan
6. Laporan Neraca: Kas naik Rp 300.000, Piutang Kredit turun Rp 258.000 — tetap balance

---

*Dokumen ini melengkapi `setup_install.md` dan dirancang agar terintegrasi langsung dengan action yang sudah berjalan di production (Fase 1-5 selesai) tanpa mengubah alur kerja existing — hanya menambahkan pencatatan jurnal di belakang layar.*

**Versi:** 1.0.0 | **Tanggal:** 22 Juni 2026
