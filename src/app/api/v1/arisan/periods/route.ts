import { NextRequest, NextResponse } from "next/server"
import { auth } from "~/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const status = req.nextUrl.searchParams.get("status")

  const periods = await prisma.arisanPeriod.findMany({
    where: status ? { status: status as "DRAFT" | "AKTIF" | "SELESAI" } : undefined,
    select: { id: true, namaPeriode: true, status: true, besarIuran: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ success: true, data: periods })
}
