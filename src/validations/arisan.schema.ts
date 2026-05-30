import { z } from "zod"

export const createPeriodeSchema = z.object({
  namaPeriode: z.string().min(3, "Nama periode wajib diisi"),
  tanggalMulai: z.string().min(1, "Tanggal mulai wajib diisi"),
  tanggalSelesai: z.string().min(1, "Tanggal selesai wajib diisi"),
  besarIuran: z.string().min(1, "Besar iuran wajib diisi"),
  maxPemenangPerBulan: z.string().min(1, "Max pemenang wajib diisi"),
})

export const inputIuranSchema = z.object({
  periodId: z.string().min(1, "Periode wajib dipilih"),
  memberId: z.string().min(1, "Anggota wajib dipilih"),
  bulan: z.string().min(1, "Bulan wajib diisi"),
  nominal: z.string().min(1, "Nominal wajib diisi"),
  tanggalBayar: z.string().min(1, "Tanggal bayar wajib diisi"),
})

export const undianSchema = z.object({
  periodId: z.string().min(1, "Periode wajib dipilih"),
  bulanUndian: z.string().min(1, "Bulan undian wajib diisi"),
  jumlahPemenang: z.string().min(1, "Jumlah pemenang wajib diisi"),
})

export type CreatePeriodeInput = z.infer<typeof createPeriodeSchema>
export type InputIuranInput = z.infer<typeof inputIuranSchema>
export type UndianInput = z.infer<typeof undianSchema>
