import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb, documentRequests } from '@/lib/db'
import { saveFile, getFileBuffer, deleteFile } from '@/lib/store'
import { getSession } from '@/lib/auth'

const VALID_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
const MAX_SIZE = 5 * 1024 * 1024
const EXPIRY_MS = 96 * 60 * 60 * 1000

function validateFile(file: File, label: string) {
  if (!VALID_TYPES.includes(file.type)) return `${label}: Only JPEG, PNG and PDF files are accepted`
  if (file.size > MAX_SIZE) return `${label}: File size must be 5 MB or less`
  return null
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file  = formData.get('file')  as File
    const file2 = formData.get('file2') as File
    const token = formData.get('token') as string

    if (!file || !file2 || !token) return NextResponse.json({ error: 'Both documents and token are required' }, { status: 400 })

    const err1 = validateFile(file,  'Document 1')
    const err2 = validateFile(file2, 'Document 2')
    if (err1) return NextResponse.json({ error: err1 }, { status: 400 })
    if (err2) return NextResponse.json({ error: err2 }, { status: 400 })

    const db = getDb()
    const [docReq] = await db.select().from(documentRequests).where(eq(documentRequests.token, token)).limit(1)
    if (!docReq) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })

    const isExpired = !docReq.isActive || Date.now() - new Date(docReq.createdAt).getTime() > EXPIRY_MS
    if (isExpired) return NextResponse.json({ error: 'Link has expired' }, { status: 403 })

    const [filePath, file2Path] = await Promise.all([saveFile(file), saveFile(file2)])
    if (docReq.filePath)  await deleteFile(docReq.filePath).catch(() => {})
    if (docReq.file2Path) await deleteFile(docReq.file2Path).catch(() => {})

    await db.update(documentRequests).set({
      status: 'UPLOADED', isActive: false, uploadedAt: new Date(),
      fileName: file.name,   fileType: file.type,   fileSize: file.size,   filePath,
      file2Name: file2.name, file2Type: file2.type, file2Size: file2.size, file2Path,
    }).where(eq(documentRequests.id, docReq.id))

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[upload] Error:', err?.message || err, err?.stack)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const id         = url.searchParams.get('id')
    const doc        = url.searchParams.get('doc')        // '1' or '2'
    const asDownload = url.searchParams.get('download') === 'true'

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
    if (asDownload && session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const db = getDb()
    const [docReq] = await db.select().from(documentRequests).where(eq(documentRequests.id, id)).limit(1)

    const useDoc2  = doc === '2'
    const filePath = useDoc2 ? docReq?.file2Path : docReq?.filePath
    const fileType = useDoc2 ? docReq?.file2Type : docReq?.fileType
    const fileName = useDoc2 ? docReq?.file2Name : docReq?.fileName

    if (!filePath) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    const buffer = await getFileBuffer(filePath)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': fileType ?? 'application/octet-stream',
        'Content-Disposition': (asDownload && session.role === 'ADMIN')
          ? `attachment; filename="${fileName}"`
          : `inline; filename="${fileName}"`,
      },
    })
  } catch (err) {
    console.error('File serve error:', err)
    return NextResponse.json({ error: 'Server error retrieving file' }, { status: 500 })
  }
}
