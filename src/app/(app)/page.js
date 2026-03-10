'use client'
import { useEffect, useState } from 'react'
import { useMasjid } from '@/hooks/useMasjid'
import { formatRupiah, formatKg, hitungDistribusi } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Users, Wheat, Banknote, Heart, Gift, HandCoins, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const PIE_COLORS = ['#059669','#2563eb','#d97706','#dc2626']

export default function DashboardPage() {
  const { db, ready, masjidId } = useMasjid()
  const [lap, setLap]   = useState(null)
  const [har, setHar]   = useState([])
  const [pg,  setPg]    = useState(null)
  const [mustahikCount, setMustahikCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready || !db || !masjidId) return
    async function load() {
      const [{ data: l }, { data: h }, { data: p }, { count }] = await Promise.all([
        db.from('v_laporan_keseluruhan').select('*').eq('masjid_id', masjidId).single(),
        db.from('v_laporan_harian').select('*').eq('masjid_id', masjidId).order('hari_ke'),
        db.from('pengaturan').select('*').eq('masjid_id', masjidId).single(),
        db.from('mustahik').select('*', { count: 'exact', head: true }).eq('masjid_id', masjidId),
      ])
      setLap(l); setHar(h || []); setPg(p); setMustahikCount(count || 0)
      setLoading(false)
    }
    load()
  }, [db, ready])

  const dist = lap && pg ? hitungDistribusi(lap, pg) : null
  const pieData = dist ? [
    { name: 'Fakir/Miskin 65%', value: dist.fakir_miskin },
    { name: 'UPZ/Desa 20%',    value: dist.upz_desa },
    { name: 'Sabilillah 10%',  value: dist.sabilillah },
    { name: 'Amilin 5%',       value: dist.amilin },
  ] : []

  const harga   = pg?.harga_beras_per_kg || 15000
  const barData = har.map(h => ({
    name: 'H' + h.hari_ke,
    Zakat: Math.round(h.total_uang / 1000),
    Beras: Math.round((h.total_beras * harga) / 1000),
    Shodaqoh: Math.round(((h.total_sadaqah_uang || 0) + (h.total_sadaqah_beras || 0) * harga) / 1000),
  }))

  if (!ready || loading) return (
    <div className="space-y-4">
      <div className="skeleton h-28 rounded-2xl"/>
      <div className="grid grid-cols-2 gap-3">{[...Array(4)].map((_,i)=><div key={i} className="skeleton h-24 rounded-2xl"/>)}</div>
      <div className="grid lg:grid-cols-3 gap-4"><div className="lg:col-span-2 skeleton h-64 rounded-2xl"/><div className="skeleton h-64 rounded-2xl"/></div>
    </div>
  )

  return (
    <div className="space-y-4 animate-in">
      <div className="page-banner rounded-2xl p-5 sm:p-6 relative">
        <div className="relative z-10">
          <p className="text-emerald-200 text-xs font-medium mb-1">Assalamu'alaikum, Amilin 👋</p>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Dashboard Zakat Fitrah</h1>
          <p className="text-emerald-300 text-xs sm:text-sm mt-1">{pg?.nama_masjid || 'Masjid'} · Tahun {pg?.tahun}</p>
          <p className="font-arabic text-emerald-200/70 text-sm mt-2">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</p>
        </div>
        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-6xl sm:text-7xl opacity-10 select-none">🕌</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Users className="w-4 h-4"/>} label="Total Muzaki" value={lap?.total_kk?.toString() || '0'} sub={(lap?.total_jiwa || 0) + ' jiwa'} color="emerald"/>
        <StatCard icon={<Banknote className="w-4 h-4"/>} label="Zakat Uang" value={formatRupiah(lap?.total_uang || 0)} sub={(lap?.pembayar_uang || 0) + ' pembayar'} color="gold"/>
        <StatCard icon={<Wheat className="w-4 h-4"/>} label="Zakat Beras" value={formatKg(lap?.total_beras || 0)} sub={(lap?.pembayar_beras || 0) + ' pembayar'} color="emerald"/>
        <StatCard icon={<Heart className="w-4 h-4"/>} label="Mustahik" value={mustahikCount.toString()} sub="penerima terdaftar" color="red"/>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MiniCard icon={<HandCoins className="w-4 h-4 text-blue-600"/>} label="Total Infak" value={formatRupiah((dist?.total_infak || 0) + (lap?.total_infak_tambahan || 0))} bg="bg-blue-50 dark:bg-blue-950/20"/>
        <MiniCard icon={<Gift className="w-4 h-4 text-purple-600"/>} label="Shodaqoh Uang" value={formatRupiah(lap?.total_sadaqah_uang || 0)} bg="bg-purple-50 dark:bg-purple-950/20"/>
        <MiniCard icon={<Wheat className="w-4 h-4 text-purple-400"/>} label="Shodaqoh Beras" value={formatKg(lap?.total_sadaqah_beras || 0)} bg="bg-purple-50 dark:bg-purple-950/20"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-sm">Penerimaan Per Hari</h3>
            <Link href="/laporan/harian" className="text-xs text-primary-600 dark:text-primary-400 flex items-center gap-0.5 hover:underline">Detail <ChevronRight className="w-3 h-3"/></Link>
          </div>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={barData} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)"/>
                <XAxis dataKey="name" tick={{fontSize:10}}/>
                <YAxis tick={{fontSize:10}} tickFormatter={v=>v+'k'} width={32}/>
                <Tooltip formatter={(v,n)=>['Rp'+v.toLocaleString('id')+'k', n]}/>
                <Bar dataKey="Zakat" fill="#059669" radius={[3,3,0,0]}/>
                <Bar dataKey="Beras" fill="#f59e0b" radius={[3,3,0,0]}/>
                <Bar dataKey="Shodaqoh" fill="#9333ea" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState label="Belum ada data harian"/>}
        </div>
        <div className="card p-4 sm:p-5">
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-sm mb-4">Distribusi Zakat</h3>
          {pieData.length > 0 && (dist?.total_zakat || 0) > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={2} dataKey="value">
                  {pieData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i]}/>)}
                </Pie>
                <Tooltip formatter={v=>formatRupiah(Number(v))}/>
                <Legend iconType="circle" iconSize={7} wrapperStyle={{fontSize:'10px'}}/>
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState label="Belum ada data"/>}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-sm mb-3">Aksi Cepat</h3>
        <div className="grid grid-cols-4 gap-2">
          <QuickLink href="/muzaki"             label="Tambah Muzaki" icon="➕" color="emerald"/>
          <QuickLink href="/mustahik"            label="Mustahik"      icon="🤲" color="gold"/>
          <QuickLink href="/laporan/keseluruhan" label="Laporan"       icon="📊" color="blue"/>
          <QuickLink href="/pengaturan"          label="Pengaturan"    icon="⚙️" color="stone"/>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, color }) {
  const c = { emerald:'bg-primary-50 dark:bg-primary-950/30 text-primary-600', gold:'bg-gold-50 dark:bg-gold-950/20 text-gold-600', red:'bg-red-50 dark:bg-red-950/20 text-red-500' }
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className={'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 '+c[color]}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-stone-400 dark:text-stone-500">{label}</p>
        <p className="text-base font-bold text-stone-800 dark:text-stone-100 truncate leading-snug">{value}</p>
        <p className="text-xs text-stone-400 leading-tight">{sub}</p>
      </div>
    </div>
  )
}
function MiniCard({ icon, label, value, bg }) {
  return (
    <div className={'card p-3 '+bg}>
      <div className="flex items-center gap-1.5 mb-1">{icon}<p className="text-[11px] text-stone-500">{label}</p></div>
      <p className="text-sm font-bold text-stone-700 dark:text-stone-200 truncate">{value}</p>
    </div>
  )
}
function QuickLink({ href, label, icon, color }) {
  const c = { emerald:'bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400', gold:'bg-gold-50 hover:bg-gold-100 dark:bg-gold-950/20 text-gold-700 dark:text-gold-400', blue:'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400', stone:'bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300' }
  return (
    <Link href={href} className={'flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all '+c[color]}>
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] sm:text-xs font-semibold text-center leading-tight">{label}</span>
    </Link>
  )
}
function EmptyState({ label }) {
  return <div className="h-[190px] flex items-center justify-center text-stone-400 text-sm">{label}</div>
}