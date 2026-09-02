import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  let url = process.env.DATABASE_URL || "";
  if (url) {
    // Clamp connection_limit to 5 so serverless workers never exhaust the database's 30 max connections limit
    if (url.includes("connection_limit=")) {
      url = url.replace(/connection_limit=\d+/, "connection_limit=5");
    } else {
      url += (url.includes("?") ? "&" : "?") + "connection_limit=5";
    }
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    datasourceUrl: url || undefined,
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const db = globalForPrisma.prisma ?? prismaClientSingleton();

// Always cache Prisma instance on globalThis across all environments (including production lambdas)
globalForPrisma.prisma = db;

/**
 * Ensures the Prisma connection pool is warmed up.
 * Call this before running queries on cold starts.
 */
export async function ensureDbConnected(): Promise<void> {
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      await db.$queryRaw`SELECT 1`;
      return;
    } catch (err) {
      console.warn(`[DB] Connection attempt ${i + 1}/${maxRetries} failed:`, (err as Error).message);
      if (i < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }
}
