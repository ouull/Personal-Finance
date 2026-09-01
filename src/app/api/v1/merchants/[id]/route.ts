import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/api/auth";
import * as domain from "@/lib/domain/merchants";
import { z } from "zod";

const updateMerchantSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").optional(),
  defaultCategoryId: z.string().nullable().optional(),
});

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const { user, response } = await verifyApiAuth(req);
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = updateMerchantSchema.safeParse(body);

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

    const updated = await domain.updateMerchant(
      user.id,
      params.id,
      parsed.data,
    );
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.message === "Merchant not found or unauthorized") {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    }
    if (error.message === "Unauthorized category") {
      return NextResponse.json(
        { success: false, error: "Unauthorized category" },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update merchant" },
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
    await domain.deleteMerchant(user.id, params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Merchant not found or unauthorized") {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete merchant" },
      { status: 500 },
    );
  }
}
