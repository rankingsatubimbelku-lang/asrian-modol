"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { jalankanUndian } from "@/actions/arisan.actions"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Trophy, Dices } from "lucide-react"
import { currentYearMonth, formatMonth } from "@/lib/format"

type Periode = { id: string; namaPeriode: string; status: string }

export default function UndianPage() {
  const [periodes, setPeriodes] = useState<Periode[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState("")
  const [bulanUndian, setBulanUndian] = useState(currentYearMonth())
  const [jumlahPemenang, setJumlahPemenang] = useState("1")
  const [loading, setLoading] = useState(false)
  const [hasil, setHasil] = useState<string[] | null>(null)

  useEffect(() => {
    fetch("/api/v1/arisan/periods?status=AKTIF").then(r => r.json()).then(d => {
      const data = d.data ?? []
      setPeriodes(data)
      if (data.length === 1) setSelectedPeriod(data[0].id)
    })
  }, [])

  async function handleUndian() {
    if (!selectedPeriod) { toast.error("Pilih periode terlebih dahulu"); return }
    setLoading(true)
    setHasil(null)
    const fd = new FormData()
    fd.append("periodId", selectedPeriod)
    fd.append("bulanUndian", bulanUndian)
    fd.append("jumlahPemenang", jumlahPemenang)
    const r = await jalankanUndian(fd)
    if (r.success) {
      toast.success("Undian berhasil dijalankan!")
      setHasil(r.pemenang ?? [])
    } else {
      toast.error(r.error)
    }
    setLoading(false)
  }

  return (
    <div>
      <PageHeader
        title="Pengundian Arisan"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Arisan" }, { label: "Pengundian" }]}
      />

      <div className="max-w-lg space-y-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 space-y-4">
            <div className="space-y-1.5">
              <Label>Periode Arisan (Aktif)</Label>
              <select
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">-- Pilih Periode --</option>
                {periodes.map(p => <option key={p.id} value={p.id}>{p.namaPeriode}</option>)}
              </select>
              {periodes.length === 0 && <p className="text-xs text-amber-600">Tidak ada periode arisan aktif</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Bulan Undian</Label>
              <Input type="month" value={bulanUndian} onChange={e => setBulanUndian(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>Jumlah Pemenang</Label>
              <Input type="number" min="1" value={jumlahPemenang} onChange={e => setJumlahPemenang(e.target.value)} className="h-10 w-24" />
            </div>
            <Button
              onClick={handleUndian}
              disabled={loading || !selectedPeriod}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Dices className="w-4 h-4 mr-2" />}
              Jalankan Undian {formatMonth(bulanUndian)}
            </Button>
          </CardContent>
        </Card>

        {hasil && hasil.length > 0 && (
          <Card className="border-0 shadow-sm border-t-4 border-t-yellow-400">
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-gray-800">Pemenang Undian!</h3>
              </div>
              <div className="space-y-2">
                {hasil.map((nama, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <span className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="font-medium text-gray-800">{nama}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
