#!/usr/bin/env node
/**
 * ADMIN TOOL: Tambah Masjid Baru
 * Cara pakai:
 *   npm run tambah-masjid
 *   node scripts/tambah-masjid.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { randomBytes }  from 'crypto'
import { readFileSync }  from 'fs'
import { resolve }       from 'path'
import readline          from 'readline'

try {
  const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  env.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=')
    if (key?.trim() && vals.length) process.env[key.trim()] = vals.join('=').trim()
  })
} catch { console.log('⚠️  Menggunakan env yang sudah ada') }

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function generateKey(n=28) { return randomBytes(n).toString('hex').slice(0,n) }
function slugify(str) { return str.toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').trim() }
async function tanya(rl, q, def) {
  return new Promise(r => rl.question(def?`${q} [${def}]: `:`${q}: `, a => r(a.trim()||def||'')))
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  console.log('\n🕌  TAMBAH MASJID BARU — Aplikasi Amilin\n' + '─'.repeat(42))
  const nama  = await tanya(rl, 'Nama Masjid')
  const desa  = await tanya(rl, 'Nama Desa/Kelurahan')
  const kec   = await tanya(rl, 'Kecamatan (opsional)', '')
  const kab   = await tanya(rl, 'Kabupaten/Kota (opsional)', '')
  const kode  = await tanya(rl, 'Kode unik (slug)', slugify(nama))
  const keyIn = await tanya(rl, 'Kunci rahasia [Enter=auto]', '')
  const secretKey = keyIn || generateKey()
  const tahun = parseInt(await tanya(rl, 'Tahun', String(new Date().getFullYear())))
  rl.close()

  console.log('\n📋 Ringkasan:')
  console.log('  Nama    :', nama)
  console.log('  Desa    :', desa)
  console.log('  Kode    :', kode)
  console.log('  Key     :', secretKey)
  console.log()

  const { data: m, error: e1 } = await db.from('masjid')
    .insert({ kode, secret_key: secretKey, nama_masjid: nama, nama_desa: desa })
    .select('id').single()

  if (e1) {
    console.error('❌', e1.code==='23505' ? 'Kode sudah ada. Pilih kode lain.' : e1.message)
    process.exit(1)
  }

  await db.from('pengaturan').insert({
    masjid_id: m.id, tahun, nama_masjid: nama, nama_desa: desa,
    nama_kecamatan: kec||null, nama_kabupaten: kab||null,
    beras_per_jiwa: 2.5, nisab_zakat_uang: 40000,
    harga_beras_per_kg: 15000, nominal_infak_per_jiwa: 5000,
  })

  console.log('✅ Berhasil!\n' + '─'.repeat(42))
  console.log('📤 Kirim ke pengurus masjid:\n')
  console.log('  🏷️  KODE MASJID  :', kode)
  console.log('  🔑  KUNCI RAHASIA:', secretKey)
  console.log('  🌐  URL Aplikasi :', process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com')
  console.log('\n⚠️  SIMPAN KUNCI INI — tidak bisa dipulihkan!')
  console.log('─'.repeat(42))
}

main().catch(e => { console.error('Error:', e.message); process.exit(1) })
