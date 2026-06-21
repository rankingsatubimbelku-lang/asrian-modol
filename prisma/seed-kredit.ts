import { PrismaClient } from "@prisma/client"
import { format } from "date-fns"

const prisma = new PrismaClient()

const tujuanList = [
  "Modal usaha dagang",
  "Renovasi rumah",
  "Biaya pendidikan anak",
  "Modal kerja harian",
  "Keperluan kesehatan keluarga",
  "Membeli peralatan usaha",
  "Biaya pernikahan",
  "Modal ternak/pertanian",
  "Perbaikan kendaraan",
  "Kebutuhan mendesak keluarga",
]

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomNominal(): number {
  // Random 1.000.000 - 5.000.000, dibulatkan ke kelipatan 100.000
  const steps = randomInt(10, 50) // 10 x 100rb = 1jt, 50 x 100rb = 5jt
  return steps * 100_000
}

function randomTanggalMei2026(): Date {
  const tanggal = randomInt(1, 28) // aman dari masalah akhir bulan
  return new Date(2026, 4, tanggal) // bulan index 4 = Mei
}

function generateNomorPengajuan(tanggal: Date): string {
  const ymd = format(tanggal, "yyyyMMdd")
  const seq = randomInt(1000, 9999)
  return `LN-${ymd}-${seq}`
}

async function main() {
  console.log("🌱 Seeding 10 data kredit (DISETUJUI, Mei 2026)...")

  const setting = await prisma.loanInterestSetting.findFirst({ where: { isActive: true } })
  if (!setting) {
    console.error("❌ Belum ada setting bunga kredit aktif. Set dulu di Pengaturan → Bunga Kredit.")
    process.exit(1)
  }

  const admin = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    orderBy: { createdAt: "asc" },
  })
  if (!admin) {
    console.error("❌ Tidak ada user ADMIN/SUPER_ADMIN di database.")
    process.exit(1)
  }

  const candidateMembers = await prisma.member.findMany({
    where: { status: "AKTIF" },
    select: { id: true, namaLengkap: true, nomorAnggota: true },
  })

  if (candidateMembers.length < 10) {
    console.error(`❌ Hanya ada ${candidateMembers.length} anggota aktif, butuh minimal 10.`)
    process.exit(1)
  }

  // Pilih 10 anggota secara random tanpa duplikat
  const shuffled = [...candidateMembers].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, 10)

  let created = 0

  for (const member of selected) {
    const nominalPinjaman = randomNominal()
    const tanggalPengajuan = randomTanggalMei2026()
    const tanggalDisetujui = new Date(tanggalPengajuan)
    tanggalDisetujui.setDate(Math.min(28, tanggalPengajuan.getDate() + randomInt(1, 3)))

    let nomorPengajuan = generateNomorPengajuan(tanggalPengajuan)
    while (await prisma.loan.findUnique({ where: { nomorPengajuan } })) {
      nomorPengajuan = generateNomorPengajuan(tanggalPengajuan)
    }

    const tenor = [6, 12, 18, 24][randomInt(0, 3)]
    const tujuanPinjaman = tujuanList[randomInt(0, tujuanList.length - 1)]

    await prisma.loan.create({
      data: {
        nomorPengajuan,
        memberId: member.id,
        nominalPinjaman,
        tenor,
        sisaPokok: nominalPinjaman, // belum ada pembayaran sama sekali
        tujuanPinjaman,
        interestSettingId: setting.id,
        status: "DISETUJUI",
        tanggalPengajuan,
        tanggalDisetujui,
        approvedBy: admin.id,
        createdBy: admin.id,
        catatanApproval: "Disetujui (data seed)",
      },
    })

    console.log(`  ✓ ${member.namaLengkap.padEnd(28)} ${member.nomorAnggota}  Rp ${nominalPinjaman.toLocaleString("id-ID")}  (${nomorPengajuan})`)
    created++
  }

  console.log(`\n✅ Seeding selesai: ${created} kredit dibuat (status DISETUJUI, Mei 2026)`)
  console.log(`   Setting bunga dipakai: ${setting.persentase}% (${setting.metode})`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
