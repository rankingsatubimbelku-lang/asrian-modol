import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "@/components/layout/SessionProvider"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })

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
    <html lang="id">
      <body className={`${geist.variable} font-sans antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
