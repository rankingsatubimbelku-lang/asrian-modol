import { z } from "zod"

export const createAccountSchema = z.object({
  kode: z.string().min(2, "Kode akun wajib diisi"),
  nama: z.string().min(2, "Nama akun wajib diisi"),
  tipe: z.enum(["ASET", "KEWAJIBAN", "MODAL", "PENDAPATAN", "BEBAN"] as const),
})
