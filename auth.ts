import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null

          const email = String(credentials.email).trim().toLowerCase()
          const password = String(credentials.password)

          // Super Admin dari ENV — tidak query database
          const superEmail = (process.env.SUPER_ADMIN_EMAIL ?? "").trim().toLowerCase()
          if (email === superEmail && password === process.env.SUPER_ADMIN_PASSWORD) {
            return {
              id: "super-admin",
              email: String(credentials.email).trim(),
              name: "Super Admin",
              role: "SUPER_ADMIN",
            }
          }

          // Admin & Anggota dari database
          const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, password: true, role: true, isActive: true },
          })

          if (!user) {
            console.error("[AUTH] User tidak ditemukan:", email)
            return null
          }

          if (!user.isActive) {
            console.error("[AUTH] User nonaktif:", email)
            return null
          }

          const isValid = await bcrypt.compare(password, user.password)
          if (!isValid) {
            console.error("[AUTH] Password salah untuk:", email)
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.email,
            role: user.role,
          }
        } catch (error) {
          console.error("[AUTH] Error saat authorize:", error)
          return null
        }
      },
    }),
  ],
})
