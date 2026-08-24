import { NextResponse } from "next/server"
import { verifyApiAuth } from "@/lib/api/auth"
import * as domain from "@/lib/domain/profile"
import { changePasswordSchema } from "@/shared/schemas/profile"

export async function POST(req: Request) {
  const { user, response } = await verifyApiAuth(req)
  if (response) return response

  try {
    const body = await req.json()
    const parsed = changePasswordSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed", 
        details: parsed.error.format() 
      }, { status: 400 })
    }

    await domain.changePassword(user.id, parsed.data)
    
    return NextResponse.json({ success: true, message: "Password changed successfully" })
  } catch (error: any) {
    if (error.message === "User not found") {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    }
    if (error.message === "Incorrect current password") {
      return NextResponse.json({ success: false, error: "Incorrect current password" }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: "Failed to change password" }, { status: 500 })
  }
}
