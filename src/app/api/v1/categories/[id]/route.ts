import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/api/auth";
import * as domain from "@/lib/domain/categories";
import { z } from "zod";
import { db } from "@/lib/db";

const updateCategorySchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
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
    const parsed = updateCategorySchema.safeParse(body);

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

    // Fetch existing to handle TS requiring name
    const existing = await db.category.findUnique({ where: { id: params.id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    }

    const data = {
      name: parsed.data.name ?? existing.name,
      type: parsed.data.type,
      icon: parsed.data.icon,
      color: parsed.data.color,
    };

    const updated = await domain.updateCategory(user.id, params.id, data);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === "CategoryError" && error.code === "CATEGORY_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update category" },
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
    await domain.deleteCategory(user.id, params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === "CategoryError" && error.code === "CATEGORY_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    }
    if (
      error.name === "CategoryError" &&
      error.code === "SYSTEM_CATEGORY_DELETION_FORBIDDEN"
    ) {
      return NextResponse.json(
        { success: false, error: "Cannot delete system category" },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete category" },
      { status: 500 },
    );
  }
}
