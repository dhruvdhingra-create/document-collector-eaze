import { NextResponse } from 'next/server'
import { and, eq, ne } from 'drizzle-orm'
import { getDb, documentRequests } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId } = await request.json()
    const db = getDb()

    const [docReq] = await db
      .select()
      .from(documentRequests)
      .where(eq(documentRequests.id, requestId))
      .limit(1)

    if (!docReq) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Deactivate any other active request for same phone + language
    await db
      .update(documentRequests)
      .set({ isActive: false })
      .where(
        and(
          eq(documentRequests.phone, docReq.phone),
          eq(documentRequests.language, docReq.language),
          eq(documentRequests.isActive, true),
          ne(documentRequests.id, requestId)
        )
      )

    // Issue fresh token, reset to NOT_UPLOADED
    const [updated] = await db
      .update(documentRequests)
      .set({ status: 'NOT_UPLOADED', isActive: true })
      .where(eq(documentRequests.id, requestId))
      .returning()

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error('Refresh error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
