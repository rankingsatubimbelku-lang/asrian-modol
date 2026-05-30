import { z } from "zod"

export const savingTransactionSchema = z.object({
  memberId: z.string().min(1, "Anggota wajib dipilih"),
  jenis: z.enum(["SETORAN", "PENARIKAN"] as const, { message: "Jenis wajib dipilih" }),
  nominal: z.string().min(1, "Nominal wajib diisi"),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  keterangan: z.string().optional(),
})

export const savingInterestSettingSchema = z.object({
  persentase: z.string().min(1, "Persentase wajib diisi"),
  periode: z.enum(["BULANAN", "TAHUNAN"] as const),
  berlakuMulai: z.string().min(1, "Tanggal berlaku wajib diisi"),
})

export type SavingTransactionInput = z.infer<typeof savingTransactionSchema>
export type SavingInterestSettingInput = z.infer<typeof savingInterestSettingSchema>
