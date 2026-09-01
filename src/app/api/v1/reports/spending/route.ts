import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/api/auth";
import * as domain from "@/lib/domain/reports";

export async function GET(req: Request) {
  const { user, response } = await verifyApiAuth(req);
  if (response) return response;

  try {
    const { searchParams } = new URL(req.url);
    const monthStr = searchParams.get("month");
    const yearStr = searchParams.get("year");

    const now = new Date();
    const month = monthStr ? parseInt(monthStr, 10) : now.getMonth() + 1;
    const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();

    const report = await domain.getSpendingReport(user.id, month, year);
    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch spending report" },
      { status: 500 },
    );
  }
}
