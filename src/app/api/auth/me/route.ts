import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const facultyCookie = cookieStore.get("faculty_session");
    if (facultyCookie?.value) {
      try {
        const facultyUser = JSON.parse(facultyCookie.value);
        if (facultyUser) {
          return NextResponse.json({
            user: {
              id: facultyUser.userId || facultyUser.id,
              email: facultyUser.email || "faculty@alits.ac.in",
              name: facultyUser.name || "Faculty Member",
              role: facultyUser.role || "FACULTY",
            },
          });
        }
      } catch {}
    }

    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    const user = userData?.user;

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Look up db user or student record for consistent display name
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        studentRecord: { select: { id: true, studentNumber: true } }
      }
    });

    const studentName = dbUser?.name || user.profile?.name || (user as any).name || user.email?.split("@")[0] || "Student Scholar";

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: studentName,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ user: null, error: err?.message }, { status: 200 });
  }
}
