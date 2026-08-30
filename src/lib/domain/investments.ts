import { db } from "@/lib/db"

async function getOrCreateInvestmentCategory(tx: any, userId: string, type: "INCOME" | "EXPENSE") {
  const slug = type === "EXPENSE" ? "investment_expense" : "investment_income";
  let cat = await tx.category.findFirst({ where: { userId, slug } });
  if (!cat) {
    cat = await tx.category.create({
      data: {
        userId,
        name: "Investasi",
        slug,
        type,
        icon: "TrendingUp",
        color: type === "EXPENSE" ? "blue" : "emerald",
        isDefault: true,
        isActive: true
      }
    });
  }
  return cat.id;
}

export async function getInvestments(userId: string) {
  const investments = await db.investment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      transactions: true
    }
  })

  const serializedInvestments = investments.map((inv) => ({
    ...inv,
    totalInvested: Number(inv.totalInvested),
    currentValue: Number(inv.currentValue),
    unrealizedGain: Number(inv.currentValue) - Number(inv.totalInvested),
    realizedGain: Number(inv.realizedGain),
    cashBalance: Number(inv.cashBalance),
    notes: inv.notes || undefined,
    platform: inv.platform || undefined,
    transactions: inv.transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      notes: t.notes || undefined,
      accountId: t.accountId || undefined
    }))
  }))

  return serializedInvestments
}

export async function createInvestment(
  userId: string,
  data: {
    name: string
    type: string
    platform?: string
    notes?: string
    initialAmount?: number
    accountId?: string
  }
) {
  if (data.initialAmount !== undefined && data.accountId) {
    return await db.$transaction(async (tx) => {
      const acc = await tx.account.findUnique({ where: { id: data.accountId } })
      if (!acc || acc.userId !== userId) throw new Error("Unauthorized account")
      
      if (Number(acc.balance) < data.initialAmount) {
        throw new Error("Insufficient account balance")
      }

      const inv = await tx.investment.create({
        data: {
          userId,
          name: data.name,
          type: data.type,
          platform: data.platform,
          notes: data.notes,
          totalInvested: data.initialAmount,
          currentValue: data.initialAmount,
          status: "ACTIVE"
        }
      })

      await tx.investmentTransaction.create({
        data: {
          investmentId: inv.id,
          accountId: data.accountId,
          type: "BUY",
          amount: data.initialAmount,
          date: new Date(),
          notes: "Initial deposit"
        }
      })

      if (data.accountId) {
        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { decrement: data.initialAmount } }
        })
        
        await tx.transaction.create({
          data: {
            userId,
            type: 'EXPENSE',
            amount: data.initialAmount,
            date: new Date(),
            description: `Investasi: ${data.name}`,
            notes: data.notes || 'Pembelian investasi awal',
            sourceAccountId: data.accountId,
          }
        })
      }

      return inv
    })
  }


  throw new Error("Initial amount and account are required")
}

export async function updateInvestmentValue(userId: string, id: string, newValue: number) {
  const inv = await db.investment.findUnique({ where: { id } })
  if (!inv || inv.userId !== userId) throw new Error("Unauthorized investment")

  if (Number(inv.totalInvested) <= 0 && newValue > 0) {
    throw new Error("Cannot update value of an empty investment. Please buy or deposit first.")
  }

  return await db.investment.update({
    where: { id },
    data: { currentValue: newValue }
  })
}

export async function addInvestmentTransaction(
  userId: string,
  data: {
    investmentId: string
    accountId?: string
    type: string // BUY, SELL, DEPOSIT, WITHDRAW, DIVIDEND, INTEREST, FEE
    amount: number
    date: Date
    notes?: string
  }
) {
  return await db.$transaction(async (tx) => {
    const inv = await tx.investment.findUnique({ where: { id: data.investmentId } })
    if (!inv || inv.userId !== userId) throw new Error("Unauthorized investment")

    if (data.accountId) {
      const acc = await tx.account.findUnique({ where: { id: data.accountId } })
      if (!acc || acc.userId !== userId) throw new Error("Unauthorized account")
    }

    // 1. Create transaction
    const transaction = await tx.investmentTransaction.create({
      data: {
        investmentId: data.investmentId,
        accountId: data.accountId,
        type: data.type,
        amount: data.amount,
        date: data.date,
        notes: data.notes,
      }
    })

    // 2. Update investment totals
    if (data.type === "BUY") {
      if (!data.accountId) throw new Error("Account is required for BUY")
      const acc = await tx.account.findUnique({ where: { id: data.accountId } })
      if (!acc || Number(acc.balance) < data.amount) throw new Error("Insufficient account balance")

      await tx.investment.update({
        where: { id: data.investmentId },
        data: { 
          totalInvested: { increment: data.amount },
          currentValue: { increment: data.amount },
          status: "ACTIVE"
        }
      })
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { decrement: data.amount } }
      })

      const catId = await getOrCreateInvestmentCategory(tx, userId, "EXPENSE")
      const platformStr = inv.platform ? ` di ${inv.platform}` : ''
      await tx.transaction.create({
        data: {
          userId,
          type: 'EXPENSE',
          amount: data.amount,
          date: data.date,
          description: inv.name,
          notes: data.notes,
          categoryId: catId,
          sourceAccountId: data.accountId,
        }
      })
    } else if (data.type === "SELL") {
      // Proportional cost-basis allocation for SELL
      const cv = Number(inv.currentValue)
      const totalInv = Number(inv.totalInvested)
      
      if (data.amount > cv) {
        throw new Error("Cannot sell more than current value")
      }
      
      let saleRatio = 0
      if (cv > 0) {
        saleRatio = data.amount / cv
      }
      
      // If it's a full sale (amount is equal to current value)
      if (data.amount === cv) {
         const realizedGain = data.amount - totalInv
         await tx.investment.update({
           where: { id: data.investmentId },
           data: {
             totalInvested: 0,
             currentValue: 0,
             realizedGain: { increment: realizedGain },
             cashBalance: data.accountId ? undefined : { increment: data.amount },
             status: "SOLD"
           }
         })
      } else {
         const costBasisReduced = totalInv * saleRatio
         const realizedGain = data.amount - costBasisReduced
         await tx.investment.update({
           where: { id: data.investmentId },
           data: {
             totalInvested: { decrement: costBasisReduced },
             currentValue: { decrement: data.amount },
             realizedGain: { increment: realizedGain },
             cashBalance: data.accountId ? undefined : { increment: data.amount }
           }
         })
      }

      if (data.accountId) {
        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { increment: data.amount } }
        })
        const catId = await getOrCreateInvestmentCategory(tx, userId, "INCOME")
        const platformStr = inv.platform ? ` di ${inv.platform}` : ''
        await tx.transaction.create({
          data: {
            userId,
            type: 'INCOME',
            amount: data.amount,
            date: data.date,
            description: inv.name,
            notes: data.notes,
            categoryId: catId,
            destinationAccountId: data.accountId,
          }
        })
      }
    } else if (data.type === "WITHDRAW") {
      if (!data.accountId) throw new Error("Account is required for WITHDRAW")
      if (Number(inv.cashBalance) < data.amount) throw new Error("Insufficient investment cash balance")
      
      await tx.investment.update({
        where: { id: data.investmentId },
        data: { cashBalance: { decrement: data.amount } }
      })
      
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { increment: data.amount } }
      })

      const catId = await getOrCreateInvestmentCategory(tx, userId, "INCOME")
      const platformStr = inv.platform ? ` di ${inv.platform}` : ''
      await tx.transaction.create({
        data: {
          userId,
          type: 'INCOME',
          amount: data.amount,
          date: data.date,
          description: inv.name,
          notes: data.notes,
          categoryId: catId,
          destinationAccountId: data.accountId,
        }
      })
    } else if (data.type === "DEPOSIT") {
      if (!data.accountId) throw new Error("Account is required for DEPOSIT")
      const acc = await tx.account.findUnique({ where: { id: data.accountId } })
      if (!acc || Number(acc.balance) < data.amount) throw new Error("Insufficient account balance")
      
      await tx.investment.update({
        where: { id: data.investmentId },
        data: { cashBalance: { increment: data.amount } }
      })
      
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { decrement: data.amount } }
      })

      const catId = await getOrCreateInvestmentCategory(tx, userId, "EXPENSE")
      const platformStr = inv.platform ? ` di ${inv.platform}` : ''
      await tx.transaction.create({
        data: {
          userId,
          type: 'EXPENSE',
          amount: data.amount,
          date: data.date,
          description: inv.name,
          notes: data.notes,
          categoryId: catId,
          sourceAccountId: data.accountId,
        }
      })
    }
    
    return transaction
  })
}

export async function getInvestmentById(userId: string, id: string) {
  const inv = await db.investment.findUnique({
    where: { id },
    include: {
      transactions: true
    }
  })

  if (!inv || inv.userId !== userId) {
    throw new Error("Unauthorized investment")
  }

  return {
    ...inv,
    totalInvested: Number(inv.totalInvested),
    currentValue: Number(inv.currentValue),
    unrealizedGain: Number(inv.currentValue) - Number(inv.totalInvested),
    realizedGain: Number(inv.realizedGain),
    cashBalance: Number(inv.cashBalance),
    notes: inv.notes || undefined,
    platform: inv.platform || undefined,
    transactions: inv.transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      notes: t.notes || undefined,
      accountId: t.accountId || undefined
    }))
  }
}

export async function deleteInvestment(userId: string, id: string) {
  const inv = await db.investment.findUnique({ where: { id } })
  if (!inv || inv.userId !== userId) throw new Error("Unauthorized investment")

  return await db.investment.delete({
    where: { id }
  })
}
