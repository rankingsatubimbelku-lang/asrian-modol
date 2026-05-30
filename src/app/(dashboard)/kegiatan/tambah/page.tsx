"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createEvent } from "@/actions/event.actions"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

export default function TambahKegiatanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const r = await createEvent(new FormData(e.currentTarget))
    if (r.success) { toast.success("Kegiatan berhasil ditambahkan"); router.push("/kegiatan") }
    else { toast.error(r.error); setLoading(false) }
  }

  return (
    <div>
      <PageHeader
        title="Tambah Kegiatan"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Kegiatan", href: "/kegiatan" }, { label: "Tambah" }]}
      />
      <Card className="border-0 shadow-sm max-w-lg">
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Kegiatan *</Label>
              <Input name="namaKegiatan" placeholder="Pertemuan Arisan Bulan Ini" required className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tanggal *</Label>
                <Input name="tanggal" type="date" required className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>PIC *</Label>
                <Input name="pic" placeholder="Nama penanggung jawab" required className="h-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Lokasi *</Label>
              <Input name="lokasi" placeholder="Alamat atau nama tempat" required className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>Deskripsi</Label>
              <Textarea name="deskripsi" placeholder="Keterangan tambahan (opsional)" rows={3} />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Simpan
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
