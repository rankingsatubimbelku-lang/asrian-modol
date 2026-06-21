"use client"

import { ExportButtons } from "@/components/shared/ExportButtons"
import { formatMonth } from "@/lib/format"

type MonthSummary = {
  bulan: string
  jumlahAngsuran: number
  totalPokok: number
  totalBunga: number
  totalDenda: number
  totalDiterima: number
}

export function LaporanBungaExport({ monthlySummary }: { monthlySummary: MonthSummary[] }) {
  const columns = [
    { header: "Bulan", key: "bulan" },
    { header: "Jumlah Angsuran", key: "jumlahAngsuran" },
    { header: "Pokok Diterima", key: "totalPokok" },
    { header: "Pendapatan Bunga", key: "totalBunga" },
    { header: "Pendapatan Denda", key: "totalDenda" },
    { header: "Total Kas Masuk", key: "totalDiterima" },
  ]

  const data = monthlySummary.map(m => ({
    bulan: formatMonth(m.bulan),
    jumlahAngsuran: m.jumlahAngsuran,
    totalPokok: `Rp ${m.totalPokok.toLocaleString("id-ID")}`,
    totalBunga: `Rp ${m.totalBunga.toLocaleString("id-ID")}`,
    totalDenda: `Rp ${m.totalDenda.toLocaleString("id-ID")}`,
    totalDiterima: `Rp ${m.totalDiterima.toLocaleString("id-ID")}`,
  }))

  return (
    <ExportButtons
      title="Laporan Pendapatan Bunga Kredit"
      subtitle="Rekap bulanan — dasar jurnal neraca"
      columns={columns}
      data={data}
      filename="laporan-pendapatan-bunga-kredit"
    />
  )
}
