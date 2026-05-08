import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb, documentRequests } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const [docReq] = await db
      .select()
      .from(documentRequests)
      .where(eq(documentRequests.id, id))
      .limit(1)

    if (!docReq) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ success: true, data: docReq })
  } catch (err) {
    console.error('Get request error:', err)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}
