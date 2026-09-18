import { NextResponse } from "next/server";
import { SkillsService } from "@/server/services/skills.service";

export async function GET() {
  try {
    const certifications = await SkillsService.getCertifications();
    return NextResponse.json({
      success: true,
      certifications,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load certifications" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newCert = await SkillsService.verifyCertificate(body);
    return NextResponse.json({
      success: true,
      certification: newCert,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify certification" },
      { status: 500 }
    );
  }
}
