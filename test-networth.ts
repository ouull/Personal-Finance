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

    const accounts = await db.account.findMany({ where: { userId } })
    console.log("Accounts:", accounts)
    const totalCash = accounts.reduce((sum: number, acc: any) => sum + Number(acc.balance), 0)
    console.log("Total cash:", totalCash)

    const loans = await db.loan.findMany({
      where: { userId, status: { in: ["OUTSTANDING", "PARTIALLY_PAID", "OVERDUE"] } },
      include: { repayments: true }
    })
    console.log("Loans:", loans)
    const totalReceivables = loans.reduce((sum: number, loan: any) => {
      const repaid = loan.repayments.reduce((rSum: number, r: any) => rSum + Number(r.amount), 0)
      return sum + (Number(loan.amount) - repaid)
    }, 0)
    console.log("Total receivables:", totalReceivables)

    const investments = await db.investment.findMany({
      where: { userId, status: "ACTIVE" }
    })
    console.log("Investments:", investments)
    const totalInvestments = investments.reduce((sum: number, inv: any) => sum + Number(inv.currentValue), 0)
    
    console.log("Total Net Worth:", totalCash + totalReceivables + totalInvestments)
  } catch (err) {
    console.error("Error:", err)
  } finally {
    await db.$disconnect()
    await pool.end()
  }
}

run()
