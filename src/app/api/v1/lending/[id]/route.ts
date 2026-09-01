import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/api/auth";
import * as domain from "@/lib/domain/lending";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const { user, response } = await verifyApiAuth(req);
  if (response) return response;

  try {
    const loan = await domain.getLoanById(user.id, params.id);
    return NextResponse.json({ success: true, data: loan });
  } catch (error: any) {
    if (error.message === "Unauthorized loan") {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch loan" },
      { status: 500 },
    );
  }
}
