"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { TransactionFormValues, transactionSchema } from "./schema"

export async function createTransaction(data: TransactionFormValues) {
  try {
    const parsed = transactionSchema.parse(data)
    
    // We use a database transaction to ensure atomicity
    await db.$transaction(async (tx) => {
      // 1. Buat record transaksi
      const transaction = await tx.transaction.create({
        data: {
          type: parsed.type,
          amount: parsed.amount,
          date: parsed.date,
          description: parsed.description,
          categoryId: parsed.categoryId,
          sourceAccountId: parsed.sourceAccountId,
          destinationAccountId: parsed.destinationAccountId,
        },
      })

      // 2. Update saldo akun berdasarkan tipe transaksi
      if (parsed.type === "INCOME" && parsed.destinationAccountId) {
        await tx.account.update({
          where: { id: parsed.destinationAccountId },
          data: { balance: { increment: parsed.amount } },
        })
      } 
      else if (parsed.type === "EXPENSE" && parsed.sourceAccountId) {
        await tx.account.update({
          where: { id: parsed.sourceAccountId },
          data: { balance: { decrement: parsed.amount } },
        })
      } 
      else if (parsed.type === "TRANSFER" && parsed.sourceAccountId && parsed.destinationAccountId) {
        await tx.account.update({
          where: { id: parsed.sourceAccountId },
          data: { balance: { decrement: parsed.amount } },
        })
        await tx.account.update({
          where: { id: parsed.destinationAccountId },
          data: { balance: { increment: parsed.amount } },
        })
      }

      return transaction
    })

    revalidatePath("/")
    revalidatePath("/transactions")
    revalidatePath("/accounts")
    
    return { success: true }
  } catch (error) {
    console.error("Create transaction error:", error)
    return { success: false, error: "Gagal mencatat transaksi" }
  }
}

export async function getRecentTransactions(limit = 5) {
  try {
    const transactions = await db.transaction.findMany({
      take: limit,
      orderBy: { date: "desc" },
      include: {
        category: true,
        sourceAccount: true,
        destinationAccount: true,
      }
    })

    const serializedTransactions = transactions.map(tx => ({
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
  } catch (error) {
    return { success: false, error: "Gagal mengambil transaksi" }
  }
}
