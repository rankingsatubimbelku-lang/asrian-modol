import { prisma } from "@/lib/prisma"

async function main() {
  const pendingCount = await prisma.savingsTransaction.count({ where: { isPosted: false } })
  const postedCount = await prisma.savingsTransaction.count({ where: { isPosted: true } })
  const journalCount = await prisma.journalEntry.count()
  const accountCount = await prisma.account.count()
  console.log({ pendingCount, postedCount, journalCount, accountCount })
}

main().catch(console.error).finally(() => prisma.$disconnect())
