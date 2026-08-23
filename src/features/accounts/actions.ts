"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { accountSchema, AccountFormValues } from "./schema"

export async function getAccounts() {
  try {
    const accounts = await db.account.findMany({
      orderBy: { createdAt: "desc" },
    })
    
    // Convert Decimal to Number to prevent Next.js serialization error
    const serializedAccounts = accounts.map((acc: any) => ({
      ...acc,
      balance: Number(acc.balance)
    }))
    
    return { success: true, data: serializedAccounts }
  } catch (error) {
    return { success: false, error: "Failed to fetch accounts data" }
  }
}

export async function createAccount(data: AccountFormValues) {
  try {
    const parsed = accountSchema.parse(data)
    
    await db.account.create({
      data: {
        name: parsed.name,
        type: parsed.type,
        balance: parsed.balance,
        currency: parsed.currency,
      },
    })
    
    revalidatePath("/accounts")
    revalidatePath("/")
    
    return { success: true }
  } catch (error) {
    console.error("Create account error:", error)
    return { success: false, error: "Failed to create account" }
  }
}

export async function deleteAccount(id: string) {
  try {
    // Memastikan akun tidak memiliki transaksi sebelum dihapus (di masa depan)
    await db.account.delete({
      where: { id },
    })
    
    revalidatePath("/accounts")
    revalidatePath("/")
    
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete account. Ensure there are no related transactions." }
  }
}
