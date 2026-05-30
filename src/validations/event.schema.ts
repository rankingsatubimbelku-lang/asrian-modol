import { z } from "zod"

export const createEventSchema = z.object({
  namaKegiatan: z.string().min(3, "Nama kegiatan minimal 3 karakter"),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  lokasi: z.string().min(3, "Lokasi wajib diisi"),
  pic: z.string().min(2, "PIC wajib diisi"),
  deskripsi: z.string().optional(),
})

export type CreateEventInput = z.infer<typeof createEventSchema>
