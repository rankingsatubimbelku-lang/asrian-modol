"use client"

import Link from "next/link"
import { DataTable } from "@/components/shared/DataTable"
import { formatCurrency, formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { History } from "lucide-react"

type DecimalLike = { toString(): string } | string | number

type Saving = {
  id: string
  saldo: DecimalLike
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
    {
      key: "aksi",
      label: "Aksi",
      render: (r: Saving) => (
        <Link href={`/tabungan/${r.id}`}>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50">
            <History className="w-3.5 h-3.5" />
            Histori
          </Button>
        </Link>
      ),
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
