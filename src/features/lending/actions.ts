"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

import * as domain from "@/lib/domain/lending"

async function getUserId() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  return session.user.id
}

export async function getLoans() {
  try {
    const userId = await getUserId()
    const loans = await domain.getLoans(userId)
    return { success: true, data: loans }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    return { success: false, error: "Failed to fetch loans" }
  }
}

export async function createLoan(data: {
  accountId: string
  borrowerName: string
  type?: string
  amount: number
  lentDate: Date
  dueDate?: Date
  notes?: string
}) {
  try {
    const userId = await getUserId()
    
    await domain.createLoan(userId, data)

    revalidatePath("/")
    revalidatePath("/lending")
    
    return { success: true }
  } catch (error: any) {
    if (error.message === "INSUFFICIENT_BALANCE") {
      return { success: false, error: "Saldo tidak mencukupi." }
    }
    console.error("Create loan error:", error)
    return { success: false, error: "Failed to create loan" }
  }
}

export async function addRepayment(data: {
  loanId: string
  accountId: string
  amount: number
  paidDate: Date
  notes?: string
}) {
  try {
    const userId = await getUserId()

    await domain.addRepayment(userId, data)

    revalidatePath("/")
    revalidatePath("/lending")

    return { success: true }
  } catch (error: any) {
    if (error.message === "Repayment exceeds outstanding amount") {
      return { success: false, error: error.message }
    }
    if (error.message === "INSUFFICIENT_BALANCE") {
      return { success: false, error: "Saldo tidak mencukupi." }
    }
    console.error("Add repayment error:", error)
    return { success: false, error: "Failed to add repayment" }
  }
}
