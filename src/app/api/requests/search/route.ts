import { NextResponse } from 'next/server'
import { and, desc, eq, lt, or, sql } from 'drizzle-orm'

import { getDb, documentRequests } from '@/lib/db'
import { getSession } from '@/lib/auth'

const ilike = (field: any, value: string) =>
  sql`lower(${field}) like ${'%' + value.toLowerCase() + '%'}`

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchQuery } = await request.json()
    const db = getDb()

    // Auto-drop requests older than 96 hours that were never uploaded
    const cutoff = new Date(Date.now() - 96 * 60 * 60 * 1000)
    await db
      .update(documentRequests)
      .set({ status: 'DROPPED_OFF', isActive: false })
      .where(and(
        eq(documentRequests.status, 'NOT_UPLOADED'),
        eq(documentRequests.isActive, true),
        lt(documentRequests.createdAt, cutoff)
      ))

    const searchCondition = searchQuery
      ? or(
          ilike(documentRequests.phone, searchQuery),
          ilike(documentRequests.name, searchQuery),
          ilike(documentRequests.language, searchQuery)
        )
      : undefined

    // ADMIN sees all requests; OM sees only their own
    const ownerFilter = session.role === 'ADMIN'
      ? undefined
      : eq(documentRequests.createdById, session.userId)

    const results = await db
      .select()
      .from(documentRequests)
      .where(and(ownerFilter, searchCondition))
      .orderBy(desc(documentRequests.createdAt))

    return NextResponse.json({ success: true, data: results })
  } catch (err) {
    console.error('Search error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
