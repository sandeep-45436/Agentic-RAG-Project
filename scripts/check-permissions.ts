import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { db } from "../src/server/db/prisma";

async function grantPermissions() {
  try {
    console.log("Granting permissions on schema public...");
    await db.$executeRawUnsafe(`GRANT ALL ON SCHEMA public TO postgres;`);
    await db.$executeRawUnsafe(`GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;`);
    await db.$executeRawUnsafe(`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;`);
    await db.$executeRawUnsafe(`GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres;`);
    await db.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;`);
    await db.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;`);
    
    // Also grant to public
    await db.$executeRawUnsafe(`GRANT USAGE, CREATE ON SCHEMA public TO PUBLIC;`);
    await db.$executeRawUnsafe(`GRANT ALL ON ALL TABLES IN SCHEMA public TO PUBLIC;`);

    console.log("Permissions successfully granted!");

    // Now test inserting a conversation
    const user = await db.user.findFirst();
    if (user) {
      const conv = await db.conversation.create({
        data: {
          userId: user.id,
          organizationId: "seed-org-001",
          title: "Permission Test Conversation",
        },
      });
      console.log("Successfully created conversation:", conv.id);
      await db.conversation.delete({ where: { id: conv.id } });
      console.log("Successfully deleted test conversation.");
    }
  } catch (err: any) {
    console.error("Grant error:", err);
  } finally {
    await db.$disconnect();
  }
}

grantPermissions();
