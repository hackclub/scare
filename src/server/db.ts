import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "~/env";
import { pgConnectionString } from "~/lib/database-url";
import { PrismaClient } from "../../generated/prisma";

// Connect through node-postgres rather than Prisma's own engine, which can't do TLS 1.3 on macOS.
const createPrismaClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: pgConnectionString(env.DATABASE_URL),
    }),
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
