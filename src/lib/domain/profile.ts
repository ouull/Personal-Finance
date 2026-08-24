import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { ChangePasswordValues } from "@/shared/schemas/profile"

export async function getUserProfile(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      createdAt: true,
      language: true,
    }
  })
  
  if (!user) {
    throw new Error("User not found")
  }
  
  return user
}

export async function changePassword(userId: string, data: ChangePasswordValues) {
  const user = await db.user.findUnique({
    where: { id: userId }
  })
  
  if (!user || !user.password) {
    throw new Error("User not found")
  }
  
  const isValid = await bcrypt.compare(data.currentPassword, user.password)
  if (!isValid) {
    throw new Error("Incorrect current password")
  }
  
  const hashedNewPassword = await bcrypt.hash(data.newPassword, 10)
  
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword }
    }),
    db.mobileSession.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() }
    })
  ])
}
