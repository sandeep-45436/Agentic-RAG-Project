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

      let validUserId: string | null = null;
      if (userId) {
        const userExists = await db.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });
        if (userExists) {
          validUserId = userExists.id;
        } else {
          const faculty = await db.faculty.findUnique({
            where: { id: userId },
            select: { userId: true },
          });
          if (faculty?.userId) {
            validUserId = faculty.userId;
          }
        }
      }

      const logEntry = await db.auditLog.create({
        data: {
          organizationId: orgId,
          userId: validUserId,
          action,
          ipAddress: ip || null,
          userAgent: userAgent || null,
          metadata: {
            ...(metadata && typeof metadata === "object" ? metadata : { raw: metadata }),
            ...(userId && !validUserId ? { originalCallerId: userId } : {}),
          },
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
