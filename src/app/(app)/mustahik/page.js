'use client'
import { useEffect, useState, useCallback } from 'react'
import { useMasjid } from '@/hooks/useMasjid'
import { formatRupiah, formatKg, formatTanggal, LABEL_KATEGORI, cn } from '@/lib/utils'
import { exportMustahikToPDF } from '@/lib/export'
import toast from 'react-hot-toast'
import { Plus, Search, FileDown, Pencil, Trash2, X, Heart, CheckCircle2, Filter, MapPin, ChevronDown, ChevronUp } from 'lucide-react'

const KATEGORI_LIST = ['fakir','miskin','amilin','mualaf','riqab','gharim','sabilillah','ibnu_sabil']

export default function MustahikPage() {
  const { db, ready, masjidId } = useMasjid()
  const [list, setList]   = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [fKategori, setFKategori] = useState('')
  const [fStatus, setFStatus]   = useState('')
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]   = useState(null)
  const [showFilter, setShowFilter] = useState(false)
  const [expanded, setExpanded] = useState(null)

  const fetchList = useCallback(async () => {
    if (!db || !masjidId) return
    setLoading(true)
    let q = db.from('mustahik').select('*', { count: 'exact' }).eq('masjid_id', masjidId)
    if (search) q = q.ilike('nama', '%' + search + '%')
    if (fKategori) q = q.eq('kategori', fKategori)
    if (fStatus === 'sudah') q = q.eq('sudah_terima', true)
    if (fStatus === 'belum') q = q.eq('sudah_terima', false)
    q = q.order('no_urut', { ascending: true })
    const { data, count } = await q
    setList(data || []); setTotal(count || 0); setLoading(false)
  }, [db, masjidId, search, fKategori, fStatus])

  useEffect(() => { if (ready) fetchList() }, [fetchList, ready])

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus data ini?')) return
    const { error } = await db.from('mustahik').delete().eq('id', id).eq('masjid_id', masjidId)
    if (error) toast.error('Gagal menghapus data')
    else { toast.success('Data berhasil dihapus'); fetchList() }
  }

  const toggleStatus = async (m) => {
    const ns = !m.sudah_terima
    const { error } = await db.from('mustahik').update({
      sudah_terima: ns, tanggal_terima: ns ? new Date().toISOString().split('T')[0] : null
    }).eq('id', m.id).eq('masjid_id', masjidId)
    if (error) toast.error('Gagal mengubah status')
    else toast.success(ns ? '✓ Ditandai sudah menerima' : 'Status direset'); fetchList()
  }

  const handleExport = async () => {
    const toastId = toast.loading('Menyiapkan PDF...')
    const { data: all } = await db.from('mustahik').select('*').eq('masjid_id', masjidId).order('no_urut')
    const { data: pg } = await db.from('pengaturan').select('*').eq('masjid_id', masjidId).single()
    if (all && pg) { await exportMustahikToPDF(all, pg); toast.success('PDF berhasil diekspor!', { id: toastId }) }
    else toast.error('Gagal export', { id: toastId })
  }

  const sudahTerima = list.filter(m => m.sudah_terima).length

  return (
    <div className="space-y-4 animate-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Data Mustahik</h1>
          <p className="page-sub">{total} penerima · {sudahTerima} sudah terima</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-outline btn-sm"><FileDown className="w-3.5 h-3.5"/> Export PDF</button>
          <button onClick={() => setModal('add')} className="btn-primary btn-sm"><Plus className="w-3.5 h-3.5"/> Tambah</button>
        </div>
      </div>

      {/* Progress */}
      <div className="card p-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Progress Penyaluran</span>
          <span className="text-sm font-bold text-primary-600">{total > 0 ? Math.round(sudahTerima/total*100) : 0}%</span>
        </div>
        <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
          <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{width: total > 0 ? (sudahTerima/total*100)+'%' : '0%'}}/>
        </div>
        <p className="text-xs text-stone-400 mt-1.5">{sudahTerima} dari {total} mustahik sudah menerima zakat</p>
      </div>

      {/* Filter */}
      <div className="card p-3 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400"/>
            <input className="input pl-8 py-2 text-sm" placeholder="Cari nama mustahik..." value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <button onClick={() => setShowFilter(!showFilter)} className={cn('w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-colors flex-shrink-0', showFilter ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-600' : 'border-stone-200 dark:border-[#1e3d2a] text-stone-400')}>
            <Filter className="w-4 h-4"/>
          </button>
        </div>
        {showFilter && (
          <div className="grid grid-cols-2 gap-2">
            <select className="select py-2 text-sm" value={fKategori} onChange={e => setFKategori(e.target.value)}>
              <option value="">Semua Kategori</option>
              {KATEGORI_LIST.map(k => <option key={k} value={k}>{LABEL_KATEGORI[k]}</option>)}
            </select>
            <select className="select py-2 text-sm" value={fStatus} onChange={e => setFStatus(e.target.value)}>
              <option value="">Semua Status</option>
              <option value="sudah">Sudah Terima</option>
              <option value="belum">Belum Terima</option>
            </select>
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="card hidden md:block overflow-hidden">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th>No</th><th>Nama</th><th>NIK</th><th>Kategori</th><th>RT/RW</th><th>Status</th><th>Terima Uang</th><th>Terima Beras</th><th>Tgl Terima</th><th></th></tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_,i) => <tr key={i}>{[...Array(10)].map((_,j) => <td key={j}><div className="skeleton h-3.5 rounded"/></td>)}</tr>)
                : list.length === 0
                ? <tr><td colSpan={10} className="py-16 text-center text-stone-400"><Heart className="w-10 h-10 mx-auto mb-2 opacity-20"/>Belum ada data mustahik</td></tr>
                : list.map((m, i) => (
                  <tr key={m.id}>
                    <td className="text-center text-stone-400 text-xs">{i+1}</td>
                    <td className="font-semibold text-stone-800 dark:text-stone-100">{m.nama}</td>
                    <td className="text-xs text-stone-400 font-mono">{m.nik||'-'}</td>
                    <td><span className={cn('badge', m.kategori==='fakir'||m.kategori==='miskin'?'badge-red':m.kategori==='sabilillah'?'badge-blue':'badge-amber')}>{LABEL_KATEGORI[m.kategori]}</span></td>
                    <td className="text-sm">{m.rt&&m.rw?m.rt+'/'+m.rw:'-'}</td>
                    <td>
                      <button onClick={() => toggleStatus(m)} className={cn('badge cursor-pointer hover:opacity-80 transition-opacity', m.sudah_terima ? 'badge-emerald' : 'badge-red')}>
                        {m.sudah_terima ? '✓ Sudah' : '○ Belum'}
                      </button>
                    </td>
                    <td className="text-right">{m.jumlah_terima_uang>0?formatRupiah(m.jumlah_terima_uang):<span className="text-stone-300">—</span>}</td>
                    <td className="text-right">{m.jumlah_terima_beras>0?formatKg(m.jumlah_terima_beras):<span className="text-stone-300">—</span>}</td>
                    <td className="text-xs text-stone-400">{m.tanggal_terima?formatTanggal(m.tanggal_terima,{day:'numeric',month:'short',year:'numeric'}):'-'}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => setModal(m)} className="btn-icon w-7 h-7"><Pencil className="w-3.5 h-3.5 text-primary-600"/></button>
                        <button onClick={() => handleDelete(m.id)} className="btn-icon w-7 h-7"><Trash2 className="w-3.5 h-3.5 text-red-500"/></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {loading ? [...Array(4)].map((_,i) => <div key={i} className="skeleton h-20 rounded-2xl"/>) :
         list.map((m,i) => (
          <div key={m.id} className="card">
            <div className="flex items-center gap-3 p-4">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0', m.sudah_terima ? 'bg-primary-100 dark:bg-primary-950/40 text-primary-600' : 'bg-stone-100 dark:bg-stone-800 text-stone-500')}>
                {m.sudah_terima ? '✓' : i+1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-stone-800 dark:text-stone-100 text-sm truncate">{m.nama}</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  <span className={cn('badge text-[10px]', m.kategori==='fakir'||m.kategori==='miskin'?'badge-red':'badge-amber')}>{LABEL_KATEGORI[m.kategori]}</span>
                  {m.rt&&m.rw&&<span className="text-[10px] text-stone-400 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5"/>RT{m.rt}/RW{m.rw}</span>}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => toggleStatus(m)} className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold transition-all', m.sudah_terima?'bg-primary-100 dark:bg-primary-950/40 text-primary-700':'bg-stone-100 dark:bg-stone-800 text-stone-500')}>
                  {m.sudah_terima ? '✓' : '○'}
                </button>
                <button onClick={() => setModal(m)} className="btn-icon w-8 h-8"><Pencil className="w-3.5 h-3.5 text-primary-600"/></button>
                <button onClick={() => handleDelete(m.id)} className="btn-icon w-8 h-8"><Trash2 className="w-3.5 h-3.5 text-red-500"/></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <MustahikModal data={modal === 'add' ? null : modal} db={db} onClose={() => setModal(null)} onSuccess={() => { fetchList(); setModal(null) }}/>
      )}
    </div>
  )
}

function MustahikModal({ data, db, onClose, onSuccess }) {
  const { masjidId } = useMasjid()
  const isEdit = !!data
  const [form, setForm] = useState({
    nama: data?.nama||'', nik: data?.nik||'', kategori: data?.kategori||'miskin',
    alamat: data?.alamat||'', rt: data?.rt||'', rw: data?.rw||'',
    sudah_terima: data?.sudah_terima||false, tanggal_terima: data?.tanggal_terima||'',
    jumlah_terima_uang: data?.jumlah_terima_uang||0,
    jumlah_terima_beras: data?.jumlah_terima_beras||0,
    keterangan: data?.keterangan||'',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.nama.trim()) { toast.error('Nama mustahik wajib diisi'); return }
    setSaving(true)
    const { error } = isEdit
      ? await db.from('mustahik').update(form).eq('id', data.id)
      : await db.from('mustahik').insert({ ...form, masjid_id: masjidId })
    if (error) toast.error('Gagal menyimpan: ' + error.message)
    else toast.success(isEdit ? 'Data berhasil diperbarui ✓' : 'Mustahik berhasil ditambahkan ✓')
    setSaving(false)
    if (!error) onSuccess()
  }

  return (
    <div className="modal-backdrop" >
      <div className="modal-box">
        <div className="w-10 h-1 bg-stone-200 dark:bg-stone-700 rounded-full mx-auto mt-3 mb-1 sm:hidden"/>
        <div className="modal-header">
          <h2 className="font-bold text-stone-800 dark:text-stone-100">{isEdit?'Edit Mustahik':'Tambah Mustahik'}</h2>
          <button onClick={onClose} className="btn-icon w-8 h-8"><X className="w-4 h-4"/></button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label">Nama Lengkap *</label><input className="input" value={form.nama} onChange={e=>set('nama',e.target.value)} placeholder="Nama..."/></div>
            <div><label className="label">NIK</label><input className="input font-mono text-sm" value={form.nik} onChange={e=>set('nik',e.target.value)} placeholder="3211..."/></div>
            <div><label className="label">Kategori Asnaf *</label>
              <select className="select" value={form.kategori} onChange={e=>set('kategori',e.target.value)}>
                {['fakir','miskin','amilin','mualaf','riqab','gharim','sabilillah','ibnu_sabil'].map(k=><option key={k} value={k}>{LABEL_KATEGORI[k]}</option>)}
              </select>
            </div>
            <div><label className="label">RT</label><input className="input" value={form.rt} onChange={e=>set('rt',e.target.value)} placeholder="001"/></div>
            <div><label className="label">RW</label><input className="input" value={form.rw} onChange={e=>set('rw',e.target.value)} placeholder="002"/></div>
            <div className="col-span-2"><label className="label">Alamat</label><input className="input" value={form.alamat} onChange={e=>set('alamat',e.target.value)} placeholder="Alamat lengkap..."/></div>
            <div><label className="label">Terima Uang (Rp)</label><input type="number" min={0} className="input" value={form.jumlah_terima_uang} onChange={e=>set('jumlah_terima_uang',e.target.value)}/></div>
            <div><label className="label">Terima Beras (kg)</label><input type="number" min={0} step={0.1} className="input" value={form.jumlah_terima_beras} onChange={e=>set('jumlah_terima_beras',e.target.value)}/></div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 cursor-pointer">
                <input type="checkbox" checked={form.sudah_terima} onChange={e=>set('sudah_terima',e.target.checked)} className="w-4 h-4 accent-primary-600 rounded flex-shrink-0"/>
                <CheckCircle2 className="w-4 h-4 text-primary-500 flex-shrink-0"/>
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Sudah menerima zakat</span>
              </label>
              {form.sudah_terima && <input type="date" className="input mt-2" value={form.tanggal_terima} onChange={e=>set('tanggal_terima',e.target.value)}/>}
            </div>
            <div className="col-span-2"><label className="label">Keterangan</label><input className="input" value={form.keterangan} onChange={e=>set('keterangan',e.target.value)} placeholder="Opsional..."/></div>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Batal</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1 justify-center">{saving?'Menyimpan...':isEdit?'Simpan':'Tambah'}</button>
        </div>
      </div>
    </div>
  )
}