'use client'
import { useEffect, useState, useCallback } from 'react'
import { useMasjid } from '@/hooks/useMasjid'
import { formatRupiah, formatKg, formatTanggal, LABEL_JENIS, cn, getAnggotaDisplay } from '@/lib/utils'
import { exportMuzakiToPDF, exportMuzakiToExcel } from '@/lib/export'
import toast from 'react-hot-toast'
import { Plus, Search, FileDown, Pencil, Trash2, X, Users, ChevronLeft, ChevronRight, Wheat, Banknote, Gift, HandCoins, ChevronDown, ChevronUp, FileSpreadsheet } from 'lucide-react'

const PAGE_SIZE = 15

export default function MuzakiPage() {
  const { db, ready } = useMasjid()
  const [list, setList]       = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [filterHari, setFilterHari] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)
  const [pengaturan, setPengaturan] = useState(null)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { if (db) db.from('pengaturan').select('*').single().then(({ data }) => { if (data) setPengaturan(data) }) }, [db])

  const fetchList = useCallback(async () => {
    if (!db) return
    setLoading(true)
    let q = db.from('muzaki').select('*', { count: 'exact' })
    if (search) q = q.ilike('nama_kepala_keluarga', '%' + search + '%')
    if (filterHari) q = q.eq('hari_ke', +filterHari)
    q = q.order('created_at', { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    const { data, count } = await q
    setList(data || []); setTotal(count || 0); setLoading(false)
  }, [db, search, filterHari, page])

  useEffect(() => { if (ready) fetchList() }, [fetchList, ready])

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus data ini?')) return
    const { error } = await db.from('muzaki').delete().eq('id', id)
    if (error) toast.error('Gagal menghapus data')
    else { toast.success('Data berhasil dihapus'); fetchList() }
  }

  const handleExport = async () => {
    const tid = toast.loading('Menyiapkan PDF...')
    const { data: all } = await db.from('muzaki').select('*').order('hari_ke').order('created_at')
    const { data: pg }  = await db.from('pengaturan').select('*').single()
    if (all && pg) { await exportMuzakiToPDF(all, pg); toast.success('PDF berhasil!', { id: tid }) }
    else toast.error('Gagal export', { id: tid })
  }

  const handleExportExcel = async () => {
    const tid = toast.loading('Membuat Excel...')
    try {
      const { data: all } = await db.from('muzaki').select('*').order('hari_ke').order('created_at')
      const { data: pg }  = await db.from('pengaturan').select('*').single()
      if (all && pg) { await exportMuzakiToExcel(all, pg); toast.success('Excel berhasil!', { id: tid }) }
      else toast.error('Gagal export', { id: tid })
    } catch(e) { toast.error('Gagal: ' + e.message, { id: tid }) }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const sumUang    = list.reduce((s, m) => s + (m.jumlah_uang || 0), 0)
  const sumBeras   = list.reduce((s, m) => s + (m.jumlah_beras || 0), 0)
  const sumInfak   = list.reduce((s, m) => s + (m.jumlah_infak || 0) + (m.infak_tambahan || 0), 0)
  const sumSadaqah = list.reduce((s, m) => s + (m.jumlah_sadaqah_uang || 0), 0)

  if (!ready) return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3"><div className="skeleton h-7 w-36 rounded-lg"/><div className="flex gap-2"><div className="skeleton h-9 w-28 rounded-xl"/><div className="skeleton h-9 w-24 rounded-xl"/></div></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{[...Array(4)].map((_,i)=><div key={i} className="card p-3 flex items-center gap-3"><div className="skeleton w-8 h-8 rounded-xl flex-shrink-0"/><div className="flex-1 space-y-1.5"><div className="skeleton h-3 w-12 rounded"/><div className="skeleton h-5 w-20 rounded"/></div></div>)}</div>
      <div className="card p-3"><div className="skeleton h-10 rounded-xl"/></div>
      <div className="card overflow-hidden"><div className="p-4 space-y-3">{[...Array(5)].map((_,i)=><div key={i} className="skeleton h-10 rounded"/>)}</div></div>
    </div>
  )

  return (
    <div className="space-y-4 animate-in">
      <div className="flex items-start justify-between gap-3">
        <div><h1 className="page-title">Data Muzaki</h1><p className="page-sub">{total} kepala keluarga terdaftar</p></div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={handleExport} className="btn-outline btn-sm"><FileDown className="w-3.5 h-3.5"/> PDF</button>
          <button onClick={handleExportExcel} className="btn-outline btn-sm"><FileSpreadsheet className="w-3.5 h-3.5"/> Excel</button>
          <button onClick={() => setModal('add')} className="btn-primary btn-sm"><Plus className="w-3.5 h-3.5"/> Tambah</button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[{label:'Zakat Uang',value:formatRupiah(sumUang),color:'emerald',icon:<Banknote className="w-4 h-4"/>},{label:'Zakat Beras',value:formatKg(sumBeras),color:'amber',icon:<Wheat className="w-4 h-4"/>},{label:'Total Infak',value:formatRupiah(sumInfak),color:'blue',icon:<HandCoins className="w-4 h-4"/>},{label:'Shodaqoh',value:formatRupiah(sumSadaqah),color:'purple',icon:<Gift className="w-4 h-4"/>}].map(s=>(
          <div key={s.label} className="card p-3 flex items-center gap-3">
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',{emerald:'bg-primary-50 dark:bg-primary-950/30 text-primary-600',amber:'bg-gold-50 dark:bg-gold-950/20 text-gold-600',blue:'bg-blue-50 dark:bg-blue-950/20 text-blue-600',purple:'bg-purple-50 dark:bg-purple-950/20 text-purple-600'}[s.color])}>{s.icon}</div>
            <div className="min-w-0"><p className="text-[11px] text-stone-400">{s.label}</p><p className="text-sm font-bold text-stone-700 dark:text-stone-200 truncate">{s.value}</p></div>
          </div>
        ))}
      </div>
      <div className="card p-3 flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400"/>
          <input className="input pl-8 py-2 text-sm" placeholder="Cari nama kepala keluarga..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}/>
        </div>
        <select className="select w-auto py-2 text-sm" value={filterHari} onChange={e => { setFilterHari(e.target.value); setPage(1) }}>
          <option value="">Semua Hari</option>
          {[1,2,3,4,5,6,7].map(h => <option key={h} value={h}>Hari ke-{h}</option>)}
        </select>
      </div>
      <div className="card hidden md:block overflow-hidden">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>No</th><th>Kepala Keluarga</th><th>Anggota</th><th className="text-center">Jiwa</th><th>Jenis</th><th>Zakat Uang</th><th>Zakat Beras</th><th>Infak</th><th>Shodaqoh</th><th className="text-center">Hari</th><th>Tanggal</th><th></th></tr></thead>
            <tbody>
              {loading ? [...Array(5)].map((_,i)=><tr key={i}>{[...Array(12)].map((_,j)=><td key={j}><div className="skeleton h-3.5 rounded"/></td>)}</tr>)
               : list.length===0 ? <tr><td colSpan={12} className="py-16 text-center text-stone-400"><Users className="w-10 h-10 mx-auto mb-2 opacity-20"/>Belum ada data muzaki</td></tr>
               : list.map((m,i)=>(
                <tr key={m.id}>
                  <td className="text-center text-stone-400 text-xs">{(page-1)*PAGE_SIZE+i+1}</td>
                  <td><p className="font-semibold text-stone-800 dark:text-stone-100 text-sm">{m.nama_kepala_keluarga}</p>{m.no_kk&&<p className="text-[11px] text-stone-400 font-mono">{m.no_kk}</p>}</td>
                  <td><p className="text-xs text-stone-500 max-w-[140px]">{getAnggotaDisplay(m.anggota_keluarga,2)||<span className="text-stone-300">—</span>}</p></td>
                  <td className="text-center text-sm">{m.jumlah_jiwa}</td>
                  <td><span className={cn('badge',m.jenis_bayar==='uang'?'badge-emerald':m.jenis_bayar==='beras'?'badge-amber':'badge-blue')}>{LABEL_JENIS[m.jenis_bayar]}</span></td>
                  <td className="text-right font-medium">{m.jumlah_uang>0?formatRupiah(m.jumlah_uang):<span className="text-stone-300">—</span>}</td>
                  <td className="text-right font-medium">{m.jumlah_beras>0?formatKg(m.jumlah_beras):<span className="text-stone-300">—</span>}</td>
                  <td>{(m.jumlah_infak||0)>0&&<p className="text-xs text-blue-600 font-medium">{formatRupiah(m.jumlah_infak)}</p>}{(m.infak_tambahan||0)>0&&<p className="text-xs text-blue-400">+{formatRupiah(m.infak_tambahan)}</p>}{!(m.jumlah_infak||0)&&!(m.infak_tambahan||0)&&<span className="text-stone-300">—</span>}</td>
                  <td>{(m.jumlah_sadaqah_uang||0)>0&&<p className="text-xs text-purple-600 font-medium">{formatRupiah(m.jumlah_sadaqah_uang)}</p>}{(m.jumlah_sadaqah_beras||0)>0&&<p className="text-xs text-purple-500">{formatKg(m.jumlah_sadaqah_beras)}</p>}{!(m.jumlah_sadaqah_uang||0)&&!(m.jumlah_sadaqah_beras||0)&&<span className="text-stone-300">—</span>}</td>
                  <td className="text-center"><span className="badge badge-stone">H{m.hari_ke||'—'}</span></td>
                  <td className="text-xs text-stone-400 whitespace-nowrap">{formatTanggal(m.tanggal_bayar,{day:'numeric',month:'short'})}</td>
                  <td><div className="flex gap-1"><button onClick={()=>setModal(m)} className="btn-icon btn-sm p-1.5"><Pencil className="w-3.5 h-3.5 text-primary-600"/></button><button onClick={()=>handleDelete(m.id)} className="btn-icon btn-sm p-1.5"><Trash2 className="w-3.5 h-3.5 text-red-500"/></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages>1&&<Pagination page={page} totalPages={totalPages} total={total} onPage={setPage}/>}
      </div>
      <div className="md:hidden space-y-2">
        {loading?[...Array(4)].map((_,i)=><div key={i} className="skeleton h-28 rounded-2xl"/>):list.map((m,i)=>(
          <div key={m.id} className="card overflow-hidden">
            <button className="w-full px-4 py-3 flex items-center gap-3 text-left" onClick={()=>setExpanded(expanded===m.id?null:m.id)}>
              <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">{(page-1)*PAGE_SIZE+i+1}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-stone-800 dark:text-stone-100 text-sm truncate">{m.nama_kepala_keluarga}</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className={cn('badge text-[10px]',m.jenis_bayar==='uang'?'badge-emerald':m.jenis_bayar==='beras'?'badge-amber':'badge-blue')}>{LABEL_JENIS[m.jenis_bayar]}</span>
                  <span className="badge badge-stone text-[10px]">H{m.hari_ke||'—'}</span>
                  <span className="text-[11px] text-stone-400">{m.jumlah_jiwa} jiwa</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={e=>{e.stopPropagation();setModal(m)}} className="btn-icon w-8 h-8"><Pencil className="w-3.5 h-3.5 text-primary-600"/></button>
                <button onClick={e=>{e.stopPropagation();handleDelete(m.id)}} className="btn-icon w-8 h-8"><Trash2 className="w-3.5 h-3.5 text-red-500"/></button>
                {expanded===m.id?<ChevronUp className="w-4 h-4 text-stone-400"/>:<ChevronDown className="w-4 h-4 text-stone-400"/>}
              </div>
            </button>
            {expanded===m.id&&(
              <div className="border-t border-stone-100 dark:border-[#1e3d2a] px-4 py-3 space-y-2">
                {m.anggota_keluarga?.length>0&&<div><p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Anggota</p><p className="text-xs text-stone-600 dark:text-stone-400">{m.anggota_keluarga.join(' · ')}</p></div>}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {m.jumlah_uang>0&&<ValRow icon="💰" label="Zakat Uang" val={formatRupiah(m.jumlah_uang)} color="text-primary-600"/>}
                  {m.jumlah_beras>0&&<ValRow icon="🌾" label="Zakat Beras" val={formatKg(m.jumlah_beras)} color="text-amber-600"/>}
                  {(m.jumlah_infak||0)>0&&<ValRow icon="🤝" label="Infak" val={formatRupiah(m.jumlah_infak)} color="text-blue-600"/>}
                  {(m.jumlah_sadaqah_uang||0)>0&&<ValRow icon="🎁" label="Shodaqoh" val={formatRupiah(m.jumlah_sadaqah_uang)} color="text-purple-600"/>}
                </div>
                <p className="text-[11px] text-stone-400">{formatTanggal(m.tanggal_bayar)}</p>
              </div>
            )}
          </div>
        ))}
        {totalPages>1&&<Pagination page={page} totalPages={totalPages} total={total} onPage={setPage}/>}
      </div>
      {modal&&<MuzakiModal data={modal==='add'?null:modal} pengaturan={pengaturan} db={db} onClose={()=>setModal(null)} onSuccess={()=>{fetchList();setModal(null)}}/>}
    </div>
  )
}

function ValRow({icon,label,val,color}){return(<div className="flex items-center gap-1.5"><span className="text-sm">{icon}</span><div><p className="text-stone-400 text-[10px]">{label}</p><p className={cn('font-semibold text-xs',color)}>{val}</p></div></div>)}
function Pagination({page,totalPages,total,onPage}){return(<div className="flex items-center justify-between px-4 py-3 border-t border-stone-100 dark:border-[#1e3d2a]"><p className="text-xs text-stone-400">Hal. {page}/{totalPages} · {total} data</p><div className="flex gap-1"><button onClick={()=>onPage(p=>p-1)} disabled={page===1} className="btn-icon w-7 h-7 disabled:opacity-30"><ChevronLeft className="w-3.5 h-3.5"/></button>{[...Array(Math.min(totalPages,5))].map((_,i)=><button key={i} onClick={()=>onPage(i+1)} className={cn('w-7 h-7 rounded-lg text-xs font-semibold',page===i+1?'bg-primary-600 text-white':'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800')}>{i+1}</button>)}<button onClick={()=>onPage(p=>p+1)} disabled={page===totalPages} className="btn-icon w-7 h-7 disabled:opacity-30"><ChevronRight className="w-3.5 h-3.5"/></button></div></div>)}
function Divider({children}){return(<div className="divider mt-1"><span>{children}</span></div>)}

function MuzakiModal({data,pengaturan,db,onClose,onSuccess}){
  const { masjidId } = useMasjid()
  const isEdit=!!data; const bp=pengaturan?.beras_per_jiwa||2.5; const up=pengaturan?.nisab_zakat_uang||40000; const ip=pengaturan?.nominal_infak_per_jiwa||5000
  const[form,setForm]=useState({nama_kepala_keluarga:data?.nama_kepala_keluarga||'',no_kk:data?.no_kk||'',rt:data?.rt||(data?'':(pengaturan?.rt_default||'')),rw:data?.rw||(data?'':(pengaturan?.rw_default||'')),jumlah_jiwa:data?.jumlah_jiwa||1,jumlah_sadaqah_uang:data?.jumlah_sadaqah_uang||0,jumlah_sadaqah_beras:data?.jumlah_sadaqah_beras||0,infak_tambahan:data?.infak_tambahan||0,tanggal_bayar:data?.tanggal_bayar||new Date().toISOString().split('T')[0],hari_ke:data?.hari_ke||1,keterangan:data?.keterangan||'',anggota_keluarga:(data?.anggota_keluarga||[]).join('\n')})
  const[jiwaUang,setJiwaUang]=useState(()=>{if(!data)return 1;if(data.jenis_bayar==='beras')return 0;return data.jiwa_uang||(data.jenis_bayar==='uang'?data.jumlah_jiwa:Math.round((data.jumlah_uang||0)/up)||0)})
  const[jiwaBeras,setJiwaBeras]=useState(()=>{if(!data)return 0;return data.jiwa_beras||(data.jenis_bayar==='beras'?data.jumlah_jiwa:Math.round((data.jumlah_beras||0)/bp)||0)})
  const[jiwaInfak,setJiwaInfak]=useState(()=>data?.jiwa_infak||data?.jumlah_jiwa||1)
  const[saving,setSaving]=useState(false)
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))
  const totalJiwa=parseInt(form.jumlah_jiwa)||1; const sisaZakat=totalJiwa-(parseInt(jiwaUang)||0)-(parseInt(jiwaBeras)||0)
  const zakatUang=(parseInt(jiwaUang)||0)*up; const zakatBeras=(parseInt(jiwaBeras)||0)*bp; const infakWajib=(parseInt(jiwaInfak)||0)*ip
  const jenisBayar=(()=>{const u=parseInt(jiwaUang)||0,b=parseInt(jiwaBeras)||0;if(u>0&&b>0)return'keduanya';if(b>0)return'beras';return'uang'})()
  const handleJiwaChange=v=>{setForm(f=>({...f,jumlah_jiwa:v}));const n=parseInt(v)||1;setJiwaUang(n);setJiwaBeras(0);setJiwaInfak(n)}
  const clampU=v=>{if(v===''||v===null){setJiwaUang('');return};const u=Math.max(0,Math.min(parseInt(v)||0,totalJiwa));setJiwaUang(u);setJiwaBeras(prev=>Math.max(0,Math.min(parseInt(prev)||0,totalJiwa-u)))}
  const clampB=v=>{if(v===''||v===null){setJiwaBeras('');return};const b=Math.max(0,Math.min(parseInt(v)||0,totalJiwa));setJiwaBeras(b);setJiwaUang(prev=>Math.max(0,Math.min(parseInt(prev)||0,totalJiwa-b)))}
  const clampI=v=>{if(v===''||v===null){setJiwaInfak('');return};setJiwaInfak(Math.max(0,Math.min(parseInt(v)||0,totalJiwa)))}
  const handleSubmit=async()=>{
    if(!form.nama_kepala_keluarga.trim()){toast.error('Nama wajib diisi');return}
    const u=parseInt(jiwaUang)||0,b=parseInt(jiwaBeras)||0
    if(u+b===0){toast.error('Jiwa pembayar zakat > 0');return}
    if(u+b>totalJiwa){toast.error(`Total jiwa zakat (${u+b}) > jumlah jiwa (${totalJiwa})`);return}
    if(u+b<totalJiwa){toast.error(`Masih ada ${totalJiwa-u-b} jiwa belum ditentukan`);return}
    setSaving(true)
    const payload={...form,masjid_id:masjidId,jumlah_jiwa:totalJiwa,jenis_bayar:jenisBayar,jiwa_uang:u,jiwa_beras:b,jumlah_uang:zakatUang,jumlah_beras:zakatBeras,jiwa_infak:parseInt(jiwaInfak)||0,jumlah_infak:infakWajib,infak_tambahan:Number(form.infak_tambahan)||0,jumlah_sadaqah_uang:Number(form.jumlah_sadaqah_uang)||0,jumlah_sadaqah_beras:Number(form.jumlah_sadaqah_beras)||0,hari_ke:Number(form.hari_ke),anggota_keluarga:form.anggota_keluarga.split('\n').map(s=>s.trim()).filter(Boolean)}
    const{error}=isEdit?await db.from('muzaki').update(payload).eq('id',data.id):await db.from('muzaki').insert(payload)
    if(error)toast.error('Gagal: '+error.message); else toast.success(isEdit?'Data diperbarui ✓':'Muzaki ditambahkan ✓')
    setSaving(false); if(!error)onSuccess()
  }
  return(
    <div className="modal-backdrop"><div className="modal-box">
      <div className="w-10 h-1 bg-stone-200 dark:bg-stone-700 rounded-full mx-auto mt-3 mb-1 sm:hidden"/>
      <div className="modal-header"><h2 className="font-bold text-stone-800 dark:text-stone-100">{isEdit?'Edit Muzaki':'Tambah Muzaki'}</h2><button onClick={onClose} className="btn-icon w-8 h-8"><X className="w-4 h-4"/></button></div>
      <div className="p-5 space-y-5">
        <Divider>Identitas Keluarga</Divider>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label">Nama Kepala Keluarga *</label><input className="input" value={form.nama_kepala_keluarga} onChange={e=>set('nama_kepala_keluarga',e.target.value)} placeholder="Nama lengkap..."/></div>
          <div><label className="label">No. KK</label><input className="input font-mono" value={form.no_kk} onChange={e=>set('no_kk',e.target.value)} placeholder="3211..."/></div>
          <div><label className="label">Jumlah Jiwa *</label><input type="text" inputMode="numeric" pattern="[0-9]*" className="input font-bold text-primary-600 dark:text-primary-400" value={form.jumlah_jiwa} onChange={e=>handleJiwaChange(e.target.value.replace(/[^0-9]/g,""))} onBlur={e=>{const n=parseInt(e.target.value)||1;setForm(f=>({...f,jumlah_jiwa:n}));setJiwaUang(n);setJiwaBeras(0);setJiwaInfak(n)}}/></div>
          <div><label className="label">RT</label><input className="input" value={form.rt} onChange={e=>set('rt',e.target.value)} placeholder="001"/></div>
          <div><label className="label">RW</label><input className="input" value={form.rw} onChange={e=>set('rw',e.target.value)} placeholder="002"/></div>
          <div className="col-span-2"><label className="label">Anggota Keluarga (1 baris = 1 nama)</label><textarea className="input min-h-[72px] resize-none text-sm" value={form.anggota_keluarga} onChange={e=>set('anggota_keluarga',e.target.value)} placeholder={"Anggota 1\nAnggota 2"}/></div>
        </div>
        <Divider>Zakat Fitrah</Divider>
        <div className="bg-primary-50 dark:bg-primary-950/20 rounded-2xl p-4 space-y-3 border border-primary-100 dark:border-primary-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary-600"/><span className="text-sm font-bold text-primary-700 dark:text-primary-400">{totalJiwa} Jiwa</span></div>
            <span className={cn('badge text-xs',sisaZakat===0?'badge-emerald':'bg-amber-100 text-amber-700')}>{sisaZakat===0?'✓ Lengkap':`${sisaZakat} jiwa belum`}</span>
          </div>
          {totalJiwa>0&&<div className="h-2.5 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-700 flex gap-px">{(parseInt(jiwaUang)||0)>0&&<div className="bg-primary-500 transition-all" style={{width:`${((parseInt(jiwaUang)||0)/totalJiwa)*100}%`}}/>}{(parseInt(jiwaBeras)||0)>0&&<div className="bg-gold-500 transition-all" style={{width:`${((parseInt(jiwaBeras)||0)/totalJiwa)*100}%`}}/>}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label flex items-center gap-1"><Banknote className="w-3 h-3 text-primary-600"/>Jiwa Bayar Uang</label><input type="text" inputMode="numeric" pattern="[0-9]*" className="input font-bold text-primary-700 dark:text-primary-400" value={jiwaUang} onChange={e=>clampU(e.target.value.replace(/[^0-9]/g,""))} onBlur={e=>{if(e.target.value==="")clampU("0")}}/><p className="text-[10px] text-stone-400 mt-1">{parseInt(jiwaUang)||0}×Rp{up.toLocaleString('id')} = <strong className="text-primary-600">{formatRupiah(zakatUang)}</strong></p></div>
            <div><label className="label flex items-center gap-1"><Wheat className="w-3 h-3 text-gold-600"/>Jiwa Bayar Beras</label><input type="text" inputMode="numeric" pattern="[0-9]*" className="input font-bold text-gold-700 dark:text-gold-400" value={jiwaBeras} onChange={e=>clampB(e.target.value.replace(/[^0-9]/g,""))} onBlur={e=>{if(e.target.value==="")clampB("0")}}/><p className="text-[10px] text-stone-400 mt-1">{parseInt(jiwaBeras)||0}×{bp}kg = <strong className="text-gold-600">{zakatBeras.toFixed(2)}kg</strong></p></div>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>{setJiwaUang(totalJiwa);setJiwaBeras(0)}} className={cn('flex-1 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all',jiwaUang===totalJiwa&&jiwaBeras===0?'border-primary-500 bg-primary-100 dark:bg-primary-950 text-primary-700':'border-stone-200 dark:border-[#1e3d2a] text-stone-500')}>💰 Semua Uang</button>
            <button onClick={()=>{setJiwaBeras(totalJiwa);setJiwaUang(0)}} className={cn('flex-1 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all',jiwaBeras===totalJiwa&&jiwaUang===0?'border-gold-500 bg-gold-50 dark:bg-gold-950/30 text-gold-700':'border-stone-200 dark:border-[#1e3d2a] text-stone-500')}>🌾 Semua Beras</button>
          </div>
        </div>
        <Divider>Infak Wajib</Divider>
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-2xl p-4 space-y-3 border border-blue-100 dark:border-blue-900">
          <p className="text-xs text-blue-600 font-medium flex items-center gap-1.5"><HandCoins className="w-3.5 h-3.5"/>@Rp{ip.toLocaleString('id')}/jiwa</p>
          <div><label className="label">Jiwa yang Infak</label><input type="text" inputMode="numeric" pattern="[0-9]*" className="input font-bold text-blue-700 dark:text-blue-400" value={jiwaInfak} onChange={e=>clampI(e.target.value.replace(/[^0-9]/g,""))} onBlur={e=>{if(e.target.value==="")clampI("0")}}/><p className="text-[10px] text-stone-400 mt-1">{parseInt(jiwaInfak)||0}×Rp{ip.toLocaleString('id')} = <strong className="text-blue-600">{formatRupiah(infakWajib)}</strong></p></div>
          <div><label className="label">Infak Tambahan (Rp)</label><input type="number" min={0} className="input" value={form.infak_tambahan} onChange={e=>set('infak_tambahan',e.target.value)}/></div>
        </div>
        <Divider>Shodaqoh Tambahan</Divider>
        <div className="bg-purple-50 dark:bg-purple-950/20 rounded-2xl p-4 space-y-3 border border-purple-100 dark:border-purple-900">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Shodaqoh Uang (Rp)</label><input type="number" min={0} className="input" value={form.jumlah_sadaqah_uang} onChange={e=>set('jumlah_sadaqah_uang',e.target.value)}/></div>
            <div><label className="label">Shodaqoh Beras (kg)</label><input type="number" min={0} step={0.1} className="input" value={form.jumlah_sadaqah_beras} onChange={e=>set('jumlah_sadaqah_beras',e.target.value)}/></div>
          </div>
        </div>
        <Divider>Waktu & Keterangan</Divider>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Hari Ke</label><select className="select" value={form.hari_ke} onChange={e=>set('hari_ke',e.target.value)}>{[1,2,3,4,5,6,7].map(h=><option key={h} value={h}>Hari ke-{h}</option>)}</select></div>
          <div><label className="label">Tanggal Bayar</label><input type="date" className="input" value={form.tanggal_bayar} onChange={e=>set('tanggal_bayar',e.target.value)}/></div>
          <div className="col-span-2"><label className="label">Keterangan</label><input className="input" value={form.keterangan} onChange={e=>set('keterangan',e.target.value)} placeholder="Opsional..."/></div>
        </div>
      </div>
      <div className="modal-footer">
        <button onClick={onClose} className="btn-secondary flex-1 justify-center">Batal</button>
        <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1 justify-center">{saving?'Menyimpan...':isEdit?'Simpan Perubahan':'Tambah Muzaki'}</button>
      </div>
    </div></div>
  )
}