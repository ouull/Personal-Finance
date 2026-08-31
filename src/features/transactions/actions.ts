"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { TransactionFormValues, transactionSchema } from "@/shared/schemas/transactions"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as domain from "@/lib/domain/transactions"

async function getUserId() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  return session.user.id
}

export async function createTransaction(data: TransactionFormValues) {
  try {
    const userId = await getUserId()
    const parsed = transactionSchema.parse(data)
    
    await domain.createTransaction(userId, parsed)

    revalidatePath("/")
    revalidatePath("/transactions")
    revalidatePath("/accounts")
    
    return { success: true }
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.startsWith("Unauthorized ")) {
      return { success: false, error: "Unauthorized" }
    }
    if (error.name === "TransactionError") {
      if (error.code === "INSUFFICIENT_BALANCE") {
        return { success: false, error: "Saldo tidak mencukupi." }
      }
      return { success: false, error: error.message }
    }
    console.error("Create transaction error:", error)
    return { success: false, error: "Failed to record transaction" }
  }
}

export async function updateTransaction(id: string, data: TransactionFormValues) {
  try {
    const userId = await getUserId()
    const parsed = transactionSchema.parse(data)
    
    await domain.updateTransaction(userId, id, parsed)

    revalidatePath("/")
    revalidatePath("/transactions")
    revalidatePath("/accounts")
    
    return { success: true }
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.startsWith("Unauthorized ")) {
      return { success: false, error: "Unauthorized" }
    }
    if (error.name === "TransactionError") {
      if (error.code === "INSUFFICIENT_BALANCE") {
        return { success: false, error: "Saldo tidak mencukupi." }
      }
      return { success: false, error: error.message }
    }
    console.error("Update transaction error:", error)
    return { success: false, error: "Failed to update transaction" }
  }
}

export async function deleteTransaction(id: string) {
  try {
    const userId = await getUserId()
    
    await domain.deleteTransaction(userId, id)

    revalidatePath("/")
    revalidatePath("/transactions")
    revalidatePath("/accounts")
    
    return { success: true }
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.startsWith("Unauthorized ")) {
      return { success: false, error: "Unauthorized" }
    }
    if (error.name === "TransactionError") {
      return { success: false, error: error.message }
    }
    console.error("Delete transaction error:", error)
    return { success: false, error: "Failed to delete transaction" }
  }
}

export async function getRecentTransactions(limit = 5) {
  try {
    const userId = await getUserId()
    const transactions = await db.transaction.findMany({
      where: { userId },
      take: limit,
      orderBy: [
        { date: "desc" },
        { createdAt: "desc" }
      ],
      include: {
        category: true,
        merchant: true,
        sourceAccount: true,
        destinationAccount: true,
      }
    })

    const serializedTransactions = transactions.map((tx: any) => ({
      ...tx,
      amount: Number(tx.amount),
      sourceAccount: tx.sourceAccount ? {
        ...tx.sourceAccount,
        balance: Number(tx.sourceAccount.balance)
      } : null,
      destinationAccount: tx.destinationAccount ? {
        ...tx.destinationAccount,
        balance: Number(tx.destinationAccount.balance)
      } : null,
    }))

    return { success: true, data: serializedTransactions }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    return { success: false, error: "Failed to fetch transactions" }
  }
}

export async function getTransactions() {
  try {
    const userId = await getUserId()
    const transactions = await db.transaction.findMany({
      where: { userId },
      orderBy: [
        { date: "desc" },
        { createdAt: "desc" }
      ],
      include: {
        category: true,
        merchant: true,
        sourceAccount: true,
        destinationAccount: true,
      }
    })

    const serializedTransactions = transactions.map((tx: any) => ({
      ...tx,
      amount: Number(tx.amount),
      sourceAccount: tx.sourceAccount ? {
        ...tx.sourceAccount,
        balance: Number(tx.sourceAccount.balance)
      } : null,
      destinationAccount: tx.destinationAccount ? {
        ...tx.destinationAccount,
        balance: Number(tx.destinationAccount.balance)
      } : null,
    }))

    return { success: true, data: serializedTransactions }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    return { success: false, error: "Failed to fetch transactions" }
  }
}
