import { auth } from "~/auth"
import { redirect } from "next/navigation"

export async function getSession() {
  return await auth()
}

export async function requireAuth() {
  const session = await auth()
  if (!session) redirect("/login")
  return session
}

export async function requireAdmin() {
  const session = await auth()
  if (!session) redirect("/login")
  if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) redirect("/dashboard")
  return session
}

export async function requireSuperAdmin() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "SUPER_ADMIN") redirect("/dashboard")
  return session
}

export function isAdmin(role: string) {
  return ["ADMIN", "SUPER_ADMIN"].includes(role)
}

export function isSuperAdmin(role: string) {
  return role === "SUPER_ADMIN"
}
