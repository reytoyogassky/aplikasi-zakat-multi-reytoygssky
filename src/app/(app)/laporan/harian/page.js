'use client'
import { useEffect, useState } from 'react'
import { useMasjid } from '@/hooks/useMasjid'
import { formatRupiah, formatKg, formatTanggal, getAnggotaDisplay } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { CalendarDays, ChevronDown, ChevronUp, Gift, Users, Wheat, HandCoins } from 'lucide-react'

export default function LaporanHarianPage() {
  const { db, ready, masjidId } = useMasjid()
  const [laporan, setLaporan] = useState([])
  const [detail, setDetail]   = useState({})
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!db || !masjidId) return
    db.from('v_laporan_harian').select('*').eq('masjid_id', masjidId).order('hari_ke').then(({ data }) => {
      setLaporan(data || [])
      setLoading(false)
    })
  }, [db, masjidId])

  const fetchDetail = async (hari) => {
    if (expanded === hari) { setExpanded(null); return }
    if (!detail[hari]) {
      const { data } = await db.from('muzaki').select('*').eq('masjid_id', masjidId).eq('hari_ke', hari).order('created_at')
      setDetail(prev => ({ ...prev, [hari]: data || [] }))
    }
    setExpanded(hari)
  }

  const chartData = laporan.map(h => ({
    name: 'H' + h.hari_ke,
    Zakat: Math.round(h.total_uang / 1000),
    Shodaqoh: Math.round((h.total_sadaqah_uang || 0) / 1000),
  }))

  if (loading) return (
    <div className="space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="skeleton h-28 rounded-2xl"/>)}</div>
  )

  return (
    <div className="space-y-4 animate-in">
      <div>
        <h1 className="page-title">Laporan Harian</h1>
        <p className="page-sub">Rekap penerimaan zakat per hari</p>
      </div>

      {laporan.length > 0 && (
        <div className="card p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4">Grafik Penerimaan (Rp ribu)</h3>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={chartData} margin={{left:-8}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)"/>
              <XAxis dataKey="name" tick={{fontSize:11}}/>
              <YAxis tick={{fontSize:10}} tickFormatter={v=>v+'k'}/>
              <Tooltip formatter={v=>['Rp'+Number(v).toLocaleString('id')+'k']}/>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:'11px'}}/>
              <Bar dataKey="Zakat" fill="#059669" radius={[3,3,0,0]}/>
              <Bar dataKey="Shodaqoh" fill="#9333ea" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="space-y-2">
        {laporan.length === 0 ? (
          <div className="card p-12 text-center text-stone-400">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20"/>
            <p>Belum ada data laporan harian</p>
          </div>
        ) : laporan.map(h => (
          <div key={h.hari_ke} className="card overflow-hidden">
            {/* Header row */}
            <button className="w-full p-4 sm:p-5 flex items-center gap-3 hover:bg-stone-50 dark:hover:bg-stone-900/20 transition-colors" onClick={() => fetchDetail(h.hari_ke)}>
              <div className="w-11 h-11 rounded-xl bg-primary-600 flex flex-col items-center justify-center text-white flex-shrink-0">
                <span className="text-[9px] opacity-70 leading-none">Hari</span>
                <span className="text-lg font-bold leading-tight">{h.hari_ke}</span>
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-semibold text-stone-800 dark:text-stone-100 text-sm">Hari Ke-{h.hari_ke}</p>
                <p className="text-xs text-stone-400">{formatTanggal(h.tanggal_bayar, {day:'numeric',month:'long',year:'numeric'})}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-stone-400"><Users className="w-3 h-3"/>{h.jumlah_kk} KK · {h.jumlah_jiwa} jiwa</span>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-4 flex-shrink-0 mr-2">
                <div className="text-right"><p className="text-[11px] text-stone-400">Uang</p><p className="font-bold text-primary-600 text-sm">{formatRupiah(h.total_uang)}</p></div>
                <div className="text-right"><p className="text-[11px] text-stone-400">Beras</p><p className="font-bold text-gold-600 text-sm">{formatKg(h.total_beras)}</p></div>
                {(h.total_sadaqah_uang||0) > 0 && <div className="text-right"><p className="text-[11px] text-stone-400">Shodaqoh</p><p className="font-bold text-purple-600 text-sm">{formatRupiah(h.total_sadaqah_uang)}</p></div>}
              </div>
              {expanded===h.hari_ke ? <ChevronUp className="w-4 h-4 text-stone-400 flex-shrink-0"/> : <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0"/>}
            </button>

            {/* Mobile stats */}
            <div className="px-4 pb-3 grid grid-cols-3 gap-2 sm:hidden border-t border-stone-100 dark:border-[#1e3d2a]">
              <div className="bg-primary-50 dark:bg-primary-950/20 rounded-xl p-2 text-center">
                <p className="text-[10px] text-stone-400">Uang</p><p className="text-xs font-bold text-primary-600">{formatRupiah(h.total_uang)}</p>
              </div>
              <div className="bg-gold-50 dark:bg-gold-950/20 rounded-xl p-2 text-center">
                <p className="text-[10px] text-stone-400">Beras</p><p className="text-xs font-bold text-gold-600">{formatKg(h.total_beras)}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-2 text-center">
                <p className="text-[10px] text-stone-400">Infak</p><p className="text-xs font-bold text-blue-600">{formatRupiah(h.total_infak||0)}</p>
              </div>
            </div>

            {/* Expanded detail */}
            {expanded === h.hari_ke && (
              <div className="border-t border-stone-100 dark:border-[#1e3d2a]">
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>No</th><th>Kepala Keluarga</th><th>Anggota Keluarga</th>
                        <th className="text-center">Jiwa</th>
                        <th>Zakat Uang</th><th>Zakat Beras</th>
                        <th>Infak Wajib</th><th>Infak Tambahan</th><th>Shodaqoh</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detail[h.hari_ke]||[]).map((m,i) => (
                        <tr key={m.id}>
                          <td className="text-center text-stone-400 text-xs">{i+1}</td>
                          <td className="font-medium text-stone-800 dark:text-stone-100">{m.nama_kepala_keluarga}</td>
                          <td className="text-xs text-stone-500 dark:text-stone-400 max-w-[140px]">
                            {getAnggotaDisplay(m.anggota_keluarga, 3) || <span className="text-stone-300">—</span>}
                          </td>
                          <td className="text-center">{m.jumlah_jiwa}</td>
                          <td>{m.jumlah_uang>0?formatRupiah(m.jumlah_uang):<span className="text-stone-300">—</span>}</td>
                          <td>{m.jumlah_beras>0?formatKg(m.jumlah_beras):<span className="text-stone-300">—</span>}</td>
                          <td>{(m.jumlah_infak||0)>0?<span className="text-blue-600 font-medium">{formatRupiah(m.jumlah_infak)}</span>:<span className="text-stone-300">—</span>}</td>
                          <td>{(m.infak_tambahan||0)>0?<span className="text-blue-400">{formatRupiah(m.infak_tambahan)}</span>:<span className="text-stone-300">—</span>}</td>
                          <td>
                            {(m.jumlah_sadaqah_uang||0)>0&&<p className="text-purple-600 text-xs font-medium">{formatRupiah(m.jumlah_sadaqah_uang)}</p>}
                            {(m.jumlah_sadaqah_beras||0)>0&&<p className="text-purple-400 text-xs">{formatKg(m.jumlah_sadaqah_beras)}</p>}
                            {!(m.jumlah_sadaqah_uang||0)&&!(m.jumlah_sadaqah_beras||0)&&<span className="text-stone-300">—</span>}
                          </td>
                        </tr>
                      ))}
                      {(detail[h.hari_ke]||[]).length===0 && (
                        <tr><td colSpan={9} className="text-center text-stone-400 text-xs py-6">Tidak ada data untuk hari ini</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile detail cards */}
                <div className="sm:hidden p-3 space-y-2">
                  {(detail[h.hari_ke]||[]).map((m,i) => (
                    <div key={m.id} className="bg-stone-50 dark:bg-stone-800/30 rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-stone-800 dark:text-stone-100 text-sm">{m.nama_kepala_keluarga}</p>
                          {m.anggota_keluarga?.length>0 && <p className="text-[11px] text-stone-400 mt-0.5">{m.anggota_keluarga.join(' · ')}</p>}
                        </div>
                        <span className="text-xs text-stone-400 flex-shrink-0">{m.jumlah_jiwa} jiwa</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
                        {m.jumlah_uang>0&&<span className="text-primary-600 font-medium">{formatRupiah(m.jumlah_uang)}</span>}
                        {m.jumlah_beras>0&&<span className="text-gold-600 font-medium">{formatKg(m.jumlah_beras)}</span>}
                        {(m.jumlah_infak||0)>0&&<span className="text-blue-600"><HandCoins className="w-3 h-3 inline mr-0.5"/>{formatRupiah(m.jumlah_infak)}</span>}
                        {(m.jumlah_sadaqah_uang||0)>0&&<span className="text-purple-600"><Gift className="w-3 h-3 inline mr-0.5"/>{formatRupiah(m.jumlah_sadaqah_uang)}</span>}
                      </div>
                    </div>
                  ))}
                  {(detail[h.hari_ke]||[]).length===0 && <p className="text-center text-xs text-stone-400 py-4">Tidak ada data</p>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}