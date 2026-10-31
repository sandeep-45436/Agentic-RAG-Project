import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  let url = process.env.DATABASE_URL || "";
  if (url) {
    // Clamp connection_limit to 3 so multiple serverless workers/devices never exhaust Postgres max connections
    if (url.includes("connection_limit=")) {
      url = url.replace(/connection_limit=\d+/, "connection_limit=3");
    } else {
      url += (url.includes("?") ? "&" : "?") + "connection_limit=3";
    }

    if (url.includes("pool_timeout=")) {
      url = url.replace(/pool_timeout=\d+/, "pool_timeout=10");
    } else {
      url += "&pool_timeout=10";
    }

    if (url.includes("connect_timeout=")) {
      url = url.replace(/connect_timeout=\d+/, "connect_timeout=15");
    } else {
      url += "&connect_timeout=15";
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
  prismaWarmedUp: boolean | undefined;
};

export const db = globalForPrisma.prisma ?? prismaClientSingleton();

// Always cache Prisma instance on globalThis across all environments (including production lambdas)
globalForPrisma.prisma = db;

/**
 * Ensures the Prisma connection pool is warmed up once on cold start.
 */
export async function ensureDbConnected(): Promise<void> {
  if (globalForPrisma.prismaWarmedUp) return;
  try {
    await db.$queryRaw`SELECT 1`;
    globalForPrisma.prismaWarmedUp = true;
  } catch (err) {
    console.warn("[DB] Connection warmup warning:", (err as Error).message);
  }
}
