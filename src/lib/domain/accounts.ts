import { db } from "@/lib/db"

export class AccountError extends Error {
  constructor(public code: string, message: string) {
    super(message)
    this.name = "AccountError"
  }
}

export async function getAccounts(userId: string, includeInactive = false) {
  const accounts = await db.account.findMany({
    where: { 
      userId,
      ...(!includeInactive ? { isActive: true } : {})
    },
    orderBy: { createdAt: "desc" },
  })
  
  return accounts.map((acc: any) => ({
    ...acc,
    balance: Number(acc.balance)
  }))
}

export async function getAccountById(userId: string, id: string) {
  const account = await db.account.findUnique({
    where: { id }
  })

  if (!account || account.userId !== userId) {
    throw new AccountError("ACCOUNT_NOT_FOUND", "Account not found")
  }

  return {
    ...account,
    balance: Number(account.balance)
  }
}

export async function createAccount(userId: string, data: { name: string, type: string, balance: number, currency: string }) {
  if (data.type === "CASH") {
    throw new AccountError("CASH_CREATION_FORBIDDEN", "cash_creation_forbidden")
  }
  
  return await db.account.create({
    data: {
      userId,
      name: data.name,
      type: data.type as any,
      balance: data.balance,
      currency: data.currency,
      isActive: true,
    },
  })
}

export async function deleteAccount(userId: string, id: string) {
  const account = await db.account.findUnique({ 
    where: { id },
    include: {
      _count: {
        select: {
          transactionsFrom: true,
          transactionsTo: true,
          loans: true,
          repayments: true,
          investmentTx: true,
          recurring: true
        }
      }
    }
  })
  
  if (!account || account.userId !== userId) {
    throw new AccountError("ACCOUNT_NOT_FOUND", "not_found")
  }

  if (account.isSystem || account.type === "CASH") {
    throw new AccountError("CASH_ACCOUNT_PROTECTED", "system_account_deletion_forbidden")
  }

  const hasHistory = 
    account._count.transactionsFrom > 0 ||
    account._count.transactionsTo > 0 ||
    account._count.loans > 0 ||
    account._count.repayments > 0 ||
    account._count.investmentTx > 0 ||
    account._count.recurring > 0

  if (hasHistory) {
    // Archive instead of delete
    await db.account.update({
      where: { id },
      data: { isActive: false }
    })
    return { archived: true }
  } else {
    await db.account.delete({
      where: { id }
    })
    return { archived: false }
  }
}

export async function updateAccount(userId: string, id: string, data: { name: string, type: string }) {
  const account = await db.account.findUnique({ where: { id } })
  if (!account || account.userId !== userId) {
    throw new AccountError("ACCOUNT_NOT_FOUND", "not_found")
  }

  if (account.type === "CASH" && data.type !== "CASH") {
    throw new AccountError("CASH_ACCOUNT_PROTECTED", "system_account_deletion_forbidden") // Reusing error
  }
  
  if (account.type !== "CASH" && data.type === "CASH") {
    throw new AccountError("CASH_CREATION_FORBIDDEN", "cash_creation_forbidden")
  }

  return await db.account.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type as any,
    },
  })
}
