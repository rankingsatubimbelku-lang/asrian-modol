"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { deleteEvent } from "@/actions/event.actions"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"

export function KegiatanActions({ id }: { id: string }) {
  const router = useRouter()

  async function handleDelete() {
    const r = await deleteEvent(id)
    if (r.success) { toast.success("Kegiatan dihapus"); router.refresh() }
    else toast.error(r.error)
  }

  return (
    <div className="flex gap-1">
      <Link href={`/kegiatan/${id}`}>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Pencil className="w-3.5 h-3.5 text-gray-500" />
        </Button>
      </Link>
      <ConfirmDialog
        trigger={
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </Button>
        }
        title="Hapus Kegiatan?"
        description="Kegiatan akan dihapus permanen dan tidak bisa dikembalikan."
        actionLabel="Hapus"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
