"use server"

import { signIn, signOut } from "~/auth"
import { AuthError } from "next-auth"

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Email atau password salah." }
        default:
          return { error: "Terjadi kesalahan. Silakan coba lagi." }
      }
    }
    throw error
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" })
}
