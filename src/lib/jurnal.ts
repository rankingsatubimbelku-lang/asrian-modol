import { prisma } from "@/lib/prisma"
import { generateNomorTransaksi } from "@/lib/format"
import type { Prisma } from "@prisma/client"

export interface JurnalLine {
  kodeAkun: string
  debit?: number
  kredit?: number
}

interface BuatJurnalParams {
  tanggal: Date
  deskripsi: string
  sourceModule: string
  sourceId: string
  lines: JurnalLine[]
  userId: string
  tx?: Prisma.TransactionClient
}

/**
 * Membuat jurnal otomatis untuk satu event transaksi. Idempotent terhadap
 * (sourceModule, sourceId) — jika jurnal untuk source ini sudah ada, dikembalikan
 * tanpa membuat duplikat (BR-AKT-04, prd-akuntansi.md §6).
 */
export async function buatJurnal({
  tanggal, deskripsi, sourceModule, sourceId, lines, userId, tx,
}: BuatJurnalParams) {
  const db = tx ?? prisma

  const totalDebit = lines.reduce((a, l) => a + (l.debit ?? 0), 0)
  const totalKredit = lines.reduce((a, l) => a + (l.kredit ?? 0), 0)
  if (Math.round(totalDebit) !== Math.round(totalKredit)) {
    throw new Error(`Jurnal tidak balance: debit ${totalDebit} != kredit ${totalKredit}`)
  }

  const existing = await db.journalEntry.findUnique({
    where: { sourceModule_sourceId_isReversal: { sourceModule, sourceId, isReversal: false } },
  })
  if (existing) return existing

  const accounts = await db.account.findMany({
    where: { kode: { in: lines.map(l => l.kodeAkun) } },
  })
  const accountMap = new Map(accounts.map(a => [a.kode, a.id]))
  for (const line of lines) {
    if (!accountMap.has(line.kodeAkun)) {
      throw new Error(`Akun dengan kode ${line.kodeAkun} tidak ditemukan di Chart of Accounts`)
    }
  }

  let nomorJurnal = generateNomorTransaksi("JRN")
  while (await db.journalEntry.findUnique({ where: { nomorJurnal } })) {
    nomorJurnal = generateNomorTransaksi("JRN")
  }

  return db.journalEntry.create({
    data: {
      nomorJurnal,
      tanggal,
      deskripsi,
      sourceModule,
      sourceId,
      createdBy: userId,
      lines: {
        create: lines.map(l => ({
          accountId: accountMap.get(l.kodeAkun)!,
          debit: l.debit ?? 0,
          kredit: l.kredit ?? 0,
        })),
      },
    },
  })
}

/**
 * Membuat jurnal pembalik (reversal) dari jurnal yang sudah ada — debit dan
 * kredit ditukar. Jurnal asli tidak diedit/dihapus (BR-AKT-03).
 */
export async function buatJurnalPembalik(journalEntryId: string, userId: string) {
  const original = await prisma.journalEntry.findUnique({
    where: { id: journalEntryId },
    include: { lines: { include: { account: true } } },
  })
  if (!original) throw new Error("Jurnal asal tidak ditemukan")

  const existing = await prisma.journalEntry.findUnique({
    where: {
      sourceModule_sourceId_isReversal: {
        sourceModule: original.sourceModule,
        sourceId: original.sourceId,
        isReversal: true,
      },
    },
  })
  if (existing) return existing

  let nomorJurnal = generateNomorTransaksi("JRN")
  while (await prisma.journalEntry.findUnique({ where: { nomorJurnal } })) {
    nomorJurnal = generateNomorTransaksi("JRN")
  }

  return prisma.journalEntry.create({
    data: {
      nomorJurnal,
      tanggal: new Date(),
      deskripsi: `Pembalik dari ${original.nomorJurnal} — ${original.deskripsi}`,
      sourceModule: original.sourceModule,
      sourceId: original.sourceId,
      isReversal: true,
      reversalOfId: original.id,
      createdBy: userId,
      lines: {
        create: original.lines.map(l => ({
          accountId: l.accountId,
          debit: l.kredit,
          kredit: l.debit,
        })),
      },
    },
  })
}
