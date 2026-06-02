import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { format } from "date-fns"

const prisma = new PrismaClient()

const anggotaData = [
  { nama: "Wayan Sujana", tempat: "Denpasar", hp: "081234567001" },
  { nama: "Made Artini", tempat: "Gianyar", hp: "081234567002" },
  { nama: "Nyoman Sudiarta", tempat: "Tabanan", hp: "081234567003" },
  { nama: "Ketut Wirawan", tempat: "Badung", hp: "081234567004" },
  { nama: "Putu Rahayu", tempat: "Buleleng", hp: "081234567005" },
  { nama: "Komang Astawa", tempat: "Karangasem", hp: "081234567006" },
  { nama: "Luh Suarni", tempat: "Bangli", hp: "081234567007" },
  { nama: "Gede Mahendra", tempat: "Klungkung", hp: "081234567008" },
  { nama: "Desak Ratna", tempat: "Jembrana", hp: "081234567009" },
  { nama: "I Wayan Karma", tempat: "Singaraja", hp: "081234567010" },
  { nama: "Ni Made Sari", tempat: "Ubud", hp: "081234567011" },
  { nama: "I Ketut Sudana", tempat: "Kuta", hp: "081234567012" },
  { nama: "Ni Nyoman Ayu", tempat: "Seminyak", hp: "081234567013" },
  { nama: "I Komang Darmawan", tempat: "Nusa Dua", hp: "081234567014" },
  { nama: "Ni Luh Putu Dewi", tempat: "Canggu", hp: "081234567015" },
  { nama: "Anak Agung Bagus", tempat: "Sanur", hp: "081234567016" },
  { nama: "Tjokorda Istri Mas", tempat: "Ubud", hp: "081234567017" },
  { nama: "I Gusti Ngurah Putra", tempat: "Denpasar", hp: "081234567018" },
  { nama: "Ni Wayan Sriani", tempat: "Mengwi", hp: "081234567019" },
  { nama: "I Made Suarsa", tempat: "Tampaksiring", hp: "081234567020" },
  { nama: "Kadek Budiari", tempat: "Payangan", hp: "081234567021" },
  { nama: "Luh Gede Widiani", tempat: "Abiansemal", hp: "081234567022" },
  { nama: "Putu Wahyu Ardana", tempat: "Kerobokan", hp: "081234567023" },
  { nama: "Ni Ketut Suari", tempat: "Sukawati", hp: "081234567024" },
  { nama: "Made Yasa Antara", tempat: "Blahbatuh", hp: "081234567025" },
  { nama: "Wayan Rai Sanjaya", tempat: "Gianyar", hp: "081234567026" },
  { nama: "Ni Putu Eka Suci", tempat: "Banjarangkan", hp: "081234567027" },
  { nama: "Gede Wirya Santosa", tempat: "Semarapura", hp: "081234567028" },
  { nama: "Luh Sari Dewi", tempat: "Amlapura", hp: "081234567029" },
  { nama: "Ketut Agus Pratama", tempat: "Seririt", hp: "081234567030" },
  { nama: "Ni Made Rini Astuti", tempat: "Negara", hp: "081234567031" },
]

function generateNomorAnggota(index: number): string {
  const ym = format(new Date(), "yyyyMM")
  const seq = String(index).padStart(4, "0")
  return `MBR-${ym}-${seq}`
}

function generateNIK(index: number): string {
  const base = "5171"
  const dob = `${String(index % 28 + 1).padStart(2, "0")}0685`
  const seq = String(1000 + index).padStart(4, "0")
  return `${base}${dob}${seq}`
}

async function main() {
  console.log("🌱 Seeding 31 anggota aktif...")

  const defaultPassword = await bcrypt.hash("anggota123", 12)
  const bergabung = new Date("2026-01-01")

  let created = 0
  let skipped = 0

  for (let i = 0; i < anggotaData.length; i++) {
    const data = anggotaData[i]
    const email = `anggota${String(i + 1).padStart(2, "0")}@arisan.com`
    const nomorAnggota = generateNomorAnggota(i + 1)
    const nik = generateNIK(i + 1)

    // Skip jika email atau NIK sudah ada
    const existingEmail = await prisma.user.findUnique({ where: { email } })
    if (existingEmail) {
      console.log(`  ⟳ Skip ${data.nama} (email sudah ada)`)
      skipped++
      continue
    }

    const existingNik = await prisma.member.findUnique({ where: { nik } })
    if (existingNik) {
      console.log(`  ⟳ Skip ${data.nama} (NIK sudah ada)`)
      skipped++
      continue
    }

    let finalNomor = nomorAnggota
    while (await prisma.member.findUnique({ where: { nomorAnggota: finalNomor } })) {
      finalNomor = `MBR-${format(new Date(), "yyyyMM")}-${String(Math.floor(Math.random() * 9000 + 1000))}`
    }

    // Sequential queries — tidak pakai transaction agar tidak timeout di NeonDB free tier
    const user = await prisma.user.create({
      data: { email, password: defaultPassword, role: "ANGGOTA", isActive: true },
    })

    const member = await prisma.member.create({
      data: {
        userId: user.id,
        nomorAnggota: finalNomor,
        namaLengkap: data.nama,
        nik,
        tempatLahir: data.tempat,
        tanggalLahir: new Date(`198${(i % 9) + 1}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`),
        alamat: `Jl. ${data.tempat} No. ${i + 1}, Bali`,
        nomorHp: data.hp,
        tanggalBergabung: bergabung,
        status: "AKTIF",
      },
    })

    await prisma.saving.create({ data: { memberId: member.id, saldo: 0 } })

    console.log(`  ✓ ${String(i + 1).padStart(2, " ")}. ${data.nama.padEnd(28)} ${finalNomor}  ${email}`)
    created++
  }

  console.log(`\n✅ Seeding selesai: ${created} dibuat, ${skipped} dilewati`)
  console.log(`\n📋 Kredensial login anggota:`)
  console.log(`   Email    : anggota01@arisan.com s/d anggota31@arisan.com`)
  console.log(`   Password : anggota123`)
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
