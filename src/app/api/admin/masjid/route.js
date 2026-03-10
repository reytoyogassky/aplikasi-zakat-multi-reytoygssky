import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function serverClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// Cek admin secret dari header
function checkAdmin(request) {
  const secret = request.headers.get('x-admin-secret')
  return secret === process.env.ADMIN_SECRET
}

// GET — daftar semua masjid
export async function GET(request) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const db = serverClient()
  const { data, error } = await db
    .from('masjid')
    .select('id, kode, nama_masjid, nama_desa, aktif, created_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — tambah masjid baru
export async function POST(request) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { kode, nama_masjid, nama_desa, secret_key } = await request.json()
    if (!kode?.trim() || !nama_masjid?.trim() || !secret_key?.trim()) {
      return NextResponse.json({ error: 'Kode, nama masjid, dan kunci rahasia wajib diisi' }, { status: 400 })
    }
    const db = serverClient()

    // Cek kode sudah ada
    const { data: existing } = await db.from('masjid').select('id').eq('kode', kode.trim().toLowerCase()).single()
    if (existing) {
      return NextResponse.json({ error: 'Kode masjid sudah digunakan' }, { status: 400 })
    }

    // Insert masjid
    const { data: masjid, error: errMasjid } = await db
      .from('masjid')
      .insert({
        kode: kode.trim().toLowerCase(),
        secret_key: secret_key.trim(),
        nama_masjid: nama_masjid.trim(),
        nama_desa: nama_desa?.trim() || '',
        aktif: true,
      })
      .select()
      .single()

    if (errMasjid) return NextResponse.json({ error: errMasjid.message }, { status: 500 })

    // Insert pengaturan default
    await db.from('pengaturan').insert({
      masjid_id: masjid.id,
      nama_masjid: masjid.nama_masjid,
      nama_desa: masjid.nama_desa,
      tahun: new Date().getFullYear(),
      beras_per_jiwa: 2.5,
      nisab_zakat_uang: 40000,
      nominal_infak_per_jiwa: 5000,
      harga_beras_per_kg: 15000,
    })

    return NextResponse.json({ ok: true, masjid })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH — update status aktif atau reset kunci
export async function PATCH(request) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id, aktif, reset_key } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })

    const db = serverClient()
    const update = {}

    if (typeof aktif === 'boolean') update.aktif = aktif
    if (reset_key) {
      update.secret_key = crypto.randomBytes(24).toString('hex')
    }

    const { data, error } = await db
      .from('masjid')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, masjid: data })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}