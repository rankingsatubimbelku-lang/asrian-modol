"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin, resolveDbUserId } from "@/lib/auth-helpers"
import { logActivity } from "@/lib/audit"
import { createEventSchema } from "@/validations/event.schema"

export async function createEvent(formData: FormData) {
  const session = await requireAdmin()

  const parsed = createEventSchema.safeParse({
    namaKegiatan: formData.get("namaKegiatan"),
    tanggal: formData.get("tanggal"),
    lokasi: formData.get("lokasi"),
    pic: formData.get("pic"),
    deskripsi: formData.get("deskripsi"),
  })

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  const d = parsed.data

  try {
    const createdById = await resolveDbUserId(session.user.id)
    const event = await prisma.event.create({
      data: {
        namaKegiatan: d.namaKegiatan,
        tanggal: new Date(d.tanggal),
        lokasi: d.lokasi,
        pic: d.pic,
        deskripsi: d.deskripsi,
        createdBy: createdById,
      },
    })

    await logActivity({ userId: session.user.id, module: "kegiatan", action: "CREATE", entityId: event.id })
    revalidatePath("/kegiatan")
    return { success: true }
  } catch {
    return { success: false, error: "Gagal membuat kegiatan" }
  }
}

export async function updateEvent(id: string, formData: FormData) {
  const session = await requireAdmin()

  const parsed = createEventSchema.safeParse({
    namaKegiatan: formData.get("namaKegiatan"),
    tanggal: formData.get("tanggal"),
    lokasi: formData.get("lokasi"),
    pic: formData.get("pic"),
    deskripsi: formData.get("deskripsi"),
  })

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  const d = parsed.data

  try {
    await prisma.event.update({
      where: { id },
      data: {
        namaKegiatan: d.namaKegiatan,
        tanggal: new Date(d.tanggal),
        lokasi: d.lokasi,
        pic: d.pic,
        deskripsi: d.deskripsi,
      },
    })

    await logActivity({ userId: session.user.id, module: "kegiatan", action: "UPDATE", entityId: id })
    revalidatePath("/kegiatan")
    return { success: true }
  } catch {
    return { success: false, error: "Gagal memperbarui kegiatan" }
  }
}

export async function deleteEvent(id: string) {
  const session = await requireAdmin()

  try {
    await prisma.event.delete({ where: { id } })
    await logActivity({ userId: session.user.id, module: "kegiatan", action: "DELETE", entityId: id })
    revalidatePath("/kegiatan")
    return { success: true }
  } catch {
    return { success: false, error: "Gagal menghapus kegiatan" }
  }
}
