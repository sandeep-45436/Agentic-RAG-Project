import { NextResponse } from "next/server";
import { HODService } from "@/server/services/hod.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const departments = await HODService.listDepartments();
    return NextResponse.json({ success: true, departments });
  } catch (error: any) {
    console.error("[API: /api/hod/departments] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to list departments" }, { status: 500 });
  }
}
