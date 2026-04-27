import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { getDb, users } from '@/lib/db'
import { setSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    const db = getDb()
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1)

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    await setSession(user.id, user.role)

    const redirect = user.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/om'
    return NextResponse.json({ success: true, role: user.role, redirect })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
