import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/PageHeader"
import { PeriodeTable } from "./_components/PeriodeTable"
import { PlusCircle } from "lucide-react"
import { serialize } from "@/lib/serialize"

export default async function PeriodePage() {
  await requireAdmin()

  const raw = await prisma.arisanPeriod.findMany({
    include: {
      _count: { select: { arisanMembers: true, arisanPayments: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const periodes = serialize(raw)

  return (
    <div>
      <PageHeader
        title="Periode Arisan"
        description="Kelola periode arisan kelompok"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Arisan" }, { label: "Periode" }]}
        action={{ label: "Buat Periode", href: "/arisan/periode/tambah", icon: <PlusCircle className="w-4 h-4 mr-1.5" /> }}
      />
      <PeriodeTable periodes={periodes} />
    </div>
  )
}
