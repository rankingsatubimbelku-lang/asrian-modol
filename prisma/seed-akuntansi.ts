import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const defaultAccounts = [
  { kode: "1001", nama: "Kas", tipe: "ASET" as const },
  { kode: "1101", nama: "Piutang Kredit Anggota", tipe: "ASET" as const },
  { kode: "2001", nama: "Tabungan Anggota", tipe: "KEWAJIBAN" as const },
  { kode: "3001", nama: "Modal / SHU Ditahan", tipe: "MODAL" as const },
  { kode: "4001", nama: "Pendapatan Bunga Kredit", tipe: "PENDAPATAN" as const },
  { kode: "4002", nama: "Pendapatan Denda Kredit", tipe: "PENDAPATAN" as const },
  { kode: "4003", nama: "Pendapatan Lain-lain", tipe: "PENDAPATAN" as const },
  { kode: "5001", nama: "Beban Bunga Tabungan", tipe: "BEBAN" as const },
  { kode: "5002", nama: "Beban Operasional", tipe: "BEBAN" as const },
]

async function main() {
  for (const akun of defaultAccounts) {
    await prisma.account.upsert({
      where: { kode: akun.kode },
      update: {},
      create: akun,
    })
  }
  console.log(`✅ Seeding selesai: ${defaultAccounts.length} akun Chart of Accounts dibuat/diverifikasi`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
