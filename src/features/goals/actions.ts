"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const goalSchema = z.object({
  name: z.string().min(1, "Nama tujuan wajib diisi"),
  targetAmount: z.coerce.number().min(1, "Target minimal 1"),
  currentAmount: z.coerce.number().default(0),
  deadline: z.string().optional(),
})

export type GoalFormValues = z.infer<typeof goalSchema>

export async function getGoals() {
  try {
    const goals = await db.goal.findMany({
      orderBy: { createdAt: "desc" },
    })

    const serializedGoals = goals.map((goal: any) => ({
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount)
    }))

    return { success: true, data: serializedGoals }
  } catch (error) {
    return { success: false, error: "Failed to fetch financial goals data" }
  }
}

export async function createGoal(data: GoalFormValues) {
  try {
    const parsed = goalSchema.parse(data)
    
    await db.goal.create({
      data: {
        name: parsed.name,
        targetAmount: parsed.targetAmount,
        currentAmount: parsed.currentAmount,
        deadline: parsed.deadline ? new Date(parsed.deadline) : null,
      },
    })
    
    revalidatePath("/")
    
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to create financial goal" }
  }
}
