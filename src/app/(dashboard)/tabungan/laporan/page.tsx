import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/format"
import { LaporanTabunganExport } from "@/components/shared/LaporanTabunganExport"
import { CheckCircle2 } from "lucide-react"

export default async function LaporanTabunganPage() {
  const session = await requireAuth()
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role)

  const memberId = !isAdmin
    ? (await prisma.member.findFirst({ where: { userId: session.user.id } }))?.id ?? ""
    : ""

  // LAPORAN VALID: hanya transaksi yang sudah diposting
  const adminTransactions = isAdmin
    ? await prisma.savingsTransaction.findMany({
        where: { isPosted: true },
        include: {
          saving: { include: { member: { select: { namaLengkap: true } } } },
          poster: { select: { email: true } },
        },
        orderBy: { tanggal: "desc" },
        take: 100,
      })
    : []

  const anggotaTransactions = !isAdmin
    ? await prisma.savingsTransaction.findMany({
        where: { memberId, isPosted: true },
        orderBy: { tanggal: "desc" },
        take: 50,
      })
    : []

  // Statistik posting (admin only)
  const [totalPosted, totalPending] = isAdmin
    ? await Promise.all([
        prisma.savingsTransaction.count({ where: { isPosted: true } }),
        prisma.savingsTransaction.count({ where: { isPosted: false } }),
      ])
    : [0, 0]

  const jenisColor: Record<string, string> = {
    SETORAN: "text-green-600",
    PENARIKAN: "text-red-600",
    BUNGA: "text-blue-600",
  }

  const transactions = isAdmin ? adminTransactions : anggotaTransactions

  return (
    <div>
      <PageHeader
        title={isAdmin ? "Laporan Tabungan Valid" : "Mutasi Tabungan Saya"}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Tabungan", href: "/tabungan" }, { label: "Laporan" }]}
      />

      {/* Status posting (admin only) */}
      {isAdmin && (
        <div className="grid grid-cols-2 gap-3 mb-5 max-w-sm">
          <Card className="border-0 shadow-sm bg-green-50">
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-xl font-bold text-green-700">{totalPosted}</p>
              <p className="text-xs text-green-600">Sudah Diposting</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-amber-50">
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-xl font-bold text-amber-700">{totalPending}</p>
              <p className="text-xs text-amber-600">Belum Diposting</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5">
          {/* Header dengan keterangan laporan valid */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-sm font-semibold text-gray-700">
                Data Transaksi Valid (Sudah Diposting)
              </p>
            </div>
            {isAdmin && transactions.length > 0 && (
              <LaporanTabunganExport transactions={transactions} isAdmin={isAdmin} />
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">Belum ada transaksi yang diposting</p>
              {isAdmin && totalPending > 0 && (
                <p className="text-xs text-amber-600 mt-2">
                  Ada {totalPending} transaksi pending — lakukan posting di halaman Histori Tabungan
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {isAdmin
                ? adminTransactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs font-medium text-gray-600">
                        {(t.saving as { member?: { namaLengkap?: string } })?.member?.namaLengkap ?? "-"}
                      </p>
                      <p className="font-mono text-xs text-gray-400">{t.nomorTransaksi}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-500">{formatDate(t.tanggal)}</p>
                        {t.poster && (
                          <p className="text-xs text-green-600">· Diposting oleh {t.poster.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${jenisColor[t.jenis] ?? "text-gray-800"}`}>
                        {t.jenis === "PENARIKAN" ? "-" : "+"}{formatCurrency(String(t.nominal))}
                      </p>
                      <p className="text-xs text-gray-400">{t.jenis}</p>
                    </div>
                  </div>
                ))
                : anggotaTransactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-mono text-xs text-gray-400">{t.nomorTransaksi}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(t.tanggal)} · {t.keterangan ?? "-"}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${jenisColor[t.jenis] ?? "text-gray-800"}`}>
                        {t.jenis === "PENARIKAN" ? "-" : "+"}{formatCurrency(String(t.nominal))}
                      </p>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
