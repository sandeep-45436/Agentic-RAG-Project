import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FacultyService } from "@/server/services/faculty.service";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let cookieStore: any = null;
    let sessionCookie: any = null;

    try {
      cookieStore = await cookies();
      sessionCookie = cookieStore.get("faculty_session");
    } catch (cookieErr) {
      console.warn("[API: /api/faculty/auth/session] cookies() context:", cookieErr);
    }

    let parsedSession: any = null;
    if (sessionCookie?.value) {
      try {
        parsedSession = JSON.parse(sessionCookie.value);
      } catch {}
    }

    // 1. If active faculty session cookie exists, verify and return profile
    if (parsedSession && parsedSession.id) {
      let profile: any = null;
      try {
        profile = await FacultyService.getFacultyProfile(parsedSession.id);
      } catch (dbErr) {
        console.warn("[API: /api/faculty/auth/session] DB profile fetch fallback:", dbErr);
      }

      return NextResponse.json({
        authenticated: true,
        faculty: parsedSession,
        profile: profile || parsedSession,
      });
    }

    // 2. Check InsForge Auth user (Single Sign-On fallback)
    try {
      const insforge = await createClient();
      const { data: userData } = await insforge.auth.getCurrentUser();
      if (userData?.user) {
        const facultyRecord = await db.faculty.findFirst({
          where: {
            OR: [
              { userId: userData.user.id },
              { user: { email: userData.user.email } },
            ],
            deletedAt: null,
          },
          include: { user: true, department: true },
        });

        if (facultyRecord) {
          const facultySession = {
            id: facultyRecord.id,
            userId: facultyRecord.userId,
            name: facultyRecord.user?.name || userData.user.profile?.name || "Faculty Member",
            email: facultyRecord.user?.email || userData.user.email || "",
            facultyCode: facultyRecord.facultyCode || `FAC-${facultyRecord.id.slice(0, 6).toUpperCase()}`,
            title: facultyRecord.title || "Professor",
            designation: facultyRecord.designation || facultyRecord.title || "Faculty Member",
            specialization: facultyRecord.specialization || "Academic & Research",
            departmentId: facultyRecord.departmentId,
            departmentCode: facultyRecord.department?.code || "CSE",
            departmentName: facultyRecord.department?.name || "Computer Science & Engineering",
            organizationId: facultyRecord.organizationId,
          };

          if (cookieStore) {
            try {
              cookieStore.set("faculty_session", JSON.stringify(facultySession), {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 7,
                path: "/",
              });
            } catch {}
          }

          const profile = await FacultyService.getFacultyProfile(facultyRecord.id);

          return NextResponse.json({
            authenticated: true,
            faculty: facultySession,
            profile: profile || facultySession,
          });
        }
      }
    } catch (ssoErr) {
      console.warn("[API: /api/faculty/auth/session] SSO lookup:", ssoErr);
    }

    // 3. Fallback to default faculty member (Prof. John Smith - FAC-CS-001) for seamless dashboard preview
    const defaultFaculty = await db.faculty.findFirst({
      where: { deletedAt: null },
      orderBy: { facultyCode: "asc" },
      include: { user: true, department: true },
    });

    if (defaultFaculty) {
      const facultySession = {
        id: defaultFaculty.id,
        userId: defaultFaculty.userId,
        name: defaultFaculty.user?.name || "Prof. John Smith",
        email: defaultFaculty.user?.email || "prof.smith@smartuniversity.edu",
        facultyCode: defaultFaculty.facultyCode || "FAC-CS-001",
        title: defaultFaculty.title || "Professor",
        designation: defaultFaculty.designation || "Professor & Chair",
        specialization: defaultFaculty.specialization || "Algorithms & Cognitive Intelligence",
        departmentId: defaultFaculty.departmentId,
        departmentCode: defaultFaculty.department?.code || "CS",
        departmentName: defaultFaculty.department?.name || "Computer Science",
        organizationId: defaultFaculty.organizationId,
      };

      if (cookieStore) {
        try {
          cookieStore.set("faculty_session", JSON.stringify(facultySession), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
          });
        } catch {}
      }

      const profile = await FacultyService.getFacultyProfile(defaultFaculty.id);

      return NextResponse.json({
        authenticated: true,
        faculty: facultySession,
        profile: profile || facultySession,
      });
    }

    return NextResponse.json({ authenticated: false, faculty: null }, { status: 200 });
  } catch (error: any) {
    console.error("[API: /api/faculty/auth/session] Error:", error);
    return NextResponse.json(
      { authenticated: false, faculty: null, error: error.message || "Failed to fetch session" },
      { status: 200 }
    );
  }
}
