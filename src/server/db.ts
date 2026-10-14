/**
 * Prisma-Client (Singleton). Entwicklung: SQLite über den better-sqlite3-Driver-Adapter.
 * Für PostgreSQL: Provider im Schema umstellen und hier @prisma/adapter-pg verwenden (siehe docs/DECISIONS.md).
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

export function createPrismaClient(url = process.env.DATABASE_URL ?? "file:./prisma/dev.db"): PrismaClient {
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
