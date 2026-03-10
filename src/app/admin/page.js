'use client'
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  Building2, Plus, RefreshCw, ToggleLeft, ToggleRight,
  KeyRound, Copy, Eye, EyeOff, Loader2, LogOut,
  CheckCircle2, XCircle, Shield, ChevronDown, ChevronUp,
  Send, Link, MessageCircle
} from 'lucide-react'

// ─── Helper ──────────────────────────────────────────────
function generateKey() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length: 48 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
}
function formatDate(str) {
  return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Main Page ────────────────────────────────────────────
export default function AdminPage() {
  const [adminSecret, setAdminSecret] = useState('')
  const [inputSecret, setInputSecret] = useState('')
  const [showLogin, setShowLogin] = useState(true)
  const [showPass, setShowPass] = useState(false)

  const handleLogin = () => {
    if (!inputSecret.trim()) { toast.error('Masukkan Admin Secret'); return }
    setAdminSecret(inputSecret.trim())
    setShowLogin(false)
  }

  if (showLogin) return <LoginScreen inputSecret={inputSecret} setInputSecret={setInputSecret} showPass={showPass} setShowPass={setShowPass} onLogin={handleLogin} />
  return <AdminDashboard adminSecret={adminSecret} onLogout={() => { setAdminSecret(''); setShowLogin(true); setInputSecret('') }} />
}

// ─── Login Screen ─────────────────────────────────────────
function LoginScreen({ inputSecret, setInputSecret, showPass, setShowPass, onLogin }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-[#0f1f17] p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Admin Panel</h1>
          <p className="text-stone-500 text-sm mt-1">Amilin — Manajemen Masjid</p>
        </div>
        <div className="bg-white dark:bg-[#132b1e] rounded-2xl shadow-sm border border-stone-200 dark:border-[#1e3d2a] p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">ADMIN SECRET</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-[#1e3d2a] bg-stone-50 dark:bg-[#0f1f17] text-stone-800 dark:text-stone-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-12"
                placeholder="Masukkan ADMIN_SECRET..."
                value={inputSecret}
                onChange={e => setInputSecret(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onLogin()}
              />
              <button onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button onClick={onLogin} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" /> Masuk Admin
          </button>
        </div>
        <p className="text-center text-xs text-stone-400 mt-4">Set <code className="bg-stone-100 dark:bg-stone-800 px-1 rounded">ADMIN_SECRET</code> di Vercel Environment Variables</p>
      </div>
    </div>
  )
}

// ─── Admin Dashboard ──────────────────────────────────────
function AdminDashboard({ adminSecret, onLogout }) {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [revealed, setRevealed] = useState({}) // { id: secret_key }

  const apiFetch = useCallback(async (method, body) => {
    const res = await fetch('/api/admin/masjid', {
      method,
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
      body: body ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch {
      if (res.status === 401) throw new Error('Admin Secret salah atau belum di-set di Vercel Environment Variables')
      if (res.status === 404) throw new Error('API route tidak ditemukan — pastikan file route.js sudah ada dan di-deploy')
      throw new Error('Server error ' + res.status)
    }
    if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan')
    return data
  }, [adminSecret])

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch('GET')
      setList(data)
    } catch (e) {
      toast.error(e.message)
    }
    setLoading(false)
  }, [apiFetch])

  useEffect(() => { loadList() }, [loadList])

  const handleToggleAktif = async (m) => {
    try {
      const { masjid } = await apiFetch('PATCH', { id: m.id, aktif: !m.aktif })
      setList(l => l.map(x => x.id === m.id ? { ...x, aktif: masjid.aktif } : x))
      toast.success(masjid.aktif ? `✓ ${m.nama_masjid} diaktifkan` : `${m.nama_masjid} dinonaktifkan`)
    } catch (e) { toast.error(e.message) }
  }

  const handleResetKey = async (m) => {
    if (!confirm(`Reset kunci rahasia untuk ${m.nama_masjid}?\nKunci lama tidak bisa digunakan lagi.`)) return
    try {
      const { masjid } = await apiFetch('PATCH', { id: m.id, reset_key: true })
      setList(l => l.map(x => x.id === m.id ? x : x))
      setRevealed(r => ({ ...r, [m.id]: masjid.secret_key }))
      toast.success('Kunci baru berhasil dibuat — catat sekarang!')
    } catch (e) { toast.error(e.message) }
  }

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} disalin!`)
  }

  const aktif  = list.filter(m => m.aktif).length
  const nonaktif = list.filter(m => !m.aktif).length

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0f1f17]">
      {/* Header */}
      <div className="bg-emerald-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">Admin Panel</h1>
              <p className="text-emerald-200 text-xs">Manajemen Masjid</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadList} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Keluar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total Masjid" value={list.length} icon="🕌" color="emerald" />
          <StatCard label="Aktif" value={aktif} icon="✅" color="green" />
          <StatCard label="Nonaktif" value={nonaktif} icon="⛔" color="red" />
        </div>

        {/* Tambah Masjid */}
        <div className="bg-white dark:bg-[#132b1e] rounded-2xl border border-stone-200 dark:border-[#1e3d2a] overflow-hidden">
          <button
            onClick={() => setShowForm(f => !f)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-50 dark:hover:bg-stone-900/20 transition-colors"
          >
            <div className="flex items-center gap-2 font-semibold text-stone-800 dark:text-stone-100">
              <Plus className="w-4 h-4 text-emerald-600" />
              Tambah Masjid Baru
            </div>
            {showForm ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
          </button>
          {showForm && (
            <div className="border-t border-stone-100 dark:border-[#1e3d2a] p-5">
              <TambahMasjidForm
                apiFetch={apiFetch}
                onSuccess={(masjid) => {
                  loadList()
                  setShowForm(false)
                  setRevealed(r => ({ ...r, [masjid.id]: masjid.secret_key }))
                }}
              />
            </div>
          )}
        </div>

        {/* Daftar Masjid */}
        <div className="space-y-3">
          <h2 className="font-semibold text-stone-700 dark:text-stone-300 text-sm px-1">Daftar Masjid ({list.length})</h2>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-stone-200 dark:bg-stone-800 rounded-2xl animate-pulse"/>)}
            </div>
          ) : list.length === 0 ? (
            <div className="bg-white dark:bg-[#132b1e] rounded-2xl border border-stone-200 dark:border-[#1e3d2a] p-12 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-stone-300" />
              <p className="text-stone-400 text-sm">Belum ada masjid terdaftar</p>
            </div>
          ) : list.map(m => (
            <MasjidCard
              key={m.id}
              masjid={m}
              revealedKey={revealed[m.id]}
              onToggleAktif={() => handleToggleAktif(m)}
              onResetKey={() => handleResetKey(m)}
              onCopy={copyToClipboard}
              appUrl={typeof window !== 'undefined' ? window.location.origin : ''}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Form Tambah Masjid ───────────────────────────────────
function TambahMasjidForm({ apiFetch, onSuccess }) {
  const [form, setForm] = useState({ nama_masjid: '', kode: '', nama_desa: '', secret_key: generateKey() })
  const [saving, setSaving] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleNamaChange = (v) => {
    set('nama_masjid', v)
    set('kode', slugify(v))
  }

  const handleSubmit = async () => {
    if (!form.nama_masjid.trim()) { toast.error('Nama masjid wajib diisi'); return }
    if (!form.kode.trim()) { toast.error('Kode masjid wajib diisi'); return }
    if (!form.secret_key.trim()) { toast.error('Kunci rahasia wajib diisi'); return }
    setSaving(true)
    try {
      const { masjid } = await apiFetch('POST', form)
      toast.success(`✓ ${masjid.nama_masjid} berhasil ditambahkan!`)
      onSuccess({ ...masjid, secret_key: form.secret_key })
    } catch (e) {
      toast.error(e.message)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-stone-500 mb-1">NAMA MASJID *</label>
          <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-[#1e3d2a] bg-stone-50 dark:bg-[#0f1f17] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Masjid Al-Ikhlas" value={form.nama_masjid} onChange={e => handleNamaChange(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-500 mb-1">KODE MASJID *</label>
          <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-[#1e3d2a] bg-stone-50 dark:bg-[#0f1f17] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="masjid-al-ikhlas" value={form.kode} onChange={e => set('kode', slugify(e.target.value))} />
          <p className="text-[11px] text-stone-400 mt-1">Huruf kecil, angka, tanda -</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-500 mb-1">NAMA DESA</label>
          <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-[#1e3d2a] bg-stone-50 dark:bg-[#0f1f17] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Desa Sukamaju" value={form.nama_desa} onChange={e => set('nama_desa', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-stone-500 mb-1">KUNCI RAHASIA *</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-[#1e3d2a] bg-stone-50 dark:bg-[#0f1f17] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
                value={form.secret_key} onChange={e => set('secret_key', e.target.value)}
              />
              <button onClick={() => setShowKey(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button onClick={() => set('secret_key', generateKey())} className="px-3 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 transition-colors whitespace-nowrap">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
      <button onClick={handleSubmit} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {saving ? 'Menyimpan...' : 'Tambah Masjid'}
      </button>
    </div>
  )
}

// ─── Masjid Card ──────────────────────────────────────────
function MasjidCard({ masjid, revealedKey, onToggleAktif, onResetKey, onCopy, appUrl }) {
  const [showActions, setShowActions] = useState(false)
  const [showKirim, setShowKirim]     = useState(false)

  const secretDisplay = revealedKey || '(tersembunyi — reset kunci untuk melihat)'
  const url = appUrl || (typeof window !== 'undefined' ? window.location.origin : '')

  const pesanLengkap = `🕌 *Info Login Aplikasi Amilin*

Assalamu'alaikum,
Berikut data akses Aplikasi Zakat Fitrah Digital untuk *${masjid.nama_masjid}*${masjid.nama_desa ? ` — ${masjid.nama_desa}` : ''}.

🌐 *Link Aplikasi*
${url}

🔑 *Kode Masjid*
${masjid.kode}

🗝️ *Kunci Rahasia*
${revealedKey || '[Minta admin untuk reset kunci]'}

---
_Simpan pesan ini baik-baik. Jangan bagikan kunci rahasia ke orang lain._`

  const handleCopyPesan = () => {
    navigator.clipboard.writeText(pesanLengkap)
    toast.success('Pesan berhasil disalin!')
  }

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(pesanLengkap)
    window.open('https://wa.me/?text=' + encoded, '_blank')
  }

  return (
    <div className={`bg-white dark:bg-[#132b1e] rounded-2xl border transition-all overflow-hidden ${masjid.aktif ? 'border-stone-200 dark:border-[#1e3d2a]' : 'border-red-200 dark:border-red-900/50 opacity-75'}`}>
      <div className="p-4 flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${masjid.aktif ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/20'}`}>
          🕌
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-stone-800 dark:text-stone-100 text-sm leading-tight">{masjid.nama_masjid}</p>
              {masjid.nama_desa && <p className="text-xs text-stone-400 mt-0.5">{masjid.nama_desa}</p>}
            </div>
            <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${masjid.aktif ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400'}`}>
              {masjid.aktif ? 'AKTIF' : 'NONAKTIF'}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg px-2 py-1">
              <span className="text-[11px] font-mono text-stone-600 dark:text-stone-300">{masjid.kode}</span>
              <button onClick={() => onCopy(masjid.kode, 'Kode masjid')} className="text-stone-400 hover:text-emerald-600 ml-0.5">
                <Copy className="w-3 h-3" />
              </button>
            </div>
            <span className="text-[11px] text-stone-400">Dibuat {formatDate(masjid.created_at)}</span>
          </div>
        </div>

        <button onClick={() => setShowActions(a => !a)} className="flex-shrink-0 p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors">
          {showActions ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
        </button>
      </div>

      {/* Revealed new key */}
      {revealedKey && (
        <div className="mx-4 mb-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1.5">⚠️ Kunci Baru — Catat sekarang!</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono text-amber-800 dark:text-amber-300 break-all">{revealedKey}</code>
            <button onClick={() => onCopy(revealedKey, 'Kunci rahasia')} className="flex-shrink-0 p-1.5 bg-amber-200 dark:bg-amber-900/50 rounded-lg">
              <Copy className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            </button>
          </div>
        </div>
      )}

      {/* Panel Kirim ke Klien */}
      {showKirim && (
        <div className="mx-4 mb-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl space-y-3">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">📤 Info Login untuk Dikirim ke Klien</p>

          {/* Info rows */}
          <div className="space-y-2">
            <InfoRow label="Link Aplikasi" value={url} onCopy={() => onCopy(url, 'Link aplikasi')} />
            <InfoRow label="Kode Masjid" value={masjid.kode} onCopy={() => onCopy(masjid.kode, 'Kode masjid')} mono />
            <InfoRow
              label="Kunci Rahasia"
              value={revealedKey || '— reset kunci untuk melihat —'}
              onCopy={revealedKey ? () => onCopy(revealedKey, 'Kunci rahasia') : null}
              mono
              blur={!revealedKey}
            />
          </div>

          {/* Preview pesan */}
          <div>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mb-1.5">Preview Pesan WhatsApp:</p>
            <pre className="text-[11px] text-stone-600 dark:text-stone-300 bg-white dark:bg-[#0f1f17] rounded-lg p-3 whitespace-pre-wrap border border-blue-100 dark:border-blue-900 leading-relaxed font-sans">{pesanLengkap}</pre>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCopyPesan}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              <Copy className="w-3.5 h-3.5" /> Salin Pesan
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#25D366] hover:bg-[#20b558] text-white text-xs font-semibold rounded-xl transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Kirim WhatsApp
            </button>
          </div>

          {!revealedKey && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
              ⚠️ Kunci rahasia tidak ditampilkan. Klik <strong>Reset Kunci</strong> di bawah untuk generate kunci baru yang bisa dikirim.
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="border-t border-stone-100 dark:border-[#1e3d2a] px-4 py-3 flex flex-wrap gap-2">
          <button
            onClick={() => { setShowKirim(k => !k); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${showKirim ? 'bg-blue-600 text-white' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 dark:text-blue-400'}`}>
            <Send className="w-3.5 h-3.5"/> Kirim ke Klien
          </button>
          <button onClick={onToggleAktif}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${masjid.aktif
              ? 'bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 dark:text-emerald-400'}`}>
            {masjid.aktif ? <><ToggleLeft className="w-3.5 h-3.5"/> Nonaktifkan</> : <><ToggleRight className="w-3.5 h-3.5"/> Aktifkan</>}
          </button>
          <button onClick={onResetKey}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 dark:text-amber-400 transition-colors">
            <KeyRound className="w-3.5 h-3.5"/> Reset Kunci
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Info Row ─────────────────────────────────────────────
function InfoRow({ label, value, onCopy, mono, blur }) {
  return (
    <div className="flex items-center justify-between gap-2 bg-white dark:bg-[#0f1f17] rounded-lg px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wide">{label}</p>
        <p className={`text-xs mt-0.5 break-all ${mono ? 'font-mono' : ''} ${blur ? 'text-stone-300 dark:text-stone-600 italic' : 'text-stone-700 dark:text-stone-200'}`}>{value}</p>
      </div>
      {onCopy && (
        <button onClick={onCopy} className="flex-shrink-0 p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-stone-400 hover:text-emerald-600 transition-colors">
          <Copy className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
  const colors = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900',
    green:   'bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900',
    red:     'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900',
  }
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <div className="text-xl mb-1">{icon}</div>
      <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">{value}</p>
      <p className="text-xs text-stone-500 dark:text-stone-400">{label}</p>
    </div>
  )
}