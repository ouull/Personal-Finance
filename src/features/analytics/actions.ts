"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function getNetWorth() {
  try {
    const userId = await getUserId();

    // 1. Account Balances
    const accounts = await db.account.findMany({ where: { userId } });
    const totalCash = accounts.reduce(
      (sum: number, acc: any) => sum + Number(acc.balance),
      0,
    );

    // 2. Receivables and Payables (Loans)
    const loans = await db.loan.findMany({
      where: {
        userId,
        status: { in: ["OUTSTANDING", "PARTIALLY_PAID", "OVERDUE"] },
      },
      include: { repayments: true },
    });

    let totalReceivables = 0;
    let totalPayables = 0;

    loans.forEach((loan: any) => {
      const repaid = loan.repayments.reduce(
        (rSum: number, r: any) => rSum + Number(r.amount),
        0,
      );
      const remaining = Number(loan.amount) - repaid;

      if ((loan.type || "LENT") === "LENT") {
        totalReceivables += remaining;
      } else {
        totalPayables += remaining;
      }
    });

    // 3. Investments
    const investments = await db.investment.findMany({
      where: { userId, status: "ACTIVE" },
    });
    const totalInvestments = investments.reduce(
      (sum: number, inv: any) => sum + Number(inv.currentValue),
      0,
    );
    const investedCapital = investments.reduce(
      (sum: number, inv: any) => sum + Number(inv.totalInvested),
      0,
    );

    const netWorth =
      totalCash + totalReceivables + totalInvestments - totalPayables;

    return {
      success: true,
      data: {
        netWorth,
        totalCash,
        totalReceivables,
        totalPayables,
        totalInvestments,
        investedCapital,
      },
    };
  } catch (error: any) {
    if (error.message === "Unauthorized")
      return { success: false, error: "Unauthorized" };
    console.error("Get net worth error:", error);
    return { success: false, error: "Failed to fetch net worth" };
  }
}

export async function getCashFlowData() {
  try {
    const userId = await getUserId();
    const transactions = await db.transaction.findMany({
      where: {
        userId,
        type: {
          in: ["INCOME", "EXPENSE"],
        },
      },
      select: {
        type: true,
        amount: true,
        date: true,
      },
    });

    const monthlyData: Record<
      string,
      { name: string; income: number; expense: number }
    > = {};
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Ags",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyData[key] = {
        name: months[d.getMonth()],
        income: 0,
        expense: 0,
      };
    }

    transactions.forEach((tx: any) => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;

      if (monthlyData[key]) {
        if (tx.type === "INCOME") {
          monthlyData[key].income += Number(tx.amount);
        } else if (tx.type === "EXPENSE") {
          monthlyData[key].expense += Number(tx.amount);
        }
      }
    });

    return { success: true, data: Object.values(monthlyData) };
  } catch (error: any) {
    if (error.message === "Unauthorized")
      return { success: false, error: "Unauthorized" };
    return { success: false, error: "Failed to fetch cash flow data" };
  }
}

export async function getComprehensiveAnalytics() {
  try {
    const userId = await getUserId();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const expenses = await db.transaction.findMany({
      where: {
        userId,
        type: "EXPENSE",
        date: { gte: startOfMonth, lt: endOfMonth },
      },
      include: {
        category: true,
      },
    });

    let totalExpense = 0;
    const spendingByCategory: Record<
      string,
      { value: number; slug: string | null }
    > = {};

    expenses.forEach((tx: any) => {
      const amount = Number(tx.amount);
      const catName = tx.category?.name || "Lainnya";
      const catSlug = tx.category?.slug || null;

      if (!spendingByCategory[catName]) {
        spendingByCategory[catName] = { value: 0, slug: catSlug };
      }
      spendingByCategory[catName].value += amount;
      totalExpense += amount;
    });

    const spendingData = Object.entries(spendingByCategory)
      .map(([name, data]) => ({
        name,
        slug: data.slug,
        value: data.value,
        percentage: totalExpense > 0 ? (data.value / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);

    const topCategory = spendingData.length > 0 ? spendingData[0] : null;

    const accounts = await db.account.findMany({
      where: { userId },
    });
    const accountDistribution = accounts
      .map((acc: any) => ({
        name: acc.name,
        value: Number(acc.balance),
      }))
      .filter((acc: any) => acc.value > 0);

    return {
      success: true,
      data: {
        spendingByCategory: spendingData,
        topCategory,
        totalExpense,
        accountDistribution,
      },
    };
  } catch (error: any) {
    if (error.message === "Unauthorized")
      return { success: false, error: "Unauthorized" };
    return { success: false, error: "Failed to fetch analytics data" };
  }
}
