import { format } from "date-fns"
import { id } from "date-fns/locale"

export function formatCurrency(value: number | string | { toString(): string }): string {
  const str = typeof value === "number" ? value : String(value)
  const num = typeof str === "number" ? str : parseFloat(str)
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, "dd MMM yyyy", { locale: id })
}

export function formatMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-")
  const d = new Date(parseInt(year), parseInt(month) - 1, 1)
  return format(d, "MMMM yyyy", { locale: id })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, "dd MMM yyyy HH:mm", { locale: id })
}

export function currentYearMonth(): string {
  return format(new Date(), "yyyy-MM")
}

export function generateNomorAnggota(): string {
  const ym = format(new Date(), "yyyyMM")
  const seq = Math.floor(Math.random() * 9000 + 1000)
  return `MBR-${ym}-${seq}`
}

export function generateNomorTransaksi(prefix: "SAV" | "LN"): string {
  const ymd = format(new Date(), "yyyyMMdd")
  const seq = Math.floor(Math.random() * 9000 + 1000)
  return `${prefix}-${ymd}-${seq}`
}
