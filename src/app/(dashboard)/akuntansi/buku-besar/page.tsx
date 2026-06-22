import { requireSuperAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { getBukuBesar } from "@/actions/akuntansi.actions"
import { serialize } from "@/lib/serialize"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { AkunSelector } from "./_components/AkunSelector"
import { MutasiTable } from "./_components/MutasiTable"

export default async function BukuBesarPage({
  searchParams,
}: {
  searchParams: Promise<{ accountId?: string; journalId?: string }>
}) {
  await requireSuperAdmin()
  const { accountId, journalId } = await searchParams

  const accounts = serialize(await prisma.account.findMany({ orderBy: { kode: "asc" } }))
  const data = accountId ? await getBukuBesar(accountId) : null
  const result = data ? serialize(data) : null

  return (
    <div>
      <PageHeader
        title="Buku Besar"
        description="Mutasi debit/kredit per akun"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Akuntansi" }, { label: "Buku Besar" }]}
      />

      <div className="mb-5">
        <AkunSelector accounts={accounts} selectedId={accountId} />
      </div>

      {result && (
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {result.account.kode} — {result.account.nama}
                </h3>
                <p className="text-xs text-gray-400">Tipe: {result.account.tipe}</p>
              </div>
              <p className="text-sm font-bold dark:text-gray-100">
                Saldo Akhir: {formatCurrency(result.mutasi.at(-1)?.saldoBerjalan ?? 0)}
              </p>
            </div>

            <MutasiTable mutasi={result.mutasi} highlightJournalId={journalId} />
          </CardContent>
        </Card>
      )}

      {!result && (
        <p className="text-sm text-gray-400 text-center py-10">Pilih akun untuk melihat mutasi</p>
      )}
    </div>
  )
}
