"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function TanggalFilter({ perTanggal }: { perTanggal: string }) {
  const router = useRouter()
  const [val, setVal] = useState(perTanggal)

  return (
    <div className="flex items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Per Tanggal</Label>
        <Input type="date" value={val} onChange={e => setVal(e.target.value)} className="h-9 w-44" />
      </div>
      <Button size="sm" className="h-9" onClick={() => router.push(`/akuntansi/neraca?perTanggal=${val}`)}>
        Terapkan
      </Button>
    </div>
  )
}
