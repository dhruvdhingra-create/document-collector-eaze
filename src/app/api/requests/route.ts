import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { getDb, documentRequests } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, phone, language, dob, gender } = await request.json()

    if (!name || !phone || !language || !dob || !gender) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const db = getDb()

    const [existingActive] = await db
      .select()
      .from(documentRequests)
      .where(
        and(
          eq(documentRequests.phone, phone),
          eq(documentRequests.language, language),
          eq(documentRequests.isActive, true)
        )
      )
      .limit(1)

    if (existingActive) {
      return NextResponse.json(
        { error: 'An active document request already exists for this phone number and language.' },
        { status: 400 }
      )
    }

    const [newRequest] = await db
      .insert(documentRequests)
      .values({ name, phone, language, dob, gender, createdById: session.userId })
      .returning()

    return NextResponse.json({ success: true, data: newRequest })
  } catch (err) {
    console.error('Create request error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
