'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AlertCircle, CheckCircle, UploadCloud } from 'lucide-react'

function EazeSwirl() {
  return <img src="/eaze-logo.png" alt="Eaze" style={{ width: 90, height: 'auto', display: 'block' }} />
}

const BG = 'min-h-[100dvh] flex items-center justify-center p-4'
const BG_STYLE = { background: '#130D21' }
const VALID_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
const MAX_SIZE = 5 * 1024 * 1024

function FileZone({
  label, file, inputId, onChange, disabled,
}: {
  label: string; file: File | null; inputId: string
  onChange: (f: File | null, err: string) => void; disabled: boolean
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (!VALID_TYPES.includes(selected.type)) {
      onChange(null, 'Only JPG, PNG and PDF files are allowed.')
      e.target.value = ''
      return
    }
    if (selected.size > MAX_SIZE) {
      onChange(null, 'File too large. Maximum allowed size is 5 MB.')
      e.target.value = ''
      return
    }
    onChange(selected, '')
  }

  return (
    <div>
      <p className="text-xs font-bold mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
      <div
        className="relative rounded-2xl p-5 text-center transition-all duration-300 group cursor-pointer"
        style={{ border: '1.5px dashed rgba(255,158,68,0.25)', background: 'rgba(255,158,68,0.04)' }}
        onClick={() => document.getElementById(inputId)?.click()}
      >
        <input id={inputId} type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf"
               onChange={handleChange} disabled={disabled} />

        <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
             style={{ background: 'rgba(255,158,68,0.12)', border: '1px solid rgba(255,158,68,0.2)' }}>
          <UploadCloud className="w-5 h-5" style={{ color: '#FF9E44' }} strokeWidth={1.5} />
        </div>

        {file ? (
          <div>
            <p className="text-xs font-semibold text-white truncate px-1">{file.name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {(file.size / 1024 / 1024).toFixed(1)} MB ·{' '}
              <label htmlFor={inputId} className="font-semibold cursor-pointer" style={{ color: '#FF9E44' }}
                     onClick={(e) => e.stopPropagation()}>
                Replace
              </label>
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold text-white mb-0.5">Tap to select</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>JPG, PNG or PDF · max 5 MB</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function DocumentUploadPage() {
  const { token: paramToken } = useParams() as { token: string }
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [file1, setFile1] = useState<File | null>(null)
  const [file2, setFile2] = useState<File | null>(null)
  const [err1, setErr1] = useState('')
  const [err2, setErr2] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch(`/api/upload/verify?token=${paramToken}`)
      .then((r) => r.json())
      .then((r) => {
        if (r.success) setData(r.data)
        else setError(r.error || 'Invalid Link')
        setLoading(false)
      })
  }, [paramToken])

  const handleSubmit = async () => {
    if (!file1 || !file2) return
    setUploading(true)
    setError('')
    const fd = new FormData()
    fd.append('file',  file1)
    fd.append('file2', file2)
    fd.append('token', paramToken)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (res.ok) setSuccess(true)
      else {
        const data = await res.json()
        setError(data.error || 'Upload failed. Please try again.')
      }
    } catch {
      setError('Upload failed due to a network issue. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className={BG} style={BG_STYLE}>
        <div className="flex items-center gap-3" style={{ color: 'rgba(255,158,68,0.6)' }}>
          <div className="w-5 h-5 border-2 rounded-full animate-spin"
               style={{ borderColor: 'rgba(255,158,68,0.2)', borderTopColor: '#FF9E44' }} />
          <span className="text-sm font-medium">Loading…</span>
        </div>
      </div>
    )
  }

  /* ── Invalid / Expired ── */
  if (error && !data) {
    return (
      <div className={BG} style={BG_STYLE}>
        <div className="w-full max-w-[340px] rounded-3xl p-8 text-center"
             style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
               style={{ background: 'rgba(212,26,35,0.15)' }}>
            <AlertCircle className="w-7 h-7" style={{ color: '#FF9499' }} strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Link Invalid or Expired</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
            This link has expired or is no longer valid.<br /><br />
            Please contact the Eaze team for a new link.
          </p>
        </div>
      </div>
    )
  }

  /* ── Success ── */
  if (success || data?.status === 'UPLOADED') {
    return (
      <div className={BG} style={BG_STYLE}>
        <div className="w-full max-w-[340px] rounded-3xl p-8 text-center"
             style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
               style={{ background: 'rgba(51,191,48,0.15)' }}>
            <CheckCircle className="w-7 h-7" style={{ color: '#74FF7B' }} strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Upload Successful!</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Your documents have been submitted successfully.<br />Thank you!
          </p>
        </div>
      </div>
    )
  }

  const canSubmit = !!(file1 && file2 && !err1 && !err2)

  /* ── Upload form ── */
  return (
    <div className="min-h-[100dvh] flex flex-col font-sans" style={BG_STYLE}>
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-10"
           style={{ background: '#FF9E44', transform: 'translate(30%, -30%)' }} />

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 relative z-10">
        <div className="w-full max-w-[380px]">

          {/* Brand header */}
          <div className="text-center mb-7">
            <div className="flex justify-center mb-3">
              <EazeSwirl />
            </div>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Please upload your ID proof securely
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl p-6"
               style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>

            {error && (
              <div className="text-sm text-center px-4 py-3 rounded-2xl mb-5 font-medium"
                   style={{ background: 'rgba(212,26,35,0.12)', color: '#FF9499', border: '1px solid rgba(212,26,35,0.2)' }}>
                {error}
              </div>
            )}

            <div className="space-y-4">
              <FileZone label="Document 1" file={file1} inputId="fu1" disabled={uploading}
                onChange={(f, e) => { setFile1(f); setErr1(e) }} />
              {err1 && <p className="text-xs font-medium" style={{ color: '#FF9499' }}>⚠ {err1}</p>}

              <FileZone label="Document 2" file={file2} inputId="fu2" disabled={uploading}
                onChange={(f, e) => { setFile2(f); setErr2(e) }} />
              {err2 && <p className="text-xs font-medium" style={{ color: '#FF9499' }}>⚠ {err2}</p>}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit || uploading}
              className="w-full mt-6 h-14 rounded-2xl text-base font-bold transition-all duration-300 flex items-center justify-center active:scale-[.98]"
              style={
                !canSubmit || uploading
                  ? { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' }
                  : { background: '#FF9E44', color: '#552A02', boxShadow: '0 4px 24px rgba(255,158,68,0.3)' }
              }
            >
              {uploading ? (
                <span className="flex items-center gap-2.5">
                  <span className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  Uploading…
                </span>
              ) : 'Submit Documents'}
            </button>
          </div>

          <p className="text-center mt-7 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Need help?{' '}
            <span className="font-semibold" style={{ color: 'rgba(255,158,68,0.6)' }}>
              +91 6355548912
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
