"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { accountSchema, AccountFormValues } from "@/shared/schemas/accounts"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as domain from "@/lib/domain/accounts"

async function getUserId() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  return session.user.id
}

export async function getAccounts(includeInactive = false) {
  try {
    const userId = await getUserId()
    const serializedAccounts = await domain.getAccounts(userId, includeInactive)
    return { success: true, data: serializedAccounts }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    return { success: false, error: "Failed to fetch accounts data" }
  }
}

export async function createAccount(data: AccountFormValues) {
  try {
    const userId = await getUserId()
    const parsed = accountSchema.parse(data)
    
    await domain.createAccount(userId, parsed)
    
    revalidatePath("/accounts")
    revalidatePath("/")
    
    return { success: true }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    if (error instanceof domain.AccountError) {
      return { success: false, error: error.message } // Use raw error message like "cash_creation_forbidden" for i18n
    }
    console.error("Create account error:", error)
    return { success: false, error: "Failed to create account" }
  }
}

export async function deleteAccount(id: string) {
  try {
    const userId = await getUserId()
    
    const result = await domain.deleteAccount(userId, id)
    
    revalidatePath("/accounts")
    revalidatePath("/")
    
    return { success: true, archived: result.archived }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    if (error instanceof domain.AccountError) {
      return { success: false, error: error.message }
    }
    console.error("Delete account error:", error)
    return { success: false, error: "Failed to delete account" }
  }
}

export async function updateAccount(id: string, data: { name: string, type: "BANK" | "E_WALLET" | "CASH" | "INVESTMENT" | "LOAN" }) {
  try {
    const userId = await getUserId()
    
    await domain.updateAccount(userId, id, data)
    
    revalidatePath("/accounts")
    revalidatePath("/")
    
    return { success: true }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    if (error instanceof domain.AccountError) {
      return { success: false, error: error.message }
    }
    console.error("Update account error:", error)
    return { success: false, error: "Failed to update account" }
  }
}
