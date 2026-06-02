import { notFound } from "next/navigation"
import Link from "next/link"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { formatCurrency, formatDate } from "@/lib/format"
import { ChevronLeft, ChevronRight, PiggyBank } from "lucide-react"

const PER_PAGE = 10

const jenisColor: Record<string, string> = {
  SETORAN: "text-green-600",
  PENARIKAN: "text-red-600",
  BUNGA: "text-blue-600",
}

const jenisLabel: Record<string, string> = {
  SETORAN: "Setoran",
  PENARIKAN: "Penarikan",
  BUNGA: "Bunga",
}

export default async function TabunganHistoriPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}) {
  await requireAuth()
  const { id } = await params
  const { page = "1" } = await searchParams
  const pageNum = Math.max(1, parseInt(page) || 1)

  const saving = await prisma.saving.findUnique({
    where: { id },
    include: { member: { select: { namaLengkap: true, nomorAnggota: true } } },
  })

  if (!saving) notFound()

  const [total, transactions] = await Promise.all([
    prisma.savingsTransaction.count({ where: { savingId: id } }),
    prisma.savingsTransaction.findMany({
      where: { savingId: id },
      orderBy: { tanggal: "desc" },
      skip: (pageNum - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  const hasPrev = pageNum > 1
  const hasNext = pageNum < totalPages

  return (
    <div>
      <PageHeader
        title={`Histori Tabungan — ${saving.member.namaLengkap}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Tabungan", href: "/tabungan" },
          { label: "Histori" },
        ]}
      />

      {/* Info saldo */}
      <Card className="border-0 shadow-sm mb-5 max-w-xs">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2.5 rounded-xl">
              <PiggyBank className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-mono">{saving.member.nomorAnggota}</p>
              <p className="text-xs text-gray-400">Saldo saat ini</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(saving.saldo)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel histori */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">
              Riwayat Transaksi
            </p>
            <p className="text-xs text-gray-400">{total} transaksi total</p>
          </div>

          {transactions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Belum ada transaksi</p>
          ) : (
            <>
              {/* Mobile: card list */}
              <div className="space-y-2 sm:hidden">
                {transactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-mono text-xs text-gray-400">{t.nomorTransaksi}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(t.tanggal)}</p>
                      {t.keterangan && (
                        <p className="text-xs text-gray-400 italic mt-0.5">{t.keterangan}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${jenisColor[t.jenis] ?? "text-gray-800"}`}>
                        {t.jenis === "PENARIKAN" ? "-" : "+"}{formatCurrency(String(t.nominal))}
                      </p>
                      <StatusBadge status={t.jenis} label={jenisLabel[t.jenis] ?? t.jenis} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {["No. Transaksi", "Tanggal", "Jenis", "Nominal", "Keterangan"].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, i) => (
                      <tr key={t.id} className={`border-t ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                        <td className="px-3 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                          {t.nomorTransaksi}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">{formatDate(t.tanggal)}</td>
                        <td className="px-3 py-3">
                          <StatusBadge status={t.jenis} label={jenisLabel[t.jenis] ?? t.jenis} />
                        </td>
                        <td className={`px-3 py-3 font-semibold whitespace-nowrap ${jenisColor[t.jenis] ?? "text-gray-800"}`}>
                          {t.jenis === "PENARIKAN" ? "-" : "+"}{formatCurrency(String(t.nominal))}
                        </td>
                        <td className="px-3 py-3 text-gray-500 text-xs max-w-48 truncate">
                          {t.keterangan ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginasi */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <p className="text-xs text-gray-500">
                    Halaman {pageNum} dari {totalPages} ({total} data)
                  </p>
                  <div className="flex items-center gap-2">
                    <Link href={`/tabungan/${id}?page=${pageNum - 1}`}>
                      <Button
                        variant="outline" size="icon" className="h-7 w-7"
                        disabled={!hasPrev}
                        aria-disabled={!hasPrev}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </Link>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const p = pageNum <= 3
                          ? i + 1
                          : pageNum >= totalPages - 2
                          ? totalPages - 4 + i
                          : pageNum - 2 + i
                        if (p < 1 || p > totalPages) return null
                        return (
                          <Link key={p} href={`/tabungan/${id}?page=${p}`}>
                            <Button
                              variant={p === pageNum ? "default" : "outline"}
                              size="icon"
                              className={`h-7 w-7 text-xs ${p === pageNum ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                            >
                              {p}
                            </Button>
                          </Link>
                        )
                      })}
                    </div>
                    <Link href={`/tabungan/${id}?page=${pageNum + 1}`}>
                      <Button
                        variant="outline" size="icon" className="h-7 w-7"
                        disabled={!hasNext}
                        aria-disabled={!hasNext}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
