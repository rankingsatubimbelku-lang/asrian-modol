-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'ANGGOTA');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('AKTIF', 'NONAKTIF');

-- CreateEnum
CREATE TYPE "ArisanPeriodStatus" AS ENUM ('DRAFT', 'AKTIF', 'SELESAI');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('LUNAS', 'MENUNGGAK');

-- CreateEnum
CREATE TYPE "SavingTransactionType" AS ENUM ('SETORAN', 'PENARIKAN', 'BUNGA');

-- CreateEnum
CREATE TYPE "InterestPeriode" AS ENUM ('BULANAN', 'TAHUNAN');

-- CreateEnum
CREATE TYPE "LoanInterestMethod" AS ENUM ('FLAT', 'EFEKTIF');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('DRAFT', 'MENUNGGU_PERSETUJUAN', 'DISETUJUI', 'DITOLAK', 'LUNAS');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('BELUM_BAYAR', 'LUNAS', 'TERLAMBAT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ANGGOTA',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nomor_anggota" TEXT NOT NULL,
    "nama_lengkap" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "tempat_lahir" TEXT NOT NULL,
    "tanggal_lahir" DATE NOT NULL,
    "alamat" TEXT NOT NULL,
    "nomor_hp" TEXT NOT NULL,
    "tanggal_bergabung" DATE NOT NULL,
    "status" "MemberStatus" NOT NULL DEFAULT 'AKTIF',
    "foto_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arisan_periods" (
    "id" TEXT NOT NULL,
    "nama_periode" TEXT NOT NULL,
    "tanggal_mulai" DATE NOT NULL,
    "tanggal_selesai" DATE NOT NULL,
    "besar_iuran" DECIMAL(15,2) NOT NULL,
    "max_pemenang_per_bulan" INTEGER NOT NULL,
    "status" "ArisanPeriodStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arisan_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arisan_members" (
    "id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "sudah_menang" BOOLEAN NOT NULL DEFAULT false,
    "tanggal_menang" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arisan_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arisan_payments" (
    "id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "bulan" TEXT NOT NULL,
    "nominal" DECIMAL(15,2) NOT NULL,
    "tanggal_bayar" DATE NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'LUNAS',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arisan_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arisan_draws" (
    "id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "bulan_undian" TEXT NOT NULL,
    "tanggal_undian" DATE NOT NULL,
    "jumlah_pemenang" INTEGER NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arisan_draws_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arisan_winners" (
    "id" TEXT NOT NULL,
    "draw_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "nominal_hak" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arisan_winners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_interest_settings" (
    "id" TEXT NOT NULL,
    "persentase" DECIMAL(5,2) NOT NULL,
    "periode" "InterestPeriode" NOT NULL DEFAULT 'TAHUNAN',
    "berlaku_mulai" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "savings_interest_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "saldo" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "savings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_transactions" (
    "id" TEXT NOT NULL,
    "nomor_transaksi" TEXT NOT NULL,
    "saving_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "jenis" "SavingTransactionType" NOT NULL,
    "nominal" DECIMAL(15,2) NOT NULL,
    "keterangan" TEXT,
    "tanggal" DATE NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "savings_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_interest" (
    "id" TEXT NOT NULL,
    "saving_id" TEXT NOT NULL,
    "setting_id" TEXT NOT NULL,
    "nominal_bunga" DECIMAL(15,2) NOT NULL,
    "periode" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "savings_interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_interest_settings" (
    "id" TEXT NOT NULL,
    "persentase" DECIMAL(5,2) NOT NULL,
    "metode" "LoanInterestMethod" NOT NULL DEFAULT 'FLAT',
    "berlaku_mulai" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "denda_per_hari" DECIMAL(5,2) NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_interest_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "nomor_pengajuan" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "nominal_pinjaman" DECIMAL(15,2) NOT NULL,
    "tenor" INTEGER NOT NULL,
    "tujuan_pinjaman" TEXT NOT NULL,
    "interest_setting_id" TEXT NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'DRAFT',
    "tanggal_pengajuan" DATE NOT NULL,
    "tanggal_disetujui" DATE,
    "tanggal_lunas" DATE,
    "catatan_approval" TEXT,
    "approved_by" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_installments" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "ke" INTEGER NOT NULL,
    "tanggal_jatuh_tempo" DATE NOT NULL,
    "tanggal_bayar" DATE,
    "nominal_pokok" DECIMAL(15,2) NOT NULL,
    "nominal_bunga" DECIMAL(15,2) NOT NULL,
    "denda" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'BELUM_BAYAR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "nama_kegiatan" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "lokasi" TEXT NOT NULL,
    "deskripsi" TEXT,
    "pic" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_id" TEXT,
    "data_lama" JSONB,
    "data_baru" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "members_user_id_key" ON "members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "members_nomor_anggota_key" ON "members"("nomor_anggota");

-- CreateIndex
CREATE UNIQUE INDEX "members_nik_key" ON "members"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "arisan_members_period_id_member_id_key" ON "arisan_members"("period_id", "member_id");

-- CreateIndex
CREATE UNIQUE INDEX "savings_member_id_key" ON "savings"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "savings_transactions_nomor_transaksi_key" ON "savings_transactions"("nomor_transaksi");

-- CreateIndex
CREATE UNIQUE INDEX "loans_nomor_pengajuan_key" ON "loans"("nomor_pengajuan");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arisan_periods" ADD CONSTRAINT "arisan_periods_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arisan_members" ADD CONSTRAINT "arisan_members_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "arisan_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arisan_members" ADD CONSTRAINT "arisan_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arisan_payments" ADD CONSTRAINT "arisan_payments_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "arisan_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arisan_payments" ADD CONSTRAINT "arisan_payments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arisan_payments" ADD CONSTRAINT "arisan_payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arisan_draws" ADD CONSTRAINT "arisan_draws_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "arisan_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arisan_draws" ADD CONSTRAINT "arisan_draws_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arisan_winners" ADD CONSTRAINT "arisan_winners_draw_id_fkey" FOREIGN KEY ("draw_id") REFERENCES "arisan_draws"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arisan_winners" ADD CONSTRAINT "arisan_winners_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_interest_settings" ADD CONSTRAINT "savings_interest_settings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings" ADD CONSTRAINT "savings_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_transactions" ADD CONSTRAINT "savings_transactions_saving_id_fkey" FOREIGN KEY ("saving_id") REFERENCES "savings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_transactions" ADD CONSTRAINT "savings_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_interest" ADD CONSTRAINT "savings_interest_saving_id_fkey" FOREIGN KEY ("saving_id") REFERENCES "savings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_interest" ADD CONSTRAINT "savings_interest_setting_id_fkey" FOREIGN KEY ("setting_id") REFERENCES "savings_interest_settings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_interest_settings" ADD CONSTRAINT "loan_interest_settings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_interest_setting_id_fkey" FOREIGN KEY ("interest_setting_id") REFERENCES "loan_interest_settings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_installments" ADD CONSTRAINT "loan_installments_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
