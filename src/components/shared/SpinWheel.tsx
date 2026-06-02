"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

const COLORS = [
  "#ef4444", "#22c55e", "#3b82f6", "#eab308",
  "#f97316", "#8b5cf6", "#ec4899", "#14b8a6",
  "#ef4444", "#22c55e", "#3b82f6", "#eab308",
]

export interface WheelCandidate { id: string; nama: string }

interface SpinWheelProps {
  candidates: WheelCandidate[]
  onWinner: (candidate: WheelCandidate) => void
  disabled?: boolean
}

export function SpinWheel({ candidates, onWinner, disabled }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotationRef = useRef(0)       // current rotation in radians
  const spinningRef = useRef(false)
  const [spinning, setSpinning] = useState(false)
  const [lastWinner, setLastWinner] = useState<WheelCandidate | null>(null)

  const n = candidates.length
  const SIZE = 480

  const draw = useCallback((rot: number) => {
    const canvas = canvasRef.current
    if (!canvas || n === 0) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const cx = SIZE / 2
    const cy = SIZE / 2
    const r = SIZE / 2 - 6
    const seg = (2 * Math.PI) / n

    ctx.clearRect(0, 0, SIZE, SIZE)

    // Shadow
    ctx.shadowBlur = 16
    ctx.shadowColor = "rgba(0,0,0,0.18)"

    for (let i = 0; i < n; i++) {
      const start = rot + i * seg - Math.PI / 2
      const end = rot + (i + 1) * seg - Math.PI / 2

      // Segment fill
      ctx.shadowBlur = 0
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, start, end)
      ctx.closePath()
      ctx.fillStyle = COLORS[i % COLORS.length]
      ctx.fill()
      ctx.strokeStyle = "#fff"
      ctx.lineWidth = 2.5
      ctx.stroke()

      // Text radial: searah jari-jari segmen (dari pusat ke tepi)
      const mid = rot + (i + 0.5) * seg - Math.PI / 2
      const fontSize = n > 24 ? 7 : n > 18 ? 8 : n > 12 ? 9 : 10
      const maxChars = n > 20 ? 8 : n > 12 ? 10 : 12
      const namaTrunc = candidates[i].nama.length > maxChars
        ? candidates[i].nama.slice(0, maxChars - 1) + "…"
        : candidates[i].nama
      const label = `${i + 1}. ${namaTrunc}`

      // Tentukan apakah segmen di sisi kiri atau kanan roda
      const isRight = Math.cos(mid) >= 0

      ctx.save()
      ctx.translate(cx, cy)

      // Kanan: rotate = mid → teks mengarah keluar (kiri ke kanan = pusat ke tepi)
      // Kiri: rotate = mid + π → flip agar teks tetap terbaca (kiri ke kanan = tepi ke pusat, tp di-flip jadi pusat ke tepi)
      ctx.rotate(isRight ? mid : mid + Math.PI)

      // Posisi teks: 60% dari radius, di sisi yang benar
      const rSign = isRight ? 1 : -1
      const textX = rSign * r * 0.60

      ctx.fillStyle = "#ffffff"
      ctx.shadowColor = "rgba(0,0,0,0.55)"
      ctx.shadowBlur = 3
      ctx.font = `bold ${fontSize}px ui-sans-serif, system-ui, sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(label, textX, 0)

      ctx.restore()
    }

    // Outer ring
    ctx.beginPath()
    ctx.arc(cx, cy, r + 3, 0, 2 * Math.PI)
    ctx.strokeStyle = "#1e293b"
    ctx.lineWidth = 4
    ctx.stroke()

    // Center circle
    ctx.shadowBlur = 8
    ctx.shadowColor = "rgba(0,0,0,0.3)"
    ctx.beginPath()
    ctx.arc(cx, cy, 28, 0, 2 * Math.PI)
    ctx.fillStyle = "#1e293b"
    ctx.fill()
    ctx.shadowBlur = 0

    // Center text — pakai spinningRef (bukan state) agar tidak trigger re-render
    const isSpinning = spinningRef.current
    ctx.fillStyle = "#f8fafc"
    ctx.font = `bold 9px ui-sans-serif, system-ui, sans-serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(isSpinning ? "..." : "KLIK", cx, cy - 5)
    ctx.font = "7px ui-sans-serif, system-ui, sans-serif"
    ctx.fillStyle = "#94a3b8"
    ctx.fillText("PUTAR", cx, cy + 6)
  }, [candidates, n])

  useEffect(() => {
    draw(rotationRef.current)
  }, [draw])

  const spin = useCallback(() => {
    if (spinningRef.current || disabled || n === 0) return

    spinningRef.current = true
    setSpinning(true)
    setLastWinner(null)

    const seg = (2 * Math.PI) / n

    // Pilih winner secara random
    const winnerIdx = Math.floor(Math.random() * n)
    const winnerMid = (winnerIdx + 0.5) * seg

    // ====== FIX: kalkulasi target rotation yang benar ======
    // Pointer ada di 3-o'clock = canvas angle 0
    // Segment i midpoint di canvas = rot + (i+0.5)*seg - π/2
    // Agar pointer tepat di midpoint winner:
    //   rot + winnerMid - π/2 = 0  →  rot = π/2 - winnerMid
    const desiredRot = ((Math.PI / 2 - winnerMid) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
    const currentNorm = ((rotationRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    const extra = (desiredRot - currentNorm + 2 * Math.PI) % (2 * Math.PI)

    // Tambah 6-10 putaran penuh + sedikit extra agar dramatis
    const fullSpins = (6 + Math.floor(Math.random() * 5)) * 2 * Math.PI
    const target = rotationRef.current + fullSpins + extra
    // =======================================================

    // Durasi 5-7 detik
    const duration = 5000 + Math.random() * 2000
    const start = performance.now()
    const startRot = rotationRef.current

    // Smooth ease-out tunggal (TIDAK piecewise) — monoton, tidak ada lompatan kecepatan
    // Power 6: cepat di awal, melambat panjang di akhir, tanpa akselerasi di tengah
    function easeOut(p: number): number {
      return 1 - Math.pow(1 - p, 6)
    }

    function animate(now: number) {
      const elapsed = now - start
      const p = Math.min(elapsed / duration, 1)
      const cur = startRot + (target - startRot) * easeOut(p)

      rotationRef.current = cur
      draw(cur)

      if (p < 1) {
        requestAnimationFrame(animate)
      } else {
        // Snap ke posisi tepat
        rotationRef.current = target
        draw(target)
        spinningRef.current = false
        setSpinning(false)

        // Verifikasi winner dari posisi akhir roda (bukan dari winnerIdx yang dipilih awal)
        // Cari segmen yang midpoint-nya paling dekat ke pointer (canvas angle 0)
        const finalNorm = ((target % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
        let actualIdx = 0
        let minDist = Infinity
        for (let i = 0; i < n; i++) {
          const midA = ((finalNorm + (i + 0.5) * seg - Math.PI / 2) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
          const dist = Math.min(midA, 2 * Math.PI - midA)  // jarak ke angle 0
          if (dist < minDist) { minDist = dist; actualIdx = i }
        }

        const winner = candidates[actualIdx]
        setLastWinner(winner)
        onWinner(winner)
      }
    }

    requestAnimationFrame(animate)
  }, [candidates, disabled, draw, n, onWinner])

  // Ctrl+Enter shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); spin() }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [spin])

  if (n === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="w-72 h-72 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200">
          <p className="text-sm text-gray-400 text-center px-8">Tidak ada kandidat eligible</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Wheel + pointer */}
      <div className="relative flex items-center">
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          onClick={spin}
          className={`rounded-full shadow-2xl transition-opacity ${
            spinning || disabled ? "cursor-wait opacity-90" : "cursor-pointer hover:opacity-95"
          }`}
          style={{ maxWidth: "min(320px, 90vw)", maxHeight: "min(320px, 90vw)" }}
        />
        {/* Pointer arrow — kanan tengah */}
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10">
          <div
            className="w-0 h-0"
            style={{
              borderTop: "12px solid transparent",
              borderBottom: "12px solid transparent",
              borderRight: "22px solid #1e293b",
            }}
          />
        </div>
      </div>

      {/* Keterangan */}
      <p className="text-xs text-gray-400 text-center">
        {spinning
          ? "Sedang memutar... 🎰"
          : lastWinner
          ? <span className="text-green-600 font-semibold text-sm">🎉 {lastWinner.nama}</span>
          : "Klik roda atau tekan Ctrl+Enter untuk memutar"
        }
      </p>

      {/* Tombol reset */}
      {!spinning && lastWinner && (
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => { setLastWinner(null); draw(rotationRef.current) }}
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Putar Ulang
        </Button>
      )}
    </div>
  )
}
