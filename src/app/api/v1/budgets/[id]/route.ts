import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/api/auth";
import * as domain from "@/lib/domain/budgets";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const { user, response } = await verifyApiAuth(req);
  if (response) return response;

  try {
    await domain.deleteBudget(user.id, params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Budget not found or unauthorized") {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to delete budget" },
      { status: 500 },
    );
  }
}
