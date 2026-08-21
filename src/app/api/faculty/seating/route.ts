import { NextResponse } from "next/server";
import { FacultyService } from "@/server/services/faculty.service";
import { db } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId") || "seed-org-001";
    const examinationId = searchParams.get("examinationId") || undefined;
    const hallNumber = searchParams.get("hallNumber") || undefined;
    const facultyId = searchParams.get("facultyId") || undefined;

    const seating = await FacultyService.getExamSeating(orgId, {
      examinationId,
      hallNumber,
      facultyId,
    });

    const examinations = await db.examination.findMany({
      where: { organizationId: orgId, deletedAt: null },
      orderBy: { startDate: "desc" },
    });

    const facilities = await db.facility.findMany({
      where: { organizationId: orgId, deletedAt: null },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      seating,
      examinations,
      facilities,
    });
  } catch (error: any) {
    console.error("[API: /api/faculty/seating GET] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch exam seating arrangements" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "generate") {
      const {
        organizationId = "seed-org-001",
        examinationId,
        facilityId,
        hallNumber,
        invigilatorFacultyId,
        examDate,
        sessionSlot,
        benchesCount = 15,
        rows = 5,
        columns = 3,
        seatsPerBench = 2,
      } = body;

      if (!examinationId || !hallNumber || !examDate || !sessionSlot) {
        return NextResponse.json(
          { error: "Examination ID, Hall Number, Exam Date, and Session Slot are required." },
          { status: 400 }
        );
      }

      const generated = await FacultyService.generateExamSeatingPlan({
        organizationId,
        examinationId,
        facilityId,
        hallNumber,
        invigilatorFacultyId,
        examDate,
        sessionSlot,
        benchesCount: Number(benchesCount),
        rows: Number(rows),
        columns: Number(columns),
        seatsPerBench: Number(seatsPerBench),
      });

      return NextResponse.json({
        success: true,
        message: `Successfully generated ${generated.length} student seating allocations for ${hallNumber}.`,
        allocations: generated,
      });
    }

    return NextResponse.json({ error: "Invalid action specified." }, { status: 400 });
  } catch (error: any) {
    console.error("[API: /api/faculty/seating POST] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate seating plan" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId") || "seed-org-001";
    const examinationId = searchParams.get("examinationId");
    const hallNumber = searchParams.get("hallNumber");

    if (!examinationId || !hallNumber) {
      return NextResponse.json(
        { error: "examinationId and hallNumber are required" },
        { status: 400 }
      );
    }

    await db.examSeatingArrangement.deleteMany({
      where: {
        organizationId: orgId,
        examinationId,
        hallNumber,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Cleared seating plan for ${hallNumber}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to clear seating plan" },
      { status: 500 }
    );
  }
}
