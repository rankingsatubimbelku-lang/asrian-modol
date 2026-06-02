import { z } from "zod"

export const createMemberSchema = z.object({
  namaLengkap: z.string().min(3, "Nama minimal 3 karakter"),
  nik: z.string().length(16, "NIK harus 16 digit").regex(/^\d+$/, "NIK hanya angka").optional().or(z.literal("")),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  nomorHp: z.string().min(10, "No. HP minimal 10 digit").max(15),
  tempatLahir: z.string().min(2, "Tempat lahir wajib diisi"),
  tanggalLahir: z.string().min(1, "Tanggal lahir wajib diisi"),
  alamat: z.string().min(10, "Alamat minimal 10 karakter"),
  tanggalBergabung: z.string().min(1, "Tanggal bergabung wajib diisi"),
})

export const updateMemberSchema = createMemberSchema.omit({ email: true, password: true })

export type CreateMemberInput = z.infer<typeof createMemberSchema>
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>
