import prisma from '@/lib/db'

interface AuditLogParams {
  userId?: string
  action: string
  entity: string
  entityId?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function auditLog({
  userId,
  action,
  entity,
  entityId,
  oldValues,
  newValues,
  ipAddress,
  userAgent,
}: AuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    console.error('Audit log write failed:', error)
  }
}
