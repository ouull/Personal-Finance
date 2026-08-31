import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const body = await request.json()
    const { type, amount, description, sourceAccountId, destinationAccountId, categoryId, merchantName } = body

    if (!type || !amount) {
      return NextResponse.json({ error: "Tipe transaksi dan nominal wajib diisi" }, { status: 400 })
    }

    const transactionAmount = Number(amount)

    const transaction = await db.$transaction(async (tx: any) => {
      // Validate accounts belong to user
      if (sourceAccountId) {
        const acc = await tx.account.findUnique({ where: { id: sourceAccountId } })
        if (!acc || acc.userId !== userId) throw new Error("Unauthorized account")
      }
      if (destinationAccountId) {
        const acc = await tx.account.findUnique({ where: { id: destinationAccountId } })
        if (!acc || acc.userId !== userId) throw new Error("Unauthorized account")
      }

      let finalMerchantId = undefined
      
      if (merchantName && merchantName.trim() !== "") {
        const merchantSearchName = merchantName.trim()
        
        // Try to find existing merchant
        const existingMerchant = await tx.merchant.findFirst({
          where: {
            userId,
            name: {
              equals: merchantSearchName,
              mode: 'insensitive'
            }
          }
        })
        
        if (existingMerchant) {
          finalMerchantId = existingMerchant.id
        } else {
          // Create new merchant
          const newMerchant = await tx.merchant.create({
            data: {
              userId,
              name: merchantSearchName,
              defaultCategoryId: categoryId || undefined
            }
          })
          finalMerchantId = newMerchant.id
        }
      }

      const newTx = await tx.transaction.create({
        data: {
          userId,
          type,
          amount: transactionAmount,
          date: new Date(),
          description: description || "Quick Capture",
          sourceAccountId,
          destinationAccountId,
          categoryId,
          merchantId: finalMerchantId
        }
      })

      if (type === "INCOME" && destinationAccountId) {
        await tx.account.update({
          where: { id: destinationAccountId },
          data: { balance: { increment: transactionAmount } }
        })
      } else if (type === "EXPENSE" && sourceAccountId) {
        const sourceAcc = await tx.account.findUnique({ where: { id: sourceAccountId } })
        if (!sourceAcc || Number(sourceAcc.balance) < transactionAmount) {
          throw new Error("INSUFFICIENT_BALANCE")
        }
        await tx.account.update({
          where: { id: sourceAccountId },
          data: { balance: { decrement: transactionAmount } }
        })
      } else if (type === "TRANSFER" && sourceAccountId && destinationAccountId) {
        const sourceAcc = await tx.account.findUnique({ where: { id: sourceAccountId } })
        if (!sourceAcc || Number(sourceAcc.balance) < transactionAmount) {
          throw new Error("INSUFFICIENT_BALANCE")
        }
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
  } catch (error: any) {
    if (error.message === "Unauthorized account") {
      return NextResponse.json({ error: "Unauthorized account access" }, { status: 403 })
    }
    if (error.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json({ error: "Saldo tidak mencukupi" }, { status: 400 })
    }
    console.error("Quick Capture Error:", error)
    return NextResponse.json({ error: "Gagal memproses transaksi" }, { status: 500 })
  }
}
