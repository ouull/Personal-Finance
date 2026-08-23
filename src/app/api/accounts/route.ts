import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accounts = await db.account.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        type: true
      }
    })

    return NextResponse.json({ success: true, data: accounts })
  } catch {
    return NextResponse.json({ error: "Gagal mengambil daftar akun" }, { status: 500 })
  }
}
