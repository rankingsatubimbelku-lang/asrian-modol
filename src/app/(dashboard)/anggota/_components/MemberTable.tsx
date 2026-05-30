"use client"

import Link from "next/link"
import { toast } from "sonner"
import { DataTable } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { toggleMemberStatus } from "@/actions/member.actions"
import { formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Eye, ToggleLeft, ToggleRight } from "lucide-react"

type Member = {
  id: string
  nomorAnggota: string
  namaLengkap: string
  nik: string
  nomorHp: string
  status: string
  tanggalBergabung: Date
  user: { email: string }
}

export function MemberTable({ members }: { members: Member[] }) {
  async function handleToggle(id: string, status: string) {
    const result = await toggleMemberStatus(id)
    if (result.success) {
      toast.success(status === "AKTIF" ? "Anggota dinonaktifkan" : "Anggota diaktifkan kembali")
    } else {
      toast.error(result.error)
    }
  }

  const columns = [
    { key: "nomorAnggota", label: "No. Anggota", className: "whitespace-nowrap font-mono text-xs" },
    { key: "namaLengkap", label: "Nama", render: (r: Member) => (
      <div>
        <p className="font-medium text-gray-800">{r.namaLengkap}</p>
        <p className="text-xs text-gray-400">{r.user.email}</p>
      </div>
    )},
    { key: "nomorHp", label: "No. HP", className: "whitespace-nowrap" },
    { key: "tanggalBergabung", label: "Bergabung", render: (r: Member) => formatDate(r.tanggalBergabung) },
    { key: "status", label: "Status", render: (r: Member) => <StatusBadge status={r.status} /> },
    { key: "aksi", label: "Aksi", render: (r: Member) => (
      <div className="flex items-center gap-1">
        <Link href={`/anggota/${r.id}`}>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Eye className="w-4 h-4 text-gray-500" />
          </Button>
        </Link>
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="icon" className="h-7 w-7">
              {r.status === "AKTIF"
                ? <ToggleRight className="w-4 h-4 text-green-500" />
                : <ToggleLeft className="w-4 h-4 text-gray-400" />}
            </Button>
          }
          title={r.status === "AKTIF" ? "Nonaktifkan Anggota" : "Aktifkan Anggota"}
          description={`${r.status === "AKTIF" ? "Nonaktifkan" : "Aktifkan kembali"} anggota ${r.namaLengkap}?`}
          actionLabel={r.status === "AKTIF" ? "Nonaktifkan" : "Aktifkan"}
          destructive={r.status === "AKTIF"}
          onConfirm={() => handleToggle(r.id, r.status)}
        />
      </div>
    )},
  ]

  return (
    <DataTable
      data={members}
      columns={columns}
      searchKeys={["namaLengkap", "nomorAnggota", "nik"]}
      searchPlaceholder="Cari nama, nomor anggota, NIK..."
      emptyText="Belum ada anggota terdaftar"
    />
  )
}
