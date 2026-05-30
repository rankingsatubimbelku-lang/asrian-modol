import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/format"
import { CalendarDays, MapPin, User2, PlusCircle } from "lucide-react"
import { KegiatanActions } from "./_components/KegiatanActions"

export default async function KegiatanPage() {
  const session = await requireAuth()
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const events = await prisma.event.findMany({
    orderBy: { tanggal: "asc" },
  })

  const upcoming = events.filter(e => new Date(e.tanggal) >= today)
  const past = events.filter(e => new Date(e.tanggal) < today)

  return (
    <div>
      <PageHeader
        title="Jadwal Kegiatan"
        description={`${upcoming.length} kegiatan mendatang`}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Jadwal Kegiatan" }]}
        action={isAdmin ? { label: "Tambah Kegiatan", href: "/kegiatan/tambah", icon: <PlusCircle className="w-4 h-4 mr-1.5" /> } : undefined}
      />

      <div className="space-y-5">
        {/* Mendatang */}
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Kegiatan Mendatang</h3>
          {upcoming.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-8 text-center text-gray-400 text-sm">
                Belum ada kegiatan mendatang
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {upcoming.map(e => (
                <Card key={e.id} className="border-0 shadow-sm border-l-4 border-l-blue-400">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{e.namaKegiatan}</h4>
                        <div className="mt-2 space-y-1 text-sm text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="font-medium text-blue-700">{formatDate(e.tanggal)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            {e.lokasi}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User2 className="w-3.5 h-3.5 flex-shrink-0" />
                            PIC: {e.pic}
                          </div>
                        </div>
                        {e.deskripsi && (
                          <p className="text-xs text-gray-400 mt-2 italic">{e.deskripsi}</p>
                        )}
                      </div>
                      {isAdmin && <KegiatanActions id={e.id} />}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sudah Lewat */}
        {past.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Kegiatan Sebelumnya</h3>
            <div className="space-y-2">
              {past.slice(-5).reverse().map(e => (
                <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-60">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{e.namaKegiatan}</p>
                    <p className="text-xs text-gray-400">{formatDate(e.tanggal)} · {e.lokasi}</p>
                  </div>
                  {isAdmin && <KegiatanActions id={e.id} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
