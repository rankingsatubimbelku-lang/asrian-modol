import { NextResponse } from "next/server"
import { auth } from "~/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const settings = await prisma.savingsInterestSetting.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  return NextResponse.json({ success: true, data: settings })
}
