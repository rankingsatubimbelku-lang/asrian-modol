"use client"

import { ExportButtons } from "@/components/shared/ExportButtons"

type Baris = { kode: string; nama: string; saldo: number }

export function LabaRugiExport({
  pendapatan, beban, totalPendapatan, totalBeban, labaBersih, dari, sampai,
}: {
  pendapatan: Baris[]
  beban: Baris[]
  totalPendapatan: number
  totalBeban: number
  labaBersih: number
  dari: string
  sampai: string
}) {
  const columns = [
    { header: "Kode", key: "kode" },
    { header: "Akun", key: "nama" },
    { header: "Kelompok", key: "kelompok" },
    { header: "Nominal", key: "nominal" },
  ]

  const data = [
    ...pendapatan.map(p => ({ kode: p.kode, nama: p.nama, kelompok: "Pendapatan", nominal: `Rp ${p.saldo.toLocaleString("id-ID")}` })),
    { kode: "", nama: "Total Pendapatan", kelompok: "", nominal: `Rp ${totalPendapatan.toLocaleString("id-ID")}` },
    ...beban.map(b => ({ kode: b.kode, nama: b.nama, kelompok: "Beban", nominal: `Rp ${b.saldo.toLocaleString("id-ID")}` })),
    { kode: "", nama: "Total Beban", kelompok: "", nominal: `Rp ${totalBeban.toLocaleString("id-ID")}` },
    { kode: "", nama: "LABA BERSIH", kelompok: "", nominal: `Rp ${labaBersih.toLocaleString("id-ID")}` },
  ]

  return (
    <ExportButtons
      title="Laporan Laba Rugi"
      subtitle={`Periode: ${dari} s.d. ${sampai}`}
      columns={columns}
      data={data}
      filename="laba-rugi"
    />
  )
}
