"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { bayarAngsuranFleksibel } from "@/actions/loan.actions"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Loader2, Wallet } from "lucide-react"
import { formatCurrency } from "@/lib/format"

interface BayarFleksibelFormProps {
  loanId: string
  sisaTotalTagihan: number
}

export function BayarFleksibelForm({ loanId, sisaTotalTagihan }: BayarFleksibelFormProps) {
  const router = useRouter()
  const [nominal, setNominal] = useState("")
  const [tanggalBayar, setTanggalBayar] = useState(new Date().toISOString().split("T")[0])
  const [keterangan, setKeterangan] = useState("")
  const [loading, setLoading] = useState(false)

  const nominalNum = parseFloat(nominal) || 0

  async function handleBayar() {
    if (nominalNum <= 0) return
    setLoading(true)
    const r = await bayarAngsuranFleksibel(loanId, nominalNum, tanggalBayar, keterangan || undefined)
    if (r.success) {
      const sisaMsg = r.kelebihan && r.kelebihan > 0
        ? ` Kelebihan ${formatCurrency(r.kelebihan)} tidak dialokasikan (semua angsuran sudah lunas).`
        : ""
      toast.success(`Pembayaran tercatat, dialokasikan ke ${r.dialokasikanKe} angsuran.${sisaMsg}`)
      setNominal("")
      setKeterangan("")
      router.refresh()
    } else {
      toast.error(r.error)
    }
    setLoading(false)
  }

  return (
    <Card className="border-0 shadow-sm border-l-4 border-l-green-500">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="w-4 h-4 text-green-600" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Catat Pembayaran</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Anggota bebas membayar berapa pun nominalnya — otomatis dialokasikan ke angsuran tertua yang belum lunas.
          Bunga &amp; pokok tetap mengikuti jadwal awal.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nominal Bayar (Rp) *</Label>
            <Input
              type="number"
              min="1"
              placeholder="cth: 250000"
              value={nominal}
              onChange={e => setNominal(e.target.value)}
              className="h-10"
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
        </div>

        <div className="space-y-1.5 mt-4">
          <Label>Keterangan</Label>
          <Textarea
            placeholder="Opsional"
            value={keterangan}
            onChange={e => setKeterangan(e.target.value)}
            rows={2}
          />
        </div>

        <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
          <p className="text-xs text-gray-500">
            Sisa total tagihan: <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(sisaTotalTagihan)}</span>
          </p>

          <ConfirmDialog
            trigger={
              <Button
                className="bg-green-600 hover:bg-green-700"
                disabled={loading || nominalNum <= 0}
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Catat Pembayaran {nominalNum > 0 ? formatCurrency(nominalNum) : ""}
              </Button>
            }
            title="Konfirmasi Pembayaran"
            description={`Catat pembayaran ${formatCurrency(nominalNum)} pada ${tanggalBayar}? Nominal akan dialokasikan otomatis ke angsuran tertua yang belum lunas.`}
            actionLabel="Konfirmasi Bayar"
            onConfirm={handleBayar}
          />
        </div>
      </CardContent>
    </Card>
  )
}
