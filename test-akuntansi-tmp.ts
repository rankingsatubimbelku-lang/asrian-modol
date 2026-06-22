import { prisma } from "@/lib/prisma"
import { getNeraca } from "@/actions/akuntansi.actions"

async function main() {
  const journalCount = await prisma.journalEntry.count()
  console.log("Total jurnal:", journalCount)

  // Panggil langsung logic getNeraca tanpa requireSuperAdmin guard — replikasi manual untuk test
  const accounts = await prisma.account.findMany()
  const sums = await prisma.journalEntryLine.groupBy({
    by: ["accountId"],
    _sum: { debit: true, kredit: true },
  })
  const sumMap = new Map(sums.map(s => [s.accountId, s]))
  const debitNormal = ["ASET", "BEBAN"]
  let totalAset = 0, totalKewajiban = 0, totalModal = 0, totalPendapatan = 0, totalBeban = 0
  for (const akun of accounts) {
    const s = sumMap.get(akun.id)
    const d = Number(s?._sum.debit ?? 0)
    const k = Number(s?._sum.kredit ?? 0)
    const saldo = debitNormal.includes(akun.tipe) ? d - k : k - d
    if (akun.tipe === "ASET") totalAset += saldo
    if (akun.tipe === "KEWAJIBAN") totalKewajiban += saldo
    if (akun.tipe === "MODAL") totalModal += saldo
    if (akun.tipe === "PENDAPATAN") totalPendapatan += saldo
    if (akun.tipe === "BEBAN") totalBeban += saldo
    console.log(akun.kode, akun.nama, akun.tipe, "saldo:", saldo)
  }
  const labaBerjalan = totalPendapatan - totalBeban
  const totalKewajibanModal = totalKewajiban + totalModal + labaBerjalan
  console.log({ totalAset, totalKewajibanModal, labaBerjalan, selisih: totalAset - totalKewajibanModal })
}

main().catch(console.error).finally(() => prisma.$disconnect())
