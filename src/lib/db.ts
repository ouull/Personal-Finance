import pg from "pg"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || (() => {
  const connectionString = process.env.DATABASE_URL
  const pool = new pg.Pool({ 
    connectionString,
    ssl: connectionString?.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
})()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
