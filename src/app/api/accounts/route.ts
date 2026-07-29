import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const accounts = await db.account.findMany({
      select: {
        id: true,
        name: true,
        type: true
      }
    })

    return NextResponse.json({ success: true, data: accounts })
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil daftar akun" }, { status: 500 })
  }
}
