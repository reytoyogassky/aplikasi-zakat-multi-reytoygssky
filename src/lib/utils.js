import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) { return twMerge(clsx(inputs)) }

export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(amount || 0)
}

export function formatKg(amount) {
  const n = Number(amount) || 0
  return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)} kg`
}

export function formatTanggal(date, opts) {
  if (!date) return '-'
  return new Intl.DateTimeFormat('id-ID', opts || {
    day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date(date))
}

export function hitungZakatWajib(jiwaUang, jiwaBeras, pengaturan) {
  const bp = pengaturan?.beras_per_jiwa || 2.5
  const up = pengaturan?.nisab_zakat_uang || 40000
  return { uang: jiwaUang * up, beras: jiwaBeras * bp }
}

export function hitungInfakWajib(jiwaInfak, pengaturan) {
  return jiwaInfak * (pengaturan?.nominal_infak_per_jiwa || 5000)
}

export function hitungDistribusi(laporan, pengaturan) {
  const harga = pengaturan?.harga_beras_per_kg || pengaturan?.harga_beras_per_liter || 15000
  const berasUang = (laporan.total_beras || 0) * harga
  const berasSadaqahUang = (laporan.total_sadaqah_beras || 0) * harga
  const totalZakat = (laporan.total_uang || 0) + berasUang
  const totalSadaqah = (laporan.total_sadaqah_uang || 0) + berasSadaqahUang
  const totalInfak = (laporan.total_infak || 0)
  const totalKeseluruhan = totalZakat + totalSadaqah + totalInfak
  return {
    total_zakat: totalZakat,
    total_sadaqah: totalSadaqah,
    total_infak: totalInfak,
    total_keseluruhan: totalKeseluruhan,
    fakir_miskin: Math.round(totalZakat * 0.65),
    sabilillah:   Math.round(totalZakat * 0.10),
    amilin:       Math.round(totalZakat * 0.05),
    upz_desa:     Math.round(totalZakat * 0.20),
  }
}

export function getAnggotaDisplay(anggota, max = 3) {
  if (!anggota || anggota.length === 0) return ''
  const shown = anggota.slice(0, max).join(', ')
  const rest = anggota.length - max
  return rest > 0 ? `${shown} +${rest} lainnya` : shown
}

export const LABEL_KATEGORI = {
  fakir: 'Fakir', miskin: 'Miskin', amilin: 'Amilin', mualaf: 'Mualaf',
  riqab: 'Riqab', gharim: 'Gharim', sabilillah: 'Sabilillah', ibnu_sabil: 'Ibnu Sabil',
}
export const LABEL_JENIS = { uang: 'Uang', beras: 'Beras', keduanya: 'Uang & Beras' }
