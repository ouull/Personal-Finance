import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/api/auth";
import * as domain from "@/lib/domain/transactions";
import { transactionSchema } from "@/shared/schemas/transactions";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const { user, response } = await verifyApiAuth(req);
  if (response) return response;

  try {
    const transaction = await domain.getTransactionById(user.id, params.id);

    const serialized = {
      ...transaction,
      amount: Number(transaction.amount),
    };

    return NextResponse.json({ success: true, data: serialized });
  } catch (error: any) {
    if (error.name === "TransactionError" && error.code === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch transaction" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const { user, response } = await verifyApiAuth(req);
  if (response) return response;

  try {
    const body = await req.json();
    // For transactions, full update is usually required, but we can allow partial in API if needed.
    // Wait, updateTransaction domain expects the full parsed data to evaluate financial changes properly.
    // It is safer to require the full schema to recalculate balances.
    const parsed = transactionSchema.safeParse(body);

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

    const updated = await domain.updateTransaction(
      user.id,
      params.id,
      parsed.data,
    );

    const serialized = {
      ...updated,
      amount: Number(updated.amount),
    };

    return NextResponse.json({ success: true, data: serialized });
  } catch (error: any) {
    if (error.name === "TransactionError") {
      if (error.code === "UNAUTHORIZED") {
        return NextResponse.json(
          { success: false, error: "Not found or unauthorized" },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to update transaction" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const { user, response } = await verifyApiAuth(req);
  if (response) return response;

  try {
    await domain.deleteTransaction(user.id, params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === "TransactionError" && error.code === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to delete transaction" },
      { status: 500 },
    );
  }
}
