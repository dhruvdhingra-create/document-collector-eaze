'use client'

import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Plus, User, X } from 'lucide-react'
import { format } from 'date-fns'

type OMUser = { id: string; username: string; createdAt: string }

export default function ManageTeamPage() {
  const [oms, setOms] = useState<OMUser[]>([])
  const [showForm, setShowForm] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchOms = useCallback(async () => {
    const res = await fetch('/api/users')
    const data = await res.json()
    if (data.success) setOms(data.data)
  }, [])

  useEffect(() => { fetchOms() }, [fetchOms])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(`Account created for @${data.data.username}`)
        setUsername('')
        setPassword('')
        setShowForm(false)
        fetchOms()
        setTimeout(() => setSuccess(''), 4000)
      } else {
        setError(data.error || 'Failed to create account')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="ADMIN" title="Manage Team">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-bold" style={{ color: '#552A02' }}>Onboarding Managers</h2>
          <p className="text-xs text-gray-400 mt-0.5">{oms.length} member{oms.length !== 1 ? 's' : ''} on your team</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary flex items-center gap-1.5">
          <Plus size={14} /> Add Member
        </button>
      </div>

      {success && (
        <div className="text-sm px-4 py-2.5 rounded-xl mb-4 border font-medium"
             style={{ background: '#F1FFF2', borderColor: '#D2FFD4', color: '#08620D' }}>
          {success}
        </div>
      )}

      {showForm && (
        <div className="card p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold" style={{ color: '#552A02' }}>Create Onboarding Manager Account</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          {error && (
            <div className="text-sm px-4 py-2.5 rounded-xl mb-4 border font-medium"
                 style={{ background: '#FFEAEB', borderColor: '#FFD6D9', color: '#680005' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-600 mb-1">Username</label>
              <input required type="text" className="input-field text-sm" placeholder="e.g. om_rahul"
                     value={username} onChange={(e) => setUsername(e.target.value)} disabled={loading} />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-600 mb-1">Password</label>
              <input required type="password" className="input-field text-sm" placeholder="Min 6 characters"
                     value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary shrink-0">
              {loading ? 'Creating…' : 'Create Account'}
            </button>
          </form>
        </div>
      )}

      {oms.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: '#FFF5EC' }}>
            <User size={20} style={{ color: '#FF9E44' }} />
          </div>
          <p className="text-sm font-bold" style={{ color: '#552A02' }}>No team members yet</p>
          <p className="text-sm text-gray-400 mt-1">Create an Onboarding Manager account to get started.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100" style={{ background: '#FFF5EC' }}>
                {['Username', 'Role', 'Added'].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-left"
                      style={{ color: '#552A02', opacity: 0.6 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {oms.map((om) => (
                <tr key={om.id} className="hover:bg-[#FFF5EC]/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                           style={{ background: 'rgba(111,61,217,0.1)', color: '#6F3DD9' }}>
                        {om.username[0].toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-900">{om.username}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: 'rgba(111,61,217,0.1)', color: '#6F3DD9' }}>
                      Onboarding Manager
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">
                    {om.createdAt ? format(new Date(om.createdAt), 'dd MMM yyyy') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  )
}
