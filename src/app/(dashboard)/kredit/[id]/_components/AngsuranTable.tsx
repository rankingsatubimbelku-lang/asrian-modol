"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { bayarAngsuran } from "@/actions/loan.actions"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatDate } from "@/lib/format"
import { CreditCard } from "lucide-react"
import type { Decimal } from "@prisma/client/runtime/library"

type Installment = {
  id: string
  ke: number
  tanggalJatuhTempo: Date
  tanggalBayar: Date | null
  nominalPokok: Decimal
  nominalBunga: Decimal
  denda: Decimal
  status: string
}

export function AngsuranTable({
  installments, isAdmin, loanStatus,
}: { installments: Installment[]; isAdmin: boolean; loanStatus: string }) {
  const router = useRouter()
  const [tanggalBayar, setTanggalBayar] = useState(new Date().toISOString().split("T")[0])

  async function handleBayar(id: string) {
    const fd = new FormData()
    fd.append("installmentId", id)
    fd.append("tanggalBayar", tanggalBayar)
    const r = await bayarAngsuran(fd)
    if (r.success) {
      toast.success(r.denda && r.denda > 0
        ? `Angsuran lunas. Denda: ${formatCurrency(r.denda)}`
        : "Angsuran berhasil dicatat lunas")
      router.refresh()
    } else {
      toast.error(r.error)
    }
  }

  const today = new Date()

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Jadwal Angsuran</h3>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Ke-", "Jatuh Tempo", "Pokok", "Bunga", "Denda", "Total", "Status", isAdmin && loanStatus === "DISETUJUI" ? "Bayar" : ""].filter(Boolean).map(h => (
                <th key={h as string} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {installments.map(row => {
              const isLate = row.status !== "LUNAS" && new Date(row.tanggalJatuhTempo) < today
              const total = Number(row.nominalPokok) + Number(row.nominalBunga)
              return (
                <tr key={row.id} className={`border-t ${isLate ? "bg-red-50" : ""}`}>
                  <td className="px-3 py-2.5 font-medium">{row.ke}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{formatDate(row.tanggalJatuhTempo)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{formatCurrency(String(row.nominalPokok))}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{formatCurrency(String(row.nominalBunga))}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-red-600">
                    {Number(row.denda) > 0 ? formatCurrency(String(row.denda)) : "-"}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-semibold">{formatCurrency(total + Number(row.denda))}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={isLate && row.status !== "LUNAS" ? "TERLAMBAT" : row.status} /></td>
                  {isAdmin && loanStatus === "DISETUJUI" && (
                    <td className="px-3 py-2.5">
                      {row.status !== "LUNAS" && (
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="date"
                            defaultValue={tanggalBayar}
                            onChange={e => setTanggalBayar(e.target.value)}
                            className="h-7 text-xs w-32"
                          />
                          <ConfirmDialog
                            trigger={
                              <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700">
                                <CreditCard className="w-3 h-3 mr-1" />Bayar
                              </Button>
                            }
                            title="Konfirmasi Pembayaran"
                            description={`Catat pembayaran angsuran ke-${row.ke}? ${isLate ? "Denda keterlambatan akan dihitung otomatis." : ""}`}
                            actionLabel="Konfirmasi Bayar"
                            onConfirm={() => handleBayar(row.id)}
                          />
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
