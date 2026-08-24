import { NextResponse } from "next/server"
import { verifyApiAuth } from "@/lib/api/auth"
import * as domain from "@/lib/domain/profile"

export async function GET(req: Request) {
  const { user, response } = await verifyApiAuth(req)
  if (response) return response

  try {
    const profile = await domain.getUserProfile(user.id)
    return NextResponse.json({ success: true, data: profile })
  } catch (error: any) {
    if (error.message === "User not found") {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 })
  }
}

// Optionally implement PATCH for profile data (name, language) in the future.
// Right now domain only supports getUserProfile and changePassword.
