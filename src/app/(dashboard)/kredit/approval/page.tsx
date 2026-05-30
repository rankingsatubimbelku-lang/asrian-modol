import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { formatCurrency, formatDate } from "@/lib/format"
import { ApprovalActions } from "./_components/ApprovalActions"

export default async function ApprovalPage() {
  await requireAdmin()

  const loans = await prisma.loan.findMany({
    where: { status: "MENUNGGU_PERSETUJUAN" },
    include: {
      member: { select: { namaLengkap: true, nomorAnggota: true } },
      interestSetting: { select: { persentase: true, metode: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  const allLoans = await prisma.loan.findMany({
    where: { status: { in: ["DISETUJUI", "DITOLAK"] } },
    include: {
      member: { select: { namaLengkap: true, nomorAnggota: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  })

  return (
    <div>
      <PageHeader
        title="Approval Kredit"
        description={`${loans.length} pengajuan menunggu keputusan`}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Kredit", href: "/kredit" }, { label: "Approval" }]}
      />

      <div className="space-y-5">
        {/* Menunggu approval */}
        {loans.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-10 text-center">
              <p className="text-gray-400 text-sm">Tidak ada pengajuan yang menunggu approval</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {loans.map(loan => (
              <Card key={loan.id} className="border-0 shadow-sm">
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-gray-400">{loan.nomorPengajuan}</span>
                        <StatusBadge status="MENUNGGU_PERSETUJUAN" />
                      </div>
                      <p className="font-semibold text-gray-800">{loan.member.namaLengkap}</p>
                      <p className="text-xs text-gray-400">{loan.member.nomorAnggota}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                        <span className="font-semibold text-blue-700">{formatCurrency(String(loan.nominalPinjaman))}</span>
                        <span>· {loan.tenor} bulan</span>
                        <span>· {String(loan.interestSetting.persentase)}% ({loan.interestSetting.metode})</span>
                        <span>· Diajukan {formatDate(loan.tanggalPengajuan)}</span>
                      </div>
                      {loan.tujuanPinjaman && (
                        <p className="text-xs text-gray-500 mt-1 italic">&quot;{loan.tujuanPinjaman}&quot;</p>
                      )}
                    </div>
                    <ApprovalActions loanId={loan.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Riwayat approval */}
        {allLoans.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Riwayat Approval Terakhir</h3>
            <div className="space-y-2">
              {allLoans.map(l => (
                <div key={l.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{l.member.namaLengkap}</p>
                    <p className="text-xs text-gray-400 font-mono">{l.nomorPengajuan}</p>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
