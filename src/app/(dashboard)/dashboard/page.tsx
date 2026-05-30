import { requireAuth } from "@/lib/auth-helpers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users, PiggyBank, CreditCard, Dices,
  TrendingUp, AlertCircle, CalendarDays, ArrowUpRight,
} from "lucide-react"

function StatCard({
  title, value, subtitle, icon, color,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  const session = await requireAuth()
  const role = session.user.role

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Selamat datang,{" "}
          <span className="font-medium">{session.user.email}</span>
        </p>
      </div>

      {/* Super Admin & Admin view */}
      {(role === "SUPER_ADMIN" || role === "ADMIN") && (
        <>
          {/* Stats grid — 2 col mobile, 4 col desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="Total Anggota"
              value="0"
              subtitle="Anggota aktif"
              icon={<Users className="w-5 h-5 text-blue-600" />}
              color="bg-blue-50"
            />
            <StatCard
              title="Total Tabungan"
              value="Rp 0"
              subtitle="Semua anggota"
              icon={<PiggyBank className="w-5 h-5 text-green-600" />}
              color="bg-green-50"
            />
            <StatCard
              title="Kredit Aktif"
              value="0"
              subtitle="Sedang berjalan"
              icon={<CreditCard className="w-5 h-5 text-orange-600" />}
              color="bg-orange-50"
            />
            <StatCard
              title="Arisan Berjalan"
              value="0"
              subtitle="Periode aktif"
              icon={<Dices className="w-5 h-5 text-purple-600" />}
              color="bg-purple-50"
            />
          </div>

          {/* Quick info row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Angsuran jatuh tempo */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    Angsuran Jatuh Tempo
                  </CardTitle>
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm text-gray-400 text-center py-4">
                  Belum ada data angsuran
                </p>
              </CardContent>
            </Card>

            {/* Jadwal terdekat */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    Jadwal Kegiatan Terdekat
                  </CardTitle>
                  <CalendarDays className="w-4 h-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm text-gray-400 text-center py-4">
                  Belum ada jadwal kegiatan
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Super Admin only: activity */}
          {role === "SUPER_ADMIN" && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    Aktivitas Terkini
                  </CardTitle>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm text-gray-400 text-center py-4">
                  Belum ada aktivitas tercatat
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Anggota view */}
      {role === "ANGGOTA" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              title="Saldo Tabungan"
              value="Rp 0"
              subtitle="Per hari ini"
              icon={<PiggyBank className="w-5 h-5 text-green-600" />}
              color="bg-green-50"
            />
            <StatCard
              title="Sisa Kredit"
              value="Rp 0"
              subtitle="Total outstanding"
              icon={<CreditCard className="w-5 h-5 text-orange-600" />}
              color="bg-orange-50"
            />
            <StatCard
              title="Status Arisan"
              value="Belum"
              subtitle="Menang periode ini"
              icon={<Dices className="w-5 h-5 text-purple-600" />}
              color="bg-purple-50"
            />
            <StatCard
              title="Jadwal Terdekat"
              value="-"
              subtitle="Belum ada kegiatan"
              icon={<CalendarDays className="w-5 h-5 text-blue-600" />}
              color="bg-blue-50"
            />
          </div>

          {/* Transaksi terbaru */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Transaksi Terbaru
                </CardTitle>
                <ArrowUpRight className="w-4 h-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-sm text-gray-400 text-center py-4">
                Belum ada riwayat transaksi
              </p>
            </CardContent>
          </Card>

          {/* Angsuran mendatang */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Angsuran Mendatang
                </CardTitle>
                <Badge variant="outline" className="text-xs">Kredit</Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-sm text-gray-400 text-center py-4">
                Tidak ada angsuran mendatang
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
