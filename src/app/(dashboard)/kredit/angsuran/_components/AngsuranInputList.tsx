"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { bayarAngsuran } from "@/actions/loan.actions"
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
  danger: "bg-red-50 border-red-200 hover:bg-red-50",
  warning: "bg-orange-50 border-orange-200 hover:bg-orange-50",
  default: "bg-gray-50 border-gray-200 hover:bg-gray-100",
}

export function AngsuranInputList({ installments, variant }: AngsuranInputListProps) {
  const router = useRouter()
  const [tanggalBayar, setTanggalBayar] = useState(new Date().toISOString().split("T")[0])
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set())

  async function handleBayar(installmentId: string) {
    setLoadingId(installmentId)
    const fd = new FormData()
    fd.append("installmentId", installmentId)
    fd.append("tanggalBayar", tanggalBayar)
    const r = await bayarAngsuran(fd)
    if (r.success) {
      toast.success(
        r.denda && r.denda > 0
          ? `Angsuran lunas. Denda: ${formatCurrency(r.denda)}`
          : "Angsuran berhasil dicatat lunas"
      )
      setPaidIds(prev => new Set([...prev, installmentId]))
      router.refresh()
    } else {
      toast.error(r.error)
    }
    setLoadingId(null)
  }

  // Hitung estimasi denda berdasarkan tanggal bayar
  function estimasiDenda(inst: Installment): number {
    const today = new Date(tanggalBayar)
    const jatuhTempo = new Date(inst.tanggalJatuhTempo)
    if (today <= jatuhTempo) return 0
    const totalCicilan = Number(inst.nominalPokok) + Number(inst.nominalBunga)
    return hitungDenda({
      nominalAngsuran: totalCicilan,
      dendaPerHari: Number(inst.loan.interestSetting.dendaPerHari),
      tanggalJatuhTempo: jatuhTempo,
      tanggalBayar: today,
    })
  }

  const visible = installments.filter(i => !paidIds.has(i.id))
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
        const totalCicilan = Number(inst.nominalPokok) + Number(inst.nominalBunga)
        const dendaEst = estimasiDenda(inst)
        const isLate = new Date(inst.tanggalJatuhTempo) < new Date()

        return (
          <div
            key={inst.id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border ${variantStyle[variant]}`}
          >
            {/* Info angsuran */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm text-gray-800">{inst.loan.member.namaLengkap}</p>
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
                  <span className="text-red-600">Estimasi denda: <span className="font-medium">{formatCurrency(dendaEst)}</span></span>
                )}
              </div>
            </div>

            {/* Total + aksi */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800">
                  {formatCurrency(totalCicilan + dendaEst)}
                </p>
                {dendaEst > 0 && (
                  <p className="text-xs text-red-500">+denda</p>
                )}
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
                    disabled={loadingId !== null}
                  >
                    {loadingId === inst.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <><CreditCard className="w-3.5 h-3.5 mr-1" />Bayar</>
                    }
                  </Button>
                }
                title="Konfirmasi Pembayaran Angsuran"
                description={`Catat angsuran ke-${inst.ke} ${inst.loan.member.namaLengkap} (${formatCurrency(totalCicilan)})${dendaEst > 0 ? ` + denda ${formatCurrency(dendaEst)}` : ""}?`}
                actionLabel="Konfirmasi Bayar"
                onConfirm={() => handleBayar(inst.id)}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
