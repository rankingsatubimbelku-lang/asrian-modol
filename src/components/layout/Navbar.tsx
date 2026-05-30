"use client"

import { Menu, Bell, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { logoutAction } from "@/actions/auth.actions"

const roleBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  SUPER_ADMIN: { label: "Super Admin", variant: "destructive" },
  ADMIN: { label: "Admin", variant: "default" },
  ANGGOTA: { label: "Anggota", variant: "secondary" },
}

interface NavbarProps {
  email: string
  role: string
  onMenuClick: () => void
}

export function Navbar({ email, role, onMenuClick }: NavbarProps) {
  const initials = email.substring(0, 2).toUpperCase()
  const badge = roleBadge[role] ?? roleBadge.ANGGOTA

  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-4 sticky top-0 z-30">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Desktop: spacer */}
      <div className="hidden lg:block" />

      {/* Right: notif + user */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-gray-500" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 h-9 px-2 rounded-md hover:bg-gray-100 transition-colors outline-none">
            <Avatar className="w-7 h-7">
              <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-30 truncate">
              {email}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-gray-800 truncate">{email}</p>
              <Badge variant={badge.variant} className="mt-1 text-xs">
                {badge.label}
              </Badge>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Profil Saya
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => logoutAction()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
