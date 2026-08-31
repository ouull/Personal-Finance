import { NextResponse } from "next/server"
import { verifyApiAuth } from "@/lib/api/auth"
import * as domain from "@/lib/domain/recurring"

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const { user, response } = await verifyApiAuth(req)
  if (response) return response

  try {
    const transaction = await domain.processRecurringPayment(user.id, params.id)
    
    const serialized = {
      ...transaction,
      amount: Number(transaction.amount)
    }

    return NextResponse.json({ success: true, data: serialized }, { status: 201 })
  } catch (error: any) {
    if (error.message === "Unauthorized payment") {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    }
    if (error.message === "Already processed or modified concurrently") {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 })
    }
    if (error.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json({ success: false, error: "Saldo tidak mencukupi" }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: "Failed to process recurring payment" }, { status: 500 })
  }
}
