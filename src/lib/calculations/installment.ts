export interface InstallmentRow {
  ke: number
  tanggalJatuhTempo: Date
  nominalPokok: number
  nominalBunga: number
  totalCicilan: number
  sisaPokok: number
}

interface GenerateParams {
  nominalPinjaman: number
  tenor: number
  bungaPerTahun: number
  metode: "FLAT" | "EFEKTIF"
  tanggalMulai: Date
}

export function generateJadwalAngsuran({
  nominalPinjaman, tenor, bungaPerTahun, metode, tanggalMulai,
}: GenerateParams): InstallmentRow[] {
  const bungaPerBulan = bungaPerTahun / 100 / 12
  const rows: InstallmentRow[] = []

  if (metode === "FLAT") {
    const totalBunga = nominalPinjaman * (bungaPerTahun / 100) * (tenor / 12)
    const cicilanPokok = Math.round(nominalPinjaman / tenor)
    const cicilanBunga = Math.round(totalBunga / tenor)

    for (let i = 1; i <= tenor; i++) {
      const jatuhTempo = new Date(tanggalMulai)
      jatuhTempo.setMonth(jatuhTempo.getMonth() + i)

      rows.push({
        ke: i,
        tanggalJatuhTempo: jatuhTempo,
        nominalPokok: cicilanPokok,
        nominalBunga: cicilanBunga,
        totalCicilan: cicilanPokok + cicilanBunga,
        sisaPokok: Math.max(0, nominalPinjaman - cicilanPokok * i),
      })
    }
  } else {
    // Efektif / Annuitas
    const r = bungaPerBulan
    const cicilanTetap =
      r === 0
        ? nominalPinjaman / tenor
        : Math.round((nominalPinjaman * r * Math.pow(1 + r, tenor)) / (Math.pow(1 + r, tenor) - 1))

    let sisaPokok = nominalPinjaman

    for (let i = 1; i <= tenor; i++) {
      const jatuhTempo = new Date(tanggalMulai)
      jatuhTempo.setMonth(jatuhTempo.getMonth() + i)

      const bunga = Math.round(sisaPokok * r)
      const pokok = Math.round(cicilanTetap - bunga)
      sisaPokok = Math.max(0, sisaPokok - pokok)

      rows.push({
        ke: i,
        tanggalJatuhTempo: jatuhTempo,
        nominalPokok: pokok,
        nominalBunga: bunga,
        totalCicilan: pokok + bunga,
        sisaPokok,
      })
    }
  }

  return rows
}

export function hitungTotalPinjaman(rows: InstallmentRow[]) {
  return rows.reduce((acc, r) => ({
    totalPokok: acc.totalPokok + r.nominalPokok,
    totalBunga: acc.totalBunga + r.nominalBunga,
    totalCicilan: acc.totalCicilan + r.totalCicilan,
  }), { totalPokok: 0, totalBunga: 0, totalCicilan: 0 })
}

/**
 * Hitung bunga untuk SATU bulan pembayaran pada sistem saldo berjalan (running balance).
 * Bunga tetap mengikuti metode (FLAT/EFEKTIF) yang disepakati saat pengajuan,
 * tapi jumlah angsuran/bulan TIDAK perlu ditentukan di awal — fleksibel sampai pokok lunas.
 *
 * - FLAT   : bunga dihitung dari nominal pinjaman AWAL (tetap tiap bulan)
 * - EFEKTIF: bunga dihitung dari SISA POKOK saat ini (menurun setiap bulan)
 */
export function hitungBungaBulanan({
  metode, persentasePerTahun, nominalPinjamanAwal, sisaPokok,
}: {
  metode: "FLAT" | "EFEKTIF"
  persentasePerTahun: number
  nominalPinjamanAwal: number
  sisaPokok: number
}): number {
  const bungaPerBulan = persentasePerTahun / 100 / 12
  const basis = metode === "FLAT" ? nominalPinjamanAwal : sisaPokok
  return Math.round(basis * bungaPerBulan)
}

/**
 * Pecah satu pembayaran bulanan menjadi komponen bunga (fixed sesuai metode) & pokok.
 * Jika nominal bayar < bunga bulan ini, seluruh nominal dianggap bunga & pokok = 0.
 * Pokok tidak akan pernah melebihi sisaPokok (otomatis capped saat pelunasan).
 */
export function pecahPembayaranBulanan({
  nominalBayar, metode, persentasePerTahun, nominalPinjamanAwal, sisaPokok,
}: {
  nominalBayar: number
  metode: "FLAT" | "EFEKTIF"
  persentasePerTahun: number
  nominalPinjamanAwal: number
  sisaPokok: number
}) {
  const bunga = Math.min(
    hitungBungaBulanan({ metode, persentasePerTahun, nominalPinjamanAwal, sisaPokok }),
    nominalBayar
  )
  const pokok = Math.min(nominalBayar - bunga, sisaPokok)
  const sisaPokokBaru = Math.max(0, sisaPokok - pokok)
  return { bunga, pokok, sisaPokokBaru }
}
