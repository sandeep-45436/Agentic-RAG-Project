import { db } from "@/server/db/prisma";

export interface LogAuditParams {
  orgId: string;
  userId?: string | null;
  action: string;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: any;
}

export class AuditService {
  /**
   * Log an audit event to the database.
   * This is designed to fail gracefully so that logging issues do not interrupt user operations.
   */
  static async logEvent(params: LogAuditParams) {
    try {
      const { orgId, userId, action, ip, userAgent, metadata } = params;

      const logEntry = await db.auditLog.create({
        data: {
          organizationId: orgId,
          userId: userId || null,
          action,
          ipAddress: ip || null,
          userAgent: userAgent || null,
          metadata: metadata ? (typeof metadata === "object" ? metadata : { raw: metadata }) : undefined,
        },
      });

      console.log(`[AuditLog] Recorded event: "${action}" (Log ID: ${logEntry.id})`);
      return { success: true, logId: logEntry.id };
    } catch (err) {
      console.error("[AuditLog] Failed to write audit log to database:", err);
      return { success: false, error: err };
    }
  }
}
