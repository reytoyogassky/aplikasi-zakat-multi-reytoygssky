import Sidebar from '@/components/layout/Sidebar'
import { MasjidProvider } from '@/hooks/useMasjid'

export default function AppLayout({ children }) {
  return (
    <MasjidProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-5 lg:p-6 pt-[72px] pb-[80px] lg:pt-6 lg:pb-6 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </MasjidProvider>
  )
}
