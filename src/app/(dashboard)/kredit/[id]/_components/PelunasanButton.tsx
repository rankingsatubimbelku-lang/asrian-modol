"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { pelunasanAwal } from "@/actions/loan.actions"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Banknote } from "lucide-react"

export function PelunasanButton({ loanId }: { loanId: string }) {
  const router = useRouter()

  async function handlePelunasan() {
    const r = await pelunasanAwal(loanId, new Date().toISOString().split("T")[0])
    if (r.success) { toast.success("Pelunasan awal berhasil dicatat"); router.refresh() }
    else toast.error(r.error)
  }

  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
          <Banknote className="w-4 h-4 mr-1.5" />Lunaskan
        </Button>
      }
      title="Pelunasan Awal?"
      description="Semua sisa angsuran akan ditandai lunas hari ini. Proses ini tidak bisa dibatalkan."
      actionLabel="Lunaskan Sekarang"
      onConfirm={handlePelunasan}
    />
  )
}
