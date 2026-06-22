"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin, resolveDbUserId } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/audit"
import { generateNomorTransaksi } from "@/lib/format"
import { createTransaksiSchema } from "@/validations/transaksi.schema"
import { buatJurnal, buatJurnalPembalik } from "@/lib/jurnal"

function jurnalLinesTransaksi(jenis: string, nominal: number) {
  if (jenis === "PEMASUKAN") return [{ kodeAkun: "1001", debit: nominal }, { kodeAkun: "4003", kredit: nominal }]
  return [{ kodeAkun: "5002", debit: nominal }, { kodeAkun: "1001", kredit: nominal }] // PENGELUARAN
}

export async function createTransaksi(formData: FormData) {
  const session = await requireAdmin()

  const parsed = createTransaksiSchema.safeParse({
    jenis: formData.get("jenis"),
    kategori: formData.get("kategori"),
    nominal: formData.get("nominal"),
    tanggal: formData.get("tanggal"),
    keterangan: formData.get("keterangan"),
  })

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  const d = parsed.data

  try {
    const createdById = await resolveDbUserId(session.user.id)

    let nomorTransaksi = generateNomorTransaksi("TRX")
    while (await prisma.generalTransaction.findUnique({ where: { nomorTransaksi } })) {
      nomorTransaksi = generateNomorTransaksi("TRX")
    }

    const trx = await prisma.generalTransaction.create({
      data: {
        nomorTransaksi,
        jenis: d.jenis,
        kategori: d.kategori,
        nominal: parseFloat(d.nominal),
        tanggal: new Date(d.tanggal),
        keterangan: d.keterangan,
        createdBy: createdById,
      },
    })

    await buatJurnal({
      tanggal: trx.tanggal,
      deskripsi: `${d.jenis === "PEMASUKAN" ? "Pemasukan" : "Pengeluaran"} — ${d.kategori} (${trx.nomorTransaksi})`,
      sourceModule: "TRANSAKSI_UMUM",
      sourceId: trx.id,
      lines: jurnalLinesTransaksi(d.jenis, Number(trx.nominal)),
      userId: createdById,
    })

    await logActivity({
      userId: session.user.id,
      module: "transaksi",
      action: "CREATE",
      entityId: trx.id,
      dataBaru: { jenis: d.jenis, kategori: d.kategori, nominal: d.nominal },
    })

    revalidatePath("/transaksi")
    return { success: true, nomorTransaksi: trx.nomorTransaksi }
  } catch {
    return { success: false, error: "Gagal mencatat transaksi" }
  }
}

export async function updateTransaksi(id: string, formData: FormData) {
  const session = await requireAdmin()

  const parsed = createTransaksiSchema.safeParse({
    jenis: formData.get("jenis"),
    kategori: formData.get("kategori"),
    nominal: formData.get("nominal"),
    tanggal: formData.get("tanggal"),
    keterangan: formData.get("keterangan"),
  })

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  const d = parsed.data

  try {
    const existing = await prisma.generalTransaction.findUnique({ where: { id } })
    if (!existing) return { success: false, error: "Transaksi tidak ditemukan" }

    await prisma.generalTransaction.update({
      where: { id },
      data: {
        jenis: d.jenis,
        kategori: d.kategori,
        nominal: parseFloat(d.nominal),
        tanggal: new Date(d.tanggal),
        keterangan: d.keterangan,
      },
    })

    await logActivity({
      userId: session.user.id,
      module: "transaksi",
      action: "UPDATE",
      entityId: id,
      dataLama: {
        jenis: existing.jenis,
        kategori: existing.kategori,
        nominal: String(existing.nominal),
        tanggal: existing.tanggal.toISOString(),
      },
    })

    revalidatePath("/transaksi")
    return { success: true }
  } catch {
    return { success: false, error: "Gagal memperbarui transaksi" }
  }
}

export async function deleteTransaksi(id: string) {
  const session = await requireAdmin()

  try {
    await prisma.generalTransaction.delete({ where: { id } })
    await logActivity({ userId: session.user.id, module: "transaksi", action: "DELETE", entityId: id })
    revalidatePath("/transaksi")
    return { success: true }
  } catch {
    return { success: false, error: "Gagal menghapus transaksi" }
  }
}
