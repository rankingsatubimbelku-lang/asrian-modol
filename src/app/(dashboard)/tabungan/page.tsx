import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/shared/DataTable"
import { formatCurrency, formatDate } from "@/lib/format"
import { PiggyBank } from "lucide-react"
import { serialize } from "@/lib/serialize"

export default async function TabunganPage() {
  const session = await requireAuth()
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role)

  const savings = isAdmin
    ? await prisma.saving.findMany({
        include: { member: { select: { namaLengkap: true, nomorAnggota: true } } },
        orderBy: { saldo: "desc" },
      })
    : await prisma.saving.findMany({
        where: { member: { userId: session.user.id } },
        include: { member: { select: { namaLengkap: true, nomorAnggota: true } } },
      })

  const totalSaldo = savings.reduce((acc, s) => acc + Number(s.saldo), 0)

  const columns = [
    { key: "member", label: "Anggota", render: (r: typeof savings[0]) => (
      <div>
        <p className="font-medium text-gray-800">{r.member.namaLengkap}</p>
        <p className="text-xs text-gray-400 font-mono">{r.member.nomorAnggota}</p>
      </div>
    )},
    { key: "saldo", label: "Saldo", render: (r: typeof savings[0]) => (
      <span className="font-semibold text-green-600">{formatCurrency(String(r.saldo))}</span>
    )},
    { key: "updatedAt", label: "Update Terakhir", render: (r: typeof savings[0]) => formatDate(r.updatedAt) },
  ]

  return (
    <div>
      <PageHeader
        title={isAdmin ? "Daftar Tabungan" : "Tabungan Saya"}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Tabungan" }]}
        action={isAdmin ? { label: "Input Transaksi", href: "/tabungan/transaksi" } : undefined}
      />

      {isAdmin && (
        <Card className="border-0 shadow-sm mb-4 max-w-xs">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-2.5 rounded-xl">
                <PiggyBank className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Seluruh Tabungan</p>
                <p className="text-lg font-bold text-gray-800">{formatCurrency(totalSaldo)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable
        data={savings}
        columns={columns}
        searchKeys={["member"] as never}
        searchPlaceholder="Cari anggota..."
        emptyText="Belum ada data tabungan"
      />
    </div>
  )
}
