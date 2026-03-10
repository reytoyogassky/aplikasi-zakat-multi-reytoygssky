'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard, Users, Heart, CalendarDays,
  FileBarChart2, Settings, Moon, Sun, Menu, X,
  LogOut, ChevronRight
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const NAV = [
  { href: '/',                    icon: LayoutDashboard, label: 'Dashboard',        short: 'Home' },
  { href: '/muzaki',              icon: Users,           label: 'Data Muzaki',      short: 'Muzaki' },
  { href: '/mustahik',            icon: Heart,           label: 'Data Mustahik',    short: 'Mustahik' },
  { href: '/laporan/harian',      icon: CalendarDays,    label: 'Laporan Harian',   short: 'Harian' },
  { href: '/laporan/keseluruhan', icon: FileBarChart2,   label: 'Lap. Keseluruhan', short: 'Laporan' },
  { href: '/pengaturan',          icon: Settings,        label: 'Pengaturan',       short: 'Setting' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = mounted && theme === 'dark'

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' })
    toast.success('Berhasil keluar')
    router.push('/login')
    router.refresh()
  }

  const NavItem = ({ href, icon: Icon, label, short, onClick }) => {
    const active = pathname === href
    return (
      <Link href={href} onClick={onClick}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
          active
            ? 'bg-primary-600 text-white shadow-emerald'
            : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 hover:text-stone-800 dark:hover:text-stone-200'
        )}
      >
        <Icon className="w-[18px] h-[18px] flex-shrink-0" />
        {!collapsed && <span className="flex-1">{label}</span>}
        {active && !collapsed && <ChevronRight className="w-3.5 h-3.5 opacity-40" />}
      </Link>
    )
  }

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-stone-100 dark:border-[#1e3d2a]">
        <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0 shadow-emerald">
          <span className="text-lg leading-none">🕌</span>
        </div>
        {(!collapsed || mobile) && (
          <div className="min-w-0 flex-1">
            <p className="font-bold text-stone-800 dark:text-stone-100 text-sm leading-tight truncate">Aplikasi Amilin</p>
            <p className="text-[11px] text-stone-400 dark:text-stone-500">Zakat Fitrah Digital</p>
          </div>
        )}
        {!mobile && (
          <button onClick={() => setCollapsed(!collapsed)} className="btn-icon w-7 h-7 hidden lg:flex">
            <Menu className="w-3.5 h-3.5" />
          </button>
        )}
        {mobile && (
          <button onClick={() => setDrawerOpen(false)} className="btn-icon w-7 h-7 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Arabic basmala */}
      {(!collapsed || mobile) && (
        <div className="px-4 py-2.5 text-center">
          <p className="font-arabic text-xs text-primary-600 dark:text-primary-500">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV.map(item => (
          <NavItem key={item.href} {...item} onClick={() => mobile && setDrawerOpen(false)} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-stone-100 dark:border-[#1e3d2a] space-y-0.5">
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
            'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60'
          )}
        >
          {mounted ? (
            isDark ? <Sun className="w-[18px] h-[18px] flex-shrink-0 text-gold-500" />
                   : <Moon className="w-[18px] h-[18px] flex-shrink-0" />
          ) : <Moon className="w-[18px] h-[18px] flex-shrink-0 opacity-0" />}
          {(!collapsed || mobile) && <span className="flex-1">{mounted ? (isDark ? 'Mode Terang' : 'Mode Gelap') : 'Mode Gelap'}</span>}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {(!collapsed || mobile) && <span className="flex-1">Keluar</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col bg-white dark:bg-[#132b1e] border-r border-stone-100 dark:border-[#1e3d2a] transition-all duration-200 flex-shrink-0 shadow-sm',
        collapsed ? 'w-[64px]' : 'w-60'
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile: top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-[60px] flex items-center gap-3 px-4 bg-white dark:bg-[#132b1e] border-b border-stone-100 dark:border-[#1e3d2a]">
        <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center shadow-emerald flex-shrink-0">
          <span className="text-base leading-none">🕌</span>
        </div>
        <p className="font-bold text-stone-800 dark:text-stone-100 text-sm flex-1">Aplikasi Amilin</p>
        <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className="btn-icon w-8 h-8">
          {mounted ? (isDark ? <Sun className="w-4 h-4 text-gold-500" /> : <Moon className="w-4 h-4" />) : null}
        </button>
        <button onClick={() => setDrawerOpen(true)} className="btn-icon w-8 h-8">
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile: bottom nav */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-[#132b1e] border-t border-stone-100 dark:border-[#1e3d2a]">
        <div className="flex">
          {NAV.slice(0,5).map(({ href, icon: Icon, short }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors text-[10px] font-medium',
                active ? 'text-primary-600 dark:text-primary-400' : 'text-stone-400 dark:text-stone-500'
              )}>
                <div className={cn('w-8 h-[22px] flex items-center justify-center rounded-lg',
                  active && 'bg-primary-50 dark:bg-primary-950/50'
                )}>
                  <Icon className="w-[17px] h-[17px]" />
                </div>
                <span>{short}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Mobile: drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="relative w-72 h-full bg-white dark:bg-[#132b1e] flex flex-col shadow-2xl">
            <SidebarContent mobile />
          </aside>
        </div>
      )}
    </>
  )
}
