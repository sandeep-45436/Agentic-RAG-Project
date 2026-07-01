import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Testing database connection to:", process.env.DATABASE_URL);
  const start = Date.now();
  try {
    const users = await prisma.user.findMany({ take: 1 });
    console.log("Successfully queried database! Found users count:", users.length);
    console.log(`Query took ${Date.now() - start}ms`);
  } catch (error) {
    console.error("Database query failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
