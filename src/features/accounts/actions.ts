"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { accountSchema, AccountFormValues } from "./schema"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function getUserId() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  return session.user.id
}

export async function getAccounts(includeInactive = false) {
  try {
    const userId = await getUserId()
    const accounts = await db.account.findMany({
      where: { 
        userId,
        ...(!includeInactive ? { isActive: true } : {})
      },
      orderBy: { createdAt: "desc" },
    })
    
    const serializedAccounts = accounts.map((acc: any) => ({
      ...acc,
      balance: Number(acc.balance)
    }))
    
    return { success: true, data: serializedAccounts }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    return { success: false, error: "Failed to fetch accounts data" }
  }
}

export async function createAccount(data: AccountFormValues) {
  try {
    const userId = await getUserId()
    const parsed = accountSchema.parse(data)
    
    await db.account.create({
      data: {
        userId,
        name: parsed.name,
        type: parsed.type,
        balance: parsed.balance,
        currency: parsed.currency,
        isActive: true,
      },
    })
    
    revalidatePath("/accounts")
    revalidatePath("/")
    
    return { success: true }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    console.error("Create account error:", error)
    return { success: false, error: "Failed to create account" }
  }
}

export async function deleteAccount(id: string) {
  try {
    const userId = await getUserId()
    
    const account = await db.account.findUnique({ 
      where: { id },
      include: {
        _count: {
          select: {
            transactionsFrom: true,
            transactionsTo: true,
            loans: true,
            repayments: true,
            investmentTx: true,
            recurring: true
          }
        }
      }
    })
    
    if (!account || account.userId !== userId) {
      return { success: false, error: "Account not found or unauthorized" }
    }

    if (account.isSystem) {
      return { success: false, error: "System accounts cannot be deleted or archived." }
    }

    const hasHistory = 
      account._count.transactionsFrom > 0 ||
      account._count.transactionsTo > 0 ||
      account._count.loans > 0 ||
      account._count.repayments > 0 ||
      account._count.investmentTx > 0 ||
      account._count.recurring > 0

    if (hasHistory) {
      // Archive instead of hard delete
      await db.account.update({
        where: { id },
        data: { isActive: false }
      })
    } else {
      // Safe to hard delete
      await db.account.delete({ where: { id } })
    }
    
    revalidatePath("/accounts")
    revalidatePath("/")
    revalidatePath("/transactions")
    
    return { success: true, archived: hasHistory }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    return { success: false, error: "Failed to delete or archive account." }
  }
}
