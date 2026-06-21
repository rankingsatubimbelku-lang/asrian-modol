"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Users, Dices, PiggyBank, CreditCard,
  CalendarDays, Settings, ChevronDown, ChevronRight, Wallet,
} from "lucide-react"
import { useState } from "react"

type NavItem = {
  label: string
  href?: string
  icon: React.ReactNode
  children?: { label: string; href: string }[]
  roles: string[]
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ["SUPER_ADMIN", "ADMIN", "ANGGOTA"],
  },
  {
    label: "Anggota",
    icon: <Users className="w-5 h-5" />,
    roles: ["SUPER_ADMIN", "ADMIN"],
    children: [
      { label: "Daftar Anggota", href: "/anggota" },
      { label: "Tambah Anggota", href: "/anggota/tambah" },
    ],
  },
  {
    label: "Arisan",
    icon: <Dices className="w-5 h-5" />,
    roles: ["SUPER_ADMIN", "ADMIN", "ANGGOTA"],
    children: [
      { label: "Periode Arisan", href: "/arisan/periode" },
      { label: "Input Iuran", href: "/arisan/iuran" },
      { label: "Pengundian", href: "/arisan/undian" },
      { label: "Laporan", href: "/arisan/laporan" },
    ],
  },
  {
    label: "Tabungan",
    icon: <PiggyBank className="w-5 h-5" />,
    roles: ["SUPER_ADMIN", "ADMIN", "ANGGOTA"],
    children: [
      { label: "Daftar Tabungan", href: "/tabungan" },
      { label: "Input Transaksi", href: "/tabungan/transaksi" },
      { label: "Laporan", href: "/tabungan/laporan" },
    ],
  },
  {
    label: "Kredit",
    icon: <CreditCard className="w-5 h-5" />,
    roles: ["SUPER_ADMIN", "ADMIN", "ANGGOTA"],
    children: [
      { label: "Daftar Kredit", href: "/kredit" },
      { label: "Pengajuan", href: "/kredit/pengajuan" },
      { label: "Approval", href: "/kredit/approval" },
      { label: "Input Angsuran", href: "/kredit/angsuran" },
      { label: "Laporan", href: "/kredit/laporan" },
      { label: "Pendapatan Bunga", href: "/kredit/laporan-bunga" },
    ],
  },
  {
    label: "Jadwal Kegiatan",
    href: "/kegiatan",
    icon: <CalendarDays className="w-5 h-5" />,
    roles: ["SUPER_ADMIN", "ADMIN", "ANGGOTA"],
  },
  {
    label: "Pengaturan",
    icon: <Settings className="w-5 h-5" />,
    roles: ["SUPER_ADMIN", "ADMIN"],
    children: [
      { label: "Bunga Tabungan", href: "/pengaturan/bunga-tabungan" },
      { label: "Bunga Kredit", href: "/pengaturan/bunga-kredit" },
    ],
  },
]

interface SidebarProps {
  role: string
  onClose?: () => void
}

export function Sidebar({ role, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<string[]>([])

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    )
  }

  const filtered = navItems.filter((item) => item.roles.includes(role))

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b dark:border-white/10">
        <div className="bg-blue-600 p-2 rounded-xl">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-tight">Sistem Arisan</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Keluarga</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {filtered.map((item) => {
          const isOpen = openMenus.includes(item.label)
          const isActive = item.href
            ? pathname === item.href
            : item.children?.some((c) => pathname.startsWith(c.href)) ?? false

          if (item.href) {
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                <span className={isActive ? "text-blue-600" : "text-gray-400"}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            )
          }

          return (
            <div key={item.label}>
              <button
                onClick={() => toggleMenu(item.label)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                <span className={isActive ? "text-blue-600" : "text-gray-400"}>
                  {item.icon}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {isOpen && (
                <div className="ml-8 mt-0.5 space-y-0.5">
                  {item.children?.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onClose}
                      className={cn(
                        "block px-3 py-2 rounded-lg text-sm transition-colors",
                        pathname === child.href
                          ? "bg-blue-50 text-blue-700 font-medium dark:bg-blue-950/60 dark:text-blue-400"
                          : "text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-gray-800 dark:hover:text-gray-200"
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
}
