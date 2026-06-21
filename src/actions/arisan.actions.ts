"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin, resolveDbUserId } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/audit"
import { createPeriodeSchema, inputIuranSchema, undianSchema } from "@/validations/arisan.schema"

export async function createPeriode(formData: FormData) {
  const session = await requireAdmin()

  const parsed = createPeriodeSchema.safeParse({
    namaPeriode: formData.get("namaPeriode"),
    tanggalMulai: formData.get("tanggalMulai"),
    tanggalSelesai: formData.get("tanggalSelesai"),
    besarIuran: formData.get("besarIuran"),
    maxPemenangPerBulan: formData.get("maxPemenangPerBulan"),
  })

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  const d = parsed.data

  try {
    const createdById = await resolveDbUserId(session.user.id)
    // Buat periode dan langsung mapping semua anggota aktif dalam satu transaksi
    const aktifMembers = await prisma.member.findMany({
      where: { status: "AKTIF" },
      select: { id: true },
    })

    const periode = await prisma.$transaction(async (tx) => {
      const p = await tx.arisanPeriod.create({
        data: {
          namaPeriode: d.namaPeriode,
          tanggalMulai: new Date(d.tanggalMulai),
          tanggalSelesai: new Date(d.tanggalSelesai),
          besarIuran: parseFloat(d.besarIuran),
          maxPemenangPerBulan: parseInt(d.maxPemenangPerBulan),
          status: "DRAFT",
          createdBy: createdById,
        },
      })

      // Auto-mapping semua anggota aktif ke periode ini
      if (aktifMembers.length > 0) {
        await tx.arisanMember.createMany({
          data: aktifMembers.map((m) => ({ periodId: p.id, memberId: m.id })),
          skipDuplicates: true,
        })
      }

      return p
    })

    await logActivity({
      userId: session.user.id,
      module: "arisan",
      action: "CREATE_PERIODE",
      entityId: periode.id,
      dataBaru: { namaPeriode: d.namaPeriode, jumlahAnggota: aktifMembers.length },
    })
    revalidatePath("/arisan/periode")
    return { success: true, data: periode, jumlahAnggota: aktifMembers.length }
  } catch {
    return { success: false, error: "Gagal membuat periode arisan" }
  }
}

export async function activatePeriode(id: string) {
  const session = await requireAdmin()

  try {
    const existing = await prisma.arisanPeriod.findFirst({ where: { status: "AKTIF" } })
    if (existing && existing.id !== id) {
      return { success: false, error: "Masih ada periode arisan yang aktif" }
    }

    await prisma.arisanPeriod.update({ where: { id }, data: { status: "AKTIF" } })

    // Daftarkan semua anggota aktif ke periode ini
    const aktifMembers = await prisma.member.findMany({ where: { status: "AKTIF" } })
    await prisma.arisanMember.createMany({
      data: aktifMembers.map((m) => ({ periodId: id, memberId: m.id })),
      skipDuplicates: true,
    })

    await logActivity({ userId: session.user.id, module: "arisan", action: "ACTIVATE_PERIODE", entityId: id })
    revalidatePath("/arisan/periode")
    return { success: true }
  } catch {
    return { success: false, error: "Gagal mengaktifkan periode" }
  }
}

export async function closePeriode(id: string) {
  const session = await requireAdmin()

  try {
    await prisma.arisanPeriod.update({ where: { id }, data: { status: "SELESAI" } })
    await logActivity({ userId: session.user.id, module: "arisan", action: "CLOSE_PERIODE", entityId: id })
    revalidatePath("/arisan/periode")
    return { success: true }
  } catch {
    return { success: false, error: "Gagal menutup periode" }
  }
}

export async function inputIuran(formData: FormData) {
  const session = await requireAdmin()

  const parsed = inputIuranSchema.safeParse({
    periodId: formData.get("periodId"),
    memberId: formData.get("memberId"),
    bulan: formData.get("bulan"),
    nominal: formData.get("nominal"),
    tanggalBayar: formData.get("tanggalBayar"),
  })

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  const d = parsed.data

  try {
    const createdById = await resolveDbUserId(session.user.id)
    const existing = await prisma.arisanPayment.findFirst({
      where: { periodId: d.periodId, memberId: d.memberId, bulan: d.bulan },
    })
    if (existing) return { success: false, error: "Iuran bulan ini sudah tercatat" }

    const payment = await prisma.arisanPayment.create({
      data: {
        periodId: d.periodId,
        memberId: d.memberId,
        bulan: d.bulan,
        nominal: parseFloat(d.nominal),
        tanggalBayar: new Date(d.tanggalBayar),
        status: "LUNAS",
        createdBy: createdById,
      },
    })

    await logActivity({ userId: session.user.id, module: "arisan", action: "INPUT_IURAN", entityId: payment.id })
    revalidatePath("/arisan/iuran")
    return { success: true }
  } catch {
    return { success: false, error: "Gagal mencatat iuran" }
  }
}

export async function jalankanUndian(formData: FormData) {
  const session = await requireAdmin()

  const parsed = undianSchema.safeParse({
    periodId: formData.get("periodId"),
    bulanUndian: formData.get("bulanUndian"),
    jumlahPemenang: formData.get("jumlahPemenang"),
  })

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  const d = parsed.data

  try {
    const createdById = await resolveDbUserId(session.user.id)
    const sudahUndian = await prisma.arisanDraw.findFirst({
      where: { periodId: d.periodId, bulanUndian: d.bulanUndian },
    })
    if (sudahUndian) return { success: false, error: "Undian bulan ini sudah dilakukan" }

    // Ambil kandidat (belum menang)
    const kandidat = await prisma.arisanMember.findMany({
      where: { periodId: d.periodId, sudahMenang: false },
      include: { member: true },
    })

    const jml = parseInt(d.jumlahPemenang)
    if (kandidat.length === 0) return { success: false, error: "Tidak ada kandidat untuk diundi" }
    if (kandidat.length < jml) return { success: false, error: `Kandidat hanya ${kandidat.length} orang` }

    // Random shuffle & ambil N pemenang
    const shuffled = kandidat.sort(() => Math.random() - 0.5).slice(0, jml)

    const periode = await prisma.arisanPeriod.findUnique({ where: { id: d.periodId } })
    const nominalHak = Number(periode?.besarIuran ?? 0) * kandidat.length

    await prisma.$transaction(async (tx) => {
      const draw = await tx.arisanDraw.create({
        data: {
          periodId: d.periodId,
          bulanUndian: d.bulanUndian,
          tanggalUndian: new Date(),
          jumlahPemenang: jml,
          createdBy: createdById,
        },
      })

      for (const k of shuffled) {
        await tx.arisanWinner.create({
          data: { drawId: draw.id, memberId: k.memberId, nominalHak },
        })
        await tx.arisanMember.update({
          where: { id: k.id },
          data: { sudahMenang: true, tanggalMenang: new Date() },
        })
      }
    }, { timeout: 20000 })

    await logActivity({ userId: session.user.id, module: "arisan", action: "UNDIAN", dataBaru: { bulan: d.bulanUndian, pemenang: jml } })
    revalidatePath("/arisan/undian")
    return { success: true, pemenang: shuffled.map((k) => k.member.namaLengkap) }
  } catch {
    return { success: false, error: "Gagal menjalankan undian" }
  }
}

// Simpan hasil undian dari spin wheel (winner sudah ditentukan di client)
export async function simpanHasilUndian(periodId: string, bulanUndian: string, winnerId: string) {
  const session = await requireAdmin()

  try {
    const createdById = await resolveDbUserId(session.user.id)

    // Validasi kandidat masih eligible
    const arisanMember = await prisma.arisanMember.findFirst({
      where: { periodId, memberId: winnerId, sudahMenang: false },
    })
    if (!arisanMember) return { success: false, error: "Anggota tidak eligible atau sudah pernah menang" }

    const periode = await prisma.arisanPeriod.findUnique({ where: { id: periodId } })
    if (!periode) return { success: false, error: "Periode tidak ditemukan" }

    const maxPemenang = periode.maxPemenangPerBulan

    // Validasi: cek sudah berapa pemenang bulan ini
    const pemenangBulanIni = await prisma.arisanWinner.count({
      where: { draw: { periodId, bulanUndian } },
    })
    if (pemenangBulanIni >= maxPemenang) {
      return {
        success: false,
        error: `Batas maksimal ${maxPemenang} pemenang untuk bulan ini sudah tercapai`,
      }
    }

    // nominalHak = total iuran anggota ÷ jumlah max pemenang per bulan
    const totalAnggota = await prisma.arisanMember.count({ where: { periodId } })
    const totalDana = Number(periode.besarIuran) * totalAnggota
    const nominalHak = Math.floor(totalDana / maxPemenang)

    await prisma.$transaction(async (tx) => {
      const draw = await tx.arisanDraw.create({
        data: {
          periodId,
          bulanUndian,
          tanggalUndian: new Date(),
          jumlahPemenang: 1,
          createdBy: createdById,
        },
      })

      await tx.arisanWinner.create({
        data: { drawId: draw.id, memberId: winnerId, nominalHak },
      })

      await tx.arisanMember.update({
        where: { id: arisanMember.id },
        data: { sudahMenang: true, tanggalMenang: new Date() },
      })
    })

    const member = await prisma.member.findUnique({ where: { id: winnerId }, select: { namaLengkap: true } })

    await logActivity({
      userId: session.user.id,
      module: "arisan",
      action: "UNDIAN_SPIN",
      dataBaru: { bulan: bulanUndian, pemenang: member?.namaLengkap },
    })

    revalidatePath("/arisan/undian")
    revalidatePath("/arisan/laporan")
    return { success: true, namaLengkap: member?.namaLengkap }
  } catch {
    return { success: false, error: "Gagal menyimpan hasil undian" }
  }
}
