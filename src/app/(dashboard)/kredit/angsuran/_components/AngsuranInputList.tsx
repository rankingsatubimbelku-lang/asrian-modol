"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { bayarAngsuranFleksibel } from "@/actions/loan.actions"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/format"
import { CreditCard, Loader2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { hitungDenda } from "@/lib/calculations/penalty"

type DecimalLike = { toString(): string } | string | number

type Installment = {
  id: string
  ke: number
  tanggalJatuhTempo: Date | string
  nominalPokok: DecimalLike
  nominalBunga: DecimalLike
  nominalDibayar: DecimalLike
  denda: DecimalLike
  status: string
  loan: {
    id: string
    nomorPengajuan: string
    member: { namaLengkap: string; nomorAnggota: string }
    interestSetting: { dendaPerHari: DecimalLike }
  }
}

interface AngsuranInputListProps {
  installments: Installment[]
  variant: "danger" | "warning" | "default"
}

const variantStyle = {
  danger: "bg-red-50 border-red-200 hover:bg-red-50 dark:bg-red-950/20 dark:border-red-900/40",
  warning: "bg-orange-50 border-orange-200 hover:bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900/40",
  default: "bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-800/40 dark:border-white/10",
}

export function AngsuranInputList({ installments, variant }: AngsuranInputListProps) {
  const router = useRouter()
  const [tanggalBayar, setTanggalBayar] = useState(new Date().toISOString().split("T")[0])
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())
  // Nominal input per baris — default ke sisa tagihan
  const [nominalInput, setNominalInput] = useState<Record<string, string>>({})

  function sisaTagihan(inst: Installment, dendaEst: number): number {
    const total = Number(inst.nominalPokok) + Number(inst.nominalBunga) + dendaEst
    const dibayar = Number(inst.nominalDibayar)
    return Math.max(0, total - dibayar)
  }

  function estimasiDenda(inst: Installment): number {
    const tglBayar = new Date(tanggalBayar)
    const jatuhTempo = new Date(inst.tanggalJatuhTempo)
    if (tglBayar <= jatuhTempo) return Number(inst.denda)
    const totalCicilan = Number(inst.nominalPokok) + Number(inst.nominalBunga)
    return hitungDenda({
      nominalAngsuran: totalCicilan,
      dendaPerHari: Number(inst.loan.interestSetting.dendaPerHari),
      tanggalJatuhTempo: jatuhTempo,
      tanggalBayar: tglBayar,
    })
  }

  function getNominal(inst: Installment, sisa: number): string {
    return nominalInput[inst.id] ?? String(sisa)
  }

  async function handleBayar(inst: Installment, nominal: number) {
    if (nominal <= 0) return
    setLoadingId(inst.id)
    const r = await bayarAngsuranFleksibel(inst.loan.id, nominal, tanggalBayar)
    if (r.success) {
      toast.success(`Pembayaran ${formatCurrency(nominal)} tercatat untuk ${inst.loan.member.namaLengkap}`)
      setDoneIds(prev => new Set([...prev, inst.id]))
      router.refresh()
    } else {
      toast.error(r.error)
    }
    setLoadingId(null)
  }

  const visible = installments.filter(i => !doneIds.has(i.id))
  if (visible.length === 0) return null

  return (
    <div className="space-y-2">
      {/* Tanggal bayar global */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs text-gray-500 whitespace-nowrap">Tanggal bayar:</span>
        <Input
          type="date"
          value={tanggalBayar}
          onChange={e => setTanggalBayar(e.target.value)}
          className="h-8 text-sm w-40"
        />
      </div>

      {visible.map(inst => {
        const dendaEst = estimasiDenda(inst)
        const sisa = sisaTagihan(inst, dendaEst)
        const isLate = new Date(inst.tanggalJatuhTempo) < new Date()
        const nominalStr = getNominal(inst, sisa)
        const nominalNum = parseFloat(nominalStr) || 0

        return (
          <div
            key={inst.id}
            className={`flex flex-col sm:flex-row sm:items-end justify-between gap-3 p-3 rounded-lg border ${variantStyle[variant]}`}
          >
            {/* Info angsuran */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{inst.loan.member.namaLengkap}</p>
                <span className="font-mono text-xs text-gray-400">{inst.loan.member.nomorAnggota}</span>
                {isLate && <Badge variant="destructive" className="text-xs py-0">Terlambat</Badge>}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                <span className="font-mono">{inst.loan.nomorPengajuan}</span>
                <span>Angsuran ke-{inst.ke}</span>
                <span>Jatuh tempo: <span className={isLate ? "text-red-600 font-medium" : ""}>{formatDate(new Date(inst.tanggalJatuhTempo))}</span></span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs flex-wrap">
                <span>Pokok: <span className="font-medium">{formatCurrency(String(inst.nominalPokok))}</span></span>
                <span>Bunga: <span className="font-medium">{formatCurrency(String(inst.nominalBunga))}</span></span>
                {dendaEst > 0 && (
                  <span className="text-red-600">Denda: <span className="font-medium">{formatCurrency(dendaEst)}</span></span>
                )}
                {Number(inst.nominalDibayar) > 0 && (
                  <span className="text-green-600">Sudah dibayar: <span className="font-medium">{formatCurrency(String(inst.nominalDibayar))}</span></span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Sisa tagihan: <span className="font-semibold text-orange-600">{formatCurrency(sisa)}</span>
              </p>
            </div>

            {/* Nominal bebas + aksi */}
            <div className="flex items-end gap-2 shrink-0">
              <div className="space-y-1">
                <span className="text-xs text-gray-400">Nominal bayar</span>
                <Input
                  type="number"
                  min="1"
                  value={nominalStr}
                  onChange={e => setNominalInput(prev => ({ ...prev, [inst.id]: e.target.value }))}
                  className="h-8 text-sm w-32"
                />
              </div>

              <Link href={`/kredit/${inst.loan.id}`} className="shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Lihat Detail Kredit">
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </Button>
              </Link>

              <ConfirmDialog
                trigger={
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-green-600 hover:bg-green-700 shrink-0"
                    disabled={loadingId !== null || nominalNum <= 0}
                  >
                    {loadingId === inst.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <><CreditCard className="w-3.5 h-3.5 mr-1" />Bayar</>
                    }
                  </Button>
                }
                title="Konfirmasi Pembayaran"
                description={`Catat pembayaran ${formatCurrency(nominalNum)} dari ${inst.loan.member.namaLengkap}? Nominal akan dialokasikan otomatis ke angsuran tertua yang belum lunas pada kredit ini.`}
                actionLabel="Konfirmasi Bayar"
                onConfirm={() => handleBayar(inst, nominalNum)}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
