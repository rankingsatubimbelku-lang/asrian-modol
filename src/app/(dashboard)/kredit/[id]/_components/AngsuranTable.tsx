"use client"

import { formatCurrency, formatDate } from "@/lib/format"
import type { Decimal } from "@prisma/client/runtime/library"

type Installment = {
  id: string
  ke: number
  tanggalBayar: Date | null
  nominalPokok: Decimal
  nominalBunga: Decimal
  nominalDibayar: Decimal
  status: string
}

export function AngsuranTable({ installments }: { installments: Installment[] }) {
  if (installments.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Riwayat Pembayaran</h3>
        <p className="text-sm text-gray-400 text-center py-8 bg-white dark:bg-gray-900 rounded-lg border dark:border-white/10">
          Belum ada pembayaran tercatat
        </p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Riwayat Pembayaran</h3>
      <div className="overflow-x-auto rounded-lg border dark:border-white/10 bg-white dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/60">
            <tr>
              {["Ke-", "Tanggal Bayar", "Pokok", "Bunga", "Total Dibayar"].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {installments.map((row, i) => (
              <tr key={row.id} className={`border-t dark:border-white/10 ${i % 2 === 1 ? "bg-gray-50/50 dark:bg-gray-800/20" : ""}`}>
                <td className="px-3 py-2.5 font-medium dark:text-gray-200">{row.ke}</td>
                <td className="px-3 py-2.5 whitespace-nowrap dark:text-gray-300">
                  {row.tanggalBayar ? formatDate(row.tanggalBayar) : "-"}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-green-600 dark:text-green-400">{formatCurrency(String(row.nominalPokok))}</td>
                <td className="px-3 py-2.5 whitespace-nowrap text-blue-600 dark:text-blue-400">{formatCurrency(String(row.nominalBunga))}</td>
                <td className="px-3 py-2.5 whitespace-nowrap font-bold dark:text-gray-100">{formatCurrency(String(row.nominalDibayar))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
