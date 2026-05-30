"use client"

import { ExportButtons } from "./ExportButtons"

type Trx = {
  nomorTransaksi: string
  jenis: string
  nominal: unknown
  tanggal: Date
  keterangan: string | null
  saving?: { member?: { namaLengkap?: string } } | null
}

export function LaporanTabunganExport({ transactions, isAdmin }: { transactions: Trx[]; isAdmin: boolean }) {
  const columns = [
    ...(isAdmin ? [{ header: "Nama Anggota", key: "nama" }] : []),
    { header: "No. Transaksi", key: "nomor" },
    { header: "Jenis", key: "jenis" },
    { header: "Nominal", key: "nominal" },
    { header: "Tanggal", key: "tanggal" },
    { header: "Keterangan", key: "keterangan" },
  ]

  const data = transactions.map(t => ({
    ...(isAdmin ? { nama: t.saving?.member?.namaLengkap ?? "-" } : {}),
    nomor: t.nomorTransaksi,
    jenis: t.jenis,
    nominal: `Rp ${Number(t.nominal).toLocaleString("id-ID")}`,
    tanggal: new Date(t.tanggal).toLocaleDateString("id-ID"),
    keterangan: t.keterangan ?? "-",
  }))

  return (
    <ExportButtons
      title="Laporan Tabungan"
      columns={columns}
      data={data}
      filename="laporan-tabungan"
    />
  )
}
