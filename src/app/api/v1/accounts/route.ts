import { NextResponse } from "next/server"
import { verifyApiAuth } from "@/lib/api/auth"
import * as domain from "@/lib/domain/accounts"
import { accountSchema } from "@/shared/schemas/accounts"

export async function GET(req: Request) {
  const { user, response } = await verifyApiAuth(req)
  if (response) return response

  try {
    const accounts = await domain.getAccounts(user.id)
    return NextResponse.json({ success: true, data: accounts })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch accounts" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { user, response } = await verifyApiAuth(req)
  if (response) return response

  try {
    const body = await req.json()
    const parsed = accountSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed", 
        details: parsed.error.format() 
      }, { status: 400 })
    }

    const account = await domain.createAccount(user.id, parsed.data)
    return NextResponse.json({ success: true, data: account }, { status: 201 })
  } catch (error: any) {
    console.error("CREATE ACCOUNT ERROR:", error);
    return NextResponse.json({ success: false, error: "Failed to create account" }, { status: 500 })
  }
}
