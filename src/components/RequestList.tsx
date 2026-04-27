'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Check, Copy, Eye, FileText, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Request = {
  id: string; name: string; phone: string; language: string; status: string
  isActive: boolean; token: string; createdAt: string; uploadedAt: string | null
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'UPLOADED') return <span className="badge-uploaded">Uploaded</span>
  if (status === 'DROPPED_OFF') return <span className="badge-dropped">Dropped off</span>
  return <span className="badge-pending">Pending</span>
}

export default function RequestList({ role, requests, onRefresh }: {
  role: 'ADMIN' | 'OM'; requests: Request[]; onRefresh: () => void
}) {
  const router = useRouter()
  const [copyingId, setCopyingId] = useState<string | null>(null)
  const [refreshingId, setRefreshingId] = useState<string | null>(null)

  const copyLink = (token: string, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/upload/${token}`)
    setCopyingId(id)
    setTimeout(() => setCopyingId(null), 2000)
  }

  const createFreshLink = async (id: string) => {
    if (!confirm('Create a fresh upload link? The current link will be invalidated.')) return
    setRefreshingId(id)
    try {
      const res = await fetch('/api/requests/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id }),
      })
      if (res.ok) onRefresh()
      else alert('Failed to generate fresh link')
    } finally {
      setRefreshingId(null)
    }
  }

  const fileViewPath = (id: string) =>
    role === 'ADMIN' ? `/dashboard/admin/file/${id}` : `/dashboard/om/file/${id}`

  if (requests.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
             style={{ background: '#FFF5EC' }}>
          <FileText size={20} style={{ color: '#FF9E44' }} />
        </div>
        <p className="text-sm font-bold" style={{ color: '#552A02' }}>No requests yet</p>
        <p className="text-sm text-gray-400 mt-1">Create a new upload link to get started.</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100" style={{ background: '#FFF5EC' }}>
              {['Buddy', 'Contact', 'Created', 'Status', ''].map((h) => (
                <th key={h} className={`px-5 py-3 text-xs font-bold uppercase tracking-wide ${h === '' ? 'text-right' : 'text-left'}`}
                    style={{ color: '#552A02', opacity: 0.6 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {requests.map((req) => {
              const isInactive = !req.isActive || req.status === 'DROPPED_OFF'
              return (
                <tr key={req.id}
                    className={`transition-colors hover:bg-[#FFF5EC]/30 ${isInactive ? 'opacity-55' : ''}`}>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-gray-900">{req.name}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-gray-700">{req.phone}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{req.language}</p>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <p className="text-gray-700">{format(new Date(req.createdAt), 'dd MMM yyyy')}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{format(new Date(req.createdAt), 'h:mm a')}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={req.status} />
                    {req.uploadedAt && (
                      <p className="text-xs text-gray-400 mt-1">{format(new Date(req.uploadedAt), 'dd MMM, h:mm a')}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {req.status === 'UPLOADED' && (
                        <button
                          onClick={() => router.push(fileViewPath(req.id))}
                          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                          style={{ color: '#6F3DD9', background: 'rgba(111,61,217,0.08)' }}
                        >
                          <Eye size={12} /> View File
                        </button>
                      )}
                      {!isInactive && req.status !== 'UPLOADED' && (
                        <button
                          onClick={() => copyLink(req.token, req.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                          style={{ color: '#552A02', background: '#FFF5EC' }}
                        >
                          {copyingId === req.id
                            ? <><Check size={12} /> Copied</>
                            : <><Copy size={12} /> Copy Link</>}
                        </button>
                      )}
                      {(req.status === 'DROPPED_OFF' || req.status === 'UPLOADED') && (
                        <button
                          onClick={() => createFreshLink(req.id)}
                          disabled={refreshingId === req.id}
                          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                          style={{ color: '#FF9E44', background: 'rgba(255,158,68,0.1)' }}
                        >
                          <RefreshCw size={12} className={refreshingId === req.id ? 'animate-spin' : ''} />
                          {refreshingId === req.id ? 'Creating…' : 'Fresh Link'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 border-t border-gray-50">
        <p className="text-xs text-gray-400 font-medium">
          {requests.length} record{requests.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}
