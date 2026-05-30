"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { saveLoanInterestSetting } from "@/actions/loan.actions"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

type Setting = { id: string; persentase: number; metode: string; dendaPerHari: number; berlakuMulai: string; isActive: boolean }

export default function BungaKreditPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(false)

  function loadSettings() {
    fetch("/api/v1/loans/settings").then(r => r.json()).then(d => setSettings(d.data ?? []))
  }

  useEffect(() => { loadSettings() }, [])

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const r = await saveLoanInterestSetting(new FormData(e.currentTarget))
    if (r.success) { toast.success("Setting bunga kredit disimpan"); loadSettings() }
    else toast.error(r.error)
    setLoading(false)
  }

  const activeSetting = settings.find(s => s.isActive)

  return (
    <div>
      <PageHeader
        title="Setting Bunga Kredit"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Pengaturan" }, { label: "Bunga Kredit" }]}
      />

      <div className="max-w-lg space-y-4">
        {activeSetting && (
          <Card className="border-0 shadow-sm bg-blue-50">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm font-semibold text-blue-800">Setting Aktif</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {activeSetting.persentase}%/tahun
                <span className="text-sm font-normal ml-2">({activeSetting.metode})</span>
              </p>
              <p className="text-sm text-blue-600 mt-0.5">Denda: {activeSetting.dendaPerHari}% per hari</p>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Buat Setting Baru</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Bunga per Tahun (%)</Label>
                  <Input name="persentase" type="number" step="0.01" min="0" placeholder="12" required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label>Metode Bunga</Label>
                  <select name="metode" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" required>
                    <option value="FLAT">Flat</option>
                    <option value="EFEKTIF">Efektif (Annuitas)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Denda per Hari (%)</Label>
                  <Input name="dendaPerHari" type="number" step="0.01" min="0" placeholder="0.1" required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label>Berlaku Mulai</Label>
                  <Input name="berlakuMulai" type="date" required className="h-10"
                    defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Simpan Setting
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
