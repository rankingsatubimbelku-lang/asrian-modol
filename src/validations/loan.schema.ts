import { z } from "zod"

export const loanInterestSettingSchema = z.object({
  persentase: z.string().min(1, "Persentase wajib diisi"),
  metode: z.enum(["FLAT", "EFEKTIF"] as const),
  berlakuMulai: z.string().min(1, "Tanggal berlaku wajib diisi"),
  dendaPerHari: z.string().min(1, "Denda per hari wajib diisi"),
})

export const createLoanSchema = z.object({
  memberId: z.string().min(1, "Anggota wajib dipilih"),
  nominalPinjaman: z.string().min(1, "Nominal wajib diisi"),
  tenor: z.string().min(1, "Tenor wajib diisi"),
  tujuanPinjaman: z.string().min(5, "Tujuan minimal 5 karakter"),
  tanggalPengajuan: z.string().min(1, "Tanggal wajib diisi"),
})

export const approvalLoanSchema = z.object({
  keputusan: z.enum(["APPROVE", "REJECT"] as const),
  catatanApproval: z.string().optional(),
})

export const pembayaranBulananSchema = z.object({
  loanId: z.string().min(1),
  nominalBayar: z.string().min(1, "Nominal bayar wajib diisi"),
  tanggalBayar: z.string().min(1, "Tanggal bayar wajib diisi"),
  keterangan: z.string().optional(),
})

export type LoanInterestSettingInput = z.infer<typeof loanInterestSettingSchema>
export type CreateLoanInput = z.infer<typeof createLoanSchema>
