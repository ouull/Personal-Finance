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

export async function getBudgets(month: number, year: number) {
  try {
    const userId = await getUserId()
    const budgets = await db.budget.findMany({
      where: { userId, month, year },
      include: { category: true }
    })
    
    const serialized = budgets.map((b: any) => ({
      ...b,
      amount: Number(b.amount)
    }))
    
    return { success: true, data: serialized }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    return { success: false, error: "Failed to fetch budgets" }
  }
}

export async function createBudget(data: {
  categoryId: string
  amount: number
  month: number
  year: number
}) {
  try {
    const userId = await getUserId()
    
    const category = await db.category.findUnique({ where: { id: data.categoryId } })
    if (!category || category.userId !== userId) throw new Error("Unauthorized category")

    // Use upsert to handle updates if budget already exists
    await db.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId: data.categoryId,
          month: data.month,
          year: data.year
        }
      },
      update: {
        amount: data.amount
      },
      create: {
        userId,
        categoryId: data.categoryId,
        amount: data.amount,
        month: data.month,
        year: data.year
      }
    })

    revalidatePath("/")
    revalidatePath("/budgets")
    
    return { success: true }
  } catch (error: any) {
    console.error("Create budget error:", error)
    return { success: false, error: "Failed to create budget" }
  }
}
