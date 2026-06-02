-- AlterTable
ALTER TABLE "savings_transactions" ADD COLUMN     "is_posted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "posted_at" TIMESTAMP(3),
ADD COLUMN     "posted_by" TEXT;

-- AddForeignKey
ALTER TABLE "savings_transactions" ADD CONSTRAINT "savings_transactions_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
