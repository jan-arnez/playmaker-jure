import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export type AuditAction = 
  | "users.ban"
  | "users.unban"
  | "users.resetStrikes"
  | "users.updateTrust"
  | "users.delete"
  | "facilities.activate"
  | "facilities.deactivate"
  | "facilities.maintenance"
  | "facilities.delete"
  | "bookings.cancel"
  | "bookings.confirm"
  | "bookings.complete"
  | "organizations.update"
  | "organizations.delete"
  | "settings.update";

export type EntityType = "user" | "facility" | "booking" | "organization" | "settings";

interface AuditLogParams {
  adminId: string;
  action: AuditAction | string;
  entityType: EntityType;
  entityId: string;
  details?: Record<string, unknown>;
  request?: NextRequest;
}

/**
 * Log an admin action to the audit log
 */
export async function logAdminAction({
  adminId,
  action,
  entityType,
  entityId,
  details,
  request,
}: AuditLogParams): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId,
        details: details ? JSON.parse(JSON.stringify(details)) : null,
        ipAddress: request?.headers.get("x-forwarded-for") || 
                   request?.headers.get("x-real-ip") || 
                   null,
        userAgent: request?.headers.get("user-agent") || null,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging shouldn't break the main action
    console.error("Failed to log admin action:", error);
  }
}

/**
 * Get recent audit logs with optional filtering
 */
export async function getAuditLogs(options: {
  adminId?: string;
  entityType?: EntityType;
  entityId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const {
    adminId,
    entityType,
    entityId,
    action,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = options;

  const where: Record<string, unknown> = {};

  if (adminId) where.adminId = adminId;
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (action) where.action = { contains: action };
  if (startDate || endDate) {
    where.createdAt = {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    };
  }

  const [logs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      include: {
        admin: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.adminAuditLog.count({ where }),
  ]);

  return { logs, total };
}
