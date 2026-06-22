import { requireSuperAdmin } from "@/lib/auth-helpers"
import { getAccounts } from "@/actions/akuntansi.actions"
import { serialize } from "@/lib/serialize"
import { PageHeader } from "@/components/shared/PageHeader"
import { AkunTable } from "./_components/AkunTable"
import { TambahAkunModal } from "./_components/TambahAkunModal"

export default async function DaftarAkunPage() {
  await requireSuperAdmin()
  const rawAccounts = await getAccounts()
  const accounts = serialize(rawAccounts)

  return (
    <div>
      <PageHeader
        title="Chart of Accounts"
        description="Daftar akun untuk pencatatan jurnal otomatis"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Akuntansi" }, { label: "Daftar Akun" }]}
      />

      <div className="flex justify-end mb-4">
        <TambahAkunModal />
      </div>

      <AkunTable accounts={accounts} />
    </div>
  )
}
