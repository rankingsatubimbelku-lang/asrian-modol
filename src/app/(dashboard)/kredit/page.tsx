import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { serialize } from "@/lib/serialize"
import { formatCurrency, formatDate } from "@/lib/format"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Eye, PlusCircle } from "lucide-react"

export default async function KreditPage() {
  const session = await requireAuth()
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role)

  const loans = serialize(isAdmin
    ? await prisma.loan.findMany({
        include: {
          member: { select: { namaLengkap: true, nomorAnggota: true } },
          interestSetting: { select: { persentase: true, metode: true } },
          _count: { select: { installments: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : await prisma.loan.findMany({
        where: { member: { userId: session.user.id } },
        include: {
          member: { select: { namaLengkap: true, nomorAnggota: true } },
          interestSetting: { select: { persentase: true, metode: true } },
          _count: { select: { installments: true } },
        },
        orderBy: { createdAt: "desc" },
      }))

  type Loan = typeof loans[0]

  const columns = [
    { key: "nomorPengajuan", label: "No. Pengajuan", className: "font-mono text-xs whitespace-nowrap" },
    { key: "anggota", label: "Anggota", render: (r: Loan) => (
      <div>
        <p className="font-medium text-gray-800 text-sm">{r.member.namaLengkap}</p>
        <p className="text-xs text-gray-400">{r.member.nomorAnggota}</p>
      </div>
    )},
    { key: "nominal", label: "Nominal", render: (r: Loan) => (
      <span className="font-semibold">{formatCurrency(String(r.nominalPinjaman))}</span>
    )},
    { key: "tenor", label: "Tenor", render: (r: Loan) => `${r.tenor} bln` },
    { key: "bunga", label: "Bunga", render: (r: Loan) => `${r.interestSetting.persentase}% (${r.interestSetting.metode})` },
    { key: "tanggalPengajuan", label: "Tgl Pengajuan", render: (r: Loan) => formatDate(r.tanggalPengajuan) },
    { key: "status", label: "Status", render: (r: Loan) => <StatusBadge status={r.status} /> },
    { key: "aksi", label: "Aksi", render: (r: Loan) => (
      <Link href={`/kredit/${r.id}`}>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Eye className="w-4 h-4 text-gray-500" />
        </Button>
      </Link>
    )},
  ]

  return (
    <div>
      <PageHeader
        title="Daftar Kredit"
        description={`${loans.length} pengajuan kredit`}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Kredit" }]}
        action={isAdmin ? { label: "Pengajuan Baru", href: "/kredit/pengajuan", icon: <PlusCircle className="w-4 h-4 mr-1.5" /> } : undefined}
      />
      <DataTable
        data={loans}
        columns={columns}
        searchKeys={["nomorPengajuan"] as never}
        searchPlaceholder="Cari nomor pengajuan..."
        emptyText="Belum ada kredit"
      />
    </div>
  )
}
