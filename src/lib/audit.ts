import "server-only";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/request";

export type AuditAction =
  | "signup" | "login" | "login_failed" | "logout"
  | "create" | "view" | "update" | "archive" | "upload" | "send"
  | "approve" | "request_info" | "reject" | "verify"
  | "access_denied";

export async function audit(
  practitionerId: string | null,
  action: AuditAction,
  entityType: string,
  entityId?: string | null,
) {
  await db.auditLog.create({
    data: { practitionerId, action, entityType, entityId: entityId ?? null, ipAddress: await clientIp() },
  });
}
