"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createPeriode } from "@/actions/arisan.actions"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Users } from "lucide-react"

export default function TambahPeriodePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [jumlahAnggotaAktif, setJumlahAnggotaAktif] = useState<number | null>(null)

  // Tampilkan preview jumlah anggota aktif yang akan didaftarkan
  useEffect(() => {
    fetch("/api/v1/members")
      .then(r => r.json())
      .then(d => setJumlahAnggotaAktif((d.data ?? []).length))
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const result = await createPeriode(new FormData(e.currentTarget))
    if (result.success) {
      const jml = result.jumlahAnggota ?? 0
      toast.success(`Periode berhasil dibuat — ${jml} anggota aktif otomatis terdaftar`)
      router.push("/arisan/periode")
    } else {
      toast.error(result.error)
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Buat Periode Arisan"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Arisan" }, { label: "Periode", href: "/arisan/periode" }, { label: "Buat" },
        ]}
      />
      <Card className="border-0 shadow-sm max-w-lg">
        <CardContent className="pt-5">
          {/* Info anggota yang akan otomatis masuk */}
          {jumlahAnggotaAktif !== null && (
            <div className="mb-4 flex items-center gap-2.5 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                <span className="font-semibold">{jumlahAnggotaAktif} anggota aktif</span> akan otomatis didaftarkan ke periode ini.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Periode *</Label>
              <Input name="namaPeriode" placeholder="cth: Arisan 2026" required className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tanggal Mulai *</Label>
                <Input name="tanggalMulai" type="date" required className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Tanggal Selesai *</Label>
                <Input name="tanggalSelesai" type="date" required className="h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Besar Iuran/Bulan (Rp) *</Label>
                <Input name="besarIuran" type="number" min="0" placeholder="500000" required className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Max Pemenang/Bulan *</Label>
                <Input name="maxPemenangPerBulan" type="number" min="1" placeholder="1" required className="h-10" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Buat Periode
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
