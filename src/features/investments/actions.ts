"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

import * as domain from "@/lib/domain/investments"

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
    const investments = await domain.getInvestments(userId)
    return { success: true, data: investments }
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
  initialAmount?: number
  accountId?: string
}) {
  try {
    const userId = await getUserId()
    
    await domain.createInvestment(userId, data)

    revalidatePath("/")
    revalidatePath("/investments")
    
    return { success: true }
  } catch (error: any) {
    if (error.message === "Insufficient account balance") {
      return { success: false, error: "Saldo tidak mencukupi." }
    }
    console.error("Create investment error:", error)
    return { success: false, error: "Failed to create investment" }
  }
}

export async function updateInvestmentValue(id: string, newValue: number) {
  try {
    const userId = await getUserId()
    await domain.updateInvestmentValue(userId, id, newValue)

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

    await domain.addInvestmentTransaction(userId, data)

    revalidatePath("/")
    revalidatePath("/investments")

    return { success: true }
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.startsWith("Unauthorized ")) {
      return { success: false, error: "Unauthorized" }
    }
    if (error.message === "Insufficient account balance" || error.message === "Insufficient investment cash balance") {
      return { success: false, error: "Saldo tidak mencukupi." }
    }
    console.error("Add investment tx error:", error)
    return { success: false, error: "Failed to add investment transaction" }
  }
}
