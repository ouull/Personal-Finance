import { db } from "@/lib/db";
import jwt from "jsonwebtoken";
import { z } from "zod";
import crypto from "crypto";
import { successResponse, errorResponse } from "@/lib/api/response";

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const JWT_SECRET =
  process.env.NEXTAUTH_SECRET || "fallback-secret-for-development-only";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = refreshSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid request format.", 400);
    }

    const { refreshToken } = parsed.data;
    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const session = await db.mobileSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session) {
      return errorResponse("INVALID_SESSION", "Session not found.", 401);
    }

    // Reuse detection
    if (session.revokedAt) {
      // Security Event: Revoked token was reused!
      // Revoke all active sessions for this user.
      await db.mobileSession.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return errorResponse(
        "COMPROMISED_SESSION",
        "Session compromised. All sessions revoked.",
        401,
      );
    }

    if (session.expiresAt < new Date()) {
      return errorResponse("EXPIRED_SESSION", "Session expired.", 401);
    }

    // Rotate: Revoke the old session
    await db.mobileSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    // Generate new token pair
    const newAccessToken = jwt.sign({ userId: session.userId }, JWT_SECRET, {
      expiresIn: "15m",
    });

    const newRawRefreshToken = crypto.randomBytes(32).toString("hex");
    const newTokenHash = crypto
      .createHash("sha256")
      .update(newRawRefreshToken)
      .digest("hex");
    const deviceInfo =
      req.headers.get("user-agent") || session.deviceInfo || "Unknown Device";
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.mobileSession.create({
      data: {
        userId: session.userId,
        tokenHash: newTokenHash,
        deviceInfo,
        expiresAt,
        lastUsedAt: new Date(),
      },
    });

    return successResponse({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        language: session.user.language,
      },
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRawRefreshToken,
        expiresIn: 900,
      },
    });
  } catch (error) {
    console.error("Refresh API Error:", error);
    return errorResponse("INTERNAL_ERROR", "Internal server error", 500);
  }
}
