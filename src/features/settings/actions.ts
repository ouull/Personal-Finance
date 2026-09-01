"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { seedUserFinancialData } from "@/lib/seed";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function getUserSettings() {
  try {
    const userId = await getUserId();
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { language: true },
    });
    return { success: true, data: user };
  } catch (error: any) {
    return { success: false, error: "Failed to fetch settings" };
  }
}

export async function updateLanguage(language: string) {
  try {
    const userId = await getUserId();
    await db.user.update({
      where: { id: userId },
      data: { language },
    });

    // Set cookie for quick client access
    (await cookies()).set("NEXT_LOCALE", language, { path: "/" });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to update language" };
  }
}

export async function resetAllFinancialData() {
  try {
    const userId = await getUserId();

    // Execute a massive transaction to delete everything except User and Merchant
    // Wait, let's delete Merchants too so they are fully reset.
    // Order matters due to foreign keys.
    // Prisma deleteMany will handle it if we do it independently, but we can do it in a transaction

    await db.$transaction(
      async (tx) => {
        // Level 1: Leaf nodes and dependencies of others
        await Promise.all([
          tx.notification.deleteMany({ where: { userId } }),
          tx.goal.deleteMany({ where: { userId } }),
          tx.budget.deleteMany({ where: { userId } }),
          tx.investmentTransaction.deleteMany({
            where: { investment: { userId } },
          }),
          tx.repayment.deleteMany({ where: { loan: { userId } } }),
          tx.transaction.deleteMany({ where: { userId } }),
        ]);

        // Level 2: Intermediates
        await Promise.all([
          tx.recurringPayment.deleteMany({ where: { userId } }),
          tx.investment.deleteMany({ where: { userId } }),
          tx.loan.deleteMany({ where: { userId } }),
          tx.merchant.deleteMany({ where: { userId } }),
        ]);

        // Level 3: Base tables
        await Promise.all([
          tx.account.deleteMany({ where: { userId } }),
          tx.category.deleteMany({ where: { userId } }),
        ]);

        // Re-seed default Cash and Categories
        await seedUserFinancialData(userId, tx);
      },
      {
        maxWait: 5000, // default: 2000
        timeout: 15000, // default: 5000
      }
    );

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Reset data error:", error);
    return { success: false, error: "Failed to reset data" };
  }
}
