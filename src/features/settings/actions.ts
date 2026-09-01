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

    await db.$transaction(async (tx) => {
      await tx.notification.deleteMany({ where: { userId } });
      await tx.goal.deleteMany({ where: { userId } });
      await tx.budget.deleteMany({ where: { userId } });
      await tx.recurringPayment.deleteMany({ where: { userId } });
      await tx.investmentTransaction.deleteMany({
        where: { investment: { userId } },
      });
      await tx.investment.deleteMany({ where: { userId } });
      await tx.repayment.deleteMany({ where: { loan: { userId } } });
      await tx.loan.deleteMany({ where: { userId } });

      // Transactions have relations to accounts and categories
      await tx.transaction.deleteMany({ where: { userId } });

      // Now safe to delete accounts and categories
      await tx.account.deleteMany({ where: { userId } });
      await tx.category.deleteMany({ where: { userId } });
      await tx.merchant.deleteMany({ where: { userId } });

      // Re-seed default Cash and Categories
      await seedUserFinancialData(userId, tx);
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Reset data error:", error);
    return { success: false, error: "Failed to reset data" };
  }
}
