import { db } from "@/lib/db";

export async function getSpendingReport(
  userId: string,
  month: number,
  year: number,
) {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const expenses = await db.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      type: "EXPENSE",
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const validCategoryIds = expenses
    .map((e) => e.categoryId)
    .filter((id) => id !== null) as string[];

  const categories = await db.category.findMany({
    where: {
      id: { in: validCategoryIds },
    },
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const report = expenses
    .map((e) => {
      const cat = e.categoryId ? categoryMap.get(e.categoryId) : null;
      return {
        categoryId: e.categoryId,
        categoryName: cat?.name || "Investasi / Lainnya",
        color: cat?.color || "#9CA3AF",
        total: Number(e._sum.amount || 0),
      };
    })
    .sort((a, b) => b.total - a.total);

  const totalExpense = report.reduce((sum, item) => sum + item.total, 0);

  return {
    month,
    year,
    totalExpense,
    breakdown: report,
  };
}
