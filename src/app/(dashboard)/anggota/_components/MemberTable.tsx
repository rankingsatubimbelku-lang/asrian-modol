"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DataTable } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { toggleMemberStatus, resetMemberPassword } from "@/actions/member.actions"
import { formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Eye, Pencil, ToggleLeft, ToggleRight, KeyRound, Loader2,
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"

type Member = {
  id: string
  nomorAnggota: string
  namaLengkap: string
  nik: string | null
  nomorHp: string
  status: string
  tanggalBergabung: Date
  user: { email: string }
}

export function MemberTable({ members }: { members: Member[] }) {
  const router = useRouter()
  const [resetDialog, setResetDialog] = useState<{ open: boolean; memberId: string; nama: string }>({
    open: false, memberId: "", nama: "",
  })
  const [newPassword, setNewPassword] = useState("")
  const [resetLoading, setResetLoading] = useState(false)

  async function handleToggle(id: string, status: string) {
    const result = await toggleMemberStatus(id)
    if (result.success) {
      toast.success(status === "AKTIF" ? "Anggota dinonaktifkan" : "Anggota diaktifkan kembali")
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  async function handleResetPassword() {
    if (!newPassword) return
    setResetLoading(true)
    const result = await resetMemberPassword(resetDialog.memberId, newPassword)
    if (result.success) {
      toast.success(`Password ${resetDialog.nama} berhasil direset`)
      setResetDialog({ open: false, memberId: "", nama: "" })
      setNewPassword("")
    } else {
      toast.error(result.error)
    }
    setResetLoading(false)
  }

  const columns = [
    {
      key: "nomorAnggota", label: "No. Anggota",
      className: "whitespace-nowrap font-mono text-xs",
    },
    {
      key: "namaLengkap", label: "Nama",
      render: (r: Member) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-100">{r.namaLengkap}</p>
          <p className="text-xs text-gray-400">{r.user.email}</p>
        </div>
      ),
    },
    { key: "nomorHp", label: "No. HP", className: "whitespace-nowrap" },
    { key: "tanggalBergabung", label: "Bergabung", render: (r: Member) => formatDate(r.tanggalBergabung) },
    { key: "status", label: "Status", render: (r: Member) => <StatusBadge status={r.status} /> },
    {
      key: "aksi", label: "Aksi",
      render: (r: Member) => (
        <div className="flex items-center gap-0.5">
          {/* Detail */}
          <Link href={`/anggota/${r.id}`}>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Detail">
              <Eye className="w-4 h-4 text-gray-500" />
            </Button>
          </Link>

          {/* Edit */}
          <Link href={`/anggota/${r.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit Data">
              <Pencil className="w-4 h-4 text-blue-500" />
            </Button>
          </Link>

          {/* Reset Password */}
          <Button
            variant="ghost" size="icon" className="h-7 w-7" title="Reset Password"
            onClick={() => {
              setNewPassword("")
              setResetDialog({ open: true, memberId: r.id, nama: r.namaLengkap })
            }}
          >
            <KeyRound className="w-4 h-4 text-orange-500" />
          </Button>

          {/* Toggle Status */}
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="icon" className="h-7 w-7" title={r.status === "AKTIF" ? "Nonaktifkan" : "Aktifkan"}>
                {r.status === "AKTIF"
                  ? <ToggleRight className="w-4 h-4 text-green-500" />
                  : <ToggleLeft className="w-4 h-4 text-gray-400" />}
              </Button>
            }
            title={r.status === "AKTIF" ? "Nonaktifkan Anggota?" : "Aktifkan Anggota?"}
            description={`${r.status === "AKTIF" ? "Nonaktifkan" : "Aktifkan kembali"} anggota ${r.namaLengkap}?`}
            actionLabel={r.status === "AKTIF" ? "Nonaktifkan" : "Aktifkan"}
            destructive={r.status === "AKTIF"}
            onConfirm={() => handleToggle(r.id, r.status)}
          />
        </div>
      ),
    },
  ]

  return (
    <>
      <DataTable
        data={members}
        columns={columns}
        searchKeys={["namaLengkap", "nomorAnggota", "nik"] as never}
        searchPlaceholder="Cari nama, nomor anggota, NIK..."
        emptyText="Belum ada anggota terdaftar"
      />

      {/* Dialog Reset Password */}
      <Dialog open={resetDialog.open} onOpenChange={(open) => setResetDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-600">
              Reset password untuk <span className="font-semibold">{resetDialog.nama}</span>
            </p>
            <div className="space-y-1.5">
              <Label>Password Baru *</Label>
              <Input
                type="password"
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="h-10"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialog(prev => ({ ...prev, open: false }))}>
              Batal
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={resetLoading || newPassword.length < 6}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {resetLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
