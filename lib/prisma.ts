import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";
import { ensureStarterDatabase } from "./starterDbBackup";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl(): string {
  // If external database is configured (e.g., PostgreSQL or Supabase)
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:")) {
    return process.env.DATABASE_URL;
  }

  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NETLIFY
  );

  if (isServerless) {
    const tmpDbPath = path.join("/tmp", "dev.db");
    ensureStarterDatabase(tmpDbPath);
    return `file:${tmpDbPath}`;
  }

  // Local development
  const localDb = path.resolve(process.cwd(), "prisma", "dev.db").replace(/\\/g, "/");
  ensureStarterDatabase(localDb);
  return `file:${localDb}`;
}

const dbUrl = getDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
