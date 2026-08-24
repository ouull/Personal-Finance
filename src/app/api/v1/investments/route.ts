import { NextResponse } from "next/server"
import { verifyApiAuth } from "@/lib/api/auth"
import * as domain from "@/lib/domain/investments"
import { investmentSchema } from "@/shared/schemas/investments"

export async function GET(req: Request) {
  const { user, response } = await verifyApiAuth(req)
  if (response) return response

  try {
    const investments = await domain.getInvestments(user.id)
    const summary = investments.reduce((acc, curr) => ({
      totalInvested: acc.totalInvested + curr.totalInvested,
      currentValue: acc.currentValue + curr.currentValue,
      realizedGain: acc.realizedGain + curr.realizedGain,
      unrealizedGain: acc.unrealizedGain + curr.unrealizedGain
    }), { totalInvested: 0, currentValue: 0, realizedGain: 0, unrealizedGain: 0 });
    
    return NextResponse.json({ success: true, data: { items: investments, summary } })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch investments" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { user, response } = await verifyApiAuth(req)
  if (response) return response

  try {
    const body = await req.json()
    const parsed = investmentSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed", 
        details: parsed.error.format() 
      }, { status: 400 })
    }

    const { name, type, platform, notes } = parsed.data

    const investment = await domain.createInvestment(user.id, {
      name,
      type,
      platform,
      notes
    })
    
    const serialized = {
      ...investment,
      totalInvested: Number(investment.totalInvested),
      currentValue: Number(investment.currentValue),
      unrealizedGain: Number(investment.currentValue) - Number(investment.totalInvested),
      realizedGain: Number(investment.realizedGain),
    }

    return NextResponse.json({ success: true, data: serialized }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to create investment" }, { status: 500 })
  }
}
