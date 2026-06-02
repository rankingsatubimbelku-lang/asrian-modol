"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { postingTabungan } from "@/actions/saving.actions"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { BookCheck, Loader2 } from "lucide-react"

interface PostingButtonProps {
  savingId: string
  pendingCount: number
}

export function PostingButton({ savingId, pendingCount }: PostingButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handlePosting() {
    setLoading(true)
    const result = await postingTabungan(savingId)
    if (result.success) {
      toast.success(`${result.jumlah} transaksi berhasil diposting dan dikunci permanen`)
      router.refresh()
    } else {
      toast.error(result.error)
    }
    setLoading(false)
  }

  return (
    <ConfirmDialog
      trigger={
        <Button
          size="sm"
          className="bg-amber-600 hover:bg-amber-700 whitespace-nowrap"
          disabled={loading}
        >
          {loading
            ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            : <BookCheck className="w-4 h-4 mr-1.5" />}
          Posting ({pendingCount})
        </Button>
      }
      title="Konfirmasi Posting Tabungan"
      description={`${pendingCount} transaksi akan diposting dan DIKUNCI PERMANEN. Data yang sudah diposting tidak dapat diubah atau dihapus. Lanjutkan?`}
      actionLabel="Posting Sekarang"
      onConfirm={handlePosting}
    />
  )
}
