import { prisma } from "./prisma";

interface AuditParams {
  actorId?: string;
  actorRole: "HR" | "EMPLOYEE" | "SYSTEM";
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  ipAddress?: string;
  oldValues?: object;
  newValues?: object;
}

export async function createAuditLog(params: AuditParams) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      description: params.description,
      ipAddress: params.ipAddress,
      oldValues: params.oldValues ? JSON.stringify(params.oldValues) : null,
      newValues: params.newValues ? JSON.stringify(params.newValues) : null,
    },
  });
}
