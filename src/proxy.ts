import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const PATIENT_SECRET = new TextEncoder().encode(
  process.env.PATIENT_SESSION_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-patient-session-secret-change-in-production'
)

const NEXTAUTH_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-nextauth-secret'
)

// Admin CANNOT access these — Doctor/Receptionist only
const STAFF_ONLY_PATHS = [
  '/dashboard/patients/new',
  '/dashboard/treatments/new',
  '/dashboard/appointments/new',
  '/dashboard/clinical-notes/new',
  '/dashboard/checkins', // Doctor reviews check-ins
  '/dashboard/before-after',
]

// Admin ONLY paths — Doctor/Receptionist CANNOT access
const ADMIN_ONLY_PATHS = [
  '/dashboard/doctors',
  '/dashboard/analytics',
  '/dashboard/compliance',
  '/dashboard/products',
  '/dashboard/consent',
]

// Doctor ONLY paths — Receptionist and Admin CANNOT access
const DOCTOR_ONLY_PATHS = [
  '/dashboard/treatments',
  '/dashboard/clinical-notes',
  '/dashboard/protocols',
]

async function hasValidPatientSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('patient-session')?.value
  if (!token) return false
  try {
    await jwtVerify(token, PATIENT_SECRET)
    return true
  } catch {
    return false
  }
}

async function getUserRole(req: NextRequest): Promise<string | null> {
  const sessionToken = req.cookies.get('next-auth.session-token')?.value
    || req.cookies.get('__Secure-next-auth.session-token')?.value

  if (!sessionToken) return null

  try {
    const { payload } = await jwtVerify(sessionToken, NEXTAUTH_SECRET, {
      algorithms: ['HS256'],
    })
    return (payload.role as string) || null
  } catch {
    return null
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/dashboard')) {
    const sessionToken = req.cookies.get('next-auth.session-token')?.value
      || req.cookies.get('__Secure-next-auth.session-token')?.value

    if (!sessionToken) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const role = await getUserRole(req)

    if (role === 'ADMIN') {
      const isStaffPath = STAFF_ONLY_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
      if (isStaffPath) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    if (role === 'RECEPTIONIST') {
      const isAdminPath = ADMIN_ONLY_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
      const isDoctorPath = DOCTOR_ONLY_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
      if (isAdminPath || isDoctorPath) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    if (role === 'DOCTOR') {
      const isAdminPath = ADMIN_ONLY_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
      if (isAdminPath) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }
  }

  if (pathname.startsWith('/patient') && !pathname.startsWith('/patient/login')) {
    if (!(await hasValidPatientSession(req))) {
      return NextResponse.redirect(new URL('/patient/login', req.url))
    }
  }

  if (pathname.startsWith('/api/patient/') && !pathname.startsWith('/api/patient/auth')) {
    if (!(await hasValidPatientSession(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/patient/:path*', '/api/patient/:path*'],
}
