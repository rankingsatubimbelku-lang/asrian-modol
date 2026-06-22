"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toggleAccountActive } from "@/actions/akuntansi.actions"
import { BookOpen } from "lucide-react"

type Account = {
  id: string
  kode: string
  nama: string
  tipe: string
  isActive: boolean
}

const tipeBadgeClass: Record<string, string> = {
  ASET: "bg-blue-100 text-blue-700",
  KEWAJIBAN: "bg-amber-100 text-amber-700",
  MODAL: "bg-purple-100 text-purple-700",
  PENDAPATAN: "bg-green-100 text-green-700",
  BEBAN: "bg-red-100 text-red-700",
}

export function AkunTable({ accounts }: { accounts: Account[] }) {
  const router = useRouter()

  async function handleToggle(id: string) {
    const r = await toggleAccountActive(id)
    if (r.success) { toast.success("Status akun diperbarui"); router.refresh() }
    else toast.error(r.error)
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="pt-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60">
              <tr>
                {["Kode", "Nama Akun", "Tipe", "Status", "Aksi"].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.map(a => (
                <tr key={a.id} className="border-t dark:border-white/10">
                  <td className="px-3 py-2.5 font-mono text-xs dark:text-gray-300">{a.kode}</td>
                  <td className="px-3 py-2.5 font-medium dark:text-gray-200">{a.nama}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tipeBadgeClass[a.tipe] ?? "bg-gray-100 text-gray-700"}`}>
                      {a.tipe}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant={a.isActive ? "default" : "secondary"}>{a.isActive ? "Aktif" : "Nonaktif"}</Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Link href={`/akuntansi/buku-besar?accountId=${a.id}`} className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />Buku Besar
                      </Link>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleToggle(a.id)}>
                        {a.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
