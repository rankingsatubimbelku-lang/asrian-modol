/**
 * Konversi Prisma Decimal dan Date menjadi tipe yang bisa di-serialize
 * untuk dikirim dari Server Component ke Client Component.
 */
export function serialize<T>(data: T): T {
  if (Array.isArray(data)) {
    return data.map(serialize) as unknown as T
  }

  if (data === null || data === undefined) return data

  if (data instanceof Date) {
    return data as T
  }

  if (typeof data === "object") {
    // Prisma Decimal memiliki method toNumber()
    if (typeof (data as { toNumber?: unknown }).toNumber === "function") {
      return String(data) as unknown as T
    }

    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[key] = serialize(value)
    }
    return result as T
  }

  return data
}
