import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/format"

type JurnalTidakBalance = {
  journalEntryId: string
  nomorJurnal: string
  tanggal: Date | string
  deskripsi: string
  totalDebit: number
  totalKredit: number
  selisih: number
}

type AkunMencurigakan = {
  accountId: string
  kode: string
  nama: string
  saldoSeharusnya: "DEBIT" | "KREDIT"
  saldoAktual: "DEBIT" | "KREDIT"
  nominal: number
}

export function SelisihBanner({
  totalSelisih, jurnalTidakBalance, akunMencurigakan,
}: {
  totalSelisih: number
  jurnalTidakBalance: JurnalTidakBalance[]
  akunMencurigakan: AkunMencurigakan[]
}) {
  if (totalSelisih === 0) return null

  return (
    <div className="mb-5 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <h3 className="font-bold text-red-700 dark:text-red-400">
          NERACA TIDAK BALANCE — Selisih {formatCurrency(Math.abs(totalSelisih))}
        </h3>
      </div>

      {jurnalTidakBalance.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">
            Kemungkinan Penyebab #1 — Jurnal Tidak Balance ({jurnalTidakBalance.length} ditemukan)
          </p>
          <div className="space-y-2">
            {jurnalTidakBalance.map(j => (
              <div key={j.journalEntryId} className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg p-3 text-sm">
                <div>
                  <p className="font-mono text-xs text-gray-500">{j.nomorJurnal} · {formatDate(new Date(j.tanggal))}</p>
                  <p className="font-medium dark:text-gray-200">{j.deskripsi}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Debit: {formatCurrency(j.totalDebit)} · Kredit: {formatCurrency(j.totalKredit)} · Selisih: {formatCurrency(Math.abs(j.selisih))}
                  </p>
                </div>
                <Link
                  href={`/akuntansi/buku-besar?journalId=${j.journalEntryId}`}
                  className="text-xs text-blue-600 hover:underline whitespace-nowrap ml-3"
                >
                  Lihat & Perbaiki →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {akunMencurigakan.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">
            Kemungkinan Penyebab #2 — Akun dengan Saldo Tidak Normal ({akunMencurigakan.length} ditemukan)
          </p>
          <div className="space-y-2">
            {akunMencurigakan.map(a => (
              <div key={a.accountId} className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg p-3 text-sm">
                <div>
                  <p className="font-medium dark:text-gray-200">{a.kode} — {a.nama}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Seharusnya saldo {a.saldoSeharusnya}, tapi aktual {a.saldoAktual} sebesar {formatCurrency(a.nominal)}
                  </p>
                </div>
                <Link
                  href={`/akuntansi/buku-besar?accountId=${a.accountId}`}
                  className="text-xs text-blue-600 hover:underline whitespace-nowrap ml-3"
                >
                  Lihat Riwayat →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {jurnalTidakBalance.length === 0 && akunMencurigakan.length === 0 && (
        <p className="text-xs text-gray-500">
          Tidak ditemukan jurnal timpang maupun akun bersaldo tidak normal — periksa kembali secara manual.
        </p>
      )}
    </div>
  )
}
