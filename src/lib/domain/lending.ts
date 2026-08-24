import { db } from "@/lib/db"

export async function getLoans(userId: string) {
  const loans = await db.loan.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      account: true,
      repayments: true
    }
  })

  const serializedLoans = loans.map((loan) => {
    const totalRepaid = loan.repayments.reduce((sum, r) => sum + Number(r.amount), 0)
    return {
      ...loan,
      amount: Number(loan.amount),
      totalRepaid,
      remainingAmount: Number(loan.amount) - totalRepaid,
      dueDate: loan.dueDate || undefined, // Fix null to undefined
      notes: loan.notes || undefined, // Fix null to undefined
      account: {
        ...loan.account,
        balance: Number(loan.account.balance)
      },
      repayments: loan.repayments.map((r) => ({
        ...r,
        amount: Number(r.amount)
      }))
    }
  })

  return serializedLoans
}

export async function createLoan(
  userId: string,
  data: {
    accountId: string
    borrowerName: string
    amount: number
    lentDate: Date
    dueDate?: Date
    notes?: string
  }
) {
  return await db.$transaction(async (tx) => {
    const account = await tx.account.findUnique({ where: { id: data.accountId } })
    if (!account || account.userId !== userId) throw new Error("Unauthorized account")

    // 1. Create loan
    const loan = await tx.loan.create({
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

    return loan
  })
}

export async function addRepayment(
  userId: string,
  data: {
    loanId: string
    accountId: string
    amount: number
    paidDate: Date
    notes?: string
  }
) {
  return await db.$transaction(async (tx) => {
    const loan = await tx.loan.findUnique({ 
      where: { id: data.loanId },
      include: { repayments: true }
    })
    if (!loan || loan.userId !== userId) throw new Error("Unauthorized loan")

    const totalRepaid = loan.repayments.reduce((sum, r) => sum + Number(r.amount), 0)
    const outstanding = Number(loan.amount) - totalRepaid

    if (data.amount > outstanding) {
      throw new Error("Repayment exceeds outstanding amount")
    }

    const account = await tx.account.findUnique({ where: { id: data.accountId } })
    if (!account || account.userId !== userId) throw new Error("Unauthorized account")

    // 1. Create repayment
    const repayment = await tx.repayment.create({
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

    return repayment
  })
}

export async function getLoanById(userId: string, id: string) {
  const loan = await db.loan.findUnique({
    where: { id },
    include: {
      account: true,
      repayments: true
    }
  })

  if (!loan || loan.userId !== userId) {
    throw new Error("Unauthorized loan")
  }

  const totalRepaid = loan.repayments.reduce((sum, r) => sum + Number(r.amount), 0)
  return {
    ...loan,
    amount: Number(loan.amount),
    totalRepaid,
    remainingAmount: Number(loan.amount) - totalRepaid,
    dueDate: loan.dueDate || undefined,
    notes: loan.notes || undefined,
    account: {
      ...loan.account,
      balance: Number(loan.account.balance)
    },
    repayments: loan.repayments.map((r) => ({
      ...r,
      amount: Number(r.amount)
    }))
  }
}
