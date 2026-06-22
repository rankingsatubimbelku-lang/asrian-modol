// Backfill jurnal untuk transaksi yang sudah ada SEBELUM modul akuntansi aktif
// (lihat prd-akuntansi.md §14 Roadmap & §15 Risk R-AKT-02).
import { PrismaClient } from "@prisma/client"
import { buatJurnal } from "../src/lib/jurnal"

const prisma = new PrismaClient()

function jurnalLinesTabungan(jenis: string, nominal: number) {
  if (jenis === "SETORAN") return [{ kodeAkun: "1001", debit: nominal }, { kodeAkun: "2001", kredit: nominal }]
  if (jenis === "PENARIKAN") return [{ kodeAkun: "2001", debit: nominal }, { kodeAkun: "1001", kredit: nominal }]
  return [{ kodeAkun: "5001", debit: nominal }, { kodeAkun: "2001", kredit: nominal }]
}

function jurnalLinesTransaksi(jenis: string, nominal: number) {
  if (jenis === "PEMASUKAN") return [{ kodeAkun: "1001", debit: nominal }, { kodeAkun: "4003", kredit: nominal }]
  return [{ kodeAkun: "5002", debit: nominal }, { kodeAkun: "1001", kredit: nominal }]
}

async function main() {
  const fallbackUser = await prisma.user.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } },
    orderBy: { createdAt: "asc" },
  })
  if (!fallbackUser) {
    console.log("Tidak ada admin user — backfill dibatalkan")
    return
  }

  let jumlahDibuat = 0

  // 1. Tabungan yang sudah diposting
  const postedSavings = await prisma.savingsTransaction.findMany({ where: { isPosted: true } })
  for (const trx of postedSavings) {
    const j = await buatJurnal({
      tanggal: trx.tanggal,
      deskripsi: `${trx.jenis} tabungan — ${trx.nomorTransaksi} (backfill)`,
      sourceModule: "TABUNGAN",
      sourceId: trx.id,
      lines: jurnalLinesTabungan(trx.jenis, Number(trx.nominal)),
      userId: trx.postedBy ?? fallbackUser.id,
    })
    if (j) jumlahDibuat++
  }
  console.log(`✅ Tabungan: ${postedSavings.length} transaksi diproses`)

  // 2. Kredit — pencairan (loan yang sudah DISETUJUI atau LUNAS)
  const loans = await prisma.loan.findMany({ where: { status: { in: ["DISETUJUI", "LUNAS"] } } })
  for (const loan of loans) {
    await buatJurnal({
      tanggal: loan.tanggalDisetujui ?? loan.tanggalPengajuan,
      deskripsi: `Pencairan kredit — ${loan.nomorPengajuan} (backfill)`,
      sourceModule: "KREDIT",
      sourceId: loan.id,
      lines: [
        { kodeAkun: "1101", debit: Number(loan.nominalPinjaman) },
        { kodeAkun: "1001", kredit: Number(loan.nominalPinjaman) },
      ],
      userId: loan.approvedBy ?? fallbackUser.id,
    })
  }
  console.log(`✅ Kredit (pencairan): ${loans.length} pinjaman diproses`)

  // 3. Kredit — angsuran yang sudah LUNAS
  const installments = await prisma.loanInstallment.findMany({
    where: { status: "LUNAS", tanggalBayar: { not: null } },
  })
  for (const inst of installments) {
    const bunga = Number(inst.nominalBunga)
    const pokok = Number(inst.nominalPokok)
    await buatJurnal({
      tanggal: inst.tanggalBayar!,
      deskripsi: `Pembayaran angsuran ke-${inst.ke} (backfill)`,
      sourceModule: "KREDIT",
      sourceId: inst.id,
      lines: [
        { kodeAkun: "1001", debit: bunga + pokok },
        { kodeAkun: "1101", kredit: pokok },
        { kodeAkun: "4001", kredit: bunga },
      ],
      userId: fallbackUser.id,
    })
  }
  console.log(`✅ Kredit (angsuran lunas): ${installments.length} angsuran diproses`)

  // 4. Transaksi kas umum
  const generalTrx = await prisma.generalTransaction.findMany()
  for (const trx of generalTrx) {
    await buatJurnal({
      tanggal: trx.tanggal,
      deskripsi: `${trx.jenis === "PEMASUKAN" ? "Pemasukan" : "Pengeluaran"} — ${trx.kategori} (${trx.nomorTransaksi}) (backfill)`,
      sourceModule: "TRANSAKSI_UMUM",
      sourceId: trx.id,
      lines: jurnalLinesTransaksi(trx.jenis, Number(trx.nominal)),
      userId: trx.createdBy,
    })
  }
  console.log(`✅ Transaksi Umum: ${generalTrx.length} transaksi diproses`)

  console.log(`\nBackfill selesai. ${jumlahDibuat} jurnal baru dibuat (sisanya sudah ada/idempotent).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
