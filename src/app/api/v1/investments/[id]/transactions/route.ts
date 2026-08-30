import { NextResponse } from "next/server"
import { verifyApiAuth } from "@/lib/api/auth"
import * as domain from "@/lib/domain/investments"
import { z } from "zod"

const addTransactionSchema = z.object({
  accountId: z.string().optional(),
  type: z.enum(["BUY", "SELL", "DEPOSIT", "WITHDRAW", "DIVIDEND", "INTEREST", "FEE"]),
  amount: z.number().positive(),
  date: z.string().optional(), // ISO string
  notes: z.string().optional()
})

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const { user, response } = await verifyApiAuth(req)
  if (response) return response

  try {
    const body = await req.json()
    const parsed = addTransactionSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed", 
        details: parsed.error.format() 
      }, { status: 400 })
    }

    const { accountId, type, amount, date, notes } = parsed.data

    const transaction = await domain.addInvestmentTransaction(user.id, {
      investmentId: params.id,
      accountId,
      type,
      amount,
      date: date ? new Date(date) : new Date(),
      notes
    })
    
    const serialized = {
      ...transaction,
      amount: Number(transaction.amount)
    }

    return NextResponse.json({ success: true, data: serialized }, { status: 201 })
  } catch (error: any) {
    if (error.message === "Unauthorized investment" || error.message === "Unauthorized account") {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 })
    }
    if (error.message === "Insufficient account balance" || error.message === "Insufficient investment cash balance" || error.message === "Cannot sell more than current value") {
      return NextResponse.json({ success: false, error: { code: "INSUFFICIENT_BALANCE", message: error.message } }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: "Failed to add investment transaction" }, { status: 500 })
  }
}
