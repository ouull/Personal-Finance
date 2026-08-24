import { db } from "@/lib/db"
import jwt from "jsonwebtoken"
import { errorResponse } from "./response"

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-for-development-only"

export async function verifyApiAuth(req: Request) {
  const authHeader = req.headers.get("authorization")
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null, response: errorResponse("UNAUTHORIZED", "Missing or invalid authorization header", 401) }
  }

  const token = authHeader.split(" ")[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    
    if (!decoded.userId) {
      return { user: null, response: errorResponse("UNAUTHORIZED", "Invalid token payload", 401) }
    }

    const user = await db.user.findUnique({ where: { id: decoded.userId } })
    
    if (!user) {
      return { user: null, response: errorResponse("USER_NOT_FOUND", "User no longer exists", 401) }
    }

    return { user, response: null }
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return { user: null, response: errorResponse("UNAUTHORIZED", "Token expired", 401) }
    }
    return { user: null, response: errorResponse("UNAUTHORIZED", "Invalid token signature", 401) }
  }
}
