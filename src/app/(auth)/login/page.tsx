"use client"

import { useState } from "react"
import { loginAction } from "@/actions/auth.actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Wallet, Loader2, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await loginAction(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-xl border-0">
      {/* Header */}
      <CardHeader className="text-center pb-2 pt-8">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-600 p-3 rounded-2xl">
            <Wallet className="w-8 h-8 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-800">
          {process.env.NEXT_PUBLIC_APP_NAME ?? "Sistem Arisan"}
        </CardTitle>
        <CardDescription className="text-gray-500 text-sm mt-1">
          Masuk untuk mengelola keuangan kelompok
        </CardDescription>
      </CardHeader>

      {/* Form */}
      <CardContent className="pb-8 pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nama@email.com"
              required
              autoComplete="email"
              className="h-12 text-base"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="h-12 text-base pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 mt-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              "Masuk"
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 Sistem Arisan Keluarga
        </p>
      </CardContent>
    </Card>
  )
}
