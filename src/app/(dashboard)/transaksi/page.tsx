import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { serialize } from "@/lib/serialize"
import { TrendingUp, TrendingDown, Wallet, PlusCircle } from "lucide-react"
import { TransaksiTable } from "./_components/TransaksiTable"

export default async function TransaksiPage({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string }>
}) {
  await requireAdmin()
  const { bulan } = await searchParams

  const where = bulan
    ? {
        tanggal: {
          gte: new Date(`${bulan}-01`),
          lt: new Date(new Date(`${bulan}-01`).setMonth(new Date(`${bulan}-01`).getMonth() + 1)),
        },
      }
    : {}

  const rawTrx = await prisma.generalTransaction.findMany({
    where,
    include: { creator: { select: { email: true } } },
    orderBy: { tanggal: "desc" },
  })

  const transaksi = serialize(rawTrx)

  const totalPemasukan = transaksi.filter(t => t.jenis === "PEMASUKAN").reduce((acc, t) => acc + Number(t.nominal), 0)
  const totalPengeluaran = transaksi.filter(t => t.jenis === "PENGELUARAN").reduce((acc, t) => acc + Number(t.nominal), 0)
  const saldo = totalPemasukan - totalPengeluaran

  return (
    <div>
      <PageHeader
        title="Transaksi Kas Umum"
        description="Pemasukan & pengeluaran di luar tabungan dan kredit"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Transaksi" }]}
        action={{ label: "Tambah Transaksi", href: "/transaksi/tambah", icon: <PlusCircle className="w-4 h-4 mr-1.5" /> }}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Card className="border-0 shadow-sm bg-green-50 dark:bg-green-950/30">
          <CardContent className="pt-4 pb-4 text-center">
            <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-700 dark:text-green-400">{formatCurrency(totalPemasukan)}</p>
            <p className="text-xs text-green-600 dark:text-green-500">Total Pemasukan</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-red-50 dark:bg-red-950/30">
          <CardContent className="pt-4 pb-4 text-center">
            <TrendingDown className="w-5 h-5 text-red-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-red-700 dark:text-red-400">{formatCurrency(totalPengeluaran)}</p>
            <p className="text-xs text-red-600 dark:text-red-500">Total Pengeluaran</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-blue-50 dark:bg-blue-950/30">
          <CardContent className="pt-4 pb-4 text-center">
            <Wallet className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className={`text-lg font-bold ${saldo >= 0 ? "text-blue-700 dark:text-blue-400" : "text-red-700 dark:text-red-400"}`}>
              {formatCurrency(saldo)}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-500">Saldo Bersih</p>
          </CardContent>
        </Card>
      </div>

      <TransaksiTable transaksi={transaksi} filterBulan={bulan} />
    </div>
  )
}
