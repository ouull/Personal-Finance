import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/api/auth";
import * as domain from "@/lib/domain/lending";
import { repaymentSchema } from "@/shared/schemas/lending";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const { user, response } = await verifyApiAuth(req);
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = repaymentSchema.safeParse(body);

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

    const { accountId, amount, paidDate, notes } = parsed.data;

    const repayment = await domain.addRepayment(user.id, {
      loanId: params.id,
      accountId,
      amount,
      paidDate: new Date(paidDate),
      notes,
    });

    const serialized = {
      ...repayment,
      amount: Number(repayment.amount),
    };

    return NextResponse.json(
      { success: true, data: serialized },
      { status: 201 },
    );
  } catch (error: any) {
    if (
      error.message === "Unauthorized loan" ||
      error.message === "Unauthorized account"
    ) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 },
      );
    }
    if (error.message === "Repayment exceeds outstanding amount") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to add repayment" },
      { status: 500 },
    );
  }
}
