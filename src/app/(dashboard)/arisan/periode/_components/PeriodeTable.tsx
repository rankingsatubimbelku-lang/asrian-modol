"use client"

import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { activatePeriode, closePeriode } from "@/actions/arisan.actions"
import { DataTable } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { formatDate, formatCurrency } from "@/lib/format"
import { PlayCircle, StopCircle } from "lucide-react"

type Periode = {
  id: string
  namaPeriode: string
  tanggalMulai: Date
  tanggalSelesai: Date
  besarIuran: unknown
  status: string
  _count: { arisanMembers: number; arisanPayments: number }
}

export function PeriodeTable({ periodes }: { periodes: Periode[] }) {
  const router = useRouter()

  async function handleActivate(id: string) {
    const r = await activatePeriode(id)
    if (r.success) { toast.success("Periode diaktifkan") } else { toast.error(r.error) }
    router.refresh()
  }

  async function handleClose(id: string) {
    const r = await closePeriode(id)
    if (r.success) { toast.success("Periode ditutup") } else { toast.error(r.error) }
    router.refresh()
  }

  const columns = [
    { key: "namaPeriode", label: "Nama Periode", render: (r: Periode) => (
      <span className="font-medium text-gray-800">{r.namaPeriode}</span>
    )},
    { key: "tanggalMulai", label: "Mulai", render: (r: Periode) => formatDate(r.tanggalMulai) },
    { key: "tanggalSelesai", label: "Selesai", render: (r: Periode) => formatDate(r.tanggalSelesai) },
    { key: "besarIuran", label: "Iuran/Bln", render: (r: Periode) => formatCurrency(String(r.besarIuran)) },
    { key: "anggota", label: "Anggota", render: (r: Periode) => r._count.arisanMembers },
    { key: "status", label: "Status", render: (r: Periode) => <StatusBadge status={r.status} /> },
    { key: "aksi", label: "Aksi", render: (r: Periode) => (
      <div className="flex gap-1">
        {r.status === "DRAFT" && (
          <ConfirmDialog
            trigger={<Button size="sm" variant="outline" className="text-blue-600 border-blue-200 h-7 text-xs"><PlayCircle className="w-3.5 h-3.5 mr-1" />Aktifkan</Button>}
            title="Aktifkan Periode?"
            description="Semua anggota aktif akan otomatis terdaftar ke periode ini."
            actionLabel="Aktifkan"
            onConfirm={() => handleActivate(r.id)}
          />
        )}
        {r.status === "AKTIF" && (
          <ConfirmDialog
            trigger={<Button size="sm" variant="outline" className="text-red-600 border-red-200 h-7 text-xs"><StopCircle className="w-3.5 h-3.5 mr-1" />Tutup</Button>}
            title="Tutup Periode?"
            description="Periode akan ditutup dan tidak bisa diubah kembali."
            actionLabel="Tutup" destructive
            onConfirm={() => handleClose(r.id)}
          />
        )}
      </div>
    )},
  ]

  return (
    <DataTable
      data={periodes}
      columns={columns}
      searchKeys={["namaPeriode"]}
      searchPlaceholder="Cari periode..."
      emptyText="Belum ada periode arisan"
    />
  )
}
