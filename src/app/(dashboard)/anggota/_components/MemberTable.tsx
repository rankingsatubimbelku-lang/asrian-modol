"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { DataTable } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { toggleMemberStatus, resetMemberPassword, setMemberRole } from "@/actions/member.actions"
import { formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Eye, Pencil, ToggleLeft, ToggleRight, KeyRound, Loader2, ShieldCheck,
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
  user: { email: string; role: string }
}

const roleBadge: Record<string, { label: string; className: string }> = {
  SUPER_ADMIN: { label: "Super Admin", className: "bg-red-100 text-red-700" },
  ADMIN: { label: "Admin", className: "bg-blue-100 text-blue-700" },
  ANGGOTA: { label: "Anggota", className: "bg-gray-100 text-gray-600" },
}

export function MemberTable({ members }: { members: Member[] }) {
  const router = useRouter()
  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN"

  const [resetDialog, setResetDialog] = useState<{ open: boolean; memberId: string; nama: string }>({
    open: false, memberId: "", nama: "",
  })
  const [roleDialog, setRoleDialog] = useState<{ open: boolean; memberId: string; nama: string; currentRole: string }>({
    open: false, memberId: "", nama: "", currentRole: "ANGGOTA",
  })
  const [newPassword, setNewPassword] = useState("")
  const [selectedRole, setSelectedRole] = useState<"ANGGOTA" | "ADMIN" | "SUPER_ADMIN">("ANGGOTA")
  const [resetLoading, setResetLoading] = useState(false)
  const [roleLoading, setRoleLoading] = useState(false)

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

  async function handleSetRole() {
    setRoleLoading(true)
    const result = await setMemberRole(roleDialog.memberId, selectedRole)
    if (result.success) {
      toast.success(`Role ${roleDialog.nama} diubah menjadi ${selectedRole}`)
      setRoleDialog({ open: false, memberId: "", nama: "", currentRole: "ANGGOTA" })
      router.refresh()
    } else {
      toast.error(result.error)
    }
    setRoleLoading(false)
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
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-800 dark:text-gray-100">{r.namaLengkap}</p>
            {r.user.role !== "ANGGOTA" && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${roleBadge[r.user.role]?.className}`}>
                {roleBadge[r.user.role]?.label}
              </span>
            )}
          </div>
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

          {/* Ubah Role — hanya Super Admin */}
          {isSuperAdmin && (
            <Button
              variant="ghost" size="icon" className="h-7 w-7" title="Ubah Role / Akses"
              onClick={() => {
                setSelectedRole(r.user.role as "ANGGOTA" | "ADMIN" | "SUPER_ADMIN")
                setRoleDialog({ open: true, memberId: r.id, nama: r.namaLengkap, currentRole: r.user.role })
              }}
            >
              <ShieldCheck className="w-4 h-4 text-purple-500" />
            </Button>
          )}

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
        searchKeys={["namaLengkap", "nomorAnggota"] as never}
        searchPlaceholder="Cari nama atau nomor anggota..."
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

      {/* Dialog Ubah Role */}
      <Dialog open={roleDialog.open} onOpenChange={(open) => setRoleDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              Ubah Hak Akses
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">
              Ubah role untuk <span className="font-semibold">{roleDialog.nama}</span>
            </p>

            <div className="space-y-2">
              {(["ANGGOTA", "ADMIN", "SUPER_ADMIN"] as const).map(role => (
                <label
                  key={role}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedRole === role
                      ? "border-purple-400 bg-purple-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={selectedRole === role}
                    onChange={() => setSelectedRole(role)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {role === "ANGGOTA" ? "Anggota" : role === "ADMIN" ? "Admin" : "Super Admin"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {role === "ANGGOTA" && "Hanya bisa lihat data sendiri"}
                      {role === "ADMIN" && "Kelola anggota, arisan, tabungan & kredit"}
                      {role === "SUPER_ADMIN" && "Akses penuh termasuk setting & audit log"}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {selectedRole === "SUPER_ADMIN" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                ⚠️ Super Admin memiliki akses penuh ke seluruh sistem. Pastikan hanya diberikan ke pengguna terpercaya.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog(prev => ({ ...prev, open: false }))}>
              Batal
            </Button>
            <Button
              onClick={handleSetRole}
              disabled={roleLoading || selectedRole === roleDialog.currentRole}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {roleLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
