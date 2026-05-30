import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate, formatCurrency } from "@/lib/format"
import { MemberDetailActions } from "./_components/MemberDetailActions"

export default async function AnggotaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, role: true } },
      saving: true,
    },
  })

  if (!member) notFound()

  const fields = [
    { label: "No. Anggota", value: member.nomorAnggota },
    { label: "NIK", value: member.nik },
    { label: "Email", value: member.user.email },
    { label: "No. HP", value: member.nomorHp },
    { label: "Tempat Lahir", value: member.tempatLahir },
    { label: "Tanggal Lahir", value: formatDate(member.tanggalLahir) },
    { label: "Tanggal Bergabung", value: formatDate(member.tanggalBergabung) },
    { label: "Alamat", value: member.alamat },
    { label: "Saldo Tabungan", value: formatCurrency(member.saving?.saldo?.toString() ?? "0") },
  ]

  return (
    <div>
      <PageHeader
        title="Detail Anggota"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Anggota", href: "/anggota" },
          { label: member.namaLengkap },
        ]}
      />

      <div className="max-w-2xl space-y-4">
        {/* Header card */}
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{member.namaLengkap}</h2>
                <p className="text-sm text-gray-500 font-mono">{member.nomorAnggota}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={member.status} />
                <MemberDetailActions id={id} status={member.status} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info grid */}
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Informasi Lengkap</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs text-gray-400 font-medium">{label}</dt>
                  <dd className="text-sm text-gray-800 mt-0.5 break-words">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
