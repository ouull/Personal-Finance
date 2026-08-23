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

export async function getLoans() {
  try {
    const userId = await getUserId()
    const loans = await db.loan.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        account: true,
        repayments: true
      }
    })

    const serializedLoans = loans.map((loan: any) => {
      const totalRepaid = loan.repayments.reduce((sum: number, r: any) => sum + Number(r.amount), 0)
      return {
        ...loan,
        amount: Number(loan.amount),
        totalRepaid,
        remainingAmount: Number(loan.amount) - totalRepaid,
        account: {
          ...loan.account,
          balance: Number(loan.account.balance)
        },
        repayments: loan.repayments.map((r: any) => ({
          ...r,
          amount: Number(r.amount)
        }))
      }
    })

    return { success: true, data: serializedLoans }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    return { success: false, error: "Failed to fetch loans" }
  }
}

export async function createLoan(data: {
  accountId: string
  borrowerName: string
  amount: number
  lentDate: Date
  dueDate?: Date
  notes?: string
}) {
  try {
    const userId = await getUserId()
    
    await db.$transaction(async (tx: any) => {
      const account = await tx.account.findUnique({ where: { id: data.accountId } })
      if (!account || account.userId !== userId) throw new Error("Unauthorized account")

      // 1. Create loan
      await tx.loan.create({
        data: {
          userId,
          accountId: data.accountId,
          borrowerName: data.borrowerName,
          amount: data.amount,
          lentDate: data.lentDate,
          dueDate: data.dueDate,
          notes: data.notes,
          status: "OUTSTANDING"
        }
      })

      // 2. Decrease account balance (this is not an expense, just asset movement)
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { decrement: data.amount } }
      })
    })

    revalidatePath("/")
    revalidatePath("/lending")
    
    return { success: true }
  } catch (error: any) {
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

    await db.$transaction(async (tx: any) => {
      const loan = await tx.loan.findUnique({ 
        where: { id: data.loanId },
        include: { repayments: true }
      })
      if (!loan || loan.userId !== userId) throw new Error("Unauthorized loan")

      const totalRepaid = loan.repayments.reduce((sum: number, r: any) => sum + Number(r.amount), 0)
      const outstanding = Number(loan.amount) - totalRepaid

      if (data.amount > outstanding) {
        throw new Error("Repayment exceeds outstanding amount")
      }

      const account = await tx.account.findUnique({ where: { id: data.accountId } })
      if (!account || account.userId !== userId) throw new Error("Unauthorized account")

      // 1. Create repayment
      await tx.repayment.create({
        data: {
          loanId: data.loanId,
          accountId: data.accountId,
          amount: data.amount,
          paidDate: data.paidDate,
          notes: data.notes,
        }
      })

      // 2. Increase account balance
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { increment: data.amount } }
      })

      // 3. Update loan status
      const newTotalRepaid = totalRepaid + data.amount
      const newStatus = newTotalRepaid >= Number(loan.amount) ? "PAID" : "PARTIALLY_PAID"

      await tx.loan.update({
        where: { id: data.loanId },
        data: { status: newStatus }
      })
    })

    revalidatePath("/")
    revalidatePath("/lending")

    return { success: true }
  } catch (error: any) {
    if (error.message === "Repayment exceeds outstanding amount") {
      return { success: false, error: error.message }
    }
    console.error("Add repayment error:", error)
    return { success: false, error: "Failed to add repayment" }
  }
}
