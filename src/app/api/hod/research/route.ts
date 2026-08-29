import { NextResponse } from "next/server";
import { db } from "@/server/db/prisma";
import { AuditService } from "@/server/services/audit.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentCode = searchParams.get("department") || "CS";
    const isAll = departmentCode === "ALL";

    let projects = await db.researchProject.findMany({
      where: { deletedAt: null },
      include: {
        leadFaculty: {
          include: { user: true, department: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (projects.length === 0) {
      const org = await db.organization.findFirst();
      const orgId = org?.id || "seed-org-001";
      const faculty = await db.faculty.findMany({ where: { deletedAt: null } });

      if (faculty.length > 0) {
        const defaults = [
          {
            title: "Agentic Cognitive Architectures for Multimodal University RAG",
            leadFacultyId: faculty[0].id,
            grantAmount: 85000.0,
            status: "Active",
            abstract: "Investigation of hybrid vector retrieval, BM25 keyword fusion, and deterministic agentic planners in higher education governance.",
          },
          {
            title: "Distributed Fault-Tolerant Raft Consensus in Low-Latency Clouds",
            leadFacultyId: faculty[faculty.length > 1 ? 1 : 0].id,
            grantAmount: 55000.0,
            status: "Active",
            abstract: "Exploration of leader election, asynchronous commit pipelines, and network partition resiliency.",
          },
          {
            title: "Numerical Optimization in Sparse Graph Embeddings",
            leadFacultyId: faculty[faculty.length > 2 ? 2 : 0].id,
            grantAmount: 40000.0,
            status: "Completed",
            abstract: "Sparse matrix decomposition and hypergraph topological clustering algorithms.",
          },
        ];

        projects = await Promise.all(
          defaults.map((d) =>
            db.researchProject.create({
              data: { organizationId: orgId, ...d },
              include: { leadFaculty: { include: { user: true, department: true } } },
            })
          )
        );
      }
    }

    if (!isAll) {
      projects = projects.filter(
        (p) => !p.leadFaculty?.department?.code || p.leadFaculty.department.code === departmentCode
      );
    }

    const formatted = projects.map((p) => ({
      id: p.id,
      title: p.title,
      pi: p.leadFaculty?.user?.name || p.leadFaculty?.facultyCode || "Faculty PI",
      piFacultyId: p.leadFacultyId,
      grantAmount: `$${p.grantAmount.toLocaleString()}`,
      grantRaw: p.grantAmount,
      agency: "National Science & AI Foundation / Industry Grant",
      status: p.status.toUpperCase(),
      progress: p.status === "Completed" ? "Completed 2026" : "Year 2 of 3",
      papers: p.status === "Completed" ? 4 : 2,
      abstract: p.abstract,
      departmentCode: p.leadFaculty?.department?.code || departmentCode,
    }));

    return NextResponse.json({ success: true, projects: formatted });
  } catch (error: any) {
    console.error("[API: /api/hod/research GET] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to load research grants" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, leadFacultyId, grantAmount = 50000, abstract, departmentCode = "CS", actorName = "HOD" } = body;

    if (!title || !leadFacultyId) {
      return NextResponse.json({ error: "Title and leadFacultyId (Principal Investigator) are required." }, { status: 400 });
    }

    const org = await db.organization.findFirst();
    const organizationId = org?.id || "seed-org-001";

    const project = await db.researchProject.create({
      data: {
        organizationId,
        title,
        leadFacultyId,
        grantAmount: parseFloat(grantAmount) || 50000.0,
        abstract: abstract || "Sponsored academic research initiative",
        status: "Active",
      },
      include: { leadFaculty: { include: { user: true } } },
    });

    await AuditService.log({
      action: "RESEARCH_PROJECT_CREATED",
      actorName,
      departmentCode,
      entityType: "RESEARCH",
      entityId: project.id,
      entityName: project.title,
      newState: { title: project.title, pi: project.leadFaculty?.user?.name, grantAmount: project.grantAmount, status: "Active" },
      reason: "HOD approved and registered new sponsored research grant project",
      policyCitation: "University Research Directive 3.2: Sponsored grant governance and financial oversight",
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("[API: /api/hod/research POST] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create research project" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { projectId, title, grantAmount, status, abstract, departmentCode = "CS", actorName = "HOD", reason = "Research project milestone update" } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required." }, { status: 400 });
    }

    const prev = await db.researchProject.findUnique({ where: { id: projectId } });

    const updated = await db.researchProject.update({
      where: { id: projectId },
      data: {
        ...(title ? { title } : {}),
        ...(grantAmount ? { grantAmount: parseFloat(grantAmount) } : {}),
        ...(status ? { status } : {}),
        ...(abstract ? { abstract } : {}),
      },
    });

    await AuditService.log({
      action: "RESEARCH_PROJECT_UPDATED",
      actorName,
      departmentCode,
      entityType: "RESEARCH",
      entityId: updated.id,
      entityName: updated.title,
      previousState: prev ? { grantAmount: prev.grantAmount, status: prev.status } : null,
      newState: { grantAmount: updated.grantAmount, status: updated.status },
      reason,
      policyCitation: "University Research Directive 4.1",
    });

    return NextResponse.json({ success: true, project: updated });
  } catch (error: any) {
    console.error("[API: /api/hod/research PUT] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update research project" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const departmentCode = searchParams.get("department") || "CS";
    const actorName = searchParams.get("actorName") || "HOD";

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required." }, { status: 400 });
    }

    const project = await db.researchProject.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    // Soft delete / archive
    await db.researchProject.update({
      where: { id: projectId },
      data: { deletedAt: new Date(), status: "Archived" },
    });

    await AuditService.log({
      action: "RESEARCH_PROJECT_ARCHIVED",
      actorName,
      departmentCode,
      entityType: "RESEARCH",
      entityId: project.id,
      entityName: project.title,
      previousState: { status: project.status },
      newState: { status: "ARCHIVED", deletedAt: new Date().toISOString() },
      reason: "HOD concluded and archived research grant project",
      policyCitation: "Research Governance Code Section 7",
    });

    return NextResponse.json({ success: true, message: `Project ${project.title} safely archived with audit record preserved.` });
  } catch (error: any) {
    console.error("[API: /api/hod/research DELETE] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete research project" }, { status: 500 });
  }
}
