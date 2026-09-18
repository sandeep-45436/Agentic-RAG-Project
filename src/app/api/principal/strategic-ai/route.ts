import { NextResponse } from "next/server";
import { PrincipalService } from "@/server/services/principal.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body.query || "What is the comprehensive university operations state?";
    const response = await PrincipalService.queryStrategicAi(query);
    return NextResponse.json({
      success: true,
      report: response,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Strategic AI query failed" },
      { status: 500 }
    );
  }
}
