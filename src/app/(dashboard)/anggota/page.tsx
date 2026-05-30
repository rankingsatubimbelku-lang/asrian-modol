import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/PageHeader"
import { MemberTable } from "./_components/MemberTable"
import { UserPlus } from "lucide-react"

export default async function AnggotaPage() {
  await requireAdmin()

  const members = await prisma.member.findMany({
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <PageHeader
        title="Daftar Anggota"
        description={`${members.length} anggota terdaftar`}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Anggota" }]}
        action={{ label: "Tambah Anggota", href: "/anggota/tambah", icon: <UserPlus className="w-4 h-4 mr-1.5" /> }}
      />
      <MemberTable members={members} />
    </div>
  )
}
