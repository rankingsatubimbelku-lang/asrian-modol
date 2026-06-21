import { cn } from "@/lib/utils"

const variants: Record<string, string> = {
  // Member status
  AKTIF: "bg-green-100 text-green-700",
  NONAKTIF: "bg-gray-100 text-gray-500",
  // Arisan period
  DRAFT: "bg-yellow-100 text-yellow-700",
  SELESAI: "bg-blue-100 text-blue-700",
  // Payment
  LUNAS: "bg-green-100 text-green-700",
  MENUNGGAK: "bg-red-100 text-red-700",
  // Loan
  MENUNGGU_PERSETUJUAN: "bg-yellow-100 text-yellow-700",
  DISETUJUI: "bg-blue-100 text-blue-700",
  DITOLAK: "bg-red-100 text-red-700",
  // Installment
  BELUM_BAYAR: "bg-orange-100 text-orange-700",
  SEBAGIAN: "bg-blue-100 text-blue-700",
  TERLAMBAT: "bg-red-100 text-red-700",
}

const labels: Record<string, string> = {
  AKTIF: "Aktif",
  NONAKTIF: "Nonaktif",
  DRAFT: "Draft",
  AKTIF_PERIOD: "Aktif",
  SELESAI: "Selesai",
  LUNAS: "Lunas",
  MENUNGGAK: "Menunggak",
  MENUNGGU_PERSETUJUAN: "Menunggu",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
  BELUM_BAYAR: "Belum Bayar",
  SEBAGIAN: "Sebagian",
  TERLAMBAT: "Terlambat",
}

interface StatusBadgeProps {
  status: string
  label?: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const colorClass = variants[status] ?? "bg-gray-100 text-gray-600"
  const displayLabel = label ?? labels[status] ?? status

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", colorClass)}>
      {displayLabel}
    </span>
  )
}
