"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createLoan } from "@/actions/loan.actions"
import { generateJadwalAngsuran, hitungTotalPinjaman } from "@/lib/calculations/installment"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Calculator } from "lucide-react"
import { formatCurrency } from "@/lib/format"

type Member = { id: string; namaLengkap: string; nomorAnggota: string }
type Setting = { id: string; persentase: number; metode: string; dendaPerHari: number }

export default function PengajuanKreditPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [setting, setSetting] = useState<Setting | null>(null)
  const [loading, setLoading] = useState(false)
  const [nominal, setNominal] = useState("")
  const [tenor, setTenor] = useState("")
  const [preview, setPreview] = useState<ReturnType<typeof hitungTotalPinjaman> | null>(null)

  useEffect(() => {
    fetch("/api/v1/members").then(r => r.json()).then(d => setMembers(d.data ?? []))
    fetch("/api/v1/loans/settings?active=true").then(r => r.json()).then(d => setSetting(d.data ?? null))
  }, [])

  function hitungPreview() {
    if (!nominal || !tenor || !setting) return
    const jadwal = generateJadwalAngsuran({
      nominalPinjaman: parseFloat(nominal),
      tenor: parseInt(tenor),
      bungaPerTahun: setting.persentase,
      metode: setting.metode as "FLAT" | "EFEKTIF",
      tanggalMulai: new Date(),
    })
    setPreview(hitungTotalPinjaman(jadwal))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const result = await createLoan(new FormData(e.currentTarget))
    if (result.success) {
      toast.success("Pengajuan kredit berhasil dibuat")
      router.push("/kredit/approval")
    } else {
      toast.error(result.error)
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Pengajuan Kredit Baru"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Kredit", href: "/kredit" }, { label: "Pengajuan" }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            {!setting && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3 mb-4">
                Belum ada setting bunga kredit aktif. Atur di{" "}
                <a href="/pengaturan/bunga-kredit" className="underline font-medium">Pengaturan → Bunga Kredit</a>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Anggota *</Label>
                <select name="memberId" required
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">-- Pilih Anggota --</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.namaLengkap} ({m.nomorAnggota})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nominal Pinjaman (Rp) *</Label>
                  <Input name="nominalPinjaman" type="number" min="100000" placeholder="5000000" required className="h-10"
                    value={nominal} onChange={e => { setNominal(e.target.value); setPreview(null) }} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tenor (Bulan) *</Label>
                  <Input name="tenor" type="number" min="1" max="60" placeholder="12" required className="h-10"
                    value={tenor} onChange={e => { setTenor(e.target.value); setPreview(null) }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Tujuan Pinjaman *</Label>
                <Textarea name="tujuanPinjaman" placeholder="Tujuan penggunaan dana pinjaman..." rows={3} required />
              </div>

              <div className="space-y-1.5">
                <Label>Tanggal Pengajuan *</Label>
                <Input name="tanggalPengajuan" type="date" required className="h-10"
                  defaultValue={new Date().toISOString().split("T")[0]} />
              </div>

              {setting && (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                  Bunga aktif: <span className="font-semibold">{setting.persentase}%/tahun ({setting.metode})</span>
                  {" · "}Denda: <span className="font-semibold">{setting.dendaPerHari}%/hari</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={hitungPreview} disabled={!nominal || !tenor || !setting}>
                  <Calculator className="w-4 h-4 mr-1.5" />Simulasi
                </Button>
                <Button type="submit" disabled={loading || !setting} className="bg-blue-600 hover:bg-blue-700">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Ajukan Kredit
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {preview && setting && (
          <Card className="border-0 shadow-sm bg-blue-50 border-blue-200">
            <CardContent className="pt-5">
              <h3 className="font-semibold text-blue-800 mb-4">Simulasi Angsuran</h3>
              <dl className="space-y-3">
                {[
                  { label: "Total Pokok", value: formatCurrency(preview.totalPokok) },
                  { label: "Total Bunga", value: formatCurrency(preview.totalBunga) },
                  { label: "Total Kewajiban", value: formatCurrency(preview.totalCicilan) },
                  { label: "Cicilan/Bulan", value: formatCurrency(Math.round(preview.totalCicilan / parseInt(tenor))) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <dt className="text-sm text-blue-700">{label}</dt>
                    <dd className="font-bold text-blue-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
