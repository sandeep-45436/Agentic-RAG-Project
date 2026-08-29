"use server";

import { db } from "@/server/db/prisma";
import { createClient, createAuthClient } from "@/utils/insforge/server";
import { cookies } from "next/headers";

export async function syncUserToDatabase(departmentCode?: string) {
  try {
    const insforge = await createClient();
    const { data, error } = await insforge.auth.getCurrentUser();

    if (error || !data?.user) {
      return { success: false, error: "Not authenticated" };
    }

    const user = data.user;

    let dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: { memberships: true },
    });

    if (!dbUser) {
      dbUser = await db.user.create({
        data: {
          id: user.id,
          email: user.email!,
          name: user.profile?.name || user.email?.split("@")[0] || "User",
        },
        include: { memberships: true },
      });
    }

    // Ensure user has a membership in primary university organization (seed-org-001)
    const seedOrg = await db.organization.findUnique({
      where: { id: "seed-org-001" },
    });

    if (seedOrg) {
      const existingMembership = await db.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: dbUser.id,
            organizationId: seedOrg.id,
          },
        },
      });

      if (!existingMembership) {
        await db.membership.create({
          data: { userId: dbUser.id, organizationId: seedOrg.id, role: "MEMBER" },
        }).catch(() => {});
      }

      // Resolve requested or default department
      const targetDeptCode = departmentCode?.trim() || "CS";
      let targetDept = await db.department.findFirst({
        where: {
          organizationId: seedOrg.id,
          OR: [
            { code: { equals: targetDeptCode, mode: "insensitive" } },
            { code: targetDeptCode === "CS" ? "CSE" : targetDeptCode },
          ],
          deletedAt: null,
        },
      });

      if (!targetDept) {
        targetDept = await db.department.findFirst({
          where: { organizationId: seedOrg.id, deletedAt: null },
        });
      }

      if (targetDept) {
        const existingStudent = await db.student.findFirst({
          where: {
            OR: [{ userId: dbUser.id }, { id: dbUser.id }],
          },
        });

        if (existingStudent) {
          // If department changed or specified, update it
          if (departmentCode && existingStudent.departmentId !== targetDept.id) {
            await db.student.update({
              where: { id: existingStudent.id },
              data: {
                departmentId: targetDept.id,
                major: targetDept.name,
              },
            });
          }
        } else {
          await db.student.create({
            data: {
              userId: dbUser.id,
              organizationId: seedOrg.id,
              departmentId: targetDept.id,
              studentNumber: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
              major: targetDept.name,
              academicStatus: "Good Standing",
              gpa: 3.85,
            },
          }).catch(() => {});
        }
      }
    }

    if (dbUser.memberships.length === 0) {
      const org = await db.organization.create({
        data: { name: `${dbUser.name}'s Organization` },
      });
      await db.membership.create({
        data: { userId: dbUser.id, organizationId: org.id, role: "OWNER" },
      });
    }

    return { success: true };
  } catch (err) {
    console.error("Database sync failed:", err);
    return { success: true, error: "Database sync skipped" };
  }
}

export async function loginAction(formData: { email: string; password: string; departmentCode?: string }) {
  try {
    const authClient = await createAuthClient();
    const { error } = await authClient.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) return { success: false, error: error.message };

    const cookieStore = await cookies();
    if (formData.departmentCode) {
      cookieStore.set("student_department", formData.departmentCode, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
      });
    }

    await syncUserToDatabase(formData.departmentCode);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to sign in" };
  }
}

export async function signupAction(formData: {
  email: string;
  password: string;
  fullName: string;
  departmentCode?: string;
}) {
  try {
    const authClient = await createAuthClient();
    const { data, error } = await authClient.signUp({
      email: formData.email,
      password: formData.password,
      name: formData.fullName,
    });

    if (error) return { success: false, error: error.message };

    const cookieStore = await cookies();
    if (formData.departmentCode) {
      cookieStore.set("student_department", formData.departmentCode, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
      });
    }

    if (data?.requireEmailVerification) {
      return {
        success: true,
        requireVerification: true,
        message: "A 6-digit verification code has been sent to your email.",
      };
    }

    await syncUserToDatabase(formData.departmentCode);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to sign up" };
  }
}

export async function verifyEmailAction(formData: { email: string; otp: string }) {
  try {
    const authClient = await createAuthClient();
    const { error } = await authClient.verifyEmail({
      email: formData.email,
      otp: formData.otp,
    });

    if (error) return { success: false, error: error.message };

    const cookieStore = await cookies();
    const deptCookie = cookieStore.get("student_department")?.value;

    await syncUserToDatabase(deptCookie);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to verify email" };
  }
}

export async function logoutAction() {
  try {
    const insforge = await createClient();
    await insforge.auth.signOut();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to sign out" };
  }
}

export const signOutAction = logoutAction;

export async function getCurrentUserRoleAction() {
  try {
    const insforge = await createClient();
    const { data } = await insforge.auth.getCurrentUser();
    if (!data?.user) return { role: "MEMBER", isFacultyOrAdmin: false };

    const membership = await db.membership.findFirst({
      where: { userId: data.user.id },
    });

    const role = membership?.role || "MEMBER";
    const isFacultyOrAdmin = ["OWNER", "ADMIN", "FACULTY", "DEAN"].includes(role.toUpperCase());

    return { role, isFacultyOrAdmin };
  } catch {
    return { role: "MEMBER", isFacultyOrAdmin: false };
  }
}
