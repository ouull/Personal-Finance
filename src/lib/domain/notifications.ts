import { db } from "@/lib/db"

export async function getNotifications(userId: string) {
  return await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20
  })
}

export async function markNotificationAsRead(userId: string, id: string) {
  return await db.notification.updateMany({
    where: { id, userId },
    data: { readAt: new Date() }
  })
}

export async function markAllNotificationsAsRead(userId: string) {
  return await db.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() }
  })
}
