"use client"

import { ExportButtons } from "./ExportButtons"

type Winner = {
  member: { namaLengkap: string; nomorAnggota: string }
  draw: { bulanUndian: string; tanggalUndian: Date; period: { namaPeriode: string } }
  nominalHak: unknown
}

export function LaporanArisanExport({ winners }: { winners: Winner[] }) {
  const columns = [
    { header: "Nama Pemenang", key: "nama" },
    { header: "No. Anggota", key: "nomor" },
    { header: "Periode", key: "periode" },
    { header: "Bulan Undian", key: "bulan" },
    { header: "Nominal Hak", key: "nominal" },
  ]

  const data = winners.map(w => ({
    nama: w.member.namaLengkap,
    nomor: w.member.nomorAnggota,
    periode: w.draw.period.namaPeriode,
    bulan: w.draw.bulanUndian,
    nominal: `Rp ${Number(w.nominalHak).toLocaleString("id-ID")}`,
  }))

  return (
    <ExportButtons
      title="Laporan Arisan"
      subtitle="Daftar Pemenang Undian"
      columns={columns}
      data={data}
      filename="laporan-arisan"
    />
  )
}
