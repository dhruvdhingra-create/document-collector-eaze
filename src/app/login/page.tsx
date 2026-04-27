'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function EazeBrandMark({ width = 160 }: { width?: number }) {
  return <img src="/eaze-logo.png" alt="Eaze" style={{ width, height: 'auto', display: 'block' }} />
}

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        router.push(data.redirect)
      } else {
        setError(data.error || 'Login failed')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ─────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[46%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: '#130D21' }}
      >
        {/* Subtle orange glow */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-10 blur-3xl"
             style={{ background: '#FF9E44', transform: 'translate(-30%, -30%)' }} />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-5 blur-2xl"
             style={{ background: '#6F3DD9', transform: 'translate(30%, 30%)' }} />

        {/* Logo — white variant on dark panel */}
        <div className="relative z-10">
          <EazeBrandMark width={90} />
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <h2 className="font-serif text-4xl font-semibold text-white leading-tight mb-4">
            Document<br />Collection Tool
          </h2>
          <p className="text-white/40 text-sm leading-relaxed max-w-xs">
            Securely collect ID documents from wellness buddies. Create upload links, track submissions, and manage your team.
          </p>

          {/* Decorative feature list */}
          <div className="mt-8 space-y-3">
            {[
              '96-hour secure upload links',
              'Role-based access for OMs & Telecallers',
              'Auto drop-off tracking',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                     style={{ background: 'rgba(255,158,68,0.2)' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF9E44]" />
                </div>
                <span className="text-white/50 text-xs">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/15 text-xs">© {new Date().getFullYear()} Eaze Wellness. Internal use only.</p>
      </div>

      {/* ── Right login panel ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#FAFAFA]">
        <div className="w-full max-w-[380px]">

          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <EazeBrandMark width={65} />
          </div>

          <div className="mb-7">
            <h1 className="font-serif text-3xl font-semibold text-gray-900 leading-tight">Welcome back</h1>
            <p className="text-gray-400 mt-1.5 text-sm">Sign in to your Eaze account</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm mb-5 border"
                 style={{ background: '#FFEAEB', borderColor: '#FFD6D9', color: '#680005' }}>
              <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
              <input
                type="text"
                required
                autoFocus
                className="input-field"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                className="input-field"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary py-3.5 text-base mt-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl text-xs space-y-1 border"
               style={{ background: '#FFF5EC', borderColor: '#FFECDB' }}>
            <p className="font-bold mb-1" style={{ color: '#552A02' }}>Demo credentials</p>
            <p style={{ color: '#552A02' }}>
              Admin: <code className="font-mono font-bold">admin</code> /
              <code className="font-mono font-bold"> password</code>
            </p>
            <p style={{ color: '#552A02' }}>
              Onboarding Manager: <code className="font-mono font-bold">om1</code> /
              <code className="font-mono font-bold"> password</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
