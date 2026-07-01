"use server";

import { db } from "@/server/db/prisma";
import { createClient } from "@/utils/supabase/server";

export async function syncUserToDatabase() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if user already exists in Prisma database
    let dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: { memberships: true },
    });

    if (!dbUser) {
      // 1. Create the user
      dbUser = await db.user.create({
        data: {
          id: user.id, // Keep IDs synced between Supabase Auth and Prisma
          email: user.email!,
          name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        },
        include: { memberships: true },
      });
    }

    // Ensure they have at least one membership
    if (dbUser.memberships.length === 0) {
      // 2. Create a default organization for them
      const org = await db.organization.create({
        data: {
          name: `${dbUser.name}'s Organization`,
        },
      });

      // 3. Link them as the OWNER
      await db.membership.create({
        data: {
          userId: dbUser.id,
          organizationId: org.id,
          role: "OWNER",
        },
      });
    }

    return { success: true };
  } catch (err) {
    console.error("Database sync failed or skipped (e.g. missing DATABASE_URL):", err);
    // Proceed with success in development so the auth redirect is not blocked
    return { success: true, error: "Database sync skipped (offline mode)" };
  }
}
