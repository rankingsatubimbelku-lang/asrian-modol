"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { formatCurrency, formatDate } from "@/lib/format"
import { reverseJournalEntry } from "@/actions/akuntansi.actions"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Undo2 } from "lucide-react"

type Mutasi = {
  id: string
  journalEntryId: string
  nomorJurnal: string
  tanggal: Date | string
  deskripsi: string
  isReversal: boolean
  debit: number
  kredit: number
  saldoBerjalan: number
}

export function MutasiTable({ mutasi, highlightJournalId }: { mutasi: Mutasi[]; highlightJournalId?: string }) {
  const router = useRouter()

  async function handleReversal(journalEntryId: string) {
    const r = await reverseJournalEntry(journalEntryId)
    if (r.success) { toast.success("Jurnal pembalik berhasil dibuat"); router.refresh() }
    else toast.error(r.error)
  }

  if (mutasi.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Belum ada mutasi untuk akun ini</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800/60">
          <tr>
            {["No. Jurnal", "Tanggal", "Deskripsi", "Debit", "Kredit", "Saldo", "Aksi"].map(h => (
              <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mutasi.map(m => (
            <tr
              key={m.id}
              className={`border-t dark:border-white/10 ${
                m.journalEntryId === highlightJournalId ? "bg-amber-50 dark:bg-amber-950/30" : ""
              }`}
            >
              <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap dark:text-gray-300">
                {m.nomorJurnal}
                {m.isReversal && <span className="ml-1.5 text-[10px] text-orange-500 font-semibold">REVERSAL</span>}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap dark:text-gray-300">{formatDate(new Date(m.tanggal))}</td>
              <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400 max-w-64 truncate">{m.deskripsi}</td>
              <td className="px-3 py-2.5 whitespace-nowrap dark:text-gray-300">{m.debit > 0 ? formatCurrency(m.debit) : "-"}</td>
              <td className="px-3 py-2.5 whitespace-nowrap dark:text-gray-300">{m.kredit > 0 ? formatCurrency(m.kredit) : "-"}</td>
              <td className="px-3 py-2.5 whitespace-nowrap font-semibold dark:text-gray-100">{formatCurrency(m.saldoBerjalan)}</td>
              <td className="px-3 py-2.5">
                {!m.isReversal && (
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-orange-600">
                        <Undo2 className="w-3.5 h-3.5 mr-1" />Pembalik
                      </Button>
                    }
                    title="Buat Jurnal Pembalik?"
                    description={`Jurnal ${m.nomorJurnal} tidak akan diedit/dihapus, tapi dibuatkan jurnal pembalik (debit/kredit ditukar) untuk mengoreksi.`}
                    actionLabel="Buat Pembalik"
                    onConfirm={() => handleReversal(m.journalEntryId)}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
