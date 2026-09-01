import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/api/auth";
import * as domain from "@/lib/domain/dashboard";

export async function GET(req: Request) {
  const { user, response } = await verifyApiAuth(req);
  if (response) return response;

  try {
    const stats = await domain.getDashboardStats(user.id);
    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}
