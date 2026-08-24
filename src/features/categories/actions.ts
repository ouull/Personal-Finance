"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as domain from "@/lib/domain/categories"
import { revalidatePath } from "next/cache"

async function getUserId() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  return session.user.id
}

export async function getCategories(type?: "INCOME" | "EXPENSE", includeInactive = false) {
  try {
    const userId = await getUserId()
    const categories = await domain.getCategories(userId, type, includeInactive)
    return { success: true, data: categories }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    return { success: false, error: "Failed to fetch categories" }
  }
}

export async function createCategory(data: { name: string, type: "INCOME" | "EXPENSE", icon?: string, color?: string }) {
  try {
    const userId = await getUserId()
    await domain.createCategory(userId, data)
    revalidatePath("/categories")
    revalidatePath("/")
    revalidatePath("/transactions")
    return { success: true }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    console.error("Create category error:", error)
    return { success: false, error: "Failed to create category" }
  }
}

export async function updateCategory(id: string, data: { name: string, type?: "INCOME" | "EXPENSE", icon?: string, color?: string }) {
  try {
    const userId = await getUserId()
    await domain.updateCategory(userId, id, data)
    revalidatePath("/categories")
    revalidatePath("/")
    revalidatePath("/transactions")
    return { success: true }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    if (error instanceof domain.CategoryError) {
      return { success: false, error: error.message }
    }
    console.error("Update category error:", error)
    return { success: false, error: "Failed to update category" }
  }
}

export async function deleteCategory(id: string) {
  try {
    const userId = await getUserId()
    const result = await domain.deleteCategory(userId, id)
    revalidatePath("/categories")
    revalidatePath("/")
    revalidatePath("/transactions")
    return { success: true, archived: result.archived }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    if (error instanceof domain.CategoryError) {
      return { success: false, error: error.message }
    }
    console.error("Delete category error:", error)
    return { success: false, error: "Failed to delete category" }
  }
}

export async function getFrequentCategories(limit = 4) {
  try {
    const userId = await getUserId()
    
    // Find categories with the most transactions for this user
    const frequent = await db.category.findMany({
      where: { userId, type: "EXPENSE", isActive: true },
      include: {
        _count: {
          select: { transactions: true }
        }
      },
      orderBy: {
        transactions: {
          _count: 'desc'
        }
      },
      take: limit
    })
    
    // If we don't have enough history, return fallback defaults
    if (frequent.length === 0 || frequent[0]._count.transactions === 0) {
      // Fallback: look for common slugs
      const fallbacks = await db.category.findMany({
        where: { 
          userId, 
          slug: { in: ["food", "beverage", "fuel"] },
          isActive: true
        },
        take: limit
      })
      return { success: true, data: fallbacks }
    }

    return { success: true, data: frequent }
  } catch (error: any) {
    return { success: false, error: "Failed to fetch frequent categories" }
  }
}
