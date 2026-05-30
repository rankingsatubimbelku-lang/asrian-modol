"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Dices, PiggyBank, CreditCard } from "lucide-react"

const adminNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Anggota", href: "/anggota", icon: Users },
  { label: "Arisan", href: "/arisan/periode", icon: Dices },
  { label: "Tabungan", href: "/tabungan", icon: PiggyBank },
  { label: "Kredit", href: "/kredit", icon: CreditCard },
]

const anggotaNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Tabungan", href: "/tabungan", icon: PiggyBank },
  { label: "Kredit", href: "/kredit", icon: CreditCard },
  { label: "Arisan", href: "/arisan/periode", icon: Dices },
]

interface MobileBottomNavProps {
  role: string
}

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname()
  const items = ["ADMIN", "SUPER_ADMIN"].includes(role) ? adminNav : anggotaNav

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-30 safe-area-pb">
      <div className="flex items-stretch">
        {items.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors",
                isActive ? "text-blue-600" : "text-gray-500"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-blue-600")} />
              <span className={cn("font-medium", isActive && "text-blue-600")}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
