"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { postingSemuaTabungan } from "@/actions/saving.actions"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookCheck, Loader2, CalendarDays } from "lucide-react"
import { formatDate } from "@/lib/format"

interface BatchPostingPanelProps {
  totalPending: number
  pendingByDate: { tanggal: string; jumlah: number }[]
}

export function BatchPostingPanel({ totalPending, pendingByDate }: BatchPostingPanelProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")

  const pendingForDate = selectedDate
    ? (pendingByDate.find(d => d.tanggal === selectedDate)?.jumlah ?? 0)
    : totalPending

  async function handlePosting() {
    setLoading(true)
    const result = await postingSemuaTabungan(selectedDate || undefined)
    if (result.success) {
      toast.success(`${result.jumlah} transaksi berhasil diposting${selectedDate ? ` (${formatDate(new Date(selectedDate))})` : " (semua)"}`)
      router.refresh()
      setSelectedDate("")
    } else {
      toast.error(result.error)
    }
    setLoading(false)
  }

  if (totalPending === 0) return null

  return (
    <Card className="border-0 shadow-sm border-l-4 border-l-amber-400 mb-5">
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <BookCheck className="w-4 h-4 text-amber-600" />
              <p className="text-sm font-semibold text-gray-700">Posting Transaksi Tabungan</p>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Total <span className="font-semibold text-amber-600">{totalPending} transaksi</span> belum diposting.
              Pilih tanggal untuk posting per hari, atau kosongkan untuk posting semua sekaligus.
            </p>

            {/* Filter tanggal */}
            <div className="flex items-end gap-3">
              <div className="space-y-1.5 flex-1 max-w-xs">
                <Label className="text-xs text-gray-600 flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Filter Tanggal (opsional)
                </Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              {/* Preview jumlah */}
              <div className="pb-0.5">
                <p className="text-xs text-gray-500 mb-1">Akan diposting:</p>
                <p className="text-lg font-bold text-amber-600">{pendingForDate} transaksi</p>
              </div>
            </div>
          </div>

          {/* Tombol posting */}
          <div className="shrink-0">
            <ConfirmDialog
              trigger={
                <Button
                  className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto"
                  disabled={loading || pendingForDate === 0}
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    : <BookCheck className="w-4 h-4 mr-1.5" />}
                  {selectedDate ? `Posting ${formatDate(new Date(selectedDate))}` : "Posting Semua"}
                </Button>
              }
              title="Konfirmasi Batch Posting"
              description={`${pendingForDate} transaksi${selectedDate ? ` tanggal ${formatDate(new Date(selectedDate))}` : " (semua pending)"} akan DIKUNCI PERMANEN. Data yang sudah diposting tidak dapat diubah atau dihapus. Lanjutkan?`}
              actionLabel="Posting Sekarang"
              onConfirm={handlePosting}
            />
          </div>
        </div>

        {/* Preview per tanggal */}
        {pendingByDate.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <p className="text-xs text-gray-500 mb-2 font-medium">Rincian transaksi pending per tanggal:</p>
            <div className="flex flex-wrap gap-2">
              {pendingByDate.map(d => (
                <button
                  key={d.tanggal}
                  onClick={() => setSelectedDate(selectedDate === d.tanggal ? "" : d.tanggal)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedDate === d.tanggal
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-gray-600 border-gray-200 hover:border-amber-400 hover:text-amber-600"
                  }`}
                >
                  {formatDate(new Date(d.tanggal))} · {d.jumlah}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
