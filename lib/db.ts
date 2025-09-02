import { PrismaClient } from "@prisma/client";

// Ensure a single PrismaClient across HMR in dev
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildDatasourceUrl(base?: string): string | undefined {
  if (!base) return undefined;
  try {
    const u = new URL(base);
    // If using Neon, prefer the pooled connection and require SSL.
    // This reduces intermittent connection resets (P1017) during dev.
    const isNeon = /neon\.tech$/i.test(u.hostname) || /neon\.tech$/i.test(u.host);
    if (isNeon) {
      // If not already pointing at the pooler host, switch subdomain to pooled if present.
      // Many Neon URLs come in two forms; we only append safe query params here.
      const params = u.searchParams;
      if (!params.has("sslmode")) params.set("sslmode", "require");
      // Keep connection count conservative in dev to avoid hitting limits.
      if (!params.has("connection_limit")) params.set("connection_limit", process.env.NODE_ENV === "production" ? "10" : "1");
      // Hint for PgBouncer-style pooling
      if (!params.has("pgbouncer")) params.set("pgbouncer", "true");
      u.search = params.toString();
      return u.toString();
    }
    return base;
  } catch {
    return base;
  }
}

const datasourceUrl = buildDatasourceUrl(process.env.DATABASE_URL);

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: datasourceUrl ? { db: { url: datasourceUrl } } : undefined,
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
