import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function POST(request: Request) {
  try {
    // 1. Verifikasi API Key
    const apiKey = request.headers.get("x-api-key")
    const validApiKey = process.env.QUICK_CAPTURE_API_KEY || "dev-secret-key"
    
    if (!apiKey || apiKey !== validApiKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Parse Body Request
    const body = await request.json()
    const { type, amount, description, sourceAccountId, destinationAccountId, categoryId } = body

    if (!type || !amount) {
      return NextResponse.json({ error: "Tipe transaksi dan nominal wajib diisi" }, { status: 400 })
    }

    const transactionAmount = Number(amount)

    // 3. Simpan Transaksi dengan Prisma Transaction
    const transaction = await db.$transaction(async (tx: any) => {
      // Buat record transaksi
      const newTx = await tx.transaction.create({
        data: {
          type,
          amount: transactionAmount,
          date: new Date(),
          description: description || "Quick Capture",
          sourceAccountId,
          destinationAccountId,
          categoryId
        }
      })

      // Update saldo akun
      if (type === "INCOME" && destinationAccountId) {
        await tx.account.update({
          where: { id: destinationAccountId },
          data: { balance: { increment: transactionAmount } }
        })
      } else if (type === "EXPENSE" && sourceAccountId) {
        await tx.account.update({
          where: { id: sourceAccountId },
          data: { balance: { decrement: transactionAmount } }
        })
      } else if (type === "TRANSFER" && sourceAccountId && destinationAccountId) {
        await tx.account.update({
          where: { id: sourceAccountId },
          data: { balance: { decrement: transactionAmount } }
        })
        await tx.account.update({
          where: { id: destinationAccountId },
          data: { balance: { increment: transactionAmount } }
        })
      }

      return newTx
    })

    revalidatePath("/")
    revalidatePath("/transactions")
    
    return NextResponse.json({ success: true, data: transaction })
  } catch (error) {
    console.error("Quick Capture Error:", error)
    return NextResponse.json({ error: "Gagal memproses transaksi" }, { status: 500 })
  }
}
