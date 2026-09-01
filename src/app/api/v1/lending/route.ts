import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/api/auth";
import * as domain from "@/lib/domain/lending";
import { loanSchema } from "@/shared/schemas/lending";

export async function GET(req: Request) {
  const { user, response } = await verifyApiAuth(req);
  if (response) return response;

  try {
    const loans = await domain.getLoans(user.id);
    return NextResponse.json({ success: true, data: loans });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch loans" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const { user, response } = await verifyApiAuth(req);
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = loanSchema.safeParse(body);

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

    const { accountId, borrowerName, type, amount, lentDate, dueDate, notes } =
      parsed.data;

    const loan = await domain.createLoan(user.id, {
      accountId,
      borrowerName,
      type,
      amount,
      lentDate: new Date(lentDate),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes,
    });

    const serialized = {
      ...loan,
      amount: Number(loan.amount),
    };

    return NextResponse.json(
      { success: true, data: serialized },
      { status: 201 },
    );
  } catch (error: any) {
    if (error.message === "Unauthorized account") {
      return NextResponse.json(
        { success: false, error: "Unauthorized account" },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create loan" },
      { status: 500 },
    );
  }
}
