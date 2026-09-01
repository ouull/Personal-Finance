import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/api/auth";
import * as domain from "@/lib/domain/goals";
import { goalDepositSchema } from "@/shared/schemas/goals";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const { user, response } = await verifyApiAuth(req);
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = goalDepositSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.format(),
        },
        { status: 400 },
      );
    }

    const updated = await domain.addGoalDeposit(
      user.id,
      params.id,
      parsed.data.amount,
      parsed.data.accountId,
      parsed.data.notes,
    );

    const serialized = {
      ...updated,
      targetAmount: Number(updated.targetAmount),
      currentAmount: Number(updated.currentAmount),
    };

    return NextResponse.json({ success: true, data: serialized });
  } catch (error: any) {
    if (error.message === "Goal not found or unauthorized") {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    }
    if (error.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json(
        { success: false, error: "Saldo tidak mencukupi" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to deposit to goal" },
      { status: 500 },
    );
  }
}
