import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, formatMonth } from "@/lib/format"
import { serialize } from "@/lib/serialize"
import { TrendingUp, Wallet, AlertTriangle, BookText } from "lucide-react"
import Link from "next/link"
import { LaporanBungaExport } from "./_components/LaporanBungaExport"

type MonthSummary = {
  bulan: string
  jumlahAngsuran: number
  totalPokok: number
  totalBunga: number
  totalDenda: number
  totalDiterima: number
}

export default async function LaporanBungaPage({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string }>
}) {
  await requireAdmin()
  const { bulan: filterBulan } = await searchParams

  // Ambil semua angsuran yang sudah LUNAS (bunga baru "direalisasikan" saat lunas)
  const rawLunas = await prisma.loanInstallment.findMany({
    where: { status: "LUNAS", tanggalBayar: { not: null } },
    include: {
      loan: {
        select: {
          nomorPengajuan: true,
          member: { select: { namaLengkap: true, nomorAnggota: true } },
        },
      },
    },
    orderBy: { tanggalBayar: "desc" },
  })

  const lunas = serialize(rawLunas)

  // Group by bulan (YYYY-MM dari tanggalBayar)
  const summaryMap = new Map<string, MonthSummary>()
  for (const inst of lunas) {
    const bulanKey = new Date(String(inst.tanggalBayar)).toISOString().slice(0, 7)
    const existing = summaryMap.get(bulanKey) ?? {
      bulan: bulanKey, jumlahAngsuran: 0, totalPokok: 0, totalBunga: 0, totalDenda: 0, totalDiterima: 0,
    }
    existing.jumlahAngsuran += 1
    existing.totalPokok += Number(inst.nominalPokok)
    existing.totalBunga += Number(inst.nominalBunga)
    existing.totalDenda += Number(inst.denda)
    existing.totalDiterima += Number(inst.nominalPokok) + Number(inst.nominalBunga) + Number(inst.denda)
    summaryMap.set(bulanKey, existing)
  }

  const monthlySummary = Array.from(summaryMap.values()).sort((a, b) => b.bulan.localeCompare(a.bulan))

  const grandTotal = monthlySummary.reduce((acc, m) => ({
    jumlahAngsuran: acc.jumlahAngsuran + m.jumlahAngsuran,
    totalPokok: acc.totalPokok + m.totalPokok,
    totalBunga: acc.totalBunga + m.totalBunga,
    totalDenda: acc.totalDenda + m.totalDenda,
    totalDiterima: acc.totalDiterima + m.totalDiterima,
  }), { jumlahAngsuran: 0, totalPokok: 0, totalBunga: 0, totalDenda: 0, totalDiterima: 0 })

  // Detail per bulan jika difilter
  const detailBulan = filterBulan
    ? lunas.filter(i => new Date(i.tanggalBayar as string).toISOString().slice(0, 7) === filterBulan)
    : []

  return (
    <div>
      <PageHeader
        title="Pendapatan Bunga Kredit"
        description="Dasar pencatatan jurnal pendapatan bunga untuk neraca"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Kredit", href: "/kredit" }, { label: "Pendapatan Bunga" }]}
      />

      {/* Ringkasan total */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Card className="border-0 shadow-sm bg-blue-50 dark:bg-blue-950/30">
          <CardContent className="pt-4 pb-4 text-center">
            <TrendingUp className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{formatCurrency(grandTotal.totalBunga)}</p>
            <p className="text-xs text-blue-600 dark:text-blue-500">Total Pendapatan Bunga</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="pt-4 pb-4 text-center">
            <AlertTriangle className="w-5 h-5 text-amber-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{formatCurrency(grandTotal.totalDenda)}</p>
            <p className="text-xs text-amber-600 dark:text-amber-500">Total Pendapatan Denda</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-green-50 dark:bg-green-950/30">
          <CardContent className="pt-4 pb-4 text-center">
            <Wallet className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-700 dark:text-green-400">{formatCurrency(grandTotal.totalPokok)}</p>
            <p className="text-xs text-green-600 dark:text-green-500">Total Pokok Diterima</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gray-50 dark:bg-gray-800/40">
          <CardContent className="pt-4 pb-4 text-center">
            <BookText className="w-5 h-5 text-gray-600 dark:text-gray-300 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-700 dark:text-gray-200">{grandTotal.jumlahAngsuran}</p>
            <p className="text-xs text-gray-500">Angsuran Lunas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabel bulanan */}
      <Card className="border-0 shadow-sm mb-5">
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Rekap per Bulan</h3>
            <LaporanBungaExport monthlySummary={monthlySummary} />
          </div>

          {monthlySummary.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Belum ada angsuran yang lunas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/60">
                  <tr>
                    {["Bulan", "Jml Angsuran", "Pokok Diterima", "Pendapatan Bunga", "Pendapatan Denda", "Total Kas Masuk", ""].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthlySummary.map(m => (
                    <tr key={m.bulan} className={`border-t dark:border-white/10 ${filterBulan === m.bulan ? "bg-blue-50 dark:bg-blue-950/30" : ""}`}>
                      <td className="px-3 py-2.5 font-medium dark:text-gray-200 whitespace-nowrap">{formatMonth(m.bulan)}</td>
                      <td className="px-3 py-2.5 dark:text-gray-300">{m.jumlahAngsuran}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap dark:text-gray-300">{formatCurrency(m.totalPokok)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(m.totalBunga)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-amber-600 dark:text-amber-400">
                        {m.totalDenda > 0 ? formatCurrency(m.totalDenda) : "-"}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-bold dark:text-gray-100">{formatCurrency(m.totalDiterima)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <Link href={`/kredit/laporan-bunga?bulan=${m.bulan}`} className="text-xs text-blue-600 hover:underline">
                          Lihat Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 dark:border-white/20 bg-gray-50 dark:bg-gray-800/60 font-bold">
                    <td className="px-3 py-2.5 dark:text-gray-100">TOTAL</td>
                    <td className="px-3 py-2.5 dark:text-gray-100">{grandTotal.jumlahAngsuran}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap dark:text-gray-100">{formatCurrency(grandTotal.totalPokok)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-blue-700 dark:text-blue-400">{formatCurrency(grandTotal.totalBunga)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-amber-700 dark:text-amber-400">{formatCurrency(grandTotal.totalDenda)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap dark:text-gray-100">{formatCurrency(grandTotal.totalDiterima)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail per bulan (jika difilter) */}
      {filterBulan && (
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Detail Transaksi — {formatMonth(filterBulan)}
              </h3>
              <Link href="/kredit/laporan-bunga" className="text-xs text-gray-500 hover:underline">
                Tutup detail
              </Link>
            </div>

            {detailBulan.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Tidak ada data</p>
            ) : (
              <div className="space-y-2">
                {detailBulan.map(inst => (
                  <div key={inst.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{inst.loan.member.namaLengkap}</p>
                      <p className="text-xs text-gray-400 font-mono">{inst.loan.nomorPengajuan} · Angsuran ke-{inst.ke}</p>
                    </div>
                    <div className="text-right text-xs space-y-0.5">
                      <p>Pokok: <span className="font-medium">{formatCurrency(String(inst.nominalPokok))}</span></p>
                      <p className="text-blue-600 dark:text-blue-400">Bunga: <span className="font-semibold">{formatCurrency(String(inst.nominalBunga))}</span></p>
                      {Number(inst.denda) > 0 && (
                        <p className="text-amber-600 dark:text-amber-400">Denda: <span className="font-semibold">{formatCurrency(String(inst.denda))}</span></p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Catatan untuk jurnal */}
      <Card className="border-0 shadow-sm bg-slate-50 dark:bg-slate-900/40 mt-5">
        <CardContent className="pt-4 pb-4">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Catatan untuk Jurnal Akuntansi:</p>
          <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 list-disc list-inside">
            <li>Pendapatan bunga diakui (recognized) saat angsuran berstatus <strong>LUNAS</strong>, bukan saat jatuh tempo.</li>
            <li>Contoh jurnal per transaksi: <span className="font-mono">Dr. Kas — Cr. Piutang Kredit (pokok) — Cr. Pendapatan Bunga (bunga) — Cr. Pendapatan Denda (jika ada)</span>.</li>
            <li>Pembayaran sebagian (status SEBAGIAN) belum dihitung sebagai pendapatan bunga sampai angsuran lunas penuh.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
