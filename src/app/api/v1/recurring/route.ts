import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/api/auth";
import * as domain from "@/lib/domain/recurring";
import { recurringPaymentSchema } from "@/shared/schemas/recurring";

export async function GET(req: Request) {
  const { user, response } = await verifyApiAuth(req);
  if (response) return response;

  try {
    const recurring = await domain.getRecurringPayments(user.id);
    return NextResponse.json({ success: true, data: recurring });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch recurring payments" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const { user, response } = await verifyApiAuth(req);
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = recurringPaymentSchema.safeParse(body);

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

    const {
      accountId,
      categoryId,
      name,
      type,
      amount,
      billingCycle,
      nextDueDate,
      reminderDays,
      notes,
    } = parsed.data;

    const payment = await domain.createRecurringPayment(user.id, {
      accountId,
      categoryId,
      name,
      type,
      amount,
      billingCycle,
      nextDueDate: new Date(nextDueDate),
      reminderDays,
      notes,
    });

    const serialized = {
      ...payment,
      amount: Number(payment.amount),
    };

    return NextResponse.json(
      { success: true, data: serialized },
      { status: 201 },
    );
  } catch (error: any) {
    if (
      error.message === "Unauthorized account" ||
      error.message === "Unauthorized category"
    ) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create recurring payment" },
      { status: 500 },
    );
  }
}
