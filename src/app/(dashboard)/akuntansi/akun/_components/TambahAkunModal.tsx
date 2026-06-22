"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createAccount } from "@/actions/akuntansi.actions"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, PlusCircle } from "lucide-react"

const tipeOptions = [
  { value: "ASET", label: "Aset" },
  { value: "KEWAJIBAN", label: "Kewajiban" },
  { value: "MODAL", label: "Modal" },
  { value: "PENDAPATAN", label: "Pendapatan" },
  { value: "BEBAN", label: "Beban" },
]

export function TambahAkunModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const r = await createAccount(fd)
    if (r.success) {
      toast.success("Akun berhasil dibuat")
      setOpen(false)
      router.refresh()
    } else {
      toast.error(r.error)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span className="contents" onClick={() => setOpen(true)}>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <PlusCircle className="w-4 h-4 mr-1.5" />Tambah Akun
        </Button>
      </span>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Tambah Akun Baru</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Kode Akun *</Label>
            <Input name="kode" placeholder="cth: 1002" required className="h-10" />
          </div>

          <div className="space-y-1.5">
            <Label>Nama Akun *</Label>
            <Input name="nama" placeholder="cth: Bank" required className="h-10" />
          </div>

          <div className="space-y-1.5">
            <Label>Tipe Akun *</Label>
            <select
              name="tipe"
              required
              defaultValue=""
              className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="" disabled>Pilih tipe akun</option>
              {tipeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
