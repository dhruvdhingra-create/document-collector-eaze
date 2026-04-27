'use client'

import { useRouter, usePathname } from 'next/navigation'
import { FileText, LogOut, Users } from 'lucide-react'

type Props = {
  children: React.ReactNode
  title: string
  role: 'ADMIN' | 'OM'
}

export default function DashboardLayout({ children, title, role }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const roleLabel = role === 'ADMIN' ? 'Admin' : 'Onboarding Manager'
  const basePath = role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/om'

  const navItems = [
    { label: 'Requests', icon: FileText, href: basePath },
    ...(role === 'ADMIN' ? [{ label: 'Manage Team', icon: Users, href: `${basePath}/users` }] : []),
  ]

  return (
    <div className="flex h-screen bg-[#FAFAFA] overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-[220px] flex-shrink-0 flex flex-col" style={{ background: '#130D21' }}>

        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <img src="/eaze-logo.png" alt="Eaze" style={{ width: 90, height: 'auto', display: 'block' }} />
        </div>

        <div className="mx-4 border-t border-white/5 mb-3" />

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          <p className="text-white/25 text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-2">Main</p>
          {navItems.map(({ label, icon: Icon, href }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={isActive
                  ? { background: 'rgba(255,158,68,0.12)', color: '#FF9E44' }
                  : { color: 'rgba(255,255,255,0.45)' }}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            )
          })}
        </nav>

        {/* Footer — role + logout */}
        <div className="px-3 pb-5">
          <div className="mx-1 border-t border-white/5 mb-3" />

          <div className="px-3 py-2.5 rounded-xl mb-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p className="text-white/50 text-[10px] font-medium uppercase tracking-widest mb-0.5">Signed in as</p>
            <p className="text-white text-sm font-semibold">{roleLabel}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: 'rgba(111,61,217,0.25)', color: '#C2A5FD' }}>
              {role}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,26,35,0.12)'; e.currentTarget.style.color = '#FF9499' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-sm font-bold text-[#552A02]">{title}</h1>
          <span className="text-xs text-gray-400">Eaze Document Collection</span>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
