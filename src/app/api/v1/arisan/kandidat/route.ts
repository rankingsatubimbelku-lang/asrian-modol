import { NextRequest, NextResponse } from "next/server"
import { auth } from "~/auth"
import { prisma } from "@/lib/prisma"

// Kandidat undian: sudah bayar iuran bulan ini DAN belum pernah menang
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const periodId = req.nextUrl.searchParams.get("periodId")
  const bulan = req.nextUrl.searchParams.get("bulan")

  if (!periodId || !bulan) {
    return NextResponse.json({ success: false, error: "periodId dan bulan diperlukan" }, { status: 400 })
  }

  // Anggota di periode yang belum menang
  const arisanMembers = await prisma.arisanMember.findMany({
    where: { periodId, sudahMenang: false },
    include: { member: { select: { id: true, namaLengkap: true, nomorAnggota: true } } },
  })

  // Filter hanya yang sudah bayar bulan ini
  const membersWithPayment = await Promise.all(
    arisanMembers.map(async (am) => {
      const payment = await prisma.arisanPayment.findFirst({
        where: { periodId, memberId: am.memberId, bulan, status: "LUNAS" },
      })
      return payment ? am.member : null
    })
  )

  const kandidat = membersWithPayment.filter(Boolean)

  return NextResponse.json({ success: true, data: kandidat })
}
