export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb, documentRequests } from '@/lib/db'

const EXPIRY_MS = 96 * 60 * 60 * 1000

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

    const db = getDb()
    const [docReq] = await db
      .select()
      .from(documentRequests)
      .where(eq(documentRequests.token, token))
      .limit(1)

    if (!docReq) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })

    const isExpired = !docReq.isActive || Date.now() - docReq.createdAt.getTime() > EXPIRY_MS

    if (isExpired) {
      if (docReq.status === 'NOT_UPLOADED') {
        await db
          .update(documentRequests)
          .set({ status: 'DROPPED_OFF', isActive: false })
          .where(eq(documentRequests.id, docReq.id))
      }
      return NextResponse.json({ error: 'Link has expired' }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: docReq })
  } catch (err) {
    console.error('Verify error:', err)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}
