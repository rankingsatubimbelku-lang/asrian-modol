"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DataTable } from "@/components/shared/DataTable"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/format"
import { deleteTransaksi } from "@/actions/transaksi.actions"
import { Pencil, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { ExportButtons } from "@/components/shared/ExportButtons"
import { EditTransaksiModal } from "./EditTransaksiModal"

type DecimalLike = { toString(): string } | string | number

type Transaksi = {
  id: string
  nomorTransaksi: string
  jenis: string
  kategori: string
  nominal: DecimalLike
  tanggal: Date | string
  keterangan: string | null
  creator: { email: string }
}

export function TransaksiTable({ transaksi, filterBulan }: { transaksi: Transaksi[]; filterBulan?: string }) {
  const router = useRouter()

  async function handleDelete(id: string) {
    const r = await deleteTransaksi(id)
    if (r.success) { toast.success("Transaksi dihapus"); router.refresh() }
    else toast.error(r.error)
  }

  function handleFilterBulan(value: string) {
    const url = value ? `/transaksi?bulan=${value}` : "/transaksi"
    router.push(url)
  }

  const exportColumns = [
    { header: "No. Transaksi", key: "nomor" },
    { header: "Tanggal", key: "tanggal" },
    { header: "Jenis", key: "jenis" },
    { header: "Kategori", key: "kategori" },
    { header: "Nominal", key: "nominal" },
    { header: "Keterangan", key: "keterangan" },
    { header: "Dicatat oleh", key: "creator" },
  ]

  const exportData = transaksi.map(t => ({
    nomor: t.nomorTransaksi,
    tanggal: formatDate(new Date(t.tanggal)),
    jenis: t.jenis === "PEMASUKAN" ? "Pemasukan" : "Pengeluaran",
    kategori: t.kategori,
    nominal: `Rp ${Number(t.nominal).toLocaleString("id-ID")}`,
    keterangan: t.keterangan ?? "-",
    creator: t.creator.email,
  }))

  const columns = [
    { key: "nomorTransaksi", label: "No. Transaksi", className: "font-mono text-xs whitespace-nowrap" },
    { key: "tanggal", label: "Tanggal", render: (r: Transaksi) => formatDate(new Date(r.tanggal)) },
    {
      key: "jenis", label: "Jenis",
      render: (r: Transaksi) => (
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
          r.jenis === "PEMASUKAN" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {r.jenis === "PEMASUKAN" ? <ArrowUpCircle className="w-3 h-3" /> : <ArrowDownCircle className="w-3 h-3" />}
          {r.jenis === "PEMASUKAN" ? "Pemasukan" : "Pengeluaran"}
        </span>
      ),
    },
    { key: "kategori", label: "Kategori" },
    {
      key: "nominal", label: "Nominal",
      render: (r: Transaksi) => (
        <span className={`font-semibold ${r.jenis === "PEMASUKAN" ? "text-green-600" : "text-red-600"}`}>
          {r.jenis === "PEMASUKAN" ? "+" : "-"}{formatCurrency(r.nominal)}
        </span>
      ),
    },
    {
      key: "keterangan", label: "Keterangan",
      render: (r: Transaksi) => <span className="text-xs text-gray-500 max-w-40 truncate block">{r.keterangan ?? "-"}</span>,
    },
    {
      key: "aksi", label: "Aksi",
      render: (r: Transaksi) => (
        <div className="flex items-center gap-1">
          <EditTransaksiModal
            transaksi={r}
            trigger={
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Pencil className="w-3.5 h-3.5 text-blue-500" />
              </Button>
            }
          />
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </Button>
            }
            title="Hapus Transaksi?"
            description={`Transaksi ${r.nomorTransaksi} akan dihapus permanen.`}
            actionLabel="Hapus"
            destructive
            onConfirm={() => handleDelete(r.id)}
          />
        </div>
      ),
    },
  ]

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Filter bulan:</span>
            <Input
              type="month"
              defaultValue={filterBulan}
              onChange={e => handleFilterBulan(e.target.value)}
              className="h-8 text-sm w-40"
            />
            {filterBulan && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => handleFilterBulan("")}>
                Reset
              </Button>
            )}
          </div>
          {transaksi.length > 0 && (
            <ExportButtons
              title="Laporan Transaksi Kas Umum"
              columns={exportColumns}
              data={exportData}
              filename="transaksi-kas-umum"
            />
          )}
        </div>

        <DataTable
          data={transaksi}
          columns={columns}
          searchKeys={["nomorTransaksi", "kategori"] as never}
          searchPlaceholder="Cari nomor transaksi atau kategori..."
          emptyText="Belum ada transaksi"
        />
      </CardContent>
    </Card>
  )
}
