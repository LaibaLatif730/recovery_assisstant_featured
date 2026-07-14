import { NextResponse } from 'next/server'
import { clearPatientSessionCookie } from '@/lib/patient-auth'

export async function POST() {
  try {
    await clearPatientSessionCookie()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
