"use client"

import { useRouter } from "next/navigation"

type Account = { id: string; kode: string; nama: string }

export function AkunSelector({ accounts, selectedId }: { accounts: Account[]; selectedId?: string }) {
  const router = useRouter()

  return (
    <select
      defaultValue={selectedId ?? ""}
      onChange={e => router.push(e.target.value ? `/akuntansi/buku-besar?accountId=${e.target.value}` : "/akuntansi/buku-besar")}
      className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 min-w-64"
    >
      <option value="">Pilih akun...</option>
      {accounts.map(a => (
        <option key={a.id} value={a.id}>{a.kode} — {a.nama}</option>
      ))}
    </select>
  )
}
