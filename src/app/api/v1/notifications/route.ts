import { NextResponse } from "next/server"
import { verifyApiAuth } from "@/lib/api/auth"
import * as domain from "@/lib/domain/notifications"

export async function GET(req: Request) {
  const { user, response } = await verifyApiAuth(req)
  if (response) return response

  try {
    const notifications = await domain.getNotifications(user.id)
    return NextResponse.json({ success: true, data: notifications })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 })
  }
}
