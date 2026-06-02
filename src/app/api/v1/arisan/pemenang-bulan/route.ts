import { NextRequest, NextResponse } from "next/server"
import { auth } from "~/auth"
import { prisma } from "@/lib/prisma"

// Cek berapa pemenang sudah diundi bulan ini vs max yang diperbolehkan
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ success: false }, { status: 401 })

    const periodId = req.nextUrl.searchParams.get("periodId")
    const bulan = req.nextUrl.searchParams.get("bulan")

    if (!periodId || !bulan) {
      return NextResponse.json({ success: false, error: "periodId dan bulan diperlukan" }, { status: 400 })
    }

    const [periode, pemenangBulanIni] = await Promise.all([
      prisma.arisanPeriod.findUnique({
        where: { id: periodId },
        select: { maxPemenangPerBulan: true, besarIuran: true },
      }),
      prisma.arisanWinner.count({
        where: { draw: { periodId, bulanUndian: bulan } },
      }),
    ])

    const maxPemenang = periode?.maxPemenangPerBulan ?? 1
    const sisaSlot = Math.max(0, maxPemenang - pemenangBulanIni)

    // Hitung nominal hak per pemenang
    const totalAnggota = await prisma.arisanMember.count({ where: { periodId } })
    const nominalHakPerPemenang = Math.floor(
      (Number(periode?.besarIuran ?? 0) * totalAnggota) / maxPemenang
    )

    return NextResponse.json({
      success: true,
      data: {
        maxPemenang,
        pemenangBulanIni,
        sisaSlot,
        sudahMaksimal: sisaSlot === 0,
        nominalHakPerPemenang,
      },
    })
  } catch (error) {
    console.error("[pemenang-bulan]", error)
    return NextResponse.json({ success: false, error: "Gagal" }, { status: 500 })
  }
}
