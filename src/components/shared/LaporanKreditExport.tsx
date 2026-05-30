"use client"

import { ExportButtons } from "./ExportButtons"

type Loan = {
  nomorPengajuan: string
  member: { namaLengkap: string; nomorAnggota: string }
  nominalPinjaman: unknown
  tenor: number
  status: string
  tanggalPengajuan: Date
}

export function LaporanKreditExport({ loans }: { loans: Loan[] }) {
  const columns = [
    { header: "No. Pengajuan", key: "nomor" },
    { header: "Nama Anggota", key: "nama" },
    { header: "No. Anggota", key: "nomorAnggota" },
    { header: "Nominal", key: "nominal" },
    { header: "Tenor (Bln)", key: "tenor" },
    { header: "Status", key: "status" },
    { header: "Tgl Pengajuan", key: "tanggal" },
  ]

  const data = loans.map(l => ({
    nomor: l.nomorPengajuan,
    nama: l.member.namaLengkap,
    nomorAnggota: l.member.nomorAnggota,
    nominal: `Rp ${Number(l.nominalPinjaman).toLocaleString("id-ID")}`,
    tenor: l.tenor,
    status: l.status,
    tanggal: new Date(l.tanggalPengajuan).toLocaleDateString("id-ID"),
  }))

  return (
    <ExportButtons
      title="Laporan Kredit"
      columns={columns}
      data={data}
      filename="laporan-kredit"
    />
  )
}
