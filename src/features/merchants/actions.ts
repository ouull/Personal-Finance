"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

import * as domain from "@/lib/domain/merchants"

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
    const merchants = await domain.getMerchants(userId)
    return { success: true, data: merchants }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    return { success: false, error: "Failed to fetch merchants" }
  }
}

export async function createMerchant(data: { name: string, defaultCategoryId?: string }) {
  try {
    const userId = await getUserId()
    
    const merchant = await domain.createMerchant(userId, data)
    
    return { success: true, data: merchant }
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Unauthorized category") {
      return { success: false, error: "Unauthorized" }
    }
    return { success: false, error: "Failed to create merchant" }
  }
}
