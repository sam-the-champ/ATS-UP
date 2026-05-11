import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";

// Singleton pattern to prevent multiple PrismaClient instances
let db: PrismaClient;

if (process.env.NODE_ENV === "production") {
  db = new PrismaClient({
    adapter: new PrismaPg(env.DATABASE_URL),
  });
} else {
  // In development, check if we already have a global instance to avoid reconnects on hot reload
  if (!(global as any).prismaDb) {
    (global as any).prismaDb = new PrismaClient({
      adapter: new PrismaPg(env.DATABASE_URL),
      errorFormat: 'pretty',
    });
  }
  db = (global as any).prismaDb;
}

export { db };