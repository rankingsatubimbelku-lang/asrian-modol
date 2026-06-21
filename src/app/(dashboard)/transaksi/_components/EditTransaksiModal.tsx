"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { updateTransaksi } from "@/actions/transaksi.actions"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"

type DecimalLike = { toString(): string } | string | number

type Transaksi = {
  id: string
  jenis: string
  kategori: string
  nominal: DecimalLike
  tanggal: Date | string
  keterangan: string | null
}

interface EditTransaksiModalProps {
  transaksi: Transaksi
  trigger: React.ReactNode
}

export function EditTransaksiModal({ transaksi, trigger }: EditTransaksiModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [jenis, setJenis] = useState(transaksi.jenis)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("jenis", jenis)
    const r = await updateTransaksi(transaksi.id, fd)
    if (r.success) {
      toast.success("Transaksi berhasil diperbarui")
      setOpen(false)
      router.refresh()
    } else {
      toast.error(r.error)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span className="contents" onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Transaksi</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Jenis *</Label>
            <div className="flex gap-3">
              {["PEMASUKAN", "PENGELUARAN"].map(j => (
                <label
                  key={j}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
                    jenis === j
                      ? j === "PEMASUKAN" ? "bg-green-50 border-green-400 text-green-700" : "bg-red-50 border-red-400 text-red-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <input type="radio" name="jenis" value={j} checked={jenis === j} onChange={() => setJenis(j)} className="hidden" />
                  {j === "PEMASUKAN" ? "Pemasukan" : "Pengeluaran"}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Kategori *</Label>
            <Input name="kategori" defaultValue={transaksi.kategori} required className="h-10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nominal (Rp) *</Label>
              <Input name="nominal" type="number" min="1" defaultValue={String(transaksi.nominal)} required className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal *</Label>
              <Input name="tanggal" type="date" defaultValue={format(new Date(transaksi.tanggal), "yyyy-MM-dd")} required className="h-10" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Keterangan</Label>
            <Textarea name="keterangan" defaultValue={transaksi.keterangan ?? ""} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
