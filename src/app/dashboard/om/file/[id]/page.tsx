'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

type DocData = {
  id: string; name: string; phone: string; language: string
  dob: string; gender: string; createdAt: string; uploadedAt: string | null
  fileType: string | null
}

export default function OMFileView({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [data, setData] = useState<DocData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetch(`/api/requests/${params.id}`)
      .then((r) => r.json())
      .then((r) => { if (r.success) setData(r.data); setLoading(false) })
  }, [params.id])

  const handleFreshLink = async () => {
    if (!confirm('Create a fresh link? This will invalidate the current link.')) return
    setRefreshing(true)
    const res = await fetch('/api/requests/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: params.id }),
    })
    if (res.ok) router.push('/dashboard/om')
    else { alert('Failed to create fresh link'); setRefreshing(false) }
  }

  if (loading) return (
    <DashboardLayout role="OM" title="Onboarding Manager">
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>
    </DashboardLayout>
  )

  if (!data) return (
    <DashboardLayout role="OM" title="Onboarding Manager">
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Record not found.</div>
    </DashboardLayout>
  )

  const fields = [
    { label: 'Name', value: data.name },
    { label: 'Phone', value: data.phone },
    { label: 'Language', value: data.language },
    { label: 'Date of Birth', value: data.dob },
    { label: 'Gender', value: data.gender },
    { label: 'Link Created', value: format(new Date(data.createdAt), 'dd MMM yyyy, h:mm a') },
    ...(data.uploadedAt ? [{ label: 'Uploaded At', value: format(new Date(data.uploadedAt), 'dd MMM yyyy, h:mm a') }] : []),
  ]

  return (
    <DashboardLayout role="OM" title="Onboarding Manager">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                style={{ color: '#552A02' }}>
          <ArrowLeft size={15} /> Back to list
        </button>
        <button
          onClick={handleFreshLink}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
          style={{ color: '#FF9E44', background: 'rgba(255,158,68,0.1)' }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Creating…' : 'Fresh Link'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#552A02', opacity: 0.6 }}>Buddy Details</h3>
          <dl className="space-y-3">
            {fields.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-gray-400">{label}</dt>
                <dd className="text-sm font-semibold text-gray-800 mt-0.5">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="md:col-span-2 card p-5 flex flex-col items-center justify-center min-h-[400px]">
          {data.fileType?.includes('pdf') ? (
            /* #toolbar=0&navpanes=0 hides Chrome's native PDF download/print toolbar */
            <embed src={`/api/upload?id=${data.id}#toolbar=0&navpanes=0&scrollbar=1`}
                   type="application/pdf"
                   className="w-full h-[600px] rounded-lg border border-gray-100" />
          ) : (
            <img src={`/api/upload?id=${data.id}`} alt="ID Proof"
                 draggable={false}
                 onContextMenu={(e) => e.preventDefault()}
                 className="max-w-full max-h-[600px] rounded-xl shadow-sm object-contain select-none"
                 style={{ WebkitUserDrag: 'none' } as React.CSSProperties} />
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
