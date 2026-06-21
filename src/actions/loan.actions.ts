"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/audit"
import { generateNomorTransaksi } from "@/lib/format"
import { createLoanSchema, loanInterestSettingSchema, bayarAngsuranSchema } from "@/validations/loan.schema"
import { generateJadwalAngsuran } from "@/lib/calculations/installment"
import { hitungDenda } from "@/lib/calculations/penalty"
import { resolveDbUserId } from "@/lib/auth-helpers"

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
    const approvedById = await resolveDbUserId(session.user.id)
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { interestSetting: true },
    })
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
          approvedBy: approvedById,
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

/**
 * Pembayaran fleksibel — anggota bebas membayar berapa pun nominalnya.
 * Bunga & pokok per angsuran TETAP mengikuti jadwal awal (FLAT/EFEKTIF), tidak dihitung ulang.
 * Pembayaran dialokasikan ke angsuran TERTUA (belum lunas) lebih dulu; sisa otomatis
 * mengalir ke angsuran berikutnya. Mendukung pembayaran parsial (status SEBAGIAN).
 */
export async function bayarAngsuranFleksibel(loanId: string, nominalBayar: number, tanggalBayar: string, keterangan?: string) {
  const session = await requireAdmin()

  if (!nominalBayar || nominalBayar <= 0) {
    return { success: false, error: "Nominal pembayaran harus lebih dari 0" }
  }

  try {
    const createdById = await resolveDbUserId(session.user.id)

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        interestSetting: true,
        installments: { where: { status: { not: "LUNAS" } }, orderBy: { ke: "asc" } },
      },
    })
    if (!loan) return { success: false, error: "Kredit tidak ditemukan" }
    if (loan.status !== "DISETUJUI") return { success: false, error: "Kredit tidak dalam status aktif" }
    if (loan.installments.length === 0) return { success: false, error: "Semua angsuran sudah lunas" }

    const tglBayar = new Date(tanggalBayar)
    let sisaBayar = nominalBayar

    const instUpdates: {
      id: string
      nominalDibayar: number
      status: "SEBAGIAN" | "LUNAS"
      denda: number
      tanggalBayar?: Date
    }[] = []
    const paymentRows: { installmentId: string; nominal: number }[] = []

    for (const inst of loan.installments) {
      if (sisaBayar <= 0) break

      const totalTagihanPokokBunga = Number(inst.nominalPokok) + Number(inst.nominalBunga)
      const sudahDibayar = Number(inst.nominalDibayar)

      // Denda dihitung berdasarkan tanggal jatuh tempo asli — tidak berubah oleh nominal bayar
      const denda = tglBayar > inst.tanggalJatuhTempo
        ? hitungDenda({
            nominalAngsuran: totalTagihanPokokBunga,
            dendaPerHari: Number(loan.interestSetting.dendaPerHari),
            tanggalJatuhTempo: inst.tanggalJatuhTempo,
            tanggalBayar: tglBayar,
          })
        : Number(inst.denda)

      const totalTagihanInst = totalTagihanPokokBunga + denda
      const sisaTagihanInst = totalTagihanInst - sudahDibayar
      if (sisaTagihanInst <= 0) continue

      const bayarUntukIni = Math.min(sisaBayar, sisaTagihanInst)
      const dibayarBaru = sudahDibayar + bayarUntukIni
      const lunas = dibayarBaru >= totalTagihanInst - 1 // toleransi rounding 1 rupiah

      instUpdates.push({
        id: inst.id,
        nominalDibayar: dibayarBaru,
        status: lunas ? "LUNAS" : "SEBAGIAN",
        denda,
        tanggalBayar: lunas ? tglBayar : undefined,
      })
      paymentRows.push({ installmentId: inst.id, nominal: bayarUntukIni })
      sisaBayar -= bayarUntukIni
    }

    if (paymentRows.length === 0) {
      return { success: false, error: "Tidak ada angsuran yang bisa dialokasikan" }
    }

    await prisma.$transaction(async (tx) => {
      for (const u of instUpdates) {
        await tx.loanInstallment.update({
          where: { id: u.id },
          data: {
            nominalDibayar: u.nominalDibayar,
            status: u.status,
            denda: u.denda,
            ...(u.tanggalBayar ? { tanggalBayar: u.tanggalBayar } : {}),
          },
        })
      }
      for (const p of paymentRows) {
        await tx.loanPayment.create({
          data: {
            loanId,
            installmentId: p.installmentId,
            nominal: p.nominal,
            tanggalBayar: tglBayar,
            keterangan,
            createdBy: createdById,
          },
        })
      }

      const sisaBelumLunas = await tx.loanInstallment.count({
        where: { loanId, status: { not: "LUNAS" } },
      })
      if (sisaBelumLunas === 0) {
        await tx.loan.update({
          where: { id: loanId },
          data: { status: "LUNAS", tanggalLunas: tglBayar },
        })
      }
    })

    await logActivity({
      userId: session.user.id,
      module: "kredit",
      action: "BAYAR_ANGSURAN_FLEKSIBEL",
      entityId: loanId,
      dataBaru: { nominalBayar, dialokasikanKe: paymentRows.length, kelebihan: sisaBayar },
    })

    revalidatePath(`/kredit/${loanId}`)
    revalidatePath("/kredit")
    return {
      success: true,
      dialokasikanKe: paymentRows.length,
      kelebihan: sisaBayar > 0 ? sisaBayar : 0,
    }
  } catch (e) {
    console.error(e)
    return { success: false, error: "Gagal mencatat pembayaran" }
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
