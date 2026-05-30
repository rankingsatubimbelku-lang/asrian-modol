import { NextRequest, NextResponse } from "next/server"
import { auth } from "~/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const active = req.nextUrl.searchParams.get("active") === "true"

  if (active) {
    const setting = await prisma.loanInterestSetting.findFirst({ where: { isActive: true } })
    return NextResponse.json({ success: true, data: setting })
  }

  const settings = await prisma.loanInterestSetting.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  return NextResponse.json({ success: true, data: settings })
}
