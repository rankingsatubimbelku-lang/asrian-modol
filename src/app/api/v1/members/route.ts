import { NextRequest, NextResponse } from "next/server"
import { auth } from "~/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const withSaldo = req.nextUrl.searchParams.get("withSaldo") === "true"

  const members = await prisma.member.findMany({
    where: { status: "AKTIF" },
    select: {
      id: true,
      namaLengkap: true,
      nomorAnggota: true,
      ...(withSaldo ? { saving: { select: { saldo: true } } } : {}),
    },
    orderBy: { namaLengkap: "asc" },
  })

  return NextResponse.json({ success: true, data: members })
}
