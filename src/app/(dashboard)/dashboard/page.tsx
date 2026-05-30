import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users, PiggyBank, CreditCard, Dices,
  TrendingUp, AlertCircle, CalendarDays, ArrowUpRight,
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/format"
import Link from "next/link"

function StatCard({
  title, value, subtitle, icon, color, href,
}: {
  title: string; value: string; subtitle?: string
  icon: React.ReactNode; color: string; href?: string
}) {
  const content = (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1 truncate">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <div className={`p-2.5 rounded-xl flex-shrink-0 ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

export default async function DashboardPage() {
  const session = await requireAuth()
  const role = session.user.role

  if (role === "ANGGOTA") {
    // Cari member berdasarkan user id
    const member = await prisma.member.findFirst({
      where: { userId: session.user.id },
      include: { saving: true },
    })

    const activeLoan = await prisma.loan.findFirst({
      where: { memberId: member?.id, status: "DISETUJUI" },
      include: { installments: { where: { status: "BELUM_BAYAR" }, orderBy: { ke: "asc" }, take: 1 } },
    })

    const arisanStatus = await prisma.arisanMember.findFirst({
      where: { memberId: member?.id },
      include: { period: { select: { namaPeriode: true } } },
    })

    const nextEvent = await prisma.event.findFirst({
      where: { tanggal: { gte: new Date() } },
      orderBy: { tanggal: "asc" },
    })

    const recentTrx = await prisma.savingsTransaction.findMany({
      where: { memberId: member?.id },
      orderBy: { tanggal: "desc" },
      take: 5,
    })

    const nextAngsuran = activeLoan?.installments[0]

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Selamat datang, <span className="font-medium">{session.user.email}</span></p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard title="Saldo Tabungan" value={formatCurrency(String(member?.saving?.saldo ?? 0))}
            subtitle="Per hari ini" icon={<PiggyBank className="w-5 h-5 text-green-600" />} color="bg-green-50" href="/tabungan" />
          <StatCard title="Sisa Kredit" value={activeLoan ? formatCurrency(String(activeLoan.nominalPinjaman)) : "Tidak ada"}
            subtitle={activeLoan ? `${activeLoan.installments.length} angsuran tersisa` : "Kredit aktif"}
            icon={<CreditCard className="w-5 h-5 text-orange-600" />} color="bg-orange-50" href="/kredit" />
          <StatCard title="Status Arisan" value={arisanStatus?.sudahMenang ? "Sudah Menang" : "Belum Menang"}
            subtitle={arisanStatus?.period.namaPeriode ?? "Belum ikut periode"}
            icon={<Dices className="w-5 h-5 text-purple-600" />} color="bg-purple-50" href="/arisan/periode" />
          <StatCard title="Kegiatan" value={nextEvent ? formatDate(nextEvent.tanggal) : "-"}
            subtitle={nextEvent?.namaKegiatan ?? "Belum ada jadwal"}
            icon={<CalendarDays className="w-5 h-5 text-blue-600" />} color="bg-blue-50" href="/kegiatan" />
        </div>

        {nextAngsuran && (
          <Card className="border-0 shadow-sm border-l-4 border-l-orange-400">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                Angsuran Mendatang
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Ke-{nextAngsuran.ke} · Jatuh tempo {formatDate(nextAngsuran.tanggalJatuhTempo)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Pokok + Bunga</p>
                </div>
                <p className="text-lg font-bold text-orange-600">
                  {formatCurrency(String(Number(nextAngsuran.nominalPokok) + Number(nextAngsuran.nominalBunga)))}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center justify-between">
              Transaksi Terbaru
              <Link href="/tabungan/laporan" className="text-xs text-blue-600 font-normal hover:underline">Lihat semua</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {recentTrx.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Belum ada transaksi</p>
            ) : (
              <div className="space-y-2">
                {recentTrx.map(t => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{t.jenis}</p>
                      <p className="text-xs text-gray-400">{formatDate(t.tanggal)}</p>
                    </div>
                    <p className={`text-sm font-semibold ${t.jenis === "PENARIKAN" ? "text-red-600" : "text-green-600"}`}>
                      {t.jenis === "PENARIKAN" ? "-" : "+"}{formatCurrency(String(t.nominal))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Admin & Super Admin dashboard
  const [totalAnggota, totalTabungan, kreditAktif, arisanAktif, tunggakan, recentLogs, nextEvent] = await Promise.all([
    prisma.member.count({ where: { status: "AKTIF" } }),
    prisma.saving.aggregate({ _sum: { saldo: true } }),
    prisma.loan.count({ where: { status: "DISETUJUI" } }),
    prisma.arisanPeriod.findFirst({ where: { status: "AKTIF" } }),
    prisma.loanInstallment.count({ where: { status: "TERLAMBAT" } }),
    role === "SUPER_ADMIN"
      ? prisma.activityLog.findMany({ include: { user: { select: { email: true } } }, orderBy: { createdAt: "desc" }, take: 8 })
      : Promise.resolve([]),
    prisma.event.findFirst({ where: { tanggal: { gte: new Date() } }, orderBy: { tanggal: "asc" } }),
  ])

  const angsuranJatuhTempo = await prisma.loanInstallment.findMany({
    where: { status: "BELUM_BAYAR", tanggalJatuhTempo: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
    include: { loan: { include: { member: { select: { namaLengkap: true } } } } },
    orderBy: { tanggalJatuhTempo: "asc" },
    take: 5,
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Selamat datang, <span className="font-medium">{session.user.email}</span></p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Anggota" value={String(totalAnggota)} subtitle="Anggota aktif"
          icon={<Users className="w-5 h-5 text-blue-600" />} color="bg-blue-50" href="/anggota" />
        <StatCard title="Total Tabungan" value={formatCurrency(String(totalTabungan._sum.saldo ?? 0))} subtitle="Semua anggota"
          icon={<PiggyBank className="w-5 h-5 text-green-600" />} color="bg-green-50" href="/tabungan" />
        <StatCard title="Kredit Aktif" value={String(kreditAktif)} subtitle={tunggakan > 0 ? `${tunggakan} menunggak` : "Semua lancar"}
          icon={<CreditCard className="w-5 h-5 text-orange-600" />} color="bg-orange-50" href="/kredit" />
        <StatCard title="Arisan Berjalan" value={arisanAktif ? "Aktif" : "Tidak ada"} subtitle={arisanAktif?.namaPeriode ?? "Belum ada periode aktif"}
          icon={<Dices className="w-5 h-5 text-purple-600" />} color="bg-purple-50" href="/arisan/periode" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-orange-500" />Angsuran Jatuh Tempo (7 hari)</span>
              <Link href="/kredit" className="text-xs text-blue-600 font-normal hover:underline">Lihat semua</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {angsuranJatuhTempo.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Tidak ada angsuran jatuh tempo</p>
            ) : (
              <div className="space-y-2">
                {angsuranJatuhTempo.map(a => (
                  <div key={a.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{a.loan.member.namaLengkap}</p>
                      <p className="text-xs text-gray-400">Ke-{a.ke} · {formatDate(a.tanggalJatuhTempo)}</p>
                    </div>
                    <p className="text-sm font-semibold text-orange-600">
                      {formatCurrency(String(Number(a.nominalPokok) + Number(a.nominalBunga)))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-blue-500" />Jadwal Terdekat</span>
              <Link href="/kegiatan" className="text-xs text-blue-600 font-normal hover:underline">Lihat semua</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {!nextEvent ? (
              <p className="text-sm text-gray-400 text-center py-4">Belum ada jadwal kegiatan</p>
            ) : (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-800">{nextEvent.namaKegiatan}</p>
                <p className="text-sm text-blue-600 mt-1">{formatDate(nextEvent.tanggal)}</p>
                <p className="text-xs text-blue-500 mt-0.5">{nextEvent.lokasi}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {role === "SUPER_ADMIN" && recentLogs.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-green-500" />Aktivitas Terkini
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {(recentLogs as Awaited<typeof recentLogs>).map(log => (
                <div key={log.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{log.module}</Badge>
                    <span className="text-gray-700">{log.action}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{log.user.email}</p>
                    <p className="text-xs text-gray-400">{formatDate(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
