import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { formatCurrency, formatDate } from "@/lib/format"

export default async function LaporanTabunganPage() {
  const session = await requireAuth()
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role)

  // Admin: ambil semua transaksi dengan relasi member
  const adminTransactions = isAdmin
    ? await prisma.savingsTransaction.findMany({
        include: { saving: { include: { member: { select: { namaLengkap: true } } } } },
        orderBy: { tanggal: "desc" },
        take: 50,
      })
    : []

  // Anggota: ambil transaksi sendiri
  const memberId = !isAdmin
    ? (await prisma.member.findFirst({ where: { userId: session.user.id } }))?.id ?? ""
    : ""

  const anggotaTransactions = !isAdmin
    ? await prisma.savingsTransaction.findMany({
        where: { memberId },
        orderBy: { tanggal: "desc" },
        take: 50,
      })
    : []

  const jenisColor: Record<string, string> = {
    SETORAN: "text-green-600",
    PENARIKAN: "text-red-600",
    BUNGA: "text-blue-600",
  }

  return (
    <div>
      <PageHeader
        title={isAdmin ? "Laporan Tabungan" : "Mutasi Tabungan Saya"}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Tabungan", href: "/tabungan" }, { label: "Laporan" }]}
      />

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5">
          {isAdmin ? (
            adminTransactions.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Belum ada transaksi</p>
            ) : (
              <div className="space-y-2">
                {adminTransactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs font-medium text-gray-600">
                        {t.saving?.member?.namaLengkap ?? "-"}
                      </p>
                      <p className="font-mono text-xs text-gray-400">{t.nomorTransaksi}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDate(t.tanggal)} · {t.keterangan ?? "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${jenisColor[t.jenis] ?? "text-gray-800"}`}>
                        {t.jenis === "PENARIKAN" ? "-" : "+"}{formatCurrency(String(t.nominal))}
                      </p>
                      <StatusBadge status={t.jenis} label={t.jenis === "SETORAN" ? "Setoran" : t.jenis === "PENARIKAN" ? "Penarikan" : "Bunga"} />
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            anggotaTransactions.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Belum ada transaksi</p>
            ) : (
              <div className="space-y-2">
                {anggotaTransactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-mono text-xs text-gray-400">{t.nomorTransaksi}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDate(t.tanggal)} · {t.keterangan ?? "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${jenisColor[t.jenis] ?? "text-gray-800"}`}>
                        {t.jenis === "PENARIKAN" ? "-" : "+"}{formatCurrency(String(t.nominal))}
                      </p>
                      <StatusBadge status={t.jenis} label={t.jenis === "SETORAN" ? "Setoran" : t.jenis === "PENARIKAN" ? "Penarikan" : "Bunga"} />
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  )
}
