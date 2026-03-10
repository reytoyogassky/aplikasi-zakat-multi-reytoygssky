import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function serverClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function POST(request) {
  try {
    const { kode, secret } = await request.json()
    if (!kode?.trim() || !secret?.trim()) {
      return NextResponse.json({ error: 'Kode masjid dan kunci wajib diisi' }, { status: 400 })
    }
    const db = serverClient()
    const { data, error } = await db
      .from('masjid')
      .select('id, nama_masjid')
      .eq('kode', kode.trim().toLowerCase())
      .eq('secret_key', secret.trim())
      .eq('aktif', true)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Kode masjid atau kunci salah' }, { status: 401 })
    }

    const res = NextResponse.json({ ok: true, nama_masjid: data.nama_masjid })
    const cookieOpts = { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' }
    res.cookies.set('amilin_masjid_id', data.id, cookieOpts)
    return res
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('amilin_masjid_id')
  return res
}
