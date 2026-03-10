import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata = {
  title: 'Aplikasi Amilin — Zakat Fitrah',
  description: 'Sistem pengelolaan zakat fitrah digital',
}
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 1 }

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3500,
              style: {
                borderRadius: '12px', fontSize: '13px', fontWeight: 500, maxWidth: '360px',
                background: 'var(--card)', color: 'var(--text)',
                border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              },
              success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
