import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { formatDate, formatCurrency } from "@/lib/format"
import { LaporanArisanExport } from "@/components/shared/LaporanArisanExport"
import { serialize } from "@/lib/serialize"

export default async function LaporanArisanPage() {
  await requireAuth()

  const periodes = serialize(await prisma.arisanPeriod.findMany({
    include: {
      _count: { select: { arisanMembers: true, arisanPayments: true, arisanDraws: true } },
    },
    orderBy: { createdAt: "desc" },
  }))

  const winners = serialize(await prisma.arisanWinner.findMany({
    include: {
      member: { select: { namaLengkap: true, nomorAnggota: true } },
      draw: { select: { bulanUndian: true, tanggalUndian: true, period: { select: { namaPeriode: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  }))

  return (
    <div>
      <PageHeader
        title="Laporan Arisan"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Arisan" }, { label: "Laporan" }]}
      />

      <div className="space-y-5">
        {/* Ringkasan periode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {periodes.map(p => (
            <Card key={p.id} className="border-0 shadow-sm">
              <CardContent className="pt-4 pb-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800 text-sm">{p.namaPeriode}</h3>
                  <StatusBadge status={p.status} />
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  <p>Iuran: <span className="font-medium text-gray-700">{formatCurrency(String(p.besarIuran))}/bln</span></p>
                  <p>{formatDate(p.tanggalMulai)} — {formatDate(p.tanggalSelesai)}</p>
                  <div className="flex gap-3 mt-2 pt-2 border-t">
                    <span>{p._count.arisanMembers} anggota</span>
                    <span>{p._count.arisanPayments} pembayaran</span>
                    <span>{p._count.arisanDraws} undian</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {periodes.length === 0 && (
            <p className="text-sm text-gray-400 col-span-3 text-center py-8">Belum ada periode arisan</p>
          )}
        </div>

        {/* Daftar pemenang */}
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 text-sm">Daftar Pemenang Terbaru</h3>
            <LaporanArisanExport winners={winners} />
          </div>
            {winners.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Belum ada hasil undian</p>
            ) : (
              <div className="space-y-2">
                {winners.map(w => (
                  <div key={w.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-gray-800">{w.member.namaLengkap}</p>
                      <p className="text-xs text-gray-400">{w.draw.period.namaPeriode} · {w.draw.bulanUndian}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">{formatCurrency(String(w.nominalHak))}</p>
                      <p className="text-xs text-gray-400">{formatDate(w.draw.tanggalUndian)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
