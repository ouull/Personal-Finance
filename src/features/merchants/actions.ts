"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function getUserId() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  return session.user.id
}

export async function getMerchants() {
  try {
    const userId = await getUserId()
    const merchants = await db.merchant.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: {
        defaultCategory: true
      }
    })
    return { success: true, data: merchants }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    return { success: false, error: "Failed to fetch merchants" }
  }
}

export async function createMerchant(data: { name: string, defaultCategoryId?: string }) {
  try {
    const userId = await getUserId()
    
    // Verify category ownership if provided
    if (data.defaultCategoryId) {
      const category = await db.category.findUnique({
        where: { id: data.defaultCategoryId }
      })
      if (!category || category.userId !== userId) {
        throw new Error("Unauthorized category")
      }
    }

    const merchant = await db.merchant.create({
      data: {
        userId,
        name: data.name,
        defaultCategoryId: data.defaultCategoryId
      }
    })
    return { success: true, data: merchant }
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Unauthorized category") {
      return { success: false, error: "Unauthorized" }
    }
    return { success: false, error: "Failed to create merchant" }
  }
}
