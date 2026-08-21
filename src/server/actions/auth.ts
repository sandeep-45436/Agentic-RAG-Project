"use server";

import { db } from "@/server/db/prisma";
import { createClient, createAuthClient } from "@/utils/insforge/server";
import { headers } from "next/headers";

export async function syncUserToDatabase() {
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

export async function loginAction(formData: { email: string; password: string }) {
  try {
    const authClient = await createAuthClient();
    const { error } = await authClient.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) return { success: false, error: error.message };

    await syncUserToDatabase();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to sign in" };
  }
}

export async function signupAction(formData: {
  email: string;
  password: string;
  fullName: string;
}) {
  try {
    const authClient = await createAuthClient();
    const { data, error } = await authClient.signUp({
      email: formData.email,
      password: formData.password,
      name: formData.fullName,
    });

    if (error) return { success: false, error: error.message };

    if (data?.requireEmailVerification) {
      return {
        success: true,
        requireVerification: true,
        message: "A 6-digit verification code has been sent to your email.",
      };
    }

    await syncUserToDatabase();
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

    await syncUserToDatabase();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to verify email" };
  }
}

export async function resendVerificationAction(formData: { email: string }) {
  try {
    const insforge = await createClient();
    const { error } = await (insforge.auth as any).resendVerificationEmail({
      email: formData.email,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to resend code" };
  }
}

export async function signOutAction() {
  try {
    const authClient = await createAuthClient();
    await authClient.signOut();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to sign out" };
  }
}

export async function getCurrentUserRoleAction() {
  try {
    const insforge = await createClient();
    const { data } = await insforge.auth.getCurrentUser();
    if (!data?.user) return { role: "STUDENT", isFacultyOrAdmin: false };

    const mem = await db.membership.findFirst({
      where: { userId: data.user.id },
      orderBy: { createdAt: "desc" },
    });

    const role = mem?.role || "STUDENT";
    const isFacultyOrAdmin = ["OWNER", "ADMIN", "FACULTY", "DEAN", "ADVISOR"].includes(role);

    return { role, isFacultyOrAdmin };
  } catch (err) {
    return { role: "STUDENT", isFacultyOrAdmin: false };
  }
}
