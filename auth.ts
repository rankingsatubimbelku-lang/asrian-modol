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
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email as string
        const password = credentials.password as string

        // Super Admin dari ENV — tidak query database
        if (
          email === process.env.SUPER_ADMIN_EMAIL &&
          password === process.env.SUPER_ADMIN_PASSWORD
        ) {
          return {
            id: "super-admin",
            email,
            name: "Super Admin",
            role: "SUPER_ADMIN",
          }
        }

        // Admin & Anggota dari database
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, password: true, role: true, isActive: true },
        })

        if (!user || !user.isActive) return null

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.email,
          role: user.role,
        }
      },
    }),
  ],
})
