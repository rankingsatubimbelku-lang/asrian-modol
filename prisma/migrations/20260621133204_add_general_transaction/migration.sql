-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PEMASUKAN', 'PENGELUARAN');

-- CreateTable
CREATE TABLE "general_transactions" (
    "id" TEXT NOT NULL,
    "nomor_transaksi" TEXT NOT NULL,
    "jenis" "TransactionType" NOT NULL,
    "kategori" TEXT NOT NULL,
    "nominal" DECIMAL(15,2) NOT NULL,
    "tanggal" DATE NOT NULL,
    "keterangan" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "general_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "general_transactions_nomor_transaksi_key" ON "general_transactions"("nomor_transaksi");

-- AddForeignKey
ALTER TABLE "general_transactions" ADD CONSTRAINT "general_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
