import { auth } from "~/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Public routes
  if (pathname === "/login") {
    if (session) return NextResponse.redirect(new URL("/dashboard", req.url))
    return NextResponse.next()
  }

  // Redirect ke login jika belum auth
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Proteksi route admin dari anggota biasa
  const adminRoutes = ["/anggota", "/pengaturan"]
  const isAdminRoute = adminRoutes.some((r) => pathname.startsWith(r))
  if (isAdminRoute && session.user.role === "ANGGOTA") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Proteksi route super-admin
  const superAdminRoutes = ["/super-admin"]
  const isSuperAdminRoute = superAdminRoutes.some((r) => pathname.startsWith(r))
  if (isSuperAdminRoute && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)"],
}
