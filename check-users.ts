import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, password: true },
  })

  for (const user of users) {
    console.log(`\n--- ${user.email} (${user.role}) ---`)
    console.log(`  Has password: ${!!user.password}`)
    if (user.password) {
      console.log(`  Password hash prefix: ${user.password.substring(0, 10)}...`)
    }
  }

  // Test password verification for each staff member
  const testCases = [
    { email: 'admin@clinic.com', plain: 'admin123' },
    { email: 'doctor@clinic.com', plain: 'doctor123' },
    { email: 'receptionist@clinic.com', plain: 'patient123' },
  ]

  for (const tc of testCases) {
    const user = users.find(u => u.email === tc.email)
    if (!user || !user.password) {
      console.log(`\n❌ ${tc.email}: NOT FOUND or NO PASSWORD`)
      continue
    }
    const match = await bcrypt.compare(tc.plain, user.password)
    console.log(`\n${match ? '✅' : '❌'} ${tc.email} + "${tc.plain}": ${match ? 'MATCH' : 'NO MATCH'}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
