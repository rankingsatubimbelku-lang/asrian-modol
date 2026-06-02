import { NextRequest, NextResponse } from "next/server"
import { auth } from "~/auth"
import { prisma } from "@/lib/prisma"

// Kandidat undian: sudah bayar iuran bulan ini DAN belum pernah menang
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ success: false }, { status: 401 })

    const periodId = req.nextUrl.searchParams.get("periodId")
    const bulan = req.nextUrl.searchParams.get("bulan")

    if (!periodId || !bulan) {
      return NextResponse.json({ success: false, error: "periodId dan bulan diperlukan" }, { status: 400 })
    }

    // Query 1: anggota belum menang di periode ini
    const arisanMembers = await prisma.arisanMember.findMany({
      where: { periodId, sudahMenang: false },
      select: {
        memberId: true,
        member: { select: { id: true, namaLengkap: true, nomorAnggota: true } },
      },
    })

    if (arisanMembers.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Query 2: satu query untuk semua payment (bukan N+1)
    const payments = await prisma.arisanPayment.findMany({
      where: {
        periodId,
        bulan,
        status: "LUNAS",
        memberId: { in: arisanMembers.map(am => am.memberId) },
      },
      select: { memberId: true },
    })

    const paidIds = new Set(payments.map(p => p.memberId))

    // Filter: hanya yang sudah bayar
    const kandidat = arisanMembers
      .filter(am => paidIds.has(am.memberId))
      .map(am => am.member)

    return NextResponse.json({ success: true, data: kandidat })
  } catch (error) {
    console.error("[kandidat]", error)
    return NextResponse.json({ success: false, error: "Gagal mengambil data kandidat", data: [] }, { status: 500 })
  }
}
