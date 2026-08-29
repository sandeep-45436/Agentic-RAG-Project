import { NextResponse } from "next/server";
import { db } from "@/server/db/prisma";
import { AuditService } from "@/server/services/audit.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentCode = searchParams.get("department") || "CS";

    let facilities = await db.facility.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });

    if (facilities.length === 0) {
      const org = await db.organization.findFirst();
      const orgId = org?.id || "seed-org-001";
      const defaults = [
        { name: "Tech Hall 101", building: "Tech Hall", roomNumber: "101", capacity: 40, facilityType: "Lecture Hall (Tiered)" },
        { name: "Computer Science Advanced AI Lab", building: "Tech Hall", roomNumber: "Lab 3", capacity: 35, facilityType: "High-Performance Laboratory" },
        { name: "Science Block 201", building: "Science Block", roomNumber: "201", capacity: 35, facilityType: "Lecture Hall" },
        { name: "Main Auditorium A", building: "Central Block", roomNumber: "Aud-A", capacity: 120, facilityType: "Auditorium" },
      ];

      facilities = await Promise.all(
        defaults.map((d) =>
          db.facility.create({
            data: { organizationId: orgId, ...d },
          })
        )
      );
    }

    const formatted = facilities.map((fac, idx) => ({
      id: fac.id,
      name: fac.name,
      building: fac.building,
      roomNumber: fac.roomNumber,
      type: fac.facilityType,
      capacity: fac.capacity,
      utilization: idx === 0 ? "85%" : idx === 1 ? "92%" : idx === 2 ? "70%" : "45%",
      status: "OPERATIONAL",
      features:
        fac.facilityType.includes("Lab")
          ? "High-Speed Fiber, Workstations, Interactive Smartboards"
          : "Laser Projector, Mic System, RAG Camera Feed",
    }));

    return NextResponse.json({ success: true, facilities: formatted });
  } catch (error: any) {
    console.error("[API: /api/hod/facilities GET] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to load facilities" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, building, roomNumber, capacity = 40, facilityType = "Lecture Hall", departmentCode = "CS", actorName = "HOD" } = body;

    if (!name || !building || !roomNumber) {
      return NextResponse.json({ error: "Name, building, and roomNumber are required." }, { status: 400 });
    }

    const org = await db.organization.findFirst();
    const organizationId = org?.id || "seed-org-001";

    const facility = await db.facility.create({
      data: {
        organizationId,
        name,
        building,
        roomNumber,
        capacity: parseInt(capacity, 10) || 40,
        facilityType,
      },
    });

    await AuditService.log({
      action: "FACILITY_CREATED",
      actorName,
      departmentCode,
      entityType: "FACILITY",
      entityId: facility.id,
      entityName: facility.name,
      newState: { name: facility.name, building: facility.building, room: facility.roomNumber, capacity: facility.capacity, type: facility.facilityType },
      reason: "HOD commissioned new physical lab / lecture hall infrastructure",
      policyCitation: "Campus Facilities Infrastructure Standard 2.4: Physical space compliance and capacity certification",
    });

    return NextResponse.json({ success: true, facility });
  } catch (error: any) {
    console.error("[API: /api/hod/facilities POST] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create facility" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { facilityId, name, building, roomNumber, capacity, facilityType, departmentCode = "CS", actorName = "HOD", reason = "Facility specification update" } = body;

    if (!facilityId) {
      return NextResponse.json({ error: "facilityId is required." }, { status: 400 });
    }

    const prev = await db.facility.findUnique({ where: { id: facilityId } });

    const updated = await db.facility.update({
      where: { id: facilityId },
      data: {
        ...(name ? { name } : {}),
        ...(building ? { building } : {}),
        ...(roomNumber ? { roomNumber } : {}),
        ...(capacity ? { capacity: parseInt(capacity, 10) } : {}),
        ...(facilityType ? { facilityType } : {}),
      },
    });

    await AuditService.log({
      action: "FACILITY_UPDATED",
      actorName,
      departmentCode,
      entityType: "FACILITY",
      entityId: updated.id,
      entityName: updated.name,
      previousState: prev ? { name: prev.name, capacity: prev.capacity, type: prev.facilityType } : null,
      newState: { name: updated.name, capacity: updated.capacity, type: updated.facilityType },
      reason,
      policyCitation: "Infrastructure Standard 3.1",
    });

    return NextResponse.json({ success: true, facility: updated });
  } catch (error: any) {
    console.error("[API: /api/hod/facilities PUT] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update facility" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId");
    const departmentCode = searchParams.get("department") || "CS";
    const actorName = searchParams.get("actorName") || "HOD";

    if (!facilityId) {
      return NextResponse.json({ error: "facilityId is required." }, { status: 400 });
    }

    const facility = await db.facility.findUnique({ where: { id: facilityId } });
    if (!facility) {
      return NextResponse.json({ error: "Facility not found." }, { status: 404 });
    }

    // Soft delete / decommission
    await db.facility.update({
      where: { id: facilityId },
      data: { deletedAt: new Date() },
    });

    await AuditService.log({
      action: "FACILITY_DECOMMISSIONED",
      actorName,
      departmentCode,
      entityType: "FACILITY",
      entityId: facility.id,
      entityName: facility.name,
      previousState: { status: "OPERATIONAL" },
      newState: { status: "DECOMMISSIONED", deletedAt: new Date().toISOString() },
      reason: "HOD decommissioned facility for maintenance or space reallocation",
      policyCitation: "Campus Facilities Infrastructure Standard 5.2",
    });

    return NextResponse.json({ success: true, message: `Facility ${facility.name} decommissioned safely with audit trail preservation.` });
  } catch (error: any) {
    console.error("[API: /api/hod/facilities DELETE] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete facility" }, { status: 500 });
  }
}
