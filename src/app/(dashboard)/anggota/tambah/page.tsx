"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createMember } from "@/actions/member.actions"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      {children}
    </div>
  )
}

export default function TambahAnggotaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await createMember(formData)
    if (result.success) {
      toast.success("Anggota berhasil ditambahkan")
      router.push("/anggota")
    } else {
      toast.error(result.error)
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Tambah Anggota"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Anggota", href: "/anggota" },
          { label: "Tambah" },
        ]}
      />

      <Card className="border-0 shadow-sm max-w-2xl">
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Data Pribadi */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-1 border-b">Data Pribadi</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nama Lengkap *">
                  <Input name="namaLengkap" placeholder="Nama lengkap" required className="h-10" />
                </Field>
                <Field label="NIK (16 digit)">
                  <Input name="nik" placeholder="1234567890123456 (opsional)" maxLength={16} className="h-10" />
                </Field>
                <Field label="Tempat Lahir *">
                  <Input name="tempatLahir" placeholder="Kota kelahiran" required className="h-10" />
                </Field>
                <Field label="Tanggal Lahir *">
                  <Input name="tanggalLahir" type="date" required className="h-10" />
                </Field>
                <Field label="No. HP *">
                  <Input name="nomorHp" placeholder="08xxxxxxxxxx" required className="h-10" />
                </Field>
                <Field label="Tanggal Bergabung *">
                  <Input name="tanggalBergabung" type="date" required className="h-10"
                    defaultValue={new Date().toISOString().split("T")[0]} />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Alamat Lengkap *">
                  <Textarea name="alamat" placeholder="Jl. ..." rows={3} required />
                </Field>
              </div>
            </div>

            {/* Akun Login */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-1 border-b">Akun Login</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Email *">
                  <Input name="email" type="email" placeholder="nama@email.com" required className="h-10" />
                </Field>
                <Field label="Password *">
                  <Input name="password" type="password" placeholder="Min. 6 karakter" required className="h-10" />
                </Field>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Simpan Anggota
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
