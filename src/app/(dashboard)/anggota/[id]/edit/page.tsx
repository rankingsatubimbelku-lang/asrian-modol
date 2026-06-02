"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { updateMember } from "@/actions/member.actions"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"

type MemberData = {
  namaLengkap: string
  nik: string | null
  nomorHp: string
  tempatLahir: string
  tanggalLahir: string
  alamat: string
  tanggalBergabung: string
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</Label>
      {children}
    </div>
  )
}

export default function EditAnggotaPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [data, setData] = useState<MemberData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/v1/members/${id}`)
      .then(r => r.json())
      .then(d => setData(d.data))
  }, [id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const result = await updateMember(id, new FormData(e.currentTarget))
    if (result.success) {
      toast.success("Data anggota berhasil diperbarui")
      router.push(`/anggota/${id}`)
    } else {
      toast.error(result.error)
      setLoading(false)
    }
  }

  if (!data) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Edit Data Anggota"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Anggota", href: "/anggota" },
          { label: "Detail", href: `/anggota/${id}` },
          { label: "Edit" },
        ]}
      />

      <Card className="border-0 shadow-sm max-w-2xl">
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-1 border-b">Data Pribadi</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nama Lengkap *">
                  <Input name="namaLengkap" defaultValue={data.namaLengkap} required className="h-10" />
                </Field>
                <Field label="NIK (16 digit)">
                  <Input name="nik" defaultValue={data.nik ?? ""} placeholder="Opsional" maxLength={16} className="h-10" />
                </Field>
                <Field label="Tempat Lahir *">
                  <Input name="tempatLahir" defaultValue={data.tempatLahir} required className="h-10" />
                </Field>
                <Field label="Tanggal Lahir *">
                  <Input name="tanggalLahir" type="date"
                    defaultValue={format(new Date(data.tanggalLahir), "yyyy-MM-dd")}
                    required className="h-10" />
                </Field>
                <Field label="No. HP *">
                  <Input name="nomorHp" defaultValue={data.nomorHp} required className="h-10" />
                </Field>
                <Field label="Tanggal Bergabung *">
                  <Input name="tanggalBergabung" type="date"
                    defaultValue={format(new Date(data.tanggalBergabung), "yyyy-MM-dd")}
                    required className="h-10" />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Alamat Lengkap *">
                  <Textarea name="alamat" defaultValue={data.alamat} rows={3} required />
                </Field>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Simpan Perubahan
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
