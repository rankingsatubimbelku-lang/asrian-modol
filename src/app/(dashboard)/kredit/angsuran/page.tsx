import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { formatCurrency, formatDate } from "@/lib/format"
import { serialize } from "@/lib/serialize"
import { AlertCircle } from "lucide-react"
import { AngsuranInputList } from "./_components/AngsuranInputList"

export default async function InputAngsuranPage() {
  await requireAdmin()

  const today = new Date()

  // Ambil semua angsuran yang belum bayar dari kredit aktif, urutkan by jatuh tempo
  const rawInstallments = await prisma.loanInstallment.findMany({
    where: {
      status: "BELUM_BAYAR",
      loan: { status: "DISETUJUI" },
    },
    include: {
      loan: {
        include: {
          member: { select: { namaLengkap: true, nomorAnggota: true } },
          interestSetting: { select: { dendaPerHari: true } },
        },
      },
    },
    orderBy: { tanggalJatuhTempo: "asc" },
  })

  const installments = serialize(rawInstallments)

  // Pisahkan: jatuh tempo (≤7 hari), terlambat, mendatang
  const terlambat = installments.filter(i => new Date(i.tanggalJatuhTempo) < today)
  const jatuhtempo = installments.filter(i => {
    const d = new Date(i.tanggalJatuhTempo)
    return d >= today && d <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  })
  const mendatang = installments.filter(i => new Date(i.tanggalJatuhTempo) > new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000))

  return (
    <div>
      <PageHeader
        title="Input Angsuran Kredit"
        description="Catat pembayaran angsuran anggota"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Kredit", href: "/kredit" }, { label: "Input Angsuran" }]}
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5 max-w-lg">
        <Card className="border-0 shadow-sm bg-red-50">
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-xl font-bold text-red-700">{terlambat.length}</p>
            <p className="text-xs text-red-600">Terlambat</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-orange-50">
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-xl font-bold text-orange-600">{jatuhtempo.length}</p>
            <p className="text-xs text-orange-500">Jatuh Tempo (7 hari)</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-blue-50">
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-xl font-bold text-blue-600">{mendatang.length}</p>
            <p className="text-xs text-blue-500">Mendatang</p>
          </CardContent>
        </Card>
      </div>

      {installments.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-10 text-center">
            <p className="text-gray-400 text-sm">Tidak ada angsuran yang perlu dibayar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {/* Terlambat */}
          {terlambat.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-semibold text-red-700">Terlambat ({terlambat.length})</h3>
              </div>
              <AngsuranInputList installments={terlambat} variant="danger" />
            </div>
          )}

          {/* Jatuh tempo 7 hari */}
          {jatuhtempo.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-semibold text-orange-700">Jatuh Tempo 7 Hari ({jatuhtempo.length})</h3>
              </div>
              <AngsuranInputList installments={jatuhtempo} variant="warning" />
            </div>
          )}

          {/* Mendatang */}
          {mendatang.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Mendatang ({mendatang.length})</h3>
              <AngsuranInputList installments={mendatang} variant="default" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
