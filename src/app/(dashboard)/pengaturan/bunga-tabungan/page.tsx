"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { saveSavingInterestSetting, hitungBungaOtomatis } from "@/actions/saving.actions"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Loader2, Calculator } from "lucide-react"

type Setting = { id: string; persentase: number; periode: string; berlakuMulai: string; isActive: boolean }

export default function BungaTabunganPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)

  function loadSettings() {
    fetch("/api/v1/savings/settings").then(r => r.json()).then(d => setSettings(d.data ?? []))
  }

  useEffect(() => { loadSettings() }, [])

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const r = await saveSavingInterestSetting(new FormData(e.currentTarget))
    if (r.success) { toast.success("Setting bunga disimpan"); loadSettings() }
    else toast.error(r.error)
    setLoading(false)
  }

  async function handleHitungBunga() {
    setCalculating(true)
    const r = await hitungBungaOtomatis()
    if (r.success) toast.success(`Bunga berhasil dihitung untuk ${r.processed} rekening`)
    else toast.error(r.error)
    setCalculating(false)
  }

  const activeSetting = settings.find(s => s.isActive)

  return (
    <div>
      <PageHeader
        title="Setting Bunga Tabungan"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Pengaturan" }, { label: "Bunga Tabungan" }]}
      />

      <div className="max-w-lg space-y-4">
        {activeSetting && (
          <Card className="border-0 shadow-sm bg-green-50 border-green-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm font-semibold text-green-800">Setting Aktif Saat Ini</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{activeSetting.persentase}% <span className="text-sm font-normal">per {activeSetting.periode === "BULANAN" ? "bulan" : "tahun"}</span></p>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Buat Setting Baru</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Persentase Bunga (%)</Label>
                  <Input name="persentase" type="number" step="0.01" min="0" placeholder="2.5" required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label>Periode Perhitungan</Label>
                  <select name="periode" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" required>
                    <option value="BULANAN">Bulanan</option>
                    <option value="TAHUNAN">Tahunan</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Berlaku Mulai</Label>
                <Input name="berlakuMulai" type="date" required className="h-10"
                  defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Simpan Setting
              </Button>
            </form>
          </CardContent>
        </Card>

        <ConfirmDialog
          trigger={
            <Button variant="outline" className="w-full" disabled={calculating || !activeSetting}>
              {calculating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
              Hitung Bunga Bulan Ini
            </Button>
          }
          title="Hitung Bunga Tabungan?"
          description="Bunga akan dihitung dan ditambahkan ke saldo semua anggota. Proses ini tidak bisa dibatalkan."
          actionLabel="Hitung Sekarang"
          onConfirm={handleHitungBunga}
        />
      </div>
    </div>
  )
}
