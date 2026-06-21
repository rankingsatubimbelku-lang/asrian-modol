"use client"

import { StatusBadge } from "@/components/shared/StatusBadge"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Decimal } from "@prisma/client/runtime/library"

type Installment = {
  id: string
  ke: number
  tanggalJatuhTempo: Date
  tanggalBayar: Date | null
  nominalPokok: Decimal
  nominalBunga: Decimal
  nominalDibayar: Decimal
  denda: Decimal
  status: string
}

export function AngsuranTable({
  installments,
}: { installments: Installment[]; isAdmin: boolean; loanStatus: string }) {
  const today = new Date()

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Jadwal Angsuran</h3>
      <p className="text-xs text-gray-400 mb-3">
        Bunga &amp; pokok tetap sesuai jadwal awal. Pembayaran dialokasikan otomatis ke angsuran tertua lebih dulu.
      </p>
      <div className="overflow-x-auto rounded-lg border dark:border-white/10 bg-white dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/60">
            <tr>
              {["Ke-", "Jatuh Tempo", "Pokok", "Bunga", "Denda", "Total Tagihan", "Dibayar", "Sisa", "Status"].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {installments.map(row => {
              const isLate = row.status !== "LUNAS" && new Date(row.tanggalJatuhTempo) < today
              const totalTagihan = Number(row.nominalPokok) + Number(row.nominalBunga) + Number(row.denda)
              const dibayar = Number(row.nominalDibayar)
              const sisa = Math.max(0, totalTagihan - dibayar)
              const displayStatus = isLate && row.status === "BELUM_BAYAR" ? "TERLAMBAT" : row.status

              return (
                <tr key={row.id} className={`border-t dark:border-white/10 ${isLate && row.status !== "LUNAS" ? "bg-red-50 dark:bg-red-950/20" : ""}`}>
                  <td className="px-3 py-2.5 font-medium dark:text-gray-200">{row.ke}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap dark:text-gray-300">{formatDate(row.tanggalJatuhTempo)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap dark:text-gray-300">{formatCurrency(String(row.nominalPokok))}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap dark:text-gray-300">{formatCurrency(String(row.nominalBunga))}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-red-600 dark:text-red-400">
                    {Number(row.denda) > 0 ? formatCurrency(String(row.denda)) : "-"}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-semibold dark:text-gray-100">{formatCurrency(totalTagihan)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-green-600 dark:text-green-400">
                    {dibayar > 0 ? formatCurrency(dibayar) : "-"}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-medium">
                    {sisa > 0 ? <span className="text-orange-600 dark:text-orange-400">{formatCurrency(sisa)}</span> : <span className="text-gray-400">Lunas</span>}
                  </td>
                  <td className="px-3 py-2.5"><StatusBadge status={displayStatus} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
