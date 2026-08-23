"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { changePasswordSchema, ChangePasswordValues } from "./schema"

export async function changePassword(data: ChangePasswordValues) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }
    
    const parsed = changePasswordSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false, error: "Invalid data" }
    }
    
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })
    
    if (!user || !user.password) {
      return { success: false, error: "User not found" }
    }
    
    const isValid = await bcrypt.compare(data.currentPassword, user.password)
    if (!isValid) {
      return { success: false, error: "Incorrect current password" }
    }
    
    const hashedNewPassword = await bcrypt.hash(data.newPassword, 10)
    
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword }
    })
    
    return { success: true }
  } catch {
    return { success: false, error: "Failed to change password" }
  }
}

export async function getUserProfile() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }
    
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        createdAt: true,
        language: true,
      }
    })
    
    if (!user) {
      return { success: false, error: "User not found" }
    }
    
    return { success: true, data: user }
  } catch {
    return { success: false, error: "Failed to get user profile" }
  }
}
