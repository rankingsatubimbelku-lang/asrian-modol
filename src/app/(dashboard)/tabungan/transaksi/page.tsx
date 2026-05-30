"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { inputTransaksiTabungan } from "@/actions/saving.actions"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/format"

type Member = { id: string; namaLengkap: string; nomorAnggota: string; saving?: { saldo: number } }

export default function TransaksiTabunganPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState("")
  const [jenis, setJenis] = useState("SETORAN")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/v1/members?withSaldo=true").then(r => r.json()).then(d => setMembers(d.data ?? []))
  }, [])

  const member = members.find(m => m.id === selectedMember)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const result = await inputTransaksiTabungan(new FormData(e.currentTarget))
    if (result.success) {
      toast.success("Transaksi berhasil dicatat")
      ;(e.target as HTMLFormElement).reset()
      setSelectedMember("")
      // Refresh members untuk update saldo
      fetch("/api/v1/members?withSaldo=true").then(r => r.json()).then(d => setMembers(d.data ?? []))
    } else {
      toast.error(result.error)
    }
    setLoading(false)
  }

  return (
    <div>
      <PageHeader
        title="Input Transaksi Tabungan"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Tabungan", href: "/tabungan" }, { label: "Transaksi" }]}
      />
      <Card className="border-0 shadow-sm max-w-lg">
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Anggota *</Label>
              <select
                name="memberId"
                value={selectedMember}
                onChange={e => setSelectedMember(e.target.value)}
                required
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">-- Pilih Anggota --</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.namaLengkap} ({m.nomorAnggota})</option>
                ))}
              </select>
              {member?.saving && (
                <p className="text-xs text-gray-500">
                  Saldo: <span className="font-semibold text-green-600">{formatCurrency(String(member.saving.saldo))}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Jenis Transaksi *</Label>
              <div className="flex gap-3">
                {["SETORAN", "PENARIKAN"].map(j => (
                  <label key={j} className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${jenis === j ? "bg-blue-50 border-blue-400 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    <input type="radio" name="jenis" value={j} checked={jenis === j} onChange={() => setJenis(j)} className="hidden" />
                    {j === "SETORAN" ? "💰 Setoran" : "🏧 Penarikan"}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nominal (Rp) *</Label>
                <Input name="nominal" type="number" min="1000" placeholder="100000" required className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Tanggal *</Label>
                <Input name="tanggal" type="date" required className="h-10"
                  defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Keterangan</Label>
              <Textarea name="keterangan" placeholder="Keterangan (opsional)" rows={2} />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Catat Transaksi
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
