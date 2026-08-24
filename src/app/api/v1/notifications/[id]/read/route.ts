import { NextResponse } from "next/server"
import { verifyApiAuth } from "@/lib/api/auth"
import * as domain from "@/lib/domain/notifications"

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const { user, response } = await verifyApiAuth(req)
  if (response) return response

  try {
    await domain.markNotificationAsRead(user.id, params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to mark notification as read" }, { status: 500 })
  }
}
