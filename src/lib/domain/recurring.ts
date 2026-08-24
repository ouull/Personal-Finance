import { db } from "@/lib/db"

export async function getRecurringPayments(userId: string) {
  const payments = await db.recurringPayment.findMany({
    where: { userId },
    orderBy: { nextDueDate: "asc" },
    include: {
      account: true,
      category: true
    }
  })

  const serialized = payments.map((p) => ({
    ...p,
    amount: Number(p.amount)
  }))

  return serialized
}

export async function createRecurringPayment(
  userId: string,
  data: {
    accountId: string
    categoryId: string
    name: string
    type: string
    amount: number
    billingCycle: string
    nextDueDate: Date
    reminderDays?: number
    notes?: string
  }
) {
  // Verify account and category ownership
  const account = await db.account.findUnique({ where: { id: data.accountId } })
  if (!account || account.userId !== userId) throw new Error("Unauthorized account")
  
  const category = await db.category.findUnique({ where: { id: data.categoryId } })
  if (!category || category.userId !== userId) throw new Error("Unauthorized category")

  return await db.recurringPayment.create({
    data: {
      userId,
      accountId: data.accountId,
      categoryId: data.categoryId,
      name: data.name,
      type: data.type,
      amount: data.amount,
      billingCycle: data.billingCycle,
      nextDueDate: data.nextDueDate,
      reminderDays: data.reminderDays || 3,
      notes: data.notes,
      status: "ACTIVE"
    }
  })
}

export async function processRecurringPayment(userId: string, id: string) {
  return await db.$transaction(async (tx) => {
    const payment = await tx.recurringPayment.findUnique({ where: { id } })
    if (!payment || payment.userId !== userId) throw new Error("Unauthorized payment")
    
    // Ensure payment is actually due (allowing processing a bit early, but definitely not duplicating)
    // Actually we'll just use optimistic concurrency to prevent duplicates.
    
    const nextDate = new Date(payment.nextDueDate)
    switch (payment.billingCycle) {
      case "WEEKLY": nextDate.setDate(nextDate.getDate() + 7); break;
      case "MONTHLY": nextDate.setMonth(nextDate.getMonth() + 1); break;
      case "QUARTERLY": nextDate.setMonth(nextDate.getMonth() + 3); break;
      case "YEARLY": nextDate.setFullYear(nextDate.getFullYear() + 1); break;
    }

    // Optimistic Concurrency check
    const updated = await tx.recurringPayment.updateMany({
      where: { id, nextDueDate: payment.nextDueDate },
      data: { nextDueDate: nextDate }
    })

    if (updated.count === 0) {
      throw new Error("Already processed or modified concurrently")
    }

    // 1. Create the actual transaction (Expense)
    const transaction = await tx.transaction.create({
      data: {
        userId,
        type: "EXPENSE",
        amount: payment.amount,
        date: new Date(),
        description: payment.name,
        notes: payment.notes,
        categoryId: payment.categoryId,
        sourceAccountId: payment.accountId,
      }
    })

    // 2. Update account balance
    await tx.account.update({
      where: { id: payment.accountId },
      data: { balance: { decrement: payment.amount } }
    })

    return transaction
  })
}

export async function getRecurringPaymentById(userId: string, id: string) {
  const payment = await db.recurringPayment.findUnique({
    where: { id },
    include: {
      account: true,
      category: true
    }
  })
  
  if (!payment || payment.userId !== userId) {
    throw new Error("Unauthorized payment")
  }

  return {
    ...payment,
    amount: Number(payment.amount)
  }
}

export async function updateRecurringPayment(userId: string, id: string, data: any) {
  const payment = await db.recurringPayment.findUnique({ where: { id } })
  if (!payment || payment.userId !== userId) throw new Error("Unauthorized payment")

  if (data.accountId) {
    const account = await db.account.findUnique({ where: { id: data.accountId } })
    if (!account || account.userId !== userId) throw new Error("Unauthorized account")
  }

  if (data.categoryId) {
    const category = await db.category.findUnique({ where: { id: data.categoryId } })
    if (!category || category.userId !== userId) throw new Error("Unauthorized category")
  }

  return await db.recurringPayment.update({
    where: { id },
    data
  })
}

export async function deleteRecurringPayment(userId: string, id: string) {
  const payment = await db.recurringPayment.findUnique({ where: { id } })
  if (!payment || payment.userId !== userId) throw new Error("Unauthorized payment")

  return await db.recurringPayment.delete({
    where: { id }
  })
}
