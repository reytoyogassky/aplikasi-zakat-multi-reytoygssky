'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { createMasjidClient } from '@/lib/supabase'

const Ctx = createContext(null)

export function MasjidProvider({ children }) {
  const [masjidId, setMasjidId] = useState(null)
  const [db, setDb]             = useState(null)
  const [ready, setReady]       = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.masjid_id) {
          setMasjidId(d.masjid_id)
          setDb(createMasjidClient(d.masjid_id))
        }
        setReady(true)
      })
      .catch(() => setReady(true))
  }, [])

  return <Ctx.Provider value={{ masjidId, db, ready }}>{children}</Ctx.Provider>
}

export function useMasjid() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useMasjid harus di dalam MasjidProvider')
  return ctx
}
