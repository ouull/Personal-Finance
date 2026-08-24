import { verifyApiAuth } from "@/lib/api/auth"
import { successResponse, errorResponse } from "@/lib/api/response"

export async function GET(req: Request) {
  try {
    const { user, response } = await verifyApiAuth(req)
    if (response || !user) return response

    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        language: user.language
      }
    })
  } catch (error) {
    console.error("Me API Error:", error)
    return errorResponse("INTERNAL_ERROR", "Internal server error", 500)
  }
}
