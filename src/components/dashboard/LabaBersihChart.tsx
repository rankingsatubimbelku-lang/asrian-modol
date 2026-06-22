"use client"

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from "recharts"
import { formatMonth } from "@/lib/format"

type DataPoint = { bulan: string; pendapatan: number; beban: number; labaBersih: number }

function formatCompact(value: number) {
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}rb`
  return String(value)
}

export function LabaBersihChart({ data }: { data: DataPoint[] }) {
  if (data.every(d => d.labaBersih === 0)) {
    return <p className="text-sm text-gray-400 text-center py-10">Belum ada data jurnal untuk ditampilkan</p>
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-white/10" />
        <XAxis
          dataKey="bulan"
          tickFormatter={(v: string) => formatMonth(v).slice(0, 3)}
          tick={{ fontSize: 11, fill: "currentColor" }}
          className="text-gray-500"
        />
        <YAxis
          tickFormatter={formatCompact}
          tick={{ fontSize: 11, fill: "currentColor" }}
          className="text-gray-500"
          width={45}
        />
        <ReferenceLine y={0} className="stroke-gray-300 dark:stroke-white/20" />
        <Tooltip
          formatter={(value) => [`Rp ${Number(value).toLocaleString("id-ID")}`, "Laba Bersih"]}
          labelFormatter={(v: string) => formatMonth(v)}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Line
          type="monotone"
          dataKey="labaBersih"
          stroke="#2563eb"
          strokeWidth={2.5}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
