import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb, documentRequests } from '@/lib/db'
import { saveFile, getFileBuffer, deleteFile } from '@/lib/store'
import { getSession } from '@/lib/auth'

const VALID_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
const MAX_SIZE = 5 * 1024 * 1024
const EXPIRY_MS = 96 * 60 * 60 * 1000

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const token = formData.get('token') as string

    if (!file || !token) return NextResponse.json({ error: 'Missing file or token' }, { status: 400 })
    if (!VALID_TYPES.includes(file.type)) return NextResponse.json({ error: 'Only JPEG, PNG and PDF files are accepted' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File size must be 5 MB or less' }, { status: 400 })

    const db = getDb()
    const [docReq] = await db.select().from(documentRequests).where(eq(documentRequests.token, token)).limit(1)
    if (!docReq) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })

    const isExpired = !docReq.isActive || Date.now() - new Date(docReq.createdAt).getTime() > EXPIRY_MS
    if (isExpired) return NextResponse.json({ error: 'Link has expired' }, { status: 403 })

    const filePath = await saveFile(file)
    if (docReq.filePath) await deleteFile(docReq.filePath).catch(() => {})

    await db.update(documentRequests).set({
      status: 'UPLOADED', isActive: false, uploadedAt: new Date(),
      fileName: file.name, fileType: file.type, fileSize: file.size, filePath,
    }).where(eq(documentRequests.id, docReq.id))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const asDownload = url.searchParams.get('download') === 'true'

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    // Only ADMIN can trigger a file download
    if (asDownload && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const db = getDb()
    const [docReq] = await db.select().from(documentRequests).where(eq(documentRequests.id, id)).limit(1)
    if (!docReq?.filePath) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    const buffer = await getFileBuffer(docReq.filePath)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': docReq.fileType ?? 'application/octet-stream',
        // OM always gets inline (view only); only ADMIN gets attachment (download)
        'Content-Disposition': (asDownload && session.role === 'ADMIN')
          ? `attachment; filename="${docReq.fileName}"`
          : `inline; filename="${docReq.fileName}"`,
      },
    })
  } catch (err) {
    console.error('File serve error:', err)
    return NextResponse.json({ error: 'Server error retrieving file' }, { status: 500 })
  }
}
