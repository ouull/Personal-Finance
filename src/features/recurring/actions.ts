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

export async function getRecurringPayments() {
  try {
    const userId = await getUserId()
    const payments = await db.recurringPayment.findMany({
      where: { userId },
      orderBy: { nextDueDate: "asc" },
      include: {
        account: true,
        category: true
      }
    })

    const serialized = payments.map((p: any) => ({
      ...p,
      amount: Number(p.amount)
    }))

    return { success: true, data: serialized }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    return { success: false, error: "Failed to fetch recurring payments" }
  }
}

export async function createRecurringPayment(data: {
  accountId: string
  categoryId: string
  name: string
  type: string
  amount: number
  billingCycle: string
  nextDueDate: Date
  reminderDays?: number
  notes?: string
}) {
  try {
    const userId = await getUserId()
    
    // Verify account and category ownership
    const account = await db.account.findUnique({ where: { id: data.accountId } })
    if (!account || account.userId !== userId) throw new Error("Unauthorized account")
    
    const category = await db.category.findUnique({ where: { id: data.categoryId } })
    if (!category || category.userId !== userId) throw new Error("Unauthorized category")

    await db.recurringPayment.create({
      data: {
        userId,
        accountId: data.accountId,
        categoryId: data.categoryId,
        name: data.name,
        type: data.type,
        amount: data.amount,
        billingCycle: data.billingCycle,
        nextDueDate: data.nextDueDate,
        reminderDays: data.reminderDays || 3,
        notes: data.notes,
        status: "ACTIVE"
      }
    })

    revalidatePath("/")
    revalidatePath("/recurring")
    
    return { success: true }
  } catch (error: any) {
    console.error("Create recurring payment error:", error)
    return { success: false, error: "Failed to create recurring payment" }
  }
}

export async function processRecurringPayment(id: string) {
  try {
    const userId = await getUserId()
    
    await db.$transaction(async (tx: any) => {
      const payment = await tx.recurringPayment.findUnique({ where: { id } })
      if (!payment || payment.userId !== userId) throw new Error("Unauthorized payment")
      
      // Ensure payment is actually due (allowing processing a bit early, but definitely not duplicating)
      // Actually we'll just use optimistic concurrency to prevent duplicates.
      
      const nextDate = new Date(payment.nextDueDate)
      switch (payment.billingCycle) {
        case "WEEKLY": nextDate.setDate(nextDate.getDate() + 7); break;
        case "MONTHLY": nextDate.setMonth(nextDate.getMonth() + 1); break;
        case "QUARTERLY": nextDate.setMonth(nextDate.getMonth() + 3); break;
        case "YEARLY": nextDate.setFullYear(nextDate.getFullYear() + 1); break;
      }

      // Optimistic Concurrency check
      const updated = await tx.recurringPayment.updateMany({
        where: { id, nextDueDate: payment.nextDueDate },
        data: { nextDueDate: nextDate }
      })

      if (updated.count === 0) {
        throw new Error("Already processed or modified concurrently")
      }

      // 1. Create the actual transaction (Expense)
      await tx.transaction.create({
        data: {
          userId,
          type: "EXPENSE",
          amount: payment.amount,
          date: new Date(),
          description: payment.name,
          notes: payment.notes,
          categoryId: payment.categoryId,
          sourceAccountId: payment.accountId,
        }
      })

      // 2. Update account balance
      await tx.account.update({
        where: { id: payment.accountId },
        data: { balance: { decrement: payment.amount } }
      })
    })

    revalidatePath("/")
    revalidatePath("/recurring")

    return { success: true }
  } catch (error: any) {
    if (error.message === "Unauthorized payment") {
      return { success: false, error: "Unauthorized" }
    }
    if (error.message === "Already processed or modified concurrently") {
      return { success: false, error: error.message }
    }
    console.error("Process recurring payment error:", error)
    return { success: false, error: "Failed to process recurring payment" }
  }
}
