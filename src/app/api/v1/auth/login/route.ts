import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import crypto from "crypto";
import { successResponse, errorResponse } from "@/lib/api/response";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const JWT_SECRET =
  process.env.NEXTAUTH_SECRET || "fallback-secret-for-development-only";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Invalid email or password format.",
        400,
      );
    }

    const { email, password } = parsed.data;

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return errorResponse(
        "INVALID_CREDENTIALS",
        "Kredensial tidak valid.",
        401,
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return errorResponse(
        "INVALID_CREDENTIALS",
        "Kredensial tidak valid.",
        401,
      );
    }

    // 1. Generate short-lived Access Token (15 minutes)
    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "15m",
    });

    // 2. Generate opaque random Refresh Token (30 days)
    const rawRefreshToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawRefreshToken)
      .digest("hex");

    const deviceInfo = req.headers.get("user-agent") || "Unknown Device";
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // 3. Store hashed token in MobileSession
    await db.mobileSession.create({
      data: {
        userId: user.id,
        tokenHash,
        deviceInfo,
        expiresAt,
        lastUsedAt: new Date(),
      },
    });

    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        language: user.language,
      },
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken, // Send raw token to client once
        expiresIn: 900, // 15 mins
      },
    });
  } catch (error) {
    console.error("Login API Error:", error);
    return errorResponse("INTERNAL_ERROR", "Internal server error", 500);
  }
}
