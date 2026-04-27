import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { getDb, users } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const oms = await db
      .select({ id: users.id, username: users.username, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.managerId, session.userId))

    return NextResponse.json({ success: true, data: oms })
  } catch (err) {
    console.error('List users error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username, password } = await request.json()
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const db = getDb()
    const [existing] = await db.select().from(users).where(eq(users.username, username)).limit(1)
    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const [newUser] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        username,
        password: hashed,
        role: 'OM',
        managerId: session.userId,
      } as any)
      .returning()

    return NextResponse.json({
      success: true,
      data: { id: newUser.id, username: newUser.username },
    })
  } catch (err) {
    console.error('Create user error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
