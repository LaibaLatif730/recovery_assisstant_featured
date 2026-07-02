import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let _prisma: PrismaClient | null = null

export function getPrisma() {
  if (!_prisma) {
    _prisma = globalForPrisma.prisma ?? new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : [],
    })
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = _prisma
    }
  }
  return _prisma
}

const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getPrisma() as any)[prop]
  },
})

export { prisma }
export default prisma
