"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { updateEvent } from "@/actions/event.actions"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"

type Event = {
  id: string
  namaKegiatan: string
  tanggal: string
  lokasi: string
  pic: string
  deskripsi: string | null
}

export default function EditKegiatanPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/v1/events/${id}`).then(r => r.json()).then(d => setEvent(d.data))
  }, [id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const r = await updateEvent(id, new FormData(e.currentTarget))
    if (r.success) { toast.success("Kegiatan diperbarui"); router.push("/kegiatan") }
    else { toast.error(r.error); setLoading(false) }
  }

  if (!event) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>

  return (
    <div>
      <PageHeader
        title="Edit Kegiatan"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Kegiatan", href: "/kegiatan" }, { label: "Edit" }]}
      />
      <Card className="border-0 shadow-sm max-w-lg">
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Kegiatan *</Label>
              <Input name="namaKegiatan" defaultValue={event.namaKegiatan} required className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tanggal *</Label>
                <Input name="tanggal" type="date" defaultValue={format(new Date(event.tanggal), "yyyy-MM-dd")} required className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>PIC *</Label>
                <Input name="pic" defaultValue={event.pic} required className="h-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Lokasi *</Label>
              <Input name="lokasi" defaultValue={event.lokasi} required className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>Deskripsi</Label>
              <Textarea name="deskripsi" defaultValue={event.deskripsi ?? ""} rows={3} />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Simpan Perubahan
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
