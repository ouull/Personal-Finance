import { NextResponse } from "next/server"
import { verifyApiAuth } from "@/lib/api/auth"
import * as domain from "@/lib/domain/investments"
import { z } from "zod"

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const { user, response } = await verifyApiAuth(req)
  if (response) return response

  try {
    const investment = await domain.getInvestmentById(user.id, params.id)
    return NextResponse.json({ success: true, data: investment })
  } catch (error: any) {
    if (error.message === "Unauthorized investment") {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ success: false, error: "Failed to fetch investment" }, { status: 500 })
  }
}

const updateValueSchema = z.object({
  currentValue: z.number().nonnegative()
})

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const { user, response } = await verifyApiAuth(req)
  if (response) return response

  try {
    const body = await req.json()
    const parsed = updateValueSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed", 
        details: parsed.error.format() 
      }, { status: 400 })
    }

    const updated = await domain.updateInvestmentValue(user.id, params.id, parsed.data.currentValue)
    
    const serialized = {
      ...updated,
      totalInvested: Number(updated.totalInvested),
      currentValue: Number(updated.currentValue),
      unrealizedGain: Number(updated.currentValue) - Number(updated.totalInvested),
      realizedGain: Number(updated.realizedGain),
    }

    return NextResponse.json({ success: true, data: serialized })
  } catch (error: any) {
    if (error.message === "Unauthorized investment") {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ success: false, error: "Failed to update investment" }, { status: 500 })
  }
}
