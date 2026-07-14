import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const PATIENT_SECRET = new TextEncoder().encode(
  process.env.PATIENT_SESSION_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-patient-session-secret-change-in-production'
)

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
