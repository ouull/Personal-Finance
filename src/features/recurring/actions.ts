"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

import * as domain from "@/lib/domain/recurring"

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
    const payments = await domain.getRecurringPayments(userId)
    return { success: true, data: payments }
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
    
    await domain.createRecurringPayment(userId, data)

    revalidatePath("/")
    revalidatePath("/recurring")
    
    return { success: true }
  } catch (error: any) {
    console.error("Create recurring payment error:", error)
    return { success: false, error: "Failed to create recurring payment" }
  }
}

export async function updateRecurringPayment(id: string, data: any) {
  try {
    const userId = await getUserId()
    
    await domain.updateRecurringPayment(userId, id, data)

    revalidatePath("/")
    revalidatePath("/recurring")
    
    return { success: true }
  } catch (error: any) {
    console.error("Update recurring payment error:", error)
    return { success: false, error: "Failed to update recurring payment" }
  }
}

export async function processRecurringPayment(id: string) {
  try {
    const userId = await getUserId()
    
    await domain.processRecurringPayment(userId, id)

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
