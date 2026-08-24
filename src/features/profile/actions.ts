"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"
import * as domain from "@/lib/domain/profile"
import { changePasswordSchema, ChangePasswordValues } from "@/shared/schemas/profile"

async function getUserId() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  return session.user.id
}

export async function changePassword(data: ChangePasswordValues) {
  try {
    const userId = await getUserId()
    
    const parsed = changePasswordSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false, error: "Invalid data" }
    }
    
    await domain.changePassword(userId, data)
    
    return { success: true }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    if (error.message === "User not found") return { success: false, error: "User not found" }
    if (error.message === "Incorrect current password") return { success: false, error: "Incorrect current password" }
    return { success: false, error: "Failed to change password" }
  }
}

export async function getUserProfile() {
  try {
    const userId = await getUserId()
    
    const user = await domain.getUserProfile(userId)
    
    return { success: true, data: user }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    if (error.message === "User not found") return { success: false, error: "User not found" }
    return { success: false, error: "Failed to get user profile" }
  }
}
