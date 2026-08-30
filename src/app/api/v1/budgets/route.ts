import { NextResponse } from "next/server"
import { verifyApiAuth } from "@/lib/api/auth"
import * as domain from "@/lib/domain/budgets"
import { budgetSchema } from "@/shared/schemas/budgets"

export async function GET(req: Request) {
  const { user, response } = await verifyApiAuth(req)
  if (response) return response

  try {
    const { searchParams } = new URL(req.url)
    const monthStr = searchParams.get("month")
    const yearStr = searchParams.get("year")
    
    const now = new Date()
    const month = monthStr ? parseInt(monthStr, 10) : (now.getMonth() + 1)
    const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear()

    const budgets = await domain.getBudgets(user.id, month, year)
    return NextResponse.json({ success: true, data: budgets })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch budgets" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { user, response } = await verifyApiAuth(req)
  if (response) return response

  try {
    const body = await req.json()
    const parsed = budgetSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed", 
        details: parsed.error.format() 
      }, { status: 400 })
    }

    const budget = await domain.setBudget(user.id, parsed.data)
    
    const serialized = {
      ...budget,
      amount: Number(budget.amount),
    }

    return NextResponse.json({ success: true, data: serialized }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to save budget" }, { status: 500 })
  }
}
