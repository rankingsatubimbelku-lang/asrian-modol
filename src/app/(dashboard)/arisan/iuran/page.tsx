"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { inputIuran } from "@/actions/arisan.actions"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Loader2 } from "lucide-react"
import { currentYearMonth, formatMonth } from "@/lib/format"

type Periode = { id: string; namaPeriode: string; besarIuran: string }
type Member = { id: string; namaLengkap: string; nomorAnggota: string }
type Payment = { memberId: string; bulan: string; status: string }

export default function IuranPage() {
  const [periodes, setPeriodes] = useState<Periode[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState("")
  const [bulan, setBulan] = useState(currentYearMonth())
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  useEffect(() => {
    fetch("/api/v1/arisan/periods").then(r => r.json()).then(d => setPeriodes(d.data ?? []))
  }, [])

  useEffect(() => {
    if (!selectedPeriod) return
    setLoading(true)
    Promise.all([
      fetch(`/api/v1/arisan/members?periodId=${selectedPeriod}`).then(r => r.json()),
      fetch(`/api/v1/arisan/payments?periodId=${selectedPeriod}&bulan=${bulan}`).then(r => r.json()),
    ]).then(([m, p]) => {
      setMembers(m.data ?? [])
      setPayments(p.data ?? [])
    }).finally(() => setLoading(false))
  }, [selectedPeriod, bulan])

  function isSudahBayar(memberId: string) {
    return payments.some(p => p.memberId === memberId && p.bulan === bulan)
  }

  async function handleInputIuran(memberId: string, nominal: string) {
    setSubmitLoading(true)
    const fd = new FormData()
    fd.append("periodId", selectedPeriod)
    fd.append("memberId", memberId)
    fd.append("bulan", bulan)
    fd.append("nominal", nominal)
    fd.append("tanggalBayar", new Date().toISOString().split("T")[0])
    const r = await inputIuran(fd)
    if (r.success) {
      toast.success("Iuran berhasil dicatat")
      setPayments(prev => [...prev, { memberId, bulan, status: "LUNAS" }])
    } else {
      toast.error(r.error)
    }
    setSubmitLoading(false)
  }

  const activePeriode = periodes.find(p => p.id === selectedPeriod)

  return (
    <div>
      <PageHeader
        title="Input Iuran Arisan"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Arisan" }, { label: "Input Iuran" }]}
      />

      <Card className="border-0 shadow-sm max-w-2xl mb-5">
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Periode Arisan</Label>
              <select
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">-- Pilih Periode --</option>
                {periodes.map(p => (
                  <option key={p.id} value={p.id}>{p.namaPeriode}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Bulan</Label>
              <Input type="month" value={bulan} onChange={e => setBulan(e.target.value)} className="h-10" />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedPeriod && (
        <Card className="border-0 shadow-sm max-w-2xl">
          <CardContent className="pt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Iuran {formatMonth(bulan)} — {activePeriode?.namaPeriode}
            </h3>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
            ) : members.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Belum ada anggota terdaftar di periode ini</p>
            ) : (
              <div className="space-y-2">
                {members.map(m => {
                  const sudah = isSudahBayar(m.id)
                  return (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{m.namaLengkap}</p>
                        <p className="text-xs text-gray-400 font-mono">{m.nomorAnggota}</p>
                      </div>
                      {sudah ? (
                        <StatusBadge status="LUNAS" />
                      ) : (
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-green-600 hover:bg-green-700"
                          disabled={submitLoading}
                          onClick={() => handleInputIuran(m.id, activePeriode?.besarIuran ?? "0")}
                        >
                          Catat Lunas
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
