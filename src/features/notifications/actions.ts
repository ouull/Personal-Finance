"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

import * as domain from "@/lib/domain/notifications"

async function getUserId() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  return session.user.id
}

export async function getNotifications() {
  try {
    const userId = await getUserId()
    const notifications = await domain.getNotifications(userId)
    return { success: true, data: notifications }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    return { success: false, error: "Failed to fetch notifications" }
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    const userId = await getUserId()
    await domain.markNotificationAsRead(userId, id)
    
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "Failed to mark as read" }
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const userId = await getUserId()
    await domain.markAllNotificationsAsRead(userId)
    
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "Failed to mark all as read" }
  }
}
