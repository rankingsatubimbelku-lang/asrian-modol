"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Navbar } from "@/components/layout/Navbar"
import { MobileBottomNav } from "@/components/layout/MobileBottomNav"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Toaster } from "@/components/ui/sonner"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const role = session?.user?.role ?? "ANGGOTA"
  const email = session?.user?.email ?? ""

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-60 lg:flex-col border-r dark:border-white/10 z-20">
        <Sidebar role={role} />
      </aside>

      {/* Mobile sidebar (Sheet/drawer) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar role={role} onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="lg:pl-60 flex flex-col min-h-screen">
        <Navbar
          email={email}
          role={role}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="flex-1 p-4 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav role={role} />

      <Toaster position="top-center" richColors />
    </div>
  )
}
