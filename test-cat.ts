import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import pg from "pg"

const connectionString = "postgresql://neondb_owner:npg_GshdDnLY1IO6@ep-noisy-lake-azen9p04-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
const pool = new pg.Pool({ 
  connectionString,
  ssl: connectionString?.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined
})
const adapter = new PrismaPg(pool)
const db = new PrismaClient({ adapter })

async function run() {
  try {
    const user = await db.user.findFirst()
    if (!user) {
      console.log("No user")
      return
    }
    const userId = user.id
    console.log("User ID:", userId)

    const cats = await db.category.findMany({ where: { userId } })
    console.log("Categories count:", cats.length)
  } catch (err) {
    console.error("Error:", err)
  } finally {
    await db.$disconnect()
    await pool.end()
  }
}

run()
