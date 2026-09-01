import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/api/auth";
import * as domain from "@/lib/domain/accounts";
import { accountSchema } from "@/shared/schemas/accounts";
import { z } from "zod";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const { user, response } = await verifyApiAuth(req);
  if (response) return response;

  try {
    const account = await domain.getAccountById(user.id, params.id);
    return NextResponse.json({ success: true, data: account });
  } catch (error: any) {
    if (error.name === "AccountError" && error.code === "ACCOUNT_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch account" },
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
    // allow partial updates
    const parsed = accountSchema.partial().safeParse(body);

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

    const existing = await domain.getAccountById(user.id, params.id);

    const updated = await domain.updateAccount(user.id, params.id, {
      name: parsed.data.name ?? existing.name,
      type: parsed.data.type ?? existing.type,
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === "AccountError" && error.code === "ACCOUNT_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update account" },
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
    await domain.deleteAccount(user.id, params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === "AccountError" && error.code === "ACCOUNT_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete account" },
      { status: 500 },
    );
  }
}
