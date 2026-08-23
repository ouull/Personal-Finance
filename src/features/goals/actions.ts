"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function getUserId() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  return session.user.id
}

const goalSchema = z.object({
  name: z.string().min(1, "Nama tujuan wajib diisi"),
  targetAmount: z.coerce.number().min(1, "Target minimal 1"),
  currentAmount: z.coerce.number().default(0),
  deadline: z.string().optional(),
})

export type GoalFormValues = z.infer<typeof goalSchema>

export async function getGoals() {
  try {
    const userId = await getUserId()
    const goals = await db.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    const serializedGoals = goals.map((goal: any) => ({
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount)
    }))

    return { success: true, data: serializedGoals }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    return { success: false, error: "Failed to fetch financial goals data" }
  }
}

export async function createGoal(data: GoalFormValues) {
  try {
    const userId = await getUserId()
    const parsed = goalSchema.parse(data)
    
    await db.goal.create({
      data: {
        userId,
        name: parsed.name,
        targetAmount: parsed.targetAmount,
        currentAmount: parsed.currentAmount,
        deadline: parsed.deadline ? new Date(parsed.deadline) : null,
      },
    })
    
    revalidatePath("/")
    revalidatePath("/goals")
    
    return { success: true }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    return { success: false, error: "Failed to create financial goal" }
  }
}

export async function updateGoal(id: string, data: GoalFormValues) {
  try {
    const userId = await getUserId()
    const parsed = goalSchema.parse(data)
    
    const goal = await db.goal.findUnique({ where: { id } })
    if (!goal || goal.userId !== userId) {
      return { success: false, error: "Goal not found or unauthorized" }
    }

    await db.goal.update({
      where: { id },
      data: {
        name: parsed.name,
        targetAmount: parsed.targetAmount,
        currentAmount: parsed.currentAmount,
        deadline: parsed.deadline ? new Date(parsed.deadline) : null,
      },
    })
    
    revalidatePath("/")
    revalidatePath("/goals")
    
    return { success: true }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    return { success: false, error: "Failed to update financial goal" }
  }
}

export async function deleteGoal(id: string) {
  try {
    const userId = await getUserId()
    
    const goal = await db.goal.findUnique({ where: { id } })
    if (!goal || goal.userId !== userId) {
      return { success: false, error: "Goal not found or unauthorized" }
    }

    await db.goal.delete({ where: { id } })
    
    revalidatePath("/")
    revalidatePath("/goals")
    
    return { success: true }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    return { success: false, error: "Failed to delete financial goal" }
  }
}
