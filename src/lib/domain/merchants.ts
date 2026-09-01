import { db } from "@/lib/db";

export async function getMerchants(userId: string) {
  return await db.merchant.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: {
      defaultCategory: true,
    },
  });
}

export async function createMerchant(
  userId: string,
  data: { name: string; defaultCategoryId?: string },
) {
  // Verify category ownership if provided
  if (data.defaultCategoryId) {
    const category = await db.category.findUnique({
      where: { id: data.defaultCategoryId },
    });
    if (!category || category.userId !== userId) {
      throw new Error("Unauthorized category");
    }
  }

  return await db.merchant.create({
    data: {
      userId,
      name: data.name,
      defaultCategoryId: data.defaultCategoryId,
    },
  });
}

export async function updateMerchant(
  userId: string,
  id: string,
  data: { name?: string; defaultCategoryId?: string | null },
) {
  const merchant = await db.merchant.findUnique({ where: { id } });
  if (!merchant || merchant.userId !== userId) {
    throw new Error("Merchant not found or unauthorized");
  }

  if (data.defaultCategoryId) {
    const category = await db.category.findUnique({
      where: { id: data.defaultCategoryId },
    });
    if (!category || category.userId !== userId) {
      throw new Error("Unauthorized category");
    }
  }

  return await db.merchant.update({
    where: { id },
    data: {
      name: data.name !== undefined ? data.name : merchant.name,
      defaultCategoryId:
        data.defaultCategoryId !== undefined
          ? data.defaultCategoryId
          : merchant.defaultCategoryId,
    },
  });
}

export async function deleteMerchant(userId: string, id: string) {
  const merchant = await db.merchant.findUnique({ where: { id } });
  if (!merchant || merchant.userId !== userId) {
    throw new Error("Merchant not found or unauthorized");
  }

  return await db.merchant.delete({
    where: { id },
  });
}
