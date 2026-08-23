"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function getUserId() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  return session.user.id
}

export async function getInvestments() {
  try {
    const userId = await getUserId()
    const investments = await db.investment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        transactions: true
      }
    })

    const serializedInvestments = investments.map((inv: any) => ({
      ...inv,
      totalInvested: Number(inv.totalInvested),
      currentValue: Number(inv.currentValue),
      realizedGain: Number(inv.realizedGain),
      transactions: inv.transactions.map((t: any) => ({
        ...t,
        amount: Number(t.amount)
      }))
    }))

    return { success: true, data: serializedInvestments }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    return { success: false, error: "Failed to fetch investments" }
  }
}

export async function createInvestment(data: {
  name: string
  type: string
  platform?: string
  notes?: string
}) {
  try {
    const userId = await getUserId()
    
    await db.investment.create({
      data: {
        userId,
        name: data.name,
        type: data.type,
        platform: data.platform,
        notes: data.notes,
        status: "ACTIVE"
      }
    })

    revalidatePath("/")
    revalidatePath("/investments")
    
    return { success: true }
  } catch (error: any) {
    console.error("Create investment error:", error)
    return { success: false, error: "Failed to create investment" }
  }
}

export async function updateInvestmentValue(id: string, newValue: number) {
  try {
    const userId = await getUserId()
    const inv = await db.investment.findUnique({ where: { id } })
    if (!inv || inv.userId !== userId) throw new Error("Unauthorized investment")

    await db.investment.update({
      where: { id },
      data: { currentValue: newValue }
    })

    revalidatePath("/")
    revalidatePath("/investments")
    
    return { success: true }
  } catch (error: any) {
    console.error("Update value error:", error)
    return { success: false, error: "Failed to update investment value" }
  }
}

export async function addInvestmentTransaction(data: {
  investmentId: string
  accountId?: string
  type: string // BUY, SELL, DEPOSIT, WITHDRAW, DIVIDEND, INTEREST, FEE
  amount: number
  date: Date
  notes?: string
}) {
  try {
    const userId = await getUserId()

    await db.$transaction(async (tx: any) => {
      const inv = await tx.investment.findUnique({ where: { id: data.investmentId } })
      if (!inv || inv.userId !== userId) throw new Error("Unauthorized investment")

      if (data.accountId) {
        const acc = await tx.account.findUnique({ where: { id: data.accountId } })
        if (!acc || acc.userId !== userId) throw new Error("Unauthorized account")
      }

      // 1. Create transaction
      await tx.investmentTransaction.create({
        data: {
          investmentId: data.investmentId,
          accountId: data.accountId,
          type: data.type,
          amount: data.amount,
          date: data.date,
          notes: data.notes,
        }
      })

      // 2. Update investment totals
      if (data.type === "BUY" || data.type === "DEPOSIT") {
        await tx.investment.update({
          where: { id: data.investmentId },
          data: { 
            totalInvested: { increment: data.amount },
            currentValue: { increment: data.amount } 
          }
        })
        if (data.accountId) {
          await tx.account.update({
            where: { id: data.accountId },
            data: { balance: { decrement: data.amount } }
          })
        }
      } else if (data.type === "SELL" || data.type === "WITHDRAW") {
        // Proportional cost-basis allocation for SELL
        const cv = Number(inv.currentValue)
        const totalInv = Number(inv.totalInvested)
        
        let saleRatio = 0
        if (cv > 0) {
          saleRatio = data.amount / cv
          if (saleRatio > 1) saleRatio = 1 // Cap at 100% sale if they sell for more than current value
        } else {
          // If current value is 0 but they sell, it's 100% gain with 0 cost basis
          saleRatio = 0
        }
        
        // If it's a full sale or amount is equal to current value
        if (data.amount >= cv) {
           const realizedGain = data.amount - totalInv
           await tx.investment.update({
             where: { id: data.investmentId },
             data: {
               totalInvested: 0,
               currentValue: 0,
               realizedGain: { increment: realizedGain },
               status: "SOLD"
             }
           })
        } else {
           const costBasisReduced = totalInv * saleRatio
           const realizedGain = data.amount - costBasisReduced
           await tx.investment.update({
             where: { id: data.investmentId },
             data: {
               totalInvested: { decrement: costBasisReduced },
               currentValue: { decrement: data.amount },
               realizedGain: { increment: realizedGain }
             }
           })
        }

        if (data.accountId) {
          await tx.account.update({
            where: { id: data.accountId },
            data: { balance: { increment: data.amount } }
          })
        }
      }
    })

    revalidatePath("/")
    revalidatePath("/investments")

    return { success: true }
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.startsWith("Unauthorized ")) {
      return { success: false, error: "Unauthorized" }
    }
    console.error("Add investment tx error:", error)
    return { success: false, error: "Failed to add investment transaction" }
  }
}
