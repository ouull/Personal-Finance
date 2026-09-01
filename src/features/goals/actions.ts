"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import * as domain from "@/lib/domain/goals";
import { goalSchema, GoalFormValues } from "@/shared/schemas/goals";

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function getGoals() {
  try {
    const userId = await getUserId();
    const goals = await domain.getGoals(userId);
    return { success: true, data: goals };
  } catch (error: any) {
    if (error.message === "Unauthorized")
      return { success: false, error: "Unauthorized" };
    return { success: false, error: "Failed to fetch financial goals data" };
  }
}

export async function createGoal(data: GoalFormValues) {
  try {
    const userId = await getUserId();
    const parsed = goalSchema.parse(data);

    await domain.createGoal(userId, parsed);

    revalidatePath("/");
    revalidatePath("/goals");

    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized")
      return { success: false, error: "Unauthorized" };
    return { success: false, error: "Failed to create financial goal" };
  }
}

export async function updateGoal(id: string, data: GoalFormValues) {
  try {
    const userId = await getUserId();
    const parsed = goalSchema.parse(data);

    await domain.updateGoal(userId, id, parsed);

    revalidatePath("/");
    revalidatePath("/goals");

    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized")
      return { success: false, error: "Unauthorized" };
    if (error.message === "Goal not found or unauthorized")
      return { success: false, error: "Goal not found or unauthorized" };
    return { success: false, error: "Failed to update financial goal" };
  }
}

export async function deleteGoal(id: string) {
  try {
    const userId = await getUserId();

    await domain.deleteGoal(userId, id);

    revalidatePath("/");
    revalidatePath("/goals");

    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized")
      return { success: false, error: "Unauthorized" };
    if (error.message === "Goal not found or unauthorized")
      return { success: false, error: "Goal not found or unauthorized" };
    return { success: false, error: "Failed to delete financial goal" };
  }
}
