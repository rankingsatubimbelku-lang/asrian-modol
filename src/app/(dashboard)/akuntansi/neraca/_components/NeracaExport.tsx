"use client"

import { ExportButtons } from "@/components/shared/ExportButtons"

type Baris = { kode: string; nama: string; saldo: number }

export function NeracaExport({
  aset, kewajiban, modal, labaBerjalan, totalAset, totalKewajibanModal, perTanggal,
}: {
  aset: Baris[]
  kewajiban: Baris[]
  modal: Baris[]
  labaBerjalan: number
  totalAset: number
  totalKewajibanModal: number
  perTanggal: string
}) {
  const columns = [
    { header: "Kode", key: "kode" },
    { header: "Akun", key: "nama" },
    { header: "Kelompok", key: "kelompok" },
    { header: "Nominal", key: "nominal" },
  ]

  const data = [
    ...aset.map(a => ({ kode: a.kode, nama: a.nama, kelompok: "Aset", nominal: `Rp ${a.saldo.toLocaleString("id-ID")}` })),
    { kode: "", nama: "Total Aset", kelompok: "", nominal: `Rp ${totalAset.toLocaleString("id-ID")}` },
    ...kewajiban.map(k => ({ kode: k.kode, nama: k.nama, kelompok: "Kewajiban", nominal: `Rp ${k.saldo.toLocaleString("id-ID")}` })),
    ...modal.map(m => ({ kode: m.kode, nama: m.nama, kelompok: "Modal", nominal: `Rp ${m.saldo.toLocaleString("id-ID")}` })),
    { kode: "", nama: "Laba Berjalan", kelompok: "Modal", nominal: `Rp ${labaBerjalan.toLocaleString("id-ID")}` },
    { kode: "", nama: "Total Kewajiban + Modal", kelompok: "", nominal: `Rp ${totalKewajibanModal.toLocaleString("id-ID")}` },
  ]

  return (
    <ExportButtons
      title="Laporan Neraca"
      subtitle={`Per tanggal: ${perTanggal}`}
      columns={columns}
      data={data}
      filename="neraca"
    />
  )
}
