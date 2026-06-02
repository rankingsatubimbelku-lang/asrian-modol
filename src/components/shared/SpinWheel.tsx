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
  const SIZE = 320

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

      // Text: nomor urut + nama
      const mid = rot + (i + 0.5) * seg - Math.PI / 2
      const tr = r * 0.62
      const tx = cx + tr * Math.cos(mid)
      const ty = cy + tr * Math.sin(mid)

      ctx.save()
      ctx.translate(tx, ty)
      ctx.rotate(mid + Math.PI / 2)
      ctx.fillStyle = "#ffffff"
      ctx.shadowColor = "rgba(0,0,0,0.5)"
      ctx.shadowBlur = 3

      const fontSize = n > 20 ? 8 : n > 12 ? 9 : 10
      const namaTrunc = candidates[i].nama.length > 12 ? candidates[i].nama.slice(0, 11) + "…" : candidates[i].nama

      // Nomor urut — di atas
      ctx.font = `bold ${fontSize + 1}px ui-sans-serif, system-ui, sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(`${i + 1}.`, 0, -fontSize * 0.9)

      // Nama — di bawah nomor
      ctx.font = `${fontSize}px ui-sans-serif, system-ui, sans-serif`
      ctx.fillText(namaTrunc, 0, fontSize * 0.8)

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

    // Center text
    ctx.fillStyle = "#f8fafc"
    ctx.font = `bold ${spinning ? 8 : 9}px ui-sans-serif, system-ui, sans-serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(spinning ? "..." : "KLIK", cx, cy - 5)
    ctx.font = "7px ui-sans-serif, system-ui, sans-serif"
    ctx.fillStyle = "#94a3b8"
    ctx.fillText("PUTAR", cx, cy + 6)
  }, [candidates, n, spinning])

  useEffect(() => {
    draw(rotationRef.current)
  }, [draw])

  const spin = useCallback(() => {
    if (spinningRef.current || disabled || n === 0) return

    spinningRef.current = true
    setSpinning(true)
    setLastWinner(null)

    // Pick random winner
    const winnerIdx = Math.floor(Math.random() * n)
    const seg = (2 * Math.PI) / n

    // Calculate target rotation to land exactly on winner (pointer at right = 0 rad)
    const winnerMid = (winnerIdx + 0.5) * seg
    const fullSpins = (5 + Math.random() * 4) * 2 * Math.PI
    const currentNorm = rotationRef.current % (2 * Math.PI)
    const targetOffset = (2 * Math.PI - winnerMid + (2 * Math.PI - currentNorm)) % (2 * Math.PI)
    const target = rotationRef.current + fullSpins + targetOffset

    const duration = 4500 + Math.random() * 2000
    const start = performance.now()
    const startRot = rotationRef.current

    function animate(now: number) {
      const elapsed = now - start
      const p = Math.min(elapsed / duration, 1)
      // Ease out quint
      const e = 1 - Math.pow(1 - p, 5)
      const cur = startRot + (target - startRot) * e

      rotationRef.current = cur
      draw(cur)

      if (p < 1) {
        requestAnimationFrame(animate)
      } else {
        rotationRef.current = target
        spinningRef.current = false
        setSpinning(false)
        const winner = candidates[winnerIdx]
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
