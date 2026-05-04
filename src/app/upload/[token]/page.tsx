'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, UploadCloud } from 'lucide-react'

function EazeSwirl() {
  return <img src="/eaze-logo.png" alt="Eaze" style={{ width: 90, height: 'auto', display: 'block' }} />
}

const BG = 'min-h-[100dvh] flex items-center justify-center p-4'
const BG_STYLE = { background: '#130D21' }

export default function DocumentUploadPage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [fileError, setFileError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch(`/api/upload/verify?token=${params.token}`)
      .then((r) => r.json())
      .then((r) => {
        if (r.success) setData(r.data)
        else setError(r.error || 'Invalid Link')
        setLoading(false)
      })
  }, [params.token])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    setFileError('')
    const selected = e.target.files?.[0]
    if (!selected) return
    if (!['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(selected.type)) {
      setFileError('Only JPG, PNG and PDF files are allowed.')
      e.target.value = ''
      return
    }
    if (selected.size > 5 * 1024 * 1024) {
      setFileError('File too large. Maximum allowed size is 5 MB.')
      e.target.value = ''
      return
    }
    setFile(selected)
  }

  const handleSubmit = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('token', params.token)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (res.ok) setSuccess(true)
      else setError('Upload failed. Please try again.')
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
            Your ID proof has been submitted successfully.<br />Thank you!
          </p>
        </div>
      </div>
    )
  }

  /* ── Upload form ── */
  return (
    <div className="min-h-[100dvh] flex flex-col font-sans" style={BG_STYLE}>
      {/* Orange glow */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-10"
           style={{ background: '#FF9E44', transform: 'translate(30%, -30%)' }} />

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 relative z-10">
        <div className="w-full max-w-[360px]">

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

            {/* Drop zone */}
            <div className="relative rounded-2xl p-8 text-center transition-all duration-300 group cursor-pointer"
                 style={{ border: '1.5px dashed rgba(255,158,68,0.25)', background: 'rgba(255,158,68,0.04)' }}
                 onClick={() => document.getElementById('fu')?.click()}>

              <input id="fu" type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf"
                     onChange={handleFileChange} disabled={uploading} />

              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-105"
                   style={{ background: 'rgba(255,158,68,0.12)', border: '1px solid rgba(255,158,68,0.2)' }}>
                <UploadCloud className="w-7 h-7" style={{ color: '#FF9E44' }} strokeWidth={1.5} />
              </div>

              {file ? (
                <p className="text-sm font-semibold text-white truncate px-2">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-white mb-1">Tap to select a file</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>JPG, PNG or PDF · max 5 MB</p>
                </>
              )}
            </div>

            {file && (
              <div className="mt-4 flex justify-between items-center px-1">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </span>
                <label htmlFor="fu" className="text-xs font-semibold cursor-pointer transition-colors"
                       style={{ color: '#FF9E44' }}>
                  Replace file
                </label>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!file || uploading}
              className="w-full mt-6 h-14 rounded-2xl text-base font-bold transition-all duration-300 flex items-center justify-center active:scale-[.98]"
              style={
                !file || uploading
                  ? { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' }
                  : { background: '#FF9E44', color: '#552A02', boxShadow: '0 4px 24px rgba(255,158,68,0.3)' }
              }
            >
              {uploading ? (
                <span className="flex items-center gap-2.5">
                  <span className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  Uploading…
                </span>
              ) : 'Submit ID Proof'}
            </button>

            {fileError && (
              <p className="mt-3 text-xs font-medium text-center" style={{ color: '#FF9499' }}>
                ⚠ {fileError}
              </p>
            )}
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
