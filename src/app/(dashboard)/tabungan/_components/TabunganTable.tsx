"use client"

import { DataTable } from "@/components/shared/DataTable"
import { formatCurrency, formatDate } from "@/lib/format"

type Saving = {
  id: string
  saldo: string
  updatedAt: Date | string
  member: { namaLengkap: string; nomorAnggota: string }
}

export function TabunganTable({ savings }: { savings: Saving[] }) {
  const columns = [
    {
      key: "member",
      label: "Anggota",
      render: (r: Saving) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-100">{r.member.namaLengkap}</p>
          <p className="text-xs text-gray-400 font-mono">{r.member.nomorAnggota}</p>
        </div>
      ),
    },
    {
      key: "saldo",
      label: "Saldo",
      render: (r: Saving) => (
        <span className="font-semibold text-green-600">{formatCurrency(r.saldo)}</span>
      ),
    },
    {
      key: "updatedAt",
      label: "Update Terakhir",
      render: (r: Saving) => formatDate(new Date(r.updatedAt)),
    },
  ]

  return (
    <DataTable
      data={savings}
      columns={columns}
      searchKeys={["member"] as never}
      searchPlaceholder="Cari anggota..."
      emptyText="Belum ada data tabungan"
    />
  )
}
