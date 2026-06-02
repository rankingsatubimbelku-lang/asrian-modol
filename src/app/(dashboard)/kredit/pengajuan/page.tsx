"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createLoan } from "@/actions/loan.actions"
import { generateJadwalAngsuran, hitungTotalPinjaman } from "@/lib/calculations/installment"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Calculator, Search, X, ChevronDown } from "lucide-react"
import { formatCurrency } from "@/lib/format"

type Member = { id: string; namaLengkap: string; nomorAnggota: string }
type Setting = { id: string; persentase: number; metode: string; dendaPerHari: number }

export default function PengajuanKreditPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [setting, setSetting] = useState<Setting | null>(null)
  const [loading, setLoading] = useState(false)
  const [nominal, setNominal] = useState("")
  const [tenor, setTenor] = useState("")
  const [preview, setPreview] = useState<ReturnType<typeof hitungTotalPinjaman> | null>(null)

  // Searchable dropdown state
  const [selectedMember, setSelectedMember] = useState("")
  const [search, setSearch] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/v1/members").then(r => r.json()).then(d => setMembers(d.data ?? []))
    fetch("/api/v1/loans/settings?active=true").then(r => r.json()).then(d => setSetting(d.data ?? null))
  }, [])

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filtered = search
    ? members.filter(m =>
        m.namaLengkap.toLowerCase().includes(search.toLowerCase()) ||
        m.nomorAnggota.toLowerCase().includes(search.toLowerCase())
      )
    : members

  const selectedData = members.find(m => m.id === selectedMember)

  function handleSelect(m: Member) {
    setSelectedMember(m.id)
    setSearch("")
    setIsOpen(false)
  }

  function handleClear() {
    setSelectedMember("")
    setSearch("")
  }

  function hitungPreview() {
    if (!nominal || !tenor || !setting) return
    const jadwal = generateJadwalAngsuran({
      nominalPinjaman: parseFloat(nominal),
      tenor: parseInt(tenor),
      bungaPerTahun: setting.persentase,
      metode: setting.metode as "FLAT" | "EFEKTIF",
      tanggalMulai: new Date(),
    })
    setPreview(hitungTotalPinjaman(jadwal))
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedMember) { toast.error("Pilih anggota terlebih dahulu"); return }
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("memberId", selectedMember)
    const result = await createLoan(fd)
    if (result.success) {
      toast.success("Pengajuan kredit berhasil dibuat")
      router.push("/kredit/approval")
    } else {
      toast.error(result.error)
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Pengajuan Kredit Baru"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Kredit", href: "/kredit" }, { label: "Pengajuan" }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            {!setting && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3 mb-4">
                Belum ada setting bunga kredit aktif. Atur di{" "}
                <a href="/pengaturan/bunga-kredit" className="underline font-medium">Pengaturan → Bunga Kredit</a>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Searchable Anggota Dropdown */}
              <div className="space-y-1.5">
                <Label>Anggota *</Label>
                <input type="hidden" name="memberId" value={selectedMember} />

                <div className="relative" ref={dropdownRef}>
                  <div
                    className={`flex items-center h-10 w-full rounded-md border bg-background px-3 text-sm cursor-pointer transition-colors ${isOpen ? "border-blue-400 ring-1 ring-blue-200" : "border-input hover:border-gray-400"}`}
                    onClick={() => setIsOpen(true)}
                  >
                    {selectedData && !isOpen ? (
                      <>
                        <span className="flex-1 truncate text-gray-800">
                          {selectedData.namaLengkap}{" "}
                          <span className="text-gray-400 font-mono text-xs">({selectedData.nomorAnggota})</span>
                        </span>
                        <button type="button" onClick={e => { e.stopPropagation(); handleClear() }} className="ml-1 text-gray-400 hover:text-gray-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5 text-gray-400 mr-2 flex-shrink-0" />
                        <input
                          type="text"
                          placeholder={selectedData ? selectedData.namaLengkap : "Cari nama atau nomor anggota..."}
                          value={search}
                          onChange={e => { setSearch(e.target.value); setIsOpen(true) }}
                          onFocus={() => setIsOpen(true)}
                          className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400"
                          autoFocus={isOpen}
                        />
                        {!isOpen && <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                      </>
                    )}
                  </div>

                  {/* Dropdown list */}
                  {isOpen && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                      {filtered.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">Tidak ada hasil pencarian</p>
                      ) : (
                        filtered.map(m => (
                          <div
                            key={m.id}
                            onClick={() => handleSelect(m)}
                            className={`flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-blue-50 transition-colors ${m.id === selectedMember ? "bg-blue-50" : ""}`}
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-800">{m.namaLengkap}</p>
                              <p className="text-xs text-gray-400 font-mono">{m.nomorAnggota}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nominal Pinjaman (Rp) *</Label>
                  <Input name="nominalPinjaman" type="number" min="100000" placeholder="5000000" required className="h-10"
                    value={nominal} onChange={e => { setNominal(e.target.value); setPreview(null) }} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tenor (Bulan) *</Label>
                  <Input name="tenor" type="number" min="1" max="60" placeholder="12" required className="h-10"
                    value={tenor} onChange={e => { setTenor(e.target.value); setPreview(null) }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Tujuan Pinjaman *</Label>
                <Textarea name="tujuanPinjaman" placeholder="Tujuan penggunaan dana pinjaman..." rows={3} required />
              </div>

              <div className="space-y-1.5">
                <Label>Tanggal Pengajuan *</Label>
                <Input name="tanggalPengajuan" type="date" required className="h-10"
                  defaultValue={new Date().toISOString().split("T")[0]} />
              </div>

              {setting && (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                  Bunga aktif: <span className="font-semibold">{setting.persentase}%/tahun ({setting.metode})</span>
                  {" · "}Denda: <span className="font-semibold">{setting.dendaPerHari}%/hari</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={hitungPreview} disabled={!nominal || !tenor || !setting}>
                  <Calculator className="w-4 h-4 mr-1.5" />Simulasi
                </Button>
                <Button type="submit" disabled={loading || !setting || !selectedMember} className="bg-blue-600 hover:bg-blue-700">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Ajukan Kredit
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {preview && setting && (
          <Card className="border-0 shadow-sm bg-blue-50 border-blue-200">
            <CardContent className="pt-5">
              <h3 className="font-semibold text-blue-800 mb-4">Simulasi Angsuran</h3>
              <dl className="space-y-3">
                {[
                  { label: "Total Pokok", value: formatCurrency(preview.totalPokok) },
                  { label: "Total Bunga", value: formatCurrency(preview.totalBunga) },
                  { label: "Total Kewajiban", value: formatCurrency(preview.totalCicilan) },
                  { label: "Cicilan/Bulan", value: formatCurrency(Math.round(preview.totalCicilan / parseInt(tenor))) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <dt className="text-sm text-blue-700">{label}</dt>
                    <dd className="font-bold text-blue-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
