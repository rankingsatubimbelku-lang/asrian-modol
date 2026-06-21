"use client"

import Link from "next/link"
import { DataTable } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { formatCurrency, formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

type DecimalLike = { toString(): string } | string | number

type Loan = {
  id: string
  nomorPengajuan: string
  nominalPinjaman: DecimalLike
  tenor: number
  status: string
  tanggalPengajuan: Date | string
  sisaPinjaman: number
  member: { namaLengkap: string; nomorAnggota: string }
  interestSetting: { persentase: DecimalLike; metode: string }
}

export function KreditTable({ loans }: { loans: Loan[] }) {
  const columns = [
    { key: "nomorPengajuan", label: "No. Pengajuan", className: "font-mono text-xs whitespace-nowrap" },
    {
      key: "anggota", label: "Anggota",
      render: (r: Loan) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{r.member.namaLengkap}</p>
          <p className="text-xs text-gray-400">{r.member.nomorAnggota}</p>
        </div>
      ),
    },
    {
      key: "nominal", label: "Pinjaman Awal",
      render: (r: Loan) => (
        <span className="font-semibold">{formatCurrency(r.nominalPinjaman)}</span>
      ),
    },
    {
      key: "sisaPinjaman", label: "Sisa Pinjaman",
      render: (r: Loan) => (
        r.status === "DISETUJUI" ? (
          <span className={`font-semibold ${r.sisaPinjaman > 0 ? "text-orange-600" : "text-green-600"}`}>
            {formatCurrency(r.sisaPinjaman)}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )
      ),
    },
    { key: "tenor", label: "Tenor", render: (r: Loan) => `${r.tenor} bln` },
    {
      key: "bunga", label: "Bunga",
      render: (r: Loan) => `${r.interestSetting.persentase}% (${r.interestSetting.metode})`,
    },
    {
      key: "tanggalPengajuan", label: "Tgl Pengajuan",
      render: (r: Loan) => formatDate(new Date(r.tanggalPengajuan)),
    },
    { key: "status", label: "Status", render: (r: Loan) => <StatusBadge status={r.status} /> },
    {
      key: "aksi", label: "Aksi",
      render: (r: Loan) => (
        <Link href={`/kredit/${r.id}`}>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Eye className="w-4 h-4 text-gray-500" />
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <DataTable
      data={loans}
      columns={columns}
      searchKeys={["nomorPengajuan"] as never}
      searchPlaceholder="Cari nomor pengajuan..."
      emptyText="Belum ada kredit"
    />
  )
}
