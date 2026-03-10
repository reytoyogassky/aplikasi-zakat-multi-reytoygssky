'use client'
import { useEffect, useState } from 'react'
import { useMasjid } from '@/hooks/useMasjid'
import { formatRupiah, formatKg, hitungDistribusi } from '@/lib/utils'
import { exportLaporanToPDF, exportMuzakiToPDF, exportLaporanToExcel } from '@/lib/export'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import { FileDown, Printer, Loader2, FileSpreadsheet } from 'lucide-react'
import toast from 'react-hot-toast'

const PIE_COLORS = ['#059669','#2563eb','#d97706','#dc2626']

export default function LaporanKeseluruhanPage() {
  const { db, ready } = useMasjid()
  const [lap, setLap] = useState(null)
  const [har, setHar] = useState([])
  const [pg,  setPg]  = useState(null)
  const [loading, setLoading]   = useState(true)
  const [expPDF, setExpPDF]     = useState(false)
  const [expMuzaki, setExpMuzaki] = useState(false)
  const [expExcel, setExpExcel] = useState(false)

  useEffect(() => {
    if (!db || !ready) return
    Promise.all([
      db.from('v_laporan_keseluruhan').select('*').single(),
      db.from('v_laporan_harian').select('*').order('hari_ke'),
      db.from('pengaturan').select('*').single(),
    ]).then(([{data:l},{data:h},{data:p}]) => {
      setLap(l); setHar(h||[]); setPg(p); setLoading(false)
    })
  }, [db, ready])

  const dist  = lap && pg ? hitungDistribusi(lap, pg) : null
  const harga = pg?.harga_beras_per_kg || 15000
  const pieData = dist ? [
    { name: 'Fakir/Miskin 65%', value: dist.fakir_miskin },
    { name: 'UPZ/Desa 20%',    value: dist.upz_desa },
    { name: 'Sabilillah 10%',  value: dist.sabilillah },
    { name: 'Amilin 5%',       value: dist.amilin },
  ] : []

  const handleExportLaporan = async () => {
    setExpPDF(true)
    const tid = toast.loading('Membuat PDF laporan...')
    try {
      const { data: mz } = await db.from('muzaki').select('*').order('hari_ke').order('created_at')
      if (lap && pg && mz) { await exportLaporanToPDF(lap, mz, pg); toast.success('PDF laporan berhasil!', { id: tid }) }
      else toast.error('Data tidak lengkap', { id: tid })
    } catch(e) { toast.error('Gagal: ' + e.message, { id: tid }) }
    setExpPDF(false)
  }

  const handleExportExcel = async () => {
    setExpExcel(true)
    const tid = toast.loading('Membuat Excel...')
    try {
      const [{ data: mz }, { data: mt }] = await Promise.all([
        db.from('muzaki').select('*').order('hari_ke').order('created_at'),
        db.from('mustahik').select('*').order('created_at'),
      ])
      if (lap && pg) {
        await exportLaporanToExcel(lap, mz || [], mt || [], har, pg)
        toast.success('Excel berhasil diunduh!', { id: tid })
      } else {
        toast.error('Data tidak lengkap', { id: tid })
      }
    } catch(e) { toast.error('Gagal: ' + e.message, { id: tid }) }
    setExpExcel(false)
  }

  const handleExportMuzaki = async () => {
    setExpMuzaki(true)
    const tid = toast.loading('Membuat PDF data muzaki...')
    try {
      const { data: mz } = await db.from('muzaki').select('*').order('hari_ke').order('created_at')
      if (mz && pg) { await exportMuzakiToPDF(mz, pg); toast.success('PDF data muzaki berhasil!', { id: tid }) }
      else toast.error('Data tidak lengkap', { id: tid })
    } catch(e) { toast.error('Gagal: ' + e.message, { id: tid }) }
    setExpMuzaki(false)
  }

  if (!ready || loading) return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div><div className="skeleton h-7 w-52 rounded-lg mb-2"/><div className="skeleton h-4 w-40 rounded"/></div>
        <div className="flex gap-2"><div className="skeleton h-9 w-28 rounded-xl"/><div className="skeleton h-9 w-28 rounded-xl"/></div>
      </div>
      <div className="card p-5"><div className="skeleton h-24 rounded-xl"/></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_,i) => <div key={i} className="card p-4"><div className="skeleton h-4 w-20 rounded mb-2"/><div className="skeleton h-7 w-28 rounded"/></div>)}
      </div>
      <div className="card p-5"><div className="skeleton h-48 rounded-xl"/></div>
      <div className="card p-5"><div className="skeleton h-64 rounded-xl"/></div>
    </div>
  )

  const totalInfak = (lap?.total_infak||0) + (lap?.total_infak_tambahan||0)
  const berasKonversi = (lap?.total_beras||0) * harga

  return (
    <div className="space-y-4 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title">Laporan Keseluruhan</h1>
          <p className="page-sub">{pg?.nama_masjid} · Tahun {pg?.tahun}</p>
        </div>
        <div className="flex gap-2 no-print flex-wrap">
          <button onClick={handleExportExcel} disabled={expExcel} className="btn-outline btn-sm">
            {expExcel ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <FileSpreadsheet className="w-3.5 h-3.5"/>}
            Excel
          </button>
          <button onClick={handleExportMuzaki} disabled={expMuzaki} className="btn-outline btn-sm">
            {expMuzaki ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <FileDown className="w-3.5 h-3.5"/>}
            Data Muzaki
          </button>
          <button onClick={handleExportLaporan} disabled={expPDF} className="btn-gold btn-sm">
            {expPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <FileDown className="w-3.5 h-3.5"/>}
            Laporan PDF
          </button>
          <button onClick={() => window.print()} className="btn-primary btn-sm"><Printer className="w-3.5 h-3.5"/> Cetak</button>
        </div>
      </div>

      {/* Kop Laporan */}
      <div className="card p-5 sm:p-6">
        <div className="text-center pb-4 mb-5 border-b-2 border-primary-600">
          <h2 className="text-lg sm:text-xl font-bold text-stone-800 dark:text-stone-100 tracking-tight">LAPORAN ZAKAT FITRAH</h2>
          <p className="text-stone-600 dark:text-stone-400 font-medium mt-1">{pg?.nama_masjid}</p>
          {pg?.nama_desa && <p className="text-sm text-stone-500">{[pg.nama_desa, pg.nama_kecamatan, pg.nama_kabupaten].filter(Boolean).join(', ')}</p>}
          <p className="text-sm text-gold-600 dark:text-gold-400 font-medium mt-1">Tahun {pg?.tahun} / 1446 H</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {label:'Total KK', value:lap?.total_kk||0, unit:'KK', color:'emerald'},
            {label:'Total Jiwa', value:lap?.total_jiwa||0, unit:'jiwa', color:'emerald'},
            {label:'Bayar Uang', value:lap?.pembayar_uang||0, unit:'KK', color:'blue'},
            {label:'Bayar Beras', value:lap?.pembayar_beras||0, unit:'KK', color:'gold'},
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-3 text-center ${s.color==='emerald'?'bg-primary-50 dark:bg-primary-950/20':s.color==='gold'?'bg-gold-50 dark:bg-gold-950/20':'bg-blue-50 dark:bg-blue-950/20'}`}>
              <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">{s.value}</p>
              <p className="text-xs text-stone-400">{s.unit}</p>
              <p className="text-xs font-medium text-stone-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Penerimaan */}
      <div className="card p-5 sm:p-6">
        <SectionTitle color="emerald">Rekapitulasi Penerimaan</SectionTitle>
        <table className="w-full text-sm mt-4">
          <thead>
            <tr className="bg-stone-50 dark:bg-stone-900/40">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-stone-500 uppercase">Keterangan</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-stone-500 uppercase">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <TR label="Zakat Uang" value={formatRupiah(lap?.total_uang||0)}/>
            <TR label="Zakat Beras" value={formatKg(lap?.total_beras||0)}/>
            <TR label={`Beras dikonversi (@Rp${harga.toLocaleString('id')}/kg)`} value={formatRupiah(berasKonversi)}/>
            <TR label="Infak Wajib" value={formatRupiah(lap?.total_infak||0)} color="blue"/>
            <TR label="Infak Tambahan/Sukarela" value={formatRupiah(lap?.total_infak_tambahan||0)} color="blue"/>
            <TR label="Shodaqoh Uang" value={formatRupiah(lap?.total_sadaqah_uang||0)} color="purple"/>
            <TR label="Shodaqoh Beras" value={formatKg(lap?.total_sadaqah_beras||0)} color="purple"/>
            <TR label="TOTAL KESELURUHAN" value={formatRupiah(dist?.total_keseluruhan||0)} bold/>
          </tbody>
        </table>
      </div>

      {/* Distribusi + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5 sm:p-6">
          <SectionTitle color="gold">Distribusi Zakat Fitrah</SectionTitle>
          <p className="text-xs text-stone-400 mt-1 mb-4">Dihitung dari total zakat — tidak termasuk infak & shodaqoh</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gold-50 dark:bg-gold-950/20">
                <th className="px-4 py-2 text-left text-xs font-semibold text-gold-700 dark:text-gold-400">Kelompok Asnaf</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gold-700 dark:text-gold-400">%</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gold-700 dark:text-gold-400">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <TR3 label="Fakir & Miskin" pct="65%" value={formatRupiah(dist?.fakir_miskin||0)}/>
              <TR3 label="UPZ / Desa" pct="20%" value={formatRupiah(dist?.upz_desa||0)}/>
              <TR3 label="Sabilillah" pct="10%" value={formatRupiah(dist?.sabilillah||0)}/>
              <TR3 label="Amilin" pct="5%" value={formatRupiah(dist?.amilin||0)}/>
              <TR3 label="TOTAL ZAKAT" pct="100%" value={formatRupiah(dist?.total_zakat||0)} bold/>
            </tbody>
          </table>
        </div>

        <div className="card p-5 sm:p-6">
          <SectionTitle color="blue">Distribusi Beras</SectionTitle>
          <table className="w-full text-sm mt-4">
            <thead><tr className="bg-stone-50 dark:bg-stone-900/40">
              <th className="px-4 py-2 text-left text-xs font-semibold text-stone-500">Asnaf</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-stone-500">Beras (kg)</th>
            </tr></thead>
            <tbody>
              {[['Fakir/Miskin','0.65'],['UPZ/Desa','0.20'],['Sabilillah','0.10'],['Amilin','0.05']].map(([lbl,r])=>(
                <tr key={lbl} className="border-t border-stone-100 dark:border-[#1e3d2a]">
                  <td className="px-4 py-2 text-sm text-stone-600 dark:text-stone-400">{lbl}</td>
                  <td className="px-4 py-2 text-right font-medium text-stone-700 dark:text-stone-300">{formatKg((lap?.total_beras||0)*parseFloat(r))}</td>
                </tr>
              ))}
              <tr className="bg-primary-50 dark:bg-primary-950/20 font-bold">
                <td className="px-4 py-2 text-sm text-stone-700 dark:text-stone-300">Total Beras</td>
                <td className="px-4 py-2 text-right font-bold text-primary-600">{formatKg(lap?.total_beras||0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pie + Rekap harian */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <SectionTitle color="emerald">Visualisasi Distribusi Zakat</SectionTitle>
          {(dist?.total_zakat||0) > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={44} outerRadius={72} paddingAngle={2} dataKey="value">
                  {pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i]}/>)}
                </Pie>
                <Tooltip formatter={v=>formatRupiah(Number(v))}/>
                <Legend iconType="circle" iconSize={7} wrapperStyle={{fontSize:'10.5px'}}/>
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[200px] flex items-center justify-center text-stone-400 text-sm">Belum ada data</div>}
        </div>

        <div className="card p-5">
          <SectionTitle color="emerald">Rekap Per Hari</SectionTitle>
          <div className="mt-3 overflow-x-auto">
            <table className="tbl w-full">
              <thead><tr><th>Hari</th><th>KK</th><th>Jiwa</th><th>Uang</th><th>Beras</th></tr></thead>
              <tbody>
                {har.map(h => (
                  <tr key={h.hari_ke}>
                    <td className="font-bold text-primary-600">{h.hari_ke}</td>
                    <td>{h.jumlah_kk}</td><td>{h.jumlah_jiwa}</td>
                    <td className="text-xs">{formatRupiah(h.total_uang)}</td>
                    <td className="text-xs">{formatKg(h.total_beras)}</td>
                  </tr>
                ))}
                {har.length > 0 && (
                  <tr className="bg-primary-50 dark:bg-primary-950/20 font-bold">
                    <td>Total</td>
                    <td>{har.reduce((s,h)=>s+h.jumlah_kk,0)}</td>
                    <td>{har.reduce((s,h)=>s+h.jumlah_jiwa,0)}</td>
                    <td className="text-xs">{formatRupiah(har.reduce((s,h)=>s+h.total_uang,0))}</td>
                    <td className="text-xs">{formatKg(har.reduce((s,h)=>s+h.total_beras,0))}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* TTD */}
      {(pg?.ketua_amilin || pg?.bendahara) && (
        <div className="card p-5 sm:p-6">
          <SectionTitle color="stone">Tanda Tangan</SectionTitle>
          <div className="grid grid-cols-3 text-center text-sm mt-6">
            <Ttd label="Mengetahui," name={pg?.ketua_amilin} title="Ketua Amilin"/>
            <Ttd label="Dibuat oleh," name={pg?.sekretaris} title="Sekretaris"/>
            <Ttd label="Bendahara," name={pg?.bendahara} title="Bendahara"/>
          </div>
        </div>
      )}
    </div>
  )
}

function SectionTitle({ color, children }) {
  const c = { emerald:'bg-primary-600', gold:'bg-gold-500', blue:'bg-blue-500', stone:'bg-stone-400' }
  return (
    <div className="flex items-center gap-2.5">
      <span className={'w-1 h-5 rounded-full flex-shrink-0 '+c[color]}/>
      <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-sm sm:text-base">{children}</h3>
    </div>
  )
}

function TR({ label, value, bold, color }) {
  const tc = color==='purple'?'text-purple-600 dark:text-purple-400':color==='blue'?'text-blue-600 dark:text-blue-400':'text-stone-700 dark:text-stone-300'
  return (
    <tr className={bold?'bg-primary-50 dark:bg-primary-950/20':'border-t border-stone-100 dark:border-[#1e3d2a]'}>
      <td className={'px-4 py-2.5 text-sm '+tc+(bold?' font-bold':'')}>{label}</td>
      <td className={'px-4 py-2.5 text-right text-sm '+tc+(bold?' font-bold':'')}>{value}</td>
    </tr>
  )
}

function TR3({ label, pct, value, bold }) {
  return (
    <tr className={bold?'bg-gold-50 dark:bg-gold-950/20 font-bold':'border-t border-stone-100 dark:border-[#1e3d2a]'}>
      <td className="px-4 py-2.5 text-sm text-stone-700 dark:text-stone-300">{label}</td>
      <td className="px-4 py-2.5 text-center text-sm text-stone-400">{pct}</td>
      <td className="px-4 py-2.5 text-right text-sm text-stone-700 dark:text-stone-300">{value}</td>
    </tr>
  )
}

function Ttd({ label, name, title }) {
  return (
    <div>
      <p className="text-stone-400 text-xs mb-14">{label}</p>
      <div className="border-b-2 border-stone-300 dark:border-stone-600 mx-4 mb-1.5"/>
      <p className="font-bold text-stone-800 dark:text-stone-100 text-sm">{name||'______________________'}</p>
      <p className="text-stone-400 text-xs">{title}</p>
    </div>
  )
}