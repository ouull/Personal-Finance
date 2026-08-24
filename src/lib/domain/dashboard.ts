import { db } from "@/lib/db"

export async function getDashboardStats(userId: string) {
  // 1. Account Balances
  const accounts = await db.account.findMany({ where: { userId, isActive: true } })
  const availableCash = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0)

  // 2. Receivables (Outstanding Loans)
  const loans = await db.loan.findMany({
    where: { userId, status: { in: ["OUTSTANDING", "PARTIALLY_PAID", "OVERDUE"] } },
    include: { repayments: true }
  })
  const receivables = loans.reduce((sum, loan) => {
    const repaid = loan.repayments.reduce((rSum, r) => rSum + Number(r.amount), 0)
    return sum + (Number(loan.amount) - repaid)
  }, 0)

  // 3. Investments
  const investments = await db.investment.findMany({
    where: { userId, status: "ACTIVE" }
  })
  const investedCapital = investments.reduce((sum, inv) => sum + Number(inv.currentValue), 0)

  const netWorth = availableCash + receivables + investedCapital

  // 4. Monthly Income and Expense
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  const endOfMonth = new Date(startOfMonth)
  endOfMonth.setMonth(endOfMonth.getMonth() + 1)

  const currentMonthTransactions = await db.transaction.findMany({
    where: {
      userId,
      date: { gte: startOfMonth, lt: endOfMonth }
    },
    include: { category: true }
  })

  let monthlyIncome = 0
  let monthlyExpense = 0
  const spendingByCategory: Record<string, { value: number, slug: string | null, name: string }> = {}

  currentMonthTransactions.forEach((tx) => {
    const amount = Number(tx.amount)
    if (tx.type === "INCOME") {
      monthlyIncome += amount
    } else if (tx.type === "EXPENSE") {
      monthlyExpense += amount
      const catName = tx.category?.name || "Lainnya"
      const catSlug = tx.category?.slug || null
      if (!spendingByCategory[catName]) {
        spendingByCategory[catName] = { value: 0, slug: catSlug, name: catName }
      }
      spendingByCategory[catName].value += amount
    }
  })

  const topSpendingCategory = Object.values(spendingByCategory)
    .sort((a, b) => b.value - a.value)[0] || null

  // 5. Upcoming Payments
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const upcomingPayments = await db.recurringPayment.findMany({
    where: {
      userId,
      status: "ACTIVE",
      nextDueDate: { gte: today, lte: nextWeek }
    },
    orderBy: { nextDueDate: "asc" }
  })

  // 6. Recent Transactions
  const recentTransactions = await db.transaction.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 10,
    include: {
      category: true,
      sourceAccount: true,
      destinationAccount: true,
      merchant: true
    }
  })

  return {
    netWorth,
    availableCash,
    investedCapital,
    receivables,
    monthlyIncome,
    monthlyExpense,
    topSpendingCategory,
    upcomingPayments: upcomingPayments.map(p => ({
      ...p,
      amount: Number(p.amount)
    })),
    recentTransactions: recentTransactions.map(t => ({
      ...t,
      amount: Number(t.amount)
    }))
  }
}
