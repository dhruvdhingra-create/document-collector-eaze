import crypto from 'crypto'
import { cookies } from 'next/headers'

const SECRET = process.env.AUTH_SECRET ?? 'dev-secret-change-in-production'
const COOKIE_NAME = 'eaze_session'

interface SessionPayload {
  userId: string
  role: string
}

function signValue(value: string): string {
  const sig = crypto.createHmac('sha256', SECRET).update(value).digest('base64url')
  return `${value}.${sig}`
}

function verifyValue(signed: string): string | null {
  const lastDot = signed.lastIndexOf('.')
  if (lastDot === -1) return null
  const value = signed.slice(0, lastDot)
  const expected = signValue(value)
  // Constant-time comparison to prevent timing attacks
  if (signed.length !== expected.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(signed), Buffer.from(expected))) return null
  return value
}

export async function setSession(userId: string, role: string) {
  const payload = Buffer.from(JSON.stringify({ userId, role })).toString('base64url')
  const signed = signValue(payload)
  const jar = await cookies()
  jar.set(COOKIE_NAME, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies()
  const signed = jar.get(COOKIE_NAME)?.value
  if (!signed) return null

  const verified = verifyValue(signed)
  if (!verified) return null

  try {
    return JSON.parse(Buffer.from(verified, 'base64url').toString()) as SessionPayload
  } catch {
    return null
  }
}

export async function clearSession() {
  const jar = await cookies()
  jar.delete(COOKIE_NAME)
}
