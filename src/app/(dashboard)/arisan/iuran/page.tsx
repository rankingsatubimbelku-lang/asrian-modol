"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { inputIuran } from "@/actions/arisan.actions"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, Clock } from "lucide-react"
import { currentYearMonth, formatMonth, formatCurrency } from "@/lib/format"

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
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Hanya fetch periode AKTIF
  useEffect(() => {
    fetch("/api/v1/arisan/periods?status=AKTIF")
      .then(r => r.json())
      .then(d => {
        const data: Periode[] = d.data ?? []
        setPeriodes(data)
        // Auto-select jika hanya ada 1 periode aktif
        if (data.length === 1) setSelectedPeriod(data[0].id)
      })
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
    setLoadingId(memberId)
    const fd = new FormData()
    fd.append("periodId", selectedPeriod)
    fd.append("memberId", memberId)
    fd.append("bulan", bulan)
    fd.append("nominal", nominal)
    fd.append("tanggalBayar", new Date().toISOString().split("T")[0])
    const r = await inputIuran(fd)
    if (r.success) {
      toast.success(`Iuran ${members.find(m => m.id === memberId)?.namaLengkap} berhasil dicatat`)
      setPayments(prev => [...prev, { memberId, bulan, status: "LUNAS" }])
    } else {
      toast.error(r.error)
    }
    setLoadingId(null)
  }

  const activePeriode = periodes.find(p => p.id === selectedPeriod)
  const pending = members.filter(m => !isSudahBayar(m.id))
  const lunas = members.filter(m => isSudahBayar(m.id))

  return (
    <div>
      <PageHeader
        title="Input Iuran Arisan"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Arisan" }, { label: "Input Iuran" }]}
      />

      {/* Filter periode & bulan */}
      <Card className="border-0 shadow-sm mb-5">
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Periode Arisan (Aktif)</Label>
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
              {periodes.length === 0 && (
                <p className="text-xs text-amber-600">Tidak ada periode arisan aktif saat ini</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Bulan</Label>
              <Input type="month" value={bulan} onChange={e => setBulan(e.target.value)} className="h-10" />
            </div>
          </div>

          {/* Summary stats */}
          {selectedPeriod && !loading && members.length > 0 && (
            <div className="flex items-center gap-4 mt-4 pt-3 border-t text-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" />
                <span className="text-gray-600">Belum bayar: <span className="font-semibold text-amber-600">{pending.length}</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-gray-600">Sudah lunas: <span className="font-semibold text-green-600">{lunas.length}</span></span>
              </div>
              <div className="text-gray-400">
                Total: {members.length} anggota · {formatCurrency(activePeriode?.besarIuran ?? "0")}/bln
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dua kolom: pending (kiri) | lunas (kanan) */}
      {selectedPeriod && (
        loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : members.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-10 text-center">
              <p className="text-sm text-gray-400">Belum ada anggota terdaftar di periode ini</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Kiri — Belum Bayar */}
            <Card className="border-0 shadow-sm border-t-4 border-t-amber-400">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-semibold text-gray-700">
                    Belum Bayar
                    <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      {pending.length}
                    </span>
                  </h3>
                </div>

                {pending.length === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Semua anggota sudah lunas!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pending.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{m.namaLengkap}</p>
                          <p className="text-xs text-gray-400 font-mono">{m.nomorAnggota}</p>
                        </div>
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-green-600 hover:bg-green-700 shrink-0"
                          disabled={loadingId !== null}
                          onClick={() => handleInputIuran(m.id, activePeriode?.besarIuran ?? "0")}
                        >
                          {loadingId === m.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : "Catat Lunas"
                          }
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Kanan — Sudah Lunas */}
            <Card className="border-0 shadow-sm border-t-4 border-t-green-400">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <h3 className="text-sm font-semibold text-gray-700">
                    Sudah Lunas
                    <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      {lunas.length}
                    </span>
                  </h3>
                </div>

                {lunas.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Belum ada pembayaran bulan ini</p>
                ) : (
                  <div className="space-y-2">
                    {lunas.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-100">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{m.namaLengkap}</p>
                          <p className="text-xs text-gray-400 font-mono">{m.nomorAnggota}</p>
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium shrink-0">
                          ✓ Lunas
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        )
      )}
    </div>
  )
}
