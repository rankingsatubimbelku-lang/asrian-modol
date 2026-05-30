"use server"

import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

interface AuditParams {
  userId: string
  module: string
  action: string
  entityId?: string
  dataLama?: object
  dataBaru?: object
}

export async function logActivity({
  userId, module, action, entityId, dataLama, dataBaru,
}: AuditParams) {
  try {
    const headersList = await headers()
    await prisma.activityLog.create({
      data: {
        userId,
        module,
        action,
        entityId,
        dataLama: dataLama as never,
        dataBaru: dataBaru as never,
        ipAddress: headersList.get("x-forwarded-for") ?? "unknown",
        userAgent: headersList.get("user-agent") ?? "unknown",
      },
    })
  } catch {
    // Audit log gagal tidak boleh menghentikan operasi utama
  }
}
