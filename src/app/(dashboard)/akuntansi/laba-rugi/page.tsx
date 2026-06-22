import { requireAdmin } from "@/lib/auth-helpers"
import { getLabaRugi } from "@/actions/akuntansi.actions"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { TrendingUp, TrendingDown, Scale } from "lucide-react"
import { PeriodeFilter } from "./_components/PeriodeFilter"
import { LabaRugiExport } from "./_components/LabaRugiExport"

function currentMonthRange() {
  const now = new Date()
  const dari = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const sampai = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  return { dari, sampai }
}

export default async function LabaRugiPage({
  searchParams,
}: {
  searchParams: Promise<{ dari?: string; sampai?: string }>
}) {
  await requireAdmin()
  const sp = await searchParams
  const defaultRange = currentMonthRange()
  const dari = sp.dari ?? defaultRange.dari
  const sampai = sp.sampai ?? defaultRange.sampai

  const laporan = await getLabaRugi(new Date(dari), new Date(sampai))

  return (
    <div>
      <PageHeader
        title="Laporan Laba Rugi"
        description="Pendapatan dikurangi beban pada periode tertentu"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Akuntansi" }, { label: "Laba Rugi" }]}
      />

      <div className="mb-5">
        <PeriodeFilter dari={dari} sampai={sampai} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <Card className="border-0 shadow-sm bg-green-50 dark:bg-green-950/30">
          <CardContent className="pt-4 pb-4 text-center">
            <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-700 dark:text-green-400">{formatCurrency(laporan.totalPendapatan)}</p>
            <p className="text-xs text-green-600 dark:text-green-500">Total Pendapatan</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-red-50 dark:bg-red-950/30">
          <CardContent className="pt-4 pb-4 text-center">
            <TrendingDown className="w-5 h-5 text-red-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-red-700 dark:text-red-400">{formatCurrency(laporan.totalBeban)}</p>
            <p className="text-xs text-red-600 dark:text-red-500">Total Beban</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-blue-50 dark:bg-blue-950/30">
          <CardContent className="pt-4 pb-4 text-center">
            <Scale className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className={`text-lg font-bold ${laporan.labaBersih >= 0 ? "text-blue-700 dark:text-blue-400" : "text-red-700 dark:text-red-400"}`}>
              {formatCurrency(laporan.labaBersih)}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-500">Laba Bersih</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Periode: {dari} s.d. {sampai}
            </h3>
            <LabaRugiExport
              pendapatan={laporan.pendapatan} beban={laporan.beban}
              totalPendapatan={laporan.totalPendapatan} totalBeban={laporan.totalBeban}
              labaBersih={laporan.labaBersih} dari={dari} sampai={sampai}
            />
          </div>

          <table className="w-full text-sm">
            <tbody>
              <tr className="bg-gray-50 dark:bg-gray-800/60">
                <td className="px-3 py-2 font-semibold dark:text-gray-200" colSpan={2}>PENDAPATAN</td>
              </tr>
              {laporan.pendapatan.map(p => (
                <tr key={p.id} className="border-t dark:border-white/10">
                  <td className="px-3 py-2 pl-8 dark:text-gray-300">{p.nama}</td>
                  <td className="px-3 py-2 text-right dark:text-gray-300">{formatCurrency(p.saldo)}</td>
                </tr>
              ))}
              <tr className="border-t dark:border-white/10 font-semibold">
                <td className="px-3 py-2 pl-8 dark:text-gray-100">Total Pendapatan</td>
                <td className="px-3 py-2 text-right dark:text-gray-100">{formatCurrency(laporan.totalPendapatan)}</td>
              </tr>

              <tr className="bg-gray-50 dark:bg-gray-800/60">
                <td className="px-3 py-2 font-semibold dark:text-gray-200" colSpan={2}>BEBAN</td>
              </tr>
              {laporan.beban.map(b => (
                <tr key={b.id} className="border-t dark:border-white/10">
                  <td className="px-3 py-2 pl-8 dark:text-gray-300">{b.nama}</td>
                  <td className="px-3 py-2 text-right dark:text-gray-300">{formatCurrency(b.saldo)}</td>
                </tr>
              ))}
              <tr className="border-t dark:border-white/10 font-semibold">
                <td className="px-3 py-2 pl-8 dark:text-gray-100">Total Beban</td>
                <td className="px-3 py-2 text-right dark:text-gray-100">{formatCurrency(laporan.totalBeban)}</td>
              </tr>

              <tr className="border-t-2 dark:border-white/20 bg-blue-50 dark:bg-blue-950/30 font-bold">
                <td className="px-3 py-3 dark:text-gray-100">LABA BERSIH</td>
                <td className="px-3 py-3 text-right dark:text-gray-100">{formatCurrency(laporan.labaBersih)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
