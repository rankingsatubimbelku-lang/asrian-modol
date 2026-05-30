export function hitungDenda({
  nominalAngsuran,
  dendaPerHari,
  tanggalJatuhTempo,
  tanggalBayar,
}: {
  nominalAngsuran: number
  dendaPerHari: number
  tanggalJatuhTempo: Date
  tanggalBayar: Date
}): number {
  const jatuhTempo = new Date(tanggalJatuhTempo)
  const bayar = new Date(tanggalBayar)

  if (bayar <= jatuhTempo) return 0

  const selisihMs = bayar.getTime() - jatuhTempo.getTime()
  const hariTerlambat = Math.ceil(selisihMs / (1000 * 60 * 60 * 24))
  const denda = Math.round(nominalAngsuran * (dendaPerHari / 100) * hariTerlambat)

  return denda
}
