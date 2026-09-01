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
    // Use a sequential batch transaction to avoid serverless connection pool deadlocks.
    // Batch transactions run queries in the exact array order using a single connection.
    await db.$transaction([
      db.notification.deleteMany({ where: { userId } }),
      db.goal.deleteMany({ where: { userId } }),
      db.budget.deleteMany({ where: { userId } }),
      db.investmentTransaction.deleteMany({
        where: { investment: { userId } },
      }),
      db.repayment.deleteMany({ where: { loan: { userId } } }),
      db.transaction.deleteMany({ where: { userId } }),

      db.recurringPayment.deleteMany({ where: { userId } }),
      db.investment.deleteMany({ where: { userId } }),
      db.loan.deleteMany({ where: { userId } }),
      db.merchant.deleteMany({ where: { userId } }),

      db.account.deleteMany({ where: { userId } }),
      db.category.deleteMany({ where: { userId } }),
    ]);

    // Re-seed default Cash and Categories outside the main delete transaction
    await seedUserFinancialData(userId);

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Reset data error:", error);
    return { success: false, error: error?.message || "Failed to reset data" };
  }
}
