import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/api/auth";
import * as domain from "@/lib/domain/merchants";
import { z } from "zod";

export async function GET(req: Request) {
  const { user, response } = await verifyApiAuth(req);
  if (response) return response;

  try {
    const merchants = await domain.getMerchants(user.id);
    return NextResponse.json({ success: true, data: merchants });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch merchants" },
      { status: 500 },
    );
  }
}

const createMerchantSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  defaultCategoryId: z.string().optional(),
});

export async function POST(req: Request) {
  const { user, response } = await verifyApiAuth(req);
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = createMerchantSchema.safeParse(body);

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

    const merchant = await domain.createMerchant(user.id, parsed.data);
    return NextResponse.json(
      { success: true, data: merchant },
      { status: 201 },
    );
  } catch (error: any) {
    if (error.message === "Unauthorized category") {
      return NextResponse.json(
        { success: false, error: "Unauthorized category" },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create merchant" },
      { status: 500 },
    );
  }
}
