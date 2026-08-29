import { db } from "@/server/db/prisma";

export interface LogAuditParams {
  organizationId?: string;
  userId?: string | null;
  actorName?: string;
  departmentCode?: string;
  action: string;
  entityType: "STUDENT" | "FACULTY" | "COURSE" | "SECTION" | "EXAMINATION" | "TIMETABLE" | "FACILITY" | "RESEARCH" | "PROPOSAL" | "CONDONATION" | "SYSTEM";
  entityId: string;
  entityName?: string;
  previousState?: any;
  newState?: any;
  reason?: string;
  policyCitation?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Log an operational mutation or governance decision to the canonical AuditLog table
   */
  static async log(params: LogAuditParams) {
    try {
      const organizationId = params.organizationId || "seed-org-001";

      const metadata = {
        actorName: params.actorName || "HOD",
        departmentCode: params.departmentCode || "CS",
        entityType: params.entityType,
        entityId: params.entityId,
        entityName: params.entityName,
        previousState: params.previousState ?? null,
        newState: params.newState ?? null,
        reason: params.reason || "Departmental governance administrative action",
        policyCitation: params.policyCitation || null,
        timestamp: new Date().toISOString(),
      };

      const auditRecord = await db.auditLog.create({
        data: {
          organizationId,
          userId: params.userId || null,
          action: params.action,
          ipAddress: params.ipAddress || "127.0.0.1",
          userAgent: params.userAgent || "SmartUniversity-HOD-Portal/2026",
          metadata: metadata as any,
        },
      });

      return auditRecord;
    } catch (error) {
      console.error("[AuditService.log] Failed to write audit log entry:", error);
      return null;
    }
  }

  /**
   * Retrieve audit logs with optional department and entity filtering
   */
  static async getDepartmentAuditLogs(departmentCode = "CS", limit = 50) {
    try {
      const logs = await db.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { user: true },
      });

      const isAll = departmentCode === "ALL";
      const filtered = logs.filter((log) => {
        if (isAll) return true;
        const meta = log.metadata as any;
        if (!meta) return true;
        return !meta.departmentCode || meta.departmentCode === departmentCode;
      });

      return filtered.map((log) => {
        const meta = (log.metadata as any) || {};
        return {
          id: log.id,
          action: log.action,
          actorName: meta.actorName || log.user?.name || "HOD Admin",
          actorEmail: log.user?.email || "hod@smartuniversity.edu",
          departmentCode: meta.departmentCode || departmentCode,
          entityType: meta.entityType || "SYSTEM",
          entityId: meta.entityId || "N/A",
          entityName: meta.entityName || "Record",
          previousState: meta.previousState,
          newState: meta.newState,
          reason: meta.reason || "Operational review",
          policyCitation: meta.policyCitation,
          createdAt: log.createdAt.toISOString(),
        };
      });
    } catch (error) {
      console.error("[AuditService.getDepartmentAuditLogs] Error:", error);
      return [];
    }
  }
}
