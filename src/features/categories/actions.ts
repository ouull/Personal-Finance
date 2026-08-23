"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { seedUserFinancialData } from "@/lib/seed"

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
    
    // Lazy initialization for users created before seed logic or with incomplete seeds
    const defaultCount = await db.category.count({ where: { userId, isDefault: true } })
    if (defaultCount < 52) {
      await seedUserFinancialData(userId)
    }

    const categories = await db.category.findMany({
      where: { 
        userId,
        ...(type ? { type } : {}),
        ...(!includeInactive ? { isActive: true } : {})
      },
      orderBy: { name: "asc" }
    })
    return { success: true, data: categories }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    return { success: false, error: "Failed to fetch categories" }
  }
}

export async function createCategory(data: { name: string, type: "INCOME" | "EXPENSE", icon?: string, color?: string }) {
  try {
    const userId = await getUserId()
    
    const category = await db.category.create({
      data: {
        userId,
        name: data.name,
        type: data.type,
        icon: data.icon,
        color: data.color,
        isActive: true,
        isDefault: false
      }
    })
    return { success: true, data: category }
  } catch (error: any) {
    if (error.message === "Unauthorized") return { success: false, error: "Unauthorized" }
    return { success: false, error: "Failed to create category" }
  }
}

export async function updateCategory(id: string, data: { name: string, icon?: string, color?: string }) {
  try {
    const userId = await getUserId()
    
    const category = await db.category.findUnique({ where: { id } })
    if (!category || category.userId !== userId) {
      return { success: false, error: "Category not found or unauthorized" }
    }

    const updated = await db.category.update({
      where: { id },
      data: {
        name: data.name,
        icon: data.icon,
        color: data.color
      }
    })
    return { success: true, data: updated }
  } catch (error: any) {
    return { success: false, error: "Failed to update category" }
  }
}

export async function deleteCategory(id: string) {
  try {
    const userId = await getUserId()
    
    const category = await db.category.findUnique({ 
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
            budgets: true,
            recurringPayments: true
          }
        }
      }
    })
    
    if (!category || category.userId !== userId) {
      return { success: false, error: "Category not found or unauthorized" }
    }

    if (category.isDefault) {
      await db.category.update({
        where: { id },
        data: { isActive: false }
      })
      return { success: true, archived: true }
    }

    const hasHistory = 
      category._count.transactions > 0 ||
      category._count.budgets > 0 ||
      category._count.recurringPayments > 0

    if (hasHistory) {
      // Archive
      await db.category.update({
        where: { id },
        data: { isActive: false }
      })
    } else {
      // Hard delete
      await db.category.delete({ where: { id } })
    }
    
    return { success: true, archived: hasHistory }
  } catch (error: any) {
    return { success: false, error: "Failed to delete or archive category." }
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
