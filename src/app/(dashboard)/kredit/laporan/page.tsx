import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { formatCurrency } from "@/lib/format"

export default async function LaporanKreditPage() {
  await requireAdmin()

  const [aktif, lunas, ditolak, tunggakan] = await Promise.all([
    prisma.loan.count({ where: { status: "DISETUJUI" } }),
    prisma.loan.count({ where: { status: "LUNAS" } }),
    prisma.loan.count({ where: { status: "DITOLAK" } }),
    prisma.loanInstallment.count({ where: { status: "TERLAMBAT" } }),
  ])

  const totalOutstanding = await prisma.loan.aggregate({
    where: { status: "DISETUJUI" },
    _sum: { nominalPinjaman: true },
  })

  const recentLoans = await prisma.loan.findMany({
    include: { member: { select: { namaLengkap: true, nomorAnggota: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  const stats = [
    { label: "Kredit Aktif", value: aktif, color: "text-blue-600" },
    { label: "Kredit Lunas", value: lunas, color: "text-green-600" },
    { label: "Kredit Ditolak", value: ditolak, color: "text-gray-500" },
    { label: "Angsuran Tunggakan", value: tunggakan, color: "text-red-600" },
  ]

  return (
    <div>
      <PageHeader
        title="Laporan Kredit"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Kredit", href: "/kredit" }, { label: "Laporan" }]}
      />

      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(s => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="pt-4 pb-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-0 shadow-sm max-w-xs">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-400">Total Outstanding Kredit Aktif</p>
            <p className="text-xl font-bold text-gray-800 mt-1">
              {formatCurrency(String(totalOutstanding._sum.nominalPinjaman ?? 0))}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Semua Kredit</h3>
            <div className="space-y-2">
              {recentLoans.map(l => (
                <div key={l.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{l.member.namaLengkap}</p>
                    <p className="text-xs text-gray-400 font-mono">{l.nomorPengajuan}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(String(l.nominalPinjaman))}</p>
                    <StatusBadge status={l.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
