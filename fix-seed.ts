import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import pg from "pg"
import { seedUserFinancialData } from "./src/lib/seed.js"

const connectionString = "postgresql://neondb_owner:npg_GshdDnLY1IO6@ep-noisy-lake-azen9p04-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
const pool = new pg.Pool({ 
  connectionString,
  ssl: connectionString?.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined
})
const adapter = new PrismaPg(pool)
const db = new PrismaClient({ adapter })

// Mock global db so seed can use it
;(globalThis as any).prisma = db;

async function run() {
  try {
    const user = await db.user.findFirst()
    if (!user) {
      console.log("No user found")
      return
    }
    console.log("Seeding data for user:", user.id)
    
    // We need to pass the transaction client or the global db will be used by seed
    // wait, seedUserFinancialData imports { db } from "@/lib/db" which will use the local env file database url.
    // Instead of importing it, I will just write a standalone script to insert the categories.
  } catch (err) {
    console.error("Error:", err)
  } finally {
    await db.$disconnect()
    await pool.end()
  }
}
run()
