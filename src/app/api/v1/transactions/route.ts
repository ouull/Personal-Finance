import { NextResponse } from "next/server"
import { verifyApiAuth } from "@/lib/api/auth"
import * as domain from "@/lib/domain/transactions"
import { transactionSchema } from "@/shared/schemas/transactions"

export async function GET(req: Request) {
  const { user, response } = await verifyApiAuth(req)
  if (response) return response

  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const offset = parseInt(searchParams.get("offset") || "0", 10)
    const type = searchParams.get("type") || undefined

    const transactions = await domain.getTransactions(user.id, limit, offset, type)
    
    // serialize Decimal to number
    const serialized = transactions.map((t: any) => ({
      ...t,
      amount: Number(t.amount)
    }))
    
    return NextResponse.json({ success: true, data: serialized })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch transactions" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { user, response } = await verifyApiAuth(req)
  if (response) return response

  try {
    const body = await req.json()
    const parsed = transactionSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed", 
        details: parsed.error.format() 
      }, { status: 400 })
    }

    const transaction = await domain.createTransaction(user.id, parsed.data)
    
    const serialized = {
      ...transaction,
      amount: Number(transaction.amount)
    }

    return NextResponse.json({ success: true, data: serialized }, { status: 201 })
  } catch (error: any) {
    if (error.name === "TransactionError") {
       return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: "Failed to create transaction" }, { status: 500 })
  }
}
