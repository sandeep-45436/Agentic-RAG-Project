import { NextResponse } from "next/server";
import { HODService } from "@/server/services/hod.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentCode = searchParams.get("department") || "CS";

    const health = await HODService.calculateDepartmentHealth(departmentCode);
    return NextResponse.json({ success: true, health });
  } catch (error: any) {
    console.error("[API: /api/hod/health] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to calculate health score" }, { status: 500 });
  }
}
