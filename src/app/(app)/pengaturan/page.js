'use client'
import { useEffect, useState } from 'react'
import { useMasjid } from '@/hooks/useMasjid'
import toast from 'react-hot-toast'
import { Save, Loader2 } from 'lucide-react'

export default function PengaturanPage() {
  const { db, ready, masjidId } = useMasjid()
  const [form, setForm] = useState({
    tahun: new Date().getFullYear(),
    nama_masjid: '', nama_desa: '', nama_kecamatan: '', nama_kabupaten: '',
    beras_per_jiwa: 2.5,
    nisab_zakat_uang: 40000,
    nominal_infak_per_jiwa: 5000,
    harga_beras_per_kg: 15000,
    ketua_amilin: '', sekretaris: '', bendahara: '',
    tanggal_mulai: '', tanggal_selesai: '',
  })
  const [id, setId]       = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!db || !masjidId) return
    db.from('pengaturan').select('*').eq('masjid_id', masjidId).single().then(({ data }) => {
      if (data) {
        setForm(prev => ({
          ...prev, ...data,
          beras_per_jiwa: data.beras_per_jiwa || 2.5,
          nisab_zakat_uang: data.nisab_zakat_uang || 40000,
          nominal_infak_per_jiwa: data.nominal_infak_per_jiwa || 5000,
          harga_beras_per_kg: data.harga_beras_per_kg || data.harga_beras_per_liter || 15000,
        }))
        setId(data.id)
      }
    })
  }, [db, masjidId])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!db) { toast.error('Koneksi belum siap'); return }
    if (!form.nama_masjid?.trim()) { toast.error('Nama masjid wajib diisi'); return }
    setSaving(true)
    const { error } = id
      ? await db.from('pengaturan').update(form).eq('id', id).eq('masjid_id', masjidId)
      : await db.from('pengaturan').insert({ ...form, masjid_id: masjidId })
    if (error) toast.error('Gagal menyimpan: ' + error.message)
    else toast.success('Pengaturan berhasil disimpan ✓')
    setSaving(false)
  }

  const jiwa4Beras = (4 * (form.beras_per_jiwa || 2.5)).toFixed(2)
  const jiwa4Uang  = (4 * (form.nisab_zakat_uang || 40000)).toLocaleString('id')
  const jiwa4Infak = (4 * (form.nominal_infak_per_jiwa || 5000)).toLocaleString('id')

  return (
    <div className="space-y-5 max-w-xl animate-in">
      <div>
        <h1 className="page-title">Pengaturan</h1>
        <p className="page-sub">Konfigurasi aplikasi zakat fitrah</p>
      </div>

      <div className="card p-5 sm:p-6 space-y-6">

        {/* Identitas */}
        <Section icon="🕌" title="Identitas Masjid / Mushola">
          <div className="space-y-3">
            <F label="Nama Masjid / Mushola *" value={form.nama_masjid||''} onChange={v=>set('nama_masjid',v)} placeholder="Masjid Al-Ikhlas"/>
            <div className="grid grid-cols-2 gap-3">
              <F label="Nama Desa / Kelurahan" value={form.nama_desa||''} onChange={v=>set('nama_desa',v)} placeholder="Desa ..."/>
              <F label="Kecamatan" value={form.nama_kecamatan||''} onChange={v=>set('nama_kecamatan',v)} placeholder="Kec. ..."/>
              <F label="Kabupaten / Kota" value={form.nama_kabupaten||''} onChange={v=>set('nama_kabupaten',v)} placeholder="Kab. ..."/>
              <F label="Tahun" type="number" value={String(form.tahun||'')} onChange={v=>set('tahun', Number(v))} placeholder="2025"/>
            </div>
          </div>
        </Section>

        {/* Konfigurasi Zakat */}
        <Section icon="⚖️" title="Konfigurasi Zakat Fitrah">
          <div className="space-y-3">
            <F label="Beras Wajib per Jiwa (kg)" type="number" step="0.1" value={String(form.beras_per_jiwa||'')} onChange={v=>set('beras_per_jiwa',parseFloat(v)||2.5)}>
              <p className="text-[11px] text-stone-400 mt-1">Standar: <strong>2.5 kg</strong> / jiwa (1 sha' = ±2.5 kg)</p>
            </F>
            <F label="Nilai Uang Zakat per Jiwa (Rp)" type="number" step="1000" value={String(form.nisab_zakat_uang||'')} onChange={v=>set('nisab_zakat_uang',Number(v))}>
              <p className="text-[11px] text-stone-400 mt-1">Setara harga beras 2.5 kg di daerah Anda</p>
            </F>
            <F label="Nominal Infak Wajib per Jiwa (Rp)" type="number" step="500" value={String(form.nominal_infak_per_jiwa||'')} onChange={v=>set('nominal_infak_per_jiwa',Number(v))}>
              <p className="text-[11px] text-stone-400 mt-1">Infak dihitung per jiwa, sama seperti zakat</p>
            </F>
            <F label="Harga Beras per Kg (Rp)" type="number" step="500" value={String(form.harga_beras_per_kg||'')} onChange={v=>set('harga_beras_per_kg',Number(v))}>
              <p className="text-[11px] text-stone-400 mt-1">Digunakan untuk konversi beras → uang pada laporan</p>
            </F>
          </div>

          {/* Preview kalkulator */}
          <div className="mt-4 bg-primary-50 dark:bg-primary-950/20 rounded-xl p-4 border border-primary-100 dark:border-primary-900">
            <p className="text-xs font-semibold text-primary-700 dark:text-primary-400 mb-3">📐 Contoh: 4 Jiwa dalam 1 KK</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-white dark:bg-[#0f1f17] rounded-lg p-2.5 text-center">
                <p className="text-stone-400 mb-1">Zakat Beras</p>
                <p className="font-bold text-gold-600 text-sm">{jiwa4Beras} kg</p>
              </div>
              <div className="bg-white dark:bg-[#0f1f17] rounded-lg p-2.5 text-center">
                <p className="text-stone-400 mb-1">Zakat Uang</p>
                <p className="font-bold text-primary-600 text-sm">Rp{jiwa4Uang}</p>
              </div>
              <div className="bg-white dark:bg-[#0f1f17] rounded-lg p-2.5 text-center">
                <p className="text-stone-400 mb-1">Infak Wajib</p>
                <p className="font-bold text-blue-600 text-sm">Rp{jiwa4Infak}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <F label="Tanggal Mulai" type="date" value={form.tanggal_mulai||''} onChange={v=>set('tanggal_mulai',v)}/>
            <F label="Tanggal Selesai" type="date" value={form.tanggal_selesai||''} onChange={v=>set('tanggal_selesai',v)}/>
          </div>
        </Section>

        {/* Pengurus */}
        <Section icon="👥" title="Pengurus Amilin">
          <div className="space-y-3">
            <F label="Ketua Amilin" value={form.ketua_amilin||''} onChange={v=>set('ketua_amilin',v)} placeholder="Nama ketua..."/>
            <F label="Sekretaris" value={form.sekretaris||''} onChange={v=>set('sekretaris',v)} placeholder="Nama sekretaris..."/>
            <F label="Bendahara" value={form.bendahara||''} onChange={v=>set('bendahara',v)} placeholder="Nama bendahara..."/>
          </div>
        </Section>

        {/* Info distribusi */}
        <div className="bg-stone-50 dark:bg-stone-800/30 rounded-xl p-4 text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
          <p className="font-semibold text-stone-600 dark:text-stone-300 mb-1.5">ℹ️ Distribusi Zakat Fitrah</p>
          <p><strong>Fakir/Miskin 65%</strong> · <strong>UPZ/Desa 20%</strong> · <strong>Sabilillah 10%</strong> · <strong>Amilin 5%</strong></p>
          <p className="mt-1">Infak wajib, infak tambahan, dan shodaqoh dicatat <strong>terpisah</strong> — tidak masuk dalam distribusi zakat.</p>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full justify-center py-3">
          {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </div>
  )
}

function Section({ icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3.5">
        <span className="text-lg leading-none">{icon}</span>
        <h3 className="font-semibold text-stone-700 dark:text-stone-300 text-sm">{title}</h3>
        <div className="flex-1 h-px bg-stone-100 dark:bg-[#1e3d2a]"/>
      </div>
      {children}
    </div>
  )
}

function F({ label, value, onChange, placeholder, type='text', step, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type={type} step={step} className="input" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||''}/>
      {children}
    </div>
  )
}