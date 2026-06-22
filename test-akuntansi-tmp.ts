import { prisma } from "@/lib/prisma"
import { buatJurnal } from "@/lib/jurnal"

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } } })
  if (!admin) { console.log("Tidak ada admin user"); return }

  const j = await buatJurnal({
    tanggal: new Date(),
    deskripsi: "TEST — setoran tabungan",
    sourceModule: "TEST",
    sourceId: `test-${Date.now()}`,
    lines: [{ kodeAkun: "1001", debit: 100000 }, { kodeAkun: "2001", kredit: 100000 }],
    userId: admin.id,
  })
  console.log("Jurnal dibuat:", j.nomorJurnal)

  const lines = await prisma.journalEntryLine.findMany({ where: { journalEntryId: j.id } })
  const totalDebit = lines.reduce((a, l) => a + Number(l.debit), 0)
  const totalKredit = lines.reduce((a, l) => a + Number(l.kredit), 0)
  console.log("Total debit:", totalDebit, "Total kredit:", totalKredit, "Balance:", totalDebit === totalKredit)

  await prisma.journalEntryLine.deleteMany({ where: { journalEntryId: j.id } })
  await prisma.journalEntry.delete({ where: { id: j.id } })
  console.log("Test journal cleaned up")
}

main().catch(console.error).finally(() => prisma.$disconnect())
