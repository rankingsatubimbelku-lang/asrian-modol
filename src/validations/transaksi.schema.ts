import { z } from "zod"

export const createTransaksiSchema = z.object({
  jenis: z.enum(["PEMASUKAN", "PENGELUARAN"] as const),
  kategori: z.string().min(2, "Kategori wajib diisi"),
  nominal: z.string().min(1, "Nominal wajib diisi"),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  keterangan: z.string().optional(),
})

export type CreateTransaksiInput = z.infer<typeof createTransaksiSchema>
