import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/api/auth";
import * as domain from "@/lib/domain/goals";
import { goalSchema } from "@/shared/schemas/goals";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const { user, response } = await verifyApiAuth(req);
  if (response) return response;

  try {
    const goal = await domain.getGoalById(user.id, params.id);

    const serialized = {
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
    };

    return NextResponse.json({ success: true, data: serialized });
  } catch (error: any) {
    if (error.message === "Goal not found or unauthorized") {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch goal" },
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
    const parsed = goalSchema.safeParse(body);

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

    const updated = await domain.updateGoal(user.id, params.id, parsed.data);

    const serialized = {
      ...updated,
      targetAmount: Number(updated.targetAmount),
      currentAmount: Number(updated.currentAmount),
    };

    return NextResponse.json({ success: true, data: serialized });
  } catch (error: any) {
    if (error.message === "Goal not found or unauthorized") {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to update goal" },
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
    await domain.deleteGoal(user.id, params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Goal not found or unauthorized") {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to delete goal" },
      { status: 500 },
    );
  }
}
