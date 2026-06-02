"use client"

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

export interface ExportColumn {
  header: string
  key: string
}

export function exportToPDF({
  title,
  subtitle,
  columns,
  data,
  filename,
}: {
  title: string
  subtitle?: string
  columns: ExportColumn[]
  data: Record<string, unknown>[]
  filename: string
}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })

  // Header
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(title, 14, 18)

  if (subtitle) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100)
    doc.text(subtitle, 14, 26)
  }

  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text(`Dicetak: ${new Date().toLocaleString("id-ID")}`, 14, subtitle ? 32 : 26)

  autoTable(doc, {
    startY: subtitle ? 36 : 30,
    head: [columns.map(c => c.header)],
    body: data.map(row => columns.map(c => String(row[c.key] ?? "-"))),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { top: 10, right: 14, bottom: 10, left: 14 },
  })

  doc.save(`${filename}-${new Date().toISOString().slice(0, 10)}.pdf`)
}

export function exportToExcel({
  title,
  columns,
  data,
  filename,
}: {
  title: string
  columns: ExportColumn[]
  data: Record<string, unknown>[]
  filename: string
}) {
  const headers = columns.map(c => c.header)
  const rows = data.map(row => columns.map(c => row[c.key] ?? "-"))

  const ws = XLSX.utils.aoa_to_sheet([
    [title],
    [`Diekspor: ${new Date().toLocaleString("id-ID")}`],
    [],
    headers,
    ...rows,
  ])

  ws["!cols"] = columns.map(() => ({ wch: 20 }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Data")
  XLSX.writeFile(wb, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
