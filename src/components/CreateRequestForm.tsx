'use client'

import { useState } from 'react'
import { Link2 } from 'lucide-react'

const INITIAL = { name: '', phone: '', language: 'English', dob: '', gender: 'Male' }

export default function CreateRequestForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState(INITIAL)

  const set = (k: keyof typeof INITIAL) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Upload link created successfully!')
        setForm(INITIAL)
        onSuccess()
        setTimeout(() => setSuccess(''), 4000)
      } else {
        setError(data.error || 'Failed to create request')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-5 mb-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
             style={{ background: '#FFF5EC' }}>
          <Link2 size={13} style={{ color: '#FF9E44' }} />
        </div>
        <h2 className="text-sm font-bold" style={{ color: '#552A02' }}>Create New Upload Link</h2>
      </div>

      {error && (
        <div className="text-sm px-4 py-2.5 rounded-xl mb-4 border font-medium"
             style={{ background: '#FFEAEB', borderColor: '#FFD6D9', color: '#680005' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm px-4 py-2.5 rounded-xl mb-4 border font-medium"
             style={{ background: '#F1FFF2', borderColor: '#D2FFD4', color: '#08620D' }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { key: 'name' as const, label: 'Buddy Name', type: 'text', placeholder: 'Full name' },
          { key: 'phone' as const, label: 'Phone', type: 'tel', placeholder: '+91 …' },
          { key: 'dob' as const, label: 'Date of Birth', type: 'date', placeholder: '' },
        ].map(({ key, label, type, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
            <input required type={type} placeholder={placeholder}
              className="input-field text-sm" value={form[key]} onChange={set(key)} disabled={loading} />
          </div>
        ))}

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Language</label>
          <select className="input-field text-sm" value={form.language} onChange={set('language')} disabled={loading}>
            {['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam'].map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Gender</label>
          <select className="input-field text-sm" value={form.gender} onChange={set('gender')} disabled={loading}>
            {['Male', 'Female', 'Other'].map((g) => <option key={g}>{g}</option>)}
          </select>
        </div>

        <div className="col-span-2 md:col-span-5 flex justify-end pt-1">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating…' : 'Create Link'}
          </button>
        </div>
      </form>
    </div>
  )
}
