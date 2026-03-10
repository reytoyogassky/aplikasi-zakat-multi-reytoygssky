import { formatRupiah, formatKg, formatTanggal, hitungDistribusi, LABEL_KATEGORI } from './utils'

const EMERALD = [5, 150, 105]
const DARK    = [28, 25, 23]
const MUTED   = [120, 113, 108]
const GOLD    = [180, 83, 9]
const WHITE   = [255, 255, 255]
const LIGHT   = [250, 250, 248]
const LIGHT2  = [236, 253, 245]
const BORDER  = [220, 218, 215]

function header(doc, pg, title) {
  const W = doc.internal.pageSize.getWidth()
  // Green top stripe
  doc.setFillColor(...EMERALD)
  doc.rect(0, 0, W, 3, 'F')
  // Light bg
  doc.setFillColor(246, 252, 249)
  doc.rect(0, 3, W, 42, 'F')
  // Green square icon placeholder
  doc.setFillColor(...EMERALD)
  doc.roundedRect(14, 9, 26, 26, 3, 3, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(13)
  doc.text('ZF', 27, 24, { align: 'center' })
  // Title
  doc.setTextColor(...DARK)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(title || 'LAPORAN ZAKAT FITRAH', 46, 18)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  if (pg.nama_masjid) doc.text(pg.nama_masjid, 46, 24)
  const loc = [pg.nama_desa, pg.nama_kecamatan, pg.nama_kabupaten].filter(Boolean).join(', ')
  if (loc) doc.text(loc, 46, 30)
  doc.text('Tahun ' + (pg.tahun || new Date().getFullYear()) + ' / 1446 H', 46, 36)
  // Divider
  doc.setDrawColor(...EMERALD)
  doc.setLineWidth(0.5)
  doc.line(14, 45, W - 14, 45)
  doc.setTextColor(...DARK)
  return 51
}

function footer(doc, pg) {
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.3)
    doc.line(14, H - 14, W - 14, H - 14)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MUTED)
    doc.text('Aplikasi Amilin · Sistem Zakat Fitrah Digital', 14, H - 8)
    doc.text('Halaman ' + i + ' dari ' + total, W / 2, H - 8, { align: 'center' })
    if (pg.ketua_amilin) doc.text(pg.ketua_amilin + ' — Ketua Amilin', W - 14, H - 8, { align: 'right' })
  }
}

function sectionLabel(doc, y, text) {
  const W = doc.internal.pageSize.getWidth()
  doc.setFillColor(...LIGHT2)
  doc.roundedRect(14, y, W - 28, 7.5, 1, 1, 'F')
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...EMERALD)
  doc.text('■  ' + text.toUpperCase(), 18, y + 5.2)
  return y + 10
}

// ─────────────────────────────────────────────
// EXPORT LAPORAN LENGKAP (Portrait, 2 halaman)
// ─────────────────────────────────────────────
export async function exportLaporanToPDF(laporan, muzakiList, pengaturan) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const distrib = hitungDistribusi(laporan, pengaturan)
  const harga = pengaturan?.harga_beras_per_kg || 15000
  const pg = pengaturan || {}
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()

  // ── Halaman 1: Ringkasan ──
  let y = header(doc, pg, 'LAPORAN ZAKAT FITRAH')

  // Stat boxes
  y = sectionLabel(doc, y, 'Statistik Keseluruhan')
  const stats = [
    { val: (laporan?.total_kk || 0) + ' KK',    lbl: 'Total Keluarga' },
    { val: (laporan?.total_jiwa || 0) + ' jiwa', lbl: 'Total Jiwa' },
    { val: (laporan?.pembayar_uang || 0) + ' KK',  lbl: 'Bayar Uang' },
    { val: (laporan?.pembayar_beras || 0) + ' KK', lbl: 'Bayar Beras' },
  ]
  const colW = (W - 28 - 6) / 4
  stats.forEach(({ val, lbl }, i) => {
    const x = 14 + i * (colW + 2)
    doc.setFillColor(...WHITE)
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, colW, 18, 2, 2, 'FD')
    // Color accent top
    doc.setFillColor(...EMERALD)
    doc.roundedRect(x, y, colW, 3, 2, 2, 'F')
    doc.rect(x, y + 1.5, colW, 1.5, 'F')
    // Value
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...EMERALD)
    doc.text(val.split(' ')[0], x + colW / 2, y + 11, { align: 'center' })
    // Unit suffix
    const suffix = val.split(' ').slice(1).join(' ')
    if (suffix) {
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...MUTED)
      doc.text(suffix, x + colW / 2 + 6, y + 11)
    }
    // Label
    doc.setFontSize(6.5)
    doc.setTextColor(...MUTED)
    doc.text(lbl, x + colW / 2, y + 16, { align: 'center' })
  })
  y += 23

  // Tabel penerimaan
  y = sectionLabel(doc, y, 'Jumlah Penerimaan')
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Keterangan', 'Jumlah']],
    body: [
      ['Zakat Uang', formatRupiah(laporan?.total_uang || 0)],
      ['Zakat Beras', formatKg(laporan?.total_beras || 0)],
      ['Zakat Beras (konversi @Rp ' + harga.toLocaleString('id') + '/kg)', formatRupiah((laporan?.total_beras || 0) * harga)],
      ['Infak Wajib', formatRupiah(laporan?.total_infak || 0)],
      ['Infak Tambahan', formatRupiah(laporan?.total_infak_tambahan || 0)],
      ['Shodaqoh Uang', formatRupiah(laporan?.total_sadaqah_uang || 0)],
      ['Shodaqoh Beras (' + formatKg(laporan?.total_sadaqah_beras || 0) + ')', formatRupiah((laporan?.total_sadaqah_beras || 0) * harga)],
      ['TOTAL KESELURUHAN', formatRupiah(distrib.total_keseluruhan)],
    ],
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 5, right: 5 } },
    headStyles: { fillColor: EMERALD, textColor: WHITE, fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { textColor: DARK, lineColor: BORDER, lineWidth: 0.2 },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: { 0: {}, 1: { halign: 'right', fontStyle: 'bold' } },
    didParseCell: (d) => {
      if (d.row.index === 7 && d.section === 'body') {
        d.cell.styles.fontStyle = 'bold'
        d.cell.styles.fillColor = LIGHT2
        d.cell.styles.textColor = EMERALD
        d.cell.styles.fontSize = 9
      }
    },
  })
  y = doc.lastAutoTable.finalY + 8

  // Distribusi
  y = sectionLabel(doc, y, 'Distribusi Zakat Fitrah')
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Kelompok Asnaf', 'Proporsi', 'Jumlah (Rp)', 'Jumlah Beras']],
    body: [
      ['Fakir & Miskin', '65%', formatRupiah(distrib.fakir_miskin), formatKg((laporan?.total_beras || 0) * 0.65)],
      ['UPZ / Desa',     '20%', formatRupiah(distrib.upz_desa),     formatKg((laporan?.total_beras || 0) * 0.20)],
      ['Sabilillah',     '10%', formatRupiah(distrib.sabilillah),   formatKg((laporan?.total_beras || 0) * 0.10)],
      ['Amilin',          '5%', formatRupiah(distrib.amilin),       formatKg((laporan?.total_beras || 0) * 0.05)],
      ['TOTAL',          '100%', formatRupiah(distrib.total_zakat), formatKg(laporan?.total_beras || 0)],
    ],
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 5, right: 5 } },
    headStyles: { fillColor: GOLD, textColor: WHITE, fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { textColor: DARK, lineColor: BORDER, lineWidth: 0.2 },
    alternateRowStyles: { fillColor: [255, 251, 235] },
    columnStyles: { 0: {}, 1: { halign: 'center' }, 2: { halign: 'right', fontStyle: 'bold' }, 3: { halign: 'right' } },
    didParseCell: (d) => {
      if (d.row.index === 4 && d.section === 'body') {
        d.cell.styles.fontStyle = 'bold'
        d.cell.styles.fillColor = [254, 243, 199]
        d.cell.styles.textColor = GOLD
      }
    },
  })

  // Tanda tangan
  if (pg.ketua_amilin || pg.bendahara) {
    y = doc.lastAutoTable.finalY + 12
    if (y > 230) { doc.addPage(); y = header(doc, pg, 'TANDA TANGAN') }
    y = sectionLabel(doc, y, 'Tanda Tangan Pengurus')
    const signers = [
      { name: pg.ketua_amilin, title: 'Ketua Amilin' },
      { name: pg.sekretaris,   title: 'Sekretaris' },
      { name: pg.bendahara,    title: 'Bendahara' },
    ].filter(s => s.name)
    const cw = (W - 28) / 3
    signers.forEach(({ name, title }, i) => {
      const cx = 14 + i * cw + cw / 2
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...MUTED)
      doc.text(title + ',', cx, y + 5, { align: 'center' })
      doc.setDrawColor(...DARK)
      doc.setLineWidth(0.4)
      doc.line(cx - 28, y + 27, cx + 28, y + 27)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(...DARK)
      doc.text(name, cx, y + 32, { align: 'center' })
    })
  }

  // ── Halaman 2: Daftar Muzaki ──
  doc.addPage()
  let y2 = header(doc, pg, 'DAFTAR MUZAKI')
  y2 = sectionLabel(doc, y2, 'Data Muzaki')

  autoTable(doc, {
    startY: y2,
    margin: { left: 14, right: 14 },
    head: [['No', 'Kepala Keluarga', 'Anggota Keluarga', 'Jiwa', 'Zakat Uang', 'Zakat\nBeras', 'Infak\nWajib', 'Infak\nTambahan', 'Shodaqoh', 'H']],
    body: muzakiList.map((m, i) => {
      const anggota = (m.anggota_keluarga || []).filter(Boolean)
      return [
        i + 1,
        m.nama_kepala_keluarga,
        anggota.length > 0 ? anggota.join('\n') : '-',
        m.jumlah_jiwa,
        m.jumlah_uang > 0 ? formatRupiah(m.jumlah_uang) : '-',
        m.jumlah_beras > 0 ? formatKg(m.jumlah_beras) : '-',
        m.jumlah_infak > 0 ? formatRupiah(m.jumlah_infak) : '-',
        (m.infak_tambahan || 0) > 0 ? formatRupiah(m.infak_tambahan) : '-',
        [
          m.jumlah_sadaqah_uang > 0 ? formatRupiah(m.jumlah_sadaqah_uang) : '',
          m.jumlah_sadaqah_beras > 0 ? formatKg(m.jumlah_sadaqah_beras) : '',
        ].filter(Boolean).join('\n') || '-',
        m.hari_ke || '-',
      ]
    }),
    theme: 'plain',
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      lineColor: BORDER,
      lineWidth: 0.2,
      valign: 'top',
    },
    headStyles: {
      fillColor: EMERALD,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
      valign: 'middle',
      minCellHeight: 12,
    },
    bodyStyles: { textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 38, fontStyle: 'bold' },
      2: { cellWidth: 36, fontSize: 6.5, textColor: MUTED },
      3: { halign: 'center', cellWidth: 9 },
      4: { halign: 'right', cellWidth: 24, fontStyle: 'bold' },
      5: { halign: 'right', cellWidth: 16 },
      6: { halign: 'right', cellWidth: 20 },
      7: { halign: 'right', cellWidth: 18 },
      8: { halign: 'right', cellWidth: 18 },
      9: { halign: 'center', cellWidth: 9 },
    },
  })

  // Total footer bar
  const totY = doc.lastAutoTable.finalY + 4
  const totH = 12
  doc.setFillColor(...LIGHT2)
  doc.setDrawColor(...EMERALD)
  doc.setLineWidth(0.3)
  doc.roundedRect(14, totY, W - 28, totH, 2, 2, 'FD')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...EMERALD)
  const totText = [
    'Total: ' + muzakiList.length + ' KK',
    'Zakat: ' + formatRupiah(muzakiList.reduce((s, m) => s + (m.jumlah_uang || 0), 0)),
    'Beras: ' + formatKg(muzakiList.reduce((s, m) => s + (m.jumlah_beras || 0), 0)),
    'Infak: ' + formatRupiah(muzakiList.reduce((s, m) => s + (m.jumlah_infak || 0) + (m.infak_tambahan || 0), 0)),
  ].join('   |   ')
  doc.text(totText, W / 2, totY + totH / 2 + 2.5, { align: 'center' })

  footer(doc, pg)
  doc.save('laporan-zakat-fitrah-' + (pg.tahun || new Date().getFullYear()) + '.pdf')
}

// ─────────────────────────────────────────────
// EXPORT DAFTAR MUZAKI LENGKAP (Landscape)
// ─────────────────────────────────────────────
export async function exportMuzakiToPDF(muzakiList, pengaturan) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const pg = pengaturan || {}
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()

  let y = header(doc, pg, 'DAFTAR MUZAKI ZAKAT FITRAH')
  y = sectionLabel(doc, y, 'Data Lengkap Muzaki')

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['No', 'Kepala Keluarga', 'Anggota Keluarga', 'Jiwa', 'RT/RW', 'Jenis', 'Zakat Uang', 'Zakat\nBeras', 'Jiwa\nInfak', 'Infak\nWajib', 'Infak\nTambahan', 'Shodaqoh', 'Hari', 'Tanggal']],
    body: muzakiList.map((m, i) => {
      const anggota = (m.anggota_keluarga || []).filter(Boolean)
      return [
        i + 1,
        m.nama_kepala_keluarga,
        anggota.join('\n') || '-',
        m.jumlah_jiwa,
        m.rt && m.rw ? m.rt + '/' + m.rw : '-',
        m.jenis_bayar === 'uang' ? 'Uang' : m.jenis_bayar === 'beras' ? 'Beras' : 'Campuran',
        m.jumlah_uang > 0 ? formatRupiah(m.jumlah_uang) : '-',
        m.jumlah_beras > 0 ? formatKg(m.jumlah_beras) : '-',
        m.jiwa_infak || 0,
        m.jumlah_infak > 0 ? formatRupiah(m.jumlah_infak) : '-',
        (m.infak_tambahan || 0) > 0 ? formatRupiah(m.infak_tambahan) : '-',
        [
          m.jumlah_sadaqah_uang > 0 ? formatRupiah(m.jumlah_sadaqah_uang) : '',
          m.jumlah_sadaqah_beras > 0 ? formatKg(m.jumlah_sadaqah_beras) : '',
        ].filter(Boolean).join('\n') || '-',
        m.hari_ke || '-',
        formatTanggal(m.tanggal_bayar, { day: 'numeric', month: 'short' }),
      ]
    }),
    theme: 'plain',
    styles: {
      fontSize: 7,
      cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      lineColor: BORDER,
      lineWidth: 0.2,
      valign: 'top',
    },
    headStyles: {
      fillColor: EMERALD,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
      valign: 'middle',
      minCellHeight: 12,
    },
    bodyStyles: { textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: {
      0:  { halign: 'center', cellWidth: 8 },
      1:  { cellWidth: 38, fontStyle: 'bold' },
      2:  { cellWidth: 38, fontSize: 6.5, textColor: MUTED },
      3:  { halign: 'center', cellWidth: 9 },
      4:  { halign: 'center', cellWidth: 13 },
      5:  { halign: 'center', cellWidth: 16 },
      6:  { halign: 'right', cellWidth: 24, fontStyle: 'bold' },
      7:  { halign: 'right', cellWidth: 16 },
      8:  { halign: 'center', cellWidth: 11 },
      9:  { halign: 'right', cellWidth: 22 },
      10: { halign: 'right', cellWidth: 22 },
      11: { halign: 'right', cellWidth: 20 },
      12: { halign: 'center', cellWidth: 9 },
      13: { halign: 'center', cellWidth: 18 },
    },
  })

  // Total footer
  const totY2 = doc.lastAutoTable.finalY + 4
  doc.setFillColor(...LIGHT2)
  doc.setDrawColor(...EMERALD)
  doc.setLineWidth(0.3)
  doc.roundedRect(14, totY2, W - 28, 12, 2, 2, 'FD')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...EMERALD)
  const tot2 = [
    'Total: ' + muzakiList.length + ' KK',
    'Zakat Uang: ' + formatRupiah(muzakiList.reduce((s, m) => s + (m.jumlah_uang || 0), 0)),
    'Beras: ' + formatKg(muzakiList.reduce((s, m) => s + (m.jumlah_beras || 0), 0)),
    'Infak: ' + formatRupiah(muzakiList.reduce((s, m) => s + (m.jumlah_infak || 0) + (m.infak_tambahan || 0), 0)),
  ].join('   |   ')
  doc.text(tot2, W / 2, totY2 + 8, { align: 'center' })

  footer(doc, pg)
  doc.save('data-muzaki-' + (pg.tahun || new Date().getFullYear()) + '.pdf')
}

// ─────────────────────────────────────────────
// EXPORT DAFTAR MUSTAHIK (Portrait)
// ─────────────────────────────────────────────
export async function exportMustahikToPDF(mustahikList, pengaturan) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const pg = pengaturan || {}
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()

  let y = header(doc, pg, 'DAFTAR MUSTAHIK ZAKAT FITRAH')
  y = sectionLabel(doc, y, 'Data Penerima Zakat')

  const sudah = mustahikList.filter(m => m.sudah_terima).length
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  doc.text(
    'Total: ' + mustahikList.length + ' orang   |   Sudah terima: ' + sudah + '   |   Belum: ' + (mustahikList.length - sudah),
    14, y + 4
  )
  y += 10

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['No', 'Nama', 'NIK', 'Kategori', 'Alamat / RT-RW', 'Status', 'Terima Uang', 'Terima Beras', 'Tgl Terima']],
    body: mustahikList.map((m, i) => [
      i + 1,
      m.nama,
      m.nik || '-',
      LABEL_KATEGORI[m.kategori] || m.kategori,
      [m.alamat, m.rt && m.rw ? 'RT' + m.rt + '/RW' + m.rw : null].filter(Boolean).join(' — ') || '-',
      m.sudah_terima ? 'Sudah' : 'Belum',
      m.jumlah_terima_uang > 0 ? formatRupiah(m.jumlah_terima_uang) : '-',
      m.jumlah_terima_beras > 0 ? formatKg(m.jumlah_terima_beras) : '-',
      m.tanggal_terima ? formatTanggal(m.tanggal_terima, { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
    ]),
    theme: 'plain',
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 3, bottom: 3, left: 3.5, right: 3.5 },
      lineColor: BORDER,
      lineWidth: 0.2,
    },
    headStyles: { fillColor: EMERALD, textColor: WHITE, fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      2: { cellWidth: 26, fontSize: 6.5 },
      3: { cellWidth: 22 },
      5: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
      6: { halign: 'right', cellWidth: 24 },
      7: { halign: 'right', cellWidth: 20 },
      8: { halign: 'center', cellWidth: 22 },
    },
    didParseCell: (d) => {
      if (d.section === 'body' && d.column.index === 5) {
        d.cell.styles.textColor = d.cell.raw === 'Sudah' ? EMERALD : [185, 28, 28]
      }
    },
  })

  footer(doc, pg)
  doc.save('data-mustahik-' + (pg.tahun || new Date().getFullYear()) + '.pdf')
}