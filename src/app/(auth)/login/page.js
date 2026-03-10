'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Lock, Eye, EyeOff, Loader2, Building2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [kode,    setKode]    = useState('')
  const [secret,  setSecret]  = useState('')
  const [show,    setShow]    = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!kode.trim())   { toast.error('Masukkan kode masjid');   return }
    if (!secret.trim()) { toast.error('Masukkan kunci rahasia'); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kode: kode.trim(), secret: secret.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Selamat datang, ' + (data.nama_masjid || 'Amilin') + '!')
        router.push('/')
        router.refresh()
      } else {
        toast.error(data.error || 'Kode atau kunci salah')
        setSecret('')
      }
    } catch { toast.error('Gagal terhubung ke server') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] px-4">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4 shadow-emerald">
          <span className="text-3xl">🕌</span>
        </div>
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100 tracking-tight">Aplikasi Amilin</h1>
        <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Sistem Zakat Fitrah Digital</p>
        <p className="font-arabic text-primary-600 dark:text-primary-400 text-base mt-3">
          بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
        </p>
      </div>

      <div className="card w-full max-w-sm p-6">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="font-semibold text-stone-800 dark:text-stone-100">Masuk ke Akun Masjid</h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Hubungi administrator untuk kode akses</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label">Kode Masjid</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                className="input pl-9 font-mono"
                value={kode}
                onChange={e => setKode(e.target.value.toLowerCase().replace(/\s/g, '-'))}
                placeholder="masjid-al-ikhlas"
                autoComplete="username"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Contoh: masjid-al-ikhlas</p>
          </div>

          <div>
            <label className="label">Kunci Rahasia</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                className="input pr-10 font-mono tracking-widest"
                value={secret}
                onChange={e => setSecret(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {loading ? 'Memverifikasi...' : 'Masuk'}
          </button>
        </form>
      </div>

      <p className="text-xs text-stone-400 mt-8 text-center">
        © {new Date().getFullYear()} Aplikasi Amilin · Zakat Fitrah Digital
      </p>
    </div>
  )
}
