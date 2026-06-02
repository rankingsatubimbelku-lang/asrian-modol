import { NextRequest, NextResponse } from "next/server"
import { auth } from "~/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const { id } = await params

  const member = await prisma.member.findUnique({
    where: { id },
    select: {
      namaLengkap: true,
      nik: true,
      nomorHp: true,
      tempatLahir: true,
      tanggalLahir: true,
      alamat: true,
      tanggalBergabung: true,
    },
  })

  if (!member) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })

  return NextResponse.json({ success: true, data: member })
}
