import { NextResponse } from "next/server";
import { AuditService } from "@/server/services/audit.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentCode = searchParams.get("department") || "CS";
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const logs = await AuditService.getDepartmentAuditLogs(departmentCode, limit);
    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error("[API: /api/hod/audit] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch audit logs" }, { status: 500 });
  }
}
