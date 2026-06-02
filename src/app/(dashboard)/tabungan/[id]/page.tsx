import { notFound } from "next/navigation"
import Link from "next/link"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/format"
import { ChevronLeft, ChevronRight, PiggyBank } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PostingButton } from "./_components/PostingButton"

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
  const session = await requireAuth()
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
  const { id } = await params
  const { page = "1" } = await searchParams
  const pageNum = Math.max(1, parseInt(page) || 1)

  const saving = await prisma.saving.findUnique({
    where: { id },
    include: { member: { select: { namaLengkap: true, nomorAnggota: true } } },
  })

  if (!saving) notFound()

  const [total, transactions, pendingCount] = await Promise.all([
    prisma.savingsTransaction.count({ where: { savingId: id } }),
    prisma.savingsTransaction.findMany({
      where: { savingId: id },
      orderBy: { tanggal: "desc" },
      skip: (pageNum - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { poster: { select: { email: true } } },
    }),
    prisma.savingsTransaction.count({ where: { savingId: id, isPosted: false } }),
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

      {/* Info saldo + posting */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <Card className="border-0 shadow-sm flex-1 max-w-xs">
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

        {/* Posting status + button */}
        {isAdmin && (
          <Card className={`border-0 shadow-sm flex-1 max-w-sm ${pendingCount > 0 ? "border-l-4 border-l-amber-400" : "border-l-4 border-l-green-400"}`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Status Posting</p>
                  {pendingCount > 0 ? (
                    <>
                      <p className="text-sm font-semibold text-amber-600 mt-0.5">
                        {pendingCount} transaksi belum diposting
                      </p>
                      <p className="text-xs text-gray-400">Posting untuk mengunci data secara permanen</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-green-600 mt-0.5">Semua transaksi sudah diposting</p>
                      <p className="text-xs text-gray-400">Tidak ada transaksi pending</p>
                    </>
                  )}
                </div>
                {pendingCount > 0 && (
                  <PostingButton savingId={id} pendingCount={pendingCount} />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabel histori */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Riwayat Transaksi</p>
            <p className="text-xs text-gray-400">{total} transaksi total</p>
          </div>

          {transactions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Belum ada transaksi</p>
          ) : (
            <>
              {/* Mobile: card list */}
              <div className="space-y-2 sm:hidden">
                {transactions.map(t => (
                  <div key={t.id} className={`flex items-center justify-between p-3 rounded-lg ${t.isPosted ? "bg-gray-50" : "bg-amber-50 border border-amber-200"}`}>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-mono text-xs text-gray-400">{t.nomorTransaksi}</p>
                        {t.isPosted
                          ? <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Posted</span>
                          : <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">Pending</span>
                        }
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(t.tanggal)}</p>
                      {t.keterangan && <p className="text-xs text-gray-400 italic mt-0.5">{t.keterangan}</p>}
                      {t.isPosted && t.poster && (
                        <p className="text-xs text-gray-300 mt-0.5">Diposting: {t.poster.email}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${jenisColor[t.jenis] ?? "text-gray-800"}`}>
                        {t.jenis === "PENARIKAN" ? "-" : "+"}{formatCurrency(String(t.nominal))}
                      </p>
                      <span className="text-xs text-gray-500">{jenisLabel[t.jenis]}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {["No. Transaksi", "Tanggal", "Jenis", "Nominal", "Keterangan", "Status"].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, i) => (
                      <tr key={t.id} className={`border-t ${!t.isPosted ? "bg-amber-50" : i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                        <td className="px-3 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                          {t.nomorTransaksi}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">{formatDate(t.tanggal)}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            t.jenis === "SETORAN" ? "bg-green-100 text-green-700"
                            : t.jenis === "PENARIKAN" ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                          }`}>
                            {jenisLabel[t.jenis]}
                          </span>
                        </td>
                        <td className={`px-3 py-3 font-semibold whitespace-nowrap ${jenisColor[t.jenis] ?? "text-gray-800"}`}>
                          {t.jenis === "PENARIKAN" ? "-" : "+"}{formatCurrency(String(t.nominal))}
                        </td>
                        <td className="px-3 py-3 text-gray-500 text-xs max-w-36 truncate">
                          {t.keterangan ?? "-"}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {t.isPosted ? (
                            <div>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Posted</span>
                              {t.postedAt && (
                                <p className="text-xs text-gray-400 mt-0.5">{formatDate(t.postedAt)}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Pending</span>
                          )}
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
                  <div className="flex items-center gap-1.5">
                    <Link href={`/tabungan/${id}?page=${pageNum - 1}`}>
                      <Button variant="outline" size="icon" className="h-7 w-7" aria-disabled={!hasPrev}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </Link>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = pageNum <= 3 ? i + 1
                        : pageNum >= totalPages - 2 ? totalPages - 4 + i
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
                    <Link href={`/tabungan/${id}?page=${pageNum + 1}`}>
                      <Button variant="outline" size="icon" className="h-7 w-7" aria-disabled={!hasNext}>
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
