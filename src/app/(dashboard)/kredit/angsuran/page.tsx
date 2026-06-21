import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { serialize } from "@/lib/serialize"
import { Wallet } from "lucide-react"
import { AngsuranInputList } from "./_components/AngsuranInputList"

export default async function InputAngsuranPage() {
  await requireAdmin()

  // Semua kredit aktif (DISETUJUI) — tidak ada lagi jadwal/jatuh tempo,
  // jumlah & tanggal pembayaran ditentukan fleksibel setiap bulan oleh admin.
  const rawLoans = await prisma.loan.findMany({
    where: { status: "DISETUJUI" },
    include: {
      member: { select: { namaLengkap: true, nomorAnggota: true } },
      interestSetting: { select: { metode: true, persentase: true } },
      _count: { select: { installments: true } },
    },
    orderBy: { tanggalDisetujui: "asc" },
  })

  const loans = serialize(rawLoans).filter(l => Number(l.sisaPokok ?? l.nominalPinjaman) > 0)

  return (
    <div>
      <PageHeader
        title="Input Angsuran Kredit"
        description="Catat pembayaran bulanan — nominal bebas, bunga tetap sesuai metode"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Kredit", href: "/kredit" }, { label: "Input Angsuran" }]}
      />

      <Card className="border-0 shadow-sm mb-5 max-w-md">
        <CardContent className="pt-4 pb-4 flex items-center gap-3">
          <div className="bg-blue-50 dark:bg-blue-950/30 p-2.5 rounded-xl">
            <Wallet className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{loans.length}</p>
            <p className="text-xs text-gray-500">Kredit aktif perlu dibayar</p>
          </div>
        </CardContent>
      </Card>

      {loans.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-10 text-center">
            <p className="text-gray-400 text-sm">Tidak ada kredit aktif saat ini</p>
          </CardContent>
        </Card>
      ) : (
        <AngsuranInputList loans={loans} />
      )}
    </div>
  )
}
