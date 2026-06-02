"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin, resolveDbUserId } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/audit"
import { generateNomorTransaksi } from "@/lib/format"
import { savingTransactionSchema, savingInterestSettingSchema } from "@/validations/saving.schema"

export async function inputTransaksiTabungan(formData: FormData) {
  const session = await requireAdmin()

  const parsed = savingTransactionSchema.safeParse({
    memberId: formData.get("memberId"),
    jenis: formData.get("jenis"),
    nominal: formData.get("nominal"),
    tanggal: formData.get("tanggal"),
    keterangan: formData.get("keterangan"),
  })

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  const d = parsed.data
  const nominal = parseFloat(d.nominal)

  try {
    const saving = await prisma.saving.findUnique({ where: { memberId: d.memberId } })
    if (!saving) return { success: false, error: "Rekening tabungan tidak ditemukan" }

    if (d.jenis === "PENARIKAN" && Number(saving.saldo) < nominal) {
      return { success: false, error: "Saldo tidak mencukupi" }
    }

    let nomorTransaksi = generateNomorTransaksi("SAV")
    while (await prisma.savingsTransaction.findUnique({ where: { nomorTransaksi } })) {
      nomorTransaksi = generateNomorTransaksi("SAV")
    }

    const newSaldo = d.jenis === "SETORAN"
      ? Number(saving.saldo) + nominal
      : Number(saving.saldo) - nominal

    await prisma.$transaction([
      prisma.savingsTransaction.create({
        data: {
          nomorTransaksi,
          savingId: saving.id,
          memberId: d.memberId,
          jenis: d.jenis,
          nominal,
          keterangan: d.keterangan,
          tanggal: new Date(d.tanggal),
          createdBy: session.user.id,
        },
      }),
      prisma.saving.update({
        where: { id: saving.id },
        data: { saldo: newSaldo },
      }),
    ])

    await logActivity({
      userId: session.user.id,
      module: "tabungan",
      action: d.jenis,
      dataBaru: { nomorTransaksi, nominal, jenis: d.jenis },
    })

    revalidatePath("/tabungan")
    return { success: true }
  } catch {
    return { success: false, error: "Gagal mencatat transaksi" }
  }
}

export async function saveSavingInterestSetting(formData: FormData) {
  const session = await requireAdmin()

  const parsed = savingInterestSettingSchema.safeParse({
    persentase: formData.get("persentase"),
    periode: formData.get("periode"),
    berlakuMulai: formData.get("berlakuMulai"),
  })

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  const d = parsed.data

  try {
    await prisma.savingsInterestSetting.updateMany({ data: { isActive: false } })

    const setting = await prisma.savingsInterestSetting.create({
      data: {
        persentase: parseFloat(d.persentase),
        periode: d.periode,
        berlakuMulai: new Date(d.berlakuMulai),
        isActive: true,
        createdBy: session.user.id,
      },
    })

    await logActivity({ userId: session.user.id, module: "tabungan", action: "SET_BUNGA", entityId: setting.id })
    revalidatePath("/pengaturan/bunga-tabungan")
    return { success: true }
  } catch {
    return { success: false, error: "Gagal menyimpan setting bunga" }
  }
}

export async function hitungBungaOtomatis() {
  const session = await requireAdmin()

  try {
    const setting = await prisma.savingsInterestSetting.findFirst({ where: { isActive: true } })
    if (!setting) return { success: false, error: "Belum ada setting bunga aktif" }

    const bulanIni = new Date().toISOString().slice(0, 7)
    const savings = await prisma.saving.findMany({ where: { saldo: { gt: 0 } } })

    let processed = 0
    for (const s of savings) {
      const sudahDihitung = await prisma.savingsInterest.findFirst({
        where: { savingId: s.id, periode: bulanIni },
      })
      if (sudahDihitung) continue

      const persentase = Number(setting.persentase)
      const saldo = Number(s.saldo)
      const bunga = setting.periode === "BULANAN"
        ? (saldo * persentase) / 100
        : (saldo * persentase) / 100 / 12

      const nominalBunga = Math.round(bunga)
      if (nominalBunga <= 0) continue

      let nomorTransaksi = generateNomorTransaksi("SAV")
      while (await prisma.savingsTransaction.findUnique({ where: { nomorTransaksi } })) {
        nomorTransaksi = generateNomorTransaksi("SAV")
      }

      await prisma.$transaction([
        prisma.savingsInterest.create({
          data: { savingId: s.id, settingId: setting.id, nominalBunga, periode: bulanIni },
        }),
        prisma.savingsTransaction.create({
          data: {
            nomorTransaksi, savingId: s.id, memberId: s.memberId,
            jenis: "BUNGA", nominal: nominalBunga,
            keterangan: `Bunga tabungan ${bulanIni}`,
            tanggal: new Date(), createdBy: session.user.id,
          },
        }),
        prisma.saving.update({ where: { id: s.id }, data: { saldo: Number(s.saldo) + nominalBunga } }),
      ])
      processed++
    }

    await logActivity({ userId: session.user.id, module: "tabungan", action: "HITUNG_BUNGA", dataBaru: { periode: bulanIni, processed } })
    revalidatePath("/tabungan")
    return { success: true, processed }
  } catch {
    return { success: false, error: "Gagal menghitung bunga" }
  }
}

export async function postingTabungan(savingId: string) {
  const session = await requireAdmin()

  try {
    // Ambil semua transaksi yang belum diposting
    const pending = await prisma.savingsTransaction.findMany({
      where: { savingId, isPosted: false },
      select: { id: true },
    })

    if (pending.length === 0) {
      return { success: false, error: "Tidak ada transaksi pending yang perlu diposting" }
    }

    const now = new Date()
    await prisma.savingsTransaction.updateMany({
      where: { savingId, isPosted: false },
      data: {
        isPosted: true,
        postedAt: now,
        postedBy: session.user.id,
      },
    })

    await logActivity({
      userId: session.user.id,
      module: "tabungan",
      action: "POSTING",
      entityId: savingId,
      dataBaru: { jumlahTransaksi: pending.length, postedAt: now },
    })

    revalidatePath(`/tabungan/${savingId}`)
    revalidatePath("/tabungan/laporan")
    return { success: true, jumlah: pending.length }
  } catch {
    return { success: false, error: "Gagal melakukan posting" }
  }
}

export async function postingSemuaTabungan(tanggal?: string) {
  const session = await requireAdmin()

  try {
    // Filter by tanggal jika diisi, atau semua pending
    const where = {
      isPosted: false,
      ...(tanggal ? { tanggal: new Date(tanggal) } : {}),
    }

    const pending = await prisma.savingsTransaction.findMany({
      where,
      select: { id: true },
    })

    if (pending.length === 0) {
      return { success: false, error: tanggal
        ? `Tidak ada transaksi pending pada tanggal ${tanggal}`
        : "Tidak ada transaksi pending"
      }
    }

    const now = new Date()
    await prisma.savingsTransaction.updateMany({
      where,
      data: {
        isPosted: true,
        postedAt: now,
        postedBy: session.user.id,
      },
    })

    await logActivity({
      userId: session.user.id,
      module: "tabungan",
      action: "POSTING_BATCH",
      dataBaru: { jumlah: pending.length, tanggal: tanggal ?? "semua", postedAt: now },
    })

    revalidatePath("/tabungan/laporan")
    revalidatePath("/tabungan")
    return { success: true, jumlah: pending.length }
  } catch {
    return { success: false, error: "Gagal melakukan batch posting" }
  }
}
