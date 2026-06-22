"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin, resolveDbUserId } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/audit"
import { generateNomorTransaksi } from "@/lib/format"
import { createLoanSchema, loanInterestSettingSchema, pembayaranBulananSchema } from "@/validations/loan.schema"
import { pecahPembayaranBulanan } from "@/lib/calculations/installment"
import { buatJurnal } from "@/lib/jurnal"

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
    const createdById = await resolveDbUserId(session.user.id)
    await prisma.loanInterestSetting.updateMany({ data: { isActive: false } })

    const setting = await prisma.loanInterestSetting.create({
      data: {
        persentase: parseFloat(d.persentase),
        metode: d.metode,
        berlakuMulai: new Date(d.berlakuMulai),
        isActive: true,
        dendaPerHari: parseFloat(d.dendaPerHari),
        createdBy: createdById,
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
    const createdById = await resolveDbUserId(session.user.id)
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
        createdBy: createdById,
      },
    })

    await logActivity({ userId: session.user.id, module: "kredit", action: "CREATE", entityId: loan.id })
    revalidatePath("/kredit")
    return { success: true }
  } catch {
    return { success: false, error: "Gagal membuat pengajuan kredit" }
  }
}

export async function approveLoan(loanId: string, formData: FormData) {
  const session = await requireAdmin()

  const keputusan = formData.get("keputusan") as string
  const catatan = formData.get("catatanApproval") as string

  try {
    const approvedById = await resolveDbUserId(session.user.id)
    const loan = await prisma.loan.findUnique({ where: { id: loanId } })
    if (!loan) return { success: false, error: "Kredit tidak ditemukan" }
    if (loan.status !== "MENUNGGU_PERSETUJUAN") return { success: false, error: "Status tidak valid untuk approval" }

    if (keputusan === "REJECT") {
      await prisma.loan.update({
        where: { id: loanId },
        data: { status: "DITOLAK", catatanApproval: catatan, approvedBy: approvedById, tanggalDisetujui: new Date() },
      })
      revalidatePath("/kredit/approval")
      return { success: true }
    }

    // Tidak ada generate jadwal angsuran — cukup set saldo pokok berjalan.
    // Jumlah & tanggal pembayaran ditentukan fleksibel setiap bulan via catatPembayaranBulanan().
    await prisma.loan.update({
      where: { id: loanId },
      data: {
        status: "DISETUJUI",
        catatanApproval: catatan,
        approvedBy: approvedById,
        tanggalDisetujui: new Date(),
        sisaPokok: loan.nominalPinjaman,
      },
    })

    await buatJurnal({
      tanggal: new Date(),
      deskripsi: `Pencairan kredit — ${loan.nomorPengajuan}`,
      sourceModule: "KREDIT",
      sourceId: loan.id,
      lines: [
        { kodeAkun: "1101", debit: Number(loan.nominalPinjaman) },
        { kodeAkun: "1001", kredit: Number(loan.nominalPinjaman) },
      ],
      userId: approvedById,
    })

    await logActivity({ userId: session.user.id, module: "kredit", action: "APPROVE", entityId: loanId })
    revalidatePath("/kredit")
    return { success: true }
  } catch {
    return { success: false, error: "Gagal memproses approval" }
  }
}

/**
 * Catat pembayaran angsuran bulanan — nominal bebas (fleksibel), jumlah angsuran TIDAK
 * ditentukan di awal. Bunga tetap dihitung sesuai metode (FLAT/EFEKTIF) dari setting kredit;
 * sisanya otomatis dialokasikan sebagai pokok dan mengurangi saldo berjalan (sisaPokok).
 */
export async function catatPembayaranBulanan(formData: FormData) {
  const session = await requireAdmin()

  const parsed = pembayaranBulananSchema.safeParse({
    loanId: formData.get("loanId"),
    nominalBayar: formData.get("nominalBayar"),
    tanggalBayar: formData.get("tanggalBayar"),
    keterangan: formData.get("keterangan"),
  })

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  const d = parsed.data
  const nominalBayar = parseFloat(d.nominalBayar)

  if (nominalBayar <= 0) {
    return { success: false, error: "Nominal pembayaran harus lebih dari 0" }
  }

  try {
    const loan = await prisma.loan.findUnique({
      where: { id: d.loanId },
      include: { interestSetting: true, _count: { select: { installments: true } } },
    })
    if (!loan) return { success: false, error: "Kredit tidak ditemukan" }
    if (loan.status !== "DISETUJUI") return { success: false, error: "Kredit tidak dalam status aktif" }

    const sisaPokokSaatIni = Number(loan.sisaPokok ?? loan.nominalPinjaman)
    if (sisaPokokSaatIni <= 0) return { success: false, error: "Pinjaman sudah lunas" }

    const { bunga, pokok, sisaPokokBaru } = pecahPembayaranBulanan({
      nominalBayar,
      metode: loan.interestSetting.metode as "FLAT" | "EFEKTIF",
      persentasePerTahun: Number(loan.interestSetting.persentase),
      nominalPinjamanAwal: Number(loan.nominalPinjaman),
      sisaPokok: sisaPokokSaatIni,
    })

    const tanggalBayar = new Date(d.tanggalBayar)
    const keNext = loan._count.installments + 1
    const lunas = sisaPokokBaru <= 0

    const createdById = await resolveDbUserId(session.user.id)

    const installment = await prisma.$transaction(async (tx) => {
      const inst = await tx.loanInstallment.create({
        data: {
          loanId: d.loanId,
          ke: keNext,
          tanggalJatuhTempo: tanggalBayar,
          tanggalBayar,
          nominalPokok: pokok,
          nominalBunga: bunga,
          nominalDibayar: nominalBayar,
          denda: 0,
          status: "LUNAS",
        },
      })

      await tx.loan.update({
        where: { id: d.loanId },
        data: {
          sisaPokok: sisaPokokBaru,
          ...(lunas ? { status: "LUNAS", tanggalLunas: tanggalBayar } : {}),
        },
      })

      return inst
    }, { timeout: 20000 })

    await buatJurnal({
      tanggal: tanggalBayar,
      deskripsi: `Pembayaran angsuran ke-${keNext} — ${loan.nomorPengajuan}`,
      sourceModule: "KREDIT",
      sourceId: installment.id,
      lines: [
        { kodeAkun: "1001", debit: nominalBayar },
        { kodeAkun: "1101", kredit: pokok },
        { kodeAkun: "4001", kredit: bunga },
      ],
      userId: createdById,
    })

    await logActivity({
      userId: session.user.id,
      module: "kredit",
      action: "BAYAR_ANGSURAN_BULANAN",
      entityId: d.loanId,
      dataBaru: { ke: keNext, nominalBayar, bunga, pokok, sisaPokokBaru, keterangan: d.keterangan },
    })

    revalidatePath(`/kredit/${d.loanId}`)
    revalidatePath("/kredit")
    revalidatePath("/kredit/angsuran")
    revalidatePath("/kredit/laporan-bunga")

    return { success: true, ke: keNext, bunga, pokok, sisaPokokBaru, lunas }
  } catch (e) {
    console.error(e)
    return { success: false, error: "Gagal mencatat pembayaran" }
  }
}

export async function pelunasanAwal(loanId: string, tanggalLunas: string) {
  const session = await requireAdmin()

  try {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { interestSetting: true, _count: { select: { installments: true } } },
    })
    if (!loan) return { success: false, error: "Kredit tidak ditemukan" }
    if (loan.status !== "DISETUJUI") return { success: false, error: "Kredit tidak dalam status aktif" }

    const sisaPokokSaatIni = Number(loan.sisaPokok ?? loan.nominalPinjaman)
    if (sisaPokokSaatIni <= 0) return { success: false, error: "Pinjaman sudah lunas" }

    // Bunga bulan terakhir tetap dihitung sesuai metode, lalu seluruh sisa pokok dilunaskan
    const { bunga } = pecahPembayaranBulanan({
      nominalBayar: sisaPokokSaatIni + sisaPokokSaatIni, // pastikan bunga penuh terhitung
      metode: loan.interestSetting.metode as "FLAT" | "EFEKTIF",
      persentasePerTahun: Number(loan.interestSetting.persentase),
      nominalPinjamanAwal: Number(loan.nominalPinjaman),
      sisaPokok: sisaPokokSaatIni,
    })

    const tglLunas = new Date(tanggalLunas)
    const keNext = loan._count.installments + 1

    await prisma.$transaction(async (tx) => {
      await tx.loanInstallment.create({
        data: {
          loanId,
          ke: keNext,
          tanggalJatuhTempo: tglLunas,
          tanggalBayar: tglLunas,
          nominalPokok: sisaPokokSaatIni,
          nominalBunga: bunga,
          nominalDibayar: sisaPokokSaatIni + bunga,
          denda: 0,
          status: "LUNAS",
        },
      })

      await tx.loan.update({
        where: { id: loanId },
        data: { status: "LUNAS", tanggalLunas: tglLunas, sisaPokok: 0 },
      })
    }, { timeout: 20000 })

    await logActivity({ userId: session.user.id, module: "kredit", action: "PELUNASAN_AWAL", entityId: loanId })
    revalidatePath("/kredit")
    revalidatePath(`/kredit/${loanId}`)
    return { success: true }
  } catch {
    return { success: false, error: "Gagal memproses pelunasan awal" }
  }
}
