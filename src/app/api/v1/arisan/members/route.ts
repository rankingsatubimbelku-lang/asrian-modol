import { NextRequest, NextResponse } from "next/server"
import { auth } from "~/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const periodId = req.nextUrl.searchParams.get("periodId")
  if (!periodId) return NextResponse.json({ success: false, error: "periodId diperlukan" }, { status: 400 })

  const members = await prisma.arisanMember.findMany({
    where: { periodId },
    include: { member: { select: { id: true, namaLengkap: true, nomorAnggota: true } } },
  })

  return NextResponse.json({ success: true, data: members.map(m => m.member) })
}
