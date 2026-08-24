import { db } from "@/lib/db"
import { z } from "zod"
import crypto from "crypto"
import { successResponse, errorResponse } from "@/lib/api/response"
import { verifyApiAuth } from "@/lib/api/auth"

const logoutSchema = z.object({
  refreshToken: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    // We expect the user to be authenticated to log out
    const { user, response } = await verifyApiAuth(req)
    if (response || !user) return response

    const body = await req.json()
    const parsed = logoutSchema.safeParse(body)
    
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid request format.", 400)
    }

    const { refreshToken } = parsed.data
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex")

    const session = await db.mobileSession.findUnique({
      where: { tokenHash }
    })

    // Validate that the session belongs to the user
    if (session && session.userId === user.id) {
      await db.mobileSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() }
      })
    }

    // Always return success even if not found to prevent timing/probing attacks
    return successResponse({ message: "Logged out successfully." })
  } catch (error) {
    console.error("Logout API Error:", error)
    return errorResponse("INTERNAL_ERROR", "Internal server error", 500)
  }
}
