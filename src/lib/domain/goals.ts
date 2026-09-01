import { db } from "@/lib/db";
import { GoalFormValues } from "@/shared/schemas/goals";

export async function getGoals(userId: string) {
  const goals = await db.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const serializedGoals = goals.map((goal) => ({
    ...goal,
    targetAmount: Number(goal.targetAmount),
    currentAmount: Number(goal.currentAmount),
    deadline: goal.deadline || undefined,
  }));

  return serializedGoals;
}

export async function createGoal(userId: string, parsed: GoalFormValues) {
  return await db.goal.create({
    data: {
      userId,
      name: parsed.name,
      targetAmount: parsed.targetAmount,
      currentAmount: parsed.currentAmount,
      deadline: parsed.deadline ? new Date(parsed.deadline) : null,
    },
  });
}

export async function updateGoal(
  userId: string,
  id: string,
  parsed: GoalFormValues,
) {
  const goal = await db.goal.findUnique({ where: { id } });
  if (!goal || goal.userId !== userId) {
    throw new Error("Goal not found or unauthorized");
  }

  return await db.goal.update({
    where: { id },
    data: {
      name: parsed.name,
      targetAmount: parsed.targetAmount,
      currentAmount: parsed.currentAmount,
      deadline: parsed.deadline ? new Date(parsed.deadline) : null,
    },
  });
}

export async function deleteGoal(userId: string, id: string) {
  const goal = await db.goal.findUnique({ where: { id } });
  if (!goal || goal.userId !== userId) {
    throw new Error("Goal not found or unauthorized");
  }

  return await db.goal.delete({
    where: { id },
  });
}

export async function getGoalById(userId: string, id: string) {
  const goal = await db.goal.findUnique({ where: { id } });
  if (!goal || goal.userId !== userId) {
    throw new Error("Goal not found or unauthorized");
  }
  return goal;
}

export async function addGoalDeposit(
  userId: string,
  goalId: string,
  amount: number,
  accountId: string,
  notes?: string,
) {
  const goal = await db.goal.findUnique({ where: { id: goalId } });
  if (!goal || goal.userId !== userId) {
    throw new Error("Goal not found or unauthorized");
  }

  const account = await db.account.findUnique({ where: { id: accountId } });
  if (!account || account.userId !== userId) {
    throw new Error("Account not found or unauthorized");
  }

  if (Number(account.balance) < amount) {
    throw new Error("INSUFFICIENT_BALANCE");
  }

  return await db.$transaction(async (tx) => {
    // 1. Update goal amount
    const updatedGoal = await tx.goal.update({
      where: { id: goalId },
      data: {
        currentAmount: { increment: amount },
      },
    });

    // 2. Deduct from account
    await tx.account.update({
      where: { id: accountId },
      data: {
        balance: { decrement: amount },
      },
    });

    // 3. Create transaction record
    await tx.transaction.create({
      data: {
        userId,
        sourceAccountId: accountId,
        type: "EXPENSE",
        amount,
        description: `Deposit to Goal: ${goal.name}`,
        notes,
      },
    });

    return updatedGoal;
  });
}
