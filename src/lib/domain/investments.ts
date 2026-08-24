import { db } from "@/lib/db"

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
  }
) {
  return await db.investment.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      platform: data.platform,
      notes: data.notes,
      status: "ACTIVE"
    }
  })
}

export async function updateInvestmentValue(userId: string, id: string, newValue: number) {
  const inv = await db.investment.findUnique({ where: { id } })
  if (!inv || inv.userId !== userId) throw new Error("Unauthorized investment")

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
    if (data.type === "BUY" || data.type === "DEPOSIT") {
      await tx.investment.update({
        where: { id: data.investmentId },
        data: { 
          totalInvested: { increment: data.amount },
          currentValue: { increment: data.amount } 
        }
      })
      if (data.accountId) {
        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { decrement: data.amount } }
        })
      }
    } else if (data.type === "SELL" || data.type === "WITHDRAW") {
      // Proportional cost-basis allocation for SELL
      const cv = Number(inv.currentValue)
      const totalInv = Number(inv.totalInvested)
      
      let saleRatio = 0
      if (cv > 0) {
        saleRatio = data.amount / cv
        if (saleRatio > 1) saleRatio = 1 // Cap at 100% sale if they sell for more than current value
      } else {
        // If current value is 0 but they sell, it's 100% gain with 0 cost basis
        saleRatio = 0
      }
      
      // If it's a full sale or amount is equal to current value
      if (data.amount >= cv) {
         const realizedGain = data.amount - totalInv
         await tx.investment.update({
           where: { id: data.investmentId },
           data: {
             totalInvested: 0,
             currentValue: 0,
             realizedGain: { increment: realizedGain },
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
             realizedGain: { increment: realizedGain }
           }
         })
      }

      if (data.accountId) {
        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { increment: data.amount } }
        })
      }
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
