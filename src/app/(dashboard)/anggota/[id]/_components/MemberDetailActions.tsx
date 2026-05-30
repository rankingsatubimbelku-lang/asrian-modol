"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { toggleMemberStatus } from "@/actions/member.actions"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { UserX, UserCheck } from "lucide-react"

export function MemberDetailActions({ id, status }: { id: string; status: string }) {
  const router = useRouter()

  async function handleToggle() {
    const result = await toggleMemberStatus(id)
    if (result.success) {
      toast.success(status === "AKTIF" ? "Anggota dinonaktifkan" : "Anggota diaktifkan kembali")
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <ConfirmDialog
      trigger={
        <Button
          variant="outline"
          size="sm"
          className={status === "AKTIF" ? "text-red-600 border-red-200 hover:bg-red-50" : "text-green-600 border-green-200 hover:bg-green-50"}
        >
          {status === "AKTIF" ? (
            <><UserX className="w-4 h-4 mr-1.5" />Nonaktifkan</>
          ) : (
            <><UserCheck className="w-4 h-4 mr-1.5" />Aktifkan</>
          )}
        </Button>
      }
      title={status === "AKTIF" ? "Nonaktifkan Anggota" : "Aktifkan Anggota"}
      description={status === "AKTIF"
        ? "Anggota tidak dapat login dan tidak bisa ikut arisan/pengajuan kredit baru."
        : "Anggota dapat login dan beraktivitas kembali."}
      actionLabel={status === "AKTIF" ? "Nonaktifkan" : "Aktifkan"}
      destructive={status === "AKTIF"}
      onConfirm={handleToggle}
    />
  )
}
