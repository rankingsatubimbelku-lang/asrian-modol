"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { approveLoan } from "@/actions/loan.actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export function ApprovalActions({ loanId }: { loanId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null)
  const [catatan, setCatatan] = useState("")
  const [showForm, setShowForm] = useState(false)

  async function handleAction(keputusan: "APPROVE" | "REJECT") {
    setLoading(keputusan === "APPROVE" ? "approve" : "reject")
    const fd = new FormData()
    fd.append("keputusan", keputusan)
    fd.append("catatanApproval", catatan)
    const r = await approveLoan(loanId, fd)
    if (r.success) {
      toast.success(keputusan === "APPROVE" ? "Kredit disetujui & jadwal angsuran dibuat" : "Kredit ditolak")
      router.refresh()
    } else {
      toast.error(r.error)
    }
    setLoading(null)
  }

  return (
    <div className="flex flex-col gap-2 min-w-48">
      {showForm && (
        <Textarea
          placeholder="Catatan (opsional)"
          value={catatan}
          onChange={e => setCatatan(e.target.value)}
          rows={2}
          className="text-sm"
        />
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
          onClick={() => { setShowForm(true); handleAction("APPROVE") }}
          disabled={loading !== null}
        >
          {loading === "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
          Setujui
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-red-600 border-red-200 hover:bg-red-50 text-xs"
          onClick={() => { setShowForm(true); handleAction("REJECT") }}
          disabled={loading !== null}
        >
          {loading === "reject" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5 mr-1" />}
          Tolak
        </Button>
      </div>
      {!showForm && (
        <button onClick={() => setShowForm(true)} className="text-xs text-gray-400 hover:text-gray-600 text-center">
          + Tambah catatan
        </button>
      )}
    </div>
  )
}
