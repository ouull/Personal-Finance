"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { TransactionFormValues, transactionSchema } from "./schema"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

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
    
    await db.$transaction(async (tx: any) => {
      // 1. Check account ownership if providing accounts
      if (parsed.sourceAccountId) {
        const sourceAcc = await tx.account.findUnique({ where: { id: parsed.sourceAccountId } })
        if (!sourceAcc || sourceAcc.userId !== userId) throw new Error("Unauthorized source account")
      }
      if (parsed.destinationAccountId) {
        const destAcc = await tx.account.findUnique({ where: { id: parsed.destinationAccountId } })
        if (!destAcc || destAcc.userId !== userId) throw new Error("Unauthorized destination account")
      }
      
      // 1.5. Validate Category Type Matches Transaction Type
      if (parsed.categoryId && (parsed.type === "INCOME" || parsed.type === "EXPENSE")) {
        const category = await tx.category.findUnique({ where: { id: parsed.categoryId } })
        if (!category || category.userId !== userId) throw new Error("Unauthorized category")
        if (category.type !== parsed.type) {
          throw new Error("category_type_mismatch")
        }
      }

      // 2. Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: parsed.type,
          amount: parsed.amount,
          date: parsed.date,
          description: parsed.description,
          notes: parsed.notes,
          categoryId: parsed.categoryId,
          merchantId: parsed.merchantId,
          sourceAccountId: parsed.sourceAccountId,
          destinationAccountId: parsed.destinationAccountId,
        },
      })

      // 3. Update account balances based on transaction type
      if ((parsed.type === "INCOME" || parsed.type === "INITIAL_BALANCE") && parsed.destinationAccountId) {
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
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.startsWith("Unauthorized ")) {
      return { success: false, error: "Unauthorized" }
    }
    console.error("Create transaction error:", error)
    return { success: false, error: "Failed to record transaction" }
  }
}

export async function updateTransaction(id: string, data: TransactionFormValues) {
  try {
    const userId = await getUserId()
    const parsed = transactionSchema.parse(data)
    
    await db.$transaction(async (tx: any) => {
      // 1. Fetch original transaction and check ownership
      const originalTx = await tx.transaction.findUnique({ where: { id } })
      if (!originalTx || originalTx.userId !== userId) throw new Error("Unauthorized transaction")

      // Check account ownerships for new data
      if (parsed.sourceAccountId) {
        const sourceAcc = await tx.account.findUnique({ where: { id: parsed.sourceAccountId } })
        if (!sourceAcc || sourceAcc.userId !== userId) throw new Error("Unauthorized source account")
      }
      if (parsed.destinationAccountId) {
        const destAcc = await tx.account.findUnique({ where: { id: parsed.destinationAccountId } })
        if (!destAcc || destAcc.userId !== userId) throw new Error("Unauthorized destination account")
      }
      
      // 1.5. Validate Category Type Matches Transaction Type
      if (parsed.categoryId && (parsed.type === "INCOME" || parsed.type === "EXPENSE")) {
        const category = await tx.category.findUnique({ where: { id: parsed.categoryId } })
        if (!category || category.userId !== userId) throw new Error("Unauthorized category")
        if (category.type !== parsed.type) {
          throw new Error("category_type_mismatch")
        }
      }

      // 2. Reverse original financial effects
      if ((originalTx.type === "INCOME" || originalTx.type === "INITIAL_BALANCE") && originalTx.destinationAccountId) {
        await tx.account.update({
          where: { id: originalTx.destinationAccountId },
          data: { balance: { decrement: originalTx.amount } },
        })
      } 
      else if (originalTx.type === "EXPENSE" && originalTx.sourceAccountId) {
        await tx.account.update({
          where: { id: originalTx.sourceAccountId },
          data: { balance: { increment: originalTx.amount } },
        })
      } 
      else if (originalTx.type === "TRANSFER" && originalTx.sourceAccountId && originalTx.destinationAccountId) {
        await tx.account.update({
          where: { id: originalTx.sourceAccountId },
          data: { balance: { increment: originalTx.amount } },
        })
        await tx.account.update({
          where: { id: originalTx.destinationAccountId },
          data: { balance: { decrement: originalTx.amount } },
        })
      }

      // 3. Apply new financial effects
      if ((parsed.type === "INCOME" || parsed.type === "INITIAL_BALANCE") && parsed.destinationAccountId) {
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

      // 4. Update transaction record
      await tx.transaction.update({
        where: { id },
        data: {
          type: parsed.type,
          amount: parsed.amount,
          date: parsed.date,
          description: parsed.description,
          notes: parsed.notes,
          categoryId: parsed.categoryId,
          merchantId: parsed.merchantId,
          sourceAccountId: parsed.sourceAccountId,
          destinationAccountId: parsed.destinationAccountId,
        },
      })
    })

    revalidatePath("/")
    revalidatePath("/transactions")
    revalidatePath("/accounts")
    
    return { success: true }
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.startsWith("Unauthorized ")) {
      return { success: false, error: "Unauthorized" }
    }
    console.error("Update transaction error:", error)
    return { success: false, error: "Failed to update transaction" }
  }
}

export async function deleteTransaction(id: string) {
  try {
    const userId = await getUserId()
    
    await db.$transaction(async (tx: any) => {
      const originalTx = await tx.transaction.findUnique({ where: { id } })
      if (!originalTx || originalTx.userId !== userId) throw new Error("Unauthorized transaction")

      // Reverse original financial effects
      if ((originalTx.type === "INCOME" || originalTx.type === "INITIAL_BALANCE") && originalTx.destinationAccountId) {
        await tx.account.update({
          where: { id: originalTx.destinationAccountId },
          data: { balance: { decrement: originalTx.amount } },
        })
      } 
      else if (originalTx.type === "EXPENSE" && originalTx.sourceAccountId) {
        await tx.account.update({
          where: { id: originalTx.sourceAccountId },
          data: { balance: { increment: originalTx.amount } },
        })
      } 
      else if (originalTx.type === "TRANSFER" && originalTx.sourceAccountId && originalTx.destinationAccountId) {
        await tx.account.update({
          where: { id: originalTx.sourceAccountId },
          data: { balance: { increment: originalTx.amount } },
        })
        await tx.account.update({
          where: { id: originalTx.destinationAccountId },
          data: { balance: { decrement: originalTx.amount } },
        })
      }

      // Delete transaction
      await tx.transaction.delete({ where: { id } })
    })

    revalidatePath("/")
    revalidatePath("/transactions")
    revalidatePath("/accounts")
    
    return { success: true }
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.startsWith("Unauthorized ")) {
      return { success: false, error: "Unauthorized" }
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
      orderBy: { date: "desc" },
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
      orderBy: { date: "desc" },
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
