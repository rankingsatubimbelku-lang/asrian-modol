"use client"

import { Button } from "@/components/ui/button"
import { FileDown, Sheet } from "lucide-react"
import { exportToPDF, exportToExcel, type ExportColumn } from "@/lib/export"

interface ExportButtonsProps {
  title: string
  subtitle?: string
  columns: ExportColumn[]
  data: Record<string, unknown>[]
  filename: string
}

export function ExportButtons({ title, subtitle, columns, data, filename }: ExportButtonsProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
        onClick={() => exportToPDF({ title, subtitle, columns, data, filename })}
      >
        <FileDown className="w-3.5 h-3.5 mr-1.5" />
        PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs text-green-600 border-green-200 hover:bg-green-50"
        onClick={() => exportToExcel({ title, columns, data, filename })}
      >
        <Sheet className="w-3.5 h-3.5 mr-1.5" />
        Excel
      </Button>
    </div>
  )
}
