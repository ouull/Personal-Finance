import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/api/auth";
import * as domain from "@/lib/domain/categories";
import { z } from "zod";

export async function GET(req: Request) {
  const { user, response } = await verifyApiAuth(req);
  if (response) return response;

  try {
    const categories = await domain.getCategories(user.id);
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

const createCategorySchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().optional(),
});

export async function POST(req: Request) {
  const { user, response } = await verifyApiAuth(req);
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = createCategorySchema.safeParse(body);

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

    const category = await domain.createCategory(user.id, parsed.data);
    return NextResponse.json(
      { success: true, data: category },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to create category" },
      { status: 500 },
    );
  }
}
