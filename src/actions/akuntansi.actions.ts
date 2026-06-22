"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin, requireSuperAdmin } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/audit"
import { createAccountSchema } from "@/validations/akuntansi.schema"
import { buatJurnalPembalik } from "@/lib/jurnal"

const SALDO_DEBIT_NORMAL = ["ASET", "BEBAN"]

// ==================== CHART OF ACCOUNTS ====================

export async function getAccounts() {
  await requireAdmin()
  return prisma.account.findMany({ orderBy: { kode: "asc" } })
}

export async function createAccount(formData: FormData) {
  const session = await requireSuperAdmin()

  const parsed = createAccountSchema.safeParse({
    kode: formData.get("kode"),
    nama: formData.get("nama"),
    tipe: formData.get("tipe"),
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  try {
    const existing = await prisma.account.findUnique({ where: { kode: parsed.data.kode } })
    if (existing) return { success: false, error: "Kode akun sudah digunakan" }

    const akun = await prisma.account.create({ data: parsed.data })
    await logActivity({ userId: session.user.id, module: "akuntansi", action: "CREATE_AKUN", entityId: akun.id })
    revalidatePath("/akuntansi/akun")
    return { success: true }
  } catch {
    return { success: false, error: "Gagal membuat akun" }
  }
}

export async function toggleAccountActive(accountId: string) {
  const session = await requireSuperAdmin()

  try {
    const akun = await prisma.account.findUnique({ where: { id: accountId } })
    if (!akun) return { success: false, error: "Akun tidak ditemukan" }

    await prisma.account.update({ where: { id: accountId }, data: { isActive: !akun.isActive } })
    await logActivity({ userId: session.user.id, module: "akuntansi", action: "TOGGLE_AKUN", entityId: accountId })
    revalidatePath("/akuntansi/akun")
    return { success: true }
  } catch {
    return { success: false, error: "Gagal mengubah status akun" }
  }
}

// ==================== SALDO HELPER ====================

async function getSaldoSemuaAkun(perTanggal: Date) {
  const accounts = await prisma.account.findMany({ orderBy: { kode: "asc" } })
  const sums = await prisma.journalEntryLine.groupBy({
    by: ["accountId"],
    where: { journalEntry: { tanggal: { lte: perTanggal } } },
    _sum: { debit: true, kredit: true },
  })
  const sumMap = new Map(sums.map(s => [s.accountId, s]))

  return accounts.map(akun => {
    const s = sumMap.get(akun.id)
    const totalDebit = Number(s?._sum.debit ?? 0)
    const totalKredit = Number(s?._sum.kredit ?? 0)
    const saldo = SALDO_DEBIT_NORMAL.includes(akun.tipe) ? totalDebit - totalKredit : totalKredit - totalDebit
    return { ...akun, totalDebit, totalKredit, saldo }
  })
}

// ==================== LAPORAN LABA RUGI ====================

export async function getLabaRugi(dari: Date, sampai: Date) {
  await requireAdmin()

  const accounts = await prisma.account.findMany({
    where: { tipe: { in: ["PENDAPATAN", "BEBAN"] } },
    orderBy: { kode: "asc" },
  })
  const sums = await prisma.journalEntryLine.groupBy({
    by: ["accountId"],
    where: { journalEntry: { tanggal: { gte: dari, lte: sampai } } },
    _sum: { debit: true, kredit: true },
  })
  const sumMap = new Map(sums.map(s => [s.accountId, s]))

  const baris = accounts.map(akun => {
    const s = sumMap.get(akun.id)
    const totalDebit = Number(s?._sum.debit ?? 0)
    const totalKredit = Number(s?._sum.kredit ?? 0)
    const saldo = akun.tipe === "PENDAPATAN" ? totalKredit - totalDebit : totalDebit - totalKredit
    return { id: akun.id, kode: akun.kode, nama: akun.nama, tipe: akun.tipe, saldo }
  })

  const pendapatan = baris.filter(b => b.tipe === "PENDAPATAN")
  const beban = baris.filter(b => b.tipe === "BEBAN")
  const totalPendapatan = pendapatan.reduce((a, b) => a + b.saldo, 0)
  const totalBeban = beban.reduce((a, b) => a + b.saldo, 0)

  return {
    pendapatan,
    beban,
    totalPendapatan,
    totalBeban,
    labaBersih: totalPendapatan - totalBeban,
  }
}

// Tren laba bersih per bulan untuk grafik dashboard — N bulan terakhir termasuk bulan ini.
export async function getLabaBersihBulanan(jumlahBulan = 12) {
  await requireAdmin()

  const sejak = new Date()
  sejak.setMonth(sejak.getMonth() - (jumlahBulan - 1))
  sejak.setDate(1)
  sejak.setHours(0, 0, 0, 0)

  const rows = await prisma.$queryRaw<
    { bulan: string; tipe: string; total_debit: string; total_kredit: string }[]
  >`
    SELECT to_char(je.tanggal, 'YYYY-MM') as bulan, a.tipe,
           SUM(jel.debit) as total_debit, SUM(jel.kredit) as total_kredit
    FROM journal_entry_lines jel
    JOIN journal_entries je ON jel."journal_entry_id" = je.id
    JOIN accounts a ON jel."account_id" = a.id
    WHERE a.tipe IN ('PENDAPATAN', 'BEBAN') AND je.tanggal >= ${sejak}
    GROUP BY bulan, a.tipe
  `

  const perBulan = new Map<string, { pendapatan: number; beban: number }>()
  for (const r of rows) {
    const entry = perBulan.get(r.bulan) ?? { pendapatan: 0, beban: 0 }
    const debit = Number(r.total_debit)
    const kredit = Number(r.total_kredit)
    if (r.tipe === "PENDAPATAN") entry.pendapatan += kredit - debit
    else entry.beban += debit - kredit
    perBulan.set(r.bulan, entry)
  }

  const hasil = []
  const cursor = new Date(sejak)
  for (let i = 0; i < jumlahBulan; i++) {
    const key = cursor.toISOString().slice(0, 7)
    const data = perBulan.get(key) ?? { pendapatan: 0, beban: 0 }
    hasil.push({ bulan: key, pendapatan: data.pendapatan, beban: data.beban, labaBersih: data.pendapatan - data.beban })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return hasil
}

// ==================== LAPORAN NERACA ====================

export async function getNeraca(perTanggal: Date) {
  await requireSuperAdmin()

  const semua = await getSaldoSemuaAkun(perTanggal)
  const aset = semua.filter(a => a.tipe === "ASET")
  const kewajiban = semua.filter(a => a.tipe === "KEWAJIBAN")
  const modal = semua.filter(a => a.tipe === "MODAL")
  const pendapatan = semua.filter(a => a.tipe === "PENDAPATAN")
  const beban = semua.filter(a => a.tipe === "BEBAN")

  const totalAset = aset.reduce((a, b) => a + b.saldo, 0)
  const totalKewajiban = kewajiban.reduce((a, b) => a + b.saldo, 0)
  const totalModalAwal = modal.reduce((a, b) => a + b.saldo, 0)
  const labaBerjalan = pendapatan.reduce((a, b) => a + b.saldo, 0) - beban.reduce((a, b) => a + b.saldo, 0)
  const totalModal = totalModalAwal + labaBerjalan
  const totalKewajibanModal = totalKewajiban + totalModal

  return {
    perTanggal,
    aset, kewajiban, modal,
    labaBerjalan,
    totalAset,
    totalKewajiban,
    totalModal,
    totalKewajibanModal,
    selisih: Math.round((totalAset - totalKewajibanModal) * 100) / 100,
  }
}

// ==================== AUDIT SELISIH NERACA (§9.4 / §11.1 PRD) ====================

export async function getAuditSelisihNeraca(perTanggal: Date) {
  await requireSuperAdmin()

  // LAPIS 1 — jurnal individual yang lolos tapi sebenarnya tidak balance
  const jurnalTidakBalanceRaw = await prisma.$queryRaw<
    { id: string; nomor_jurnal: string; tanggal: Date; deskripsi: string; total_debit: string; total_kredit: string }[]
  >`
    SELECT je.id, je."nomor_jurnal", je.tanggal, je.deskripsi,
           SUM(jel.debit) as total_debit, SUM(jel.kredit) as total_kredit
    FROM journal_entries je
    JOIN journal_entry_lines jel ON jel."journal_entry_id" = je.id
    WHERE je.tanggal <= ${perTanggal}
    GROUP BY je.id, je."nomor_jurnal", je.tanggal, je.deskripsi
    HAVING SUM(jel.debit) <> SUM(jel.kredit)
  `

  const jurnalTidakBalance = jurnalTidakBalanceRaw.map(j => ({
    journalEntryId: j.id,
    nomorJurnal: j.nomor_jurnal,
    tanggal: j.tanggal,
    deskripsi: j.deskripsi,
    totalDebit: Number(j.total_debit),
    totalKredit: Number(j.total_kredit),
    selisih: Number(j.total_debit) - Number(j.total_kredit),
  }))

  // LAPIS 2 — hanya relevan jika Lapis 1 kosong tapi Neraca tetap tidak balance:
  // cari akun dengan saldo "tidak normal" (red flag salah klasifikasi tipe akun)
  const semuaAkun = await getSaldoSemuaAkun(perTanggal)
  const akunMencurigakan = semuaAkun
    .filter(a => a.saldo < 0 && (a.totalDebit > 0 || a.totalKredit > 0))
    .map(a => ({
      accountId: a.id,
      kode: a.kode,
      nama: a.nama,
      tipe: a.tipe,
      saldoSeharusnya: (SALDO_DEBIT_NORMAL.includes(a.tipe) ? "DEBIT" : "KREDIT") as "DEBIT" | "KREDIT",
      saldoAktual: (SALDO_DEBIT_NORMAL.includes(a.tipe) ? "KREDIT" : "DEBIT") as "DEBIT" | "KREDIT",
      nominal: Math.abs(a.saldo),
    }))

  const neraca = await getNeraca(perTanggal)

  return {
    totalSelisih: neraca.selisih,
    jurnalTidakBalance,
    akunMencurigakan: jurnalTidakBalance.length === 0 ? akunMencurigakan : [],
  }
}

// ==================== BUKU BESAR ====================

export async function getBukuBesar(accountId: string, dari?: Date, sampai?: Date) {
  await requireSuperAdmin()

  const account = await prisma.account.findUnique({ where: { id: accountId } })
  if (!account) return null

  const lines = await prisma.journalEntryLine.findMany({
    where: {
      accountId,
      journalEntry: {
        ...(dari || sampai ? { tanggal: { ...(dari ? { gte: dari } : {}), ...(sampai ? { lte: sampai } : {}) } } : {}),
      },
    },
    include: { journalEntry: true },
    orderBy: [{ journalEntry: { tanggal: "asc" } }, { journalEntry: { createdAt: "asc" } }],
  })

  let saldoBerjalan = 0
  const mutasi = lines.map(l => {
    const debit = Number(l.debit)
    const kredit = Number(l.kredit)
    saldoBerjalan += SALDO_DEBIT_NORMAL.includes(account.tipe) ? debit - kredit : kredit - debit
    return {
      id: l.id,
      journalEntryId: l.journalEntry.id,
      nomorJurnal: l.journalEntry.nomorJurnal,
      tanggal: l.journalEntry.tanggal,
      deskripsi: l.journalEntry.deskripsi,
      isReversal: l.journalEntry.isReversal,
      debit,
      kredit,
      saldoBerjalan,
    }
  })

  return { account, mutasi }
}

export async function reverseJournalEntry(journalEntryId: string) {
  const session = await requireSuperAdmin()

  try {
    await buatJurnalPembalik(journalEntryId, session.user.id)
    await logActivity({ userId: session.user.id, module: "akuntansi", action: "REVERSAL", entityId: journalEntryId })
    revalidatePath("/akuntansi/buku-besar")
    revalidatePath("/akuntansi/neraca")
    return { success: true }
  } catch {
    return { success: false, error: "Gagal membuat jurnal pembalik" }
  }
}
