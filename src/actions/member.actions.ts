"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/audit"
import { generateNomorAnggota } from "@/lib/format"
import { createMemberSchema, updateMemberSchema } from "@/validations/member.schema"
import bcrypt from "bcryptjs"

export async function createMember(formData: FormData) {
  const session = await requireAdmin()

  const raw = {
    namaLengkap: formData.get("namaLengkap"),
    nik: formData.get("nik"),
    email: formData.get("email"),
    password: formData.get("password"),
    nomorHp: formData.get("nomorHp"),
    tempatLahir: formData.get("tempatLahir"),
    tanggalLahir: formData.get("tanggalLahir"),
    alamat: formData.get("alamat"),
    tanggalBergabung: formData.get("tanggalBergabung"),
  }

  const parsed = createMemberSchema.safeParse(raw)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Validasi gagal"
    return { success: false, error: msg }
  }

  const d = parsed.data

  try {
    const existingEmail = await prisma.user.findUnique({ where: { email: d.email } })
    if (existingEmail) return { success: false, error: "Email sudah digunakan" }

    // Cek NIK hanya jika diisi
    if (d.nik) {
      const existingNik = await prisma.member.findUnique({ where: { nik: d.nik } })
      if (existingNik) return { success: false, error: "NIK sudah terdaftar" }
    }

    const hashedPassword = await bcrypt.hash(d.password, 12)
    let nomorAnggota = generateNomorAnggota()

    // Pastikan nomor unik
    while (await prisma.member.findUnique({ where: { nomorAnggota } })) {
      nomorAnggota = generateNomorAnggota()
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: d.email,
          password: hashedPassword,
          role: "ANGGOTA",
        },
      })

      const member = await tx.member.create({
        data: {
          userId: user.id,
          nomorAnggota,
          namaLengkap: d.namaLengkap,
          nik: d.nik ?? null,
          tempatLahir: d.tempatLahir,
          tanggalLahir: new Date(d.tanggalLahir),
          alamat: d.alamat,
          nomorHp: d.nomorHp,
          tanggalBergabung: new Date(d.tanggalBergabung),
        },
      })

      // Buat rekening tabungan otomatis
      await tx.saving.create({ data: { memberId: member.id } })

      return member
    })

    await logActivity({
      userId: session.user.id,
      module: "members",
      action: "CREATE",
      entityId: result.id,
      dataBaru: { nomorAnggota, namaLengkap: d.namaLengkap, email: d.email },
    })

    revalidatePath("/anggota")
    return { success: true, data: result }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Gagal membuat anggota" }
  }
}

export async function updateMember(id: string, formData: FormData) {
  const session = await requireAdmin()

  const raw = {
    namaLengkap: formData.get("namaLengkap"),
    nik: formData.get("nik"),
    nomorHp: formData.get("nomorHp"),
    tempatLahir: formData.get("tempatLahir"),
    tanggalLahir: formData.get("tanggalLahir"),
    alamat: formData.get("alamat"),
    tanggalBergabung: formData.get("tanggalBergabung"),
  }

  const parsed = updateMemberSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validasi gagal" }
  }

  const d = parsed.data

  try {
    const existing = await prisma.member.findUnique({ where: { id } })
    if (!existing) return { success: false, error: "Anggota tidak ditemukan" }

    const updated = await prisma.member.update({
      where: { id },
      data: {
        namaLengkap: d.namaLengkap,
        nik: d.nik,
        nomorHp: d.nomorHp,
        tempatLahir: d.tempatLahir,
        tanggalLahir: new Date(d.tanggalLahir),
        alamat: d.alamat,
        tanggalBergabung: new Date(d.tanggalBergabung),
      },
    })

    await logActivity({
      userId: session.user.id,
      module: "members",
      action: "UPDATE",
      entityId: id,
      dataLama: existing as never,
      dataBaru: updated as never,
    })

    revalidatePath("/anggota")
    revalidatePath(`/anggota/${id}`)
    return { success: true }
  } catch {
    return { success: false, error: "Gagal memperbarui anggota" }
  }
}

export async function toggleMemberStatus(id: string) {
  const session = await requireAdmin()

  try {
    const member = await prisma.member.findUnique({
      where: { id },
      include: { user: true },
    })
    if (!member) return { success: false, error: "Anggota tidak ditemukan" }

    const newStatus = member.status === "AKTIF" ? "NONAKTIF" : "AKTIF"

    await prisma.$transaction([
      prisma.member.update({ where: { id }, data: { status: newStatus } }),
      prisma.user.update({ where: { id: member.userId }, data: { isActive: newStatus === "AKTIF" } }),
    ])

    await logActivity({
      userId: session.user.id,
      module: "members",
      action: newStatus === "AKTIF" ? "ACTIVATE" : "DEACTIVATE",
      entityId: id,
    })

    revalidatePath("/anggota")
    return { success: true }
  } catch {
    return { success: false, error: "Gagal mengubah status anggota" }
  }
}

export async function setMemberRole(id: string, role: "ANGGOTA" | "ADMIN" | "SUPER_ADMIN") {
  const session = await requireAdmin()

  // Hanya Super Admin yang boleh set role
  if (session.user.role !== "SUPER_ADMIN") {
    return { success: false, error: "Hanya Super Admin yang dapat mengubah role" }
  }

  try {
    const member = await prisma.member.findUnique({
      where: { id },
      select: { userId: true, namaLengkap: true },
    })
    if (!member) return { success: false, error: "Anggota tidak ditemukan" }

    await prisma.user.update({
      where: { id: member.userId },
      data: { role },
    })

    await logActivity({
      userId: session.user.id,
      module: "members",
      action: "SET_ROLE",
      entityId: id,
      dataBaru: { role },
    })

    revalidatePath("/anggota")
    revalidatePath(`/anggota/${id}`)
    return { success: true }
  } catch {
    return { success: false, error: "Gagal mengubah role" }
  }
}

export async function resetMemberPassword(id: string, newPassword: string) {
  const session = await requireAdmin()

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "Password minimal 6 karakter" }
  }

  try {
    const member = await prisma.member.findUnique({
      where: { id },
      select: { userId: true, namaLengkap: true },
    })
    if (!member) return { success: false, error: "Anggota tidak ditemukan" }

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: member.userId },
      data: { password: hashedPassword },
    })

    await logActivity({
      userId: session.user.id,
      module: "members",
      action: "RESET_PASSWORD",
      entityId: id,
    })

    return { success: true }
  } catch {
    return { success: false, error: "Gagal mereset password" }
  }
}
