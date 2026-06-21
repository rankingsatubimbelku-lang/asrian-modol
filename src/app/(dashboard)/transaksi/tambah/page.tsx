"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createTransaksi } from "@/actions/transaksi.actions"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ArrowUpCircle, ArrowDownCircle } from "lucide-react"

const kategoriPemasukan = ["Donasi", "Sumbangan Anggota", "Bunga Bank", "Penjualan Aset", "Lainnya"]
const kategoriPengeluaran = ["ATK & Operasional", "Konsumsi Kegiatan", "Sewa Tempat", "Transport", "Honor/Insentif", "Lainnya"]

export default function TambahTransaksiPage() {
  const router = useRouter()
  const [jenis, setJenis] = useState<"PEMASUKAN" | "PENGELUARAN">("PEMASUKAN")
  const [loading, setLoading] = useState(false)

  const kategoriList = jenis === "PEMASUKAN" ? kategoriPemasukan : kategoriPengeluaran

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("jenis", jenis)
    const r = await createTransaksi(fd)
    if (r.success) {
      toast.success("Transaksi berhasil dicatat")
      router.push("/transaksi")
    } else {
      toast.error(r.error)
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Tambah Transaksi"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Transaksi", href: "/transaksi" }, { label: "Tambah" }]}
      />

      <Card className="border-0 shadow-sm max-w-lg">
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Jenis */}
            <div className="space-y-1.5">
              <Label>Jenis Transaksi *</Label>
              <div className="flex gap-3">
                <label className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
                  jenis === "PEMASUKAN" ? "bg-green-50 border-green-400 text-green-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}>
                  <input type="radio" name="jenisRadio" checked={jenis === "PEMASUKAN"} onChange={() => setJenis("PEMASUKAN")} className="hidden" />
                  <ArrowUpCircle className="w-4 h-4" />Pemasukan
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
                  jenis === "PENGELUARAN" ? "bg-red-50 border-red-400 text-red-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}>
                  <input type="radio" name="jenisRadio" checked={jenis === "PENGELUARAN"} onChange={() => setJenis("PENGELUARAN")} className="hidden" />
                  <ArrowDownCircle className="w-4 h-4" />Pengeluaran
                </label>
              </div>
            </div>

            {/* Kategori */}
            <div className="space-y-1.5">
              <Label>Kategori *</Label>
              <Input
                name="kategori"
                list="kategori-list"
                placeholder="Pilih atau ketik kategori baru"
                required
                className="h-10"
              />
              <datalist id="kategori-list">
                {kategoriList.map(k => <option key={k} value={k} />)}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nominal (Rp) *</Label>
                <Input name="nominal" type="number" min="1" placeholder="100000" required className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Tanggal *</Label>
                <Input name="tanggal" type="date" required className="h-10"
                  defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Keterangan</Label>
              <Textarea name="keterangan" placeholder="Opsional" rows={3} />
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading}
                className={jenis === "PEMASUKAN" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Simpan Transaksi
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
