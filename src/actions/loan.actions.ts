"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/audit"
import { generateNomorTransaksi } from "@/lib/format"
import { createLoanSchema, loanInterestSettingSchema, bayarAngsuranSchema } from "@/validations/loan.schema"
import { generateJadwalAngsuran } from "@/lib/calculations/installment"
import { hitungDenda } from "@/lib/calculations/penalty"

export async function saveLoanInterestSetting(formData: FormData) {
  const session = await requireAdmin()

  const parsed = loanInterestSettingSchema.safeParse({
    persentase: formData.get("persentase"),
    metode: formData.get("metode"),
    berlakuMulai: formData.get("berlakuMulai"),
    dendaPerHari: formData.get("dendaPerHari"),
  })

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  const d = parsed.data

  try {
    await prisma.loanInterestSetting.updateMany({ data: { isActive: false } })

    const setting = await prisma.loanInterestSetting.create({
      data: {
        persentase: parseFloat(d.persentase),
        metode: d.metode,
        berlakuMulai: new Date(d.berlakuMulai),
        isActive: true,
        dendaPerHari: parseFloat(d.dendaPerHari),
        createdBy: session.user.id,
      },
    })

    await logActivity({ userId: session.user.id, module: "kredit", action: "SET_BUNGA", entityId: setting.id })
    revalidatePath("/pengaturan/bunga-kredit")
    return { success: true }
  } catch {
    return { success: false, error: "Gagal menyimpan setting bunga kredit" }
  }
}

export async function createLoan(formData: FormData) {
  const session = await requireAdmin()

  const parsed = createLoanSchema.safeParse({
    memberId: formData.get("memberId"),
    nominalPinjaman: formData.get("nominalPinjaman"),
    tenor: formData.get("tenor"),
    tujuanPinjaman: formData.get("tujuanPinjaman"),
    tanggalPengajuan: formData.get("tanggalPengajuan"),
  })

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  const d = parsed.data

  try {
    const setting = await prisma.loanInterestSetting.findFirst({ where: { isActive: true } })
    if (!setting) return { success: false, error: "Belum ada setting bunga kredit aktif" }

    let nomorPengajuan = generateNomorTransaksi("LN")
    while (await prisma.loan.findUnique({ where: { nomorPengajuan } })) {
      nomorPengajuan = generateNomorTransaksi("LN")
    }

    const loan = await prisma.loan.create({
      data: {
        nomorPengajuan,
        memberId: d.memberId,
        nominalPinjaman: parseFloat(d.nominalPinjaman),
        tenor: parseInt(d.tenor),
        tujuanPinjaman: d.tujuanPinjaman,
        interestSettingId: setting.id,
        status: "MENUNGGU_PERSETUJUAN",
        tanggalPengajuan: new Date(d.tanggalPengajuan),
        createdBy: session.user.id,
      },
    })

    await logActivity({ userId: session.user.id, module: "kredit", action: "CREATE", entityId: loan.id })
    revalidatePath("/kredit")
    return { success: true, data: loan }
  } catch {
    return { success: false, error: "Gagal membuat pengajuan kredit" }
  }
}

export async function approveLoan(loanId: string, formData: FormData) {
  const session = await requireAdmin()

  const keputusan = formData.get("keputusan") as string
  const catatan = formData.get("catatanApproval") as string

  try {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { interestSetting: true },
    })
    if (!loan) return { success: false, error: "Kredit tidak ditemukan" }
    if (loan.status !== "MENUNGGU_PERSETUJUAN") return { success: false, error: "Status tidak valid untuk approval" }

    if (keputusan === "REJECT") {
      await prisma.loan.update({
        where: { id: loanId },
        data: { status: "DITOLAK", catatanApproval: catatan, approvedBy: session.user.id, tanggalDisetujui: new Date() },
      })
      revalidatePath("/kredit/approval")
      return { success: true }
    }

    // Generate jadwal angsuran
    const jadwal = generateJadwalAngsuran({
      nominalPinjaman: Number(loan.nominalPinjaman),
      tenor: loan.tenor,
      bungaPerTahun: Number(loan.interestSetting.persentase),
      metode: loan.interestSetting.metode as "FLAT" | "EFEKTIF",
      tanggalMulai: new Date(),
    })

    await prisma.$transaction([
      prisma.loan.update({
        where: { id: loanId },
        data: {
          status: "DISETUJUI",
          catatanApproval: catatan,
          approvedBy: session.user.id,
          tanggalDisetujui: new Date(),
        },
      }),
      prisma.loanInstallment.createMany({
        data: jadwal.map((j) => ({
          loanId,
          ke: j.ke,
          tanggalJatuhTempo: j.tanggalJatuhTempo,
          nominalPokok: j.nominalPokok,
          nominalBunga: j.nominalBunga,
          status: "BELUM_BAYAR",
        })),
      }),
    ])

    await logActivity({ userId: session.user.id, module: "kredit", action: "APPROVE", entityId: loanId })
    revalidatePath("/kredit")
    return { success: true }
  } catch {
    return { success: false, error: "Gagal memproses approval" }
  }
}

export async function bayarAngsuran(formData: FormData) {
  const session = await requireAdmin()

  const parsed = bayarAngsuranSchema.safeParse({
    installmentId: formData.get("installmentId"),
    tanggalBayar: formData.get("tanggalBayar"),
  })

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  const d = parsed.data

  try {
    const angsuran = await prisma.loanInstallment.findUnique({
      where: { id: d.installmentId },
      include: { loan: { include: { interestSetting: true } } },
    })

    if (!angsuran) return { success: false, error: "Data angsuran tidak ditemukan" }
    if (angsuran.status === "LUNAS") return { success: false, error: "Angsuran sudah lunas" }

    const tanggalBayar = new Date(d.tanggalBayar)
    const totalCicilan = Number(angsuran.nominalPokok) + Number(angsuran.nominalBunga)

    const denda = hitungDenda({
      nominalAngsuran: totalCicilan,
      dendaPerHari: Number(angsuran.loan.interestSetting.dendaPerHari),
      tanggalJatuhTempo: angsuran.tanggalJatuhTempo,
      tanggalBayar,
    })

    await prisma.loanInstallment.update({
      where: { id: d.installmentId },
      data: {
        status: "LUNAS",
        tanggalBayar,
        denda,
      },
    })

    // Cek apakah semua angsuran sudah lunas
    const belumLunas = await prisma.loanInstallment.count({
      where: { loanId: angsuran.loanId, status: { not: "LUNAS" } },
    })

    if (belumLunas === 0) {
      await prisma.loan.update({
        where: { id: angsuran.loanId },
        data: { status: "LUNAS", tanggalLunas: tanggalBayar },
      })
    }

    await logActivity({ userId: session.user.id, module: "kredit", action: "BAYAR_ANGSURAN", entityId: d.installmentId, dataBaru: { denda } })
    revalidatePath("/kredit")
    return { success: true, denda }
  } catch {
    return { success: false, error: "Gagal mencatat pembayaran angsuran" }
  }
}

export async function pelunasanAwal(loanId: string, tanggalLunas: string) {
  const session = await requireAdmin()

  try {
    await prisma.loanInstallment.updateMany({
      where: { loanId, status: "BELUM_BAYAR" },
      data: { status: "LUNAS", tanggalBayar: new Date(tanggalLunas) },
    })

    await prisma.loan.update({
      where: { id: loanId },
      data: { status: "LUNAS", tanggalLunas: new Date(tanggalLunas) },
    })

    await logActivity({ userId: session.user.id, module: "kredit", action: "PELUNASAN_AWAL", entityId: loanId })
    revalidatePath("/kredit")
    return { success: true }
  } catch {
    return { success: false, error: "Gagal memproses pelunasan awal" }
  }
}
