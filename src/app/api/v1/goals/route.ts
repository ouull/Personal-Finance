import { NextResponse } from "next/server"
import { verifyApiAuth } from "@/lib/api/auth"
import * as domain from "@/lib/domain/goals"
import { goalSchema } from "@/shared/schemas/goals"

export async function GET(req: Request) {
  const { user, response } = await verifyApiAuth(req)
  if (response) return response

  try {
    const goals = await domain.getGoals(user.id)
    return NextResponse.json({ success: true, data: goals })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch goals" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { user, response } = await verifyApiAuth(req)
  if (response) return response

  try {
    const body = await req.json()
    const parsed = goalSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed", 
        details: parsed.error.format() 
      }, { status: 400 })
    }

    const goal = await domain.createGoal(user.id, parsed.data)
    
    const serialized = {
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount)
    }

    return NextResponse.json({ success: true, data: serialized }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to create goal" }, { status: 500 })
  }
}
