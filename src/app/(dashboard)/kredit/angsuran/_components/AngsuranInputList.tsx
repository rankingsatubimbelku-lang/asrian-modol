"use client"

import Link from "next/link"
import { BayarAngsuranModal } from "../../[id]/_components/BayarAngsuranModal"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/format"
import { ExternalLink, Wallet } from "lucide-react"

type DecimalLike = { toString(): string } | string | number

type Loan = {
  id: string
  nomorPengajuan: string
  nominalPinjaman: DecimalLike
  sisaPokok: DecimalLike | null
  member: { namaLengkap: string; nomorAnggota: string }
  interestSetting: { metode: string; persentase: DecimalLike }
  _count: { installments: number }
}

export function AngsuranInputList({ loans }: { loans: Loan[] }) {
  return (
    <div className="space-y-2">
      {loans.map(loan => {
        const sisaPokok = Number(loan.sisaPokok ?? loan.nominalPinjaman)

        return (
          <div
            key={loan.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border dark:border-white/10 bg-gray-50 dark:bg-gray-800/40"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{loan.member.namaLengkap}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                <span className="font-mono">{loan.nomorPengajuan}</span>
                <span>{loan.member.nomorAnggota}</span>
                <span>{loan._count.installments} kali bayar</span>
                <span>Bunga {String(loan.interestSetting.persentase)}%/thn ({loan.interestSetting.metode})</span>
              </div>
              <p className="text-sm mt-1">
                Sisa pokok: <span className="font-semibold text-orange-600">{formatCurrency(sisaPokok)}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link href={`/kredit/${loan.id}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Lihat Detail Kredit">
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </Button>
              </Link>

              <BayarAngsuranModal
                loanId={loan.id}
                metode={loan.interestSetting.metode as "FLAT" | "EFEKTIF"}
                persentasePerTahun={Number(loan.interestSetting.persentase)}
                nominalPinjamanAwal={Number(loan.nominalPinjaman)}
                sisaPokok={sisaPokok}
                trigger={
                  <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700">
                    <Wallet className="w-3.5 h-3.5 mr-1" />Bayar
                  </Button>
                }
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
