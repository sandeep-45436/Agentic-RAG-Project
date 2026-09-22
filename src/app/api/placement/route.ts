import { NextRequest, NextResponse } from "next/server";
import { PlacementService } from "@/server/services/placement.service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || "STU-CSE-001";

    const [drives, studentProfile, applications, analytics] = await Promise.all([
      PlacementService.getDrives(),
      PlacementService.getStudentProfile(studentId),
      PlacementService.getStudentApplications(studentId),
      Promise.resolve(PlacementService.getPlacementAnalytics()),
    ]);

    // Calculate real-time eligibility for each drive for this student
    const drivesWithEligibility = drives.map((d) => {
      const eligibility = PlacementService.evaluateEligibility(studentProfile, d);
      return {
        ...d,
        studentEligibility: eligibility,
      };
    });

    return NextResponse.json({
      success: true,
      drives: drivesWithEligibility,
      studentProfile,
      applications,
      analytics,
    });
  } catch (error: any) {
    console.error("[API placement GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load placement data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, driveId, applicationId, studentId = "STU-CSE-001" } = body;

    if (action === "apply") {
      if (!driveId) {
        return NextResponse.json(
          { success: false, error: "Missing driveId" },
          { status: 400 }
        );
      }
      const res = await PlacementService.applyToDrive(studentId, driveId);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, application: res.application });
    }

    if (action === "accept_offer") {
      if (!applicationId) {
        return NextResponse.json(
          { success: false, error: "Missing applicationId" },
          { status: 400 }
        );
      }
      const res = await PlacementService.acceptOffer(studentId, applicationId);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: res.message });
    }

    if (action === "create_drive") {
      const { drive } = body;
      if (!drive || !drive.company || !drive.role) {
        return NextResponse.json(
          { success: false, error: "Missing required drive details (company, role)" },
          { status: 400 }
        );
      }
      const created = await PlacementService.createDrive(drive);
      return NextResponse.json({ success: true, drive: created });
    }

    return NextResponse.json(
      { success: false, error: `Unrecognized action '${action}'` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API placement POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute placement action" },
      { status: 500 }
    );
  }
}
