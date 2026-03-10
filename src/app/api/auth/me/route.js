import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const jar = await cookies()
  const masjidId = jar.get('amilin_masjid_id')?.value
  if (!masjidId) return NextResponse.json({ masjid_id: null }, { status: 401 })
  return NextResponse.json({ masjid_id: masjidId })
}
