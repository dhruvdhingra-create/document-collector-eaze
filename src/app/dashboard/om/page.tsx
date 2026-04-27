'use client'

import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import CreateRequestForm from '@/components/CreateRequestForm'
import RequestList from '@/components/RequestList'
import { Plus, Search, X } from 'lucide-react'

export default function OMDashboard() {
  const [requests, setRequests] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [showForm, setShowForm] = useState(false)

  const fetchRequests = useCallback(async () => {
    const res = await fetch('/api/requests/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchQuery: debounced }),
    })
    const data = await res.json()
    if (data.success) setRequests(data.data)
  }, [debounced])

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const stats = [
    { label: 'Total Requests', value: requests.length, val: '#552A02' },
    { label: 'Uploaded', value: requests.filter((r) => r.status === 'UPLOADED').length, val: '#08620D' },
    { label: 'Pending', value: requests.filter((r) => r.status === 'NOT_UPLOADED').length, val: '#FF9E44' },
  ]

  return (
    <DashboardLayout role="OM" title="Onboarding Manager">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map(({ label, value, val }) => (
          <div key={label} className="card px-5 py-4" style={{ borderLeft: `3px solid ${val}` }}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-2xl font-bold" style={{ color: val }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" className="input-field pl-9 py-2 text-sm"
            placeholder="Search name, phone, language…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary flex items-center gap-1.5 shrink-0">
          <Plus size={14} /> New Link
        </button>
      </div>

      {showForm && <CreateRequestForm onSuccess={() => { fetchRequests(); setShowForm(false) }} />}

      <RequestList role="OM" requests={requests} onRefresh={fetchRequests} />
    </DashboardLayout>
  )
}
