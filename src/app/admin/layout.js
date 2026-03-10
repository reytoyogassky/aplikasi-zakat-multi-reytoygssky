export default function AdminLayout({ children }) {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {children}
    </div>
  )
}