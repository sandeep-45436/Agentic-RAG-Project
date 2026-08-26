import { NextResponse } from "next/server";
import { HODService } from "@/server/services/hod.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, departmentCode = "CS" } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "A valid query string is required." }, { status: 400 });
    }

    const report = await HODService.queryAICommandCenter(query, departmentCode);
    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error("[API: /api/hod/command-center] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process query in HOD Command Center" }, { status: 500 });
  }
}
