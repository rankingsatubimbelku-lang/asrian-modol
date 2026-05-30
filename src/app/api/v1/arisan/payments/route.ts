import { NextRequest, NextResponse } from "next/server"
import { auth } from "~/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const periodId = req.nextUrl.searchParams.get("periodId")
  const bulan = req.nextUrl.searchParams.get("bulan")

  const payments = await prisma.arisanPayment.findMany({
    where: {
      ...(periodId ? { periodId } : {}),
      ...(bulan ? { bulan } : {}),
    },
    select: { id: true, memberId: true, bulan: true, status: true, nominal: true, tanggalBayar: true },
  })

  return NextResponse.json({ success: true, data: payments })
}
