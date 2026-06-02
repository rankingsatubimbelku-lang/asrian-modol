import type { Metadata, Viewport } from "next"
import "./globals.css"
import { SessionProvider } from "@/components/layout/SessionProvider"
import { ThemeProvider } from "@/components/layout/ThemeProvider"

export const metadata: Metadata = {
  title: "Sistem Arisan Keluarga",
  description: "Sistem Informasi Tabungan, Kredit dan Arisan Keluarga",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
