-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASET', 'KEWAJIBAN', 'MODAL', 'PENDAPATAN', 'BEBAN');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tipe" "AccountType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "nomor_jurnal" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "source_module" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "is_reversal" BOOLEAN NOT NULL DEFAULT false,
    "reversal_of_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entry_lines" (
    "id" TEXT NOT NULL,
    "journal_entry_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "kredit" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "journal_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_kode_key" ON "accounts"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_nomor_jurnal_key" ON "journal_entries"("nomor_jurnal");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_source_module_source_id_is_reversal_key" ON "journal_entries"("source_module", "source_id", "is_reversal");

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_reversal_of_id_fkey" FOREIGN KEY ("reversal_of_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
