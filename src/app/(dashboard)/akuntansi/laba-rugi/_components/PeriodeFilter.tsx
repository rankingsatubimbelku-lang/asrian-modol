"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function PeriodeFilter({ dari, sampai }: { dari: string; sampai: string }) {
  const router = useRouter()
  const [dariVal, setDariVal] = useState(dari)
  const [sampaiVal, setSampaiVal] = useState(sampai)

  function apply() {
    router.push(`/akuntansi/laba-rugi?dari=${dariVal}&sampai=${sampaiVal}`)
  }

  return (
    <div className="flex items-end gap-3 flex-wrap">
      <div className="space-y-1">
        <Label className="text-xs">Dari Tanggal</Label>
        <Input type="date" value={dariVal} onChange={e => setDariVal(e.target.value)} className="h-9 w-40" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Sampai Tanggal</Label>
        <Input type="date" value={sampaiVal} onChange={e => setSampaiVal(e.target.value)} className="h-9 w-40" />
      </div>
      <Button size="sm" className="h-9" onClick={apply}>Terapkan</Button>
    </div>
  )
}
