import { requireSuperAdmin } from "@/lib/auth-helpers"
import { getNeraca, getAuditSelisihNeraca } from "@/actions/akuntansi.actions"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { TanggalFilter } from "./_components/TanggalFilter"
import { NeracaExport } from "./_components/NeracaExport"
import { SelisihBanner } from "./_components/SelisihBanner"

export default async function NeracaPage({
  searchParams,
}: {
  searchParams: Promise<{ perTanggal?: string }>
}) {
  await requireSuperAdmin()
  const sp = await searchParams
  const perTanggal = sp.perTanggal ?? new Date().toISOString().slice(0, 10)
  const tanggal = new Date(perTanggal)

  const neraca = await getNeraca(tanggal)
  const audit = neraca.selisih !== 0 ? await getAuditSelisihNeraca(tanggal) : null

  return (
    <div>
      <PageHeader
        title="Laporan Neraca"
        description="Aset = Kewajiban + Modal pada tanggal tertentu"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Akuntansi" }, { label: "Neraca" }]}
      />

      <div className="mb-5">
        <TanggalFilter perTanggal={perTanggal} />
      </div>

      {audit && (
        <SelisihBanner
          totalSelisih={audit.totalSelisih}
          jurnalTidakBalance={audit.jurnalTidakBalance}
          akunMencurigakan={audit.akunMencurigakan}
        />
      )}

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Per tanggal: {perTanggal}</h3>
            <NeracaExport
              aset={neraca.aset} kewajiban={neraca.kewajiban} modal={neraca.modal}
              labaBerjalan={neraca.labaBerjalan} totalAset={neraca.totalAset}
              totalKewajibanModal={neraca.totalKewajibanModal} perTanggal={perTanggal}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ASET */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">ASET</p>
              <table className="w-full text-sm">
                <tbody>
                  {neraca.aset.map(a => (
                    <tr key={a.id} className="border-t dark:border-white/10">
                      <td className="px-2 py-2 dark:text-gray-300">{a.nama}</td>
                      <td className="px-2 py-2 text-right dark:text-gray-300">{formatCurrency(a.saldo)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 dark:border-white/20 font-bold">
                    <td className="px-2 py-2 dark:text-gray-100">Total Aset</td>
                    <td className="px-2 py-2 text-right dark:text-gray-100">{formatCurrency(neraca.totalAset)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* KEWAJIBAN & MODAL */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">KEWAJIBAN & MODAL</p>
              <table className="w-full text-sm">
                <tbody>
                  {neraca.kewajiban.map(k => (
                    <tr key={k.id} className="border-t dark:border-white/10">
                      <td className="px-2 py-2 dark:text-gray-300">{k.nama}</td>
                      <td className="px-2 py-2 text-right dark:text-gray-300">{formatCurrency(k.saldo)}</td>
                    </tr>
                  ))}
                  <tr className="border-t dark:border-white/10">
                    <td className="px-2 py-2 font-medium dark:text-gray-200">Total Kewajiban</td>
                    <td className="px-2 py-2 text-right font-medium dark:text-gray-200">{formatCurrency(neraca.totalKewajiban)}</td>
                  </tr>

                  {neraca.modal.map(m => (
                    <tr key={m.id} className="border-t dark:border-white/10">
                      <td className="px-2 py-2 dark:text-gray-300">{m.nama}</td>
                      <td className="px-2 py-2 text-right dark:text-gray-300">{formatCurrency(m.saldo)}</td>
                    </tr>
                  ))}
                  <tr className="border-t dark:border-white/10">
                    <td className="px-2 py-2 dark:text-gray-300">Laba Berjalan</td>
                    <td className="px-2 py-2 text-right dark:text-gray-300">{formatCurrency(neraca.labaBerjalan)}</td>
                  </tr>

                  <tr className="border-t-2 dark:border-white/20 font-bold">
                    <td className="px-2 py-2 dark:text-gray-100">Total Kewajiban + Modal</td>
                    <td className="px-2 py-2 text-right dark:text-gray-100">{formatCurrency(neraca.totalKewajibanModal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
