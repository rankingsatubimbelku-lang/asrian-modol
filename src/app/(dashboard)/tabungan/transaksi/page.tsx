"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { inputTransaksiTabungan } from "@/actions/saving.actions"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Search, X, ChevronDown } from "lucide-react"
import { formatCurrency } from "@/lib/format"

type Member = { id: string; namaLengkap: string; nomorAnggota: string; saving?: { saldo: number } }

export default function TransaksiTabunganPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState("")
  const [jenis, setJenis] = useState("SETORAN")
  const [loading, setLoading] = useState(false)

  // Searchable dropdown state
  const [search, setSearch] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/v1/members?withSaldo=true").then(r => r.json()).then(d => setMembers(d.data ?? []))
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

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedMember) {
      toast.error("Pilih anggota terlebih dahulu")
      return
    }
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("memberId", selectedMember)
    const result = await inputTransaksiTabungan(fd)
    if (result.success) {
      toast.success("Transaksi berhasil dicatat")
      router.push("/tabungan")
    } else {
      toast.error(result.error)
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Input Transaksi Tabungan"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Tabungan", href: "/tabungan" }, { label: "Transaksi" }]}
      />
      <Card className="border-0 shadow-sm max-w-lg">
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Searchable Anggota Dropdown */}
            <div className="space-y-1.5">
              <Label>Anggota *</Label>
              {/* Hidden input untuk form submission */}
              <input type="hidden" name="memberId" value={selectedMember} />

              <div className="relative" ref={dropdownRef}>
                {/* Trigger — tampilkan anggota terpilih atau search field */}
                <div
                  className={`flex items-center h-10 w-full rounded-md border bg-background px-3 text-sm cursor-pointer transition-colors ${isOpen ? "border-blue-400 ring-1 ring-blue-200" : "border-input hover:border-gray-400"}`}
                  onClick={() => { setIsOpen(true); }}
                >
                  {selectedData && !isOpen ? (
                    <>
                      <span className="flex-1 truncate text-gray-800">{selectedData.namaLengkap} <span className="text-gray-400 font-mono text-xs">({selectedData.nomorAnggota})</span></span>
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
                          {m.saving && (
                            <span className="text-xs font-semibold text-green-600 ml-3 shrink-0">
                              {formatCurrency(String(m.saving.saldo))}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Saldo preview setelah pilih */}
              {selectedData?.saving && !isOpen && (
                <p className="text-xs text-gray-500">
                  Saldo saat ini: <span className="font-semibold text-green-600">{formatCurrency(String(selectedData.saving.saldo))}</span>
                </p>
              )}
            </div>

            {/* Jenis Transaksi */}
            <div className="space-y-1.5">
              <Label>Jenis Transaksi *</Label>
              <div className="flex gap-3">
                {["SETORAN", "PENARIKAN"].map(j => (
                  <label key={j} className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${jenis === j ? "bg-blue-50 border-blue-400 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    <input type="radio" name="jenis" value={j} checked={jenis === j} onChange={() => setJenis(j)} className="hidden" />
                    {j === "SETORAN" ? "💰 Setoran" : "🏧 Penarikan"}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nominal (Rp) *</Label>
                <Input name="nominal" type="number" min="1000" placeholder="100000" required className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Tanggal *</Label>
                <Input name="tanggal" type="date" required className="h-10"
                  defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Keterangan</Label>
              <Textarea name="keterangan" placeholder="Keterangan (opsional)" rows={2} />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading || !selectedMember} className="flex-1 bg-blue-600 hover:bg-blue-700">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Catat Transaksi
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/tabungan")}>
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
