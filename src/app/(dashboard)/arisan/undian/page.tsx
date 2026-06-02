"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { simpanHasilUndian } from "@/actions/arisan.actions"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { SpinWheel, type WheelCandidate } from "@/components/shared/SpinWheel"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Loader2, Trophy, Users, AlertCircle, CheckCircle2 } from "lucide-react"
import { currentYearMonth, formatMonth, formatCurrency } from "@/lib/format"

type Periode = { id: string; namaPeriode: string; status: string; besarIuran: string }
type SlotInfo = {
  maxPemenang: number
  pemenangBulanIni: number
  sisaSlot: number
  sudahMaksimal: boolean
  nominalHakPerPemenang: number
}

export default function UndianPage() {
  const [periodes, setPeriodes] = useState<Periode[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState("")
  const [bulanUndian, setBulanUndian] = useState(currentYearMonth())
  const [kandidat, setKandidat] = useState<WheelCandidate[]>([])
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [winner, setWinner] = useState<WheelCandidate | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    fetch("/api/v1/arisan/periods?status=AKTIF")
      .then(r => r.json())
      .then(d => {
        const data: Periode[] = d.data ?? []
        setPeriodes(data)
        if (data.length === 1) setSelectedPeriod(data[0].id)
      })
  }, [])

  const refreshData = useCallback(() => {
    if (!selectedPeriod) return
    setLoading(true)
    setWinner(null)
    setConfirmed(false)

    Promise.all([
      fetch(`/api/v1/arisan/kandidat?periodId=${selectedPeriod}&bulan=${bulanUndian}`)
        .then(r => r.ok ? r.json() : { data: [] }),
      fetch(`/api/v1/arisan/pemenang-bulan?periodId=${selectedPeriod}&bulan=${bulanUndian}`)
        .then(r => r.ok ? r.json() : { data: null }),
    ]).then(([kData, sData]) => {
      setKandidat((kData.data ?? []).map((m: { id: string; namaLengkap: string }) => ({
        id: m.id,
        nama: m.namaLengkap,
      })))
      setSlotInfo(sData.data ?? null)
    }).catch(() => {
      setKandidat([])
      setSlotInfo(null)
    }).finally(() => setLoading(false))
  }, [selectedPeriod, bulanUndian])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  function handleWinner(w: WheelCandidate) {
    setWinner(w)
    setConfirmed(false)
    toast.info(`Roda berhenti di: ${w.nama}`, { duration: 3000 })
  }

  async function handleKonfirmasi() {
    if (!winner || !selectedPeriod) return
    setSaving(true)
    const result = await simpanHasilUndian(selectedPeriod, bulanUndian, winner.id)
    if (result.success) {
      toast.success(`🎉 ${result.namaLengkap} resmi menang arisan ${formatMonth(bulanUndian)}!`)
      setConfirmed(true)
      // Refresh semua data (kandidat + slot info)
      setTimeout(() => refreshData(), 300)
    } else {
      toast.error(result.error)
      setSaving(false)
    }
    setSaving(false)
  }

  const activePeriode = periodes.find(p => p.id === selectedPeriod)
  const spinDisabled = confirmed || saving || (slotInfo?.sudahMaksimal ?? false)

  return (
    <div>
      <PageHeader
        title="Pengundian Arisan"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Arisan" }, { label: "Pengundian" }]}
      />

      {/* Konfigurasi */}
      <Card className="border-0 shadow-sm mb-5 max-w-xl">
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Periode (Aktif)</Label>
              <select
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">-- Pilih Periode --</option>
                {periodes.map(p => <option key={p.id} value={p.id}>{p.namaPeriode}</option>)}
              </select>
              {periodes.length === 0 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />Tidak ada periode aktif
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Bulan Undian</Label>
              <Input type="month" value={bulanUndian} onChange={e => setBulanUndian(e.target.value)} className="h-10" />
            </div>
          </div>

          {/* Info slot pemenang */}
          {selectedPeriod && !loading && slotInfo && (
            <div className={`mt-4 p-3 rounded-lg flex items-center justify-between flex-wrap gap-2 ${
              slotInfo.sudahMaksimal ? "bg-green-50 border border-green-200" : "bg-blue-50 border border-blue-200"
            }`}>
              <div className="flex items-center gap-2 text-sm">
                {slotInfo.sudahMaksimal
                  ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  : <Trophy className="w-4 h-4 text-blue-600 flex-shrink-0" />
                }
                <span className={slotInfo.sudahMaksimal ? "text-green-700 font-medium" : "text-blue-700"}>
                  {slotInfo.sudahMaksimal
                    ? `Kuota penuh — ${slotInfo.maxPemenang} pemenang sudah diundi bulan ini`
                    : <>
                        <span className="font-semibold">{slotInfo.pemenangBulanIni}</span> dari{" "}
                        <span className="font-semibold">{slotInfo.maxPemenang}</span> pemenang bulan ini ·{" "}
                        Sisa <span className="font-semibold text-blue-800">{slotInfo.sisaSlot} slot</span>
                      </>
                  }
                </span>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <span>Dana/pemenang:</span>
                <span className="font-semibold text-gray-700">{formatCurrency(slotInfo.nominalHakPerPemenang)}</span>
              </div>
            </div>
          )}

          {selectedPeriod && !loading && (
            <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{kandidat.length} kandidat eligible · {formatCurrency(activePeriode?.besarIuran ?? "0")}/anggota/bln</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Area Spin Wheel — 70% kiri, 30% kanan */}
      {selectedPeriod && (
        <div className="flex flex-col lg:flex-row gap-4 items-start w-full">

          {/* Spin Wheel — 70% */}
          <Card className="border-0 shadow-sm w-full lg:w-[70%]">
            <CardContent className="pt-5 pb-6 flex items-center justify-center">
              {loading ? (
                <div className="w-80 h-80 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : slotInfo?.sudahMaksimal ? (
                <div className="flex flex-col items-center gap-4 py-12">
                  <CheckCircle2 className="w-16 h-16 text-green-400" />
                  <div className="text-center">
                    <p className="font-bold text-gray-700 text-lg">Undian Bulan Ini Selesai</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {slotInfo.maxPemenang} pemenang sudah diundi untuk {formatMonth(bulanUndian)}
                    </p>
                  </div>
                </div>
              ) : (
                <SpinWheel
                  candidates={kandidat}
                  onWinner={handleWinner}
                  disabled={spinDisabled}
                />
              )}
            </CardContent>
          </Card>

          {/* Panel kanan — 30% */}
          <div className="w-full lg:w-[30%] space-y-4">

            {/* Info kandidat */}
            {!loading && kandidat.length > 0 && !slotInfo?.sudahMaksimal && (
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Kandidat ({kandidat.length})
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {kandidat.map((k, i) => (
                      <div key={k.id} className={`flex items-center gap-2 p-2 rounded text-sm ${
                        winner?.id === k.id ? "bg-yellow-50 border border-yellow-300 font-semibold" : "bg-gray-50"
                      }`}>
                        <span className="text-xs text-gray-400 w-5 text-right">{i + 1}.</span>
                        <span className="text-gray-800">{k.nama}</span>
                        {winner?.id === k.id && <span className="ml-auto text-xs">🎯</span>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tidak ada kandidat */}
            {!loading && kandidat.length === 0 && !slotInfo?.sudahMaksimal && selectedPeriod && (
              <Card className="border-0 shadow-sm bg-amber-50">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-700">Tidak ada kandidat</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        Pastikan anggota sudah bayar iuran {formatMonth(bulanUndian)} dan belum pernah menang.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Konfirmasi pemenang */}
            {winner && !confirmed && !slotInfo?.sudahMaksimal && (
              <Card className="border-0 shadow-sm border-t-4 border-t-yellow-400 bg-yellow-50">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <p className="font-bold text-gray-800">Hasil Undian</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 mb-3 border border-yellow-200">
                    <p className="text-lg font-bold text-gray-800 text-center">{winner.nama}</p>
                    <p className="text-xs text-gray-400 text-center mt-1">
                      {formatMonth(bulanUndian)} · {activePeriode?.namaPeriode}
                    </p>
                    {slotInfo && (
                      <p className="text-sm font-semibold text-green-600 text-center mt-2">
                        {formatCurrency(slotInfo.nominalHakPerPemenang)}
                      </p>
                    )}
                  </div>
                  <ConfirmDialog
                    trigger={
                      <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold" disabled={saving}>
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Konfirmasi & Simpan Hasil
                      </Button>
                    }
                    title="Konfirmasi Pemenang Undian"
                    description={`${winner.nama} akan dicatat sebagai pemenang arisan ${formatMonth(bulanUndian)} dengan dana ${formatCurrency(slotInfo?.nominalHakPerPemenang ?? 0)}. Proses ini tidak bisa dibatalkan.`}
                    actionLabel="Simpan Hasil Undian"
                    onConfirm={handleKonfirmasi}
                  />
                </CardContent>
              </Card>
            )}

            {/* Sukses + info sisa slot */}
            {confirmed && slotInfo && !slotInfo.sudahMaksimal && (
              <Card className="border-0 shadow-sm border-t-4 border-t-green-500 bg-green-50">
                <CardContent className="pt-4 pb-4 text-center">
                  <Trophy className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="font-bold text-green-700">Hasil undian tersimpan!</p>
                  <p className="text-xs text-green-600 mt-1">
                    Sisa <span className="font-semibold">{slotInfo.sisaSlot}</span> slot · Putar kembali
                  </p>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
