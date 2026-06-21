import { notFound } from "next/navigation"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/format"
import { AngsuranTable } from "./_components/AngsuranTable"
import { PelunasanButton } from "./_components/PelunasanButton"
import { BayarFleksibelForm } from "./_components/BayarFleksibelForm"
import { serialize } from "@/lib/serialize"

export default async function KreditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth()
  const { id } = await params

  const rawLoan = await prisma.loan.findUnique({
    where: { id },
    include: {
      member: { select: { namaLengkap: true, nomorAnggota: true } },
      interestSetting: true,
      installments: { orderBy: { ke: "asc" } },
    },
  })

  if (!rawLoan) notFound()
  const loan = serialize(rawLoan)

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role)

  const sudahBayar = loan.installments.filter(i => i.status === "LUNAS").length
  const totalDenda = loan.installments.reduce((acc, i) => acc + Number(i.denda), 0)
  const sisaAngsuran = loan.installments.filter(i => i.status !== "LUNAS").length
  const sisaTotalTagihan = loan.installments.reduce((acc, i) => {
    const totalTagihan = Number(i.nominalPokok) + Number(i.nominalBunga) + Number(i.denda)
    const dibayar = Number(i.nominalDibayar)
    return acc + Math.max(0, totalTagihan - dibayar)
  }, 0)

  return (
    <div>
      <PageHeader
        title="Detail Kredit"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Kredit", href: "/kredit" }, { label: loan.nomorPengajuan }]}
      />

      <div className="space-y-4 max-w-3xl">
        {/* Info kredit */}
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <p className="font-mono text-xs text-gray-400">{loan.nomorPengajuan}</p>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{loan.member.namaLengkap}</h2>
                <p className="text-sm text-gray-500">{loan.member.nomorAnggota}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={loan.status} />
                {loan.status === "DISETUJUI" && isAdmin && sisaAngsuran > 0 && (
                  <PelunasanButton loanId={id} />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {[
                { label: "Nominal Pinjaman", value: formatCurrency(String(loan.nominalPinjaman)) },
                { label: "Tenor", value: `${loan.tenor} bulan` },
                { label: "Bunga", value: `${loan.interestSetting.persentase}%/thn (${loan.interestSetting.metode})` },
                { label: "Tgl Pengajuan", value: formatDate(loan.tanggalPengajuan) },
                { label: "Tgl Disetujui", value: loan.tanggalDisetujui ? formatDate(loan.tanggalDisetujui) : "-" },
                { label: "Tgl Lunas", value: loan.tanggalLunas ? formatDate(loan.tanggalLunas) : "-" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{value}</p>
                </div>
              ))}
            </div>

            {loan.tujuanPinjaman && (
              <div className="mt-4 pt-4 border-t dark:border-white/10 text-sm">
                <p className="text-xs text-gray-400 mb-1">Tujuan Pinjaman</p>
                <p className="text-gray-700 dark:text-gray-300">{loan.tujuanPinjaman}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats angsuran */}
        {loan.installments.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Sudah Lunas", value: `${sudahBayar}/${loan.tenor}`, color: "text-green-600" },
              { label: "Sisa Angsuran", value: sisaAngsuran, color: "text-orange-600" },
              { label: "Total Denda", value: formatCurrency(totalDenda), color: "text-red-600" },
            ].map(({ label, value, color }) => (
              <Card key={label} className="border-0 shadow-sm">
                <CardContent className="pt-3 pb-3 text-center">
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Form pembayaran fleksibel */}
        {isAdmin && loan.status === "DISETUJUI" && sisaAngsuran > 0 && (
          <BayarFleksibelForm loanId={id} sisaTotalTagihan={sisaTotalTagihan} />
        )}

        {/* Jadwal angsuran */}
        {loan.installments.length > 0 && (
          <AngsuranTable
            installments={loan.installments}
            isAdmin={isAdmin}
            loanStatus={loan.status}
          />
        )}

        {loan.status === "MENUNGGU_PERSETUJUAN" && (
          <Card className="border-0 shadow-sm bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="py-4 text-center text-sm text-amber-700 dark:text-amber-400">
              Kredit menunggu approval. Jadwal angsuran akan dibuat setelah disetujui.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
