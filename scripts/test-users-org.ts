import { db } from "@/server/db/prisma";

async function main() {
  const users = await db.user.findMany();
  console.log("=== USERS ===");
  console.log(JSON.stringify(users, null, 2));

  const memberships = await db.membership.findMany({
    include: { user: true, organization: true },
  });
  console.log("=== MEMBERSHIPS ===");
  console.log(JSON.stringify(memberships, null, 2));
}

main()
  .catch((e) => console.error("Error:", e))
  .finally(() => process.exit(0));
