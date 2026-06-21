import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/PageHeader"
import { serialize } from "@/lib/serialize"
import { PlusCircle } from "lucide-react"
import { KreditTable } from "./_components/KreditTable"

export default async function KreditPage() {
  const session = await requireAuth()
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role)

  const includeOpts = {
    member: { select: { namaLengkap: true, nomorAnggota: true } },
    interestSetting: { select: { persentase: true, metode: true } },
    installments: { select: { nominalPokok: true, nominalBunga: true, denda: true, nominalDibayar: true } },
  }

  const rawLoans = isAdmin
    ? await prisma.loan.findMany({
        include: includeOpts,
        orderBy: { createdAt: "desc" },
      })
    : await prisma.loan.findMany({
        where: { member: { userId: session.user.id } },
        include: includeOpts,
        orderBy: { createdAt: "desc" },
      })

  const loans = serialize(rawLoans).map(loan => {
    const sisaPinjaman = loan.installments.reduce((acc, i) => {
      const totalTagihan = Number(i.nominalPokok) + Number(i.nominalBunga) + Number(i.denda)
      const dibayar = Number(i.nominalDibayar)
      return acc + Math.max(0, totalTagihan - dibayar)
    }, 0)
    return { ...loan, sisaPinjaman }
  })

  return (
    <div>
      <PageHeader
        title="Daftar Kredit"
        description={`${loans.length} pengajuan kredit`}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Kredit" }]}
        action={isAdmin ? { label: "Pengajuan Baru", href: "/kredit/pengajuan", icon: <PlusCircle className="w-4 h-4 mr-1.5" /> } : undefined}
      />
      <KreditTable loans={loans} />
    </div>
  )
}
