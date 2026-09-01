import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/api/auth";
import * as domain from "@/lib/domain/recurring";
import { recurringPaymentSchema } from "@/shared/schemas/recurring";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const { user, response } = await verifyApiAuth(req);
  if (response) return response;

  try {
    const payment = await domain.getRecurringPaymentById(user.id, params.id);
    return NextResponse.json({ success: true, data: payment });
  } catch (error: any) {
    if (error.message === "Unauthorized payment") {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch payment" },
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
    const parsed = recurringPaymentSchema.partial().safeParse(body);

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

    const updated = await domain.updateRecurringPayment(
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
    if (error.message === "Unauthorized payment") {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    }
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
      { success: false, error: "Failed to update payment" },
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
    await domain.deleteRecurringPayment(user.id, params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized payment") {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to delete payment" },
      { status: 500 },
    );
  }
}
