"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { catatPembayaranBulanan } from "@/actions/loan.actions"
import { pecahPembayaranBulanan } from "@/lib/calculations/installment"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Wallet } from "lucide-react"
import { formatCurrency } from "@/lib/format"

interface BayarAngsuranModalProps {
  loanId: string
  metode: "FLAT" | "EFEKTIF"
  persentasePerTahun: number
  nominalPinjamanAwal: number
  sisaPokok: number
  trigger?: React.ReactNode
}

export function BayarAngsuranModal({
  loanId, metode, persentasePerTahun, nominalPinjamanAwal, sisaPokok, trigger,
}: BayarAngsuranModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [nominal, setNominal] = useState("")
  const [tanggalBayar, setTanggalBayar] = useState(new Date().toISOString().split("T")[0])
  const [keterangan, setKeterangan] = useState("")
  const [loading, setLoading] = useState(false)

  const nominalNum = parseFloat(nominal) || 0
  const preview = nominalNum > 0
    ? pecahPembayaranBulanan({ nominalBayar: nominalNum, metode, persentasePerTahun, nominalPinjamanAwal, sisaPokok })
    : null

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (nominalNum <= 0) return
    setLoading(true)
    const fd = new FormData()
    fd.append("loanId", loanId)
    fd.append("nominalBayar", nominal)
    fd.append("tanggalBayar", tanggalBayar)
    fd.append("keterangan", keterangan)

    const r = await catatPembayaranBulanan(fd)
    if (r.success) {
      toast.success(
        r.lunas
          ? `Pembayaran tercatat — kredit LUNAS! 🎉`
          : `Pembayaran ke-${r.ke} tercatat. Sisa pokok: ${formatCurrency(r.sisaPokokBaru ?? 0)}`
      )
      setOpen(false)
      setNominal("")
      setKeterangan("")
      router.refresh()
    } else {
      toast.error(r.error)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {trigger ?? (
          <Button className="bg-green-600 hover:bg-green-700">
            <Wallet className="w-4 h-4 mr-1.5" />Bayar Angsuran
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Catat Pembayaran Angsuran</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <p className="text-xs text-gray-500">
            Anggota bebas membayar berapa pun — bunga tetap dihitung sesuai metode{" "}
            <span className="font-semibold">{metode}</span>, sisanya otomatis jadi pokok.
          </p>

          <div className="space-y-1.5">
            <Label>Nominal Bayar (Rp) *</Label>
            <Input
              type="number"
              min="1"
              placeholder="cth: 300000"
              value={nominal}
              onChange={e => setNominal(e.target.value)}
              className="h-10"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>Tanggal Bayar *</Label>
            <Input
              type="date"
              value={tanggalBayar}
              onChange={e => setTanggalBayar(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Keterangan</Label>
            <Textarea
              placeholder="Opsional"
              value={keterangan}
              onChange={e => setKeterangan(e.target.value)}
              rows={2}
            />
          </div>

          {/* Preview pemecahan bunga/pokok */}
          {preview && (
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Bunga bulan ini</span>
                <span className="font-semibold text-blue-700 dark:text-blue-400">{formatCurrency(preview.bunga)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Mengurangi pokok</span>
                <span className="font-semibold text-green-700 dark:text-green-400">{formatCurrency(preview.pokok)}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t dark:border-white/10">
                <span className="text-gray-500">Sisa pokok setelah ini</span>
                <span className="font-bold">{formatCurrency(preview.sisaPokokBaru)}</span>
              </div>
              {preview.sisaPokokBaru <= 0 && (
                <p className="text-xs text-green-600 font-medium pt-1">✓ Kredit akan LUNAS setelah pembayaran ini</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={loading || nominalNum <= 0} className="bg-green-600 hover:bg-green-700">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Konfirmasi Bayar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
