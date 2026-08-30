import { db } from "@/lib/db"
import { BudgetFormValues } from "@/shared/schemas/budgets"

export async function getBudgets(userId: string, month: number, year: number) {
  const budgets = await db.budget.findMany({
    where: { userId, month, year },
    include: { category: true }
  })

  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999)

  const expenses = await db.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      type: 'EXPENSE',
      date: {
        gte: startOfMonth,
        lte: endOfMonth
      },
      categoryId: { not: null }
    },
    _sum: {
      amount: true
    }
  })

  const spentMap = new Map(expenses.map(e => [e.categoryId, Number(e._sum.amount || 0)]))

  return budgets.map(b => ({
    ...b,
    amount: Number(b.amount),
    spent: spentMap.get(b.categoryId) || 0
  }))
}

export async function setBudget(userId: string, parsed: BudgetFormValues) {
  return await db.budget.upsert({
    where: {
      userId_categoryId_month_year: {
        userId,
        categoryId: parsed.categoryId,
        month: parsed.month,
        year: parsed.year
      }
    },
    update: {
      amount: parsed.amount
    },
    create: {
      userId,
      categoryId: parsed.categoryId,
      amount: parsed.amount,
      month: parsed.month,
      year: parsed.year
    }
  })
}

export async function deleteBudget(userId: string, id: string) {
  const budget = await db.budget.findUnique({ where: { id } })
  if (!budget || budget.userId !== userId) {
    throw new Error("Budget not found or unauthorized")
  }
  return await db.budget.delete({ where: { id } })
}
