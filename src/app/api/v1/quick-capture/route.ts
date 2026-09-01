import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/api/auth";
import * as domain from "@/lib/domain/transactions";
import { db } from "@/lib/db";
import { z } from "zod";

const quickCaptureSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  type: z.enum(["EXPENSE", "INCOME"]).default("EXPENSE"),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  date: z.string().optional(), // ISO string
});

export async function POST(req: Request) {
  const { user, response } = await verifyApiAuth(req);
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = quickCaptureSchema.safeParse(body);

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

    const { amount, description, type, accountId, categoryId, date } =
      parsed.data;

    let finalAccountId = accountId;
    let finalCategoryId = categoryId;

    // Fallbacks
    if (!finalAccountId) {
      const defaultAccount = await db.account.findFirst({
        where: { userId: user.id, isActive: true },
        orderBy: { balance: "desc" },
      });
      if (!defaultAccount) {
        return NextResponse.json(
          { success: false, error: "No active account found for fallback" },
          { status: 400 },
        );
      }
      finalAccountId = defaultAccount.id;
    }

    if (!finalCategoryId) {
      const defaultCategory = await db.category.findFirst({
        where: { userId: user.id, type, isActive: true, isDefault: true },
        orderBy: { name: "asc" },
      });
      if (!defaultCategory) {
        return NextResponse.json(
          {
            success: false,
            error: `No default category found for type ${type}`,
          },
          { status: 400 },
        );
      }
      finalCategoryId = defaultCategory.id;
    }

    const transactionData = {
      type,
      amount,
      date: date ? new Date(date) : new Date(),
      description,
      notes: "Created via Quick Capture",
      categoryId: finalCategoryId,
      sourceAccountId: type === "EXPENSE" ? finalAccountId : undefined,
      destinationAccountId: type === "INCOME" ? finalAccountId : undefined,
    };

    const transaction = await domain.createTransaction(
      user.id,
      transactionData,
    );

    const serialized = {
      ...transaction,
      amount: Number(transaction.amount),
    };

    return NextResponse.json(
      { success: true, data: serialized },
      { status: 201 },
    );
  } catch (error: any) {
    if (error.name === "TransactionError") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to process quick capture" },
      { status: 500 },
    );
  }
}
