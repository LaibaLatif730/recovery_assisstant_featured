import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'patient-session'
const SECRET = new TextEncoder().encode(
  process.env.PATIENT_SESSION_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-patient-session-secret-change-in-production'
)
const EXPIRY = '24h'

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10)
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}

export async function signPatientSession(patientId: string): Promise<string> {
  return new SignJWT({ patientId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(SECRET)
}

export async function verifyPatientSession(token: string): Promise<{ patientId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    if (typeof payload.patientId === 'string') {
      return { patientId: payload.patientId }
    }
    return null
  } catch {
    return null
  }
}

export async function setPatientSessionCookie(patientId: string): Promise<string> {
  const token = await signPatientSession(patientId)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })
  return token
}

export async function getPatientSessionFromCookies(): Promise<{ patientId: string } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyPatientSession(token)
}

export async function clearPatientSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function requirePatientAuth(): Promise<{ patientId: string }> {
  const session = await getPatientSessionFromCookies()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}
